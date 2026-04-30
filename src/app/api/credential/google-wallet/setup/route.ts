import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/credential/google-wallet/setup
 *
 * One-time admin endpoint to create the Google Wallet Generic Class.
 * Must be called before any member can add a pass to Google Wallet.
 *
 * Requires: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_KEY env vars.
 * Protected by: ADMIN_SECRET header check.
 */

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
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed as ServiceAccountKey;
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

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const jwt = signJwt(claims, sa.private_key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(req: NextRequest) {
  // Simple auth: require admin secret header
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const sa = getServiceAccountKey();

  if (!issuerId || !sa) {
    return NextResponse.json(
      { error: "Missing GOOGLE_WALLET_ISSUER_ID or GOOGLE_WALLET_SERVICE_ACCOUNT_KEY" },
      { status: 503 }
    );
  }

  const classId = `${issuerId}.csc-membership`;
  const appUrl = getAppUrl();

  // Generic Class definition
  const classPayload = {
    id: classId,
    issuerName: "Cyber Social Club",
    reviewStatus: "UNDER_REVIEW",
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['member_number']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['member_since']" }],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['company']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['job_title']" }],
                },
              },
            },
          },
        ],
      },
    },
    linksModuleData: {
      uris: [
        {
          uri: appUrl,
          description: "Cyber Social Club",
          id: "website",
        },
      ],
    },
  };

  try {
    // Step 1: Get access token
    console.info(`[wallet-setup] Getting access token...`);
    const accessToken = await getAccessToken(sa);
    console.info("[wallet-setup] Access token obtained");

    // Step 2: Check if class already exists
    console.info(`[wallet-setup] Checking if class ${classId} exists...`);
    const getRes = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${classId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (getRes.ok) {
      const existing = await getRes.json();
      console.info(`[wallet-setup] Class already exists: ${classId}`);
      return NextResponse.json({
        status: "already_exists",
        classId,
        reviewStatus: existing.reviewStatus,
        message: "Wallet class already exists. No action needed.",
      });
    }

    // Step 3: Create class
    console.info(`[wallet-setup] Creating class ${classId}...`);
    const createRes = await fetch(
      "https://walletobjects.googleapis.com/walletobjects/v1/genericClass",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classPayload),
      }
    );

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error(`[wallet-setup] Class creation failed:`, JSON.stringify(createData));
      return NextResponse.json(
        {
          error: "Failed to create wallet class",
          details: createData,
        },
        { status: createRes.status }
      );
    }

    console.info(`[wallet-setup] Class created successfully: ${classId}`);
    return NextResponse.json({
      status: "created",
      classId,
      reviewStatus: createData.reviewStatus,
      message: "Wallet class created. Passes can now be issued.",
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[wallet-setup] Error: ${errMsg}`);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
