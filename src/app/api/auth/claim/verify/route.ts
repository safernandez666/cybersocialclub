import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { timingSafeEqual } from "crypto";

/**
 * GET /api/auth/claim/verify?token=XXX — Verify a claim token is valid.
 * Rate limited: 5/15min per IP (middleware.ts).
 * Uses timing-safe comparison (REC-1 from security review).
 */
export async function GET(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token || token.length !== 64) {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Lookup all unclaimed, non-expired claims to do timing-safe comparison
  const { data: claims } = await supabaseAdmin
    .from("account_claims")
    .select("token, email, expires_at")
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString());

  if (!claims || claims.length === 0) {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  // REC-1: Timing-safe comparison to prevent timing attacks
  const matchedClaim = claims.find((claim) => {
    try {
      const storedBuffer = Buffer.from(claim.token, "hex");
      const providedBuffer = Buffer.from(token, "hex");
      if (storedBuffer.length !== providedBuffer.length) return false;
      return timingSafeEqual(storedBuffer, providedBuffer);
    } catch {
      return false;
    }
  });

  if (!matchedClaim) {
    return NextResponse.json(
      { valid: false, error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  // Partially mask email for display
  const [localPart, domain] = matchedClaim.email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? localPart[0] + "***"
      : localPart[0] + "***" + localPart[localPart.length - 1];
  const maskedEmail = `${maskedLocal}@${domain}`;

  return NextResponse.json(
    { valid: true, email: maskedEmail },
    { headers: securityHeaders }
  );
}
