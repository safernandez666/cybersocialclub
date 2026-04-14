import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";

/**
 * POST /api/auth/login — Email + password login via Supabase Auth.
 * Rate limited: 10/15min per IP (middleware.ts).
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: securityHeaders }
    );
  }

  const email = body.email?.toLowerCase().trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y password son obligatorios" },
      { status: 400, headers: securityHeaders }
    );
  }

  // Sign in via a fresh Supabase client (no cookies) to avoid stale refresh token errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If email not confirmed, check if member is approved and auto-confirm
  if (signInError?.message === "Email not confirmed") {
    const supabaseAdmin = getSupabaseAdmin();
    // Look up member by email to check if they're approved
    const { data: pendingMember } = await supabaseAdmin
      .from("members")
      .select("id, status, auth_provider_id")
      .eq("email", email)
      .eq("status", "approved")
      .single();

    if (pendingMember?.auth_provider_id) {
      // Member is approved — confirm their email and retry sign-in
      console.log("[auth/login] Auto-confirming email for approved member:", email);
      await supabaseAdmin.auth.admin.updateUserById(
        pendingMember.auth_provider_id,
        { email_confirm: true }
      );
      // Retry sign-in
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!retryError && retryData.user) {
        signInData = retryData;
        signInError = null;
      }
    }
  }

  if (signInError || !signInData.user) {
    console.error("[auth/login] STEP 1 FAILED - signInWithPassword:", signInError?.message, "code:", signInError?.status);
    await logAuthEvent("login_failed", null, "email", req, {
      email,
      reason: signInError?.message || "no user returned",
    });
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401, headers: securityHeaders }
    );
  }

  const user = signInData.user;
  console.log("[auth/login] STEP 1 OK - user:", user.id, "email:", user.email, "confirmed:", user.email_confirmed_at ? "yes" : "no");

  const supabaseAdmin = getSupabaseAdmin();
  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("id, status, auth_provider_id")
    .eq("auth_provider_id", user.id)
    .single();

  if (!member) {
    console.error("[auth/login] STEP 2 FAILED - no member with auth_provider_id:", user.id, "error:", memberError?.message);
    // Auth user exists but no member record — sign out
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401, headers: securityHeaders }
    );
  }

  console.log("[auth/login] STEP 2 OK - member:", member.id, "status:", member.status);

  if (member.status !== "approved") {
    await supabase.auth.signOut();
    await logAuthEvent("login_not_approved", member.id, "email", req, {
      status: member.status,
    });
    return NextResponse.json(
      { error: "Tu cuenta aún no fue aprobada", status: member.status },
      { status: 403, headers: securityHeaders }
    );
  }

  // Update last_login_at
  await supabaseAdmin
    .from("members")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", member.id);

  await logAuthEvent("login_success", member.id, "email", req);

  // Set session cookies via the SSR client so middleware can validate on subsequent requests
  if (signInData.session) {
    const serverClient = await createSupabaseServerClient();
    await serverClient.auth.setSession({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    });
  }

  return NextResponse.json(
    { redirect: "/my-profile" },
    { headers: securityHeaders }
  );
}

async function logAuthEvent(
  eventType: string,
  memberId: string | null,
  provider: string,
  req: NextRequest,
  extra?: Record<string, string>
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "auth",
      event_subtype: eventType,
      member_id: memberId,
      provider,
      ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      metadata: extra ? JSON.stringify(extra) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[auth/login] Audit log error:", err);
  }
}
