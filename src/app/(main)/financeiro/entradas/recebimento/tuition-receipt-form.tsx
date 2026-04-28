"use client";

import { TuitionPaymentMethodFields } from "@/lib/tuition/tuition-payment-method-fields";
import {
  emptyTuitionPaymentDetails,
  type TuitionPaymentDetails,
} from "@/lib/tuition/tuition-payment-details";
import { centsToMoneyInputString } from "@/lib/tuition/enrollment-finance";
import { EmployeeSearchMatches } from "@/components/finance/employee-search-matches";
import {
  SearchListKindTabs,
  type FinanceSearchListKind,
} from "@/components/finance/student-search-picker";
import { SupplierSearchMatches } from "@/components/finance/supplier-search-matches";
import {
  buildDescriptionFromEmployee,
  buildDescriptionFromSearch,
  buildDescriptionFromSupplier,
  describeWhyRowMatched,
  rowMatchesSearchQuery,
  type FinanceClassRoomOption,
  type FinanceEmployeeSearchRow,
  type FinanceShiftOption,
  type FinanceStudentSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import { type FormEvent, useEffect, useId, useMemo, useState, useTransition } from "react";
import { recordTuitionReceipt } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const selectClass = inputClass;
const labelClass = "block text-xs font-medium text-muted";

export type ActiveTuitionMethod = { code: string; label: string };

export function TuitionReceiptForm({
  rows,
  shifts,
  classRooms,
  suppliers,
  employees,
  activeMethods,
}: {
  rows: FinanceStudentSearchRow[];
  shifts: FinanceShiftOption[];
  classRooms: FinanceClassRoomOption[];
  suppliers: FinanceSupplierSearchRow[];
  employees: FinanceEmployeeSearchRow[];
  activeMethods: ActiveTuitionMethod[];
}) {
  const listId = useId();
  const [flow, setFlow] = useState<"RECEIVED" | "BOLETO_PENDING">("RECEIVED");
  const [studentId, setStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryAtSelect, setSearchQueryAtSelect] = useState("");
  const [listKind, setListKind] = useState<FinanceSearchListKind>("student");
  const [shiftFilter, setShiftFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState<"all" | "active" | "inactive">("active");
  const [methodCode, setMethodCode] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceMonth, setReferenceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dueDate, setDueDate] = useState("");
  const [settledDate, setSettledDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [descriptionExtra, setDescriptionExtra] = useState("");
  const [details, setDetails] = useState<TuitionPaymentDetails>(() => emptyTuitionPaymentDetails());
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const classOptionsForShift = useMemo(() => {
    if (!shiftFilter) {
      return classRooms;
    }
    return classRooms.filter((c) => c.shiftId === shiftFilter);
  }, [classRooms, shiftFilter]);
  const effectiveClassFilter =
    classFilter && classOptionsForShift.some((c) => c.id === classFilter) ? classFilter : "";

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (situationFilter === "active" && !row.active) return false;
      if (situationFilter === "inactive" && row.active) return false;
      if (shiftFilter && row.shiftId !== shiftFilter) return false;
      if (effectiveClassFilter && row.classRoomId !== effectiveClassFilter) return false;
      return rowMatchesSearchQuery(row, searchQuery);
    });
  }, [rows, situationFilter, shiftFilter, effectiveClassFilter, searchQuery]);

  const displayRows = useMemo(() => filteredRows.slice(0, 40), [filteredRows]);

  const selectedRow = useMemo(
    () => (studentId ? rows.find((r) => r.id === studentId) ?? null : null),
    [rows, studentId],
  );

  const selectedMatchWhy = useMemo(() => {
    if (!selectedRow || !searchQueryAtSelect.trim()) return null;
    return describeWhyRowMatched(selectedRow, searchQueryAtSelect);
  }, [selectedRow, searchQueryAtSelect]);

  const methodForFields = flow === "BOLETO_PENDING" ? "BOLETO" : methodCode;
  const boletoAllowed = useMemo(
    () => activeMethods.some((m) => m.code === "BOLETO"),
    [activeMethods],
  );

  const activeCodes = useMemo(() => new Set(activeMethods.map((m) => m.code)), [activeMethods]);

  function applyStudent(row: FinanceStudentSearchRow, q: string) {
    setStudentId(row.id);
    setListKind("student");
    setSearchQueryAtSelect(q);
    setMessage(null);
    if (amount.trim() === "" && row.tuitionMonthlyAmountCents != null) {
      setAmount(centsToMoneyInputString(row.tuitionMonthlyAmountCents));
    }
    if (descriptionExtra.trim() === "") {
      setDescriptionExtra(buildDescriptionFromSearch(row, q));
    }
  }

  function clearStudent() {
    setStudentId("");
    setSearchQueryAtSelect("");
    setSearchQuery("");
  }

  function applyEmployeeForObservation(emp: FinanceEmployeeSearchRow, q: string) {
    setMessage(null);
    setDescriptionExtra(buildDescriptionFromEmployee(emp, q));
  }

  function applySupplierForObservation(sup: FinanceSupplierSearchRow, q: string) {
    setMessage(null);
    setDescriptionExtra(buildDescriptionFromSupplier(sup, q));
  }

  function changeListKindTuition(next: FinanceSearchListKind) {
    if (next === listKind) return;
    setListKind(next);
    setSearchQuery("");
  }

  const searchPlaceholderTuition =
    listKind === "student"
      ? "Nome do aluno, matrícula, responsável, telefone, documento…"
      : listKind === "employee"
        ? "Nome, apelido, matrícula funcional…"
        : "Razão social, fantasia, CNPJ/CPF…";

  function onFlowChange(next: "RECEIVED" | "BOLETO_PENDING") {
    setFlow(next);
    setMessage(null);
    if (next === "BOLETO_PENDING") {
      setDetails(emptyTuitionPaymentDetails());
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const effectiveMethod = flow === "BOLETO_PENDING" ? "BOLETO" : methodCode;
    if (!effectiveMethod || !activeCodes.has(effectiveMethod)) {
      setMessage({ type: "err", text: "Selecione uma forma de pagamento ativa." });
      return;
    }
    if (!studentId) {
      setMessage({ type: "err", text: "Selecione o aluno na lista de busca." });
      return;
    }
    startTransition(async () => {
      const res = await recordTuitionReceipt({
        studentId,
        flow,
        methodCode: effectiveMethod,
        amountText: amount,
        referenceMonth,
        dueDate: flow === "BOLETO_PENDING" ? dueDate : null,
        settledDate: flow === "RECEIVED" ? settledDate : null,
        descriptionExtra,
        details,
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Lançamento registrado." });
        setAmount("");
        setDescriptionExtra("");
        setDetails(emptyTuitionPaymentDetails());
        if (flow === "BOLETO_PENDING") {
          setDueDate("");
        }
      } else {
        setMessage({ type: "err", text: res.error });
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Registrar recebimento ou boleto de mensalidade"
    >
      <fieldset className="space-y-4" disabled={pending}>
        <legend className="text-sm font-semibold text-ink">Tipo de lançamento</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="flow"
              checked={flow === "RECEIVED"}
              onChange={() => onFlowChange("RECEIVED")}
              className="border-line text-accent focus:ring-accent"
            />
            <span>Pagamento recebido</span>
          </label>
          <label
            className={`flex items-center gap-2 ${boletoAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <input
              type="radio"
              name="flow"
              checked={flow === "BOLETO_PENDING"}
              onChange={() => boletoAllowed && onFlowChange("BOLETO_PENDING")}
              disabled={!boletoAllowed}
              className="border-line text-accent focus:ring-accent"
            />
            <span>Registrar boleto (cobrança em aberto)</span>
          </label>
        </div>
        {!boletoAllowed ? (
          <p className="text-xs text-muted">
            Ative &quot;Boleto bancário&quot; nas formas de pagamento aderidas em Financeiro → cadastro para
            registrar cobranças em aberto.
          </p>
        ) : null}
      </fieldset>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-line-soft bg-shell/40 px-3 py-3 sm:px-4">
          <p className={labelClass}>Aluno</p>
          <p className="mt-1 text-xs text-muted">
            Escolha a aba da lista. Em <span className="text-ink">Aluno</span>, selecione a criança (obrigatório para
            lançar). Nas abas <span className="text-ink">Funcionário</span> ou <span className="text-ink">Fornecedor</span>
            , toque em um resultado para copiar a referência na observação.
          </p>

          <div className="mt-2 space-y-2">
            <span className={labelClass}>Buscar em</span>
            <SearchListKindTabs
              value={listKind}
              onChange={changeListKindTuition}
              hasEmployees={employees.length > 0}
              hasSuppliers={suppliers.length > 0}
              enableEmployee
              enableSupplier
            />
          </div>

          {listKind === "employee" ? (
            <EmployeeSearchMatches employees={employees} query={searchQuery} onSelect={applyEmployeeForObservation} />
          ) : null}
          {listKind === "supplier" ? (
            <SupplierSearchMatches suppliers={suppliers} query={searchQuery} onSelect={applySupplierForObservation} />
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block lg:col-span-2">
              <span className={labelClass}>Buscar</span>
              <input
                className={inputClass}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholderTuition}
                autoComplete="off"
                aria-controls={listKind === "student" ? listId : undefined}
              />
            </label>
            {listKind === "student" ? (
              <>
                <label className="block">
                  <span className={labelClass}>Turno</span>
                  <select
                    className={selectClass}
                    value={shiftFilter}
                    onChange={(e) => {
                      setShiftFilter(e.target.value);
                      setClassFilter("");
                    }}
                  >
                    <option value="">Todos</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Turma</span>
                  <select
                    className={selectClass}
                    value={effectiveClassFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {classOptionsForShift.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.room ? `${c.name} — ${c.room}` : c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2 lg:col-span-4">
                  <span className={labelClass}>Situação</span>
                  <select
                    className={selectClass}
                    value={situationFilter}
                    onChange={(e) => setSituationFilter(e.target.value as "all" | "active" | "inactive")}
                  >
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="all">Todos</option>
                  </select>
                </label>
              </>
            ) : (
              <p className="sm:col-span-2 self-end text-xs text-muted">
                {listKind === "employee"
                  ? "Toque em um funcionário para preencher a observação."
                  : "Toque em um fornecedor para preencher a observação."}
              </p>
            )}
          </div>

          {selectedRow ? (
            <div className="mt-3 rounded-lg border border-accent-border bg-accent-soft/40 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {selectedRow.name}
                    {selectedRow.matricula ? (
                      <span className="font-normal text-muted"> — mat. {selectedRow.matricula}</span>
                    ) : null}
                  </p>
                  {selectedRow.classRoomLabel ? (
                    <p className="text-xs text-muted">Turma: {selectedRow.classRoomLabel}</p>
                  ) : null}
                  {selectedRow.teacherName ? (
                    <p className="text-xs text-muted">Professor(a) na turma: {selectedRow.teacherName}</p>
                  ) : null}
                  {selectedRow.guardians.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-ink">
                      {selectedRow.guardians.map((g, i) => (
                        <li key={`${g.name}-${i}`}>
                          {g.relation ? `${g.relation}: ` : ""}
                          {g.name}
                          {g.phone ? ` · ${g.phone}` : ""}
                          {g.email ? ` · ${g.email}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {selectedMatchWhy ? (
                    <p className="mt-2 text-xs font-medium text-accent-muted">
                      Dados conforme a busca: {selectedMatchWhy}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={clearStudent}
                  className="shrink-0 rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-line-soft"
                >
                  Trocar aluno
                </button>
              </div>
            </div>
          ) : listKind === "student" ? (
            <div
              id={listId}
              className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-line bg-elevated-2"
              role="listbox"
              aria-label="Resultados da busca de alunos"
            >
              {displayRows.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted">
                  Nenhum aluno encontrado. Ajuste filtros ou o texto de busca.
                </p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {displayRows.map((row) => {
                    const why = describeWhyRowMatched(row, searchQuery);
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          role="option"
                          className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent-soft"
                          onClick={() => applyStudent(row, searchQuery)}
                        >
                          <span className="font-medium text-ink">{row.name}</span>
                          {row.matricula ? (
                            <span className="text-muted"> — mat. {row.matricula}</span>
                          ) : null}
                          {!row.active ? (
                            <span className="ml-2 rounded bg-warn-bg px-1.5 py-0.5 text-[10px] font-medium text-warn-text">
                              Inativo
                            </span>
                          ) : null}
                          {row.classRoomLabel ? (
                            <span className="mt-0.5 block text-xs text-muted">{row.classRoomLabel}</span>
                          ) : null}
                          {row.teacherEmployeeCode ? (
                            <span className="mt-0.5 block text-xs text-subtle">
                              {row.teacherName ? `${row.teacherName} · ` : ""}matr. func. {row.teacherEmployeeCode}
                            </span>
                          ) : null}
                          {row.guardians.length > 0 ? (
                            <span className="mt-0.5 block text-xs text-subtle">
                              {row.guardians.map((g) => g.name).join(" · ")}
                            </span>
                          ) : null}
                          {why ? (
                            <span className="mt-1 block text-[11px] font-medium text-accent-muted">
                              Corresponde à busca: {why}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {filteredRows.length > displayRows.length ? (
                <p className="border-t border-line-soft px-3 py-2 text-center text-xs text-muted">
                  Mostrando os primeiros {displayRows.length} de {filteredRows.length} resultados — refine a busca.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {flow === "RECEIVED" ? (
            <label className="block">
              <span className={labelClass}>Forma de pagamento</span>
              <select
                className={selectClass}
                required
                value={methodCode}
                onChange={(e) => {
                  setMethodCode(e.target.value);
                  setDetails(emptyTuitionPaymentDetails());
                }}
              >
                <option value="">Selecione…</option>
                {activeMethods.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-line-soft bg-elevated px-3 py-2 text-sm text-muted">
              Forma: <span className="font-medium text-ink">Boleto bancário</span>
            </div>
          )}

          <label className="block">
            <span className={labelClass}>Valor (R$)</span>
            <input
              className={inputClass}
              required
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Competência (mês de referência)</span>
            <input
              type="month"
              className={inputClass}
              required
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
            />
          </label>

          {flow === "BOLETO_PENDING" ? (
            <label className="block">
              <span className={labelClass}>Vencimento do boleto</span>
              <input
                type="date"
                className={inputClass}
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          ) : (
            <label className="block">
              <span className={labelClass}>Data do recebimento</span>
              <input
                type="date"
                className={inputClass}
                required
                value={settledDate}
                onChange={(e) => setSettledDate(e.target.value)}
              />
            </label>
          )}

          <label className="sm:col-span-2 block">
            <span className={labelClass}>Observação (opcional)</span>
            <input
              className={inputClass}
              value={descriptionExtra}
              onChange={(e) => setDescriptionExtra(e.target.value)}
              placeholder="Ex.: 2ª parcela, acordo verbal…"
              maxLength={500}
            />
          </label>
        </div>
      </div>

      {methodForFields ? (
        <div className="mt-6 border-t border-line-soft pt-6">
          <TuitionPaymentMethodFields
            method={methodForFields}
            details={details}
            onPatch={(patch) => setDetails((d) => ({ ...d, ...patch }))}
            disabled={pending}
            inputClass={inputClass}
            selectClass={selectClass}
            labelClass={labelClass}
          />
        </div>
      ) : flow === "RECEIVED" ? (
        <p className="mt-6 text-sm text-muted">Escolha a forma de pagamento para exibir os campos do recibo.</p>
      ) : null}

      {message ? (
        <p
          className={`mt-4 text-sm ${message.type === "ok" ? "text-accent-muted" : "text-danger"}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          disabled={pending}
        >
          {pending ? "Salvando…" : "Registrar lançamento"}
        </button>
      </div>
    </form>
  );
}
