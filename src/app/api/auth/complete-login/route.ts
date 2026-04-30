import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";

/**
 * GET /api/auth/complete-login
 *
 * Called after the client-side PKCE exchange succeeds in /auth/callback.
 * Handles member lookup/creation, audit logging, and returns the redirect path.
 * Requires a valid Supabase session (set by the client-side exchange).
 */
export async function GET(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  // Get the authenticated user from the session (set by client-side exchange)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No authenticated session", redirect: "/login?error=no_session" },
      { status: 401, headers: securityHeaders }
    );
  }

  const email = user.email;
  const provider = (user.app_metadata.provider as string) || "unknown";

  // S2: Strict email verification enforcement
  if (!user.user_metadata.email_verified) {
    console.warn("[complete-login] Unverified email rejected — userId:", user.id, "provider:", provider);
    await logAuthEvent("login_rejected_unverified", null, provider, req);
    return NextResponse.json(
      { redirect: "/register?error=unverified_email" },
      { headers: securityHeaders }
    );
  }

  if (!email) {
    return NextResponse.json(
      { redirect: "/register?error=no_email" },
      { headers: securityHeaders }
    );
  }

  // Lookup member by email (case-insensitive, prioritize approved)
  const normalizedEmail = email.toLowerCase().trim();
  const supabaseAdmin = getSupabaseAdmin();
  const { data: members } = await supabaseAdmin
    .from("members")
    .select("*")
    .ilike("email", normalizedEmail)
    .order("status", { ascending: true })
    .limit(1);

  const member = members?.[0] ?? null;

  let redirectPath: string;

  if (!member) {
    // Create new member with social login data
    const fullName = user.user_metadata.full_name || user.user_metadata.name || email;
    const { error: insertError } = await supabaseAdmin.from("members").insert({
      full_name: fullName,
      email: normalizedEmail,
      photo_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
      auth_provider: provider,
      auth_provider_id: user.id,
      status: "pending",
    });

    if (insertError) {
      console.error("[complete-login] Insert error:", insertError.message);
      return NextResponse.json(
        { redirect: "/register?error=registration_failed" },
        { headers: securityHeaders }
      );
    }

    await logAuthEvent("new_registration", null, provider, req);

    const { data: newMembers } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    const newMember = newMembers?.[0] ?? null;
    redirectPath = `/complete-profile?id=${newMember?.id || ""}&provider=${provider}`;
  } else if (member.status === "approved") {
    if (!member.auth_provider_id) {
      await supabaseAdmin
        .from("members")
        .update({ auth_provider_id: user.id, auth_provider: provider })
        .eq("id", member.id);
    }
    await logAuthEvent("login_existing_approved", member.id, provider, req);
    redirectPath = "/my-profile";
  } else if (member.status === "pending" || member.status === "pending_verification") {
    if (!member.auth_provider_id) {
      await supabaseAdmin
        .from("members")
        .update({ auth_provider_id: user.id, auth_provider: provider })
        .eq("id", member.id);
    }
    await logAuthEvent("login_pending_member", member.id, provider, req);
    if (member.company || member.job_title) {
      redirectPath = "/pending-approval";
    } else {
      redirectPath = `/complete-profile?id=${member.id}&provider=${provider}`;
    }
  } else {
    await logAuthEvent("login_rejected_status", member.id, provider, req, {
      member_status: member.status,
    });
    redirectPath = "/register?error=rejected";
  }

  return NextResponse.json({ redirect: redirectPath }, { headers: securityHeaders });
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
      event_type: "social_login",
      event_subtype: eventType,
      member_id: memberId,
      provider,
      ip_address:
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")?.pop()?.trim() ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      metadata: extra ? JSON.stringify(extra) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[complete-login] Audit log error:", err);
  }
}
