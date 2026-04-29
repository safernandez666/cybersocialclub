import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type CredentialTokenError =
  | { kind: "missing"; status: 400; error: string }
  | { kind: "not_found"; status: 404; error: string }
  | { kind: "expired"; status: 410; error: string };

export interface CredentialMember {
  member_number: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  status: string;
  created_at: string;
  credential_token_expires_at: string | null;
}

export type CredentialLookup =
  | { ok: true; member: CredentialMember }
  | { ok: false } & CredentialTokenError;

/**
 * Read a token from a JSON request body. POST-only — query strings are
 * disallowed for credential endpoints to prevent token leakage in URLs.
 */
export async function readCredentialTokenFromBody(req: Request): Promise<string | null> {
  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return null;
  }
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token || token.length > 256) return null;
  return token;
}

export async function lookupCredentialByToken(token: string | null): Promise<CredentialLookup> {
  if (!token) {
    return { ok: false, kind: "missing", status: 400, error: "Token requerido" };
  }

  const { data: member, error } = await getSupabaseAdmin()
    .from("members")
    .select("member_number, full_name, company, job_title, role_type, status, created_at, credential_token_expires_at")
    .eq("credential_token", token)
    .eq("status", "approved")
    .single();

  if (error || !member) {
    return { ok: false, kind: "not_found", status: 404, error: "Credencial no encontrada o inválida" };
  }

  if (member.credential_token_expires_at && new Date(member.credential_token_expires_at) < new Date()) {
    return { ok: false, kind: "expired", status: 410, error: "Credential link expired. Contact admin." };
  }

  return { ok: true, member: member as CredentialMember };
}

export const NO_REFERRER_HEADERS: Record<string, string> = {
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};
