import { EstoqueCategoriaView } from "@/components/estoque-categoria-view";
import { ModuleGate } from "@/components/module-gate";
import { InventoryCategory } from "@/generated/prisma/client";

import { fetchInventoryItemsByCategory, fetchStockRegistryCategoryOptions } from "../inventory-data";

export default async function EstoqueLimpezaPage() {
  const [rows, stockCategoryOptions] = await Promise.all([
    fetchInventoryItemsByCategory(InventoryCategory.CLEANING),
    fetchStockRegistryCategoryOptions(InventoryCategory.CLEANING),
  ]);

  return (
    <ModuleGate id="stock_cleaning">
      <EstoqueCategoriaView
        category={InventoryCategory.CLEANING}
        title="Estoque — limpeza"
        items={rows}
        stockCategoryOptions={stockCategoryOptions}
      />
    </ModuleGate>
  );
}
