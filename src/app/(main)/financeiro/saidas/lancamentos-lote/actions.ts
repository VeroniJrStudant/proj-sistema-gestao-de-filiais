"use server";

import type { Prisma } from "@/generated/prisma/client";
import {
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseBrlStringToCents } from "@/lib/brl-parse";
import { revalidatePath } from "next/cache";
import {
  ALL_TEACHERS_DEPOSIT_PAYEE_ID,
  type BatchPaymentRowInput,
} from "./batch-payment-types";

export type SaveBatchPaymentsResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const MAX_ROWS = 400;
const MAX_META = 12000;

function trim(s: string | null | undefined, max: number): string {
  const t = (s ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

function parseYmd(s: string | null | undefined): Date | null {
  if (s == null || s.trim() === "") return null;
  const d = new Date(`${s.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
}

type ExpandedRow = BatchPaymentRowInput & {
  _resolvedPayeeId: string | null;
  _resolvedPayeeName: string;
  _sourceLine: number;
  /** Linha gerada a partir de “todos os funcionários (depósito em lote)”. */
  _fromAllTeachersBulk?: boolean;
};

export async function saveBatchOutPayments(rows: BatchPaymentRowInput[]): Promise<SaveBatchPaymentsResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Inclua ao menos uma linha de lançamento." };
  }
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `No máximo ${MAX_ROWS} linhas por envio.` };
  }

  const allTeacherRows = rows.filter(
    (r) => r.payeeType === "TEACHER" && r.payeeId?.trim() === ALL_TEACHERS_DEPOSIT_PAYEE_ID,
  );
  if (allTeacherRows.length > 1) {
    return { ok: false, error: "Use no máximo uma linha com “Todos os funcionários (depósito em lote)” por envio." };
  }

  let allActiveTeachers: { id: string; name: string }[] = [];
  if (allTeacherRows.length === 1) {
    allActiveTeachers = await prisma.teacher.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    if (allActiveTeachers.length === 0) {
      return { ok: false, error: "Não há funcionários ativos para gerar o depósito em lote." };
    }
    if (allActiveTeachers.length + rows.length - 1 > MAX_ROWS) {
      return {
        ok: false,
        error: `O depósito em lote geraria ${allActiveTeachers.length} lançamentos; reduza linhas ou aumente o limite em suporte.`,
      };
    }
  }

  const expanded: ExpandedRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.payeeType === "TEACHER" && row.payeeId?.trim() === ALL_TEACHERS_DEPOSIT_PAYEE_ID) {
      for (const t of allActiveTeachers) {
        expanded.push({
          ...row,
          payeeId: t.id,
          _resolvedPayeeId: t.id,
          _resolvedPayeeName: t.name.trim().slice(0, 200),
          _sourceLine: i + 1,
          _fromAllTeachersBulk: true,
        });
      }
      continue;
    }
    let namePlaceholder = "";
    if (row.payeeType === "OTHER") {
      namePlaceholder = trim(row.otherName, 200) || "?";
    } else {
      namePlaceholder = "?";
    }
    expanded.push({
      ...row,
      _resolvedPayeeId: row.payeeId?.trim() ?? null,
      _resolvedPayeeName: namePlaceholder,
      _sourceLine: i + 1,
    });
  }

  const supplierIds = new Set<string>();
  const teacherIds = new Set<string>();
  for (const r of expanded) {
    if (r.payeeType === "SUPPLIER" && r.payeeId?.trim()) supplierIds.add(r.payeeId.trim());
    if (r.payeeType === "TEACHER" && r.payeeId?.trim()) teacherIds.add(r.payeeId.trim());
  }

  const [suppliers, teachers] = await Promise.all([
    supplierIds.size
      ? prisma.supplier.findMany({
          where: { id: { in: [...supplierIds] } },
          select: { id: true, name: true, tradeName: true },
        })
      : Promise.resolve([] as { id: string; name: string; tradeName: string | null }[]),
    teacherIds.size
      ? prisma.teacher.findMany({
          where: { id: { in: [...teacherIds] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const teacherById = new Map(teachers.map((t) => [t.id, t]));

  const batchKey = `LOTE-${Date.now().toString(36)}`;

  const creates: Prisma.FinancialRecordCreateManyInput[] = [];

  for (let i = 0; i < expanded.length; i++) {
    const row = expanded[i]!;
    const cents = parseBrlStringToCents(row.amountBrl ?? "");
    if (cents == null || cents <= 0) {
      return { ok: false, error: `Linha ${row._sourceLine}: informe um valor válido (ex.: 1.250,00).` };
    }

    let payeeLabel = "";
    let payeeId: string | null = null;

    if (row.payeeType === "SUPPLIER") {
      const id = row.payeeId?.trim() ?? "";
      if (!id) return { ok: false, error: `Linha ${row._sourceLine}: selecione o fornecedor.` };
      const s = supplierById.get(id);
      if (!s) return { ok: false, error: `Linha ${row._sourceLine}: fornecedor não encontrado.` };
      payeeId = s.id;
      payeeLabel = (s.tradeName?.trim() || s.name.trim()).slice(0, 200);
    } else if (row.payeeType === "TEACHER") {
      const id = row.payeeId?.trim() ?? "";
      if (!id) return { ok: false, error: `Linha ${row._sourceLine}: selecione o funcionário.` };
      const t = teacherById.get(id);
      if (!t) return { ok: false, error: `Linha ${row._sourceLine}: funcionário não encontrado.` };
      payeeId = t.id;
      payeeLabel = t.name.trim().slice(0, 200);
    } else {
      const label = trim(row.otherName, 200);
      if (!label) return { ok: false, error: `Linha ${row._sourceLine}: informe o nome do favorecido (outros).` };
      payeeLabel = label;
    }

    const dueDate = parseYmd(row.dueDate);
    const settledAt = parseYmd(row.settledDate);
    const status = settledAt ? FinancialStatus.SETTLED : FinancialStatus.PENDING;
    if (status === FinancialStatus.SETTLED && !settledAt) {
      return { ok: false, error: `Linha ${row._sourceLine}: data de liquidação inválida.` };
    }

    const notes = trim(row.notes, 400);
    const barcodeLine = trim(row.barcodeLine, 600);
    const referenceDocument = trim(row.referenceDocument, 400);
    const typeLabel =
      row.payeeType === "SUPPLIER" ? "Fornecedor" : row.payeeType === "TEACHER" ? "Funcionário" : "Outros";
    const description = trim(
      [
        `Pagamento — ${typeLabel} — ${payeeLabel}`,
        referenceDocument ? `— Doc. ${referenceDocument}` : "",
        notes ? `— ${notes}` : "",
      ]
        .join(" ")
        .trim(),
      500,
    );

    const metaObj = {
      batchPayee: row.payeeType,
      payeeId,
      payeeName: payeeLabel,
      batchRef: batchKey,
      sourceLine: row._sourceLine,
      sequence: i + 1,
      barcodeLine: barcodeLine || null,
      barcodeDigits: barcodeLine ? normalizeDigits(barcodeLine).slice(0, 64) : null,
      referenceDocument: referenceDocument || null,
      teacherBulkDeposit: row._fromAllTeachersBulk === true ? true : undefined,
    };
    const metadata = JSON.stringify(metaObj);
    if (metadata.length > MAX_META) {
      return { ok: false, error: "Textos muito longos em uma das linhas; reduza código de barras ou observações." };
    }

    creates.push({
      direction: FinancialDirection.OUT,
      kind: FinancialKind.PAYMENT,
      status,
      amountCents: cents,
      dueDate,
      settledAt,
      description,
      externalRef: `${batchKey}-${String(i + 1).padStart(4, "0")}`.slice(0, 128),
      studentId: null,
      metadata,
    });
  }

  try {
    await prisma.financialRecord.createMany({ data: creates });
  } catch {
    return { ok: false, error: "Não foi possível gravar os lançamentos. Tente novamente." };
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/saidas");
  revalidatePath("/financeiro/saidas/lancamentos-lote");
  revalidatePath("/financeiro/lancamentos-lote");
  revalidatePath("/");
  return { ok: true, count: creates.length };
}
