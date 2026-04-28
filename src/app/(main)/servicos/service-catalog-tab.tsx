import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteServiceCatalog, saveServiceCatalog } from "./service-catalog-actions";

function empty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

const base = "/servicos/catalogo";

export async function ServiceCatalogTab({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const selectedId = empty(typeof searchParams.servico === "string" ? searchParams.servico : "");

  const [rows, selected] = await Promise.all([
    prisma.serviceCatalog.findMany({ orderBy: [{ updatedAt: "desc" }] }),
    selectedId ? prisma.serviceCatalog.findUnique({ where: { id: selectedId } }) : Promise.resolve(null),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Lista</p>
        {rows.length === 0 ? (
          <div className="mt-4 space-y-4 rounded-xl border border-dashed border-line bg-shell/40 p-5">
            <p className="text-sm text-muted">Nenhum serviço cadastrado ainda. Crie o primeiro para reutilizar em cadastros particulares.</p>
            <Link
              href={base}
              scroll={false}
              className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover sm:w-auto"
            >
              Criar serviço
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((s) => {
              const href = `${base}&servico=${encodeURIComponent(s.id)}`;
              const isSelected = selected?.id === s.id;
              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    scroll={false}
                    className={`block rounded-xl border px-3 py-2.5 text-sm transition ${
                      isSelected
                        ? "border-accent-border bg-accent-soft ring-2 ring-accent/25"
                        : "border-line bg-elevated hover:border-accent-border/60 hover:bg-elevated-2"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{s.name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          s.active
                            ? "border-success-border bg-success-bg text-success-fg"
                            : "border-line-soft bg-shell text-muted"
                        }`}
                      >
                        {s.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    {s.description?.trim() ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{s.description}</p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Cadastro e edição</p>
        <p className="mt-2 text-sm text-muted">
          Cadastre nomes de serviço (ex.: manutenção, limpeza terceirizada) para escolher na subpágina{" "}
          <Link href="/servicos/particular" scroll={false} className="font-medium text-accent hover:underline">
            Particular
          </Link>
          .
        </p>
        <form
          action={async (fd) => {
            "use server";
            const r = await saveServiceCatalog(fd);
            if (!r.ok) return;
            redirect(`${base}&servico=${encodeURIComponent(r.id)}&ok=1`);
          }}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="id" value={selected?.id ?? ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Nome do serviço *</span>
              <input
                name="name"
                required
                defaultValue={selected?.name ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={160}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Descrição</span>
              <textarea
                name="description"
                defaultValue={selected?.description ?? ""}
                className="mt-1 min-h-[80px] w-full resize-y rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={1000}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={selected?.active ?? true}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <span className="text-sm text-ink">Serviço ativo (aparece na lista do particular)</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
            >
              Salvar serviço
            </button>
          </div>
        </form>

        {selected ? (
          <form
            action={async () => {
              "use server";
              await deleteServiceCatalog(selected.id);
              redirect(base);
            }}
            className="mt-3 flex justify-end border-t border-line-soft pt-4"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-semibold text-danger-text shadow-sm hover:opacity-90"
            >
              Excluir serviço
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
