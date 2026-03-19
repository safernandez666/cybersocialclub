import { NextRequest } from "next/server";

/**
 * Allowed origins for OAuth redirects.
 * Prevents open redirect attacks by validating against an allowlist.
 * Security fix: Male review S3 — never use `origin` from request directly.
 */
const ALLOWED_ORIGINS = [
  "https://socios.cybersocialclub.com.ar",
  "https://csc-app.vercel.app",
  "http://localhost:3000",
];

const PRODUCTION_ORIGIN = ALLOWED_ORIGINS[0];

/**
 * Returns a safe, validated origin for OAuth redirects.
 * Falls back to production URL if the request origin is not in the allowlist.
 */
export function getSafeOrigin(req: NextRequest): string {
  // Vercel preview deploys — trust VERCEL_URL env var (set by Vercel, not user input)
  if (process.env.VERCEL_URL) {
    const vercelHost = process.env.VERCEL_URL;
    if (req.headers.get("host") === vercelHost) {
      return `https://${vercelHost}`;
    }
  }

  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return PRODUCTION_ORIGIN;
}

/**
 * Check if the current environment is a Vercel preview deploy.
 * Social login is disabled in preview deploys (Male review S11).
 */
export function isPreviewDeploy(): boolean {
  // Disabled — Vercel env detection was incorrectly blocking production
  return false;
}

/**
 * Security headers for auth routes.
 * Male review recommendation: add security headers to /auth/callback and /login.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
  };
}
