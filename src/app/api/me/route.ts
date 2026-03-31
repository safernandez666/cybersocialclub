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
      "id, full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience, country, status, member_number, photo_url, auth_provider, created_at"
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

  // Whitelist of editable fields (never: email, member_number, status, auth_provider, auth_provider_id)
  const allowedFields = [
    "full_name",
    "phone",
    "company",
    "job_title",
    "linkedin_url",
    "years_experience",
    "country",
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

  // Field-level validation
  const ALLOWED_COUNTRIES = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
    "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua",
    "Panamá", "Paraguay", "Perú", "República Dominicana", "Uruguay", "Venezuela", "Otros",
  ];

  if (updates.full_name !== undefined) {
    const name = updates.full_name as string;
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Nombre debe tener entre 2 y 100 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
  }
  if (updates.phone !== undefined && updates.phone !== null) {
    const phone = updates.phone as string;
    if (phone.length > 50) {
      return NextResponse.json(
        { error: "Teléfono excede el máximo de 50 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
  }
  if (updates.company !== undefined && updates.company !== null) {
    if ((updates.company as string).length > 100) {
      return NextResponse.json(
        { error: "Empresa excede el máximo de 100 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
  }
  if (updates.job_title !== undefined && updates.job_title !== null) {
    if ((updates.job_title as string).length > 100) {
      return NextResponse.json(
        { error: "Cargo excede el máximo de 100 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
  }
  if (updates.linkedin_url !== undefined && updates.linkedin_url !== null) {
    const url = updates.linkedin_url as string;
    if (url.length > 500 || (url && !url.startsWith("https://linkedin.com/in/") && !url.startsWith("https://www.linkedin.com/in/"))) {
      return NextResponse.json(
        { error: "URL de LinkedIn inválida" },
        { status: 400, headers: securityHeaders }
      );
    }
  }
  if (updates.country !== undefined) {
    if (!ALLOWED_COUNTRIES.includes(updates.country as string)) {
      return NextResponse.json(
        { error: "País inválido" },
        { status: 400, headers: securityHeaders }
      );
    }
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

  // Audit log: profile_updated (log field names only, not values)
  try {
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "auth",
      event_subtype: "profile_updated",
      member_id: user.id,
      provider: null,
      metadata: JSON.stringify({ fields: Object.keys(updates) }),
      created_at: new Date().toISOString(),
    });
  } catch {
    // Never let audit logging break the update flow
  }

  return NextResponse.json({ success: true }, { headers: securityHeaders });
}
