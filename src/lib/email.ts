import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = "Cyber Social Club";

function getFromEmail() { return process.env.SMTP_FROM || "info@cybersocialclub.com.ar"; }
function getAdminEmail() { return process.env.ADMIN_EMAIL || "info@cybersocialclub.com.ar"; }
function getAppUrl() { return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://socios.cybersocialclub.com.ar"; }

export async function sendVerificationEmail(to: string, fullName: string, verificationToken: string) {
  const firstName = fullName.split(" ")[0];
  const verifyUrl = `${getAppUrl()}/api/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${getFromEmail()}>`,
    to,
    subject: `${firstName}, verificá tu email para Cyber Social Club`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#E87B1E;font-size:24px;margin:0;">Cyber Social Club</h1>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:4px 0 0;">Where Cyber Minds Connect</p>
    </div>
    <div style="background-color:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 8px;">¡Hola ${firstName}!</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
        Gracias por registrarte en Cyber Social Club. Para continuar con tu solicitud, necesitamos verificar tu email.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${verifyUrl}" style="display:inline-block;background-color:#E87B1E;color:#FFFFFF;text-decoration:none;padding:14px 40px;border-radius:50px;font-size:14px;font-weight:600;">Verificar Mi Email</a>
      </div>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;margin:0;">
        Si no te registraste en Cyber Social Club, ignorá este email.
      </p>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
        &copy; ${new Date().getFullYear()} Cyber Social Club. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  const firstName = fullName.split(" ")[0];

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${getFromEmail()}>`,
    to,
    subject: `¡Bienvenido a Cyber Social Club, ${firstName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#E87B1E;font-size:24px;margin:0;">Cyber Social Club</h1>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:4px 0 0;">Where Cyber Minds Connect</p>
    </div>
    <div style="background-color:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 8px;">¡Hola ${firstName}!</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
        Recibimos tu solicitud de membresía. Nuestro equipo está revisando tu perfil.
      </p>
      <div style="background-color:rgba(232,123,30,0.08);border:1px solid rgba(232,123,30,0.15);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E87B1E;font-size:13px;font-weight:600;margin:0 0 4px;">Estado de tu solicitud</p>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Pendiente de aprobación</p>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
        Una vez aprobada, recibirás tu <strong style="color:#FFFFFF;">credencial digital CSC</strong> con un código QR verificable que podrás usar en todos nuestros eventos.
      </p>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:0;">
        Si tenés alguna pregunta, respondé a este email.
      </p>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
        &copy; ${new Date().getFullYear()} Cyber Social Club. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendAdminNotification(member: {
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  role_type: string;
}) {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${getFromEmail()}>`,
    to: getAdminEmail(),
    subject: `🆕 Nueva solicitud de membresía: ${member.full_name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#E87B1E;font-size:24px;margin:0;">Cyber Social Club</h1>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:4px 0 0;">Panel de Administración</p>
    </div>
    <div style="background-color:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 16px;">Nueva Solicitud de Membresía</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Nombre</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${member.full_name}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Email</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${member.email}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Empresa</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${member.company}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Cargo</td><td style="color:#FFFFFF;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${member.job_title}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;">Rol</td><td style="color:#E87B1E;font-size:14px;font-weight:600;padding:8px 0;text-align:right;">${member.role_type}</td></tr>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${getAppUrl()}/admin" style="display:inline-block;background-color:#E87B1E;color:#FFFFFF;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:600;">Revisar en Panel de Admin</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendApprovalEmail(to: string, fullName: string, memberNumber: string, credentialToken: string) {
  const firstName = fullName.split(" ")[0];
  const credentialUrl = `${getAppUrl()}/credential?token=${credentialToken}`;
  const imageUrl = `${getAppUrl()}/api/credential/image?token=${credentialToken}`;

  console.log("[sendApprovalEmail] Starting — to:", to, "member:", memberNumber);
  console.log("[sendApprovalEmail] SMTP config — host:", process.env.SMTP_HOST, "port:", process.env.SMTP_PORT, "user:", process.env.SMTP_USER, "from:", process.env.SMTP_FROM);

  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${getFromEmail()}>`,
    to,
    subject: `¡Membresía aprobada! Tu credencial ${memberNumber} está lista`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#E87B1E;font-size:24px;margin:0;">Cyber Social Club</h1>
      <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:4px 0 0;">Where Cyber Minds Connect</p>
    </div>
    <div style="background-color:#141211;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 8px;">¡Felicitaciones ${firstName}!</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
        Tu membresía fue aprobada. Ya sos parte del Cyber Social Club.
      </p>
      <div style="background-color:rgba(232,123,30,0.08);border:1px solid rgba(232,123,30,0.15);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Tu número de miembro</p>
        <p style="color:#E87B1E;font-size:32px;font-weight:700;margin:0;font-family:monospace;">${memberNumber}</p>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
        Tu credencial digital con código QR verificable está lista. Podés verla online o descargar la imagen:
      </p>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${credentialUrl}" style="display:inline-block;background-color:#E87B1E;color:#FFFFFF;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:600;">Ver Mi Credencial</a>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${imageUrl}" style="display:inline-block;color:#E87B1E;text-decoration:none;font-size:13px;font-weight:500;">Descargar Imagen →</a>
      </div>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.6;">
        Este link es personal e intransferible. No lo compartas con nadie.
        <br>¡Bienvenido a la comunidad!
      </p>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
        &copy; ${new Date().getFullYear()} Cyber Social Club. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`,
  });

  console.log("[sendApprovalEmail] SMTP response:", JSON.stringify(info));
}
