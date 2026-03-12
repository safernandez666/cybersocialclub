import * as OTPAuth from "otpauth";

const ISSUER = "CyberSocialClub";
const LABEL = "Admin";

function getSecret(): string {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) throw new Error("ADMIN_TOTP_SECRET not configured");
  return secret;
}

export function verifyTOTP(token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(getSecret()),
  });

  // Allow 1 period window (30s before/after)
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function generateSetupURI(): { uri: string; secret: string } {
  const existingSecret = process.env.ADMIN_TOTP_SECRET;
  const secret = existingSecret
    ? OTPAuth.Secret.fromBase32(existingSecret)
    : new OTPAuth.Secret({ size: 20 });

  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    uri: totp.toString(),
    secret: secret.base32,
  };
}
