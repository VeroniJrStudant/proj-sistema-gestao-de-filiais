import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS)?.trim();
  if (!host || !user || !pass) {
    return null;
  }
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  displayName: string;
  resetUrl: string;
}): Promise<{ ok: boolean; reason?: "smtp_missing" | "send_failed" }> {
  const from =
    process.env.EMAIL_FROM?.trim() ?? '"Creche Gestão" <noreply@creche-gestao.local>';
  const subject = "Redefinição de senha — Creche Gestão";
  const text = [
    `Olá, ${params.displayName},`,
    "",
    "Recebemos um pedido para redefinir a senha da sua conta.",
    `Use o link abaixo (válido por 1 hora):`,
    "",
    params.resetUrl,
    "",
    "Se você não solicitou, ignore este e-mail.",
  ].join("\n");

  const safeUrl = params.resetUrl.replace(/"/g, "&quot;");
  const html = `
    <p>Olá, <strong>${escapeHtml(params.displayName)}</strong>,</p>
    <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
    <p><a href="${safeUrl}" style="color:#2d6b78;">Redefinir minha senha</a></p>
    <p style="font-size:12px;color:#64748b;">O link expira em 1 hora. Se você não solicitou, ignore este e-mail.</p>
  `.trim();

  const transport = createTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[password-reset] SMTP não configurado. E-mail para ${params.to} — link:\n${params.resetUrl}`);
    } else {
      console.error(`[password-reset] SMTP não configurado — não foi possível enviar para ${params.to}`);
    }
    return { ok: false, reason: "smtp_missing" };
  }

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[password-reset] Falha ao enviar e-mail:", err);
    return { ok: false, reason: "send_failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
