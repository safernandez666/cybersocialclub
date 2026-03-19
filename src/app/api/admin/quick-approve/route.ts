import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createHmac } from "crypto";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail } from "@/lib/email";

function getSigningKey(): string {
  return process.env.ADMIN_SECRET_KEY || "fallback-key";
}

/** Verify HMAC token: sign(memberId) must match */
function verifyApproveToken(memberId: string, token: string): boolean {
  const expected = createHmac("sha256", getSigningKey())
    .update(`quick-approve:${memberId}`)
    .digest("hex");
  return token === expected;
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar";

  if (!memberId || !token) {
    return NextResponse.redirect(new URL("/admin?error=invalid_link", appUrl));
  }

  if (!verifyApproveToken(memberId, token)) {
    return NextResponse.redirect(new URL("/admin?error=invalid_token", appUrl));
  }

  const supabase = getSupabaseAdmin();

  // Get member
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (fetchError || !member) {
    return NextResponse.redirect(new URL("/admin?error=member_not_found", appUrl));
  }

  // Already approved
  if (member.status === "approved") {
    return new NextResponse(
      quickResponsePage("Ya aprobado", `${member.full_name} ya está aprobado como ${member.member_number}.`, appUrl),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Only approve pending members
  if (member.status !== "pending") {
    return new NextResponse(
      quickResponsePage("No se puede aprobar", `${member.full_name} tiene estado "${member.status}". Solo se pueden aprobar miembros pendientes.`, appUrl),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Generate member number (find max existing to avoid duplicates)
  const { data: lastMember } = await supabase
    .from("members")
    .select("member_number")
    .not("member_number", "is", null)
    .order("member_number", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastMember?.member_number) {
    const match = lastMember.member_number.match(/CSC-(\d+)/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }
  const memberNumber = `CSC-${String(nextNumber).padStart(4, "0")}`;
  const credentialToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("members")
    .update({
      status: "approved",
      member_number: memberNumber,
      credential_token: credentialToken,
      credential_token_expires_at: expiresAt,
    })
    .eq("id", memberId);

  if (updateError) {
    return new NextResponse(
      quickResponsePage("Error", "No se pudo aprobar al miembro. Intentá desde el panel de admin.", appUrl),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Send approval email in background
  after(async () => {
    try {
      await sendApprovalEmail(member.email, member.full_name, memberNumber, credentialToken);
      await supabase
        .from("members")
        .update({ credential_email_sent_at: new Date().toISOString() })
        .eq("id", memberId);
    } catch (emailError) {
      console.error("[quick-approve] Failed to send approval email:", emailError);
    }
  });

  return new NextResponse(
    quickResponsePage(
      "Aprobado",
      `${member.full_name} fue aprobado como ${memberNumber}. Se le envió el email con su credencial.`,
      appUrl
    ),
    { headers: { "Content-Type": "text/html" } }
  );
}

function quickResponsePage(title: string, message: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — CSC Admin</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
<div style="max-width:440px;margin:0 auto;padding:40px 24px;text-align:center;">
  <h1 style="color:#E87B1E;font-size:24px;margin:0 0 8px;">Cyber Social Club</h1>
  <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:0 0 32px;">Panel de Administración</p>
  <div style="background:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
    <h2 style="color:#fff;font-size:20px;margin:0 0 12px;">${title}</h2>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">${message}</p>
    <a href="${appUrl}/admin" style="display:inline-block;background:#E87B1E;color:#fff;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:600;">Ir al Panel</a>
  </div>
</div></body></html>`;
}
