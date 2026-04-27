"use server";

import { CategoryScope, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function parsePaymentDate(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function nextSupplierCodeForYear(
  db: Pick<typeof prisma, "supplier">,
  year: number,
): Promise<string> {
  const prefix = `F${year}`;
  const last = await db.supplier.findFirst({
    where: { supplierCode: { startsWith: prefix } },
    orderBy: { supplierCode: "desc" },
    select: { supplierCode: true },
  });
  let seq = 1;
  if (last?.supplierCode) {
    const rest = last.supplierCode.slice(prefix.length);
    const n = parseInt(rest, 10);
    if (!Number.isNaN(n)) {
      seq = n + 1;
    }
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function previewNextSupplierCode(): Promise<string> {
  const year = new Date().getFullYear();
  return nextSupplierCodeForYear(prisma, year);
}

export type SaveSupplierResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveSupplier(formData: FormData): Promise<SaveSupplierResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Informe a razão social ou nome do fornecedor." };
  }

  const supplierCodeAuto = formData.get("supplierCodeAuto") === "on";
  const supplierCodeManual = String(formData.get("supplierCodeManual") ?? "").trim();

  if (!supplierCodeAuto && !supplierCodeManual) {
    return { ok: false, error: "Informe o código ou marque a opção para gerar automaticamente." };
  }
  if (!supplierCodeAuto && supplierCodeManual.length > 32) {
    return { ok: false, error: "Código muito longo (máx. 32 caracteres)." };
  }

  const year = new Date().getFullYear();
  let supplierCode: string | null;
  if (supplierCodeAuto) {
    if (id) {
      const current = await prisma.supplier.findUnique({
        where: { id },
        select: { supplierCode: true },
      });
      supplierCode = current?.supplierCode?.trim()
        ? current.supplierCode.trim()
        : await nextSupplierCodeForYear(prisma, year);
    } else {
      supplierCode = await nextSupplierCodeForYear(prisma, year);
    }
  } else {
    supplierCode = supplierCodeManual;
  }

  const supplierCategoryRaw = String(formData.get("supplierCategoryId") ?? "").trim();
  const supplierCategoryId = supplierCategoryRaw || null;

  if (supplierCategoryId) {
    const cat = await prisma.registryCategory.findFirst({
      where: { id: supplierCategoryId, scope: CategoryScope.SUPPLIER, active: true },
    });
    if (!cat) {
      return { ok: false, error: "Categoria inválida ou inativa. Cadastre em Administração → Funções e categorias." };
    }
  }

  const data = {
    supplierCode,
    name,
    tradeName: emptyToNull(String(formData.get("tradeName") ?? "")),
    document: emptyToNull(String(formData.get("document") ?? "")),
    phone: emptyToNull(String(formData.get("phone") ?? "")),
    email: emptyToNull(String(formData.get("email") ?? "")),
    street: emptyToNull(String(formData.get("street") ?? "")),
    number: emptyToNull(String(formData.get("number") ?? "")),
    complement: emptyToNull(String(formData.get("complement") ?? "")),
    neighborhood: emptyToNull(String(formData.get("neighborhood") ?? "")),
    city: emptyToNull(String(formData.get("city") ?? "")),
    state: emptyToNull(String(formData.get("state") ?? ""))?.toUpperCase().slice(0, 2) ?? null,
    zip: emptyToNull(String(formData.get("zip") ?? "")),
    notes: emptyToNull(String(formData.get("notes") ?? "")),
    paymentMethod: emptyToNull(String(formData.get("paymentMethod") ?? "")),
    paymentDate: parsePaymentDate(String(formData.get("paymentDate") ?? "")),
    active: formData.get("active") === "on",
    supplierCategoryId,
  };

  try {
    if (id) {
      const exists = await prisma.supplier.findUnique({ where: { id }, select: { id: true } });
      if (!exists) {
        return { ok: false, error: "Fornecedor não encontrado." };
      }
      await prisma.supplier.update({ where: { id }, data });
      revalidatePath("/fornecedores");
      return { ok: true, id };
    }
    const created = await prisma.supplier.create({ data });
    revalidatePath("/fornecedores");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe um fornecedor com este código. Use outro valor." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteSupplier(supplierId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = supplierId.trim();
  if (!id) {
    return { ok: false, error: "Identificador inválido." };
  }
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/fornecedores");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
