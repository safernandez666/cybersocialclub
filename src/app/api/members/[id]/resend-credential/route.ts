import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: member, error: fetchError } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  if (member.status !== "approved") {
    return NextResponse.json({ error: "El miembro no está aprobado" }, { status: 400 });
  }

  if (!member.credential_token || !member.member_number) {
    return NextResponse.json({ error: "El miembro no tiene credencial generada" }, { status: 400 });
  }

  try {
    await sendApprovalEmail(member.email, member.full_name, member.member_number, member.credential_token);
  } catch (emailError) {
    console.error("Failed to resend credential email:", emailError);
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Credencial reenviada" });
}
