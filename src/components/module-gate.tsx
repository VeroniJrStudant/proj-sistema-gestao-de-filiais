import Link from "next/link";
import { isModuleEnabled, type ModuleId } from "@/lib/modules";

export function ModuleGate({
  id,
  children,
}: {
  id: ModuleId;
  children: React.ReactNode;
}) {
  if (!isModuleEnabled(id)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-warn-border bg-warn-bg p-8 text-center">
        <p className="text-lg font-medium text-warn-text">Este módulo não está no seu plano atual</p>
        <p className="mt-3 text-sm text-warn-muted">
          Os módulos são ativados por licença. Configure{" "}
          <code className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-ink ring-1 ring-line-soft">
            NEXT_PUBLIC_ENABLED_MODULES
          </code>{" "}
          em demonstrações ou solicite a combinação desejada ao fornecedor.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Voltar ao painel
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
