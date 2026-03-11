import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomBytes } from "crypto";
import { sendApprovalEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, adminKey } = body;

  // Auth check
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
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

    const { error: updateError } = await getSupabaseAdmin()
      .from("members")
      .update({ status: "approved", member_number: memberNumber, credential_token: credentialToken })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send approval email
    try {
      await sendApprovalEmail(member.email, member.full_name, memberNumber, credentialToken);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
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
