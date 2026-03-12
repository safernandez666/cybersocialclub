import { NextRequest, NextResponse } from "next/server";
import { generateSetupURI } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminKey } = body;

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { uri, secret } = generateSetupURI();

  // Generate QR as SVG data URL
  let qrDataUrl = "";
  try {
    const svgString = await QRCode.toString(uri, {
      type: "svg",
      width: 256,
      margin: 2,
    });
    qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString("base64")}`;
  } catch {
    // fallback: just return the URI
  }

  return NextResponse.json({ uri, secret, qr: qrDataUrl });
}
