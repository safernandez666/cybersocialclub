import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SESSION_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

function getSigningKey(): string {
  const key = process.env.ADMIN_SECRET_KEY;
  if (!key) throw new Error("ADMIN_SECRET_KEY environment variable is required");
  return key;
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

  // Verify signature (timing-safe comparison)
  const expected = sign(payload);
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false;

  // Check expiration
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;

  return true;
}

/**
 * Validate admin auth from request headers.
 * Requires a valid MFA-authenticated session token (x-admin-token).
 */
export function validateAdminAuth(headers: Headers): boolean {
  // Prefer session token (MFA-authenticated)
  const sessionToken = headers.get("x-admin-token");
  if (sessionToken && verifySessionToken(sessionToken)) return true;

  return false;
}
