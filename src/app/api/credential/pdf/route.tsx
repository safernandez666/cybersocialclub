import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";
import React from "react";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cybersocialclub.com.ar";

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
    padding: 32,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: 16,
  },
  clubName: {
    fontSize: 18,
    color: "#E87B1E",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  clubSub: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
    marginTop: 2,
    letterSpacing: 3,
  },
  memberLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  memberNumber: {
    fontSize: 28,
    color: "#E87B1E",
    fontWeight: "bold",
    marginTop: 4,
  },
  body: {
    flexDirection: "row",
    gap: 24,
  },
  info: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 2,
    marginTop: 12,
  },
  fieldValue: {
    fontSize: 13,
    color: "#FFFFFF",
  },
  qrContainer: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
  },
  qrLabel: {
    fontSize: 6,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 24,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "rgba(255,255,255,0.15)",
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(232,123,30,0.1)",
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 8,
    color: "#E87B1E",
    fontWeight: "bold",
    letterSpacing: 2,
  },
});

// GET /api/credential/pdf?token=xxx — returns PDF credential
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
    return NextResponse.json({ error: "Credencial no encontrada" }, { status: 404 });
  }

  const verifyUrl = `${APP_URL}/api/verify?member=${member.member_number}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#E87B1E", light: "#141211" },
  });

  const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const CredentialPDF = () => (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.clubName}>CYBER SOCIAL CLUB</Text>
              <Text style={styles.clubSub}>WHERE CYBER MINDS CONNECT</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.memberLabel}>MIEMBRO</Text>
              <Text style={styles.memberNumber}>{member.member_number}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.info}>
              <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
              <Text style={styles.fieldValue}>{member.full_name}</Text>

              {member.company && (
                <>
                  <Text style={styles.fieldLabel}>EMPRESA</Text>
                  <Text style={styles.fieldValue}>{member.company}</Text>
                </>
              )}

              {member.job_title && (
                <>
                  <Text style={styles.fieldLabel}>CARGO</Text>
                  <Text style={styles.fieldValue}>{member.job_title}</Text>
                </>
              )}

              {member.role_type && (
                <>
                  <Text style={styles.fieldLabel}>ROL</Text>
                  <Text style={styles.fieldValue}>{member.role_type}</Text>
                </>
              )}

              <Text style={styles.fieldLabel}>MIEMBRO DESDE</Text>
              <Text style={styles.fieldValue}>{memberSince}</Text>
            </View>

            <View style={styles.qrContainer}>
              <Image src={qrDataUrl} style={styles.qrImage} />
              <Text style={styles.qrLabel}>ESCANEAR PARA VERIFICAR</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} CYBER SOCIAL CLUB
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
    },
  });
}
