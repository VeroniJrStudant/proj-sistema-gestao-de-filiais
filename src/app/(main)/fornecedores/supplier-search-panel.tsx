"use client";

import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { isMsInDateRange } from "@/lib/date-range-filter";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";

export type SupplierPickerRow = {
  id: string;
  supplierCode: string | null;
  supplierCategoryName: string | null;
  name: string;
  tradeName: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  paymentMethod: string | null;
  paymentDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function haystackForSupplier(s: SupplierPickerRow): string {
  return [
    s.name,
    s.supplierCode ?? "",
    s.supplierCategoryName ?? "",
    s.tradeName ?? "",
    s.document ?? "",
    s.phone ?? "",
    s.email ?? "",
    s.city ?? "",
    s.state ?? "",
    s.paymentMethod ?? "",
    s.active ? "ativo" : "inativo",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((x) => haystack.includes(x));
}

function SupplierListRowBadge({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent-muted ring-1 ring-accent-border/40"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export type SupplierSearchPanelProps = {
  suppliers: SupplierPickerRow[];
  currentSupplierId: string | null;
  belowSelectedFicha?: ReactNode | null;
  fichaPanelOpen?: boolean;
};

export function SupplierSearchPanel({
  suppliers,
  currentSupplierId,
  belowSelectedFicha = null,
  fichaPanelOpen = false,
}: SupplierSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (statusFilter === "active" && !s.active) return false;
      if (statusFilter === "inactive" && s.active) return false;
      const createdMs = new Date(s.createdAt).getTime();
      if (!isMsInDateRange(createdMs, dateFrom, dateTo)) return false;
      return matchesSearch(haystackForSupplier(s), tokens);
    });
  }, [suppliers, statusFilter, tokens, dateFrom, dateTo]);

  const selectedInFiltered = useMemo(
    () => (currentSupplierId ? filtered.some((s) => s.id === currentSupplierId) : false),
    [filtered, currentSupplierId],
  );

  const expandedFichaInList = Boolean(belowSelectedFicha && currentSupplierId && selectedInFiltered);

  if (suppliers.length === 0) {
    return (
      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-label="Buscar fornecedor"
      >
        <p className="text-sm font-semibold text-ink">Buscar fornecedor</p>
        <p className="mt-1 text-sm text-muted">Ainda não há fornecedores cadastrados.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Buscar fornecedor"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Buscar e filtrar</p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-12">
          <FilterDateRangeFields
            idPrefix="supplier-search"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            legend="Período (cadastro do fornecedor)"
            className="md:max-w-xl"
          />
        </div>
        <div className="md:col-span-9">
          <label className={labelClass} htmlFor="supplier-search-q">
            Buscar
          </label>
          <input
            id="supplier-search-q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Razão social, fantasia, código, CNPJ ou cidade…"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass} htmlFor="supplier-search-status">
            Situação
          </label>
          <select
            id="supplier-search-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <ExportExcelReportButton
          onExport={() =>
            downloadExcelSheets(buildExcelFilename("fornecedores"), [
              {
                sheetName: "Fornecedores",
                headers: [
                  "ID",
                  "Código",
                  "Razão social",
                  "Nome fantasia",
                  "Categoria",
                  "Documento",
                  "Telefone",
                  "E-mail",
                  "Cidade",
                  "UF",
                  "Situação",
                  "Forma pagamento",
                  "Data ref. pagamento",
                  "Criado em",
                  "Atualizado em",
                ],
                rows: filtered.map((s) => [
                  s.id,
                  s.supplierCode ?? "",
                  s.name,
                  s.tradeName ?? "",
                  s.supplierCategoryName ?? "",
                  s.document ?? "",
                  s.phone ?? "",
                  s.email ?? "",
                  s.city ?? "",
                  s.state ?? "",
                  s.active ? "Ativo" : "Inativo",
                  s.paymentMethod ?? "",
                  s.paymentDate ? formatDateBrFromIso(s.paymentDate) : "—",
                  formatDateBrFromIso(s.createdAt),
                  formatDateBrFromIso(s.updatedAt),
                ]),
              },
            ])
          }
        />
      </div>

      {(searchQuery.trim() ||
        statusFilter !== "all" ||
        dateFrom.trim() ||
        dateTo.trim()) && (
        <p className="mt-2 text-xs text-muted">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      <ul
        className={`mt-4 space-y-2 pr-1 ${
          expandedFichaInList ? "max-h-none overflow-visible" : "max-h-[min(24rem,50vh)] overflow-y-auto"
        }`}
      >
        {filtered.map((s) => {
          const base = `/fornecedores?fornecedor=${encodeURIComponent(s.id)}`;
          const href =
            currentSupplierId === s.id && fichaPanelOpen ? base : `${base}&ficha=1&cadastro=1`;
          const isSelected = currentSupplierId === s.id;
          return (
            <li key={s.id} className="space-y-2">
              <Link
                href={href}
                scroll={false}
                className={`block rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "border-accent-border bg-accent-soft ring-2 ring-accent/25"
                    : "border-line bg-elevated hover:border-accent-border/60 hover:bg-elevated-2"
                }`}
              >
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <SupplierListRowBadge name={s.name} />
                    <span className="min-w-0 font-medium text-ink">{s.name}</span>
                    {!s.active ? (
                      <span className="rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn-text">
                        Inativo
                      </span>
                    ) : null}
                  </span>
                </span>
                {s.tradeName ? <span className="mt-0.5 block text-xs text-muted">Fantasia: {s.tradeName}</span> : null}
                {s.supplierCategoryName ? (
                  <span className="mt-0.5 block text-xs text-muted">Categoria: {s.supplierCategoryName}</span>
                ) : null}
                <span className="mt-0.5 block text-xs text-muted">
                  {s.supplierCode ? (
                    <>
                      Código <span className="tabular-nums text-subtle">{s.supplierCode}</span>
                    </>
                  ) : (
                    "Sem código de registro"
                  )}
                </span>
                <span className="mt-1 block text-xs text-subtle">
                  {[s.document, s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                </span>
              </Link>
              {isSelected && belowSelectedFicha ? (
                <div className="mt-3 w-full min-w-0 sm:-mx-1 sm:px-1">{belowSelectedFicha}</div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {belowSelectedFicha && currentSupplierId && !selectedInFiltered ? (
        <div className="mt-4 w-full min-w-0">{belowSelectedFicha}</div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">Nenhum resultado para a busca ou filtros.</p>
      ) : null}
    </section>
  );
}
