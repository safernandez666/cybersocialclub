import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendVerificationEmail } from "@/lib/email";
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

  if (member.status !== "pending_verification") {
    return NextResponse.json({ error: "El miembro no está pendiente de verificación" }, { status: 400 });
  }

  const verificationToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await getSupabaseAdmin()
    .from("members")
    .update({
      verification_token: verificationToken,
      verification_token_expires_at: expiresAt,
    })
    .eq("id", id);

  if (updateError) {
    console.error("[resend-verification] Update error:", updateError.message);
    return NextResponse.json({ error: "Error al actualizar el token" }, { status: 500 });
  }

  try {
    console.log("[resend-verification] Sending to:", member.email);
    await sendVerificationEmail(member.email, member.full_name, verificationToken, member.first_name);
    console.log("[resend-verification] Email sent successfully");
  } catch (emailError) {
    console.error("Failed to resend verification email:", emailError);
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Email de verificación reenviado" });
}
