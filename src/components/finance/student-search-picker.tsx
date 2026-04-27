"use client";

import { EmployeeSearchMatches } from "@/components/finance/employee-search-matches";
import { SupplierSearchMatches } from "@/components/finance/supplier-search-matches";
import {
  describeWhyRowMatched,
  describeWhySupplierMatched,
  describeWhyEmployeeMatched,
  rowMatchesSearchQuery,
  type FinanceClassRoomOption,
  type FinanceEmployeeSearchRow,
  type FinanceShiftOption,
  type FinanceStudentSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import { useId, useMemo, useState } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";
const selectClass = inputClass;

export type FinanceSearchListKind = "student" | "employee" | "supplier";

const LIST_KIND_LABEL: Record<FinanceSearchListKind, string> = {
  student: "Aluno",
  employee: "Funcionário",
  supplier: "Fornecedor",
};

export function SearchListKindTabs({
  value,
  onChange,
  hasEmployees,
  hasSuppliers,
  enableEmployee,
  enableSupplier,
}: {
  value: FinanceSearchListKind;
  onChange: (v: FinanceSearchListKind) => void;
  hasEmployees: boolean;
  hasSuppliers: boolean;
  enableEmployee: boolean;
  enableSupplier: boolean;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border border-line-soft bg-elevated-2 p-1"
      role="tablist"
      aria-label="Lista a exibir"
    >
      {(["student", "employee", "supplier"] as const).map((k) => {
        const disabled =
          (k === "employee" && (!enableEmployee || !hasEmployees)) ||
          (k === "supplier" && (!enableSupplier || !hasSuppliers));
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(k)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "bg-accent text-on-accent shadow-sm"
                : "text-muted hover:bg-line-soft hover:text-ink"
            }`}
          >
            {LIST_KIND_LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}

export function FinanceStudentSearchPicker({
  rows,
  shifts,
  classRooms,
  optional = true,
  selectedStudentId,
  selectedEmployeeId = null,
  selectedSupplierId = null,
  onSelect,
  onSelectEmployee,
  onSelectSupplier,
  onClear,
  title = "Aluno",
  hint,
  suppliers = [],
  employees = [],
}: {
  rows: FinanceStudentSearchRow[];
  shifts: FinanceShiftOption[];
  classRooms: FinanceClassRoomOption[];
  optional?: boolean;
  selectedStudentId: string | null;
  /** Quando preenchido, exibe resumo de funcionário (exclusivo com aluno/fornecedor). */
  selectedEmployeeId?: string | null;
  selectedSupplierId?: string | null;
  onSelect: (row: FinanceStudentSearchRow, searchQueryAtSelect: string) => void;
  onSelectEmployee?: (row: FinanceEmployeeSearchRow, searchQueryAtSelect: string) => void;
  onSelectSupplier?: (row: FinanceSupplierSearchRow, searchQueryAtSelect: string) => void;
  onClear: () => void;
  title?: string;
  hint?: string;
  suppliers?: FinanceSupplierSearchRow[];
  employees?: FinanceEmployeeSearchRow[];
}) {
  const listId = useId();
  const [listKind, setListKind] = useState<FinanceSearchListKind>("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState<"all" | "active" | "inactive">("active");

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

  const [searchQueryAtSelect, setSearchQueryAtSelect] = useState("");

  function handlePick(row: FinanceStudentSearchRow) {
    setSearchQueryAtSelect(searchQuery);
    onSelect(row, searchQuery);
  }

  function handlePickEmployee(row: FinanceEmployeeSearchRow) {
    if (!onSelectEmployee) return;
    setSearchQueryAtSelect(searchQuery);
    onSelectEmployee(row, searchQuery);
  }

  function handlePickSupplier(row: FinanceSupplierSearchRow) {
    if (!onSelectSupplier) return;
    setSearchQueryAtSelect(searchQuery);
    onSelectSupplier(row, searchQuery);
  }

  function handleClear() {
    setSearchQueryAtSelect("");
    onClear();
  }

  function changeListKind(next: FinanceSearchListKind) {
    if (next === listKind) return;
    if (selectedStudentId || selectedEmployeeId || selectedSupplierId) {
      handleClear();
    }
    setListKind(next);
    setSearchQuery("");
  }

  const selectedStudentWhy = useMemo(() => {
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
  const searchPlaceholder =
    listKind === "student"
      ? "Nome do aluno, matrícula, responsável, telefone, documento…"
      : listKind === "employee"
        ? "Nome, apelido, matrícula funcional, e-mail, telefone…"
        : "Razão social, nome fantasia, CNPJ/CPF, telefone…";

  return (
    <div className="space-y-3 rounded-xl border border-line-soft bg-shell/40 px-3 py-3 sm:px-4">
      <p className={labelClass}>
        {title}
        {optional ? <span className="font-normal text-muted"> (opcional)</span> : null}
      </p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}

      <div className="space-y-2">
        <span className={labelClass}>Buscar em</span>
        <SearchListKindTabs
          value={listKind}
          onChange={changeListKind}
          hasEmployees={employees.length > 0}
          hasSuppliers={suppliers.length > 0}
          enableEmployee={Boolean(onSelectEmployee)}
          enableSupplier={Boolean(onSelectSupplier)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block lg:col-span-2">
          <span className={labelClass}>Buscar</span>
          <input
            className={inputClass}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
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
          <p className="sm:col-span-2 lg:col-span-2 self-end text-xs text-muted">
            {listKind === "employee"
              ? "Lista de funcionários ativos cadastrados na unidade."
              : "Lista de fornecedores ativos."}
          </p>
        )}
      </div>

      {showPickLists && listKind === "employee" && employees.length > 0 && onSelectEmployee ? (
        <EmployeeSearchMatches employees={employees} query={searchQuery} onSelect={handlePickEmployee} />
      ) : null}

      {showPickLists && listKind === "supplier" && suppliers.length > 0 && onSelectSupplier ? (
        <SupplierSearchMatches suppliers={suppliers} query={searchQuery} onSelect={handlePickSupplier} />
      ) : null}

      {selectedSupplierRow ? (
        <div className="rounded-lg border border-accent-border bg-accent-soft/40 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Fornecedor</p>
              <p className="font-medium text-ink">
                {selectedSupplierRow.tradeName?.trim() || selectedSupplierRow.name}
              </p>
              {selectedSupplierRow.name !== (selectedSupplierRow.tradeName || "") ? (
                <p className="text-xs text-muted">Razão social: {selectedSupplierRow.name}</p>
              ) : null}
              {selectedSupplierRow.document?.trim() ? (
                <p className="text-xs text-muted">Documento: {selectedSupplierRow.document.trim()}</p>
              ) : null}
              {selectedSupplierWhy ? (
                <p className="mt-2 text-xs font-medium text-accent-muted">
                  Dados conforme a busca: {selectedSupplierWhy}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClear}
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
              {selectedEmployeeRow.jobRole?.trim() ? (
                <p className="text-xs text-muted">{selectedEmployeeRow.jobRole.trim()}</p>
              ) : null}
              {selectedEmployeeWhy ? (
                <p className="mt-2 text-xs font-medium text-accent-muted">
                  Dados conforme a busca: {selectedEmployeeWhy}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClear}
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
              {selectedStudentWhy ? (
                <p className="mt-2 text-xs font-medium text-accent-muted">
                  Dados conforme a busca: {selectedStudentWhy}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-line-soft"
            >
              {optional ? "Limpar vínculo" : "Trocar aluno"}
            </button>
          </div>
        </div>
      ) : listKind !== "student" ? null : (
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
                      onClick={() => handlePick(row)}
                    >
                      <span className="font-medium text-ink">{row.name}</span>
                      {row.matricula ? <span className="text-muted"> — mat. {row.matricula}</span> : null}
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
      )}
    </div>
  );
}
