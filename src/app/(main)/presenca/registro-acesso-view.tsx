"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format-brl";
import { calculateChargeCents } from "@/lib/access/pricing";
import { closeAccessSession, openAccessSession, recordAccessPayments } from "./actions";

type Option = { id: string; name: string };

type PricingPlan = {
  id: string;
  name: string;
  kind: "PARKING" | "PROPERTY";
  branchId: string | null;
  propertyId: string | null;
  parkingFacilityId: string | null;
  fractionMinutes: number | null;
  pricePerFractionCents: number | null;
  graceMinutes: number | null;
  dailyMaxCents: number | null;
  fixedPriceCents: number | null;
};

type SessionRow = {
  id: string;
  kind: "PARKING" | "PROPERTY";
  status: "OPEN" | "CLOSED" | "CANCELLED";
  branchId: string | null;
  propertyId: string | null;
  parkingFacilityId: string | null;
  plate: string | null;
  customerName: string | null;
  entryAt: Date;
  exitAt: Date | null;
  finalAmountCents: number;
  paidCents: number;
  note: string | null;
  pricingPlanId: string | null;
};

function shortDateTime(d: Date): string {
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function RegistroAcessoView(props: {
  canRecord: boolean;
  branches: Option[];
  properties: Option[];
  parkingFacilities: Option[];
  pricingPlans: PricingPlan[];
  sessions: SessionRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [kind, setKind] = useState<"PARKING" | "PROPERTY">("PARKING");
  const [branchId, setBranchId] = useState<string>("");
  const [parkingFacilityId, setParkingFacilityId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [plate, setPlate] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [pricingPlanId, setPricingPlanId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const filteredPlans = useMemo(() => {
    return props.pricingPlans.filter((p) => {
      if (p.kind !== kind) return false;
      if (kind === "PARKING" && parkingFacilityId && p.parkingFacilityId && p.parkingFacilityId !== parkingFacilityId) return false;
      if (kind === "PROPERTY" && propertyId && p.propertyId && p.propertyId !== propertyId) return false;
      if (branchId && p.branchId && p.branchId !== branchId) return false;
      return true;
    });
  }, [props.pricingPlans, kind, branchId, parkingFacilityId, propertyId]);

  const openSessions = props.sessions.filter((s) => s.status === "OPEN");
  const closedSessions = props.sessions.filter((s) => s.status === "CLOSED");

  const [closingId, setClosingId] = useState<string | null>(null);
  const closing = useMemo(() => openSessions.find((s) => s.id === closingId) ?? null, [closingId, openSessions]);
  const [closeAmountText, setCloseAmountText] = useState<string>("");
  const [payMethod1, setPayMethod1] = useState<string>("PIX");
  const [payAmount1, setPayAmount1] = useState<string>("");
  const [payMethod2, setPayMethod2] = useState<string>("");
  const [payAmount2, setPayAmount2] = useState<string>("");

  const closingPlan = useMemo(() => {
    if (!closing?.pricingPlanId) return null;
    return props.pricingPlans.find((p) => p.id === closing.pricingPlanId) ?? null;
  }, [closing?.pricingPlanId, props.pricingPlans]);

  const suggestedCloseCents = useMemo(() => {
    if (!closing) return 0;
    return calculateChargeCents({ entryAt: closing.entryAt, exitAt: new Date(), plan: closingPlan });
  }, [closing, closingPlan]);

  async function onOpenSession() {
    start(async () => {
      const r = await openAccessSession({
        kind,
        branchId: branchId || null,
        parkingFacilityId: kind === "PARKING" ? parkingFacilityId || null : null,
        propertyId: kind === "PROPERTY" ? propertyId || null : null,
        plate: plate || null,
        customerName: customerName || null,
        pricingPlanId: pricingPlanId || null,
        note: note || null,
      });
      if (!r.ok) {
        alert(r.error);
        return;
      }
      setPlate("");
      setCustomerName("");
      setNote("");
      router.refresh();
    });
  }

  async function onCloseSession() {
    if (!closing) return;
    start(async () => {
      const r = await closeAccessSession({
        sessionId: closing.id,
        finalAmountText: closeAmountText.trim() || null,
        defaultSuggestedCents: suggestedCloseCents,
      });
      if (!r.ok) {
        alert(r.error);
        return;
      }
      // pagamentos fracionados (opcional)
      const payments = [
        { amountText: payAmount1, method: payMethod1 },
        { amountText: payAmount2, method: payMethod2 },
      ].filter((p) => (p.amountText ?? "").trim() !== "");

      if (payments.length > 0) {
        const pr = await recordAccessPayments({
          sessionId: closing.id,
          payments,
          settledNow: true,
        });
        if (!pr.ok) {
          alert(pr.error);
        }
      }

      setClosingId(null);
      setCloseAmountText("");
      setPayAmount1("");
      setPayAmount2("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink sm:text-xl">Registro de entrada/saída</h1>
          <p className="mt-1 text-sm text-muted">
            Controle de sessões de imóveis e estacionamentos, com cobrança e pagamentos fracionados.
          </p>
        </div>
      </header>

      {!props.canRecord ? (
        <div className="rounded-2xl border border-line-soft bg-elevated-2 p-4 text-sm text-muted">
          Seu perfil pode visualizar, mas não registrar entradas/saídas.
        </div>
      ) : (
        <section className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Nova entrada</p>
          <div className="mt-3 grid gap-3 md:grid-cols-12">
            <label className="md:col-span-3">
              <span className="block text-xs font-medium text-muted">Tipo</span>
              <select
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={kind}
                onChange={(e) => setKind(e.target.value as "PARKING" | "PROPERTY")}
                disabled={pending}
              >
                <option value="PARKING">Estacionamento</option>
                <option value="PROPERTY">Imóvel</option>
              </select>
            </label>
            <label className="md:col-span-3">
              <span className="block text-xs font-medium text-muted">Filial (opcional)</span>
              <select
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={pending}
              >
                <option value="">—</option>
                {props.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            {kind === "PARKING" ? (
              <label className="md:col-span-6">
                <span className="block text-xs font-medium text-muted">Estacionamento</span>
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                  value={parkingFacilityId}
                  onChange={(e) => setParkingFacilityId(e.target.value)}
                  disabled={pending}
                >
                  <option value="">—</option>
                  {props.parkingFacilities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="md:col-span-6">
                <span className="block text-xs font-medium text-muted">Imóvel</span>
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={pending}
                >
                  <option value="">—</option>
                  {props.properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="md:col-span-3">
              <span className="block text-xs font-medium text-muted">Placa (opcional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC1D23"
                maxLength={16}
                disabled={pending}
              />
            </label>
            <label className="md:col-span-5">
              <span className="block text-xs font-medium text-muted">Cliente (opcional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome"
                maxLength={140}
                disabled={pending}
              />
            </label>
            <label className="md:col-span-4">
              <span className="block text-xs font-medium text-muted">Tarifa (opcional)</span>
              <select
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={pricingPlanId}
                onChange={(e) => setPricingPlanId(e.target.value)}
                disabled={pending}
              >
                <option value="">—</option>
                {filteredPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-12">
              <span className="block text-xs font-medium text-muted">Observação (opcional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                disabled={pending}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
            <p className="text-xs text-muted">
              A entrada grava a sessão como <span className="font-semibold text-ink">ABERTA</span>.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={onOpenSession}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50"
            >
              Registrar entrada
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Sessões em aberto</p>
        {openSessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nenhuma sessão aberta.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {openSessions.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-elevated px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {s.kind === "PARKING" ? "Estacionamento" : "Imóvel"}
                      {s.plate ? ` — ${s.plate}` : ""}
                      {s.customerName ? ` — ${s.customerName}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Entrada: {shortDateTime(s.entryAt)}</p>
                  </div>
                  {props.canRecord ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setClosingId(s.id);
                        setCloseAmountText("");
                        setPayAmount1("");
                        setPayAmount2("");
                      }}
                      className="rounded-lg border border-line bg-shell px-3 py-2 text-xs font-semibold text-ink hover:bg-elevated-2 disabled:opacity-50"
                    >
                      Registrar saída / cobrar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Sessões encerradas (recentes)</p>
        {closedSessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nenhuma sessão encerrada ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {closedSessions.slice(0, 50).map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-elevated px-3 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {s.kind === "PARKING" ? "Estacionamento" : "Imóvel"}
                      {s.plate ? ` — ${s.plate}` : ""}
                      {s.customerName ? ` — ${s.customerName}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Entrada: {shortDateTime(s.entryAt)} · Saída: {s.exitAt ? shortDateTime(s.exitAt) : "—"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <div>
                      Cobrado: <span className="font-semibold text-ink">{formatBRL(s.finalAmountCents)}</span>
                    </div>
                    <div>
                      Pago: <span className="font-semibold text-ink">{formatBRL(s.paidCents)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Registrar saída e cobrança</p>
                <p className="mt-1 text-xs text-muted">
                  Entrada: {shortDateTime(closing.entryAt)} · Sugestão agora:{" "}
                  <span className="font-semibold text-ink">{formatBRL(suggestedCloseCents)}</span>
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => setClosingId(null)}
                className="rounded-lg border border-line bg-shell px-2 py-1 text-xs font-semibold text-ink"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label>
                <span className="block text-xs font-medium text-muted">Valor final (opcional)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                  value={closeAmountText}
                  onChange={(e) => setCloseAmountText(e.target.value)}
                  placeholder={`Ex.: ${(suggestedCloseCents / 100).toFixed(2).replace(".", ",")}`}
                  disabled={pending}
                />
                <p className="mt-1 text-[11px] text-muted">
                  Se vazio, usa a sugestão calculada pela tarifa (se houver) ou 0.
                </p>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="block text-xs font-medium text-muted">Pagamento 1 — método</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                    value={payMethod1}
                    onChange={(e) => setPayMethod1(e.target.value)}
                    placeholder="PIX / Dinheiro / Cartão"
                    disabled={pending}
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-muted">Pagamento 1 — valor</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                    value={payAmount1}
                    onChange={(e) => setPayAmount1(e.target.value)}
                    placeholder="Ex.: 10,00"
                    disabled={pending}
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-muted">Pagamento 2 — método (opcional)</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                    value={payMethod2}
                    onChange={(e) => setPayMethod2(e.target.value)}
                    placeholder="Ex.: Dinheiro"
                    disabled={pending}
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-muted">Pagamento 2 — valor (opcional)</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink"
                    value={payAmount2}
                    onChange={(e) => setPayAmount2(e.target.value)}
                    placeholder="Ex.: 5,00"
                    disabled={pending}
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-line-soft pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={onCloseSession}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50"
              >
                Registrar saída
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

