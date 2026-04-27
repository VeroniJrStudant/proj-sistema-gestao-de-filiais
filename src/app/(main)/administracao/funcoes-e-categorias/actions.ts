"use server";

import { revalidatePath } from "next/cache";
import { CategoryScope } from "@/generated/prisma/client";
import { isStockRegistryScope } from "@/lib/inventory-registry-scope";
import { revalidateAllInventoryStockPages } from "@/lib/inventory-stock-revalidate";
import { prisma } from "@/lib/prisma";

function trimName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export async function createEmployeeJobRole(
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const n = trimName(name);
  if (!n) {
    return { ok: false, error: "Informe o nome da função." };
  }
  if (n.length > 120) {
    return { ok: false, error: "Nome muito longo (máx. 120 caracteres)." };
  }
  try {
    const maxSort = await prisma.employeeJobRole.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
    await prisma.employeeJobRole.create({
      data: { name: n, sortOrder },
    });
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Já existe uma função com este nome ou não foi possível salvar." };
  }
}

export async function updateEmployeeJobRole(
  id: string,
  data: { name?: string; active?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rid = id.trim();
  if (!rid) {
    return { ok: false, error: "Identificador inválido." };
  }
  const patch: { name?: string; active?: boolean } = {};
  if (data.name !== undefined) {
    const n = trimName(data.name);
    if (!n) {
      return { ok: false, error: "Informe o nome da função." };
    }
    patch.name = n;
  }
  if (data.active !== undefined) {
    patch.active = data.active;
  }
  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }
  try {
    await prisma.employeeJobRole.update({
      where: { id: rid },
      data: patch,
    });
    if (patch.name) {
      await prisma.teacher.updateMany({
        where: { employeeJobRoleId: rid },
        data: { jobRole: patch.name },
      });
    }
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar. O nome pode estar duplicado." };
  }
}

export async function deleteEmployeeJobRole(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rid = id.trim();
  if (!rid) {
    return { ok: false, error: "Identificador inválido." };
  }
  const inUse = await prisma.teacher.count({ where: { employeeJobRoleId: rid } });
  if (inUse > 0) {
    return { ok: false, error: "Esta função está em uso por funcionários. Desassocie ou altere antes de excluir." };
  }
  try {
    await prisma.employeeJobRole.delete({ where: { id: rid } });
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}

export async function createRegistryCategory(
  name: string,
  scope: CategoryScope,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const n = trimName(name);
  if (!n) {
    return { ok: false, error: "Informe o nome da categoria." };
  }
  if (n.length > 120) {
    return { ok: false, error: "Nome muito longo (máx. 120 caracteres)." };
  }
  try {
    const maxSort = await prisma.registryCategory.aggregate({
      where: { scope },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
    await prisma.registryCategory.create({
      data: { name: n, scope, sortOrder },
    });
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    revalidatePath("/fornecedores");
    if (isStockRegistryScope(scope)) {
      revalidateAllInventoryStockPages();
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Já existe uma categoria com este nome neste tipo ou não foi possível salvar." };
  }
}

export async function updateRegistryCategory(
  id: string,
  data: { name?: string; active?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rid = id.trim();
  if (!rid) {
    return { ok: false, error: "Identificador inválido." };
  }
  const patch: { name?: string; active?: boolean } = {};
  if (data.name !== undefined) {
    const n = trimName(data.name);
    if (!n) {
      return { ok: false, error: "Informe o nome da categoria." };
    }
    patch.name = n;
  }
  if (data.active !== undefined) {
    patch.active = data.active;
  }
  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }
  try {
    const existing = await prisma.registryCategory.findUnique({
      where: { id: rid },
      select: { scope: true },
    });
    if (!existing) {
      return { ok: false, error: "Categoria não encontrada." };
    }
    await prisma.registryCategory.update({
      where: { id: rid },
      data: patch,
    });
    if (patch.name) {
      await prisma.inventoryItem.updateMany({
        where: { stockRegistryCategoryId: rid },
        data: { productCategory: patch.name },
      });
    }
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    revalidatePath("/fornecedores");
    if (isStockRegistryScope(existing.scope)) {
      revalidateAllInventoryStockPages();
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar. O nome pode estar duplicado neste tipo." };
  }
}

export async function deleteRegistryCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rid = id.trim();
  if (!rid) {
    return { ok: false, error: "Identificador inválido." };
  }
  const [teachers, suppliers, inventoryItems] = await Promise.all([
    prisma.teacher.count({ where: { employeeCategoryId: rid } }),
    prisma.supplier.count({ where: { supplierCategoryId: rid } }),
    prisma.inventoryItem.count({ where: { stockRegistryCategoryId: rid } }),
  ]);
  if (teachers > 0 || suppliers > 0 || inventoryItems > 0) {
    return {
      ok: false,
      error: "Esta categoria está em uso. Remova a categoria dos cadastros antes de excluir.",
    };
  }
  try {
    const existing = await prisma.registryCategory.findUnique({
      where: { id: rid },
      select: { scope: true },
    });
    await prisma.registryCategory.delete({ where: { id: rid } });
    revalidatePath("/administracao/funcoes-e-categorias");
    revalidatePath("/funcionarios/novo");
    revalidatePath("/fornecedores");
    if (existing && isStockRegistryScope(existing.scope)) {
      revalidateAllInventoryStockPages();
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
