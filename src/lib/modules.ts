/**
 * Módulos licenciáveis. Ative via NEXT_PUBLIC_ENABLED_MODULES (lista separada por vírgula).
 * Se vazio ou ausente, todos os módulos ficam ativos (modo demonstração).
 */
export type ModuleId =
  | "attendance"
  | "stock_cleaning"
  | "stock_school"
  | "stock_pharmacy"
  | "stock_building"
  | "cameras"
  | "finance"
  | "branches"
  | "properties"
  | "parking"
  | "leases";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
  href: string;
  /** Categorias de estoque que este módulo controla (quando aplicável) */
  inventoryCategories?: readonly string[];
};

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  {
    id: "attendance",
    label: "Registro de entrada/saída",
    description: "Entrada e saída de imóveis e estacionamentos, com cobrança e pagamentos fracionados.",
    href: "/presenca",
  },
  {
    id: "stock_cleaning",
    label: "Estoque — limpeza",
    description: "Insumos de higiene e limpeza.",
    href: "/estoque/almoxarifado?aba=limpeza",
    inventoryCategories: ["CLEANING"],
  },
  {
    id: "stock_school",
    label: "Estoque — materiais escolares",
    description: "Papelaria, jogos e materiais didáticos.",
    href: "/estoque/almoxarifado?aba=escolar",
    inventoryCategories: ["SCHOOL_SUPPLIES"],
  },
  {
    id: "stock_pharmacy",
    label: "Farmácia escolar",
    description: "Itens de primeiros socorros e uso controlado.",
    href: "/estoque/almoxarifado?aba=farmacia",
    inventoryCategories: ["PHARMACY"],
  },
  {
    id: "stock_building",
    label: "Zeladoria do prédio",
    description: "Material de manutenção e conservação.",
    href: "/estoque/almoxarifado?aba=zeladoria",
    inventoryCategories: ["BUILDING_MAINTENANCE"],
  },
  {
    id: "cameras",
    label: "Câmeras de segurança",
    description: "Cadastro de pontos e links de visualização.",
    href: "/cameras",
  },
  {
    id: "finance",
    label: "Financeiro",
    description: "Entradas e saídas (mensalidades, cobranças, PIX, lote a pagar), recibos e configuração.",
    href: "/financeiro",
  },
  {
    id: "branches",
    label: "Filiais",
    description: "Unidades operacionais e dados de contato/endereço.",
    href: "/filiais",
  },
  {
    id: "properties",
    label: "Imóveis",
    description: "Cadastro de propriedades, status e vínculo com filial.",
    href: "/imoveis",
  },
  {
    id: "leases",
    label: "Serviços",
    description: "Rotinas e cadastros de serviços da unidade.",
    href: "/servicos/catalogo",
  },
  {
    id: "parking",
    label: "Estacionamentos",
    description: "Garagens/filiais de estacionamento e capacidade.",
    href: "/estacionamentos",
  },
] as const;

const ALL_IDS = new Set<ModuleId>(MODULE_REGISTRY.map((m) => m.id));

export function getEnabledModuleIds(): Set<ModuleId> {
  const raw = process.env.NEXT_PUBLIC_ENABLED_MODULES?.trim();
  if (!raw) {
    return ALL_IDS;
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ModuleId[];
  return new Set(ids.filter((id) => ALL_IDS.has(id)));
}

export function isModuleEnabled(id: ModuleId): boolean {
  return getEnabledModuleIds().has(id);
}

export function getEnabledModules(): ModuleDefinition[] {
  const enabled = getEnabledModuleIds();
  return MODULE_REGISTRY.filter((m) => enabled.has(m.id));
}
