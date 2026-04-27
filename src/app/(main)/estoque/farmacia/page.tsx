import { EstoqueCategoriaView } from "@/components/estoque-categoria-view";
import { ModuleGate } from "@/components/module-gate";
import { InventoryCategory } from "@/generated/prisma/client";

import { fetchInventoryItemsByCategory, fetchStockRegistryCategoryOptions } from "../inventory-data";

export default async function EstoqueFarmaciaPage() {
  const [rows, stockCategoryOptions] = await Promise.all([
    fetchInventoryItemsByCategory(InventoryCategory.PHARMACY),
    fetchStockRegistryCategoryOptions(InventoryCategory.PHARMACY),
  ]);

  return (
    <ModuleGate id="stock_pharmacy">
      <EstoqueCategoriaView
        category={InventoryCategory.PHARMACY}
        title="Farmácia escolar"
        items={rows}
        stockCategoryOptions={stockCategoryOptions}
      />
    </ModuleGate>
  );
}
