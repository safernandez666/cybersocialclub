import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSecurityHeaders } from "@/lib/auth-utils";
import { validateAdminAuth } from "@/lib/admin-session";

function getSigningKey(): string {
  const key = process.env.ADMIN_SECRET_KEY;
  if (!key) throw new Error("ADMIN_SECRET_KEY environment variable is required");
  return key;
}

function verifyApproveToken(memberId: string, token: string): boolean {
  let providedBuf: Buffer;
  try {
    providedBuf = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  const expected = createHmac("sha256", getSigningKey())
    .update(`quick-approve:${memberId}`)
    .digest();
  if (providedBuf.length !== expected.length) return false;
  return timingSafeEqual(providedBuf, expected);
}

/**
 * POST /api/admin/quick-approve/preview — read-only fetch of the member that
 * the HMAC token authorizes. Used by the /admin/quick-approve confirmation
 * page so it can render member info without putting the token in a query
 * string.
 *
 * Defense-in-depth: requires BOTH the HMAC token (proves the email link is
 * genuine) AND a valid admin session (proves the operator is logged in).
 * Either alone is insufficient.
 */
export async function POST(req: NextRequest) {
  const securityHeaders = getSecurityHeaders();

  // Layer 1: admin must be logged in.
  if (!validateAdminAuth(req.headers)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: securityHeaders });
  }

  let body: { id?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400, headers: securityHeaders });
  }

  const memberId = body.id;
  const token = body.token;

  if (!memberId || !token || typeof memberId !== "string" || typeof token !== "string") {
    return NextResponse.json({ error: "id y token son obligatorios" }, { status: 400, headers: securityHeaders });
  }

  // Layer 2: HMAC token from the email link must be valid.
  if (!verifyApproveToken(memberId, token)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401, headers: securityHeaders });
  }

  const supabase = getSupabaseAdmin();
  const { data: member, error } = await supabase
    .from("members")
    .select("id, full_name, email, company, job_title, role_type, linkedin_url, status, member_number, created_at")
    .eq("id", memberId)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404, headers: securityHeaders });
  }

  return NextResponse.json(
    {
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      company: member.company,
      job_title: member.job_title,
      role_type: member.role_type,
      linkedin_url: member.linkedin_url,
      status: member.status,
      already_approved: member.status === "approved",
      member_number: member.member_number ?? null,
      created_at: member.created_at,
    },
    { headers: securityHeaders },
  );
}
