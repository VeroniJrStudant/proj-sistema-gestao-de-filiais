"use server";

import { Prisma } from "@/generated/prisma/client";
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

export type SaveParticularResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveParticular(formData: FormData): Promise<SaveParticularResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const serviceCatalogId = String(formData.get("serviceCatalogId") ?? "").trim() || null;

  let title = String(formData.get("title") ?? "").trim();
  if (!title && serviceCatalogId) {
    const cat = await prisma.serviceCatalog.findUnique({
      where: { id: serviceCatalogId },
      select: { name: true },
    });
    if (!cat) return { ok: false, error: "Serviço do catálogo não encontrado. Informe o título ou escolha outro item." };
    title = cat.name;
  }
  if (!title) return { ok: false, error: "Informe o título ou selecione um serviço cadastrado no catálogo." };

  const monthlyRaw = String(formData.get("monthlyAmountCents") ?? "").trim();
  let monthlyAmountCents: number | null = null;
  if (monthlyRaw) {
    const n = Math.trunc(Number(monthlyRaw));
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: "Valor mensal (centavos) inválido." };
    monthlyAmountCents = n;
  }

  const startsAt = parseYmd(String(formData.get("startsAt") ?? "")) ?? null;
  const endsAt = parseYmd(String(formData.get("endsAt") ?? "")) ?? null;

  if (serviceCatalogId) {
    const okCat = await prisma.serviceCatalog.findUnique({
      where: { id: serviceCatalogId },
      select: { id: true },
    });
    if (!okCat) return { ok: false, error: "Serviço do catálogo não encontrado." };
  }

  const data = {
    title,
    serviceCatalogId,
    partyName: emptyToNull(String(formData.get("partyName") ?? "")),
    document: emptyToNull(String(formData.get("document") ?? "")),
    phone: emptyToNull(String(formData.get("phone") ?? "")),
    email: emptyToNull(String(formData.get("email") ?? "")),
    monthlyAmountCents,
    startsAt,
    endsAt,
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };

  try {
    if (id) {
      const exists = await prisma.particularService.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Registro não encontrado." };
      await prisma.particularService.update({ where: { id }, data });
      revalidatePath("/servicos");
      revalidatePath("/servicos/particular");
      revalidatePath("/servicos/catalogo");
      return { ok: true, id };
    }
    const created = await prisma.particularService.create({ data });
    revalidatePath("/servicos");
    revalidatePath("/servicos/particular");
    revalidatePath("/servicos/catalogo");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Registro duplicado." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteParticular(particularId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const pid = particularId.trim();
  if (!pid) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.particularService.delete({ where: { id: pid } });
    revalidatePath("/servicos");
    revalidatePath("/servicos/particular");
    revalidatePath("/servicos/catalogo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
