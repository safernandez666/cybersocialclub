import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { full_name, email, phone, company, job_title, role_type, linkedin_url, years_experience } = body;

  if (!full_name || !email) {
    return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
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

  const { data, error } = await supabase
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
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
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
