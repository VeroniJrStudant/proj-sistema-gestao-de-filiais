"use client";

import { EmployeeSearchMatches } from "@/components/finance/employee-search-matches";
import {
  SearchListKindTabs,
  type FinanceSearchListKind,
} from "@/components/finance/student-search-picker";
import { SupplierSearchMatches } from "@/components/finance/supplier-search-matches";
import { DebitDocPrintBodyClass } from "@/components/debit-doc-print";
import { buildPixPrintPayload, type PixPrintResult } from "./actions";
import {
  buildDescriptionFromEmployee,
  buildDescriptionFromSearch,
  buildDescriptionFromSupplier,
  describeWhyEmployeeMatched,
  describeWhyRowMatched,
  describeWhySupplierMatched,
  resolveContactFromEmployee,
  resolveContactFromSearch,
  resolveContactFromSupplier,
  rowMatchesSearchQuery,
  type FinanceClassRoomOption,
  type FinanceEmployeeSearchRow,
  type FinanceShiftOption,
  type FinanceStudentSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import JsBarcode from "jsbarcode";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";
const selectClass = inputClass;

export function PixPrintPanel({
  rows,
  shifts,
  classRooms,
  suppliers,
  employees,
  hasPixKey,
  schoolLabel,
}: {
  rows: FinanceStudentSearchRow[];
  shifts: FinanceShiftOption[];
  classRooms: FinanceClassRoomOption[];
  suppliers: FinanceSupplierSearchRow[];
  employees: FinanceEmployeeSearchRow[];
  hasPixKey: boolean;
  schoolLabel: string;
}) {
  const formId = useId();
  const listId = useId();
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PixPrintResult | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [desc, setDesc] = useState("");
  const [payer, setPayer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState<"all" | "active" | "inactive">("active");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQueryAtSelect, setSearchQueryAtSelect] = useState("");
  const [listKind, setListKind] = useState<FinanceSearchListKind>("student");

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
    () => (selectedStudentId ? rows.find((r) => r.id === selectedStudentId) ?? null : null),
    [rows, selectedStudentId],
  );

  const selectedEmployeeRow = useMemo(
    () => (selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) ?? null : null),
    [employees, selectedEmployeeId],
  );

  const selectedSupplierRow = useMemo(
    () => (selectedSupplierId ? suppliers.find((s) => s.id === selectedSupplierId) ?? null : null),
    [suppliers, selectedSupplierId],
  );

  const studentLabel = selectedRow
    ? `${selectedRow.name}${selectedRow.matricula ? ` — mat. ${selectedRow.matricula}` : ""}`
    : null;

  const employeePrintLabel = selectedEmployeeRow
    ? `${selectedEmployeeRow.name}${
        selectedEmployeeRow.employeeCode ? ` — mat. func. ${selectedEmployeeRow.employeeCode}` : ""
      }`
    : null;

  const supplierPrintLabel = selectedSupplierRow
    ? (selectedSupplierRow.tradeName?.trim() || selectedSupplierRow.name)
    : null;

  const selectedMatchWhy = useMemo(() => {
    if (!selectedRow || !searchQueryAtSelect.trim()) return null;
    return describeWhyRowMatched(selectedRow, searchQueryAtSelect);
  }, [selectedRow, searchQueryAtSelect]);

  const selectedEmployeeWhy = useMemo(() => {
    if (!selectedEmployeeRow || !searchQueryAtSelect.trim()) return null;
    return describeWhyEmployeeMatched(selectedEmployeeRow, searchQueryAtSelect);
  }, [selectedEmployeeRow, searchQueryAtSelect]);

  const selectedSupplierWhy = useMemo(() => {
    if (!selectedSupplierRow || !searchQueryAtSelect.trim()) return null;
    return describeWhySupplierMatched(selectedSupplierRow, searchQueryAtSelect);
  }, [selectedSupplierRow, searchQueryAtSelect]);

  const showPickLists = !selectedRow && !selectedEmployeeRow && !selectedSupplierRow;

  useEffect(() => {
    if (result?.ok && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, result.barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 56,
          displayValue: true,
          fontSize: 11,
          margin: 6,
        });
      } catch {
        /* ignore */
      }
    }
  }, [result]);

  function applyStudent(row: FinanceStudentSearchRow, q: string) {
    setSelectedStudentId(row.id);
    setSelectedEmployeeId(null);
    setSelectedSupplierId(null);
    setSearchQueryAtSelect(q);
    const c = resolveContactFromSearch(row, q);
    setPayer(c.payerName);
    setDesc(buildDescriptionFromSearch(row, q));
    setBanner(null);
  }

  function applyEmployee(row: FinanceEmployeeSearchRow, q: string) {
    setSelectedStudentId(null);
    setSelectedSupplierId(null);
    setSelectedEmployeeId(row.id);
    setSearchQueryAtSelect(q);
    const c = resolveContactFromEmployee(row);
    setPayer(c.payerName);
    setDesc(buildDescriptionFromEmployee(row, q));
    setBanner(null);
  }

  function applySupplier(row: FinanceSupplierSearchRow, q: string) {
    setSelectedStudentId(null);
    setSelectedEmployeeId(null);
    setSelectedSupplierId(row.id);
    setSearchQueryAtSelect(q);
    const c = resolveContactFromSupplier(row);
    setPayer(c.payerName);
    setDesc(buildDescriptionFromSupplier(row, q));
    setBanner(null);
  }

  function clearSelection() {
    setSelectedStudentId(null);
    setSelectedEmployeeId(null);
    setSelectedSupplierId(null);
    setSearchQueryAtSelect("");
    setSearchQuery("");
  }

  function changeListKind(next: FinanceSearchListKind) {
    if (next === listKind) return;
    if (selectedStudentId || selectedEmployeeId || selectedSupplierId) {
      clearSelection();
    }
    setListKind(next);
    setSearchQuery("");
  }

  const searchPlaceholderPix =
    listKind === "student"
      ? "Nome do aluno, matrícula, responsável, telefone, documento…"
      : listKind === "employee"
        ? "Nome, apelido, matrícula funcional, e-mail…"
        : "Razão social, fantasia, CNPJ/CPF…";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    fd.set("description", desc);
    fd.set("payerName", payer);
    if (selectedStudentId) {
      fd.set("studentId", selectedStudentId);
    } else {
      fd.delete("studentId");
    }
    startTransition(async () => {
      const res = await buildPixPrintPayload(fd);
      setResult(res);
      if (!res.ok) {
        setBanner({ type: "err", text: res.error });
      } else {
        setBanner({ type: "ok", text: "PIX gerado. Use Imprimir ou copie o código abaixo." });
      }
    });
  }

  return (
    <div className="space-y-6">
      {!hasPixKey ? (
        <p className="rounded-xl border border-caution-soft bg-caution-soft/30 px-4 py-3 text-sm text-ink">
          Para gerar QR Code e código PIX válidos, configure a variável{" "}
          <code className="rounded bg-elevated px-1 text-xs">SCHOOL_PIX_KEY</code> no servidor (chave PIX da
          creche). Opcionalmente: <code className="rounded bg-elevated px-1 text-xs">SCHOOL_NAME</code>,{" "}
          <code className="rounded bg-elevated px-1 text-xs">SCHOOL_CITY</code> (cidade sem acento, ex. SAO PAULO).
        </p>
      ) : null}

      <form
        id={formId}
        onSubmit={onSubmit}
        className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm sm:p-5"
      >
        <input type="hidden" name="studentId" value={selectedStudentId ?? ""} readOnly />
        <h2 className="text-base font-semibold text-ink">Dados da cobrança</h2>
        <p className="mt-1 text-sm text-muted">
          Informe o valor. O sistema monta o BR Code (padrão Pix) para pagamento em qualquer banco ou carteira.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className={labelClass}>Valor (R$)</span>
            <input name="amount" required className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
          <label className="block sm:col-span-1">
            <span className={labelClass}>Identificação do pagador (opcional, só no impresso)</span>
            <input
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className={inputClass}
              maxLength={120}
              placeholder="Nome do responsável"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Descrição / referência (opcional, só no impresso)</span>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={inputClass}
              maxLength={200}
              placeholder="Ex.: Mensalidade abril/2026"
            />
          </label>

          <div className="sm:col-span-2 space-y-3 rounded-xl border border-line-soft bg-shell/40 px-3 py-3 sm:px-4">
            <p className={labelClass}>Pagador / referência (opcional, só no impresso)</p>
            <p className="text-xs text-muted">
              Use as abas para escolher a lista. Em <span className="text-ink">Aluno</span>, filtre por turma e busque
              crianças ou responsáveis. Em <span className="text-ink">Funcionário</span> ou{" "}
              <span className="text-ink">Fornecedor</span>, busque no cadastro correspondente. O pagador e a descrição
              são preenchidos ao tocar em um resultado (edição permitida).
            </p>

            <div className="space-y-2">
              <span className={labelClass}>Buscar em</span>
              <SearchListKindTabs
                value={listKind}
                onChange={changeListKind}
                hasEmployees={employees.length > 0}
                hasSuppliers={suppliers.length > 0}
                enableEmployee
                enableSupplier
              />
            </div>

            {showPickLists && listKind === "employee" ? (
              <EmployeeSearchMatches employees={employees} query={searchQuery} onSelect={applyEmployee} />
            ) : null}
            {showPickLists && listKind === "supplier" ? (
              <SupplierSearchMatches suppliers={suppliers} query={searchQuery} onSelect={applySupplier} />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block lg:col-span-2">
                <span className={labelClass}>Buscar</span>
                <input
                  className={inputClass}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholderPix}
                  autoComplete="off"
                  aria-controls={listKind === "student" ? listId : undefined}
                  aria-expanded={listKind === "student" && showPickLists && displayRows.length > 0}
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
                    ? "Funcionários ativos cadastrados na unidade."
                    : "Fornecedores ativos."}
                </p>
              )}
            </div>

            {selectedSupplierRow ? (
              <div className="rounded-lg border border-accent-border bg-accent-soft/40 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Fornecedor</p>
                    <p className="font-medium text-ink">
                      {selectedSupplierRow.tradeName?.trim() || selectedSupplierRow.name}
                    </p>
                    {selectedSupplierWhy ? (
                      <p className="mt-2 text-xs font-medium text-accent-muted">
                        Dados conforme a busca: {selectedSupplierWhy}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="shrink-0 rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-line-soft"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ) : selectedEmployeeRow ? (
              <div className="rounded-lg border border-accent-border bg-accent-soft/40 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Funcionário(a)</p>
                    <p className="font-medium text-ink">{selectedEmployeeRow.name}</p>
                    {selectedEmployeeRow.employeeCode?.trim() ? (
                      <p className="text-xs text-muted">Matr. func. {selectedEmployeeRow.employeeCode.trim()}</p>
                    ) : null}
                    {selectedEmployeeWhy ? (
                      <p className="mt-2 text-xs font-medium text-accent-muted">
                        Dados conforme a busca: {selectedEmployeeWhy}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="shrink-0 rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-line-soft"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ) : selectedRow ? (
              <div className="rounded-lg border border-accent-border bg-accent-soft/40 px-3 py-2 text-sm">
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
                    onClick={clearSelection}
                    className="shrink-0 rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-line-soft"
                  >
                    Limpar vínculo
                  </button>
                </div>
              </div>
            ) : listKind === "student" ? (
              <div
                id={listId}
                className="max-h-60 overflow-y-auto rounded-lg border border-line bg-elevated-2"
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
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-sm hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {pending ? "Gerando…" : "Gerar PIX (QR + código copia e cola)"}
          </button>
        </div>
      </form>

      {banner ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${banner.type === "ok" ? "bg-accent-soft text-ink" : "bg-danger-soft text-ink"}`}
          role="alert"
        >
          {banner.text}
        </p>
      ) : null}

      {result?.ok ? (
        <>
          <DebitDocPrintBodyClass className="debit-doc-print" />
          <div className="pix-print-area space-y-4 rounded-2xl border border-line-soft bg-elevated p-4 sm:p-6 print:border-line print:bg-white print:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-line bg-elevated-2 px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-line-soft"
              >
                Imprimir
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.pixCopiaECola);
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded-lg border border-accent/40 bg-accent-soft px-4 py-2 text-sm font-medium text-ink"
              >
                Copiar código PIX
              </button>
            </div>

            <header className="border-b border-line-soft pb-3 text-center print:border-line">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{schoolLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Pagamento via PIX</h2>
              <p className="mt-1 text-2xl font-bold text-accent-muted">{result.amountLabel}</p>
              {desc.trim() ? <p className="mt-2 text-sm text-muted">{desc.trim()}</p> : null}
              {payer.trim() ? <p className="text-sm text-ink">Pagador: {payer.trim()}</p> : null}
              {studentLabel ? <p className="text-sm text-muted">Aluno: {studentLabel}</p> : null}
              {employeePrintLabel ? (
                <p className="text-sm text-muted">Funcionário(a): {employeePrintLabel}</p>
              ) : null}
              {supplierPrintLabel ? (
                <p className="text-sm text-muted">Fornecedor: {supplierPrintLabel}</p>
              ) : null}
            </header>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.qrDataUrl}
                  alt="QR Code PIX"
                  className="mx-auto h-56 w-56 rounded-lg border border-line bg-white p-2"
                />
                <p className="mt-2 max-w-[16rem] text-xs text-muted">Escaneie com o app do banco ou carteira digital.</p>
              </div>
              <div className="w-full min-w-0 max-w-xl">
                <p className="text-xs font-medium text-muted">Pix copia e cola</p>
                <textarea
                  readOnly
                  className="mt-1 w-full rounded-lg border border-line bg-shell px-3 py-2 font-mono text-[11px] leading-relaxed text-ink print:text-[10px]"
                  rows={5}
                  value={result.pixCopiaECola}
                />
              </div>
            </div>

            <div className="flex flex-col items-center border-t border-line-soft pt-4 print:border-line">
              <p className="mb-2 text-xs font-medium text-muted">Código de barras (referência / controle)</p>
              <svg ref={barcodeRef} className="max-w-full" />
              <p className="mt-1 text-center text-xs text-subtle">TXID: {result.txid}</p>
            </div>

            <footer className="border-t border-line-soft pt-3 text-center text-xs text-subtle print:border-line">
              Após o pagamento, envie o comprovante à secretaria. Em caso de dúvida, fale com a unidade.
            </footer>
          </div>
        </>
      ) : null}
    </div>
  );
}
