import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getEnabledModuleIds } from "@/lib/modules";
import {
  REPORT_SECTIONS,
  filterVisibleReportSections,
  type ReportSection,
} from "@/lib/reports-catalog";
import { RelatoriosExportPanel } from "./relatorios-export-panel";

export const dynamic = "force-dynamic";

function ReportCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm transition hover:border-accent-border hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink group-hover:text-accent">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-line-soft bg-shell px-2.5 py-1 text-xs font-semibold text-muted group-hover:border-accent-border group-hover:text-ink">
          Abrir
        </span>
      </div>
    </Link>
  );
}

function SectionBlock({ section }: { section: ReportSection }) {
  return (
    <section className="space-y-4" aria-labelledby={`rel-section-${section.id}`}>
      <div>
        <h2 id={`rel-section-${section.id}`} className="text-lg font-semibold text-ink">
          {section.title}
        </h2>
        {section.description ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{section.description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {section.items.map((item) => (
          <ReportCard key={item.href + item.title} title={item.title} description={item.description} href={item.href} />
        ))}
      </div>
    </section>
  );
}

export default async function RelatoriosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/relatorios");
  }

  const enabledModuleIds = getEnabledModuleIds();
  const visible = filterVisibleReportSections(REPORT_SECTIONS, {
    permissions: session.permissions,
    enabledModuleIds,
  });

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-10">
      <header className="rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Gestão e análise</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Relatórios e listagens</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Atalhos para todas as áreas do sistema onde pode consultar listas, exportar dados (quando disponível na
          página, por exemplo Excel no almoxarifado) e apoiar decisões de gestão e financeiras. Só aparecem módulos
          ativos na licença e rotas para as quais o seu utilizador tem permissão.
        </p>
      </header>

      <RelatoriosExportPanel
        canFinance={session.permissions.includes("finance.access")}
        canSuppliers={session.permissions.includes("suppliers.access")}
        canStock={session.permissions.includes("stock.access")}
      />

      {visible.length === 0 ? (
        <div
          className="rounded-2xl border border-warn-border bg-warn-bg px-5 py-8 text-center shadow-sm"
          role="status"
        >
          <p className="text-sm font-medium text-warn-text">Nenhum relatório disponível para o seu perfil</p>
          <p className="mt-2 text-sm text-warn-muted">
            Peça ao administrador permissões adicionais ou ativação de módulos, se precisar de outras listagens.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Voltar ao painel
          </Link>
        </div>
      ) : (
        visible.map((section) => <SectionBlock key={section.id} section={section} />)
      )}
    </div>
  );
}
