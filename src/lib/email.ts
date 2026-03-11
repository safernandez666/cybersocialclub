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

const FROM_EMAIL = process.env.SMTP_FROM || "info@cybersocialclub.com.ar";
const FROM_NAME = "Cyber Social Club";

export async function sendWelcomeEmail(to: string, fullName: string) {
  const firstName = fullName.split(" ")[0];

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
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
