import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveCustomer, deleteCustomer } from "./actions";
import {
  CustomerBillingProfile,
  CustomerDocumentType,
  CustomerKind,
  CustomerOperationLinkKind,
  ParkingFacilityStatus,
} from "@/generated/prisma/client";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { PreferredPaymentSelector } from "./preferred-payment-selector";
import { CustomerOperationLinkFields } from "./operation-link-fields";
import type { OperationLinkKind } from "./operation-link-kind-ui";

export const dynamic = "force-dynamic";

function empty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function labelBilling(v: CustomerBillingProfile): string {
  switch (v) {
    case CustomerBillingProfile.MONTHLY:
      return "Mensalista";
    case CustomerBillingProfile.DAILY:
      return "Diária";
    case CustomerBillingProfile.AVULSO:
      return "Avulso";
    case CustomerBillingProfile.TENANT:
      return "Locatário";
    default:
      return "Outro";
  }
}

function labelKind(v: CustomerKind): string {
  return v === CustomerKind.COMPANY ? "Empresa" : "Pessoa";
}

function labelDocType(v: CustomerDocumentType): string {
  if (v === CustomerDocumentType.CPF) return "CPF";
  if (v === CustomerDocumentType.CNPJ) return "CNPJ";
  return "Outro";
}

function labelOperationLinkKind(v: CustomerOperationLinkKind): string {
  switch (v) {
    case CustomerOperationLinkKind.BRANCH:
      return "Filial";
    case CustomerOperationLinkKind.PROPERTY:
      return "Imóvel";
    case CustomerOperationLinkKind.PARKING_FACILITY:
      return "Estacionamento";
    default:
      return "";
  }
}

