import { createHmac, randomBytes } from "crypto";

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSigningKey(): string {
  return process.env.ADMIN_SECRET_KEY || "fallback-key";
}

function sign(payload: string): string {
  return createHmac("sha256", getSigningKey()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const nonce = randomBytes(8).toString("hex");
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload = `${nonce}.${exp}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [nonce, expStr, sig] = parts;
  const payload = `${nonce}.${expStr}`;

  // Verify signature
  const expected = sign(payload);
  if (sig !== expected) return false;

  // Check expiration
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;

  return true;
}

/**
 * Validate admin auth from request headers.
 * Accepts either a session token (x-admin-token) or legacy admin key (x-admin-key).
 * Returns true if authorized.
 */
export function validateAdminAuth(headers: Headers): boolean {
  // Prefer session token (MFA-authenticated)
  const sessionToken = headers.get("x-admin-token");
  if (sessionToken && verifySessionToken(sessionToken)) return true;

  // Fall back to admin key (backward compat — will be removed later)
  const adminKey = headers.get("x-admin-key");
  if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) return true;

  return false;
}
