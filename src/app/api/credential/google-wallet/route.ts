import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://socios.cybersocialclub.com.ar"
  );
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function getServiceAccountKey(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccountKey;
  } catch {
    return null;
  }
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwt(payload: Record<string, unknown>, privateKey: string): string {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey);

  return `${signingInput}.${base64url(signature)}`;
}

function buildPassObject(
  issuerId: string,
  member: {
    member_number: string;
    full_name: string;
    company: string | null;
    job_title: string | null;
    role_type: string | null;
    created_at: string;
  },
  verifyUrl: string
) {
  const objectId = `${issuerId}.csc-member-${member.member_number.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

  const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const textModulesData = [
    { id: "member_number", header: "N. MIEMBRO", body: member.member_number },
    { id: "full_name", header: "NOMBRE COMPLETO", body: member.full_name },
  ];

  if (member.company) {
    textModulesData.push({ id: "company", header: "EMPRESA", body: member.company });
  }
  if (member.job_title) {
    textModulesData.push({ id: "job_title", header: "CARGO", body: member.job_title });
  }
  if (member.role_type) {
    textModulesData.push({ id: "role_type", header: "ROL", body: member.role_type });
  }
  textModulesData.push({ id: "member_since", header: "MIEMBRO DESDE", body: memberSince });

  return {
    id: objectId,
    classId: `${issuerId}.csc-membership`,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    hexBackgroundColor: "#141211",
    logo: {
      sourceUri: {
        uri: `${getAppUrl()}/icon-192.png`,
      },
      contentDescription: {
        defaultValue: { language: "es-AR", value: "Cyber Social Club" },
      },
    },
    cardTitle: {
      defaultValue: { language: "es-AR", value: "Cyber Social Club" },
    },
    subheader: {
      defaultValue: { language: "es-AR", value: "MIEMBRO" },
    },
    header: {
      defaultValue: { language: "es-AR", value: member.full_name },
    },
    textModulesData,
    barcode: {
      type: "QR_CODE",
      value: verifyUrl,
      alternateText: member.member_number,
    },
    heroImage: {
      sourceUri: {
        uri: `${getAppUrl()}/csc-banner.png`,
      },
      contentDescription: {
        defaultValue: { language: "es-AR", value: "CSC Banner" },
      },
    },
  };
}

// GET /api/credential/google-wallet?token=xxx — returns Google Wallet "Add" URL
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  // Validate environment
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const serviceAccountKey = getServiceAccountKey();

  if (!issuerId || !serviceAccountKey) {
    console.error("[google-wallet] Missing GOOGLE_WALLET_ISSUER_ID or GOOGLE_WALLET_SERVICE_ACCOUNT_KEY");
    return NextResponse.json(
      { error: "Google Wallet not configured" },
      { status: 503 }
    );
  }

  // Fetch member
  const { data: member, error } = await getSupabaseAdmin()
    .from("members")
    .select(
      "member_number, full_name, company, job_title, role_type, status, created_at, credential_token_expires_at"
    )
    .eq("credential_token", token)
    .eq("status", "approved")
    .single();

  if (error || !member) {
    return NextResponse.json(
      { error: "Credencial no encontrada o inválida" },
      { status: 404 }
    );
  }

  // Check token expiration
  if (
    member.credential_token_expires_at &&
    new Date(member.credential_token_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "Credential link expired. Contact admin." },
      { status: 410 }
    );
  }

  const verifyUrl = `${getAppUrl()}/api/verify?member=${member.member_number}`;

  // Build the pass object
  const passObject = buildPassObject(issuerId, member, verifyUrl);

  // Create a signed JWT for the "Save to Google Wallet" link
  const claims = {
    iss: serviceAccountKey.client_email,
    aud: "google",
    origins: [getAppUrl()],
    typ: "savetowallet",
    payload: {
      genericObjects: [passObject],
    },
  };

  try {
    const signedJwt = signJwt(claims, serviceAccountKey.private_key);
    const walletUrl = `https://pay.google.com/gp/v/save/${signedJwt}`;
    return NextResponse.json({ url: walletUrl });
  } catch (err) {
    console.error("[google-wallet] JWT signing failed:", err);
    return NextResponse.json(
      { error: "Failed to generate wallet pass" },
      { status: 500 }
    );
  }
}
