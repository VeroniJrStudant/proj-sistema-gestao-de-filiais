import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard-stats";
import { BiAnalyticsCharts } from "@/components/bi-analytics-charts";
import { BiDashboardFilters } from "@/components/bi-dashboard-filters";
import { formatBRL } from "@/lib/format-brl";
import { isModuleEnabled, type ModuleId } from "@/lib/modules";

type CardProps = {
  title: string;
  href: string;
  moduleId: ModuleId;
  children: React.ReactNode;
};

function BiPanel({ data }: { data: DashboardSnapshot["bi"] }) {
  const finance = data.finance;
  const admin = data.admin;
  const f = data.filters;
  const netTone = finance.periodNetCents >= 0 ? "text-emerald-600" : "text-rose-600";
  const vinculoLabel =
    f.scope === "filial"
      ? f.branchIds.length === 0
        ? "Filial: todas"
        : `Filial: ${f.branchIds.length} selecionada(s)`
      : f.scope === "imovel"
        ? f.propertyIds.length === 0
          ? "Imóvel: todos"
          : `Imóvel: ${f.propertyIds.length} selecionado(s)`
        : f.scope === "estacionamento"
          ? f.parkingIds.length === 0
            ? "Estacionamento: todos"
            : `Estacionamento: ${f.parkingIds.length} selecionado(s)`
          : f.scope === "servico"
            ? f.particularServiceIds.length === 0
              ? "Serviço particular: todos com vínculo"
              : `Serviço particular: ${f.particularServiceIds.length} selecionado(s)`
            : f.scope === "sem_vinculo"
              ? "Sem vínculo operacional"
              : "Todas as operações";
  const filterFormKey = `${f.de}|${f.ate}|${f.scope}|${f.branchIds.join(",")}|${f.propertyIds.join(",")}|${f.parkingIds.join(",")}|${f.particularServiceIds.join(",")}`;
  return (
    <section className="mb-6 rounded-2xl border border-line bg-elevated-2 p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">BI</p>
        <h2 className="text-base font-semibold text-ink">Análises financeiras e administrativas</h2>
      </div>
      <BiDashboardFilters key={filterFormKey} filters={f} />
      <p className="mb-4 text-[11px] text-subtle">
        Período aplicado: {f.de} a {f.ate} · {vinculoLabel}. As contagens de cadastro (usuários, clientes, etc.)
        permanecem globais.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line-soft bg-shell p-3">
          <p className="text-xs text-muted">Fluxo no período (entrada / saída)</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatBRL(finance.periodInCents)} / {formatBRL(finance.periodOutCents)}
          </p>
          <p className={`mt-1 text-xs font-medium ${netTone}`}>Saldo: {formatBRL(finance.periodNetCents)}</p>
        </div>
        <div className="rounded-xl border border-line-soft bg-shell p-3">
          <p className="text-xs text-muted">Receitas vencidas (inadimplência)</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatBRL(finance.overdueInCents)}</p>
          <p className="mt-1 text-xs text-muted">Pendências de saídas: {formatBRL(finance.pendingOutCents)}</p>
        </div>
        <div className="rounded-xl border border-line-soft bg-shell p-3">
          <p className="text-xs text-muted">Efetividade financeira</p>
          <p className="mt-1 text-sm font-semibold text-ink">{finance.settledRatePct}% lançamentos liquidados</p>
          <p className="mt-1 text-xs text-muted">No período selecionado</p>
        </div>
        <div className="rounded-xl border border-line-soft bg-shell p-3">
          <p className="text-xs text-muted">Saúde operacional</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Estoque {admin.stockHealthPct}% · Câmeras {admin.camerasOnlinePct}%
          </p>
          <p className="mt-1 text-xs text-muted">Qualidade operacional consolidada</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3 lg:grid-cols-6">
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Usuários: <strong className="text-ink">{admin.usersActive}</strong></span>
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Clientes: <strong className="text-ink">{admin.customersActive}</strong></span>
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Fornecedores: <strong className="text-ink">{admin.suppliersActive}</strong></span>
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Filiais: <strong className="text-ink">{admin.branchesActive}</strong></span>
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Imóveis: <strong className="text-ink">{admin.propertiesActive}</strong></span>
        <span className="rounded-lg border border-line-soft bg-shell px-2.5 py-1.5">Estacionamentos: <strong className="text-ink">{admin.parkingActive}</strong></span>
      </div>
      <BiAnalyticsCharts charts={data.charts} periodInCents={finance.periodInCents} periodOutCents={finance.periodOutCents} />
    </section>
  );
}

