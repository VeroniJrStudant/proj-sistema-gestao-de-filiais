"use server";

import { parseMoneyInputToCents } from "@/lib/tuition/enrollment-finance";
import {
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
} from "@/generated/prisma/client";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendDebitNoticeEmail } from "@/lib/email/send-debit-notice-email";
import { getDirectIntegrationStatus } from "@/lib/integrations/direct-checkout-env";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type DirectCheckoutChannel =
  | "BOLETO_AUTO"
  | "CARTAO_AVISTA"
  | "CARTAO_RECORRENTE"
  | "PIX_IMEDIATO"
  | "NFE"
  | "DOCUMENTO_DEBITO";

const MAX_META = 12_000;

function trim(s: string | undefined | null, max = 500): string {
  const t = (s ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

function parseYmd(s: string | null | undefined): Date | null {
  if (s == null || s.trim() === "") return null;
  const d = new Date(`${s.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function kindFor(channel: DirectCheckoutChannel): FinancialKind {
  switch (channel) {
    case "BOLETO_AUTO":
      return FinancialKind.BOLETO;
    case "PIX_IMEDIATO":
      return FinancialKind.PIX;
    case "NFE":
    case "DOCUMENTO_DEBITO":
      return FinancialKind.OTHER;
    default:
      return FinancialKind.PAYMENT;
  }
}

function titleFor(channel: DirectCheckoutChannel): string {
  switch (channel) {
    case "BOLETO_AUTO":
      return "Direta — boleto (emissão automática)";
    case "CARTAO_AVISTA":
      return "Direta — cartão à vista";
    case "CARTAO_RECORRENTE":
      return "Direta — cartão recorrente";
    case "PIX_IMEDIATO":
      return "Direta — PIX (crédito imediato)";
    case "NFE":
      return "Direta — NF-e eletrônica";
    case "DOCUMENTO_DEBITO":
      return "Documento de débito";
    default:
      return "Direta — checkout";
  }
}

function buildMetadata(
  channel: DirectCheckoutChannel,
  record: Record<string, string>,
): string | null {
  const payload = {
    directCheckout: true,
    channel,
    integration: getDirectIntegrationStatus(),
    ...record,
  };
  try {
    const s = JSON.stringify(payload);
    if (s.length > MAX_META) return null;
    return s;
  } catch {
    return null;
  }
}

export async function registerDirectCheckoutRequest(
  channel: DirectCheckoutChannel,
  form: FormData,
): Promise<{ ok: true; message: string; recordId: string } | { ok: false; error: string }> {
  const studentIdRaw = trim(form.get("studentId")?.toString() ?? "", 64);
  const studentId = studentIdRaw === "" ? null : studentIdRaw;

  if (studentId) {
    const st = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!st) return { ok: false, error: "Aluno não encontrado." };
  }

  const payerName = trim(form.get("payerName")?.toString() ?? "", 200);
  const payerDoc = trim(form.get("payerDocument")?.toString() ?? "", 20).replace(/\D/g, "");
  const payerEmail = trim(form.get("payerEmail")?.toString() ?? "", 120);
  const amountText = form.get("amount")?.toString() ?? "";
  const amountCents = parseMoneyInputToCents(amountText);
  const notes = trim(form.get("notes")?.toString() ?? "", 2000);

  if (!payerName) return { ok: false, error: "Informe o nome do pagador ou tomador." };
  if (amountCents == null || amountCents <= 0) {
    return { ok: false, error: "Informe um valor válido (ex.: 120,00)." };
  }

  const metaBase: Record<string, string> = {
    payerName,
    payerDocument: payerDoc,
    payerEmail,
    notes,
  };

  let dueDate: Date | null = null;
  let description = titleFor(channel);
  let extraMeta: Record<string, string> = {};

  switch (channel) {
    case "BOLETO_AUTO": {
      dueDate = parseYmd(form.get("dueDate")?.toString() ?? "");
      if (!dueDate) return { ok: false, error: "Informe o vencimento do boleto." };
      extraMeta = {
        boletoEmailCopy: trim(form.get("boletoEmailCopy")?.toString() ?? "", 120),
      };
      break;
    }
    case "CARTAO_AVISTA": {
      const inst = Number(form.get("installments")?.toString() ?? "1");
      if (!Number.isInteger(inst) || inst < 1 || inst > 18) {
        return { ok: false, error: "Parcelas devem ser entre 1 e 18." };
      }
      extraMeta = { installments: String(inst) };
      description = `${description} — ${inst}x`;
      break;
    }
    case "CARTAO_RECORRENTE": {
      const periodicity = trim(form.get("periodicity")?.toString() ?? "MONTHLY", 32);
      const anchor = trim(form.get("billingDay")?.toString() ?? "", 8);
      extraMeta = { periodicity, billingDay: anchor };
      break;
    }
    case "PIX_IMEDIATO": {
      extraMeta = {
        pixKeyHint: trim(form.get("pixKeyHint")?.toString() ?? "", 80),
      };
      break;
    }
    case "NFE": {
      const tomadorIe = trim(form.get("tomadorIe")?.toString() ?? "", 20);
      const cfop = trim(form.get("cfop")?.toString() ?? "", 10);
      const serviceDescription = trim(form.get("serviceDescription")?.toString() ?? "", 2000);
      if (!serviceDescription) return { ok: false, error: "Descreva o serviço / natureza da operação." };
      extraMeta = { tomadorIe, cfop, serviceDescription };
      description = `${description} — ${serviceDescription.slice(0, 80)}${serviceDescription.length > 80 ? "…" : ""}`;
      break;
    }
    case "DOCUMENTO_DEBITO": {
      dueDate = parseYmd(form.get("dueDate")?.toString() ?? "");
      if (!dueDate) return { ok: false, error: "Informe o vencimento." };
      const referenceLabel = trim(form.get("referenceLabel")?.toString() ?? "", 500);
      if (!referenceLabel) return { ok: false, error: "Informe a referência ou descrição da cobrança." };
      const sendEmail = form.get("sendEmail") === "on";
      const sendToGuardians = form.get("sendToGuardians") === "on";
      if (sendEmail && !payerEmail) {
        return { ok: false, error: "Para enviar por e-mail, preencha o e-mail do responsável." };
      }
      if (sendToGuardians && !studentId) {
        return { ok: false, error: "Para enviar aos responsáveis cadastrados, selecione o aluno." };
      }
      extraMeta = {
        referenceLabel,
        debitNotice: "true",
        sendEmailRequested: sendEmail ? "true" : "false",
        sendToGuardians: sendToGuardians ? "true" : "false",
      };
      description = `Documento de débito — ${referenceLabel}`;
      break;
    }
    default:
      return { ok: false, error: "Canal inválido." };
  }

  const metadata = buildMetadata(channel, { ...metaBase, ...extraMeta });
  if (!metadata) return { ok: false, error: "Dados muito extensos; reduza textos e tente de novo." };

  const ext =
    channel === "DOCUMENTO_DEBITO"
      ? `DEBITO-${Date.now().toString(36)}`.slice(0, 128)
      : `DIRETA-${channel}-${Date.now().toString(36)}`.slice(0, 128);

  let created: { id: string; metadata: string | null };

  try {
    created = await prisma.financialRecord.create({
      data: {
        direction: FinancialDirection.IN,
        kind: kindFor(channel),
        status: FinancialStatus.PENDING,
        amountCents,
        dueDate,
        settledAt: null,
        description,
        externalRef: ext,
        studentId,
        metadata,
      },
      select: { id: true, metadata: true },
    });
  } catch {
    return { ok: false, error: "Não foi possível registrar. Tente novamente." };
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/pagamentos-pais");
  revalidatePath("/financeiro/direta");
  revalidatePath(`/financeiro/documento-debito/${created.id}`);
  revalidatePath("/");

  if (channel === "DOCUMENTO_DEBITO") {
    if (!dueDate) {
      return { ok: false, error: "Informe o vencimento." };
    }
    const sendEmail = form.get("sendEmail") === "on";
    const sendToGuardians = form.get("sendToGuardians") === "on";
    const referenceLabel = trim(form.get("referenceLabel")?.toString() ?? "", 500);
    const printUrl = `${getAppBaseUrl()}/financeiro/documento-debito/${created.id}`;

    let studentName: string | null = null;
    if (studentId) {
      const s = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });
      studentName = s?.name?.trim() ?? null;
    }

    const recipients = new Set<string>();
    if (sendEmail && payerEmail) recipients.add(payerEmail);
    if (sendToGuardians && studentId) {
      const st = await prisma.student.findUnique({
        where: { id: studentId },
        include: { guardians: { include: { guardian: true } } },
      });
      for (const g of st?.guardians ?? []) {
        const em = g.guardian.email?.trim();
        if (em) recipients.add(em);
      }
    }

    let mailResult: { ok: boolean; reason?: "smtp_missing" | "send_failed" | "no_recipients" } = {
      ok: false,
      reason: "no_recipients",
    };
    if (sendEmail) {
      mailResult = await sendDebitNoticeEmail({
        to: [...recipients],
        payerName,
        payerDocument: payerDoc || undefined,
        studentName,
        referenceLabel,
        amountCents,
        dueDate,
        externalRef: ext,
        printUrl,
      });
    }

    try {
      const meta = JSON.parse(created.metadata ?? "{}") as Record<string, unknown>;
      meta.emailDispatch = sendEmail
        ? mailResult.ok
          ? "sent"
          : mailResult.reason ?? "send_failed"
        : "skipped";
      await prisma.financialRecord.update({
        where: { id: created.id },
        data: { metadata: JSON.stringify(meta) },
      });
    } catch {
      /* ignore merge failure */
    }

    let msg = "Documento de débito registrado no financeiro.";
    if (sendEmail) {
      if (mailResult.ok) {
        msg += " O e-mail com o resumo e o link para impressão foi enviado.";
      } else if (mailResult.reason === "smtp_missing") {
        msg += " Envio não realizado: configure SMTP no servidor (SMTP_HOST, SMTP_USER…).";
      } else if (mailResult.reason === "no_recipients") {
        msg +=
          " Envio não realizado: informe o e-mail do responsável ou cadastre e-mails nos responsáveis do aluno.";
      } else {
        msg += " Envio não realizado: falha ao enviar o e-mail.";
      }
    } else {
      msg += " Use o link abaixo para abrir e imprimir o documento.";
    }

    return { ok: true, message: msg, recordId: created.id };
  }

  const st = getDirectIntegrationStatus();
  const auto = channel === "NFE" ? st.nfeConfigured : st.paymentGatewayConfigured;

  return {
    ok: true,
    message: auto
      ? "Solicitação registrada. Com o provedor configurado, a próxima etapa é processar no PSP/emissor (webhook ou fila)."
      : "Solicitação registrada no sistema como pendente. Quando o provedor de pagamento ou o emissor de NF-e estiver configurado no servidor, a emissão poderá ser automatizada.",
    recordId: created.id,
  };
}
