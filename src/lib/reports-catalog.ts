import type { PermissionId } from "@/lib/auth/permissions";
import type { ModuleId } from "@/lib/modules";

export type ReportLinkItem = {
  title: string;
  description: string;
  href: string;
  /** Se definido, o utilizador precisa desta permissão para ver o atalho. */
  permission?: PermissionId;
  /** Se definido, o módulo tem de estar ativo na licença (`NEXT_PUBLIC_ENABLED_MODULES`). */
  moduleId?: ModuleId;
};

export type ReportSection = {
  id: string;
  title: string;
  description?: string;
  items: readonly ReportLinkItem[];
};

export const REPORT_SECTIONS: readonly ReportSection[] = [
  {
    id: "overview",
    title: "Indicadores e painéis",
    description: "Resumos consolidados para acompanhamento da gestão.",
    items: [
      {
        title: "Painel principal",
        description: "Indicadores gerais: estoque, câmeras e módulos ativos.",
        href: "/",
        permission: "dashboard.view",
      },
      {
        title: "Segurança e auditoria",
        description: "Resumo de eventos de segurança e acessos monitorados.",
        href: "/seguranca",
      },
    ],
  },
  {
    id: "operations",
    title: "Operações e cadastros",
    description: "Listagens de unidades, imóveis, estacionamentos e serviços.",
    items: [
      {
        title: "Filiais",
        description: "Lista de unidades operacionais, contactos e endereços.",
        href: "/filiais",
        moduleId: "branches",
      },
      {
        title: "Imóveis",
        description: "Cadastro de propriedades, estados e vínculo com filial.",
        href: "/imoveis",
        moduleId: "properties",
      },
      {
        title: "Estacionamentos",
        description: "Capacidade e dados das garagens / filiais de estacionamento.",
        href: "/estacionamentos",
        moduleId: "parking",
      },
      {
        title: "Serviços — catálogo",
        description: "Itens e preços do catálogo de serviços da unidade.",
        href: "/servicos/catalogo",
        moduleId: "leases",
      },
      {
        title: "Serviços — particular",
        description: "Serviços avulsos ou negociados fora do catálogo padrão.",
        href: "/servicos/particular",
        moduleId: "leases",
      },
    ],
  },
  {
    id: "finance",
    title: "Financeiro e cobrança",
    description: "Extratos, entradas, saídas e ferramentas de faturação.",
    items: [
      {
        title: "Visão financeira",
        description: "Painel de entradas, saídas e totais do período.",
        href: "/financeiro",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Entradas (consolidado)",
        description: "Lista e filtros de todas as entradas de caixa.",
        href: "/financeiro/entradas",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Entradas — recebimento",
        description: "Registos de recebimento vinculados a entradas.",
        href: "/financeiro/entradas/recebimento",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Entradas — PIX impresso",
        description: "Controlo de PIX gerados para impressão ou envio.",
        href: "/financeiro/entradas/pix-impresso",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Entradas — pagamentos (pais)",
        description: "Pagamentos associados a responsáveis e mensalidades.",
        href: "/financeiro/entradas/pagamentos-pais",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Recebimento",
        description: "Fluxo de recebimentos e conciliação rápida.",
        href: "/financeiro/recebimento",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "PIX impresso",
        description: "Lista e gestão de payloads PIX para cobrança.",
        href: "/financeiro/pix-impresso",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Pagamentos (pais)",
        description: "Visão de pagamentos por responsável financeiro.",
        href: "/financeiro/pagamentos-pais",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Lançamentos em lote",
        description: "Importação ou registo em massa de lançamentos.",
        href: "/financeiro/lancamentos-lote",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Lançamento direto",
        description: "Inclusão pontual de receitas ou despesas.",
        href: "/financeiro/direta",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Saídas",
        description: "Listagem de despesas, fornecedores e pagamentos a realizar.",
        href: "/financeiro/saidas",
        permission: "finance.access",
        moduleId: "finance",
      },
      {
        title: "Saídas — lançamentos em lote",
        description: "Saídas registadas em lote para análise gerencial.",
        href: "/financeiro/saidas/lancamentos-lote",
        permission: "finance.access",
        moduleId: "finance",
      },
    ],
  },
  {
    id: "customers",
    title: "Clientes",
    description: "Base de clientes para faturação e vínculo operacional.",
    items: [
      {
        title: "Clientes",
        description: "Lista completa com perfil de cobrança e documentos.",
        href: "/clientes",
        permission: "finance.access",
      },
    ],
  },
  {
    id: "stock",
    title: "Estoque e almoxarifado",
    description: "Itens, quantidades e valores por setor.",
    items: [
      {
        title: "Almoxarifado (todas as abas)",
        description: "Vista única com alternância entre setores de estoque.",
        href: "/estoque/almoxarifado",
        permission: "stock.access",
      },
      {
        title: "Estoque — limpeza",
        description: "Itens de higiene e limpeza; exportação Excel na própria lista.",
        href: "/estoque/almoxarifado?aba=limpeza",
        permission: "stock.access",
        moduleId: "stock_cleaning",
      },
      {
        title: "Estoque — material de escritório",
        description: "Papelaria e consumíveis de escritório.",
        href: "/estoque/almoxarifado?aba=escolar",
        permission: "stock.access",
        moduleId: "stock_school",
      },
      {
        title: "Estoque — zeladoria",
        description: "Material de manutenção e conservação predial.",
        href: "/estoque/almoxarifado?aba=zeladoria",
        permission: "stock.access",
        moduleId: "stock_building",
      },
    ],
  },
  {
    id: "suppliers",
    title: "Compras e fornecedores",
    items: [
      {
        title: "Fornecedores",
        description: "Cadastro, condições de pagamento e contactos.",
        href: "/fornecedores",
        permission: "suppliers.access",
      },
    ],
  },
  {
    id: "people",
    title: "Pessoas e equipa",
    items: [
      {
        title: "Funcionários",
        description: "Lista e cadastro da equipa da unidade.",
        href: "/funcionarios/novo",
        permission: "teachers.access",
      },
    ],
  },
  {
    id: "access-control",
    title: "Presença e acessos",
    items: [
      {
        title: "Registro de entrada/saída",
        description: "Sessões em imóveis e estacionamentos com cobrança.",
        href: "/presenca",
        permission: "attendance.access",
        moduleId: "attendance",
      },
      {
        title: "Câmeras",
        description: "Pontos instalados, estado e links de visualização.",
        href: "/cameras",
        permission: "cameras.access",
        moduleId: "cameras",
      },
    ],
  },
  {
    id: "admin",
    title: "Administração e contas",
    items: [
      {
        title: "Área de administração",
        description: "Atalhos para cadastros auxiliares e manutenção.",
        href: "/administracao",
      },
      {
        title: "Funções e categorias",
        description: "Registos cadastrais usados em formulários do sistema.",
        href: "/administracao/funcoes-e-categorias",
        permission: "users.manage",
      },
      {
        title: "Utilizadores",
        description: "Contas, perfis e permissões de acesso ao sistema.",
        href: "/usuarios",
        permission: "users.manage",
      },
      {
        title: "Atividade dos utilizadores",
        description: "Registo de ações e auditoria de utilização.",
        href: "/usuarios/atividade",
        permission: "users.manage",
      },
      {
        title: "Dados da empresa",
        description: "Configuração fiscal e identidade da entidade no financeiro.",
        href: "/financeiro/configuracao-empresa",
        permission: "users.manage",
        moduleId: "finance",
      },
    ],
  },
  {
    id: "communication",
    title: "Comunicação",
    items: [
      {
        title: "Mural",
        description: "Avisos e comunicados internos.",
        href: "/mural",
      },
    ],
  },
] as const;

export function filterVisibleReportSections(
  sections: readonly ReportSection[],
  opts: { permissions: readonly PermissionId[]; enabledModuleIds: ReadonlySet<ModuleId> },
): ReportSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.moduleId && !opts.enabledModuleIds.has(item.moduleId)) {
          return false;
        }
        if (item.permission && !opts.permissions.includes(item.permission)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);
}