function Card({ title, href, moduleId, children }: CardProps) {
  const on = isModuleEnabled(moduleId);
  if (!on) return null;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm transition hover:border-accent-border hover:shadow-md"
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex flex-1 flex-col gap-2 text-sm text-muted">
        {children}
      </div>
      <span className="mt-3 text-xs font-medium text-accent-muted group-hover:underline">
        Abrir módulo →
      </span>
    </Link>
  );
}

export function DashboardGrid({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-2xl font-semibold tracking-tight text-ink">Indicadores</p>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Visão consolidada dos módulos ativos. O conjunto de cartões muda conforme a licença da
          unidade (variável de ambiente{" "}
          <code className="rounded bg-panel px-1 text-xs ring-1 ring-line-soft">
            NEXT_PUBLIC_ENABLED_MODULES
          </code>
          ).
        </p>
      </div>

      <BiPanel data={data.bi} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card title="Registros hoje" href="/presenca" moduleId="attendance">
          <p>
            <strong className="text-ink">{data.attendance.presentToday}</strong> sessões abertas
          </p>
          <p>
            <strong className="text-ink">{data.attendance.recordsToday}</strong> registros do dia
          </p>
        </Card>

        <Card title="Financeiro" href="/financeiro" moduleId="finance">
          <p>
            A receber (pendente):{" "}
            <strong className="text-ink">{formatBRL(data.finance.pendingInCents)}</strong>
          </p>
          <p>
            Recebido no mês:{" "}
            <strong className="text-ink">{formatBRL(data.finance.settledMonthInCents)}</strong>
          </p>
          <p className="text-xs">
            PIX / boleto em aberto: {data.finance.openPix} / {data.finance.openBoletos}
          </p>
        </Card>

        <Card title="Zeladoria" href="/estoque/almoxarifado?aba=zeladoria" moduleId="stock_building">
          <p>
            <strong className="text-ink">{data.stock.byCategory.BUILDING_MAINTENANCE ?? 0}</strong>{" "}
            itens
          </p>
          <p>
            <strong className="text-caution">{data.stock.lowByCategory.BUILDING_MAINTENANCE ?? 0}</strong>{" "}
            abaixo do mínimo
          </p>
        </Card>

        <Card title="Estoque — limpeza" href="/estoque/almoxarifado?aba=limpeza" moduleId="stock_cleaning">
          <p>
            <strong className="text-ink">{data.stock.byCategory.CLEANING ?? 0}</strong> itens
          </p>
          <p>
            <strong className="text-caution">{data.stock.lowByCategory.CLEANING ?? 0}</strong> abaixo
            do mínimo
          </p>
        </Card>

        <Card title="Material de escritório" href="/estoque/almoxarifado?aba=escolar" moduleId="stock_school">
          <p>
            <strong className="text-ink">{data.stock.byCategory.SCHOOL_SUPPLIES ?? 0}</strong> itens
          </p>
          <p>
            <strong className="text-caution">{data.stock.lowByCategory.SCHOOL_SUPPLIES ?? 0}</strong>{" "}
            abaixo do mínimo
          </p>
        </Card>

        <Card title="Câmeras" href="/cameras" moduleId="cameras">
          <p>
            <strong className="text-ink">{data.cameras.online}</strong> online de {data.cameras.total}
          </p>
        </Card>
      </div>
    </div>
  );
}
