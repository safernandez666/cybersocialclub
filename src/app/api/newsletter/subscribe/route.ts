import { type NextRequest, NextResponse } from "next/server";
import { withAxiom, AxiomRequest } from "next-axiom";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ── CORS ──
const ALLOWED_ORIGINS = [
  "https://cybersocialclub.com.ar",
  "https://www.cybersocialclub.com.ar",
  "http://localhost:3000", // local dev
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// ── Rate limiting (5 per IP per minute) ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 1000 };

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")?.pop()?.trim() ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT.maxRequests;
}

// Clean expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 60 * 1000);

// ── Email validation ──
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LEN = 255;

function sanitizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase().slice(0, EMAIL_MAX_LEN);
  return EMAIL_RE.test(trimmed) ? trimmed : null;
}

// ── Preflight ──
export const OPTIONS = withAxiom(async (req: AxiomRequest) => {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
});

// ── Subscribe ──
export const POST = withAxiom(async (req: AxiomRequest) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);
  const ip = getClientIp(req);

  // Rate limit
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en un minuto." },
      { status: 429, headers: cors }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400, headers: cors }
    );
  }

  // Validate email
  const email = sanitizeEmail(body.email);
  if (!email) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400, headers: cors }
    );
  }

  // Upsert into Supabase — idempotent (duplicate email → no error)
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email, status: "active" },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (error) {
    req.log.error("[newsletter] Insert error:", { error: error.message });
    return NextResponse.json(
      { error: "Error al suscribirse. Intentá de nuevo." },
      { status: 500, headers: cors }
    );
  }

  return NextResponse.json(
    { success: true, message: "¡Gracias por suscribirte!" },
    { status: 201, headers: cors }
  );
});