function operationEntityLabel(c: {
  operationLinkKind: CustomerOperationLinkKind;
  branch: { name: string } | null;
  property: { name: string } | null;
  parkingFacility: { name: string } | null;
}): string | null {
  switch (c.operationLinkKind) {
    case CustomerOperationLinkKind.BRANCH:
      return c.branch?.name ?? null;
    case CustomerOperationLinkKind.PROPERTY:
      return c.property?.name ?? null;
    case CustomerOperationLinkKind.PARKING_FACILITY:
      return c.parkingFacility?.name ?? null;
    default:
      return null;
  }
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const selectedId = empty(typeof sp.cliente === "string" ? sp.cliente : "");
  const ok = empty(typeof sp.ok === "string" ? sp.ok : "") === "1";
  const statusFilterRaw = empty(typeof sp.status === "string" ? sp.status : "");
  const statusFilter = statusFilterRaw === "ATIVOS" || statusFilterRaw === "INATIVOS" ? statusFilterRaw : "TODOS";

  const selected =
    selectedId ?
      await prisma.customer.findUnique({
        where: { id: selectedId },
        include: {
          branch: { select: { id: true, name: true } },
          property: { select: { id: true, name: true, code: true } },
          parkingFacility: { select: { id: true, name: true, code: true } },
        },
      })
    : null;

  const branchWhere =
    selected?.branchId && selected.operationLinkKind === CustomerOperationLinkKind.BRANCH
      ? { OR: [{ active: true }, { id: selected.branchId }] }
      : { active: true };

  const propertyWhere =
    selected?.propertyId && selected.operationLinkKind === CustomerOperationLinkKind.PROPERTY
      ? { OR: [{ active: true }, { id: selected.propertyId }] }
      : { active: true };

  const parkingWhere =
    selected?.parkingFacilityId && selected.operationLinkKind === CustomerOperationLinkKind.PARKING_FACILITY
      ? {
          OR: [
            { status: { in: [ParkingFacilityStatus.ACTIVE, ParkingFacilityStatus.MAINTENANCE] } },
            { id: selected.parkingFacilityId },
          ],
        }
      : { status: { in: [ParkingFacilityStatus.ACTIVE, ParkingFacilityStatus.MAINTENANCE] } };

  const [branches, properties, parkingFacilities, customers] = await Promise.all([
    prisma.branch.findMany({ where: branchWhere, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.property.findMany({
      where: propertyWhere,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: { id: true, name: true, code: true },
    }),
    prisma.parkingFacility.findMany({
      where: parkingWhere,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true },
    }),
    prisma.customer.findMany({
      where:
        statusFilter === "ATIVOS"
          ? { active: true }
          : statusFilter === "INATIVOS"
            ? { active: false }
            : undefined,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      include: {
        branch: { select: { name: true } },
        property: { select: { name: true } },
        parkingFacility: { select: { name: true } },
      },
    }),
  ]);

  const branchOptions = branches.map((b) => ({ id: b.id, label: b.name }));
  const propertyOptions = properties.map((p) => ({
    id: p.id,
    label: p.code ? `${p.name} (${p.code})` : p.name,
  }));
  const parkingOptions = parkingFacilities.map((p) => ({
    id: p.id,
    label: p.code ? `${p.name} (${p.code})` : p.name,
  }));
  const defaultOpKind = selected?.operationLinkKind ?? CustomerOperationLinkKind.NONE;
  const defaultOpEntityId = selected
    ? selected.operationLinkKind === CustomerOperationLinkKind.BRANCH
      ? (selected.branchId ?? "")
      : selected.operationLinkKind === CustomerOperationLinkKind.PROPERTY
        ? (selected.propertyId ?? "")
        : selected.operationLinkKind === CustomerOperationLinkKind.PARKING_FACILITY
          ? (selected.parkingFacilityId ?? "")
          : ""
    : "";

  let selectedPreferred: string[] = [];
  if (selected?.preferredPaymentMethodsJson) {
    try {
      const parsed = JSON.parse(selected.preferredPaymentMethodsJson);
      if (Array.isArray(parsed)) {
        selectedPreferred = parsed.filter((x) => typeof x === "string");
      }
    } catch {
      selectedPreferred = [];
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink sm:text-xl">Clientes</h1>
          <p className="mt-1 text-sm text-muted">
            Cadastro para cobranças e acesso. Vincule a uma filial, imóvel ou estacionamento (menu Operações), ou
            deixe sem vínculo para uso geral.
          </p>
        </div>
        <Link
          href="/clientes"
          className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-elevated-2"
        >
          Novo cliente
        </Link>
      </header>

      {ok ? (
        <div role="status" className="rounded-2xl border border-success-border bg-success-bg px-5 py-4 text-sm text-success-fg">
          Cliente salvo com sucesso.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Lista</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Status:</span>
            {[
              { key: "TODOS", label: "Todos" },
              { key: "ATIVOS", label: "Ativos" },
              { key: "INATIVOS", label: "Inativos" },
            ].map((o) => {
              const active = statusFilter === o.key;
              const href =
                o.key === "TODOS"
                  ? "/clientes"
                  : `/clientes?status=${encodeURIComponent(o.key)}`;
              return (
                <Link
                  key={o.key}
                  href={href}
                  className={`rounded-full border px-3 py-1 font-semibold transition ${
                    active
                      ? "border-accent-border bg-accent text-on-accent"
                      : "border-line bg-shell text-muted hover:bg-elevated-2 hover:text-ink"
                  }`}
                >
                  {o.label}
                </Link>
              );
            })}
          </div>
          {customers.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Ainda não há clientes cadastrados.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {customers.map((c) => {
                const href = `/clientes?cliente=${encodeURIComponent(c.id)}`;
                const isSelected = selected?.id === c.id;
                return (
                  <li key={c.id}>
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
                        <span className="font-medium text-ink">{c.name}</span>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              c.active
                                ? "border-line-soft bg-shell text-muted"
                                : "border-warn-border bg-warn-bg text-warn-text"
                            }`}
                          >
                            {c.active ? "Ativo" : "Inativo"}
                          </span>
                          <span className="rounded-full border border-line-soft bg-shell px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {labelBilling(c.billingProfile)}
                          </span>
                          {c.operationLinkKind !== CustomerOperationLinkKind.NONE ? (
                            <span className="rounded-full border border-line-soft bg-shell px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                              {labelOperationLinkKind(c.operationLinkKind)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {c.operationLinkKind !== CustomerOperationLinkKind.NONE ? (
                          <>
                            <span className="text-subtle">{operationEntityLabel(c) ?? "—"}</span>
                            {" · "}
                          </>
                        ) : null}
                        <span className="text-subtle">{labelKind(c.kind)}</span>
                        {c.document ? (
                          <>
                            {" · "}
                            <span className="text-subtle">{c.document}</span>
                          </>
                        ) : null}
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
              const r = await saveCustomer(fd);
              if (!r.ok) return;
              redirect(`/clientes?cliente=${encodeURIComponent(r.id)}&ok=1`);
            }}
            className="mt-3 space-y-4"
          >
            <input type="hidden" name="id" value={selected?.id ?? ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">Nome / Razão social *</span>
                <input
                  name="name"
                  required
                  defaultValue={selected?.name ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={140}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Tipo</span>
                <select
                  name="kind"
                  defaultValue={selected?.kind ?? CustomerKind.PERSON}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Object.values(CustomerKind).map((k) => (
                    <option key={k} value={k}>
                      {labelKind(k)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Perfil de cobrança</span>
                <select
                  name="billingProfile"
                  defaultValue={selected?.billingProfile ?? CustomerBillingProfile.AVULSO}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Object.values(CustomerBillingProfile).map((b) => (
                    <option key={b} value={b}>
                      {labelBilling(b)}
                    </option>
                  ))}
                </select>
              </label>
              <CustomerOperationLinkFields
                key={selected?.id ?? "new"}
                branches={branchOptions}
                properties={propertyOptions}
                parkingFacilities={parkingOptions}
                defaultKind={defaultOpKind as OperationLinkKind}
                defaultEntityId={defaultOpEntityId}
              />
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">Nome fantasia / Apelido (opcional)</span>
                <input
                  name="tradeName"
                  defaultValue={selected?.tradeName ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={140}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Tipo de documento</span>
                <select
                  name="documentType"
                  defaultValue={selected?.documentType ?? CustomerDocumentType.OTHER}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Object.values(CustomerDocumentType).map((d) => (
                    <option key={d} value={d}>
                      {labelDocType(d)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">CPF/CNPJ/Documento (opcional)</span>
                <input
                  name="document"
                  defaultValue={selected?.document ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={32}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Telefone (opcional)</span>
                <input
                  name="phone"
                  defaultValue={selected?.phone ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={40}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">E-mail (opcional)</span>
                <input
                  name="email"
                  defaultValue={selected?.email ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={140}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-muted">Dia de vencimento preferido (1–31)</span>
                <input
                  name="preferredDueDay"
                  defaultValue={selected?.preferredDueDay ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                  inputMode="numeric"
                  placeholder="Ex.: 5"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Valor sugerido (R$)</span>
                <input
                  name="suggestedAmount"
                  defaultValue={selected?.suggestedAmountCents != null ? (selected.suggestedAmountCents / 100).toFixed(2).replace(".", ",") : ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                  inputMode="decimal"
                  placeholder="Ex.: 120,00"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">Formas preferidas (seleção)</span>
                <div className="mt-2">
                  <PreferredPaymentSelector
                    name="preferredPaymentMethod"
                    options={TUITION_PAYMENT_OPTIONS}
                    defaultSelected={selectedPreferred}
                  />
                </div>
              </label>
              <div className="sm:col-span-2">
                <p className="mt-1 text-[11px] text-muted">
                  Essas preferências serão usadas como sugestão em cobranças (PIX, boleto, cartão etc.).
                </p>
              </div>

              <div className="sm:col-span-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Endereço de cobrança</p>
              </div>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">Rua</span>
                <input
                  name="street"
                  defaultValue={selected?.street ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={140}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Número</span>
                <input
                  name="number"
                  defaultValue={selected?.number ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={32}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Complemento</span>
                <input
                  name="complement"
                  defaultValue={selected?.complement ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={80}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-muted">Bairro</span>
                <input
                  name="neighborhood"
                  defaultValue={selected?.neighborhood ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={80}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">Cidade</span>
                <input
                  name="city"
                  defaultValue={selected?.city ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={80}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">UF</span>
                <input
                  name="state"
                  defaultValue={selected?.state ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={2}
                  placeholder="SP"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-muted">CEP</span>
                <input
                  name="zip"
                  defaultValue={selected?.zip ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  maxLength={12}
                  placeholder="00000-000"
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
              <label className="flex items-end gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={selected ? selected.active : true}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm text-ink">Ativo</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
              >
                Salvar cliente
              </button>
            </div>
          </form>

          {selected ? (
            <form
              action={async () => {
                "use server";
                await deleteCustomer(selected.id);
                redirect("/clientes");
              }}
              className="mt-4"
            >
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-shell px-4 py-2 text-sm font-semibold text-ink hover:bg-elevated-2"
              >
                Excluir cliente
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}

