"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { deleteSupplier, previewNextSupplierCode, saveSupplier } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-sm font-medium text-muted";

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`cadastro-fornecedor-passo-${step}`}
      className="scroll-mt-24 rounded-2xl border border-line bg-elevated-2 shadow-sm"
    >
      <div className="border-b border-line-soft px-5 py-4 sm:px-6">
        <div className="flex gap-3 sm:gap-4">
          <span
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-accent px-1 text-sm font-bold text-on-accent shadow-sm"
            aria-hidden
          >
            {step}
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export type SupplierFormInitial = {
  supplierCode: string | null;
  supplierCategoryId: string | null;
  name: string;
  tradeName: string;
  document: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  paymentMethod: string;
  paymentDate: string;
  active: boolean;
};

function emptyInitial(): SupplierFormInitial {
  return {
    supplierCode: null,
    supplierCategoryId: null,
    name: "",
    tradeName: "",
    document: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
    paymentMethod: "",
    paymentDate: "",
    active: true,
  };
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SupplierForm({
  lastSavedSupplierId,
  initial,
  supplierCategoryOptions,
}: {
  lastSavedSupplierId?: string;
  initial?: SupplierFormInitial;
  supplierCategoryOptions: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const base = initial ?? emptyInitial();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [supplierCategoryId, setSupplierCategoryId] = useState<string>(base.supplierCategoryId ?? "");
  const [name, setName] = useState(base.name);
  const [tradeName, setTradeName] = useState(base.tradeName);
  const [document, setDocument] = useState(base.document);
  const [phone, setPhone] = useState(base.phone);
  const [email, setEmail] = useState(base.email);
  const [street, setStreet] = useState(base.street);
  const [number, setNumber] = useState(base.number);
  const [complement, setComplement] = useState(base.complement);
  const [neighborhood, setNeighborhood] = useState(base.neighborhood);
  const [city, setCity] = useState(base.city);
  const [state, setState] = useState(base.state);
  const [zip, setZip] = useState(base.zip);
  const [notes, setNotes] = useState(base.notes);
  const [paymentMethod, setPaymentMethod] = useState(base.paymentMethod);
  const [paymentDate, setPaymentDate] = useState(base.paymentDate);
  const [active, setActive] = useState(base.active);

  const [supplierCodeAuto, setSupplierCodeAuto] = useState(true);
  const [supplierCodeManual, setSupplierCodeManual] = useState("");
  const [codePreview, setCodePreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    previewNextSupplierCode().then((v) => {
      if (!cancelled) setCodePreview(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function buildFormData(): FormData {
    const fd = new FormData();
    if (lastSavedSupplierId) fd.set("id", lastSavedSupplierId);
    fd.set("name", name);
    fd.set("supplierCategoryId", supplierCategoryId);
    fd.set("tradeName", tradeName);
    fd.set("document", document);
    fd.set("phone", phone);
    fd.set("email", email);
    fd.set("street", street);
    fd.set("number", number);
    fd.set("complement", complement);
    fd.set("neighborhood", neighborhood);
    fd.set("city", city);
    fd.set("state", state);
    fd.set("zip", zip);
    fd.set("notes", notes);
    fd.set("paymentMethod", paymentMethod);
    fd.set("paymentDate", paymentDate);
    fd.set("active", active ? "on" : "off");
    if (supplierCodeAuto) fd.set("supplierCodeAuto", "on");
    fd.set("supplierCodeManual", supplierCodeManual);
    return fd;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveSupplier(buildFormData());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      previewNextSupplierCode().then(setCodePreview);
      router.push(
        `/fornecedores?ok=1&ficha=1&fornecedor=${encodeURIComponent(result.id)}`,
      );
    });
  }

  function onDelete() {
    if (!lastSavedSupplierId) return;
    if (!window.confirm("Excluir este fornecedor? Esta ação não pode ser desfeita.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSupplier(lastSavedSupplierId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/fornecedores");
      router.refresh();
    });
  }

  const codeBadgeText = supplierCodeAuto
    ? (base.supplierCode?.trim() || codePreview || "···")
    : supplierCodeManual.trim() || "—";

  return (
    <form id="cadastro-fornecedor" onSubmit={onSubmit} className="w-full">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-2 min-w-0 space-y-6 pb-6">
        <FormSection
          step={1}
          title="Identificação"
          description="Razão social, fantasia e contato. O código de registro aparece na ficha no topo."
        >
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Razão social ou nome *</span>
              <input
                className={inputClass}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Nome fantasia</span>
              <input className={inputClass} value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelClass}>Categoria</span>
              <select
                className={`${inputClass} cursor-pointer`}
                value={supplierCategoryId}
                onChange={(e) => setSupplierCategoryId(e.target.value)}
              >
                <option value="">— Nenhuma —</option>
                {supplierCategoryOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>CNPJ / documento</span>
                <input className={inputClass} value={document} onChange={(e) => setDocument(e.target.value)} />
              </label>
              <label className="block">
                <span className={labelClass}>Telefone</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>E-mail</span>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <p className="rounded-lg border border-line-soft bg-shell/50 px-3 py-2 text-xs text-muted">
              Pré-visualização do código:{" "}
              <span className="font-medium tabular-nums text-ink">{codeBadgeText}</span>
            </p>
          </div>
        </FormSection>

        <FormSection
          step={2}
          title="Pagamento"
          description="Forma de pagamento e data de referência para acertos com o financeiro."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className={labelClass}>Forma de pagamento</span>
              <input
                className={inputClass}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ex.: PIX, boleto, transferência…"
                list="supplier-payment-method-suggestions"
              />
              <datalist id="supplier-payment-method-suggestions">
                <option value="PIX" />
                <option value="Boleto bancário" />
                <option value="Transferência (TED / DOC)" />
                <option value="Cartão corporativo" />
                <option value="Dinheiro" />
                <option value="Depósito identificado" />
              </datalist>
            </label>
            <label className="block sm:col-span-1">
              <span className={labelClass}>Data de referência / vencimento</span>
              <input
                type="date"
                className={inputClass}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
              <span className="mt-1 block text-[11px] text-subtle">Opcional — próximo pagamento ou data acordada.</span>
            </label>
          </div>
        </FormSection>

        <FormSection step={3} title="Endereço" description="Logradouro e localização para notas e correspondência.">
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Logradouro</span>
              <input className={inputClass} value={street} onChange={(e) => setStreet(e.target.value)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Número</span>
                <input className={inputClass} value={number} onChange={(e) => setNumber(e.target.value)} />
              </label>
              <label className="block">
                <span className={labelClass}>Complemento</span>
                <input className={inputClass} value={complement} onChange={(e) => setComplement(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Bairro</span>
                <input
                  className={inputClass}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Cidade</span>
                <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label className="block">
                <span className={labelClass}>UF</span>
                <input
                  className={inputClass}
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                />
              </label>
              <label className="block">
                <span className={labelClass}>CEP</span>
                <input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} />
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection step={4} title="Observações" description="Notas internas e situação do cadastro.">
          <label className="block">
            <span className={labelClass}>Notas</span>
            <textarea
              className={`${inputClass} min-h-[5rem] resize-y`}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-line text-accent focus:ring-accent"
            />
            Ativo
          </label>
        </FormSection>

        <div className="space-y-4 border-t border-line-soft pt-6">
          <div className="rounded-lg border border-line-soft bg-shell/50 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                checked={supplierCodeAuto}
                onChange={(e) => setSupplierCodeAuto(e.target.checked)}
              />
              <span>
                <span className="font-medium">Gerar código de registro automaticamente</span>
                <span className="mt-0.5 block text-muted">
                  Sequência por ano (ex.: F20260001). Desmarque para informar um código próprio.
                </span>
              </span>
            </label>
            {!supplierCodeAuto ? (
              <label className="mt-3 block">
                <span className={labelClass}>Código de registro *</span>
                <input
                  className={inputClass}
                  value={supplierCodeManual}
                  onChange={(e) => setSupplierCodeManual(e.target.value)}
                  placeholder="Ex.: F2026-001"
                  maxLength={32}
                  required
                />
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? "Salvando…" : lastSavedSupplierId ? "Atualizar" : "Cadastrar"}
            </button>
            {lastSavedSupplierId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete()}
                className="rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-medium text-danger-text hover:opacity-90 disabled:opacity-60"
              >
                Excluir fornecedor
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}

export function supplierRowToFormInitial(row: {
  supplierCode: string | null;
  supplierCategoryId: string | null;
  name: string;
  tradeName: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  paymentMethod: string | null;
  paymentDate: string | null;
  active: boolean;
}): SupplierFormInitial {
  return {
    supplierCode: row.supplierCode?.trim() ?? null,
    supplierCategoryId: row.supplierCategoryId,
    name: row.name.trim(),
    tradeName: row.tradeName?.trim() ?? "",
    document: row.document?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    email: row.email?.trim() ?? "",
    street: row.street?.trim() ?? "",
    number: row.number?.trim() ?? "",
    complement: row.complement?.trim() ?? "",
    neighborhood: row.neighborhood?.trim() ?? "",
    city: row.city?.trim() ?? "",
    state: row.state?.trim() ?? "",
    zip: row.zip?.trim() ?? "",
    notes: row.notes?.trim() ?? "",
    paymentMethod: row.paymentMethod?.trim() ?? "",
    paymentDate: isoToDateInput(row.paymentDate),
    active: row.active,
  };
}
