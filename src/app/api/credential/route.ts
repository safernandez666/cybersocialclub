import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cybersocialclub.com.ar";

// GET /api/credential?token=xxx — returns member data for credential page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const { data: member, error } = await getSupabaseAdmin()
    .from("members")
    .select("member_number, full_name, company, job_title, role_type, status, created_at")
    .eq("credential_token", token)
    .eq("status", "approved")
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Credencial no encontrada o inválida" }, { status: 404 });
  }

  // Generate QR code as data URL (points to verify endpoint)
  const verifyUrl = `${APP_URL}/api/verify?member=${member.member_number}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#E87B1E", light: "#141211" },
  });

  return NextResponse.json({ ...member, qr: qrDataUrl, verify_url: verifyUrl });
}
