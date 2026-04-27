"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CadastroEdicaoCollapsible } from "@/components/cadastro-edicao-collapsible";
import { SupplierForm, type SupplierFormInitial } from "./supplier-form";
import { SupplierSearchPanel, type SupplierPickerRow } from "./supplier-search-panel";

type Props = {
  effectiveFornecedorId: string | null;
  /** Abre o bloco da ficha no topo (URL: ficha=1, cadastro=1, ok=1 ou equivalente). */
  revealFichaFromParams: boolean;
  initialCadastroOpen: boolean;
  header: ReactNode;
  suppliers: SupplierPickerRow[];
  ok: boolean;
  lastSavedSupplierId: string | undefined;
  initialForm: SupplierFormInitial | undefined;
  supplierCategoryOptions: readonly { id: string; name: string }[];
};

export function FornecedorShell({
  effectiveFornecedorId,
  revealFichaFromParams,
  initialCadastroOpen,
  header,
  suppliers,
  ok,
  lastSavedSupplierId,
  initialForm,
  supplierCategoryOptions,
}: Props) {
  const searchParams = useSearchParams();
  const cadastroForcedOpen = useMemo(() => searchParams.get("cadastro") === "1", [searchParams]);
  const [cadastroOpenInternal, setCadastroOpenInternal] = useState(initialCadastroOpen);
  const cadastroOpen = cadastroForcedOpen ? true : cadastroOpenInternal;
  const showHeader =
    revealFichaFromParams || (!effectiveFornecedorId && cadastroOpen);
  const fichaBelowList =
    Boolean(effectiveFornecedorId) && revealFichaFromParams && showHeader;
  const fichaBelowSearchOnly = showHeader && !effectiveFornecedorId;
  const fichaPanelOpen = Boolean(effectiveFornecedorId && revealFichaFromParams);

  useEffect(() => {
    function onOpenCadastroEdicao() {
      setCadastroOpenInternal(true);
      window.setTimeout(() => {
        document.getElementById("cadastro-edicao")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }

    window.addEventListener("open-cadastro-edicao", onOpenCadastroEdicao);
    return () => window.removeEventListener("open-cadastro-edicao", onOpenCadastroEdicao);
  }, []);

  return (
    <>
      <div className="mt-0 pt-1 sm:pt-2">
        <SupplierSearchPanel
          suppliers={suppliers}
          currentSupplierId={effectiveFornecedorId}
          fichaPanelOpen={fichaPanelOpen}
          belowSelectedFicha={fichaBelowList ? header : null}
        />
      </div>

      {fichaBelowSearchOnly ? <div className="mt-6">{header}</div> : null}

      {ok && (
        <div
          role="status"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-success-border bg-success-bg px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated-2 text-lg text-success-fg shadow-sm ring-1 ring-success-border"
              aria-hidden
            >
              ✓
            </span>
            <div>
              <p className="font-semibold text-success-fg">Cadastro salvo com sucesso</p>
              <p className="mt-0.5 text-sm text-success-fg/85">
                Os dados foram registrados. Você pode cadastrar outro fornecedor ou continuar editando.
              </p>
            </div>
          </div>
          <Link
            href="/fornecedores?cadastro=1"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent shadow-sm hover:bg-accent-hover sm:shrink-0"
          >
            Novo cadastro
          </Link>
        </div>
      )}

      <div id="cadastro-edicao" className="scroll-mt-24">
        <CadastroEdicaoCollapsible
          open={cadastroOpen}
          onOpenChange={setCadastroOpenInternal}
          showLabel="Cadastrar ou editar fornecedor"
          heading={
            <div>
              <h2 className="text-lg font-semibold text-ink">Cadastro e edição</h2>
              <p className="mt-1 text-sm text-muted">
                Identificação, contato, endereço, forma de pagamento e observações.
              </p>
            </div>
          }
        >
          <SupplierForm
            key={effectiveFornecedorId ?? "novo"}
            lastSavedSupplierId={lastSavedSupplierId}
            initial={initialForm}
            supplierCategoryOptions={supplierCategoryOptions}
          />
        </CadastroEdicaoCollapsible>
      </div>
    </>
  );
}
