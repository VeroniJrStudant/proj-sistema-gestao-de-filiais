"use server";

import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import type { TuitionPaymentDetails } from "@/lib/tuition/tuition-payment-details";
import { parseMoneyInputToCents } from "@/lib/tuition/enrollment-finance";
import {
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const METHOD_SET = new Set<string>(TUITION_PAYMENT_OPTIONS.map((o) => o.value));
const LABEL_BY_CODE = new Map<string, string>(
  TUITION_PAYMENT_OPTIONS.map((o) => [o.value, o.label]),
);

function parseYmd(s: string | null | undefined): Date | null {
  if (s == null || s.trim() === "") return null;
  const d = new Date(`${s.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseYearMonth(s: string | null | undefined): string | null {
  if (s == null || s.trim() === "") return null;
  const t = s.trim();
  if (!/^\d{4}-\d{2}$/.test(t)) return null;
  const [y, m] = t.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  if (y < 2000 || y > 2100) return null;
  return t;
}

function competenceHuman(ym: string): string {
  const [y, mo] = ym.split("-").map(Number);
  const d = new Date(y, mo - 1, 1);
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(/\./g, "");
  return `${month}/${y}`;
}

function kindFor(flow: "RECEIVED" | "BOLETO_PENDING", methodCode: string): FinancialKind {
  if (flow === "BOLETO_PENDING") return FinancialKind.BOLETO;
  if (methodCode === "PIX") return FinancialKind.PIX;
  if (methodCode === "BOLETO") return FinancialKind.BOLETO;
  return FinancialKind.PAYMENT;
}

function trimMetadata(
  details: TuitionPaymentDetails,
  extras: { tuitionPaymentMethod: string; referenceMonth: string; flow: string },
): string | null {
  const base: Record<string, string> = {
    tuitionPaymentMethod: extras.tuitionPaymentMethod,
    referenceMonth: extras.referenceMonth,
    flow: extras.flow,
  };
  for (const [k, v] of Object.entries(details)) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t !== "") base[k] = t;
  }
  const s = JSON.stringify(base);
  if (s.length > 14_000) return null;
  return s;
}

export type RecordTuitionReceiptInput = {
  studentId: string;
  flow: "RECEIVED" | "BOLETO_PENDING";
  methodCode: string;
  amountText: string;
  referenceMonth: string;
  dueDate: string | null;
  settledDate: string | null;
  descriptionExtra: string;
  details: TuitionPaymentDetails;
};

export async function recordTuitionReceipt(
  input: RecordTuitionReceiptInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const studentId = input.studentId?.trim();
  if (!studentId) return { ok: false, error: "Selecione o aluno." };

  const amountCents = parseMoneyInputToCents(input.amountText ?? "");
  if (amountCents == null || amountCents <= 0) {
    return { ok: false, error: "Informe um valor válido (ex.: 850,00)." };
  }

  const flow = input.flow === "BOLETO_PENDING" ? "BOLETO_PENDING" : "RECEIVED";
  let methodCode = (input.methodCode ?? "").trim().toUpperCase();
  if (flow === "BOLETO_PENDING") methodCode = "BOLETO";

  if (!METHOD_SET.has(methodCode)) {
    return { ok: false, error: "Forma de pagamento inválida." };
  }

  const nowYm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const referenceMonth = parseYearMonth(input.referenceMonth) ?? nowYm;

  const accepted = await prisma.acceptedSchoolPaymentMethod.findUnique({
    where: { code: methodCode },
  });
  if (!accepted?.active) {
    return {
      ok: false,
      error: "Esta forma de pagamento não está ativa na política da unidade. Ative em Financeiro → cadastro.",
    };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  });
  if (!student) return { ok: false, error: "Aluno não encontrado." };

  let status: FinancialStatus;
  let dueDate: Date | null = null;
  let settledAt: Date | null = null;

  if (flow === "BOLETO_PENDING") {
    const due = parseYmd(input.dueDate);
    if (!due) return { ok: false, error: "Informe a data de vencimento do boleto." };
    status = FinancialStatus.PENDING;
    dueDate = due;
  } else {
    const t = new Date();
    const todayYmd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    const settled = parseYmd(input.settledDate) ?? parseYmd(todayYmd);
    if (!settled) return { ok: false, error: "Informe a data em que o pagamento foi recebido." };
    status = FinancialStatus.SETTLED;
    settledAt = settled;
  }

  const methodLabel = LABEL_BY_CODE.get(methodCode) ?? methodCode;
  const comp = competenceHuman(referenceMonth);
  const extra = (input.descriptionExtra ?? "").trim();
  const description = [
    `Mensalidade — ${comp} — ${methodLabel}`,
    extra ? `— ${extra}` : "",
  ]
    .join(" ")
    .trim();

  const details = input.details && typeof input.details === "object" ? input.details : {};
  const metadata = trimMetadata(details, {
    tuitionPaymentMethod: methodCode,
    referenceMonth,
    flow,
  });
  if (metadata == null) {
    return { ok: false, error: "Dados adicionais muito extensos; reduza textos e tente de novo." };
  }

  const externalRef =
    flow === "BOLETO_PENDING"
      ? (details.boletoOurNumber?.trim() || details.boletoDigitableLine?.trim()?.slice(0, 48) || null)
      : details.receiptNumber?.trim() || details.cardAuthCode?.trim() || null;

  const kind = kindFor(flow, methodCode);

  try {
    await prisma.financialRecord.create({
      data: {
        direction: FinancialDirection.IN,
        kind,
        status,
        amountCents,
        dueDate,
        settledAt,
        description,
        externalRef: externalRef && externalRef.length > 0 ? externalRef.slice(0, 128) : null,
        studentId: student.id,
        metadata,
      },
    });
  } catch {
    return { ok: false, error: "Não foi possível salvar o lançamento. Tente novamente." };
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/entradas");
  revalidatePath("/financeiro/entradas/recebimento");
  revalidatePath("/financeiro/recebimento");
  revalidatePath("/");
  return { ok: true };
}
