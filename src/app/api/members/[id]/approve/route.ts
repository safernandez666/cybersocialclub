import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomBytes } from "crypto";
import { sendApprovalEmail } from "@/lib/email";
import { validateAdminAuth } from "@/lib/admin-session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const credentialToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    // Generate member number with retry for race conditions (REC-1: max 3 attempts)
    let memberNumber = "";
    let updateError = null;
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: lastMember } = await getSupabaseAdmin()
        .from("members")
        .select("member_number")
        .not("member_number", "is", null)
        .order("member_number", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastMember?.member_number) {
        const match = lastMember.member_number.match(/CSC-(\d+)/);
        if (match) nextNumber = parseInt(match[1]) + 1;
      }
      memberNumber = `CSC-${String(nextNumber).padStart(4, "0")}`;

      const { error } = await getSupabaseAdmin()
        .from("members")
        .update({
          status: "approved",
          member_number: memberNumber,
          credential_token: credentialToken,
          credential_token_expires_at: expiresAt,
        })
        .eq("id", id);

      if (!error) {
        updateError = null;
        break;
      }

      // 23505 = unique violation on member_number — retry with next number
      if (error.code === "23505" && attempt < maxAttempts - 1) {
        console.warn(`[approve] member_number collision (${memberNumber}), retrying...`);
        updateError = error;
        continue;
      }

      updateError = error;
      break;
    }

    if (updateError) {
      console.error("[approve] Update error:", JSON.stringify(updateError));
      return NextResponse.json({ error: updateError.message, details: updateError.code }, { status: 500 });
    }

    // Send approval email in background (after response) to avoid Vercel function timeout
    after(async () => {
      try {
        console.log("[after] Sending approval email to:", member.email, "member:", memberNumber);
        await sendApprovalEmail(member.email, member.full_name, memberNumber, credentialToken, member.first_name);
        console.log("[after] Approval email sent successfully to:", member.email);

        await getSupabaseAdmin()
          .from("members")
          .update({ credential_email_sent_at: new Date().toISOString() })
          .eq("id", id);
      } catch (emailError) {
        console.error("[after] Failed to send approval email:", emailError instanceof Error ? emailError.message : emailError);
      }
    });

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
  } catch (err) {
    console.error("[approve] Unexpected error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 500 });
  }
}
