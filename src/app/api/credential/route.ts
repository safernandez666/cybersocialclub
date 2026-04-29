import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  NO_REFERRER_HEADERS,
  lookupCredentialByToken,
  readCredentialTokenFromBody,
} from "@/lib/credential-token";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar";
}

/**
 * GET /api/credential — deprecated. The old form took the credential token in
 * a query string, which leaks via referrers and access logs (SEC-HIGH).
 * Replaced by POST + token in JSON body, with the email link delivering the
 * token in a URL fragment to /credential.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Volvé a abrir el link desde el email." },
    { status: 410, headers: NO_REFERRER_HEADERS },
  );
}

/**
 * POST /api/credential — return member data for the credential page.
 * Token comes from request body; never appears in URL or logs.
 */
export async function POST(req: NextRequest) {
  const token = await readCredentialTokenFromBody(req);
  const lookup = await lookupCredentialByToken(token);

  if (!lookup.ok) {
    return NextResponse.json({ error: lookup.error }, { status: lookup.status, headers: NO_REFERRER_HEADERS });
  }

  const { member } = lookup;

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

  return NextResponse.json(
    { ...member, qr: qrDataUrl, verify_url: verifyUrl },
    { headers: NO_REFERRER_HEADERS },
  );
}
