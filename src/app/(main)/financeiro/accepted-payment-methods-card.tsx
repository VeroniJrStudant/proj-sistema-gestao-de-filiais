"use client";

import { useMemo, useState, useTransition } from "react";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { saveAcceptedPaymentMethodsSettings, type AcceptedMethodDraft } from "./actions";
import type { AcceptedMethodRow } from "./types";

const inputClass =
  "mt-0.5 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

const labelByCode = new Map<string, string>(
  TUITION_PAYMENT_OPTIONS.map((o) => [o.value, o.label]),
);

type DraftRow = {
  code: string;
  active: boolean;
  sortOrder: number;
  notes: string;
};

function rowsFromServer(initial: AcceptedMethodRow[]): DraftRow[] {
  const byCode = new Map(initial.map((r) => [r.code, r]));
  return TUITION_PAYMENT_OPTIONS.map((opt) => {
    const row = byCode.get(opt.value);
    return {
      code: opt.value,
      active: row?.active ?? true,
      sortOrder: row?.sortOrder ?? 0,
      notes: row?.notes ?? "",
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}

export function AcceptedPaymentMethodsCard({
  initial,
  /** Quando true, omite o cabeçalho longo (uso dentro de “Cadastrar ou editar”). */
  embedded = false,
}: {
  initial: AcceptedMethodRow[];
  embedded?: boolean;
}) {
  const [rows, setRows] = useState<DraftRow[]>(() => rowsFromServer(initial));
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const sortedDisplay = useMemo(() => {
    return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  }, [rows]);

  function updateRow(code: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.code === code ? { ...r, ...patch } : r)));
    setMessage(null);
  }

  function onSave() {
    setMessage(null);
    const payload: AcceptedMethodDraft[] = rows.map((r) => ({
      code: r.code,
      active: r.active,
      sortOrder: r.sortOrder,
      notes: r.notes,
    }));
    startTransition(async () => {
      const res = await saveAcceptedPaymentMethodsSettings(payload);
      if (res.ok) {
        setMessage({ type: "ok", text: "Formas aderidas salvas." });
      } else {
        setMessage({ type: "err", text: res.error });
      }
    });
  }

  return (
    <section
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Formas de pagamento aderidas pela unidade"
    >
      {embedded ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Ajuste quais meios estão ativos, a ordem na secretaria e observações internas. Contratos por aluno
            continuam no cadastro do aluno.
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">
              Política de recebimento
            </p>
            <h2 className="mt-1 text-sm font-semibold text-ink">Formas de pagamento aderidas</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Defina quais meios a creche aceita para mensalidade e outras cobranças, a ordem de exibição na
              secretaria e observações internas. O contrato de cada aluno continua sendo editado no cadastro do
              aluno.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}

      {message ? (
        <p
          className={`mt-3 text-sm ${message.type === "ok" ? "text-success-fg" : "text-warn-text"}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-elevated text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Forma</th>
              <th className="px-3 py-2 font-medium">Ativa</th>
              <th className="w-24 px-3 py-2 font-medium">Ordem</th>
              <th className="min-w-[200px] px-3 py-2 font-medium">Observações (interno)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-elevated-2">
            {sortedDisplay.map((r) => (
              <tr key={r.code}>
                <td className="px-3 py-2 font-medium text-ink">{labelByCode.get(r.code) ?? r.code}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={(e) => updateRow(r.code, { active: e.target.checked })}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                    aria-label={`Aceitar ${labelByCode.get(r.code) ?? r.code}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={r.sortOrder}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isNaN(n)) return;
                      updateRow(r.code, { sortOrder: Math.min(99, Math.max(0, Math.round(n))) });
                    }}
                    className={`${inputClass} w-20 tabular-nums`}
                    aria-label={`Ordem de ${labelByCode.get(r.code) ?? r.code}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <label className={labelClass}>
                    <span className="sr-only">Observações para {labelByCode.get(r.code)}</span>
                    <input
                      type="text"
                      value={r.notes}
                      onChange={(e) => updateRow(r.code, { notes: e.target.value })}
                      placeholder="Ex.: só na secretaria, conta Bradesco…"
                      className={inputClass}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
