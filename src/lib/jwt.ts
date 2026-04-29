import { createHmac, timingSafeEqual } from "crypto";

export class JwtError extends Error {
  constructor(public reason: "malformed" | "bad_signature" | "expired" | "wrong_purpose") {
    super(reason);
  }
}

// Eagerly validated at module load — Facu/Male reco: fail at boot, not on
// the first request. If CLAIM_JWT_SECRET is missing/short, the import
// throws and Next refuses to mount any route that uses this module.
//
// Do NOT fall back to ADMIN_SECRET_KEY: a claim-JWT secret compromise must
// not also compromise admin HMAC operations.
const CLAIM_SECRET: string = (() => {
  const secret = process.env.CLAIM_JWT_SECRET;
  if (!secret) throw new Error("CLAIM_JWT_SECRET environment variable is required");
  if (secret.length < 32) throw new Error("CLAIM_JWT_SECRET must be at least 32 characters");
  return secret;
})();

function base64urlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

export interface ClaimJwtPayload {
  sub: string;
  jti: string;
  email: string;
  purpose: "claim";
  iat: number;
  exp: number;
}

export function signClaimJwt(payload: Omit<ClaimJwtPayload, "iat" | "exp" | "purpose">, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const full: ClaimJwtPayload = {
    ...payload,
    purpose: "claim",
    iat: now,
    exp: now + ttlSeconds,
  };
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(full));
  const signingInput = `${header}.${body}`;
  const signature = createHmac("sha256", CLAIM_SECRET).update(signingInput).digest();
  return `${signingInput}.${base64urlEncode(signature)}`;
}

export function verifyClaimJwt(token: string): ClaimJwtPayload {
  if (typeof token !== "string" || token.length > 2048) throw new JwtError("malformed");
  const parts = token.split(".");
  if (parts.length !== 3) throw new JwtError("malformed");
  const [headerB64, bodyB64, sigB64] = parts;

  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString("utf8"));
  } catch {
    throw new JwtError("malformed");
  }
  if (header.alg !== "HS256" || header.typ !== "JWT") throw new JwtError("malformed");

  const expected = createHmac("sha256", CLAIM_SECRET).update(`${headerB64}.${bodyB64}`).digest();
  let provided: Buffer;
  try {
    provided = base64urlDecode(sigB64);
  } catch {
    throw new JwtError("malformed");
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new JwtError("bad_signature");
  }

  let payload: ClaimJwtPayload;
  try {
    payload = JSON.parse(base64urlDecode(bodyB64).toString("utf8"));
  } catch {
    throw new JwtError("malformed");
  }

  if (payload.purpose !== "claim") throw new JwtError("wrong_purpose");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new JwtError("expired");
  if (typeof payload.sub !== "string" || typeof payload.jti !== "string" || typeof payload.email !== "string") {
    throw new JwtError("malformed");
  }
  return payload;
}
