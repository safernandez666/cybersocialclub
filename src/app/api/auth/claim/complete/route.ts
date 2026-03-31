import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { timingSafeEqual } from "crypto";

/**
 * POST /api/auth/claim/complete — Complete account claim: set password + create auth user.
 * Rate limited: 5/15min per IP (middleware.ts).
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: securityHeaders }
    );
  }

  const { token, password } = body;

  if (!token || token.length !== 64) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Find valid claim with timing-safe comparison (REC-1)
  const { data: claims } = await supabaseAdmin
    .from("account_claims")
    .select("id, member_id, email, token, expires_at")
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString());

  if (!claims || claims.length === 0) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

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
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  // Create Supabase Auth user (email already verified — they're an approved member)
  const { data: authUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: matchedClaim.email,
      password,
      email_confirm: true,
    });

  if (createError) {
    console.error("[auth/claim/complete] Create user error:", createError.message);

    // Handle case where auth user already exists for this email
    if (createError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email. Intentá iniciar sesión." },
        { status: 409, headers: securityHeaders }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la cuenta. Intentá de nuevo." },
      { status: 500, headers: securityHeaders }
    );
  }

  // Link auth user to member record
  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({
      auth_provider_id: authUser.user.id,
      auth_provider: "email",
      last_login_at: new Date().toISOString(),
    })
    .eq("id", matchedClaim.member_id);

  if (updateError) {
    console.error("[auth/claim/complete] Update member error:", updateError.message);
    // Rollback: delete the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Error al vincular la cuenta. Intentá de nuevo." },
      { status: 500, headers: securityHeaders }
    );
  }

  // Mark claim as used
  await supabaseAdmin
    .from("account_claims")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", matchedClaim.id);

  // Auto-login: sign in with the new credentials
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({
    email: matchedClaim.email,
    password,
  });

  await logAuthEvent("account_claimed", matchedClaim.member_id, req);

  return NextResponse.json(
    { redirect: "/my-profile" },
    { headers: securityHeaders }
  );
}

async function logAuthEvent(
  eventType: string,
  memberId: string | null,
  req: NextRequest
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
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[auth/claim/complete] Audit log error:", err);
  }
}
