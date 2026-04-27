import type { InventoryCategory } from "@/generated/prisma/client";

/** Rota a revalidar e prefixo do código automático (ex.: M20260001) por categoria. */
export const INVENTORY_STOCK_META: Record<
  InventoryCategory,
  { path: string; skuPrefix: string }
> = {
  CLEANING: { path: "/estoque/limpeza", skuPrefix: "L" },
  SCHOOL_SUPPLIES: { path: "/estoque/escolar", skuPrefix: "M" },
  PHARMACY: { path: "/estoque/farmacia", skuPrefix: "F" },
  BUILDING_MAINTENANCE: { path: "/estoque/zeladoria", skuPrefix: "Z" },
};

export function inventorySkuExample(prefix: string, year: number = new Date().getFullYear()): string {
  return `${prefix}${year}0001`;
}
