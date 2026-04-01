import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { randomBytes } from "crypto";
import { sendClaimAccountEmail } from "@/lib/email";

const CLAIM_EXPIRY_HOURS = 24;
const MAX_ACTIVE_CLAIMS = 3;

// Generic response — never reveal if email exists (prevent account enumeration)
const GENERIC_RESPONSE = {
  message: "Si este email está registrado, recibirás un link para activar tu cuenta",
};

/**
 * POST /api/auth/claim — Request account claim for existing members.
 * Rate limited: 3/15min per IP (middleware.ts).
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: securityHeaders }
    );
  }

  const email = body.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      { error: "Email es obligatorio" },
      { status: 400, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Lookup: approved member (with or without auth account — social login users need passwords too)
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, full_name, first_name, email, auth_provider_id")
    .eq("email", email)
    .eq("status", "approved")
    .single();

  if (!member) {
    // Don't reveal whether email exists — always return generic response
    await logAuthEvent("claim_requested_not_found", null, req, { email });
    return NextResponse.json(GENERIC_RESPONSE, { headers: securityHeaders });
  }

  // Check active claims limit (REC-3: prevent email spam)
  const { data: activeClaims } = await supabaseAdmin
    .from("account_claims")
    .select("id")
    .eq("member_id", member.id)
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString());

  if (activeClaims && activeClaims.length >= MAX_ACTIVE_CLAIMS) {
    // Silently return generic response — don't reveal limit hit
    return NextResponse.json(GENERIC_RESPONSE, { headers: securityHeaders });
  }

  // Generate secure token (256 bits)
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + CLAIM_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Insert claim record
  const { error: insertError } = await supabaseAdmin
    .from("account_claims")
    .insert({
      member_id: member.id,
      email: member.email,
      token,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("[auth/claim] Insert error:", insertError.message);
    return NextResponse.json(GENERIC_RESPONSE, { headers: securityHeaders });
  }

  // Send claim email
  try {
    await sendClaimAccountEmail(member.email, member.full_name, token, member.first_name);
  } catch (emailError) {
    console.error("[auth/claim] Email send error:", emailError);
  }

  await logAuthEvent("claim_requested", member.id, req, { email });

  return NextResponse.json(GENERIC_RESPONSE, { headers: securityHeaders });
}

async function logAuthEvent(
  eventType: string,
  memberId: string | null,
  req: NextRequest,
  extra?: Record<string, string>
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "auth",
      event_subtype: eventType,
      member_id: memberId,
      provider: "claim",
      ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      metadata: extra ? JSON.stringify(extra) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[auth/claim] Audit log error:", err);
  }
}
