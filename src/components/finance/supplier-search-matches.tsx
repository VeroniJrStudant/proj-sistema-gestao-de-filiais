"use client";

import {
  describeWhySupplierMatched,
  supplierMatchesSearchQuery,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import Link from "next/link";
import { useMemo } from "react";

export function SupplierSearchMatches({
  suppliers,
  query,
  onSelect,
}: {
  suppliers: FinanceSupplierSearchRow[];
  query: string;
  /** Quando definido, cada fornecedor vira um botão que preenche pagador / referência. */
  onSelect?: (row: FinanceSupplierSearchRow, searchQuery: string) => void;
}) {
  const matched = useMemo(
    () => suppliers.filter((s) => supplierMatchesSearchQuery(s, query)),
    [suppliers, query],
  );
  if (!query.trim() || matched.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 rounded-lg border border-line-soft bg-elevated px-3 py-2 text-xs text-ink">
      <p className="font-medium text-ink">Fornecedores</p>
      <p className="mt-0.5 text-muted">
        {onSelect
          ? "Toque para usar razão social, nome fantasia, CNPJ/CPF e e-mail do cadastro (sem vínculo com aluno)."
          : "Referência — não vincula aluno. Use o cadastro de fornecedores para contas a pagar."}
      </p>
      <ul className="mt-2 max-h-40 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft bg-elevated-2">
        {matched.slice(0, 20).map((s) => {
          const why = describeWhySupplierMatched(s, query);
          return (
            <li key={s.id}>
              {onSelect ? (
                <button
                  type="button"
                  className="w-full px-2 py-2 text-left transition-colors hover:bg-accent-soft"
                  onClick={() => onSelect(s, query)}
                >
                  <span className="font-medium text-ink">{s.name}</span>
                  {s.tradeName?.trim() ? <span className="text-subtle"> — {s.tradeName.trim()}</span> : null}
                  {s.document?.trim() ? <span className="text-subtle"> — {s.document.trim()}</span> : null}
                  {why ? (
                    <span className="mt-1 block text-[11px] font-medium text-accent-muted">
                      Corresponde à busca: {why}
                    </span>
                  ) : null}
                </button>
              ) : (
                <div className="px-2 py-2">
                  <span className="font-medium text-ink">{s.name}</span>
                  {s.tradeName?.trim() ? <span className="text-subtle"> — {s.tradeName.trim()}</span> : null}
                  {s.document?.trim() ? <span className="text-subtle"> — {s.document.trim()}</span> : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {matched.length > 20 ? (
        <p className="mt-1 text-subtle">E mais {matched.length - 20}… refine a busca.</p>
      ) : null}
      {!onSelect ? (
        <p className="mt-2">
          <Link
            href="/fornecedores"
            className="font-medium text-accent-muted underline decoration-dotted hover:text-accent"
          >
            Abrir Fornecedores
          </Link>
        </p>
      ) : null}
    </div>
  );
}
