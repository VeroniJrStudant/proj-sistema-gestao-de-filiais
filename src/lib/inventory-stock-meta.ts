import type { InventoryCategory } from "@/generated/prisma/client";

/** Lista única de estoque (abas por setor). */
export const ALMOXARIFADO_LIST_PATH = "/estoque/almoxarifado";

/** Categorias de estoque com aba e fluxo ativos na aplicação (exclui legado sem UI). */
export type ManagedInventoryCategory = Exclude<InventoryCategory, "PHARMACY">;

export const INVENTORY_STOCK_META: Record<
  ManagedInventoryCategory,
  { skuPrefix: string; almoxSlug: string }
> = {
  CLEANING: { skuPrefix: "L", almoxSlug: "limpeza" },
  SCHOOL_SUPPLIES: { skuPrefix: "M", almoxSlug: "escolar" },
  BUILDING_MAINTENANCE: { skuPrefix: "Z", almoxSlug: "zeladoria" },
};

export function inventoryCategoryListHref(category: ManagedInventoryCategory): string {
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
