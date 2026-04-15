import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: { pattern: RegExp; maxRequests: number; windowMs: number }[] = [
  { pattern: /^\/api\/admin\//, maxRequests: 100, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/credential\//, maxRequests: 10, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/verify-email/, maxRequests: 10, windowMs: 15 * 60 * 1000 },
  // OAuth callback — strict limit (Male review S10: 5/15min)
  { pattern: /^\/auth\/callback/, maxRequests: 5, windowMs: 15 * 60 * 1000 },
  // Login — 10/15min (spec + security review)
  { pattern: /^\/api\/auth\/login/, maxRequests: 10, windowMs: 15 * 60 * 1000 },
  // Claim account — strict 3/15min (prevent email spam)
  { pattern: /^\/api\/auth\/claim\/verify/, maxRequests: 5, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/auth\/claim\/complete/, maxRequests: 5, windowMs: 15 * 60 * 1000 },
  { pattern: /^\/api\/auth\/claim/, maxRequests: 3, windowMs: 15 * 60 * 1000 },
  // Complete profile — 10/15min
  { pattern: /^\/api\/members\/complete-profile/, maxRequests: 10, windowMs: 15 * 60 * 1000 },
  // Newsletter — 5/min (also enforced in route handler)
  { pattern: /^\/api\/newsletter\//, maxRequests: 5, windowMs: 60 * 1000 },
  // Member API
  { pattern: /^\/api\/me/, maxRequests: 30, windowMs: 60 * 1000 },
];

// Special: POST /api/members (registration) has a stricter limit
const MEMBERS_POST_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

// Routes that require an authenticated socio session
const PROTECTED_MEMBER_ROUTES = ["/complete-profile", "/pending-approval", "/my-profile"];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")?.pop()?.trim() ||
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

export async function middleware(req: NextRequest) {
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

  // Protect member routes — require Supabase session
  if (PROTECTED_MEMBER_ROUTES.some((r) => pathname.startsWith(r))) {
    const res = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/credential/:path*",
    "/api/verify-email",
    "/api/members",
    "/api/me",
    "/api/auth/:path*",
    "/auth/callback",
    "/api/credential/:path*",
    "/api/members/complete-profile",
    "/api/newsletter/:path*",
    "/complete-profile",
    "/pending-approval",
    "/my-profile",
  ],
};
