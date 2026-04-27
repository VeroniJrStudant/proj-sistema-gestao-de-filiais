"use client";

import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { formatBRL } from "@/lib/format-brl";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { isMsInDateRange } from "@/lib/date-range-filter";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";

/** Cadastro completo do funcionário (lista, busca e Excel). */
export type TeacherPickerRow = {
  id: string;
  name: string;
  nickname: string | null;
  jobRole: string | null;
  employeeCode: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  document: string | null;
  specialty: string | null;
  notes: string | null;
  photoUrl: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  workCardNumber: string | null;
  workCardSeries: string | null;
  workCardUf: string | null;
  admissionDate: string | null;
  dismissalDate: string | null;
  salaryCents: number | null;
  salaryPaymentMethod: string | null;
  salaryPaymentDay: number | null;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function haystackForTeacher(t: TeacherPickerRow): string {
  return [
    t.name,
    t.nickname ?? "",
    t.jobRole ?? "",
    t.employeeCode ?? "",
    t.active ? "ativo" : "inativo",
    t.phone ?? "",
    t.email ?? "",
    t.document ?? "",
    t.specialty ?? "",
    t.notes ?? "",
    t.city ?? "",
    t.state ?? "",
    t.street ?? "",
    t.neighborhood ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function brlOrDash(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return formatBRL(cents);
}

function matchesSearch(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((x) => haystack.includes(x));
}

function TeacherListRowAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const src = photoUrl?.trim();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL do cadastro (upload ou externa)
      <img
        src={src}
        alt={`Foto de ${name.trim()}`}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line-soft"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated-2 text-xs font-semibold text-muted ring-1 ring-line-soft"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export type TeacherSearchPanelProps = {
  teachers: TeacherPickerRow[];
  currentTeacherId: string | null;
  /** Ficha completa renderizada logo abaixo da linha selecionada (quando a URL traz `ficha=1`). */
  belowSelectedFicha?: ReactNode | null;
  /** Se a ficha está visível para o registro atual (segundo clique na linha remove `ficha` da URL). */
  fichaPanelOpen?: boolean;
};

export function TeacherSearchPanel({
  teachers,
  currentTeacherId,
  belowSelectedFicha = null,
  fichaPanelOpen = false,
}: TeacherSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (statusFilter === "active" && !t.active) return false;
      if (statusFilter === "inactive" && t.active) return false;
      const createdMs = new Date(t.createdAt).getTime();
      if (!isMsInDateRange(createdMs, dateFrom, dateTo)) return false;
      return matchesSearch(haystackForTeacher(t), tokens);
    });
  }, [teachers, statusFilter, tokens, dateFrom, dateTo]);

  const selectedInFiltered = useMemo(
    () => (currentTeacherId ? filtered.some((t) => t.id === currentTeacherId) : false),
    [filtered, currentTeacherId],
  );

  /** Com ficha aberta na lista, remove altura máxima e scroll interno para o bloco usar largura total. */
  const expandedFichaInList =
    Boolean(belowSelectedFicha && currentTeacherId && selectedInFiltered);

  if (teachers.length === 0) {
    return (
      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-label="Buscar funcionário"
      >
        <p className="text-sm font-semibold text-ink">Buscar funcionário(a)</p>
        <p className="mt-1 text-sm text-muted">Ainda não há funcionários cadastrados.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Buscar funcionário"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">
        Buscar e filtrar
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-12">
          <FilterDateRangeFields
            idPrefix="teacher-search"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            legend="Período (cadastro do funcionário)"
            className="md:max-w-xl"
          />
        </div>
        <div className="md:col-span-9">
          <label className={labelClass} htmlFor="teacher-search-q">
            Buscar
          </label>
          <input
            id="teacher-search-q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, apelido, função ou código…"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass} htmlFor="teacher-search-status">
            Situação
          </label>
          <select
            id="teacher-search-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <ExportExcelReportButton
          onExport={() =>
            downloadExcelSheets(buildExcelFilename("funcionarios"), [
              {
                sheetName: "Funcionários",
                headers: [
                  "ID",
                  "Código",
                  "Nome",
                  "Apelido",
                  "Função",
                  "Situação",
                  "Data nascimento",
                  "Telefone",
                  "E-mail",
                  "Documento",
                  "Especialidade / formação",
                  "Observações",
                  "URL da foto",
                  "Logradouro",
                  "Número",
                  "Complemento",
                  "Bairro",
                  "Cidade",
                  "UF",
                  "CEP",
                  "CTPS número",
                  "CTPS série",
                  "CTPS UF",
                  "Data admissão",
                  "Data demissão",
                  "Salário (BRL)",
                  "Forma pagamento salário",
                  "Dia pagamento salário",
                  "Criado em",
                  "Atualizado em",
                ],
                rows: filtered.map((t) => [
                  t.id,
                  t.employeeCode ?? "",
                  t.name,
                  t.nickname ?? "",
                  t.jobRole ?? "",
                  t.active ? "Ativo" : "Inativo",
                  t.birthDate ? formatDateBrFromIso(t.birthDate) : "—",
                  t.phone ?? "",
                  t.email ?? "",
                  t.document ?? "",
                  t.specialty ?? "",
                  t.notes ?? "",
                  t.photoUrl ?? "",
                  t.street ?? "",
                  t.number ?? "",
                  t.complement ?? "",
                  t.neighborhood ?? "",
                  t.city ?? "",
                  t.state ?? "",
                  t.zip ?? "",
                  t.workCardNumber ?? "",
                  t.workCardSeries ?? "",
                  t.workCardUf ?? "",
                  t.admissionDate ? formatDateBrFromIso(t.admissionDate) : "—",
                  t.dismissalDate ? formatDateBrFromIso(t.dismissalDate) : "—",
                  brlOrDash(t.salaryCents),
                  t.salaryPaymentMethod ?? "",
                  t.salaryPaymentDay != null ? String(t.salaryPaymentDay) : "—",
                  formatDateBrFromIso(t.createdAt),
                  formatDateBrFromIso(t.updatedAt),
                ]),
              },
            ])
          }
        />
      </div>

      {(searchQuery.trim() ||
        statusFilter !== "all" ||
        dateFrom.trim() ||
        dateTo.trim()) && (
        <p className="mt-2 text-xs text-muted">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      <ul
        className={`mt-4 space-y-2 pr-1 ${
          expandedFichaInList
            ? "max-h-none overflow-visible"
            : "max-h-[min(24rem,50vh)] overflow-y-auto"
        }`}
      >
        {filtered.map((t) => {
          const base = `/funcionarios/novo?funcionario=${encodeURIComponent(t.id)}`;
          const href =
            currentTeacherId === t.id && fichaPanelOpen
              ? base
              : `${base}&ficha=1&cadastro=1#identificacao`;
          const isSelected = currentTeacherId === t.id;
          const phoneLine = t.phone?.trim() || null;
          const waLink = phoneLine ? buildWhatsAppLink({ phone: phoneLine, text: "" }) : null;
          return (
            <li key={t.id} className="space-y-2">
              <Link
                href={href}
                scroll={false}
                className={`block rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "border-accent-border bg-accent-soft ring-2 ring-accent/25"
                    : "border-line bg-elevated hover:border-accent-border/60 hover:bg-elevated-2"
                }`}
              >
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <TeacherListRowAvatar name={t.name} photoUrl={t.photoUrl} />
                    <span className="min-w-0 font-medium text-ink">{t.name}</span>
                    {!t.active ? (
                      <span className="rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn-text">
                        Inativo
                      </span>
                    ) : null}
                  </span>
                  {phoneLine ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="tabular-nums text-subtle">{phoneLine}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (waLink) window.open(waLink, "_blank", "noopener,noreferrer");
                        }}
                        title="Abrir conversa no WhatsApp"
                        className="inline-flex items-center justify-center rounded-lg border border-line-soft bg-shell px-2 py-1 text-muted transition hover:bg-elevated-2"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t.jobRole ? <span className="block text-subtle">{t.jobRole}</span> : null}
                  <span className="mt-0.5 block">
                    {t.employeeCode ? (
                      <>
                        Código{" "}
                        <span className="tabular-nums text-subtle">{t.employeeCode}</span>
                      </>
                    ) : (
                      "Sem código de registro"
                    )}
                  </span>
                </span>
              </Link>
              {isSelected && belowSelectedFicha ? (
                <div className="mt-3 w-full min-w-0 sm:-mx-1 sm:px-1">{belowSelectedFicha}</div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {belowSelectedFicha && currentTeacherId && !selectedInFiltered ? (
        <div className="mt-4 w-full min-w-0">{belowSelectedFicha}</div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">
          Nenhum resultado para a busca ou filtros.
        </p>
      ) : null}
    </section>
  );
}
