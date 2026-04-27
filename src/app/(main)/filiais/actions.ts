"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export type SaveBranchResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveBranch(formData: FormData): Promise<SaveBranchResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome da filial." };

  const code = emptyToNull(String(formData.get("code") ?? ""));
  if (code && code.length > 32) return { ok: false, error: "Código muito longo (máx. 32 caracteres)." };

  const data = {
    name,
    code,
    active: formData.get("active") === "on",
    phone: emptyToNull(String(formData.get("phone") ?? "")),
    email: emptyToNull(String(formData.get("email") ?? "")),
    document: emptyToNull(String(formData.get("document") ?? "")),
    street: emptyToNull(String(formData.get("street") ?? "")),
    number: emptyToNull(String(formData.get("number") ?? "")),
    complement: emptyToNull(String(formData.get("complement") ?? "")),
    neighborhood: emptyToNull(String(formData.get("neighborhood") ?? "")),
    city: emptyToNull(String(formData.get("city") ?? "")),
    state: emptyToNull(String(formData.get("state") ?? ""))?.toUpperCase().slice(0, 2) ?? null,
    zip: emptyToNull(String(formData.get("zip") ?? "")),
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };

  try {
    if (id) {
      const exists = await prisma.branch.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Filial não encontrada." };
      await prisma.branch.update({ where: { id }, data });
      revalidatePath("/filiais");
      revalidatePath("/");
      return { ok: true, id };
    }
    const created = await prisma.branch.create({ data });
    revalidatePath("/filiais");
    revalidatePath("/");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe uma filial com este código." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteBranch(branchId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = branchId.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.branch.delete({ where: { id } });
    revalidatePath("/filiais");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir. Verifique vínculos com imóveis/estacionamentos." };
  }
}

