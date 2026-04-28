"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveBatchOutPayments } from "./actions";
import {
  ALL_TEACHERS_DEPOSIT_PAYEE_ID,
  type BatchPayeeType,
  type BatchPaymentRowInput,
} from "./batch-payment-types";
import {
  describeWhyEmployeeMatched,
  describeWhySupplierMatched,
  employeeMatchesSearchQuery,
  supplierMatchesSearchQuery,
  type FinanceEmployeeSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";

const inputClassBase =
  "mt-1 min-w-0 rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm [color:var(--ink)] [background-color:var(--elevated-2)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const inputClass = `${inputClassBase} w-full`;
const labelClass = "block text-xs font-medium text-muted";

const selectFavorecidoClass = `${inputClassBase} w-[8.4rem] shrink-0 cursor-pointer sm:w-[9.8rem] [-webkit-text-fill-color:var(--ink)]`;

const TIPO_OPTIONS: readonly { id: BatchPayeeType; label: string }[] = [
  { id: "SUPPLIER", label: "Fornecedor" },
  { id: "TEACHER", label: "Funcionário" },
  { id: "OTHER", label: "Outros" },
] as const;

const ALL_TEACHERS_SEARCH_LABEL =
  "Todos os funcionários — depósito em lote (um lançamento por pessoa)";

type BatchRowUi = BatchPaymentRowInput & { _favSearchDraft?: string };

function supplierLabel(s: FinanceSupplierSearchRow): string {
  return (s.tradeName?.trim() || s.name.trim()).slice(0, 200);
}

function emptyRow(): BatchRowUi {
  return {
    payeeType: "SUPPLIER",
    payeeId: null,
    otherName: null,
    amountBrl: "",
    dueDate: null,
    settledDate: null,
    notes: null,
    barcodeLine: null,
    referenceDocument: null,
    _favSearchDraft: "",
  };
}

function toPayloadRows(rows: BatchRowUi[]): BatchPaymentRowInput[] {
  return rows.map(({ _favSearchDraft: _d, ...r }) => r);
}

export function BatchPaymentsForm({
  suppliers,
  teachers,
}: {
  suppliers: FinanceSupplierSearchRow[];
  teachers: FinanceEmployeeSearchRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<BatchRowUi[]>(() => [emptyRow()]);

  function updateRow(i: number, patch: Partial<BatchRowUi>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const result = await saveBatchOutPayments(toPayloadRows(rows));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOkMsg(`${result.count} lançamento(s) registrado(s).`);
      setRows([emptyRow()]);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
        >
          {error}
        </div>
      ) : null}
      {okMsg ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
        >
          {okMsg}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Código de barras / linha digitável: digite, cole ou use o leitor (o campo costuma receber o código completo e
        finalizar com Enter). Documento: NF, boleto, comprovante de depósito em lote ou outro número de referência do
        fornecedor ou do banco.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-line bg-elevated-2 shadow-sm">
        <table className="min-w-[1120px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-soft bg-shell/60 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="w-10 min-w-10 px-2 py-2">#</th>
              <th className="min-w-[8.4rem] px-2 py-2 sm:min-w-[9.8rem]">Tipo</th>
              <th className="min-w-[14rem] px-2 py-2 sm:min-w-[16rem]">Favorecido</th>
              <th className="min-w-[11rem] px-2 py-2">Código de barras / linha digitável</th>
              <th className="min-w-[9rem] px-2 py-2">Documento / ref.</th>
              <th className="min-w-[9rem] px-2 py-2">Valor (R$)</th>
              <th className="min-w-[9rem] px-2 py-2">Vencimento</th>
              <th className="min-w-[9rem] px-2 py-2">Liquidado em</th>
              <th className="min-w-[8rem] px-2 py-2">Obs.</th>
              <th className="w-12 min-w-12 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line-soft align-middle">
                <td className="px-2 py-2 text-center text-muted tabular-nums">{i + 1}</td>
                <td className="min-w-0 px-2 py-2">
                  <label className={labelClass}>
                    Tipo
                    <select
                      className={selectFavorecidoClass}
                      value={row.payeeType}
                      onChange={(e) => {
                        const payeeType = e.target.value as BatchPayeeType;
                        if (row.payeeType === payeeType) return;
                        updateRow(i, {
                          payeeType,
                          payeeId: null,
                          otherName: payeeType === "OTHER" ? row.otherName : null,
                          _favSearchDraft: "",
                        });
                      }}
                    >
                      {TIPO_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </td>
                <td className="min-w-0 px-2 py-2">
                  {row.payeeType === "OTHER" ? (
                    <label className={labelClass}>
                      Nome
                      <input
                        className={inputClass}
                        value={row.otherName ?? ""}
                        onChange={(e) => updateRow(i, { otherName: e.target.value })}
                        placeholder="Ex.: serviço de manutenção, imposto…"
                      />
                    </label>
                  ) : row.payeeType === "SUPPLIER" ? (
                    <div className="space-y-1">
                      <label className={labelClass}>
                        Favorecido (nome ou código)
                        <input
                          className={inputClass}
                          value={row._favSearchDraft ?? ""}
                          onChange={(e) =>
                            updateRow(i, {
                              _favSearchDraft: e.target.value,
                              payeeId: null,
                            })
                          }
                          placeholder="Nome, fantasia ou código interno…"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </label>
                      {(() => {
                        const q = (row._favSearchDraft ?? "").trim();
                        if (!q || row.payeeId) return null;
                        const hits = suppliers
                          .filter((s) => supplierMatchesSearchQuery(s, q))
                          .slice(0, 15);
                        if (hits.length === 0) {
                          return (
                            <p className="text-xs text-muted">Nenhum fornecedor encontrado. Refine a busca.</p>
                          );
                        }
                        return (
                          <ul className="max-h-44 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft bg-elevated-2 text-xs">
                            {hits.map((s) => {
                              const why = describeWhySupplierMatched(s, q);
                              return (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    className="w-full px-2 py-2 text-left transition-colors hover:bg-accent-soft"
                                    onClick={() =>
                                      updateRow(i, {
                                        payeeId: s.id,
                                        _favSearchDraft: supplierLabel(s),
                                      })
                                    }
                                  >
                                    <span className="font-medium text-ink">{supplierLabel(s)}</span>
                                    {s.supplierCode?.trim() ? (
                                      <span className="text-muted"> — cód. {s.supplierCode.trim()}</span>
                                    ) : null}
                                    {why ? (
                                      <span className="mt-0.5 block font-medium text-accent-muted">
                                        Corresponde: {why}
                                      </span>
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className={labelClass}>
                        Favorecido (nome ou matrícula)
                        <input
                          className={inputClass}
                          value={row._favSearchDraft ?? ""}
                          onChange={(e) =>
                            updateRow(i, {
                              _favSearchDraft: e.target.value,
                              payeeId: null,
                            })
                          }
                          placeholder="Nome, matrícula funcional…"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </label>
                      <button
                        type="button"
                        className="w-full rounded-md border border-line bg-shell/40 px-2 py-1.5 text-left text-[11px] font-medium text-muted hover:bg-elevated"
                        onClick={() =>
                          updateRow(i, {
                            payeeId: ALL_TEACHERS_DEPOSIT_PAYEE_ID,
                            _favSearchDraft: ALL_TEACHERS_SEARCH_LABEL,
                          })
                        }
                      >
                        Depósito em lote — todos os funcionários ativos
                      </button>
                      {row.payeeId === ALL_TEACHERS_DEPOSIT_PAYEE_ID ? (
                        <p className="text-[10px] leading-snug text-subtle">
                          O valor informado vale para cada funcionário ativo. Use o mesmo código de barras ou
                          comprovante de depósito em lote no campo de documento, se aplicável.
                        </p>
                      ) : null}
                      {(() => {
                        const q = (row._favSearchDraft ?? "").trim();
                        if (!q || row.payeeId) return null;
                        const hits = teachers
                          .filter((t) => employeeMatchesSearchQuery(t, q))
                          .slice(0, 15);
                        if (hits.length === 0) {
                          return (
                            <p className="text-xs text-muted">Nenhum funcionário encontrado. Refine a busca.</p>
                          );
                        }
                        return (
                          <ul className="max-h-44 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft bg-elevated-2 text-xs">
                            {hits.map((t) => {
                              const why = describeWhyEmployeeMatched(t, q);
                              return (
                                <li key={t.id}>
                                  <button
                                    type="button"
                                    className="w-full px-2 py-2 text-left transition-colors hover:bg-accent-soft"
                                    onClick={() =>
                                      updateRow(i, {
                                        payeeId: t.id,
                                        _favSearchDraft: t.name.trim(),
                                      })
                                    }
                                  >
                                    <span className="font-medium text-ink">{t.name.trim()}</span>
                                    {t.employeeCode?.trim() ? (
                                      <span className="text-muted"> — mat. func. {t.employeeCode.trim()}</span>
                                    ) : null}
                                    {t.jobRole?.trim() ? (
                                      <span className="mt-0.5 block text-subtle">{t.jobRole.trim()}</span>
                                    ) : null}
                                    {why ? (
                                      <span className="mt-0.5 block font-medium text-accent-muted">
                                        Corresponde: {why}
                                      </span>
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                  )}
                </td>
                <td className="min-w-0 px-2 py-2">
                  <label className={labelClass}>
                    Barras / digitável
                    <input
                      className={`${inputClass} font-mono text-xs`}
                      value={row.barcodeLine ?? ""}
                      onChange={(e) => updateRow(i, { barcodeLine: e.target.value || null })}
                      placeholder="Escaneie ou digite…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                </td>
                <td className="min-w-0 px-2 py-2">
                  <label className={labelClass}>
                    {row.payeeType === "SUPPLIER" ? "Doc. fornecedor" : "Doc. / comprov."}
                    <input
                      className={inputClass}
                      value={row.referenceDocument ?? ""}
                      onChange={(e) => updateRow(i, { referenceDocument: e.target.value || null })}
                      placeholder={
                        row.payeeType === "SUPPLIER"
                          ? "NF, boleto, pedido…"
                          : row.payeeType === "TEACHER"
                            ? "Comprovante, lote, TED…"
                            : "Referência…"
                      }
                    />
                  </label>
                </td>
                <td className="min-w-[9rem] px-2 py-2">
                  <label className={labelClass}>
                    Valor
                    <input
                      className={`${inputClass} tabular-nums`}
                      value={row.amountBrl}
                      onChange={(e) => updateRow(i, { amountBrl: e.target.value })}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </label>
                </td>
                <td className="min-w-[9rem] px-2 py-2">
                  <label className={labelClass}>
                    Venc.
                    <input
                      type="date"
                      className={inputClass}
                      value={row.dueDate ?? ""}
                      onChange={(e) => updateRow(i, { dueDate: e.target.value || null })}
                    />
                  </label>
                </td>
                <td className="min-w-[9rem] px-2 py-2">
                  <label className={labelClass}>
                    Liquid.
                    <input
                      type="date"
                      className={inputClass}
                      value={row.settledDate ?? ""}
                      onChange={(e) => updateRow(i, { settledDate: e.target.value || null })}
                    />
                  </label>
                </td>
                <td className="min-w-0 px-2 py-2">
                  <label className={labelClass}>
                    Obs.
                    <input
                      className={inputClass}
                      value={row.notes ?? ""}
                      onChange={(e) => updateRow(i, { notes: e.target.value || null })}
                      placeholder="NF, competência…"
                    />
                  </label>
                </td>
                <td className="px-1 py-2 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1 || pending}
                    className="rounded-lg border border-line px-2 py-2 text-xs font-medium text-muted hover:bg-danger-bg hover:text-danger-text disabled:opacity-40"
                    title="Remover linha"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={pending}
          className="rounded-xl border border-line bg-elevated-2 px-4 py-2 text-sm font-medium text-ink hover:bg-elevated"
        >
          Adicionar linha
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Gravando…" : "Registrar lançamentos"}
        </button>
      </div>
    </form>
  );
}
