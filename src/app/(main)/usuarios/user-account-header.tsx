"use client";

import { UserProfileRole } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import Link from "next/link";
import { UserRowActions } from "./user-row-actions";

export type UserAccountHeaderSelected = {
  id: string;
  displayName: string;
  email: string;
  loginName: string;
  profileRole: UserProfileRole;
  active: boolean;
  twoFactorEnabled: boolean;
};

export function UserAccountHeader({
  selected,
  sessionUserId,
}: {
  selected: UserAccountHeaderSelected | null;
  sessionUserId: string;
}) {
  const initial = selected?.displayName?.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="relative w-full max-w-none min-w-0 overflow-hidden rounded-2xl border border-line bg-elevated-2 px-4 py-5 shadow-sm sm:px-8 sm:py-8">
      <div className="relative flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-12">
        <div className="min-w-0 w-full flex-1">
          <div
            className="w-full min-w-0 rounded-xl border border-accent-border/60 bg-accent-soft/50 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
            aria-label="Ficha do usuário"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Ficha do usuário</p>
            <div className="mt-3 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-x-6 sm:gap-y-4">
              <div className="min-w-0 sm:col-span-4 lg:col-span-3">
                <span className="text-xs font-medium text-muted">Nome de usuário</span>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-xl px-2.5 py-1.5 text-center text-sm font-bold tabular-nums leading-tight break-all shadow-sm ${
                      selected?.loginName
                        ? "bg-accent text-on-accent"
                        : "border border-line bg-elevated-2 text-muted"
                    }`}
                    title={selected?.loginName ? `@${selected.loginName}` : undefined}
                  >
                    {selected?.loginName ? `@${selected.loginName}` : "—"}
                  </span>
                  {!selected?.loginName ? (
                    <span className="min-w-0 text-sm font-medium leading-snug text-subtle">
                      Selecione alguém na lista
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 border-t border-line-soft pt-4 sm:col-span-8 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0 lg:col-span-9">
                <span className="text-xs font-medium text-muted">Nome de exibição</span>
                <p
                  className={`mt-1 break-words text-lg font-semibold leading-snug tracking-tight sm:text-xl ${
                    selected?.displayName ? "text-ink" : "text-subtle"
                  }`}
                >
                  {selected?.displayName ?? "Selecione um usuário na lista ao lado"}
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 border-t border-line-soft pt-4 min-[420px]:grid-cols-2 sm:col-span-12 sm:grid-cols-3 sm:border-t sm:pt-4">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted">E-mail</span>
                  <p
                    className={`mt-1 break-words text-sm font-semibold leading-snug sm:text-base ${
                      selected?.email ? "text-ink" : "text-subtle"
                    }`}
                  >
                    {selected?.email ?? "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted">Perfil</span>
                  <p className={`mt-1 text-sm font-semibold sm:text-base ${selected ? "text-ink" : "text-subtle"}`}>
                    {selected ? ROLE_LABELS[selected.profileRole] : "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted">Conta e 2FA</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selected ? (
                      <>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            selected.active
                              ? "border border-success-border bg-success-bg text-success-fg"
                              : "border border-warn-border bg-warn-bg text-warn-text"
                          }`}
                        >
                          {selected.active ? "Ativa" : "Inativa"}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            selected.twoFactorEnabled
                              ? "border border-line-soft bg-elevated text-ink"
                              : "border border-line-soft bg-elevated-2 text-muted"
                          }`}
                        >
                          {selected.twoFactorEnabled ? "2FA ativo" : "Sem 2FA"}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-subtle">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selected ? (
            <div
              className="mt-4 rounded-xl border border-line-soft bg-shell/60 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
              aria-label="Ações do usuário"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ações</p>
              <div className="mt-3">
                <UserRowActions
                  userId={selected.id}
                  active={selected.active}
                  isCurrentUser={selected.id === sessionUserId}
                  layout="header"
                />
              </div>
            </div>
          ) : null}

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Usuários e permissões</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Busque e filtre contas pelo período de cadastro, perfil e situação. Selecione um usuário para ver a ficha,
            redefinir senha por e-mail ou ativar/inativar. No bloco &quot;Cadastrar ou editar&quot; você salva alterações
            de dados e permissões ou cadastra uma nova conta.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Permissões por perfil</li>
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">JWT e 2FA opcional</li>
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Redefinição de senha por e-mail</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/usuarios?cadastro=1&ficha=1"
              className="inline-flex items-center justify-center rounded-xl border border-accent-border bg-accent-soft px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80"
            >
              Abrir cadastro de novo usuário
            </Link>
            {selected ? (
              <Link
                href="/usuarios"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-elevated-2"
              >
                Limpar seleção
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col items-stretch gap-5 border-t border-line-soft pt-5 sm:ml-0 sm:w-auto sm:max-w-[12.5rem] sm:border-t-0 sm:pt-0 sm:items-center sm:self-start">
          <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-2">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted">Conta</p>
            <div
              className={`mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm ring-2 ring-offset-2 ring-offset-elevated-2 min-[380px]:h-28 min-[380px]:w-28 sm:h-[104px] sm:w-[104px] ${
                selected ? "bg-accent text-on-accent ring-accent/35" : "bg-elevated text-subtle ring-line"
              }`}
              aria-hidden
            >
              {initial}
            </div>
            <p className="max-w-[12rem] text-center text-[10px] leading-snug text-subtle">
              {selected ? "Iniciais do nome de exibição" : "Selecione um usuário na lista"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
