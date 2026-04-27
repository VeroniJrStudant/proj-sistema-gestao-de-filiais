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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAgendaMessageEmail(params: {
  to: string[];
  studentName: string;
  authorLabel: string;
  message: string;
  /** `to_teachers`: assunto e texto voltados a recado da família para a equipe. */
  direction?: "to_guardians" | "to_teachers";
}): Promise<{ ok: boolean; reason?: "smtp_missing" | "send_failed" | "no_recipients" }> {
  const recipients = params.to.map((x) => x.trim()).filter(Boolean);
  if (recipients.length === 0) return { ok: false, reason: "no_recipients" };

  const from =
    process.env.EMAIL_FROM?.trim() ?? '"Creche Gestão" <noreply@creche-gestao.local>';
  const toTeachers = params.direction === "to_teachers";
  const subject = toTeachers
    ? `Mensagem dos responsáveis — ${params.studentName}`
    : `Comunicado escolar — ${params.studentName}`;

  const message = params.message.trim();
  const author = params.authorLabel.trim();
  const text = toTeachers
    ? [
        `Mensagem dos responsáveis — ${params.studentName}`,
        "",
        `Família / responsável: ${author}`,
        "",
        message,
      ].join("\n")
    : [
        `Comunicado escolar — ${params.studentName}`,
        "",
        `De: ${author}`,
        "",
        message,
      ].join("\n");

  const html = toTeachers
    ? `
    <p><strong>Mensagem dos responsáveis</strong> — ${escapeHtml(params.studentName)}</p>
    <p style="color:#64748b;font-size:12px;margin-top:4px;">Família / responsável: ${escapeHtml(author)}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />
    <p style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(message)}</p>
  `.trim()
    : `
    <p><strong>Comunicado escolar</strong> — ${escapeHtml(params.studentName)}</p>
    <p style="color:#64748b;font-size:12px;margin-top:4px;">De: ${escapeHtml(author)}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />
    <p style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(message)}</p>
  `.trim();

  const transport = createTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[agenda-message] SMTP não configurado. Para: ${recipients.join(", ")}\n${text}`);
    } else {
      console.error(`[agenda-message] SMTP não configurado — não foi possível enviar para ${recipients.join(", ")}`);
    }
    return { ok: false, reason: "smtp_missing" };
  }

  try {
    await transport.sendMail({
      from,
      to: recipients,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[agenda-message] Falha ao enviar e-mail:", err);
    return { ok: false, reason: "send_failed" };
  }
}

