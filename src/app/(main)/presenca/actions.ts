"use server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createFinancialRecordsForAccessSessionPayments } from "@/lib/access/access-finance";

function userCanRecord(session: NonNullable<Awaited<ReturnType<typeof getSession>>>): boolean {
  if (!session.permissions.includes("attendance.access")) return false;
  return session.role === "ADMIN" || session.role === "TEACHER";
}

function parseMoneyToCents(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const norm = t.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

export async function openAccessSession(params: {
  kind: "PARKING" | "PROPERTY";
  branchId: string | null;
  parkingFacilityId: string | null;
  propertyId: string | null;
  plate: string | null;
  customerName: string | null;
  pricingPlanId: string | null;
  note: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };
  if (!userCanRecord(session)) return { ok: false, error: "Sem permissão para registrar." };

  const kind = params.kind === "PROPERTY" ? "PROPERTY" : "PARKING";
  const plate = (params.plate ?? "").trim().toUpperCase() || null;
  const customerName = (params.customerName ?? "").trim() || null;
  const note = (params.note ?? "").trim() || null;
  if (note && note.length > 500) return { ok: false, error: "Observação muito longa (máx. 500 caracteres)." };

  if (kind === "PARKING" && !params.parkingFacilityId) {
    // deixa criar sem estacionamento vinculado (modo genérico), mas incentiva vínculo
  }
  if (kind === "PROPERTY" && !params.propertyId) {
    // idem
  }

  try {
    const created = await prisma.accessSession.create({
      data: {
        kind,
        status: "OPEN",
        branchId: params.branchId,
        parkingFacilityId: kind === "PARKING" ? params.parkingFacilityId : null,
        propertyId: kind === "PROPERTY" ? params.propertyId : null,
        plate,
        customerName,
        pricingPlanId: params.pricingPlanId,
        note,
        entryAt: new Date(),
        exitAt: null,
        finalAmountCents: 0,
        paidCents: 0,
      },
      select: { id: true },
    });
    revalidatePath("/presenca");
    revalidatePath("/");
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Não foi possível registrar a entrada. Tente novamente." };
  }
}

export async function closeAccessSession(params: {
  sessionId: string;
  /** Texto pt-BR (ex.: 10,50). Se vazio/null, usa defaultSuggestedCents. */
  finalAmountText: string | null;
  defaultSuggestedCents: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };
  if (!userCanRecord(session)) return { ok: false, error: "Sem permissão para registrar." };

  const id = params.sessionId.trim();
  if (!id) return { ok: false, error: "Sessão inválida." };

  const parsed = params.finalAmountText ? parseMoneyToCents(params.finalAmountText) : null;
  if (params.finalAmountText && parsed == null) {
    return { ok: false, error: "Valor inválido. Use formato 10,00." };
  }

  const finalAmountCents = parsed ?? Math.max(0, Math.trunc(params.defaultSuggestedCents || 0));
  const now = new Date();

  try {
    await prisma.accessSession.update({
      where: { id },
      data: {
        status: "CLOSED",
        exitAt: now,
        finalAmountCents,
      },
    });
    revalidatePath("/presenca");
    revalidatePath("/financeiro");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível registrar a saída. Tente novamente." };
  }
}

export async function recordAccessPayments(params: {
  sessionId: string;
  settledNow: boolean;
  payments: { amountText: string; method: string }[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };
  if (!userCanRecord(session)) return { ok: false, error: "Sem permissão." };

  const id = params.sessionId.trim();
  if (!id) return { ok: false, error: "Sessão inválida." };

  const payments = params.payments
    .map((p) => ({
      amountCents: parseMoneyToCents(p.amountText) ?? NaN,
      paymentMethod: p.method.trim() || null,
    }))
    .filter((p) => Number.isFinite(p.amountCents) && p.amountCents > 0)
    .map((p) => ({
      amountCents: p.amountCents,
      paymentMethod: p.paymentMethod,
      settledNow: params.settledNow,
    }));

  const r = await createFinancialRecordsForAccessSessionPayments({
    accessSessionId: id,
    payments,
  });
  if (!r.ok) return r;

  revalidatePath("/presenca");
  revalidatePath("/financeiro");
  revalidatePath("/");
  return { ok: true };
}
