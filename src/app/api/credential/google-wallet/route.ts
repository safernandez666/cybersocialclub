import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";
import { NO_REFERRER_HEADERS, readCredentialTokenFromBody } from "@/lib/credential-token";

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

function getServiceAccountKey(): { key: ServiceAccountKey } | { error: string } {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  if (!raw) return { error: "GOOGLE_WALLET_SERVICE_ACCOUNT_KEY not set" };
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "GOOGLE_WALLET_SERVICE_ACCOUNT_KEY is not valid JSON" };
  }
  if (!parsed.client_email || typeof parsed.client_email !== "string") {
    return { error: "Service account key missing client_email" };
  }
  if (!parsed.private_key || typeof parsed.private_key !== "string") {
    return { error: "Service account key missing private_key" };
  }
  if (!parsed.private_key.includes("BEGIN PRIVATE KEY")) {
    return { error: "Service account private_key has invalid format (expected PEM)" };
  }
  return { key: parsed as unknown as ServiceAccountKey };
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

/**
 * GET /api/credential/google-wallet — deprecated. Old form took token in
 * query string. Replaced by POST.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Este flujo fue actualizado. Volvé a abrir el link desde el email." },
    { status: 410, headers: NO_REFERRER_HEADERS },
  );
}

// POST /api/credential/google-wallet — body { token } → { url }
export async function POST(req: NextRequest) {
  const token = await readCredentialTokenFromBody(req);
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400, headers: NO_REFERRER_HEADERS });
  }

  // Validate environment with detailed diagnostics
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!issuerId) {
    console.error("[google-wallet] GOOGLE_WALLET_ISSUER_ID not set");
    return NextResponse.json({ error: "Google Wallet not configured" }, { status: 503, headers: NO_REFERRER_HEADERS });
  }
  if (!/^\d+$/.test(issuerId)) {
    console.error(`[google-wallet] GOOGLE_WALLET_ISSUER_ID has invalid format: "${issuerId}" (expected numeric)`);
    return NextResponse.json({ error: "Google Wallet misconfigured" }, { status: 503, headers: NO_REFERRER_HEADERS });
  }

  const saResult = getServiceAccountKey();
  if ("error" in saResult) {
    console.error(`[google-wallet] Service account validation failed: ${saResult.error}`);
    return NextResponse.json({ error: "Google Wallet not configured" }, { status: 503, headers: NO_REFERRER_HEADERS });
  }
  const serviceAccountKey = saResult.key;

  console.info(`[google-wallet] Config OK — issuer: ${issuerId}, sa: ${serviceAccountKey.client_email}`);

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
      { status: 404, headers: NO_REFERRER_HEADERS }
    );
  }

  // Check token expiration
  if (
    member.credential_token_expires_at &&
    new Date(member.credential_token_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "Credential link expired. Contact admin." },
      { status: 410, headers: NO_REFERRER_HEADERS }
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

  // Log pass details for debugging
  const appUrl = getAppUrl();
  console.info(`[google-wallet] Building pass — member: ${member.member_number}, class: ${issuerId}.csc-membership`);
  console.info(`[google-wallet] Image URLs — logo: ${appUrl}/icon-192.png, hero: ${appUrl}/csc-banner.png`);

  try {
    const signedJwt = signJwt(claims, serviceAccountKey.private_key);
    const jwtParts = signedJwt.split(".");
    console.info(`[google-wallet] JWT signed OK — ${jwtParts.length} parts, length: ${signedJwt.length}`);

    const walletUrl = `https://pay.google.com/gp/v/save/${signedJwt}`;
    return NextResponse.json({ url: walletUrl }, { headers: NO_REFERRER_HEADERS });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error(`[google-wallet] JWT signing failed: ${errMsg}`);
    if (errStack) console.error(`[google-wallet] Stack: ${errStack}`);
    console.error(`[google-wallet] SA email: ${serviceAccountKey.client_email}`);
    return NextResponse.json(
      { error: "Failed to generate wallet pass" },
      { status: 500, headers: NO_REFERRER_HEADERS }
    );
  }
}
