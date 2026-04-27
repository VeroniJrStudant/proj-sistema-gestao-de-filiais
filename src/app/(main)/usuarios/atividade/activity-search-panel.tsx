"use client";

import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { ACTIVITY_TYPE_FILTER_OPTIONS } from "@/lib/audit/activity-actions";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { isMsInDateRange } from "@/lib/date-range-filter";
import Link from "next/link";
import { useMemo, useState } from "react";

export type ActivityLogRow = {
  id: string;
  createdAt: string;
  action: string;
  actionLabel: string;
  summary: string;
  actorLabel: string;
  actorId: string | null;
  detailsJson: string | null;
  ip: string | null;
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

function haystack(row: ActivityLogRow): string {
  return [
    row.action,
    row.actionLabel,
    row.summary,
    row.actorLabel,
    row.actorId ?? "",
    row.ip ?? "",
    row.detailsJson ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(h: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((t) => h.includes(t));
}

export function ActivitySearchPanel({ logs }: { logs: ActivityLogRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilterId, setActorFilterId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const actorOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of logs) {
      if (r.actorId && r.actorLabel && !m.has(r.actorId)) {
        m.set(r.actorId, r.actorLabel);
      }
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [logs]);

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filtered = useMemo(() => {
    return logs.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (actorFilterId && r.actorId !== actorFilterId) return false;
      const ms = new Date(r.createdAt).getTime();
      if (!isMsInDateRange(ms, dateFrom, dateTo)) return false;
      return matchesSearch(haystack(r), tokens);
    });
  }, [logs, actionFilter, actorFilterId, dateFrom, dateTo, tokens]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(actionFilter) ||
    Boolean(actorFilterId) ||
    Boolean(dateFrom.trim()) ||
    Boolean(dateTo.trim());

  if (logs.length === 0) {
    return (
      <section
        className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-label="Lista de atividades"
      >
        <p className="text-sm font-semibold text-ink">Eventos</p>
        <p className="mt-1 text-sm text-muted">Ainda não há registros de atividade no sistema.</p>
      </section>
    );
  }

  return (
    <section
      className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Lista de atividades"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Buscar e filtrar</p>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="min-w-0 md:col-span-12">
          <FilterDateRangeFields
            idPrefix="activity-search"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            legend="Período (data/hora do evento)"
            className="md:max-w-xl"
          />
        </div>
        <div className="min-w-0 md:col-span-6">
          <label className={labelClass} htmlFor="activity-search-q">
            Buscar
          </label>
          <input
            id="activity-search-q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Resumo, tipo, quem, IP…"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="min-w-0 md:col-span-4">
          <label className={labelClass} htmlFor="activity-search-type">
            Tipo de atividade
          </label>
          <select
            id="activity-search-type"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {ACTIVITY_TYPE_FILTER_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 md:col-span-2">
          <label className={labelClass} htmlFor="activity-search-actor">
            Quem agiu
          </label>
          <select
            id="activity-search-actor"
            value={actorFilterId}
            onChange={(e) => setActorFilterId(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Todos</option>
            {actorOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/usuarios"
          className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-elevated-2"
        >
          ← Voltar a Usuários
        </Link>
        <ExportExcelReportButton
          onExport={() =>
            downloadExcelSheets(buildExcelFilename("atividade-usuarios"), [
              {
                sheetName: "Atividade",
                headers: ["Data/hora", "Tipo", "Resumo", "Quem agiu", "IP", "Código", "Detalhes (JSON)"],
                rows: filtered.map((r) => [
                  formatDateBrFromIso(r.createdAt) +
                    " " +
                    new Date(r.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                  r.actionLabel,
                  r.summary,
                  r.actorLabel,
                  r.ip ?? "—",
                  r.action,
                  r.detailsJson ?? "—",
                ]),
              },
            ])
          }
        />
      </div>

      {hasActiveFilters ? (
        <p className="mt-2 text-xs text-muted">
          {filtered.length} evento{filtered.length === 1 ? "" : "s"}
        </p>
      ) : null}

      <ul className="mt-4 max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
        {filtered.map((r) => (
          <li key={r.id}>
            <div className="block rounded-xl border border-line bg-elevated px-3 py-2.5 text-left text-sm shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{r.actionLabel}</span>
                <time
                  className="text-xs tabular-nums text-subtle"
                  dateTime={r.createdAt}
                  title={new Date(r.createdAt).toLocaleString("pt-BR")}
                >
                  {formatDateBrFromIso(r.createdAt)}{" "}
                  {new Date(r.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted">{r.summary}</p>
              <p className="mt-1 text-xs text-subtle">
                <span className="font-medium text-muted">Quem:</span> {r.actorLabel}
                {r.ip ? (
                  <>
                    {" "}
                    · <span className="font-medium text-muted">IP:</span> {r.ip}
                  </>
                ) : null}
              </p>
              {r.detailsJson ? (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-medium text-accent-muted hover:underline">
                    Detalhes técnicos (JSON)
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-line-soft bg-shell p-2 font-mono text-[11px] text-ink">
                    {r.detailsJson}
                  </pre>
                </details>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">Nenhum evento corresponde à busca ou aos filtros.</p>
      ) : null}
    </section>
  );
}
