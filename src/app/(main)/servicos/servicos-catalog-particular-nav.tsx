import Link from "next/link";

type Active = "catalogo" | "particular";

export function ServicosCatalogParticularNav({
  active,
  novoHref,
  novoLabel,
}: {
  active: Active;
  novoHref: string;
  novoLabel: string;
}) {
  return (
    <>
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Operações</p>
          <h1 className="mt-1 text-lg font-semibold text-ink sm:text-xl">Serviços</h1>
          <p className="mt-1 text-sm text-muted">
            Use as subpáginas <span className="text-ink">Catálogo</span> e <span className="text-ink">Particular</span>{" "}
            — o catálogo alimenta a lista usada em Particular.
          </p>
        </div>
        <Link
          href={novoHref}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-elevated-2"
        >
          {novoLabel}
        </Link>
      </header>

      <nav
        aria-label="Subpáginas de serviços"
        className="flex flex-wrap gap-2 border-b border-line-soft pb-3"
      >
        <Link
          href="/servicos/catalogo"
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === "catalogo"
              ? "border-accent-border bg-accent text-on-accent"
              : "border-line bg-elevated text-muted hover:border-accent-border/60 hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          Catálogo
        </Link>
        <Link
          href="/servicos/particular"
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === "particular"
              ? "border-accent-border bg-accent text-on-accent"
              : "border-line bg-elevated text-muted hover:border-accent-border/60 hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          Particular
        </Link>
      </nav>
    </>
  );
}
