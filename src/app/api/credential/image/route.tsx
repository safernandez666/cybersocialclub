import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import {
  NO_REFERRER_HEADERS,
  lookupCredentialByToken,
  readCredentialTokenFromBody,
} from "@/lib/credential-token";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://socios.cybersocialclub.com.ar"
  );
}

// Google Wallet-style card proportions (taller, phone-like)
const WIDTH = 800;
const HEIGHT = 1120;

/**
 * GET /api/credential/image — deprecated. Old form leaked the credential
 * token via query strings/referrers. Replaced by POST + token in body, with
 * the credential page fetching this endpoint and rendering the response as
 * a `blob:` URL.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Volvé a abrir el link desde el email." },
    { status: 410, headers: NO_REFERRER_HEADERS },
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = await readCredentialTokenFromBody(req);
    const lookup = await lookupCredentialByToken(token);
    if (!lookup.ok) {
      return new Response(lookup.error, { status: lookup.status, headers: NO_REFERRER_HEADERS });
    }
    const { member } = lookup;

    const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    const appUrl = getAppUrl();
    const verifyUrl = `${appUrl}/api/verify?member=${member.member_number}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&margin=0`;

    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#141211",
          }}
        >
          {/* Hero Banner */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 200,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${appUrl}/csc-banner.png`}
              width={WIDTH}
              height={200}
              alt="CSC Banner"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Logo + Title Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "28px 40px 8px",
              gap: 20,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${appUrl}/icon-192.png`}
              width={56}
              height={56}
              alt="CSC"
              style={{ borderRadius: 12 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: "#E87B1E", fontWeight: 700, letterSpacing: 3 }}>
                CYBER SOCIAL CLUB
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 4, marginTop: 2 }}>
                WHERE CYBER MINDS CONNECT
              </span>
            </div>
          </div>

          {/* Subheader + Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "20px 40px 0",
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 4 }}>
              MIEMBRO
            </span>
            <span style={{ fontSize: 36, color: "#FFFFFF", fontWeight: 600, marginTop: 6 }}>
              {member.full_name}
            </span>
          </div>

          {/* Separator */}
          <div
            style={{
              display: "flex",
              margin: "24px 40px",
              height: 1,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />

          {/* Text Fields (2-column grid matching Wallet layout) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              padding: "0 40px",
              gap: 0,
            }}
          >
            {/* Row 1 */}
            <div style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 28 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
                N. MIEMBRO
              </span>
              <span style={{ fontSize: 20, color: "#E87B1E", fontWeight: 600, marginTop: 6 }}>
                {member.member_number}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 28 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
                MIEMBRO DESDE
              </span>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 400, marginTop: 6 }}>
                {memberSince}
              </span>
            </div>

            {/* Row 2 */}
            {member.company && (
              <div style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 28 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
                  EMPRESA
                </span>
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 400, marginTop: 6 }}>
                  {member.company}
                </span>
              </div>
            )}
            {member.job_title && (
              <div style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 28 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
                  CARGO
                </span>
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 400, marginTop: 6 }}>
                  {member.job_title}
                </span>
              </div>
            )}

            {/* Row 3 */}
            {member.role_type && (
              <div style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 28 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
                  ROL
                </span>
                <span style={{ fontSize: 20, color: "#E87B1E", fontWeight: 400, marginTop: 6 }}>
                  {member.role_type}
                </span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ display: "flex", flex: 1 }} />

          {/* QR Code (bottom, centered — matching Wallet barcode position) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 40px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 14,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                width={200}
                height={200}
                alt="QR"
                style={{ borderRadius: 8 }}
              />
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 10, letterSpacing: 2 }}>
              {member.member_number}
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 40px 20px",
            }}
          >
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} Cyber Social Club
            </span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: NO_REFERRER_HEADERS,
      }
    );
  } catch (err) {
    console.error("[credential/image] Error:", err instanceof Error ? `${err.message}\n${err.stack}` : err);
    return new Response("Error generando credencial", { status: 500, headers: NO_REFERRER_HEADERS });
  }
}
