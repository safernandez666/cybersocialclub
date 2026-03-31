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
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
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

  const supabaseAdmin = getSupabaseAdmin();
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, status")
    .eq("auth_provider_id", user.id)
    .single();

  if (!member) {
    // Auth user exists but no member record — sign out
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401, headers: securityHeaders }
    );
  }

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
