import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendAdminNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
  }

  // Find member with this verification token
  const { data: member, error: fetchError } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("verification_token", token)
    .eq("status", "pending_verification")
    .single();

  if (fetchError || !member) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", req.url));
  }

  // Update status to pending (verified, awaiting admin approval)
  const { error: updateError } = await getSupabaseAdmin()
    .from("members")
    .update({ status: "pending", verification_token: null })
    .eq("id", member.id);

  if (updateError) {
    return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
  }

  // Now notify admin that a verified member is waiting approval
  try {
    await sendAdminNotification({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      company: member.company || "N/A",
      job_title: member.job_title || "N/A",
      role_type: member.role_type || "N/A",
    });
  } catch (emailError) {
    console.error("Failed to send admin notification:", emailError);
  }

  return NextResponse.redirect(new URL("/verify-email?status=success", req.url));
}
