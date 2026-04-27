import "server-only";

import { FinancialDirection, FinancialKind, FinancialStatus } from "@/generated/prisma/client";
import type { AccessSessionKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_META = 12_000;

function kindForAccessSession(kind: AccessSessionKind): FinancialKind {
  return kind === "PARKING" ? FinancialKind.PARKING : FinancialKind.RENT;
}

function safeJson(obj: unknown): string | null {
  try {
    const s = JSON.stringify(obj);
    if (s.length > MAX_META) return null;
    return s;
  } catch {
    return null;
  }
}

export type AccessPaymentPartInput = {
  amountCents: number;
  paymentMethod: string | null;
  /** Se true, já marca como recebido (SETTLED). */
  settledNow?: boolean;
  notes?: string | null;
};

export async function createFinancialRecordsForAccessSessionPayments(params: {
  accessSessionId: string;
  payments: AccessPaymentPartInput[];
}): Promise<
  | { ok: true; createdFinancialRecordIds: string[]; createdPaymentPartIds: string[]; paidCents: number }
  | { ok: false; error: string }
> {
  const sid = params.accessSessionId.trim();
  if (!sid) return { ok: false, error: "Sessão inválida." };

  const session = await prisma.accessSession.findUnique({
    where: { id: sid },
    select: {
      id: true,
      kind: true,
      branchId: true,
      propertyId: true,
      parkingFacilityId: true,
      plate: true,
      entryAt: true,
      exitAt: true,
      status: true,
    },
  });
  if (!session) return { ok: false, error: "Sessão não encontrada." };

  const parts = params.payments
    .map((p) => ({
      amountCents: Number.isFinite(p.amountCents) ? Math.trunc(p.amountCents) : NaN,
      paymentMethod: (p.paymentMethod ?? "").trim() || null,
      notes: (p.notes ?? "").trim() || null,
      settledNow: p.settledNow === true,
    }))
    .filter((p) => Number.isFinite(p.amountCents) && p.amountCents > 0);

  if (parts.length === 0) {
    return { ok: true, createdFinancialRecordIds: [], createdPaymentPartIds: [], paidCents: 0 };
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdFinancialRecordIds: string[] = [];
      const createdPaymentPartIds: string[] = [];
      let paidCents = 0;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        paidCents += p.amountCents;

        const kind = kindForAccessSession(session.kind);
        const methodLabel = p.paymentMethod ? ` — ${p.paymentMethod}` : "";
        const description = `Registro ${session.kind === "PARKING" ? "estacionamento" : "imóvel"}${methodLabel}`.slice(
          0,
          500,
        );

        const metadata = safeJson({
          source: "access_session",
          accessSessionId: session.id,
          kind: session.kind,
          plate: session.plate ?? null,
          entryAtIso: session.entryAt.toISOString(),
          exitAtIso: session.exitAt?.toISOString() ?? null,
          paymentMethod: p.paymentMethod,
          sequence: i + 1,
        });
        if (metadata == null) {
          throw new Error("metadata_too_large");
        }

        const fr = await tx.financialRecord.create({
          data: {
            direction: FinancialDirection.IN,
            kind,
            status: p.settledNow ? FinancialStatus.SETTLED : FinancialStatus.PENDING,
            amountCents: p.amountCents,
            dueDate: null,
            settledAt: p.settledNow ? now : null,
            description,
            externalRef: `ACCESS-${session.id}-${String(i + 1).padStart(3, "0")}`.slice(0, 128),
            branchId: session.branchId,
            propertyId: session.propertyId,
            parkingFacilityId: session.parkingFacilityId,
            accessSessionId: session.id,
            metadata,
            studentId: null,
          },
          select: { id: true },
        });
        createdFinancialRecordIds.push(fr.id);

        const partRow = await tx.accessPaymentPart.create({
          data: {
            sessionId: session.id,
            amountCents: p.amountCents,
            paymentMethod: p.paymentMethod,
            paidAt: p.settledNow ? now : null,
            notes: p.notes,
            financialRecordId: fr.id,
          },
          select: { id: true },
        });
        createdPaymentPartIds.push(partRow.id);
      }

      await tx.accessSession.update({
        where: { id: session.id },
        data: {
          paidCents: { increment: paidCents },
        },
        select: { id: true },
      });

      return { createdFinancialRecordIds, createdPaymentPartIds, paidCents };
    });

    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof Error && e.message === "metadata_too_large") {
      return { ok: false, error: "Dados adicionais muito extensos; reduza observações e tente novamente." };
    }
    return { ok: false, error: "Não foi possível gerar lançamentos financeiros. Tente novamente." };
  }
}

