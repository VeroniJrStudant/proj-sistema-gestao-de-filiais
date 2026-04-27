"use server";

import { LeaseStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function parseYmd(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIntRequired(raw: string, fieldLabel: string): { ok: true; value: number } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: `Informe ${fieldLabel}.` };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, error: `${fieldLabel} inválido.` };
  return { ok: true, value: Math.trunc(n) };
}

export type SaveLeaseResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveLease(formData: FormData): Promise<SaveLeaseResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  if (!propertyId) return { ok: false, error: "Selecione o imóvel." };
  if (!tenantId) return { ok: false, error: "Selecione o locatário." };

  const startsAt = parseYmd(String(formData.get("startsAt") ?? ""));
  if (!startsAt) return { ok: false, error: "Informe a data de início (válida)." };
  const endsAt = parseYmd(String(formData.get("endsAt") ?? "")) ?? null;

  const dueDayRes = parseIntRequired(String(formData.get("dueDay") ?? ""), "o dia de vencimento");
  if (!dueDayRes.ok) return dueDayRes;
  if (dueDayRes.value < 1 || dueDayRes.value > 31) return { ok: false, error: "Dia de vencimento deve ser 1–31." };

  const monthlyRes = parseIntRequired(String(formData.get("monthlyRentCents") ?? ""), "o valor mensal (centavos)");
  if (!monthlyRes.ok) return monthlyRes;
  if (monthlyRes.value <= 0) return { ok: false, error: "Valor mensal deve ser maior que zero." };

  const depositRaw = String(formData.get("depositCents") ?? "").trim();
  const depositCents = depositRaw ? Math.trunc(Number(depositRaw)) : null;
  if (depositCents != null && (!Number.isFinite(depositCents) || depositCents < 0)) {
    return { ok: false, error: "Caução/depósito inválido." };
  }

  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = (Object.values(LeaseStatus) as string[]).includes(statusRaw) ? (statusRaw as LeaseStatus) : LeaseStatus.DRAFT;

  const [prop, ten] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, active: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
  ]);
  if (!prop?.active) return { ok: false, error: "Imóvel inválido ou inativo." };
  if (!ten) return { ok: false, error: "Locatário inválido." };

  const data = {
    propertyId,
    tenantId,
    status,
    startsAt,
    endsAt,
    monthlyRentCents: monthlyRes.value,
    dueDay: dueDayRes.value,
    depositCents,
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };

  try {
    if (id) {
      const exists = await prisma.leaseContract.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Contrato não encontrado." };
      await prisma.leaseContract.update({ where: { id }, data });
      revalidatePath("/locacoes");
      revalidatePath("/");
      return { ok: true, id };
    }
    const created = await prisma.leaseContract.create({ data });
    revalidatePath("/locacoes");
    revalidatePath("/");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "Não foi possível salvar. Verifique os campos." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteLease(leaseId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = leaseId.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.leaseContract.delete({ where: { id } });
    revalidatePath("/locacoes");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}

