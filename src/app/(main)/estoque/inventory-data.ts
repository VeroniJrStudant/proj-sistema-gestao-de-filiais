import type { InventoryCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { INVENTORY_CATEGORY_TO_REGISTRY_SCOPE } from "@/lib/inventory-registry-scope";

export async function fetchInventoryItemsByCategory(category: InventoryCategory) {
  const rows = await prisma.inventoryItem.findMany({
    where: { category },
    orderBy: { name: "asc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      productCategory: true,
      stockRegistryCategory: { select: { name: true } },
      brand: true,
      sku: true,
      quantity: true,
      minQuantity: true,
      unit: true,
      imageUrl: true,
      unitPriceCents: true,
    },
  });
  return rows.map(({ stockRegistryCategory, ...r }) => ({
    ...r,
    productCategory: stockRegistryCategory?.name?.trim() ?? r.productCategory?.trim() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function fetchStockRegistryCategoryOptions(category: InventoryCategory) {
  const scope = INVENTORY_CATEGORY_TO_REGISTRY_SCOPE[category];
  return prisma.registryCategory.findMany({
    where: { active: true, scope },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}
