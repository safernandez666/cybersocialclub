import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import nodemailer from "nodemailer";

// ── Rate limiting (3 submits per IP per 15 min) ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 3, windowMs: 15 * 60 * 1000 };

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
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

// ── Validation ──
const TEXT_MAX = 2000;
const EMAIL_MAX = 255;
const ARRAY_MAX_ITEMS = 20;
const ARRAY_ITEM_MAX = 200;

function trimText(val: unknown, max: number): string | null {
  if (val == null || typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}

function validateJsonArray(val: unknown): string[] | null {
  if (!Array.isArray(val)) return null;
  const cleaned = val
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, ARRAY_ITEM_MAX))
    .slice(0, ARRAY_MAX_ITEMS);
  return cleaned.length > 0 ? cleaned : null;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados envíos. Intentá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Sanitize and validate
  const q1 = trimText(body.q1, TEXT_MAX);
  const q2 = validateJsonArray(body.q2);
  const q3 = trimText(body.q3, TEXT_MAX);
  const q4 = trimText(body.q4, TEXT_MAX);
  const q5 = validateJsonArray(body.q5);
  const q6 = validateJsonArray(body.q6);
  const q7 = trimText(body.q7, TEXT_MAX);
  const q8 = trimText(body.q8, TEXT_MAX);
  const q9 = trimText(body.q9, TEXT_MAX);
  const q10 = trimText(body.q10, TEXT_MAX);
  const q11 = trimText(body.q11, EMAIL_MAX);

  // At least one answer required
  if (!q1 && !q2 && !q3 && !q4 && !q5 && !q6 && !q7 && !q8 && !q9 && !q10) {
    return NextResponse.json(
      { error: "Completá al menos una pregunta" },
      { status: 400 }
    );
  }

  // Basic email format check if provided
  if (q11 && !q11.includes("@")) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("survey_responses").insert({
    q1,
    q2: q2 ? JSON.stringify(q2) : null,
    q3,
    q4,
    q5: q5 ? JSON.stringify(q5) : null,
    q6: q6 ? JSON.stringify(q6) : null,
    q7,
    q8,
    q9,
    q10,
    q11,
    ip_address: ip,
    user_agent: req.headers.get("user-agent") || "unknown",
  });

  if (error) {
    console.error("[survey] Insert error:", error.message);
    return NextResponse.json(
      { error: "Error al guardar respuesta" },
      { status: 500 }
    );
  }

  // Send notification email to admin
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || "info@cybersocialclub.com.ar";
    const fromEmail = process.env.SMTP_FROM || "info@cybersocialclub.com.ar";

    const answeredCount = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10].filter(Boolean).length;

    await transporter.sendMail({
      from: `"Cyber Social Club" <${fromEmail}>`,
      to: adminEmail,
      subject: `📋 Nueva respuesta de encuesta CSC${q11 ? ` — ${q11}` : ""}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#E87B1E;font-size:24px;margin:0;">Cyber Social Club</h1>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:4px 0 0;">Survey — Nueva respuesta</p>
    </div>
    <div style="background-color:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 16px;">Nueva Encuesta Recibida</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${q7 ? `<tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Perfil</td><td style="color:#E87B1E;font-size:14px;font-weight:600;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${q7}</td></tr>` : ""}
        ${q11 ? `<tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Email</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${q11}</td></tr>` : ""}
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Preguntas respondidas</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${answeredCount} / 10</td></tr>
        ${q1 ? `<tr><td colspan="2" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0 0 4px;">Visión para la comunidad</p><p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;line-height:1.5;">${q1.slice(0, 300)}${q1.length > 300 ? "…" : ""}</p></td></tr>` : ""}
        ${q8 ? `<tr><td colspan="2" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0 0 4px;">Club ideal</p><p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;line-height:1.5;">${q8.slice(0, 300)}${q8.length > 300 ? "…" : ""}</p></td></tr>` : ""}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">Revisá todas las respuestas en el Supabase Dashboard</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (emailErr) {
    // Don't fail the survey submission if email fails
    console.error("[survey] Email notification error:", emailErr);
  }

  return NextResponse.json(
    { success: true, message: "¡Gracias por tu respuesta!" },
    { status: 201 }
  );
}
