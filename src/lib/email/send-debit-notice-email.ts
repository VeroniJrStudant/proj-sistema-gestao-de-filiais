import nodemailer from "nodemailer";
import { formatBRL } from "@/lib/format-brl";

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

function schoolName(): string {
  return process.env.SCHOOL_NAME?.trim() || process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "Creche";
}

export async function sendDebitNoticeEmail(params: {
  to: string[];
  payerName: string;
  payerDocument?: string;
  studentName?: string | null;
  referenceLabel: string;
  amountCents: number;
  dueDate: Date;
  externalRef: string;
  printUrl: string;
}): Promise<{ ok: boolean; reason?: "smtp_missing" | "send_failed" | "no_recipients" }> {
  const recipients = [...new Set(params.to.map((x) => x.trim()).filter(Boolean))];
  if (recipients.length === 0) return { ok: false, reason: "no_recipients" };

  const from =
    process.env.EMAIL_FROM?.trim() ?? '"Creche Gestão" <noreply@creche-gestao.local>';
  const unit = schoolName();
  const subject = `Documento de débito — ${unit}`;
  const dueStr = params.dueDate.toLocaleDateString("pt-BR");
  const amount = formatBRL(params.amountCents);
  const doc = params.payerDocument?.trim() ? `CPF/CNPJ: ${params.payerDocument.trim()}` : "";
  const aluno = params.studentName?.trim()
    ? `Aluno(a): ${params.studentName.trim()}`
    : "";

  const text = [
    unit,
    "",
    "DOCUMENTO DE DÉBITO",
    "",
    `Referência: ${params.referenceLabel}`,
    `Valor: ${amount}`,
    `Vencimento: ${dueStr}`,
    `Responsável: ${params.payerName}`,
    doc,
    aluno,
    `Ref. interna: ${params.externalRef}`,
    "",
    "Para visualizar e imprimir o documento completo (mesmo formato da secretaria), acesse:",
    params.printUrl,
    "",
    "Em caso de dúvida, procure a secretaria da unidade.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const safePrint = escapeHtml(params.printUrl);
  const html = `
    <p style="font-size:14px;color:#334155;"><strong>${escapeHtml(unit)}</strong></p>
    <h1 style="font-size:18px;margin:12px 0 8px;color:#1a2230;">Documento de débito</h1>
    <table style="border-collapse:collapse;font-size:14px;color:#334155;max-width:520px;">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Referência</td><td>${escapeHtml(params.referenceLabel)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Valor</td><td><strong>${escapeHtml(amount)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Vencimento</td><td>${escapeHtml(dueStr)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Responsável</td><td>${escapeHtml(params.payerName)}</td></tr>
      ${params.payerDocument?.trim() ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">CPF/CNPJ</td><td>${escapeHtml(params.payerDocument.trim())}</td></tr>` : ""}
      ${params.studentName?.trim() ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Aluno(a)</td><td>${escapeHtml(params.studentName.trim())}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Ref. interna</td><td>${escapeHtml(params.externalRef)}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:14px;">
      <a href="${safePrint}" style="color:#2d6b78;font-weight:600;">Abrir documento para impressão</a>
    </p>
    <p style="margin-top:12px;font-size:12px;color:#64748b;">Em caso de dúvida, procure a secretaria da unidade.</p>
  `.trim();

  const transport = createTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[debit-notice] SMTP não configurado. Para: ${recipients.join(", ")}\n${text}`);
    } else {
      console.error(`[debit-notice] SMTP não configurado — não foi possível enviar para ${recipients.join(", ")}`);
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
    console.error("[debit-notice] Falha ao enviar e-mail:", err);
    return { ok: false, reason: "send_failed" };
  }
}
