import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { JwtError, verifyClaimJwt } from "@/lib/jwt";

/**
 * GET /api/auth/claim/verify — deprecated. The old form took `?token=...`,
 * which leaks via referrers/logs. Replaced by POST + JWT-in-fragment.
 */
export async function GET() {
  return NextResponse.json(
    { valid: false, error: "Este flujo fue actualizado. Pediles a info@cybersocialclub.com.ar un nuevo link de activación." },
    { status: 410, headers: getSecurityHeaders() },
  );
}

/**
 * POST /api/auth/claim/verify — Verify a claim JWT before showing the
 * password form. Returns the masked email so the page can display it.
 * Rate limited: 5/15min per IP (middleware.ts).
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders },
    );
  }

  const token = body.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders },
    );
  }

  let payload;
  try {
    payload = verifyClaimJwt(token);
  } catch (err) {
    if (!(err instanceof JwtError)) {
      // Log only the message string — the raw error may carry caller-supplied
      // input on certain runtimes. Never log the full request or token.
      console.error("[auth/claim/verify] Unexpected error:", err instanceof Error ? err.message : String(err));
    }
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders },
    );
  }

  // Confirm jti exists, hasn't been used, and hasn't expired in the DB row.
  const supabaseAdmin = getSupabaseAdmin();
  const { data: claim } = await supabaseAdmin
    .from("account_claims")
    .select("id, email, expires_at, claimed_at")
    .eq("jti", payload.jti)
    .single();

  if (!claim) {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders },
    );
  }

  if (claim.claimed_at) {
    return NextResponse.json(
      { valid: false, error: "Este link ya fue usado." },
      { status: 400, headers: securityHeaders },
    );
  }

  if (new Date(claim.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders },
    );
  }

  // Partially mask email for display
  const [localPart, domain] = claim.email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? localPart[0] + "***"
      : localPart[0] + "***" + localPart[localPart.length - 1];
  const maskedEmail = `${maskedLocal}@${domain}`;

  return NextResponse.json(
    { valid: true, email: maskedEmail },
    { headers: securityHeaders },
  );
}
