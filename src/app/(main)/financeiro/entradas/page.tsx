import { ModuleGate } from "@/components/module-gate";
import Link from "next/link";

export default function FinanceiroEntradasPage() {
  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6 px-3 sm:px-4">
        <header>
          <nav className="text-sm text-muted">
            <Link href="/financeiro" className="text-accent-muted underline decoration-dotted hover:text-accent">
              Financeiro
            </Link>
            <span className="text-subtle"> · </span>
            <span className="text-ink">Entradas</span>
          </nav>
          <h1 className="mt-2 text-xl font-semibold text-ink">Entradas</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Tudo o que representa dinheiro a receber ou já recebido da família e de cobranças escolares: registro de
            mensalidade, geração de cobrança (PIX, cartão, boleto, NF) e PIX para impressão.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/financeiro/entradas/recebimento"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-ink">Recebimento de mensalidades</h2>
            <p className="mt-2 text-sm text-muted">
              Pagamento já recebido (PIX, dinheiro, transferência) ou boleto em aberto para controle interno.
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
              Abrir →
            </span>
          </Link>
          <Link
            href="/financeiro/entradas/pagamentos-pais"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-ink">Pagamentos (pais e responsáveis)</h2>
            <p className="mt-2 text-sm text-muted">
              PIX, documento de débito, boleto, cartão e pedido de nota fiscal — cobrança com vínculo ao aluno quando
              fizer sentido.
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
              Abrir →
            </span>
          </Link>
          <Link
            href="/financeiro/entradas/pix-impresso"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md sm:col-span-2 lg:col-span-1"
          >
            <h2 className="text-sm font-semibold text-ink">PIX — impresso (QR + código)</h2>
            <p className="mt-2 text-sm text-muted">
              QR Code, Pix copia e cola e código de barras de referência para a família pagar de qualquer lugar.
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
