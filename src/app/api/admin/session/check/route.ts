import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth } from "@/lib/admin-session";
import { getSecurityHeaders } from "@/lib/auth-utils";

/**
 * GET /api/admin/session/check — lightweight endpoint that returns 200 if
 * the admin session token (in `x-admin-token` header) is valid, 401
 * otherwise. Used by admin pages on mount to validate a sessionStorage-
 * hydrated token before rendering the admin UI — without this check, an
 * expired token (>1h server-side TTL) would render an admin page that
 * silently 401s every action.
 *
 * Read-only, no DB I/O, no PII in response.
 */
export async function GET(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();
  if (!validateAdminAuth(req.headers)) {
    return NextResponse.json({ valid: false }, { status: 401, headers: securityHeaders });
  }
  return NextResponse.json({ valid: true }, { headers: securityHeaders });
}
