"use client";

import { useMemo, useState } from "react";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";

const btnClass =
  "inline-flex items-center justify-center rounded-lg border border-accent-border bg-accent-soft px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-50";

type ExportFormat = "xlsx" | "csv";

type ExportRow = {
  id: string;
  title: string;
  description: string;
  dataset: string;
  /** Permissões (do token) já filtradas no server page; aqui é só display. */
  visible: boolean;
  extra?: Record<string, string>;
};

function buildHref(opts: {
  dataset: string;
  format: ExportFormat;
  from: string;
  to: string;
  extra?: Record<string, string>;
}): string {
  const p = new URLSearchParams();
  p.set("dataset", opts.dataset);
  p.set("format", opts.format);
  if (opts.from.trim()) p.set("from", opts.from.trim());
  if (opts.to.trim()) p.set("to", opts.to.trim());
  for (const [k, v] of Object.entries(opts.extra ?? {})) {
    if (v.trim()) p.set(k, v.trim());
  }
  return `/relatorios/export?${p.toString()}`;
}

export function RelatoriosExportPanel({
  canFinance,
  canSuppliers,
  canStock,
}: {
  canFinance: boolean;
  canSuppliers: boolean;
  canStock: boolean;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows: ExportRow[] = useMemo(() => {
    return [
      {
        id: "finance",
        title: "Financeiro — lançamentos",
        description: "Entradas e saídas (FinancialRecord) para análise gerencial e conciliação.",
        dataset: "financeiro-lancamentos",
        visible: canFinance,
      },
      {
        id: "clients",
        title: "Clientes",
        description: "Base de clientes com perfil de cobrança e vínculo operacional.",
        dataset: "clientes",
        visible: canFinance,
      },
      {
        id: "suppliers",
        title: "Fornecedores",
        description: "Cadastro de fornecedores e dados de pagamento.",
        dataset: "fornecedores",
        visible: canSuppliers,
      },
      {
        id: "branches",
        title: "Filiais",
        description: "Unidades operacionais e contactos.",
        dataset: "filiais",
        visible: true,
      },
      {
        id: "properties",
        title: "Imóveis",
        description: "Cadastro de propriedades e status.",
        dataset: "imoveis",
        visible: true,
      },
      {
        id: "parking",
        title: "Estacionamentos",
        description: "Cadastro de estacionamentos e capacidade.",
        dataset: "estacionamentos",
        visible: true,
      },
      {
        id: "stock-all",
        title: "Estoque — itens (todos os setores ativos)",
        description: "Itens do almoxarifado (sku, quantidades, mínimo, preço).",
        dataset: "estoque-itens",
        visible: canStock,
      },
      {
        id: "stock-cleaning",
        title: "Estoque — limpeza (itens)",
        description: "Exportação filtrada apenas para itens de limpeza.",
        dataset: "estoque-itens",
        visible: canStock,
        extra: { category: "CLEANING" },
      },
      {
        id: "stock-school",
        title: "Estoque — material de escritório (itens)",
        description: "Exportação filtrada apenas para itens de material de escritório.",
        dataset: "estoque-itens",
        visible: canStock,
        extra: { category: "SCHOOL_SUPPLIES" },
      },
      {
        id: "stock-building",
        title: "Estoque — zeladoria (itens)",
        description: "Exportação filtrada apenas para itens de zeladoria/manutenção.",
        dataset: "estoque-itens",
        visible: canStock,
        extra: { category: "BUILDING_MAINTENANCE" },
      },
    ];
  }, [canFinance, canSuppliers, canStock]);

  const visibleRows = rows.filter((r) => r.visible);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">Exportar relatórios (XLSX / CSV)</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Selecione um período (opcional). Os ficheiros são gerados no servidor e transferidos automaticamente.
          </p>
        </div>
        <div className="w-full sm:max-w-sm">
          <FilterDateRangeFields
            idPrefix="rel-export"
            dateFrom={from}
            dateTo={to}
            onDateFromChange={setFrom}
            onDateToChange={setTo}
            legend="Período (opcional)"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visibleRows.map((r) => (
          <div key={r.id} className="rounded-xl border border-line-soft bg-shell p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{r.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{r.description}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                className={btnClass}
                href={buildHref({ dataset: r.dataset, format: "xlsx", from, to, extra: r.extra })}
              >
                XLSX
              </a>
              <a
                className={btnClass}
                href={buildHref({ dataset: r.dataset, format: "csv", from, to, extra: r.extra })}
              >
                CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

