"use server";

import { Prisma, TenantType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export type SaveTenantResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveTenant(formData: FormData): Promise<SaveTenantResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome do locatário." };

  const typeRaw = String(formData.get("type") ?? "").trim();
  const type = (Object.values(TenantType) as string[]).includes(typeRaw) ? (typeRaw as TenantType) : TenantType.PERSON;

  const data = {
    type,
    name,
    document: emptyToNull(String(formData.get("document") ?? "")),
    phone: emptyToNull(String(formData.get("phone") ?? "")),
    email: emptyToNull(String(formData.get("email") ?? "")),
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };

  try {
    if (id) {
      const exists = await prisma.tenant.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Locatário não encontrado." };
      await prisma.tenant.update({ where: { id }, data });
      revalidatePath("/locatarios");
      return { ok: true, id };
    }
    const created = await prisma.tenant.create({ data });
    revalidatePath("/locatarios");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Registro duplicado." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteTenant(tenantId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = tenantId.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.tenant.delete({ where: { id } });
    revalidatePath("/locatarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir. Verifique contratos vinculados." };
  }
}

