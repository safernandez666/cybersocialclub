import { NextRequest, NextResponse } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: { pattern: RegExp; maxRequests: number; windowMs: number }[] = [
  { pattern: /^\/api\/admin\//, maxRequests: 100, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/credential\//, maxRequests: 10, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/verify-email/, maxRequests: 10, windowMs: 15 * 60 * 1000 },
];

// Special: POST /api/members (registration) has a stricter limit
const MEMBERS_POST_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // Check POST /api/members specifically
  if (pathname === "/api/members" && req.method === "POST") {
    const key = `members-post:${ip}`;
    if (isRateLimited(key, MEMBERS_POST_LIMIT.maxRequests, MEMBERS_POST_LIMIT.windowMs)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.next();
  }

  // Check pattern-based rate limits
  for (const { pattern, maxRequests, windowMs } of RATE_LIMITS) {
    if (pattern.test(pathname)) {
      const key = `${pathname}:${ip}`;
      if (isRateLimited(key, maxRequests, windowMs)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/credential/:path*", "/api/verify-email", "/api/members"],
};
