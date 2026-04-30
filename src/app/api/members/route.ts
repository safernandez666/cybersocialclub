import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const supabase = getSupabaseAdmin();
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email";

const MIN_PASSWORD_LENGTH = 8;

// Allows letters (including accented), spaces, hyphens, apostrophes (REC-4: character validation)
const NAME_REGEX = /^[\p{L}\s'-]{1,50}$/u;

const ALLOWED_COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "República Dominicana", "Uruguay", "Venezuela", "Otros",
];

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { first_name, last_name, full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience, captcha_token, country, password } = body;

  // Normalize email (REC-4: lowercase + trim)
  const normalizedEmail = email?.toLowerCase().trim();

  // Support both new (first_name + last_name) and legacy (full_name) inputs
  let resolvedFirstName: string | null = null;
  let resolvedLastName: string | null = null;
  let resolvedFullName: string;

  if (first_name && last_name) {
    resolvedFirstName = sanitizeName(first_name);
    resolvedLastName = sanitizeName(last_name);
    resolvedFullName = `${resolvedFirstName} ${resolvedLastName}`;

    // Validate characters (REC-4)
    if (!NAME_REGEX.test(resolvedFirstName)) {
      return NextResponse.json({ error: "Nombre contiene caracteres inválidos" }, { status: 400 });
    }
    if (!NAME_REGEX.test(resolvedLastName)) {
      return NextResponse.json({ error: "Apellido contiene caracteres inválidos" }, { status: 400 });
    }
  } else if (full_name) {
    // Backwards compat: accept full_name from legacy clients
    resolvedFullName = sanitizeName(full_name);
  } else {
    return NextResponse.json({ error: "Nombre y apellido son obligatorios" }, { status: 400 });
  }

  if (!normalizedEmail || !country) {
    return NextResponse.json({ error: "Email y país son obligatorios" }, { status: 400 });
  }

  // Validate password if provided (optional — social login users won't have one)
  if (password !== undefined && password !== null && password !== "") {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      );
    }
  }

  if (!ALLOWED_COUNTRIES.includes(country)) {
    return NextResponse.json({ error: "País inválido" }, { status: 400 });
  }

  // Verify hCaptcha (required when configured)
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
  if (hcaptchaSecret) {
    if (!captcha_token) {
      return NextResponse.json({ error: "Captcha es obligatorio" }, { status: 400 });
    }

    const verifyParams: Record<string, string> = { secret: hcaptchaSecret, response: captcha_token };
    const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    if (hcaptchaSiteKey) verifyParams.sitekey = hcaptchaSiteKey;

    const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(verifyParams),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.error("[security] hCaptcha verification failed:", JSON.stringify(verifyData));
      return NextResponse.json({ error: "Verificación de captcha fallida" }, { status: 400 });
    }
  }

  // Input length validation
  const lengthLimits: { field: string; value: string | undefined; max: number }[] = [
    { field: "full_name", value: resolvedFullName, max: 100 },
    { field: "email", value: email, max: 255 },
    { field: "phone", value: phone, max: 50 },
    { field: "company", value: company, max: 100 },
    { field: "job_title", value: job_title, max: 100 },
    { field: "linkedin_url", value: linkedin_url, max: 500 },
  ];
  for (const { field, value, max } of lengthLimits) {
    if (value && value.length > max) {
      return NextResponse.json(
        { error: `${field} excede el máximo de ${max} caracteres` },
        { status: 400 }
      );
    }
  }

  // Basic email validation
  const emailDomain = normalizedEmail.split("@")[1]?.toLowerCase();
  if (!emailDomain) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const verificationCode = generateVerificationCode();

  // Check if email already exists with a non-active status
  const { data: existing } = await supabase
    .from("members")
    .select("id, status")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    if (existing.status === "approved") {
      return NextResponse.json({ error: "Este email ya está registrado y aprobado" }, { status: 409 });
    }
    // Delete old record (pending_verification, pending, rejected) so they can re-register
    await supabase.from("members").delete().eq("id", existing.id);
  }

  // If password provided, create Supabase Auth user first
  let authUserId: string | null = null;
  if (password && typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH) {
    const { data: newAuthUser, error: createAuthError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
      });

    if (createAuthError) {
      if (createAuthError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con este email" },
          { status: 409 }
        );
      }
      console.error("[members/POST] Auth create error:", createAuthError.message);
      return NextResponse.json(
        { error: "Error al crear la cuenta" },
        { status: 500 }
      );
    }

    authUserId = newAuthUser.user.id;
  }

  const { error } = await supabase
    .from("members")
    .insert({
      full_name: resolvedFullName,
      ...(resolvedFirstName && { first_name: resolvedFirstName }),
      ...(resolvedLastName && { last_name: resolvedLastName }),
      email: normalizedEmail,
      phone: phone || null,
      company: company || null,
      job_title: job_title || null,
      role_type: role_type || null,
      linkedin_url: linkedin_url || null,
      years_experience: years_experience ? parseInt(years_experience) : null,
      country,
      status: "pending_verification",
      verification_code: verificationCode,
      verification_code_attempts: 0,
      verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...(authUserId && { auth_provider_id: authUserId, auth_provider: "email" }),
    });

  if (error) {
    // Rollback auth user if member insert fails
    if (authUserId) {
      await supabase.auth.admin.deleteUser(authUserId);
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send verification email
  try {
    await sendVerificationEmail(normalizedEmail, resolvedFullName, verificationCode, resolvedFirstName);
  } catch (emailError) {
    console.error("[members] Failed to send verification email:", emailError instanceof Error ? emailError.message : String(emailError));
  }

  return NextResponse.json({ success: true, message: "Te enviamos un email para verificar tu correo" }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("members")
      .select("id, member_number, full_name, company, job_title, role_type, photo_url, status, created_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  // Directory: only approved members
  const { data, error } = await supabase
    .from("members")
    .select("id, member_number, full_name, company, job_title, role_type, photo_url")
    .eq("status", "approved")
    .order("member_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
