import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteParticular, saveParticular } from "./particular-actions";

function empty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function isoToYmd(iso: Date | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const base = "/servicos/particular";

export async function ParticularTab({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const selectedId = empty(typeof searchParams.particular === "string" ? searchParams.particular : "");

  const [rows, selected, catalogs] = await Promise.all([
    prisma.particularService.findMany({ orderBy: [{ updatedAt: "desc" }] }),
    selectedId
      ? prisma.particularService.findUnique({
          where: { id: selectedId },
          include: { serviceCatalog: { select: { id: true, name: true, active: true } } },
        })
      : Promise.resolve(null),
    prisma.serviceCatalog.findMany({ orderBy: [{ name: "asc" }] }),
  ]);

  const catalogOptions = catalogs.filter(
    (c) => c.active || c.id === selected?.serviceCatalogId,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Lista</p>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Ainda não há cadastros particulares.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((p) => {
              const href = `${base}&particular=${encodeURIComponent(p.id)}`;
              const isSelected = selected?.id === p.id;
              return (
                <li key={p.id}>
                  <Link
                    href={href}
                    scroll={false}
                    className={`block rounded-xl border px-3 py-2.5 text-sm transition ${
                      isSelected
                        ? "border-accent-border bg-accent-soft ring-2 ring-accent/25"
                        : "border-line bg-elevated hover:border-accent-border/60 hover:bg-elevated-2"
                    }`}
                  >
                    <div className="font-medium text-ink">{p.title}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {p.partyName?.trim() ? (
                        <span className="text-subtle">{p.partyName}</span>
                      ) : (
                        <span className="text-subtle">Sem contraparte</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Cadastro e edição</p>
        <form
          action={async (fd) => {
            "use server";
            const r = await saveParticular(fd);
            if (!r.ok) return;
            redirect(`${base}&particular=${encodeURIComponent(r.id)}&ok=1`);
          }}
          className="mt-3 space-y-4"
        >
          <input type="hidden" name="id" value={selected?.id ?? ""} />
          {catalogs.length === 0 ? (
            <div className="rounded-lg border border-caution-border bg-caution-soft px-3 py-2.5 text-sm text-caution">
              Nenhum serviço no catálogo. Na aba{" "}
              <Link href="/servicos/catalogo" scroll={false} className="font-semibold underline">
                Catálogo
              </Link>
              , use <span className="font-semibold">Criar serviço</span> para cadastrar o primeiro.
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Serviço do catálogo</span>
              <select
                name="serviceCatalogId"
                defaultValue={selected?.serviceCatalogId ?? ""}
                className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Nenhum — usar só o título abaixo</option>
                {catalogOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active ? " (inativo)" : ""}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-muted">
                Se escolher um item do catálogo, o título pode ficar em branco e será preenchido com o nome do serviço.
              </span>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Título ou descrição *</span>
              <input
                name="title"
                defaultValue={selected?.title ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={200}
                placeholder="Obrigatório se não houver serviço do catálogo"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Contraparte (nome)</span>
              <input
                name="partyName"
                defaultValue={selected?.partyName ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={160}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted">Documento</span>
              <input
                name="document"
                defaultValue={selected?.document ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={80}
                placeholder="CPF/CNPJ"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted">Telefone</span>
              <input
                name="phone"
                defaultValue={selected?.phone ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={40}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">E-mail</span>
              <input
                name="email"
                type="email"
                defaultValue={selected?.email ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={140}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted">Valor mensal (centavos)</span>
              <input
                name="monthlyAmountCents"
                inputMode="numeric"
                defaultValue={selected?.monthlyAmountCents != null ? String(selected.monthlyAmountCents) : ""}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Opcional"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted">Início</span>
              <input
                name="startsAt"
                type="date"
                defaultValue={isoToYmd(selected?.startsAt)}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted">Término</span>
              <input
                name="endsAt"
                type="date"
                defaultValue={isoToYmd(selected?.endsAt)}
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Observações</span>
              <textarea
                name="notes"
                defaultValue={selected?.notes ?? ""}
                className="mt-1 min-h-[90px] w-full resize-y rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={2000}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
            >
              Salvar particular
            </button>
          </div>
        </form>

        {selected ? (
          <form
            action={async () => {
              "use server";
              await deleteParticular(selected.id);
              redirect(base);
            }}
            className="mt-3 flex justify-end border-t border-line-soft pt-4"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-semibold text-danger-text shadow-sm hover:opacity-90"
            >
              Excluir cadastro
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
