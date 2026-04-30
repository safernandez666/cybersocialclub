import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail } from "@/lib/email";
import { validateAdminAuth } from "@/lib/admin-session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!validateAdminAuth(req.headers)) {
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
    console.log("[resend-credential] Sending — memberId:", id, "member_number:", member.member_number);
    await sendApprovalEmail(member.email, member.full_name, member.member_number, member.credential_token);
    console.log("[resend-credential] Email sent successfully — memberId:", id);

    // Track email delivery timestamp
    await getSupabaseAdmin()
      .from("members")
      .update({ credential_email_sent_at: new Date().toISOString() })
      .eq("id", id);
  } catch (emailError) {
    console.error("[resend-credential] Failed to resend credential email — memberId:", id, "error:", emailError instanceof Error ? emailError.message : emailError);
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Credencial reenviada" });
}
