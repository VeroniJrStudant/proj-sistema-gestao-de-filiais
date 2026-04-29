import type { ManagedInventoryCategory } from "@/lib/inventory-stock-meta";
import type { ModuleId } from "@/lib/modules";
import { isModuleEnabled } from "@/lib/modules";
import { ALMOXARIFADO_LIST_PATH, INVENTORY_STOCK_META } from "@/lib/inventory-stock-meta";

export type AlmoxarifadoTabSlug = "limpeza" | "escolar" | "zeladoria";

export const ALMOXARIFADO_PATH = ALMOXARIFADO_LIST_PATH;

export type AlmoxarifadoTab = {
  slug: AlmoxarifadoTabSlug;
  category: ManagedInventoryCategory;
  moduleId: ModuleId;
  navLabel: string;
  viewTitle: string;
};

export const ALMOXARIFADO_TABS: readonly AlmoxarifadoTab[] = [
  {
    slug: INVENTORY_STOCK_META.CLEANING.almoxSlug as AlmoxarifadoTabSlug,
    category: "CLEANING",
    moduleId: "stock_cleaning",
    navLabel: "Limpeza",
    viewTitle: "Estoque — limpeza",
  },
  {
    slug: INVENTORY_STOCK_META.SCHOOL_SUPPLIES.almoxSlug as AlmoxarifadoTabSlug,
    category: "SCHOOL_SUPPLIES",
    moduleId: "stock_school",
    navLabel: "Material de escritório",
    viewTitle: "Estoque — material de escritório",
  },
  {
    slug: INVENTORY_STOCK_META.BUILDING_MAINTENANCE.almoxSlug as AlmoxarifadoTabSlug,
    category: "BUILDING_MAINTENANCE",
    moduleId: "stock_building",
    navLabel: "Zeladoria",
    viewTitle: "Material de zeladoria do prédio",
  },
];

export function almoxarifadoHref(slug: AlmoxarifadoTabSlug): string {
  return `${ALMOXARIFADO_PATH}?aba=${encodeURIComponent(slug)}`;
}

export function tabBySlug(slug: string): AlmoxarifadoTab | undefined {
  return ALMOXARIFADO_TABS.find((t) => t.slug === slug);
}

export function firstEnabledAlmoxarifadoTab(): AlmoxarifadoTab | null {
  for (const t of ALMOXARIFADO_TABS) {
    if (isModuleEnabled(t.moduleId)) return t;
  }
  return null;
}

/** Aba a exibir: válida e licenciada, ou primeira licenciada. */
export function resolveAlmoxarifadoTab(abaRaw: string): AlmoxarifadoTab | null {
  const t = tabBySlug(abaRaw);
  if (t && isModuleEnabled(t.moduleId)) return t;
  return firstEnabledAlmoxarifadoTab();
}
