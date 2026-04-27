import { EstoqueCategoriaView } from "@/components/estoque-categoria-view";
import { ModuleGate } from "@/components/module-gate";
import { InventoryCategory } from "@/generated/prisma/client";

import { fetchInventoryItemsByCategory, fetchStockRegistryCategoryOptions } from "../inventory-data";

export default async function EstoqueEscolarPage() {
  const [rows, stockCategoryOptions] = await Promise.all([
    fetchInventoryItemsByCategory(InventoryCategory.SCHOOL_SUPPLIES),
    fetchStockRegistryCategoryOptions(InventoryCategory.SCHOOL_SUPPLIES),
  ]);

  return (
    <ModuleGate id="stock_school">
      <EstoqueCategoriaView
        category={InventoryCategory.SCHOOL_SUPPLIES}
        title="Estoque — materiais escolares"
        items={rows}
        stockCategoryOptions={stockCategoryOptions}
      />
    </ModuleGate>
  );
}
