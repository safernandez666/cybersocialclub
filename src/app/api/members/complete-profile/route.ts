import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendAdminNotification } from "@/lib/email";

/**
 * PATCH /api/members/complete-profile
 * Updates a pending member's profile fields after Google registration.
 * Only works for members with status "pending" (not approved/rejected).
 */
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { id, company, job_title, role_type, linkedin_url, years_experience, phone } = body as Record<string, string>;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify member exists and is pending
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  if (member.status !== "pending") {
    return NextResponse.json({ error: "Solo se pueden completar perfiles pendientes" }, { status: 400 });
  }

  // Update only allowed fields
  const { error: updateError } = await supabase
    .from("members")
    .update({
      company: company || null,
      job_title: job_title || null,
      role_type: role_type || null,
      linkedin_url: linkedin_url || null,
      years_experience: years_experience ? parseInt(years_experience as string) : null,
      phone: phone || null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send admin notification with full data
  try {
    const { data: updatedMember } = await supabase
      .from("members")
      .select("id, full_name, email, company, job_title, role_type")
      .eq("id", id)
      .single();

    if (updatedMember) {
      await sendAdminNotification({
        id: updatedMember.id,
        full_name: updatedMember.full_name,
        email: updatedMember.email,
        company: updatedMember.company || "N/A",
        job_title: updatedMember.job_title || "N/A",
        role_type: updatedMember.role_type || "N/A",
      });
    }
  } catch (emailErr) {
    console.error("[complete-profile] Admin notification error:", emailErr);
  }

  return NextResponse.json({ success: true });
}
