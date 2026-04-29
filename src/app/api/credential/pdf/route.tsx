import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import React from "react";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  NO_REFERRER_HEADERS,
  lookupCredentialByToken,
  readCredentialTokenFromBody,
} from "@/lib/credential-token";

function getAppUrl() { return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar"; }

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0A0A0A",
    padding: 0,
    fontFamily: "Courier",
  },
  card: {
    margin: 40,
    backgroundColor: "#141211",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  clubName: {
    fontSize: 10,
    color: "#E87B1E",
    fontWeight: "bold",
    letterSpacing: 3,
  },
  clubSub: {
    fontSize: 6,
    color: "rgba(255,255,255,0.2)",
    marginTop: 2,
    letterSpacing: 4,
  },
  memberLabel: {
    fontSize: 6,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "right",
  },
  memberNumber: {
    fontSize: 22,
    color: "#E87B1E",
    fontWeight: "bold",
    marginTop: 2,
  },
  // Body
  body: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  fullNameLabel: {
    fontSize: 6,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  fullName: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 20,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  fieldBox: {
    width: "48%",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 6,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  fieldValueHighlight: {
    fontSize: 10,
    color: "rgba(232,123,30,0.7)",
  },
  // QR Section
  qrSection: {
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingVertical: 24,
  },
  qrBox: {
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    padding: 12,
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrLabel: {
    fontSize: 6,
    color: "rgba(255,255,255,0.15)",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 6,
    color: "rgba(255,255,255,0.15)",
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 7,
    color: "#4ade80",
    fontWeight: "bold",
    letterSpacing: 2,
  },
});

/**
 * GET /api/credential/pdf — deprecated. Old form took token in query string,
 * which leaked via referrers/access logs. Replaced by POST.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Volvé a abrir el link desde el email." },
    { status: 410, headers: NO_REFERRER_HEADERS },
  );
}

// POST /api/credential/pdf — body { token } → application/pdf
export async function POST(req: NextRequest) {
  const token = await readCredentialTokenFromBody(req);
  const lookup = await lookupCredentialByToken(token);
  if (!lookup.ok) {
    return NextResponse.json({ error: lookup.error }, { status: lookup.status, headers: NO_REFERRER_HEADERS });
  }
  const { member } = lookup;

  const verifyUrl = `${getAppUrl()}/api/verify?member=${member.member_number}`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 1,
      color: { dark: "#E87B1E", light: "#141211" },
    });
  } catch {
    const svgString = await QRCode.toString(verifyUrl, {
      type: "svg",
      width: 300,
      margin: 1,
      color: { dark: "#E87B1E", light: "#141211" },
    });
    qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString("base64")}`;
  }

  const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const CredentialPDF = () => (
    <Document>
      <Page size="A5" orientation="portrait" style={styles.page}>
        <View style={styles.card}>
          {/* Header — matches online: club name left, member number right */}
          <View style={styles.header}>
            <View>
              <Text style={styles.clubName}>CYBER SOCIAL CLUB</Text>
              <Text style={styles.clubSub}>WHERE CYBER MINDS CONNECT</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.memberLabel}>Miembro</Text>
              <Text style={styles.memberNumber}>{member.member_number}</Text>
            </View>
          </View>

          {/* Body — matches online: full name then 2-col grid */}
          <View style={styles.body}>
            <Text style={styles.fullNameLabel}>Nombre completo</Text>
            <Text style={styles.fullName}>{member.full_name}</Text>

            <View style={styles.fieldsRow}>
              {member.company && (
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Empresa</Text>
                  <Text style={styles.fieldValue}>{member.company}</Text>
                </View>
              )}

              {member.job_title && (
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Cargo</Text>
                  <Text style={styles.fieldValue}>{member.job_title}</Text>
                </View>
              )}

              {member.role_type && (
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Rol</Text>
                  <Text style={styles.fieldValueHighlight}>{member.role_type}</Text>
                </View>
              )}

              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Miembro desde</Text>
                <Text style={styles.fieldValue}>{memberSince}</Text>
              </View>
            </View>
          </View>

          {/* QR — matches online: centered below info */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <Image src={qrDataUrl} style={styles.qrImage} />
            </View>
            <Text style={styles.qrLabel}>Escaneá para verificar</Text>
          </View>

          {/* Footer — matches online: copyright + Activo badge */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Cyber Social Club
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ACTIVO</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(<CredentialPDF />);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="CSC-Credential-${member.member_number}.pdf"`,
      ...NO_REFERRER_HEADERS,
    },
  });
}
