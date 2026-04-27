import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleGate } from "@/components/module-gate";
import { prisma } from "@/lib/prisma";
import { LeaseStatus } from "@/generated/prisma/client";
import { deleteLease, saveLease } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function LocacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const selectedId = empty(typeof sp.locacao === "string" ? sp.locacao : "");
  const ok = empty(typeof sp.ok === "string" ? sp.ok : "") === "1";

  const [leases, properties, tenants, selected] = await Promise.all([
    prisma.leaseContract.findMany({
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.property.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    selectedId
      ? prisma.leaseContract.findUnique({ where: { id: selectedId } })
      : Promise.resolve(null),
  ]);

  return (
    <ModuleGate id="leases">
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
        <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink sm:text-xl">Locações</h1>
            <p className="mt-1 text-sm text-muted">
              Contratos de locação (imóvel + locatário) com período, valor mensal e vencimento.
            </p>
          </div>
          <Link
            href="/locacoes"
            className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-elevated-2"
          >
            Novo contrato
          </Link>
        </header>

        {ok ? (
          <div role="status" className="rounded-2xl border border-success-border bg-success-bg px-5 py-4 text-sm text-success-fg">
            Contrato salvo com sucesso.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Lista</p>
            {leases.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Ainda não há contratos cadastrados.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {leases.map((l) => {
                  const href = `/locacoes?locacao=${encodeURIComponent(l.id)}`;
                  const isSelected = selected?.id === l.id;
                  return (
                    <li key={l.id}>
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
                          <span className="font-medium text-ink">{l.property.name}</span>
                          <span className="rounded-full border border-line-soft bg-shell px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {l.status}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          <span className="text-subtle">{l.tenant.name}</span>
                          {" · "}
                          <span className="text-subtle">Venc. dia {l.dueDay}</span>
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
                const r = await saveLease(fd);
                if (!r.ok) return;
                redirect(`/locacoes?locacao=${encodeURIComponent(r.id)}&ok=1`);
              }}
              className="mt-3 space-y-4"
            >
              <input type="hidden" name="id" value={selected?.id ?? ""} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-muted">Imóvel *</span>
                  <select
                    name="propertyId"
                    required
                    defaultValue={selected?.propertyId ?? ""}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Selecione…</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-muted">Locatário *</span>
                  <select
                    name="tenantId"
                    required
                    defaultValue={selected?.tenantId ?? ""}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Selecione…</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted">Status</span>
                  <select
                    name="status"
                    defaultValue={selected?.status ?? LeaseStatus.DRAFT}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {Object.values(LeaseStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted">Dia de vencimento *</span>
                  <input
                    name="dueDay"
                    required
                    defaultValue={selected?.dueDay ?? 5}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                    inputMode="numeric"
                    placeholder="5"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted">Início *</span>
                  <input
                    name="startsAt"
                    type="date"
                    required
                    defaultValue={isoToYmd(selected?.startsAt)}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted">Fim (opcional)</span>
                  <input
                    name="endsAt"
                    type="date"
                    defaultValue={isoToYmd(selected?.endsAt ?? null)}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-muted">Valor mensal (centavos BRL) *</span>
                  <input
                    name="monthlyRentCents"
                    required
                    defaultValue={selected?.monthlyRentCents ?? ""}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                    inputMode="numeric"
                    placeholder="Ex.: 250000"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-muted">Caução/depósito (centavos BRL)</span>
                  <input
                    name="depositCents"
                    defaultValue={selected?.depositCents ?? ""}
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                    inputMode="numeric"
                    placeholder="Ex.: 500000"
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
                  Salvar contrato
                </button>
              </div>
            </form>

            {selected ? (
              <form
                action={async () => {
                  "use server";
                  await deleteLease(selected.id);
                  redirect("/locacoes?ok=1");
                }}
                className="mt-3 flex justify-end border-t border-line-soft pt-4"
              >
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-semibold text-danger-text shadow-sm hover:opacity-90"
                >
                  Excluir contrato
                </button>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </ModuleGate>
  );
}

