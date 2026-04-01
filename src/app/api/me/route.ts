import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";

const NAME_REGEX = /^[\p{L}\s'-]{1,50}$/u;

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

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
      "id, first_name, last_name, full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience, country, status, member_number, photo_url, auth_provider, created_at"
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
    "first_name",
    "last_name",
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

  // Validate and sanitize first_name / last_name (REC-4, REC-5)
  if (updates.first_name !== undefined) {
    const fn = sanitizeName(updates.first_name as string);
    if (!fn || !NAME_REGEX.test(fn)) {
      return NextResponse.json(
        { error: "Nombre contiene caracteres inválidos o excede 50 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
    updates.first_name = fn;
  }
  if (updates.last_name !== undefined) {
    const ln = sanitizeName(updates.last_name as string);
    if (!ln || !NAME_REGEX.test(ln)) {
      return NextResponse.json(
        { error: "Apellido contiene caracteres inválidos o excede 50 caracteres" },
        { status: 400, headers: securityHeaders }
      );
    }
    updates.last_name = ln;
  }
  // Recalculate full_name when first/last change
  const supabaseAdmin = getSupabaseAdmin();
  if (updates.first_name || updates.last_name) {
    // Fetch current member to fill in the missing name part
    const { data: currentMember } = await supabaseAdmin
      .from("members")
      .select("first_name, last_name")
      .eq("auth_provider_id", user.id)
      .single();

    const newFirst = (updates.first_name as string) || currentMember?.first_name;
    const newLast = (updates.last_name as string) || currentMember?.last_name;
    if (newFirst && newLast) {
      updates.full_name = `${newFirst} ${newLast}`;
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
    let url = updates.linkedin_url as string;
    // Auto-add https:// if missing
    if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
      url = `https://${url}`;
      updates.linkedin_url = url;
    }
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
