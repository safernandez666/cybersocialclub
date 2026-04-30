import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendAdminNotification } from "@/lib/email";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { consumeRateLimit } from "@/lib/verify-rate-limit";

const MAX_ATTEMPTS_PER_ROW = 5;
const PER_EMAIL_WINDOW_MS = 15 * 60 * 1000;
const PER_EMAIL_MAX = 5;

const CODE_REGEX = /^\d{6}$/;

/**
 * GET /api/verify-email — deprecated. The old flow used `?token=...` in URLs,
 * which leaks via referrers, browser history, and access logs (SEC-HIGH).
 * Replaced by POST + 6-digit code typed on /verify-email page.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Pediles a info@cybersocialclub.com.ar un nuevo email de verificación." },
    { status: 410, headers: getSecurityHeaders() },
  );
}

/**
 * POST /api/verify-email — verifies a member by email + 6-digit code.
 * Rate-limited two ways: per-IP (middleware: 10/15min) and per-email (here: 5/15min).
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400, headers: securityHeaders });
  }

  const email = body.email?.toLowerCase().trim();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email y código son obligatorios" }, { status: 400, headers: securityHeaders });
  }

  if (!CODE_REGEX.test(code)) {
    return NextResponse.json({ error: "El código debe ser de 6 dígitos" }, { status: 400, headers: securityHeaders });
  }

  // Per-email rate limit (anti brute-force on a 6-digit code).
  const rl = consumeRateLimit("verify-email", email, PER_EMAIL_MAX, PER_EMAIL_WINDOW_MS);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá en 15 minutos." },
      { status: 429, headers: securityHeaders },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, email, company, job_title, role_type, status, verification_code, verification_code_attempts, verification_token_expires_at")
    .eq("email", email)
    .eq("status", "pending_verification")
    .single();

  if (!member || !member.verification_code) {
    return NextResponse.json(
      { error: "No encontramos una verificación pendiente para ese email." },
      { status: 404, headers: securityHeaders },
    );
  }

  if (member.verification_token_expires_at && new Date(member.verification_token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "El código expiró. Solicitá uno nuevo." },
      { status: 410, headers: securityHeaders },
    );
  }

  if ((member.verification_code_attempts ?? 0) >= MAX_ATTEMPTS_PER_ROW) {
    return NextResponse.json(
      { error: "El código fue invalidado por demasiados intentos. Solicitá uno nuevo." },
      { status: 410, headers: securityHeaders },
    );
  }

  if (member.verification_code !== code) {
    await supabase
      .from("members")
      .update({ verification_code_attempts: (member.verification_code_attempts ?? 0) + 1 })
      .eq("id", member.id);
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS_PER_ROW - ((member.verification_code_attempts ?? 0) + 1));
    return NextResponse.json(
      { error: "Código incorrecto", attempts_left: attemptsLeft },
      { status: 401, headers: securityHeaders },
    );
  }

  const { error: updateError } = await supabase
    .from("members")
    .update({
      status: "pending",
      verification_code: null,
      verification_token: null,
      verification_token_expires_at: null,
      verification_code_attempts: 0,
    })
    .eq("id", member.id);

  if (updateError) {
    console.error("[verify-email] Update error:", updateError.message);
    return NextResponse.json(
      { error: "Error al verificar el email" },
      { status: 500, headers: securityHeaders },
    );
  }

  // Notify admin (best-effort)
  try {
    await sendAdminNotification({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      company: member.company || "N/A",
      job_title: member.job_title || "N/A",
      role_type: member.role_type || "N/A",
    });
  } catch (emailError) {
    console.error("[verify-email] Failed to send admin notification:", emailError instanceof Error ? emailError.message : String(emailError));
  }

  return NextResponse.json({ success: true }, { headers: securityHeaders });
}
