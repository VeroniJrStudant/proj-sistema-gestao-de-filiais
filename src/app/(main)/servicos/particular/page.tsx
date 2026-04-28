import { ServicosCatalogParticularNav } from "../servicos-catalog-particular-nav";
import { ParticularTab } from "../particular-tab";

export const dynamic = "force-dynamic";

function empty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export default async function ServicosParticularPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ok = empty(typeof sp.ok === "string" ? sp.ok : "") === "1";

  return (
    <>
      <ServicosCatalogParticularNav
        active="particular"
        novoHref="/servicos/particular"
        novoLabel="Novo particular"
      />

      {ok ? (
        <div
          role="status"
          className="rounded-2xl border border-success-border bg-success-bg px-5 py-4 text-sm text-success-fg"
        >
          Cadastro particular salvo com sucesso.
        </div>
      ) : null}

      <ParticularTab searchParams={sp} />
    </>
  );
}
