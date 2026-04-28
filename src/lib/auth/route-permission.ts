import type { PermissionId } from "@/lib/auth/permissions";

/** Rota → permissão necessária. Rotas não listadas exigem apenas sessão válida. */
export function permissionForPath(pathname: string): PermissionId | null {
  if (pathname === "/sem-acesso" || pathname.startsWith("/sem-acesso/")) {
    return null;
  }
  if (pathname === "/") {
    return "dashboard.view";
  }
  if (pathname.startsWith("/funcionarios") || pathname.startsWith("/professores")) {
    return "teachers.access";
  }
  if (pathname.startsWith("/presenca")) {
    return "attendance.access";
  }
  if (pathname.startsWith("/estoque")) {
    return "stock.access";
  }
  if (pathname.startsWith("/fornecedores")) {
    return "suppliers.access";
  }
  if (pathname.startsWith("/cameras")) {
    return "cameras.access";
  }
  if (pathname.startsWith("/financeiro")) {
    return "finance.access";
  }
  if (pathname.startsWith("/clientes")) {
    return "finance.access";
  }
  if (pathname.startsWith("/usuarios")) {
    return "users.manage";
  }
  if (pathname.startsWith("/administracao/funcoes-e-categorias")) {
    return "users.manage";
  }
  return null;
}
