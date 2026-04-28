"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export type SaveServiceCatalogResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveServiceCatalog(formData: FormData): Promise<SaveServiceCatalogResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome do serviço." };

  const active = String(formData.get("active") ?? "") === "on";
  const data = {
    name,
    description: emptyToNull(String(formData.get("description") ?? "")),
    active,
  };

  try {
    if (id) {
      const exists = await prisma.serviceCatalog.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Serviço não encontrado." };
      await prisma.serviceCatalog.update({ where: { id }, data });
      revalidatePath("/servicos");
      revalidatePath("/servicos/catalogo");
      return { ok: true, id };
    }
    const created = await prisma.serviceCatalog.create({ data });
    revalidatePath("/servicos");
    revalidatePath("/servicos/catalogo");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Registro duplicado." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteServiceCatalog(
  serviceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sid = serviceId.trim();
  if (!sid) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.serviceCatalog.delete({ where: { id: sid } });
    revalidatePath("/servicos");
    revalidatePath("/servicos/catalogo");
    revalidatePath("/servicos/particular");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
