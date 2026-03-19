import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar";
}

// GET /api/credential/qr?memberId=xxx — returns QR code for authenticated member
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
    .select("member_number, full_name, status, auth_provider_id")
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

  // Generate QR code as SVG data URL
  const verifyUrl = `${getAppUrl()}/api/verify?member=${member.member_number}`;
  let qrDataUrl = "";
  try {
    const svgString = await QRCode.toString(verifyUrl, {
      type: "svg",
      width: 200,
      margin: 1,
      color: { dark: "#E87B1E", light: "#141211" },
    });
    qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString("base64")}`;
  } catch (qrError) {
    console.error("QR generation failed:", qrError);
  }

  return NextResponse.json({ qr: qrDataUrl, verify_url: verifyUrl });
}
