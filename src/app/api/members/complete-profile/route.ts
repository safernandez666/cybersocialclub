import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendAdminNotification } from "@/lib/email";

const ALLOWED_COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "República Dominicana", "Uruguay", "Venezuela", "Otros",
];

const NAME_REGEX = /^[\p{L}\s'-]{1,50}$/u;

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

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

  const { id, first_name, last_name, company, job_title, role_type, linkedin_url, years_experience, phone, country } = body as Record<string, string>;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  // Auth check: require Supabase session and verify the requester owns this member record
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Verify member exists and is pending
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("id, status, auth_provider_id")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Verify the authenticated user owns this member record
  if (member.auth_provider_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (member.status !== "pending") {
    return NextResponse.json({ error: "Solo se pueden completar perfiles pendientes" }, { status: 400 });
  }

  // Validate country if provided
  if (country && !ALLOWED_COUNTRIES.includes(country)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 });
  }

  // Validate names if provided (REC-4: character validation)
  if (first_name && !NAME_REGEX.test(sanitizeName(first_name))) {
    return NextResponse.json({ error: "Nombre contiene caracteres inválidos" }, { status: 400 });
  }
  if (last_name && !NAME_REGEX.test(sanitizeName(last_name))) {
    return NextResponse.json({ error: "Apellido contiene caracteres inválidos" }, { status: 400 });
  }

  // Update only allowed fields
  const updateFields: Record<string, unknown> = {
    company: company || null,
    job_title: job_title || null,
    role_type: role_type || null,
    linkedin_url: linkedin_url || null,
    years_experience: years_experience ? parseInt(years_experience as string) : null,
    phone: phone || null,
  };
  if (country) {
    updateFields.country = country;
  }
  if (first_name) {
    updateFields.first_name = sanitizeName(first_name);
  }
  if (last_name) {
    updateFields.last_name = sanitizeName(last_name);
  }
  // Recalculate full_name if both names provided
  if (first_name && last_name) {
    updateFields.full_name = `${sanitizeName(first_name)} ${sanitizeName(last_name)}`;
  }

  const { error: updateError } = await supabase
    .from("members")
    .update(updateFields)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send admin notification with full data
  try {
    const { data: updatedMember } = await supabase
      .from("members")
      .select("id, full_name, email, company, job_title, role_type, linkedin_url")
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
        linkedin_url: updatedMember.linkedin_url || undefined,
      });
    }
  } catch (emailErr) {
    console.error("[complete-profile] Admin notification error:", emailErr);
  }

  return NextResponse.json({ success: true });
}
