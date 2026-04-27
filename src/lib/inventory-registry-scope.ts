import { CategoryScope, InventoryCategory } from "@/generated/prisma/client";

/** `InventoryCategory` (módulo do item) ↔ `CategoryScope` das categorias cadastráveis na administração. */
export const INVENTORY_CATEGORY_TO_REGISTRY_SCOPE: Record<InventoryCategory, CategoryScope> = {
  CLEANING: CategoryScope.STOCK_CLEANING,
  SCHOOL_SUPPLIES: CategoryScope.STOCK_SCHOOL_SUPPLIES,
  PHARMACY: CategoryScope.STOCK_PHARMACY,
  BUILDING_MAINTENANCE: CategoryScope.STOCK_BUILDING_MAINTENANCE,
};

export const STOCK_CATEGORY_SCOPES: readonly CategoryScope[] = [
  CategoryScope.STOCK_CLEANING,
  CategoryScope.STOCK_SCHOOL_SUPPLIES,
  CategoryScope.STOCK_PHARMACY,
  CategoryScope.STOCK_BUILDING_MAINTENANCE,
] as const;

export function isStockRegistryScope(scope: CategoryScope): boolean {
  return STOCK_CATEGORY_SCOPES.includes(scope);
}
