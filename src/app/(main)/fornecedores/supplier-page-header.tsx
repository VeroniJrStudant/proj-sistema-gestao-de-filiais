"use client";

import Link from "next/link";

type Props = {
  fornecedorId: string | null;
  savedName: string | null;
  savedTradeName: string | null;
  savedSupplierCode: string | null;
  fichaActive?: boolean;
};

export function SupplierPageHeader({
  fornecedorId,
  savedName,
  savedTradeName,
  savedSupplierCode,
  fichaActive,
}: Props) {
  const codeDisplay = savedSupplierCode?.trim() || "—";
  const codePlaceholder = codeDisplay === "—";
  const displayName = savedName?.trim() || "";
  const displayTrade = savedTradeName?.trim() || "";

  const showStatusCard = fornecedorId != null && fichaActive !== undefined;

  return (
    <header className="relative w-full max-w-none overflow-hidden rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8 lg:gap-12">
        <div className="min-w-0 w-full flex-1">
          <div
            className="w-full rounded-xl border border-accent-border/60 bg-accent-soft/50 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
            aria-label="Ficha do fornecedor"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">
              Ficha do fornecedor
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-8 sm:gap-y-3">
              <div className="min-w-0 shrink-0 sm:max-w-[11rem]">
                <span className="text-xs font-medium text-muted">Código de registro</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex min-h-11 min-w-11 max-w-[10rem] shrink-0 items-center justify-center rounded-xl px-2.5 text-sm font-bold tabular-nums leading-tight shadow-sm ${
                      codePlaceholder
                        ? "border border-line bg-elevated-2 text-muted"
                        : "bg-accent text-on-accent"
                    }`}
                    title={codePlaceholder ? undefined : codeDisplay}
                  >
                    {codeDisplay}
                  </span>
                  {codePlaceholder ? (
                    <span className="text-sm font-medium leading-snug text-subtle">
                      Definido ao salvar ou no formulário
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 flex-1 border-t border-line-soft pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
                <span className="text-xs font-medium text-muted">Razão social</span>
                <p
                  className={`mt-1 break-words text-lg font-semibold leading-snug tracking-tight sm:text-xl ${
                    displayName ? "text-ink" : "text-subtle"
                  }`}
                >
                  {displayName || "Preencha o nome no formulário"}
                </p>
                {displayTrade ? (
                  <p className="mt-1 text-sm text-muted">
                    Fantasia: <span className="font-medium text-ink">{displayTrade}</span>
                  </p>
                ) : null}
              </div>
            </div>
            {fornecedorId ? (
              <div className="border-t border-line-soft pt-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`/fornecedores?fornecedor=${encodeURIComponent(fornecedorId)}&cadastro=1`}
                    scroll={false}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent-border bg-accent-soft px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80"
                    title="Abrir cadastro para editar dados"
                    onClick={() => {
                      window.dispatchEvent(new Event("open-cadastro-edicao"));
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-accent-muted"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Atualizar cadastro
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {showStatusCard ? (
            <div
              className="mt-4 rounded-xl border border-line-soft bg-shell/60 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
              aria-label="Situação do cadastro"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Situação</p>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    fichaActive
                      ? "border border-success-border bg-success-bg text-success-fg"
                      : "border border-line-soft bg-elevated text-muted"
                  }`}
                >
                  {fichaActive ? "Ativo no sistema" : "Inativo"}
                </span>
              </div>
            </div>
          ) : null}

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Cadastrar fornecedor</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Registre dados fiscais, contato e forma de pagamento. O código de registro pode ser gerado automaticamente
            (prefixo F + ano) ou informado manualmente.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Razão social obrigatória</li>
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">CNPJ ou documento opcional</li>
          </ul>
        </div>
      </div>
    </header>
  );
}
