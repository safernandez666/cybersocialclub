import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";

function getAppUrl() { return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar"; }

// GET /api/credential?token=xxx — returns member data for credential page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const { data: member, error } = await getSupabaseAdmin()
    .from("members")
    .select("member_number, full_name, company, job_title, role_type, status, created_at, credential_token_expires_at")
    .eq("credential_token", token)
    .eq("status", "approved")
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Credencial no encontrada o inválida" }, { status: 404 });
  }

  // Check token expiration
  if (member.credential_token_expires_at && new Date(member.credential_token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Credential link expired. Contact admin." },
      { status: 410 }
    );
  }

  // Generate QR code as SVG data URL (no canvas dependency needed)
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

  return NextResponse.json({ ...member, qr: qrDataUrl, verify_url: verifyUrl });
}
