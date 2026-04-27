"use server";

import { revalidatePath } from "next/cache";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { prisma } from "@/lib/prisma";

const ALLOWED_CODES = new Set<string>(TUITION_PAYMENT_OPTIONS.map((o) => o.value));

export type AcceptedMethodDraft = {
  code: string;
  active: boolean;
  sortOrder: number;
  notes: string;
};

export async function saveAcceptedPaymentMethodsSettings(
  rows: AcceptedMethodDraft[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const r of rows) {
    if (!ALLOWED_CODES.has(r.code)) {
      return { ok: false, error: `Forma de pagamento inválida: ${r.code}` };
    }
    if (!Number.isInteger(r.sortOrder) || r.sortOrder < 0 || r.sortOrder > 99) {
      return { ok: false, error: "Ordem deve ser um número entre 0 e 99." };
    }
  }
  try {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.acceptedSchoolPaymentMethod.update({
          where: { code: r.code },
          data: {
            active: r.active,
            sortOrder: r.sortOrder,
            notes: r.notes.trim() === "" ? null : r.notes.trim(),
          },
        }),
      ),
    );
    revalidatePath("/financeiro");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar as formas aderidas. Atualize a página e tente de novo." };
  }
}
