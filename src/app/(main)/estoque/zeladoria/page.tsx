import { EstoqueCategoriaView } from "@/components/estoque-categoria-view";
import { ModuleGate } from "@/components/module-gate";
import { InventoryCategory } from "@/generated/prisma/client";

import { fetchInventoryItemsByCategory, fetchStockRegistryCategoryOptions } from "../inventory-data";

export default async function EstoqueZeladoriaPage() {
  const [rows, stockCategoryOptions] = await Promise.all([
    fetchInventoryItemsByCategory(InventoryCategory.BUILDING_MAINTENANCE),
    fetchStockRegistryCategoryOptions(InventoryCategory.BUILDING_MAINTENANCE),
  ]);

  return (
    <ModuleGate id="stock_building">
      <EstoqueCategoriaView
        category={InventoryCategory.BUILDING_MAINTENANCE}
        title="Material de zeladoria do prédio"
        items={rows}
        stockCategoryOptions={stockCategoryOptions}
      />
    </ModuleGate>
  );
}
