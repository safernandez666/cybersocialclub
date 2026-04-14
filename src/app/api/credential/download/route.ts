import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// GET /api/credential/download?memberId=xxx — redirects to image generation for authenticated member
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "Member ID requerido" }, { status: 400 });
  }

  // Verify authentication
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Get member data and verify it belongs to the authenticated user
  const { data: member, error } = await getSupabaseAdmin()
    .from("members")
    .select("member_number, status, auth_provider_id, credential_token")
    .eq("id", memberId)
    .eq("status", "approved")
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Verify the member belongs to the authenticated user
  if (member.auth_provider_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // If no credential token exists, generate one
  let token = member.credential_token;
  if (!token) {
    token = crypto.randomUUID();
    await getSupabaseAdmin()
      .from("members")
      .update({ credential_token: token, credential_token_expires_at: null })
      .eq("id", memberId);
  }

  // Redirect to the image generation endpoint
  const imageUrl = `/api/credential/image?token=${token}`;
  return NextResponse.redirect(new URL(imageUrl, req.url));
}
