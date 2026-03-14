import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";

// Credit-card proportions: 85.6mm × 53.98mm ≈ 1.586 ratio
// Using 1012 × 638 px (2x for retina)
const WIDTH = 1012;
const HEIGHT = 638;

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar";
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new Response("Token requerido", { status: 400 });
    }

    const { data: member, error } = await getSupabaseAdmin()
      .from("members")
      .select("member_number, full_name, company, job_title, role_type, status, created_at, credential_token_expires_at")
      .eq("credential_token", token)
      .eq("status", "approved")
      .single();

    if (error || !member) {
      return new Response("Credencial no encontrada", { status: 404 });
    }

    if (member.credential_token_expires_at && new Date(member.credential_token_expires_at) < new Date()) {
      return new Response("Link expirado", { status: 410 });
    }

    // Generate QR as PNG data URL (more compatible with Satori than SVG)
    const verifyUrl = `${getAppUrl()}/api/verify?member=${member.member_number}`;
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#E87B1E", light: "#0A0A0A" },
      });
    } catch (e) {
      console.error("[credential/image] QR generation failed:", e);
    }

    const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            backgroundColor: "#0A0A0A",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#141211",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px 32px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 18, color: "#E87B1E", fontWeight: 700, letterSpacing: 4 }}>
                  CYBER SOCIAL CLUB
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 5, marginTop: 2 }}>
                  WHERE CYBER MINDS CONNECT
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 3 }}>
                  MIEMBRO
                </span>
                <span style={{ fontSize: 36, color: "#E87B1E", fontWeight: 700, marginTop: 2 }}>
                  {member.member_number}
                </span>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                display: "flex",
                flex: 1,
                padding: "24px 32px",
                gap: 24,
              }}
            >
              {/* Left: Info */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 3 }}>
                  NOMBRE COMPLETO
                </span>
                <span style={{ fontSize: 24, color: "#FFFFFF", marginTop: 6, marginBottom: 24 }}>
                  {member.full_name}
                </span>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                  {member.company && (
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 140 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>
                        EMPRESA
                      </span>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                        {member.company}
                      </span>
                    </div>
                  )}
                  {member.job_title && (
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 140 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>
                        CARGO
                      </span>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                        {member.job_title}
                      </span>
                    </div>
                  )}
                  {member.role_type && (
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 100 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>
                        ROL
                      </span>
                      <span style={{ fontSize: 14, color: "rgba(232,123,30,0.7)", marginTop: 4 }}>
                        {member.role_type}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 120 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>
                      MIEMBRO DESDE
                    </span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                      {memberSince}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: QR */}
              {qrDataUrl && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "#0A0A0A",
                      borderRadius: 16,
                      padding: 12,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} width={130} height={130} />
                  </div>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: 3, marginTop: 8 }}>
                    ESCANEÁ PARA VERIFICAR
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 32px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
                © {new Date().getFullYear()} Cyber Social Club
              </span>
              <div
                style={{
                  display: "flex",
                  backgroundColor: "rgba(74,222,128,0.1)",
                  borderRadius: 50,
                  padding: "4px 14px",
                }}
              >
                <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, letterSpacing: 2 }}>
                  ACTIVO
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      }
    );
  } catch (err) {
    console.error("[credential/image] Error:", err instanceof Error ? `${err.message}\n${err.stack}` : err);
    return new Response("Error generando credencial", { status: 500 });
  }
}
