"use client";

import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { UserProfileRole } from "@/generated/prisma/enums";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { isMsInDateRange } from "@/lib/date-range-filter";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import Link from "next/link";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import { sendUserPasswordResetEmail } from "./actions";

export type UserPickerRow = {
  id: string;
  displayName: string;
  email: string;
  loginName: string;
  profileRole: UserProfileRole;
  active: boolean;
  twoFactorEnabled: boolean;
  phone: string | null;
  document: string | null;
  createdAt: string;
  updatedAt: string;
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

function haystackForUser(u: UserPickerRow): string {
  return [
    u.displayName,
    u.email,
    u.loginName,
    u.phone ?? "",
    u.document ?? "",
    ROLE_LABELS[u.profileRole],
    u.profileRole,
    u.active ? "ativo" : "inativo",
    u.twoFactorEnabled ? "2fa dois fatores autenticador" : "",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((t) => haystack.includes(t));
}

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserProfileRole[]).sort((a, b) =>
  ROLE_LABELS[a].localeCompare(ROLE_LABELS[b], "pt-BR"),
);

export type UserSearchPanelProps = {
  users: UserPickerRow[];
  currentUserId: string | null;
  belowSelectedFicha?: ReactNode | null;
  fichaPanelOpen?: boolean;
};

export function UserSearchPanel({
  users,
  currentUserId,
  belowSelectedFicha = null,
  fichaPanelOpen = false,
}: UserSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserProfileRole | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetForUserId, setResetForUserId] = useState<string | null>(null);
  const [pendingReset, startResetTransition] = useTransition();

  const selectedInList = useMemo(() => users.find((u) => u.id === currentUserId), [users, currentUserId]);

  const effectiveResetNotice = resetForUserId && resetForUserId === currentUserId ? resetNotice : null;
  const effectiveResetError = resetForUserId && resetForUserId === currentUserId ? resetError : null;

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "active" && !u.active) return false;
      if (statusFilter === "inactive" && u.active) return false;
      if (roleFilter && u.profileRole !== roleFilter) return false;
      const createdMs = new Date(u.createdAt).getTime();
      if (!isMsInDateRange(createdMs, dateFrom, dateTo)) return false;
      return matchesSearch(haystackForUser(u), tokens);
    });
  }, [users, statusFilter, roleFilter, tokens, dateFrom, dateTo]);

  const selectedInFiltered = useMemo(
    () => (currentUserId ? filtered.some((u) => u.id === currentUserId) : false),
    [filtered, currentUserId],
  );

  const expandedFichaInList =
    Boolean(belowSelectedFicha && currentUserId && selectedInFiltered);

  function limparFiltros() {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setResetNotice(null);
    setResetError(null);
    setResetForUserId(null);
  }

  function redefinirSenhaSelecionado() {
    if (!currentUserId) return;
    setResetNotice(null);
    setResetError(null);
    setResetForUserId(currentUserId);
    startResetTransition(() => {
      void (async () => {
        const r = await sendUserPasswordResetEmail(currentUserId);
        if (r.ok) {
          setResetNotice(r.message ?? "E-mail de redefinição enviado.");
        } else {
          setResetError(r.error ?? "Não foi possível enviar o e-mail.");
        }
      })();
    });
  }

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(roleFilter) ||
    statusFilter !== "all" ||
    Boolean(dateFrom.trim()) ||
    Boolean(dateTo.trim());

  if (users.length === 0) {
    return (
      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-label="Buscar usuário"
      >
        <p className="text-sm font-semibold text-ink">Buscar usuário</p>
        <p className="mt-1 text-sm text-muted">Ainda não há contas cadastradas no sistema.</p>
      </section>
    );
  }

  return (
    <section
      className="min-w-0 rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Buscar usuário"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Buscar e filtrar</p>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="min-w-0 md:col-span-12">
          <FilterDateRangeFields
            idPrefix="user-search"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            legend="Período (data de cadastro da conta)"
            className="md:max-w-xl"
          />
        </div>
        <div className="min-w-0 md:col-span-6">
          <label className={labelClass} htmlFor="user-search-q">
            Buscar
          </label>
          <input
            id="user-search-q"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, e-mail, usuário ou perfil…"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="min-w-0 md:col-span-4">
          <label className={labelClass} htmlFor="user-search-role">
            Perfil
          </label>
          <select
            id="user-search-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter((e.target.value || "") as UserProfileRole | "")}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Todos</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 md:col-span-2">
          <label className={labelClass} htmlFor="user-search-status">
            Situação
          </label>
          <select
            id="user-search-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={limparFiltros}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-elevated-2 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Limpar filtros
          </button>
          {currentUserId ? (
            <button
              type="button"
              onClick={redefinirSenhaSelecionado}
              disabled={pendingReset || !selectedInList?.active}
              title={
                !selectedInList?.active
                  ? "Ative a conta na ficha antes de enviar o link de senha."
                  : "Envia e-mail com link para redefinir a senha do usuário selecionado."
              }
              className="inline-flex items-center justify-center rounded-xl border border-accent-border bg-accent-soft px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingReset ? "Enviando…" : "Redefinir senha"}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExportExcelReportButton
            onExport={() =>
              downloadExcelSheets(buildExcelFilename("usuarios"), [
                {
                  sheetName: "Usuários",
                  headers: [
                    "ID",
                    "Nome",
                    "E-mail",
                    "Nome de usuário",
                    "Perfil",
                    "Conta ativa",
                    "2FA",
                    "Criado em",
                    "Atualizado em",
                  ],
                  rows: filtered.map((u) => [
                    u.id,
                    u.displayName,
                    u.email,
                    u.loginName,
                    ROLE_LABELS[u.profileRole],
                    u.active ? "Sim" : "Não",
                    u.twoFactorEnabled ? "Sim" : "Não",
                    formatDateBrFromIso(u.createdAt),
                    formatDateBrFromIso(u.updatedAt),
                  ]),
                },
              ])
            }
          />
        </div>
      </div>

      {effectiveResetNotice ? (
        <p className="mt-2 text-sm text-success-fg" role="status">
          {effectiveResetNotice}
        </p>
      ) : null}
      {effectiveResetError ? (
        <p className="mt-2 text-sm text-danger-text" role="alert">
          {effectiveResetError}
        </p>
      ) : null}

      {hasActiveFilters && (
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
        {filtered.map((u) => {
          const base = `/usuarios?usuario=${encodeURIComponent(u.id)}`;
          const href =
            currentUserId === u.id && fichaPanelOpen ? base : `${base}&ficha=1`;
          const isSelected = currentUserId === u.id;
          const waLink = u.phone
            ? buildWhatsAppLink({ phone: u.phone, text: "" })
            : null;
          return (
            <li key={u.id} className="space-y-2">
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
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{u.displayName}</span>
                  {!u.active ? (
                    <span className="rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn-text">
                      Inativa
                    </span>
                  ) : null}
                  {u.twoFactorEnabled ? (
                    <span className="rounded-full border border-line-soft bg-shell px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      2FA
                    </span>
                  ) : null}
                  </span>
                  {u.phone ? (
                    <span className="flex items-center justify-end gap-2 text-xs text-muted">
                      <span className="tabular-nums text-subtle">{u.phone}</span>
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
                  <span className="tabular-nums text-subtle">{u.email}</span>
                  {" · "}
                  <span className="text-subtle">@{u.loginName}</span>
                  {" · "}
                  {ROLE_LABELS[u.profileRole]}
                </span>
              </Link>
              {isSelected && belowSelectedFicha ? (
                <div className="mt-3 w-full min-w-0 sm:-mx-1 sm:px-1">{belowSelectedFicha}</div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {belowSelectedFicha && currentUserId && !selectedInFiltered ? (
        <div className="mt-4 w-full min-w-0">{belowSelectedFicha}</div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">Nenhum usuário corresponde à busca ou aos filtros.</p>
      ) : null}
    </section>
  );
}
