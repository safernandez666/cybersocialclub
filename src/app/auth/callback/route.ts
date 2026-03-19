import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSafeOrigin, isPreviewDeploy, getSecurityHeaders } from "@/lib/auth-utils";

/**
 * OAuth callback handler for Google and LinkedIn social login.
 *
 * Security measures (from Male's review):
 * - getSafeOrigin() for redirect validation (S3 fix)
 * - email_verified strict enforcement (S2 fix)
 * - Provider conflict detection (S5 fix)
 * - Audit logging for auth events
 * - Social login disabled on preview deploys (S11 fix)
 */
export async function GET(req: NextRequest) {
  const safeOrigin = getSafeOrigin(req);
  const securityHeaders = getSecurityHeaders();

  // S11: Disable social login on Vercel preview deploys
  if (isPreviewDeploy()) {
    const res = NextResponse.redirect(`${safeOrigin}/login?error=preview_disabled`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    const res = NextResponse.redirect(
      `${safeOrigin}/login?error=${encodeURIComponent(error)}`
    );
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(`${safeOrigin}/login?error=no_code`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Exchange code for session
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Exchange error:", exchangeError?.message);
    const res = NextResponse.redirect(`${safeOrigin}/login?error=exchange_failed`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const user = data.user;
  const email = user.email;
  const provider = user.app_metadata.provider as string;

  // S2: Strict email verification enforcement
  if (!user.user_metadata.email_verified) {
    console.warn("[auth/callback] Unverified email rejected:", email, provider);
    await logAuthEvent("login_rejected_unverified", null, provider, req);
    const res = NextResponse.redirect(`${safeOrigin}/login?error=unverified_email`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (!email) {
    const res = NextResponse.redirect(`${safeOrigin}/login?error=no_email`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Lookup member by email
  const supabaseAdmin = getSupabaseAdmin();
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("email", email)
    .single();

  let redirectPath: string;

  if (!member) {
    // New member — create with pending status
    const { error: insertError } = await supabaseAdmin.from("members").insert({
      full_name: user.user_metadata.full_name || user.user_metadata.name || email,
      email,
      photo_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
      auth_provider: provider,
      auth_provider_id: user.id,
      status: "pending",
    });

    if (insertError) {
      console.error("[auth/callback] Insert error:", insertError.message);
      const res = NextResponse.redirect(`${safeOrigin}/login?error=registration_failed`);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    await logAuthEvent("new_registration", null, provider, req);
    redirectPath = "/complete-profile";
  } else if (member.status === "approved") {
    // S5: Provider conflict detection
    if (member.auth_provider && member.auth_provider !== provider) {
      console.warn(
        "[auth/callback] Provider conflict:",
        email,
        "existing:", member.auth_provider,
        "attempted:", provider
      );
      await logAuthEvent("provider_conflict_attempt", member.id, provider, req, {
        existing_provider: member.auth_provider,
      });
      const res = NextResponse.redirect(`${safeOrigin}/login?error=linking_conflict`);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Link provider if not yet linked
    if (!member.auth_provider_id) {
      await supabaseAdmin
        .from("members")
        .update({
          auth_provider: provider,
          auth_provider_id: user.id,
          photo_url: member.photo_url || user.user_metadata.avatar_url || user.user_metadata.picture || null,
          last_login_at: new Date().toISOString(),
        })
        .eq("id", member.id);
    } else {
      await supabaseAdmin
        .from("members")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", member.id);
    }

    await logAuthEvent("login_success", member.id, provider, req);
    redirectPath = `/member/${member.id}`;
  } else if (member.status === "pending_verification") {
    // Social login already verified email — advance to pending
    // S5: Provider conflict detection
    if (member.auth_provider && member.auth_provider !== provider) {
      await logAuthEvent("provider_conflict_attempt", member.id, provider, req, {
        existing_provider: member.auth_provider,
      });
      const res = NextResponse.redirect(`${safeOrigin}/login?error=linking_conflict`);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    await supabaseAdmin
      .from("members")
      .update({
        status: "pending",
        auth_provider: provider,
        auth_provider_id: user.id,
        verification_token: null,
        photo_url: member.photo_url || user.user_metadata.avatar_url || user.user_metadata.picture || null,
      })
      .eq("id", member.id);

    await logAuthEvent("email_verified_via_social", member.id, provider, req);
    redirectPath = "/pending-approval";
  } else if (member.status === "pending") {
    // Link provider if not yet linked
    if (!member.auth_provider_id) {
      // S5: Provider conflict detection
      if (member.auth_provider && member.auth_provider !== provider) {
        await logAuthEvent("provider_conflict_attempt", member.id, provider, req, {
          existing_provider: member.auth_provider,
        });
        const res = NextResponse.redirect(`${safeOrigin}/login?error=linking_conflict`);
        Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      await supabaseAdmin
        .from("members")
        .update({ auth_provider: provider, auth_provider_id: user.id })
        .eq("id", member.id);
    }

    await logAuthEvent("login_pending_member", member.id, provider, req);
    redirectPath = "/pending-approval";
  } else {
    // rejected or unknown status
    await logAuthEvent("login_rejected_status", member.id, provider, req, {
      member_status: member.status,
    });
    redirectPath = "/login?error=rejected";
  }

  const res = NextResponse.redirect(`${safeOrigin}${redirectPath}`);
  Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

/**
 * Log auth events for audit trail.
 * Male review recommendation: structured logging for auth events.
 */
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
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      metadata: extra ? JSON.stringify(extra) : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never let audit logging failure break auth flow
    console.error("[auth/callback] Audit log error:", err);
  }
}
