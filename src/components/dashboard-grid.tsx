import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard-stats";
import { formatBRL } from "@/lib/format-brl";
import { isModuleEnabled, type ModuleId } from "@/lib/modules";

type CardProps = {
  title: string;
  href: string;
  moduleId: ModuleId;
  children: React.ReactNode;
};

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

        <Card title="Materiais escolares" href="/estoque/almoxarifado?aba=escolar" moduleId="stock_school">
          <p>
            <strong className="text-ink">{data.stock.byCategory.SCHOOL_SUPPLIES ?? 0}</strong> itens
          </p>
          <p>
            <strong className="text-caution">{data.stock.lowByCategory.SCHOOL_SUPPLIES ?? 0}</strong>{" "}
            abaixo do mínimo
          </p>
        </Card>

        <Card title="Farmácia escolar" href="/estoque/almoxarifado?aba=farmacia" moduleId="stock_pharmacy">
          <p>
            <strong className="text-ink">{data.stock.byCategory.PHARMACY ?? 0}</strong> itens
          </p>
          <p>
            <strong className="text-caution">{data.stock.lowByCategory.PHARMACY ?? 0}</strong> abaixo
            do mínimo
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
