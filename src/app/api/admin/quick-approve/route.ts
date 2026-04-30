import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail } from "@/lib/email";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { validateAdminAuth } from "@/lib/admin-session";

function getSigningKey(): string {
  const key = process.env.ADMIN_SECRET_KEY;
  if (!key) throw new Error("ADMIN_SECRET_KEY environment variable is required");
  return key;
}

/** Verify HMAC token (timing-safe). */
function verifyApproveToken(memberId: string, token: string): boolean {
  let providedBuf: Buffer;
  try {
    providedBuf = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  const expected = createHmac("sha256", getSigningKey())
    .update(`quick-approve:${memberId}`)
    .digest();
  if (providedBuf.length !== expected.length) return false;
  return timingSafeEqual(providedBuf, expected);
}

/**
 * GET /api/admin/quick-approve — deprecated. The old form took id+token in
 * the query string and approved on GET, which: (1) leaks the HMAC token to
 * server logs and email-client prefetchers, (2) violated CSRF/idempotency
 * by mutating on GET. Replaced by /admin/quick-approve confirmation page +
 * POST /api/admin/quick-approve.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Volvé a abrir el link desde el email." },
    { status: 410, headers: getSecurityHeaders() },
  );
}

/**
 * POST /api/admin/quick-approve — approve a member identified by id + HMAC.
 *
 * Defense-in-depth: requires BOTH the HMAC token in the body (proves the
 * email link is genuine) AND a valid MFA admin session (proves an
 * authenticated admin clicked the confirm button on /admin/quick-approve).
 * Either alone is insufficient.
 *
 * Token comes from the request body, not the URL. Idempotent: returns
 * already_approved=true if member is already approved.
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  // Layer 1: admin must be logged in.
  if (!validateAdminAuth(req.headers)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: securityHeaders });
  }

  let body: { id?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400, headers: securityHeaders });
  }

  const memberId = body.id;
  const token = body.token;

  if (!memberId || !token || typeof memberId !== "string" || typeof token !== "string") {
    return NextResponse.json({ error: "id y token son obligatorios" }, { status: 400, headers: securityHeaders });
  }

  // Layer 2: HMAC token from the email link must be valid.
  if (!verifyApproveToken(memberId, token)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401, headers: securityHeaders });
  }

  const supabase = getSupabaseAdmin();

  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404, headers: securityHeaders });
  }

  if (member.status === "approved") {
    return NextResponse.json(
      {
        success: true,
        already_approved: true,
        member_number: member.member_number,
        message: `${member.full_name} ya está aprobado como ${member.member_number}.`,
      },
      { headers: securityHeaders },
    );
  }

  if (member.status !== "pending") {
    return NextResponse.json(
      { error: `Solo se pueden aprobar miembros pendientes (estado actual: "${member.status}").` },
      { status: 409, headers: securityHeaders },
    );
  }

  // Generate member number with retry for race conditions (REC-1: max 3 attempts)
  const credentialToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  let memberNumber = "";
  let approveSuccess = false;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: lastMember } = await supabase
      .from("members")
      .select("member_number")
      .not("member_number", "is", null)
      .order("member_number", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastMember?.member_number) {
      const match = lastMember.member_number.match(/CSC-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }
    memberNumber = `CSC-${String(nextNumber).padStart(4, "0")}`;

    const { error: updateError } = await supabase
      .from("members")
      .update({
        status: "approved",
        member_number: memberNumber,
        credential_token: credentialToken,
        credential_token_expires_at: expiresAt,
      })
      .eq("id", memberId);

    if (!updateError) {
      approveSuccess = true;
      break;
    }

    if (updateError.code === "23505" && attempt < maxAttempts - 1) {
      console.warn(`[quick-approve] member_number collision (${memberNumber}), retrying...`);
      continue;
    }

    break;
  }

  if (!approveSuccess) {
    return NextResponse.json(
      { error: "No se pudo aprobar al miembro. Intentá desde el panel de admin." },
      { status: 500, headers: securityHeaders },
    );
  }

  // Send approval email in background
  after(async () => {
    try {
      await sendApprovalEmail(member.email, member.full_name, memberNumber, credentialToken, member.first_name);
      await supabase
        .from("members")
        .update({ credential_email_sent_at: new Date().toISOString() })
        .eq("id", memberId);
    } catch (emailError) {
      console.error("[quick-approve] Failed to send approval email — memberId:", memberId, "error:", emailError instanceof Error ? emailError.message : String(emailError));
    }
  });

  return NextResponse.json(
    {
      success: true,
      already_approved: false,
      member_number: memberNumber,
      message: `${member.full_name} fue aprobado como ${memberNumber}. Se le envió el email con su credencial.`,
    },
    { headers: securityHeaders },
  );
}
