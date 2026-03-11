import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendApprovalEmail } from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const { data: member, error: fetchError } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    // Generate member number: CSC-XXXX
    const { count } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const memberNumber = `CSC-${String((count || 0) + 1).padStart(4, "0")}`;

    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({ status: "approved", member_number: memberNumber })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send approval email
    try {
      await sendApprovalEmail(member.email, member.full_name, memberNumber);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    return NextResponse.json({ success: true, member_number: memberNumber });
  }

  // Reject
  const { error: updateError } = await supabase
    .from("members")
    .update({ status: "rejected" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "rejected" });
}
