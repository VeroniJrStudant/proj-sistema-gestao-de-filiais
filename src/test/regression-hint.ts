/**
 * Mensagens padronizadas para falhas de teste: apontam o arquivo da área e o comportamento esperado,
 * para acelerar correção quando algo mudar sem querer.
 */
export const AREA = {
  filiaisActions: "src/app/(main)/filiais/actions.ts",
  imoveisActions: "src/app/(main)/imoveis/actions.ts",
  estacionamentosActions: "src/app/(main)/estacionamentos/actions.ts",
  locatariosActions: "src/app/(main)/locatarios/actions.ts",
  locacoesActions: "src/app/(main)/locacoes/actions.ts",
  moduleGate: "src/components/module-gate.tsx",
  modulesLib: "src/lib/modules.ts",
  themeToggle: "src/components/theme-toggle.tsx",
} as const;

export function regression(area: string, behavior: string): string {
  return `[${area}] ${behavior}\n→ Ajuste a implementação nesse arquivo ou atualize o teste se a regra de negócio mudou.`;
}
