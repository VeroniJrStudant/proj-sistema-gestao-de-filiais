import { revalidatePath } from "next/cache";
import { inventoryStockListRevalidatePath } from "@/lib/inventory-stock-meta";

const LEGACY_STOCK_PATHS = [
  "/estoque/limpeza",
  "/estoque/escolar",
  "/estoque/farmacia",
  "/estoque/zeladoria",
] as const;

/** Revalida a página única do almoxarifado e rotas antigas (redirecionam). */
export function revalidateAllInventoryStockPages(): void {
  revalidatePath(inventoryStockListRevalidatePath());
  for (const p of LEGACY_STOCK_PATHS) {
    revalidatePath(p);
  }
}
