import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const member_number = searchParams.get("member");

  if (!member_number) {
    return NextResponse.json({ error: "member parameter required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("members")
    .select("id, member_number, full_name, company, job_title, role_type, photo_url, status, created_at")
    .eq("member_number", member_number)
    .eq("status", "approved")
    .single();

  if (error || !data) {
    return NextResponse.json({ verified: false, error: "Miembro no encontrado o no aprobado" }, { status: 404 });
  }

  return NextResponse.json({
    verified: true,
    member: data,
  });
}
