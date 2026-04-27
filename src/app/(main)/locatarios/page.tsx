import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleGate } from "@/components/module-gate";
import { prisma } from "@/lib/prisma";
import { TenantType } from "@/generated/prisma/client";
import { deleteTenant, saveTenant } from "./actions";

export const dynamic = "force-dynamic";

function empty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export default async function LocatariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const selectedId = empty(typeof sp.locatario === "string" ? sp.locatario : "");
  const ok = empty(typeof sp.ok === "string" ? sp.ok : "") === "1";

  const [tenants, selected] = await Promise.all([
    prisma.tenant.findMany({ orderBy: [{ updatedAt: "desc" }] }),
    selectedId ? prisma.tenant.findUnique({ where: { id: selectedId } }) : Promise.resolve(null),
  ]);

  return (
    <ModuleGate id="leases">
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
        <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink sm:text-xl">Locatários</h1>
            <p className="mt-1 text-sm text-muted">Cadastro de pessoas/empresas para vínculo em contratos de locação.</p>
          </div>
          <Link
            href="/locatarios"
            className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-elevated-2"
          >
            Novo locatário
          </Link>
        </header>

        {ok ? (
          <div role="status" className="rounded-2xl border border-success-border bg-success-bg px-5 py-4 text-sm text-success-fg">
            Locatário salvo com sucesso.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Lista</p>
            {tenants.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Ainda não há locatários cadastrados.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {tenants.map((t) => {
                  const href = `/locatarios?locatario=${encodeURIComponent(t.id)}`;
                  const isSelected = selected?.id === t.id;
                  return (
                    <li key={t.id}>
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
                          <span className="font-medium text-ink">{t.name}</span>
                          <span className="rounded-full border border-line-soft bg-shell px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {t.type}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {t.document?.trim() ? <span className="text-subtle">{t.document}</span> : <span className="text-subtle">Sem documento</span>}
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
                const r = await saveTenant(fd);
                if (!r.ok) return;
                redirect(`/locatarios?locatario=${encodeURIComponent(r.id)}&ok=1`);
              }}
              className="mt-3 space-y-4"
            >
              <input type="hidden" name="id" value={selected?.id ?? ""} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-muted">Nome *</span>
                  <input
                    name="name"
                    required
                    defaultValue={selected?.name ?? ""}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    maxLength={160}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted">Tipo</span>
                  <select
                    name="type"
                    defaultValue={selected?.type ?? TenantType.PERSON}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {Object.values(TenantType).map((tt) => (
                      <option key={tt} value={tt}>
                        {tt}
                      </option>
                    ))}
                  </select>
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
                <label className="block">
                  <span className="block text-xs font-medium text-muted">E-mail</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selected?.email ?? ""}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    maxLength={140}
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
                <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover">
                  Salvar locatário
                </button>
              </div>
            </form>

            {selected ? (
              <form
                action={async () => {
                  "use server";
                  await deleteTenant(selected.id);
                  redirect("/locatarios?ok=1");
                }}
                className="mt-3 flex justify-end border-t border-line-soft pt-4"
              >
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-semibold text-danger-text shadow-sm hover:opacity-90"
                >
                  Excluir locatário
                </button>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </ModuleGate>
  );
}

