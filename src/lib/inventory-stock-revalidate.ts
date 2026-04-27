import { revalidatePath } from "next/cache";
import { INVENTORY_STOCK_META } from "@/lib/inventory-stock-meta";

/** Revalida as quatro páginas de estoque (após mudança em categorias de item). */
export function revalidateAllInventoryStockPages(): void {
  const paths = new Set(Object.values(INVENTORY_STOCK_META).map((m) => m.path));
  for (const p of paths) {
    revalidatePath(p);
  }
}
