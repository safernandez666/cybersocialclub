import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { JwtError, verifyClaimJwt } from "@/lib/jwt";

/**
 * POST /api/auth/claim/complete — Complete account claim: set password + create auth user.
 * Rate limited: 5/15min per IP (middleware.ts).
 *
 * Token is a JWT (HS256) carried in the URL fragment of the email link.
 * The DB row's `jti` is what gives us single-use semantics — once we mark
 * `claimed_at`, the same JWT can't redeem twice.
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

  if (!token || typeof token !== "string") {
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

  let payload;
  try {
    payload = verifyClaimJwt(token);
  } catch (err) {
    if (!(err instanceof JwtError)) {
      console.error("[auth/claim/complete] Unexpected JWT error:", err instanceof Error ? err.message : String(err));
    }
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: matchedClaim } = await supabaseAdmin
    .from("account_claims")
    .select("id, member_id, email, expires_at, claimed_at")
    .eq("jti", payload.jti)
    .single();

  if (!matchedClaim) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  if (matchedClaim.claimed_at) {
    return NextResponse.json(
      { error: "Este link ya fue usado." },
      { status: 400, headers: securityHeaders }
    );
  }

  if (new Date(matchedClaim.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  // Atomically claim the row first (single-use guard against concurrent retries).
  const { data: claimedRow, error: claimErr } = await supabaseAdmin
    .from("account_claims")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", matchedClaim.id)
    .is("claimed_at", null)
    .select("id")
    .single();

  if (claimErr || !claimedRow) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400, headers: securityHeaders }
    );
  }

  // From here, we own the claim. If anything below fails we revert claimed_at
  // so the user can retry.
  const revertClaim = async () => {
    await supabaseAdmin
      .from("account_claims")
      .update({ claimed_at: null })
      .eq("id", matchedClaim.id);
  };

  // Check if member already has an auth account (e.g. Google/LinkedIn login)
  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("id, auth_provider_id, email")
    .eq("id", matchedClaim.member_id)
    .single();

  console.log("[auth/claim/complete] Member lookup:", member?.id, "auth_provider_id:", member?.auth_provider_id, "error:", memberError?.message);

  if (!member) {
    console.error("[auth/claim/complete] Member not found for claim:", matchedClaim.member_id);
    await revertClaim();
    return NextResponse.json(
      { error: "Miembro no encontrado. Contactá a info@cybersocialclub.com.ar" },
      { status: 404, headers: securityHeaders }
    );
  }

  let authUserId: string;

  if (member.auth_provider_id) {
    // Existing auth user (social login) — add password to their account
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      member.auth_provider_id,
      { password, email_confirm: true }
    );

    if (updateAuthError) {
      console.error("[auth/claim/complete] Update auth user error:", updateAuthError.message);
      await revertClaim();
      return NextResponse.json(
        { error: "Error al configurar la contraseña. Intentá de nuevo." },
        { status: 500, headers: securityHeaders }
      );
    }

    authUserId = member.auth_provider_id;
  } else {
    // No auth user — create one
    const { data: authUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: matchedClaim.email,
        password,
        email_confirm: true,
      });

    if (createError) {
      console.error("[auth/claim/complete] Create user error:", createError.message);
      await revertClaim();
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

    authUserId = authUser.user.id;
  }

  // Link auth user to member record (update provider to email since they now have a password)
  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({
      auth_provider_id: authUserId,
      auth_provider: "email",
      last_login_at: new Date().toISOString(),
    })
    .eq("id", matchedClaim.member_id);

  if (updateError) {
    console.error("[auth/claim/complete] Update member error:", updateError.message);
    if (!member?.auth_provider_id) {
      // Rollback: only delete auth user if we created it
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    await revertClaim();
    return NextResponse.json(
      { error: "Error al vincular la cuenta. Intentá de nuevo." },
      { status: 500, headers: securityHeaders }
    );
  }

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
