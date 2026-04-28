/**
 * Valores do enum Prisma `CustomerOperationLinkKind` sem importar o cliente Prisma
 * (evita bundle do runtime Prisma em Client Components).
 */
export type OperationLinkKind = "NONE" | "BRANCH" | "PROPERTY" | "PARKING_FACILITY";

export const OPERATION_LINK_KIND: Record<OperationLinkKind, OperationLinkKind> = {
  NONE: "NONE",
  BRANCH: "BRANCH",
  PROPERTY: "PROPERTY",
  PARKING_FACILITY: "PARKING_FACILITY",
};

export const OPERATION_LINK_KIND_UI_OPTIONS: { value: OperationLinkKind; label: string }[] = [
  { value: "NONE", label: "Nenhum (qualquer)" },
  { value: "BRANCH", label: "Filial" },
  { value: "PROPERTY", label: "Imóvel" },
  { value: "PARKING_FACILITY", label: "Estacionamento" },
];
