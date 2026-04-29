"use client";

import { useState } from "react";
import type { BiOperacaoScope, DashboardSnapshot } from "@/lib/dashboard-stats";

type Filters = DashboardSnapshot["bi"]["filters"];

const scopeOptions: { value: BiOperacaoScope; label: string }[] = [
  { value: "todas", label: "Todas (qualquer vínculo)" },
  { value: "sem_vinculo", label: "Sem vínculo operacional" },
  { value: "filial", label: "Filial" },
  { value: "imovel", label: "Imóvel" },
  { value: "estacionamento", label: "Estacionamento" },
  { value: "servico", label: "Serviço particular" },
];

function multiKey(f: Filters): string {
  return [
    f.de,
    f.ate,
    f.scope,
    f.branchIds.join(","),
    f.propertyIds.join(","),
    f.parkingIds.join(","),
    f.particularServiceIds.join(","),
  ].join("|");
}

export function BiDashboardFilters({ filters }: { filters: Filters }) {
  const [scope, setScope] = useState<BiOperacaoScope>(filters.scope);

  return (
    <form action="/" method="get" className="mb-4 rounded-xl border border-line-soft bg-shell/80 p-3">
      <p className="text-xs font-medium text-muted">Filtros do BI (lançamentos financeiros)</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-medium text-muted">
          De
          <input
            type="date"
            name="bi_de"
            defaultValue={filters.de}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Até
          <input
            type="date"
            name="bi_ate"
            defaultValue={filters.ate}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          />
        </label>
        <label className="block text-xs font-medium text-muted sm:col-span-2 lg:col-span-2">
          Operação / vínculo
          <select
            name="bi_scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as BiOperacaoScope)}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          >
            {scopeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {scope === "filial" ? (
        <label key={`filial-${multiKey(filters)}`} className="mt-3 block text-xs font-medium text-muted">
          Filiais (opcional — sem seleção = todas)
          <select
            multiple
            name="bi_filial"
            defaultValue={filters.branchIds}
            size={Math.min(8, Math.max(3, filters.filterOptions.branches.length))}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          >
            {filters.filterOptions.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-subtle">Ctrl/Cmd + clique para várias filiais.</span>
        </label>
      ) : null}

      {scope === "imovel" ? (
        <label key={`imovel-${multiKey(filters)}`} className="mt-3 block text-xs font-medium text-muted">
          Imóveis (opcional — sem seleção = todos)
          <select
            multiple
            name="bi_imovel"
            defaultValue={filters.propertyIds}
            size={Math.min(8, Math.max(3, filters.filterOptions.properties.length))}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          >
            {filters.filterOptions.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-subtle">Ctrl/Cmd + clique para vários imóveis.</span>
        </label>
      ) : null}

      {scope === "estacionamento" ? (
        <label key={`est-${multiKey(filters)}`} className="mt-3 block text-xs font-medium text-muted">
          Estacionamentos (opcional — sem seleção = todos)
          <select
            multiple
            name="bi_estacionamento"
            defaultValue={filters.parkingIds}
            size={Math.min(8, Math.max(3, filters.filterOptions.parkings.length))}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          >
            {filters.filterOptions.parkings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-subtle">Ctrl/Cmd + clique para vários.</span>
        </label>
      ) : null}

      {scope === "servico" ? (
        <label key={`srv-${multiKey(filters)}`} className="mt-3 block text-xs font-medium text-muted">
          Serviços particulares (opcional — sem seleção = todos com lançamento vinculado)
          <select
            multiple
            name="bi_servico"
            defaultValue={filters.particularServiceIds}
            size={Math.min(10, Math.max(3, filters.filterOptions.particularServices.length))}
            className="mt-1 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm"
          >
            {filters.filterOptions.particularServices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-subtle">
            Só aparecem lançamentos com serviço associado no cadastro. Ctrl/Cmd + clique para vários.
          </span>
        </label>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
        >
          Aplicar filtros
        </button>
        <a href="/" className="text-xs font-medium text-accent-muted hover:underline">
          Limpar (padrão do mês)
        </a>
      </div>
    </form>
  );
}
