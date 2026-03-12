import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomBytes } from "crypto";
import { sendApprovalEmail } from "@/lib/email";
import { validateAdminAuth } from "@/lib/admin-session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (!validateAdminAuth(req.headers)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  // Get member data first
  const { data: member, error: fetchError } = await getSupabaseAdmin()
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    // Generate member number: CSC-XXXX
    const { count } = await getSupabaseAdmin()
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const memberNumber = `CSC-${String((count || 0) + 1).padStart(4, "0")}`;
    const credentialToken = randomBytes(32).toString("hex");

    // Token expires in 90 days
    // NOTE: Requires `credential_token_expires_at` column (timestamptz) in Supabase `members` table
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await getSupabaseAdmin()
      .from("members")
      .update({
        status: "approved",
        member_number: memberNumber,
        credential_token: credentialToken,
        credential_token_expires_at: expiresAt,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send approval email
    try {
      console.log("Sending approval email to:", member.email, "member:", memberNumber);
      await sendApprovalEmail(member.email, member.full_name, memberNumber, credentialToken);
      console.log("Approval email sent successfully to:", member.email);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError instanceof Error ? emailError.message : emailError);
      console.error("Full error:", JSON.stringify(emailError, Object.getOwnPropertyNames(emailError as object)));
    }

    return NextResponse.json({ success: true, member_number: memberNumber });
  }

  // Reject
  const { error: updateError } = await getSupabaseAdmin()
    .from("members")
    .update({ status: "rejected" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "rejected" });
}
