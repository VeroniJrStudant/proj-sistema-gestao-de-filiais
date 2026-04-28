import { ModuleGate } from "@/components/module-gate";
import Link from "next/link";

export default function FinanceiroSaidasPage() {
  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6 px-3 sm:px-4">
        <header>
          <nav className="text-sm text-muted">
            <Link href="/financeiro" className="text-accent-muted underline decoration-dotted hover:text-accent">
              Financeiro
            </Link>
            <span className="text-subtle"> · </span>
            <span className="text-ink">Saídas</span>
          </nav>
          <h1 className="mt-2 text-xl font-semibold text-ink">Saídas</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Pagamentos da escola a terceiros: fornecedores, funcionários e favorecidos diversos. Hoje concentramos os
            lançamentos em lote; outras rotas de saída podem ser acrescentadas aqui depois.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/financeiro/saidas/lancamentos-lote"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md sm:col-span-2"
          >
            <h2 className="text-sm font-semibold text-ink">Lançamentos em lote (pagamentos)</h2>
            <p className="mt-2 text-sm text-muted">
              Vários pagamentos de uma vez, com código de barras ou linha digitável quando existir — fornecedores,
              funcionários ou depósito em massa de salários.
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
              Abrir →
            </span>
          </Link>
        </section>
      </div>
    </ModuleGate>
  );
}
