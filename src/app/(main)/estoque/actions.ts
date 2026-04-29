"use server";

import { revalidatePath } from "next/cache";
import { InventoryCategory, Prisma } from "@/generated/prisma/client";
import { parseBrlStringToCents } from "@/lib/brl-parse";
import { INVENTORY_CATEGORY_TO_REGISTRY_SCOPE } from "@/lib/inventory-registry-scope";
import {
  INVENTORY_STOCK_META,
  inventoryStockListRevalidatePath,
  type ManagedInventoryCategory,
} from "@/lib/inventory-stock-meta";
import { prisma } from "@/lib/prisma";
import { saveInventoryItemPhoto } from "@/lib/save-inventory-photo";

export type CreateInventoryItemState = { ok: true } | { ok: false; error: string };

function parseInventoryCategory(raw: string): ManagedInventoryCategory | null {
  const v = raw.trim() as InventoryCategory;
  return v in INVENTORY_STOCK_META ? (v as ManagedInventoryCategory) : null;
}

async function nextSkuForYear(
  db: Pick<typeof prisma, "inventoryItem">,
  letterPrefix: string,
  year: number,
): Promise<string> {
  const prefix = `${letterPrefix}${year}`;
  const last = await db.inventoryItem.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });
  let seq = 1;
  if (last?.sku) {
    const rest = last.sku.slice(prefix.length);
    const n = Number.parseInt(rest, 10);
    if (!Number.isNaN(n)) {
      seq = n + 1;
    }
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function previewNextInventorySku(category: ManagedInventoryCategory): Promise<string> {
  const meta = INVENTORY_STOCK_META[category];
  const year = new Date().getFullYear();
  return nextSkuForYear(prisma, meta.skuPrefix, year);
}

function parseNonNegativeQty(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "");
  if (t === "") return 0;
  const normalized = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t.replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function createInventoryItem(
  _prev: CreateInventoryItemState | null,
  formData: FormData,
): Promise<CreateInventoryItemState> {
  const category = parseInventoryCategory(String(formData.get("inventoryCategory") ?? ""));
  if (!category) {
    return { ok: false, error: "Categoria de estoque inválida." };
  }
  const { skuPrefix } = INVENTORY_STOCK_META[category];

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Informe o nome do item." };
  }

  const skuAuto = formData.get("skuAuto") === "on";
  let sku: string | null;
  if (skuAuto) {
    const year = new Date().getFullYear();
    sku = await nextSkuForYear(prisma, skuPrefix, year);
  } else {
    const manual = String(formData.get("skuManual") ?? "").trim();
    if (!manual) {
      return { ok: false, error: "Informe o código do item ou marque a opção para gerar automaticamente." };
    }
    if (manual.length > 32) {
      return { ok: false, error: "Código muito longo (máx. 32 caracteres)." };
    }
    sku = manual;
  }

  const quantity = parseNonNegativeQty(String(formData.get("quantity") ?? "0"));
  const minQuantity = parseNonNegativeQty(String(formData.get("minQuantity") ?? "0"));
  if (quantity === null || minQuantity === null) {
    return { ok: false, error: "Quantidades inválidas." };
  }

  const unit = String(formData.get("unit") ?? "UN").trim() || "UN";
  const unitPriceCents = parseBrlStringToCents(String(formData.get("unitPrice") ?? "")) ?? 0;

  const stockRegistryCategoryIdRaw = String(formData.get("stockRegistryCategoryId") ?? "").trim();
  const stockRegistryCategoryId = stockRegistryCategoryIdRaw || null;

  let productCategory: string | null = null;
  if (stockRegistryCategoryId) {
    const expectedScope = INVENTORY_CATEGORY_TO_REGISTRY_SCOPE[category];
    const reg = await prisma.registryCategory.findFirst({
      where: { id: stockRegistryCategoryId, scope: expectedScope, active: true },
    });
    if (!reg) {
      return {
        ok: false,
        error: "Categoria inválida ou inativa. Cadastre em Administração → Funções e categorias.",
      };
    }
    productCategory = reg.name;
  }

  const brandRaw = String(formData.get("brand") ?? "").trim();
  if (brandRaw.length > 80) {
    return { ok: false, error: "Marca muito longa (máx. 80 caracteres)." };
  }
  const brand = brandRaw === "" ? null : brandRaw;

  const image = formData.get("image");
  const file = image instanceof File && image.size > 0 ? image : null;

  let itemId: string;
  try {
    const item = await prisma.inventoryItem.create({
      data: {
        category,
        name,
        productCategory,
        stockRegistryCategoryId,
        brand,
        sku,
        quantity,
        minQuantity,
        unit,
        unitPriceCents,
      },
    });
    itemId = item.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Este código já está em uso. Informe outro código." };
    }
    return { ok: false, error: "Não foi possível cadastrar o item." };
  }

  if (file) {
    try {
      const url = await saveInventoryItemPhoto(itemId, file, "item");
      await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { imageUrl: url },
      });
    } catch (e) {
      await prisma.inventoryItem.delete({ where: { id: itemId } });
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Falha ao salvar a imagem.",
      };
    }
  }

  revalidatePath(inventoryStockListRevalidatePath());
  return { ok: true };
}
