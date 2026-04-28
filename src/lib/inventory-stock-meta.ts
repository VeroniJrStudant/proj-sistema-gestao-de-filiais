import type { InventoryCategory } from "@/generated/prisma/client";

/** Lista única de estoque (abas por setor). */
export const ALMOXARIFADO_LIST_PATH = "/estoque/almoxarifado";

export const INVENTORY_STOCK_META: Record<
  InventoryCategory,
  { skuPrefix: string; almoxSlug: string }
> = {
  CLEANING: { skuPrefix: "L", almoxSlug: "limpeza" },
  SCHOOL_SUPPLIES: { skuPrefix: "M", almoxSlug: "escolar" },
  PHARMACY: { skuPrefix: "F", almoxSlug: "farmacia" },
  BUILDING_MAINTENANCE: { skuPrefix: "Z", almoxSlug: "zeladoria" },
};

export function inventoryCategoryListHref(category: InventoryCategory): string {
  const { almoxSlug } = INVENTORY_STOCK_META[category];
  return `${ALMOXARIFADO_LIST_PATH}?aba=${encodeURIComponent(almoxSlug)}`;
}

/** Caminho a revalidar após alterações em itens de estoque (uma página para todos os setores). */
export function inventoryStockListRevalidatePath(): string {
  return ALMOXARIFADO_LIST_PATH;
}

export function inventorySkuExample(prefix: string, year: number = new Date().getFullYear()): string {
  return `${prefix}${year}0001`;
}
