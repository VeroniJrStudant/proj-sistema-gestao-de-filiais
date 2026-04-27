/**
 * Ordenação de equipe por função (ex.: zeladoria → educadores) e alunos por nome.
 */

/**
 * Ordem exibida: serviços / apoio (zeladoria, limpeza…) → apoio pedagógico → gestão → educadores.
 * Valores menores aparecem primeiro.
 */
export function staffRoleSortKey(jobRole: string | null): number {
  const j = (jobRole ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/zelador|zeladoria|manutenc|porteir|limpeza|faxin|jardin/.test(j)) return 0;
  if (/auxiliar|cozinha|merendeira|nutric/.test(j)) return 1;
  if (/secret|coordenad|diret|administrativ|recepc/.test(j)) return 2;
  if (/professor|profess|educador|educadora|bercar|maternal|pedagog|docente/.test(j)) return 3;
  return 2;
}

export function sortStaffRows<T extends { name: string; jobRole: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ka = staffRoleSortKey(a.jobRole);
    const kb = staffRoleSortKey(b.jobRole);
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function sortStudentRows<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
