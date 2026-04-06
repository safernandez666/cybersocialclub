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

  // TOTP is required in production
  if (!process.env.ADMIN_TOTP_SECRET) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return NextResponse.json(
        { error: "MFA no configurado. ADMIN_TOTP_SECRET es obligatorio en producción." },
        { status: 500 }
      );
    }
    // Dev only: allow session without MFA
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
