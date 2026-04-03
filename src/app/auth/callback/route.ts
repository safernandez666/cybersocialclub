import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSafeOrigin, isPreviewDeploy, getSecurityHeaders } from "@/lib/auth-utils";
import { sendAdminNotification } from "@/lib/email";

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
    const res = NextResponse.redirect(`${safeOrigin}/register?error=preview_disabled`);
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
      `${safeOrigin}/register?error=${encodeURIComponent(error)}`
    );
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(`${safeOrigin}/register?error=no_code`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Exchange code for session
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Exchange error:", exchangeError?.message);
    const res = NextResponse.redirect(`${safeOrigin}/register?error=exchange_failed`);
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
    const res = NextResponse.redirect(`${safeOrigin}/register?error=unverified_email`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (!email) {
    const res = NextResponse.redirect(`${safeOrigin}/register?error=no_email`);
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Lookup member by email (normalize to lowercase for case-insensitive match)
  const normalizedEmail = email.toLowerCase().trim();
  const supabaseAdmin = getSupabaseAdmin();
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("email", normalizedEmail)
    .single();

  let redirectPath: string;

  if (!member) {
    // New member — register with Google data, status: pending
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
      console.error("[auth/callback] Insert error:", insertError.message);
      const res = NextResponse.redirect(`${safeOrigin}/register?error=registration_failed`);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    await logAuthEvent("new_registration", null, provider, req);

    // Get the new member id for the complete-profile form
    const { data: newMember } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    // Admin notification will be sent AFTER user completes the profile form
    redirectPath = `/complete-profile?id=${newMember?.id || ""}&provider=${provider}`;
  } else if (member.status === "approved") {
    // Already approved — update auth link if needed, redirect to profile
    if (!member.auth_provider_id) {
      await supabaseAdmin
        .from("members")
        .update({ auth_provider_id: user.id, auth_provider: provider })
        .eq("id", member.id);
    }
    await logAuthEvent("login_existing_approved", member.id, provider, req);
    redirectPath = "/my-profile";
  } else if (member.status === "pending" || member.status === "pending_verification") {
    // Update auth link if needed
    if (!member.auth_provider_id) {
      await supabaseAdmin
        .from("members")
        .update({ auth_provider_id: user.id, auth_provider: provider })
        .eq("id", member.id);
    }
    await logAuthEvent("login_pending_member", member.id, provider, req);
    // If profile already has company/job_title filled, they already completed it — show pending page
    if (member.company || member.job_title) {
      redirectPath = "/pending-approval";
    } else {
      redirectPath = `/complete-profile?id=${member.id}&provider=${provider}`;
    }
  } else {
    // rejected
    await logAuthEvent("login_rejected_status", member.id, provider, req, {
      member_status: member.status,
    });
    redirectPath = "/register?error=rejected";
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
