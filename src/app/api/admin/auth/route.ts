import { NextRequest, NextResponse } from "next/server";
import { verifyTOTP } from "@/lib/totp";
import { createSessionToken } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminKey, totpCode } = body;

  // Validate admin key
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  // Check if TOTP is configured
  if (!process.env.ADMIN_TOTP_SECRET) {
    // MFA not configured — issue session with just the key
    const token = createSessionToken();
    return NextResponse.json({ token, mfa: false });
  }

  // Validate TOTP
  if (!totpCode) {
    // Key is correct, TOTP required
    return NextResponse.json({ error: "totp_required", mfa: true }, { status: 403 });
  }

  if (!verifyTOTP(totpCode)) {
    return NextResponse.json({ error: "Código MFA inválido" }, { status: 401 });
  }

  const token = createSessionToken();
  return NextResponse.json({ token, mfa: true });
}
