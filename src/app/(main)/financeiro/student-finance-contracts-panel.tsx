"use client";

import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { isMsInDateRange } from "@/lib/date-range-filter";
import { useMemo, useState } from "react";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { DIDACTIC_MATERIALS_OPTIONS } from "@/lib/tuition/enrollment-finance";
import type { ClassRoomOption, ShiftOption, StudentFinanceContractRow } from "./types";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

const tuitionLabelByCode = new Map<string, string>(
  TUITION_PAYMENT_OPTIONS.map((o) => [o.value, o.label]),
);
const didacticLabelByCode = new Map<string, string>(
  DIDACTIC_MATERIALS_OPTIONS.map((o) => [o.value, o.label]),
);

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function triYesNo(v: boolean | null | undefined): string {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  return "—";
}

function haystackForStudent(s: StudentFinanceContractRow): string {
  const tuition = s.tuitionPaymentMethod
    ? (tuitionLabelByCode.get(s.tuitionPaymentMethod) ?? s.tuitionPaymentMethod)
    : "";
  const didactic = s.didacticMaterialsPlan
    ? (didacticLabelByCode.get(s.didacticMaterialsPlan) ?? s.didacticMaterialsPlan)
    : "";
  const inst =
    s.yearStartInstallmentsPaid != null ? `${s.yearStartInstallmentsPaid} parcelas quitadas` : "";
  return [
    s.name,
    s.matricula ?? "",
    s.shiftName ?? "",
    s.classRoomLabel ?? "",
    s.active ? "ativo" : "inativo",
    tuition,
    didactic,
    inst,
    triYesNo(s.madeEntryPayment),
    triYesNo(s.owedPreviousSchoolYears),
    "entrada",
    "débito",
    "apostila",
    "material",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((t) => haystack.includes(t));
}

export function StudentFinanceContractsPanel({
  students,
  shifts,
  classRooms,
}: {
  students: StudentFinanceContractRow[];
  shifts: ShiftOption[];
  classRooms: ClassRoomOption[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilterId, setShiftFilterId] = useState("");
  const [classRoomFilterId, setClassRoomFilterId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [tuitionFilter, setTuitionFilter] = useState("");
  const [entryFilter, setEntryFilter] = useState<"all" | "yes" | "no" | "unset">("all");
  const [didacticFilter, setDidacticFilter] = useState<"all" | string | "unset">("all");
  const [owedFilter, setOwedFilter] = useState<"all" | "yes" | "no" | "unset">("all");
  const [installmentsFilter, setInstallmentsFilter] = useState<
    "all" | "has" | "zero" | "unset"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const classRoomsForShift = useMemo(() => {
    if (!shiftFilterId) return classRooms;
    return classRooms.filter((c) => c.shiftId === shiftFilterId);
  }, [classRooms, shiftFilterId]);

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const createdMs = new Date(s.createdAt).getTime();
      if (!isMsInDateRange(createdMs, dateFrom, dateTo)) return false;
      if (statusFilter === "active" && !s.active) return false;
      if (statusFilter === "inactive" && s.active) return false;
      if (shiftFilterId && s.shiftId !== shiftFilterId) return false;
      if (classRoomFilterId && s.classRoomId !== classRoomFilterId) return false;
      if (tuitionFilter === "__unset" && (s.tuitionPaymentMethod ?? "").trim() !== "") return false;
      if (
        tuitionFilter &&
        tuitionFilter !== "__unset" &&
        (s.tuitionPaymentMethod ?? "") !== tuitionFilter
      )
        return false;
      if (entryFilter === "yes" && s.madeEntryPayment !== true) return false;
      if (entryFilter === "no" && s.madeEntryPayment !== false) return false;
      if (entryFilter === "unset" && s.madeEntryPayment != null) return false;
      if (didacticFilter === "unset" && s.didacticMaterialsPlan != null) return false;
      if (didacticFilter !== "all" && didacticFilter !== "unset") {
        if ((s.didacticMaterialsPlan ?? "") !== didacticFilter) return false;
      }
      if (owedFilter === "yes" && s.owedPreviousSchoolYears !== true) return false;
      if (owedFilter === "no" && s.owedPreviousSchoolYears !== false) return false;
      if (owedFilter === "unset" && s.owedPreviousSchoolYears != null) return false;
      if (installmentsFilter === "has" && (s.yearStartInstallmentsPaid == null || s.yearStartInstallmentsPaid <= 0))
        return false;
      if (installmentsFilter === "zero" && s.yearStartInstallmentsPaid !== 0) return false;
      if (installmentsFilter === "unset" && s.yearStartInstallmentsPaid != null) return false;
      return matchesSearch(haystackForStudent(s), tokens);
    });
  }, [
    students,
    statusFilter,
    shiftFilterId,
    classRoomFilterId,
    tuitionFilter,
    entryFilter,
    didacticFilter,
    owedFilter,
    installmentsFilter,
    tokens,
    dateFrom,
    dateTo,
  ]);

  const hasExtraFilters =
    tuitionFilter ||
    entryFilter !== "all" ||
    didacticFilter !== "all" ||
    owedFilter !== "all" ||
    installmentsFilter !== "all" ||
    dateFrom.trim() ||
    dateTo.trim();

  if (students.length === 0) {
    return (
      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-label="Contrato e mensalidade por aluno"
      >
        <p className="text-sm font-semibold text-ink">Contrato / mensalidade por aluno</p>
        <p className="mt-1 text-sm text-muted">Ainda não há alunos cadastrados.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Contrato e mensalidade por aluno"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">
        Buscar e filtrar
      </p>
      <h2 className="mt-1 text-sm font-semibold text-ink">O que foi combinado no contrato (por aluno)</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Mensalidade (forma preferida), parcelas já quitadas no início do ano, entrada, material didático e
        débitos de anos anteriores — como registrado na ficha. Use os filtros para conferência e cobrança no
        dia a dia; para alterar, abra o cadastro do aluno.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-12">
          <FilterDateRangeFields
            idPrefix="fin-contract"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            legend="Período (cadastro do aluno)"
            className="md:max-w-xl"
          />
        </div>
        <div className="md:col-span-4">
          <label className={labelClass} htmlFor="fin-contract-search">
            Buscar
          </label>
          <input
            id="fin-contract-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, matrícula, turma, forma de pagamento…"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="fin-contract-shift">
            Turno
          </label>
          <select
            id="fin-contract-shift"
            value={shiftFilterId}
            onChange={(e) => {
              setShiftFilterId(e.target.value);
              setClassRoomFilterId("");
            }}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Todos</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="fin-contract-class">
            Turma
          </label>
          <select
            id="fin-contract-class"
            value={classRoomFilterId}
            onChange={(e) => setClassRoomFilterId(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Todas</option>
            {classRoomsForShift.map((c) => (
              <option key={c.id} value={c.id}>
                {c.room ? `${c.name} — ${c.room}` : c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="fin-contract-status">
            Situação
          </label>
          <select
            id="fin-contract-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="fin-contract-tuition">
            Mensalidade (forma)
          </label>
          <select
            id="fin-contract-tuition"
            value={tuitionFilter}
            onChange={(e) => setTuitionFilter(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Todas</option>
            {TUITION_PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value="__unset">Não informado</option>
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div>
          <label className={labelClass} htmlFor="fin-contract-entry">
            Entrada no contrato
          </label>
          <select
            id="fin-contract-entry"
            value={entryFilter}
            onChange={(e) => setEntryFilter(e.target.value as typeof entryFilter)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todas</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
            <option value="unset">Não informado</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="fin-contract-didactic">
            Apostilas / material
          </label>
          <select
            id="fin-contract-didactic"
            value={didacticFilter}
            onChange={(e) => setDidacticFilter(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            {DIDACTIC_MATERIALS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value="unset">Não informado</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="fin-contract-owed">
            Débito anos anteriores
          </label>
          <select
            id="fin-contract-owed"
            value={owedFilter}
            onChange={(e) => setOwedFilter(e.target.value as typeof owedFilter)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
            <option value="unset">Não informado</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="fin-contract-inst">
            Parcelas quitadas (início do ano)
          </label>
          <select
            id="fin-contract-inst"
            value={installmentsFilter}
            onChange={(e) => setInstallmentsFilter(e.target.value as typeof installmentsFilter)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todas</option>
            <option value="has">Com pelo menos 1 quitada</option>
            <option value="zero">Zero quitadas (informado)</option>
            <option value="unset">Não informado</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <ExportExcelReportButton
          onExport={() =>
            downloadExcelSheets(buildExcelFilename("financeiro-contratos"), [
              {
                sheetName: "Contratos",
                headers: [
                  "Aluno",
                  "Matrícula",
                  "Situação",
                  "Turma",
                  "Mensalidade (forma)",
                  "Parcelas quitadas (início)",
                  "Entrada",
                  "Material didático",
                  "Débito anos anteriores",
                  "Data cadastro",
                ],
                rows: filtered.map((s) => {
                  const tuition =
                    s.tuitionPaymentMethod == null || s.tuitionPaymentMethod === ""
                      ? "—"
                      : (tuitionLabelByCode.get(s.tuitionPaymentMethod) ?? s.tuitionPaymentMethod);
                  const didactic =
                    s.didacticMaterialsPlan == null || s.didacticMaterialsPlan === ""
                      ? "—"
                      : (didacticLabelByCode.get(s.didacticMaterialsPlan) ?? s.didacticMaterialsPlan);
                  const inst =
                    s.yearStartInstallmentsPaid == null ? "—" : String(s.yearStartInstallmentsPaid);
                  return [
                    s.name,
                    s.matricula ?? "",
                    s.active ? "Ativo" : "Inativo",
                    [s.shiftName, s.classRoomLabel].filter(Boolean).join(" · ") || "—",
                    tuition,
                    inst,
                    triYesNo(s.madeEntryPayment),
                    didactic,
                    triYesNo(s.owedPreviousSchoolYears),
                    formatDateBrFromIso(s.createdAt),
                  ];
                }),
              },
            ])
          }
        />
      </div>

      {(searchQuery.trim() ||
        shiftFilterId ||
        classRoomFilterId ||
        statusFilter !== "all" ||
        hasExtraFilters) && (
        <p className="mt-2 text-xs text-muted">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-line bg-elevated text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Aluno</th>
              <th className="px-3 py-2 font-medium">Turma</th>
              <th className="px-3 py-2 font-medium">Mensalidade</th>
              <th className="px-3 py-2 font-medium">Parcelas (início)</th>
              <th className="px-3 py-2 font-medium">Entrada</th>
              <th className="min-w-[140px] px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 font-medium">Débito ant.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-elevated-2">
            {filtered.map((s) => {
              const tuition =
                s.tuitionPaymentMethod == null || s.tuitionPaymentMethod === ""
                  ? "—"
                  : (tuitionLabelByCode.get(s.tuitionPaymentMethod) ?? s.tuitionPaymentMethod);
              const didactic =
                s.didacticMaterialsPlan == null || s.didacticMaterialsPlan === ""
                  ? "—"
                  : (didacticLabelByCode.get(s.didacticMaterialsPlan) ?? s.didacticMaterialsPlan);
              const inst =
                s.yearStartInstallmentsPaid == null ? "—" : String(s.yearStartInstallmentsPaid);
              return (
                <tr key={s.id} className="align-top">
                  <td className="px-3 py-2">
                    <span className="font-medium text-ink">{s.name}</span>
                    {!s.active ? (
                      <span className="ml-2 inline-block rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn-text">
                        Inativo
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-muted tabular-nums">
                      {s.matricula ? `Mat. ${s.matricula}` : "Sem matrícula"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {[s.shiftName, s.classRoomLabel].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-ink">{tuition}</td>
                  <td className="px-3 py-2 tabular-nums text-muted">{inst}</td>
                  <td className="px-3 py-2 text-muted">{triYesNo(s.madeEntryPayment)}</td>
                  <td className="px-3 py-2 text-muted">{didactic}</td>
                  <td className="px-3 py-2 text-muted">{triYesNo(s.owedPreviousSchoolYears)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">
          Nenhum aluno corresponde à busca ou aos filtros.
        </p>
      ) : null}
    </section>
  );
}
