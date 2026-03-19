import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";

/**
 * GET /api/me — Returns the authenticated socio's member data.
 * Requires a valid Supabase session (cookie-based).
 */
export async function GET() {
  const securityHeaders = getSecurityHeaders();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select(
      "id, full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience, status, member_number, photo_url, auth_provider, created_at"
    )
    .eq("auth_provider_id", user.id)
    .single();

  if (error || !member) {
    return NextResponse.json(
      { error: "Miembro no encontrado" },
      { status: 404, headers: securityHeaders }
    );
  }

  return NextResponse.json(member, { headers: securityHeaders });
}

/**
 * PATCH /api/me — Update the authenticated socio's profile.
 * Only allows updating specific fields (not status, member_number, etc.).
 */
export async function PATCH(req: Request) {
  const securityHeaders = getSecurityHeaders();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401, headers: securityHeaders }
    );
  }

  const body = await req.json();

  // Only allow updating these fields
  const allowedFields = [
    "full_name",
    "phone",
    "company",
    "job_title",
    "role_type",
    "linkedin_url",
    "years_experience",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar" },
      { status: 400, headers: securityHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("members")
    .update(updates)
    .eq("auth_provider_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: securityHeaders }
    );
  }

  return NextResponse.json({ success: true }, { headers: securityHeaders });
}
