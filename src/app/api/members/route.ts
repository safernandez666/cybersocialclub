import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience, captcha_token } = body;

  if (!full_name || !email) {
    return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
  }

  // Verify hCaptcha if configured
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
  if (hcaptchaSecret) {
    if (!captcha_token) {
      return NextResponse.json({ error: "Verificación de seguridad requerida" }, { status: 400 });
    }
    const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: hcaptchaSecret, response: captcha_token }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "Verificación de seguridad fallida. Intentá de nuevo." }, { status: 400 });
    }
  }

  // Input length validation
  const lengthLimits: { field: string; value: string | undefined; max: number }[] = [
    { field: "full_name", value: full_name, max: 100 },
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

  // Validate corporate email — block free providers
  const freeProviders = [
    "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.ar",
    "live.com", "aol.com", "icloud.com", "mail.com", "protonmail.com",
    "proton.me", "zoho.com", "yandex.com", "gmx.com", "tutanota.com",
  ];
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!emailDomain || freeProviders.includes(emailDomain)) {
    return NextResponse.json(
      { error: "Se requiere un email corporativo. No se aceptan emails personales (Gmail, Hotmail, etc.)" },
      { status: 400 }
    );
  }

  const verificationToken = randomBytes(32).toString("hex");

  // Check if email already exists with a non-active status
  const { data: existing } = await supabase
    .from("members")
    .select("id, status")
    .eq("email", email)
    .single();

  if (existing) {
    if (existing.status === "approved") {
      return NextResponse.json({ error: "Este email ya está registrado y aprobado" }, { status: 409 });
    }
    // Delete old record (pending_verification, pending, rejected) so they can re-register
    await supabase.from("members").delete().eq("id", existing.id);
  }

  const { error } = await supabase
    .from("members")
    .insert({
      full_name,
      email,
      phone: phone || null,
      company: company || null,
      job_title: job_title || null,
      role_type: role_type || null,
      linkedin_url: linkedin_url || null,
      years_experience: years_experience ? parseInt(years_experience) : null,
      status: "pending_verification",
      verification_token: verificationToken,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send verification email
  try {
    await sendVerificationEmail(email, full_name, verificationToken);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
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
