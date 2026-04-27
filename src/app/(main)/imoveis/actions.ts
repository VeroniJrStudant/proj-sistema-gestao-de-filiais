"use server";

import { Prisma, PropertyKind, PropertyStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function parseIntOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export type SavePropertyResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveProperty(formData: FormData): Promise<SavePropertyResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome do imóvel." };

  const kindRaw = String(formData.get("kind") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const kind = (Object.values(PropertyKind) as string[]).includes(kindRaw) ? (kindRaw as PropertyKind) : PropertyKind.OTHER;
  const status = (Object.values(PropertyStatus) as string[]).includes(statusRaw) ? (statusRaw as PropertyStatus) : PropertyStatus.AVAILABLE;

  const branchId = emptyToNull(String(formData.get("branchId") ?? ""));
  if (branchId) {
    const b = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, active: true } });
    if (!b?.active) return { ok: false, error: "Filial inválida ou inativa." };
  }

  const rentSuggestedCents = parseIntOrNull(String(formData.get("rentSuggestedCents") ?? ""));
  if (rentSuggestedCents != null && rentSuggestedCents < 0) return { ok: false, error: "Valor sugerido inválido." };

  const data = {
    name,
    code: emptyToNull(String(formData.get("code") ?? "")),
    kind,
    status,
    branchId,
    description: emptyToNull(String(formData.get("description") ?? "")),
    street: emptyToNull(String(formData.get("street") ?? "")),
    number: emptyToNull(String(formData.get("number") ?? "")),
    complement: emptyToNull(String(formData.get("complement") ?? "")),
    neighborhood: emptyToNull(String(formData.get("neighborhood") ?? "")),
    city: emptyToNull(String(formData.get("city") ?? "")),
    state: emptyToNull(String(formData.get("state") ?? ""))?.toUpperCase().slice(0, 2) ?? null,
    zip: emptyToNull(String(formData.get("zip") ?? "")),
    rentSuggestedCents,
    active: formData.get("active") === "on",
  };

  try {
    if (id) {
      const exists = await prisma.property.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Imóvel não encontrado." };
      await prisma.property.update({ where: { id }, data });
      revalidatePath("/imoveis");
      revalidatePath("/");
      return { ok: true, id };
    }
    const created = await prisma.property.create({ data });
    revalidatePath("/imoveis");
    revalidatePath("/");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe um imóvel com este código." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteProperty(propertyId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = propertyId.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.property.delete({ where: { id } });
    revalidatePath("/imoveis");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir. Verifique contratos vinculados." };
  }
}

