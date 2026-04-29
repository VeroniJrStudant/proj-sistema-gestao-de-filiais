import type { UserProfileRole } from "@/generated/prisma/client";

export type PermissionId = (typeof PERMISSION_REGISTRY)[number]["id"];

export const PERMISSION_REGISTRY = [
  { id: "dashboard.view", label: "Painel e indicadores", description: "Ver página inicial e resumos." },
  { id: "teachers.access", label: "Funcionários", description: "Cadastro e consulta da equipe da unidade." },
  {
    id: "attendance.access",
    label: "Registro de entrada/saída",
    description: "Controle de acesso e cobrança para imóveis e estacionamentos.",
  },
  { id: "stock.access", label: "Almoxarifado", description: "Estoque por setor (limpeza, material de escritório, farmácia, zeladoria)." },
  { id: "suppliers.access", label: "Fornecedores", description: "Cadastro e consulta de fornecedores." },
  { id: "cameras.access", label: "Câmeras", description: "Pontos e links de visualização." },
  { id: "finance.access", label: "Financeiro", description: "Mensalidades, pagamentos e extratos." },
  { id: "users.manage", label: "Usuários e permissões", description: "Criar contas e definir perfis." },
] as const;

const ALL_IDS = PERMISSION_REGISTRY.map((p) => p.id) as PermissionId[];

/** Permissões que cada perfil pode receber (limite máximo ao cadastrar). */
export const PERMISSION_POOL: Record<UserProfileRole, readonly PermissionId[]> = {
  ADMIN: ALL_IDS,
  TEACHER: [
    "dashboard.view",
    "attendance.access",
    "suppliers.access",
  ],
  STUDENT: ["dashboard.view", "attendance.access"],
  PARENT: ["dashboard.view", "attendance.access", "finance.access"],
  LEGAL_GUARDIAN: [
    "dashboard.view",
    "attendance.access",
    "finance.access",
  ],
};

/** Valores sugeridos ao criar um usuário (podem ser ajustados dentro do pool). */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserProfileRole, readonly PermissionId[]> = {
  ADMIN: ALL_IDS,
  TEACHER: [
    "dashboard.view",
    "attendance.access",
  ],
  STUDENT: ["dashboard.view", "attendance.access"],
  PARENT: [
    "dashboard.view",
    "attendance.access",
    "finance.access",
  ],
  LEGAL_GUARDIAN: [
    "dashboard.view",
    "attendance.access",
    "finance.access",
  ],
};

export const ROLE_LABELS: Record<UserProfileRole, string> = {
  ADMIN: "Administrador",
  TEACHER: "Funcionário(a)",
  STUDENT: "Aluno(a)",
  PARENT: "Pais / responsável",
  LEGAL_GUARDIAN: "Responsável legal",
};

export function isPermissionId(value: string): value is PermissionId {
  return ALL_IDS.includes(value as PermissionId);
}

export function sanitizePermissionsForRole(
  role: UserProfileRole,
  requested: readonly string[],
): PermissionId[] {
  const pool = new Set(PERMISSION_POOL[role]);
  const out: PermissionId[] = [];
  for (const id of requested) {
    if (isPermissionId(id) && pool.has(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

export function resolveStoredPermissions(
  role: UserProfileRole,
  permissionsJson: string | null | undefined,
): PermissionId[] {
  let parsed: unknown;
  try {
    parsed = permissionsJson ? JSON.parse(permissionsJson) : [];
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed)) {
    return [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
  }
  const strings = parsed.filter((x): x is string => typeof x === "string");
  const sanitized = sanitizePermissionsForRole(role, strings);
  if (sanitized.length === 0) {
    return [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
  }
  return sanitized;
}
