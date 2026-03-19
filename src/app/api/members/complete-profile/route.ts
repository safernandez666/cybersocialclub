import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

  return NextResponse.json({ success: true });
}
