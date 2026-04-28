import Link from "next/link";
import { EstoqueCategoriaView } from "@/components/estoque-categoria-view";
import { ModuleGate } from "@/components/module-gate";
import { isModuleEnabled } from "@/lib/modules";
import { ALMOXARIFADO_TABS, almoxarifadoHref, resolveAlmoxarifadoTab } from "@/lib/almoxarifado-tabs";
import { fetchInventoryItemsByCategory, fetchStockRegistryCategoryOptions } from "../inventory-data";

export const dynamic = "force-dynamic";

function empty(v: string | string[] | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

export default async function AlmoxarifadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const aba = empty(sp.aba);
  const tab = resolveAlmoxarifadoTab(aba);

  if (!tab) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-warn-border bg-warn-bg p-8 text-center">
        <p className="text-lg font-medium text-warn-text">Nenhum setor de estoque ativo</p>
        <p className="mt-3 text-sm text-warn-muted">
          Não há módulos de almoxarifado habilitados na licença atual. Solicite a ativação ou ajuste{" "}
          <code className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-ink ring-1 ring-line-soft">
            NEXT_PUBLIC_ENABLED_MODULES
          </code>
          .
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Voltar ao painel
        </Link>
      </div>
    );
  }

  const [rows, stockCategoryOptions] = await Promise.all([
    fetchInventoryItemsByCategory(tab.category),
    fetchStockRegistryCategoryOptions(tab.category),
  ]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <header className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Operação</p>
        <h1 className="mt-1 text-lg font-semibold text-ink sm:text-xl">Almoxarifado</h1>
        <p className="mt-1 text-sm text-muted">
          Estoque por setor: limpeza, material escolar, farmácia escolar e zeladoria. Escolha a aba abaixo.
        </p>
      </header>

      <nav
        aria-label="Setores do almoxarifado"
        className="flex flex-wrap gap-2 border-b border-line-soft pb-3"
      >
        {ALMOXARIFADO_TABS.map((t) => {
          if (!isModuleEnabled(t.moduleId)) return null;
          const active = t.slug === tab.slug;
          return (
            <Link
              key={t.slug}
              href={almoxarifadoHref(t.slug)}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-accent-border bg-accent text-on-accent"
                  : "border-line bg-elevated text-muted hover:border-accent-border/60 hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              {t.navLabel}
            </Link>
          );
        })}
      </nav>

      <ModuleGate id={tab.moduleId}>
        <EstoqueCategoriaView
          category={tab.category}
          title={tab.viewTitle}
          items={rows}
          stockCategoryOptions={stockCategoryOptions}
        />
      </ModuleGate>
    </div>
  );
}
