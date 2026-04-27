"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfileRole } from "@/generated/prisma/enums";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_POOL,
  PERMISSION_REGISTRY,
  ROLE_LABELS,
  type PermissionId,
} from "@/lib/auth/permissions";
import { createUserAccount, type CreateUserResult } from "./actions";

function Field({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-inner outline-none ring-accent/30 placeholder:text-subtle focus:border-accent-border focus:ring-2"
        {...props}
      />
    </div>
  );
}

export function UsersCreateForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserProfileRole>(UserProfileRole.TEACHER);
  const [state, formAction, pending] = useActionState(createUserAccount, null);

  const pool = PERMISSION_POOL[role];
  const defaults = DEFAULT_PERMISSIONS_BY_ROLE[role];
  const [selected, setSelected] = useState<Set<PermissionId>>(() => new Set(defaults));

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state]);

  const visiblePermissions = useMemo(
    () => PERMISSION_REGISTRY.filter((p) => pool.includes(p.id as PermissionId)),
    [pool],
  );

  function togglePermission(id: PermissionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (state?.ok && state.twoFactor) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(state.twoFactor.otpauthUrl)}`;
    return (
      <div className="rounded-2xl border border-line bg-panel/90 p-6">
        <h2 className="text-lg font-semibold text-ink">2FA configurado</h2>
        <p className="mt-2 text-sm text-muted">
          Entregue o QR ou a chave ao usuário uma única vez. Ele precisará do aplicativo autenticador no próximo login.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <img src={qr} alt="QR do autenticador" className="rounded-lg border border-line bg-white p-2" />
          <p className="break-all font-mono text-xs text-subtle">{state.twoFactor.secret}</p>
        </div>
        <button
          type="button"
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          onClick={() => router.refresh()}
        >
          Concluir
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel/90 p-6">
      <form action={formAction} className="space-y-4">
        <ResultBanner state={state} />
        <Field id="displayName" name="displayName" label="Nome de exibição" required />
        <Field id="email" name="email" type="email" label="E-mail" required />
        <Field id="loginName" name="loginName" label="Nome de usuário" autoComplete="username" required />
        <Field id="phone" name="phone" label="Telefone" placeholder="(11) 99999-9999" />
        <Field id="document" name="document" label="CPF/Documento" placeholder="000.000.000-00" />
        <div className="space-y-1.5">
          <label htmlFor="profileRole" className="block text-sm font-medium text-ink">
            Perfil
          </label>
          <select
            id="profileRole"
            name="profileRole"
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as UserProfileRole;
              setRole(nextRole);
              setSelected(new Set(DEFAULT_PERMISSIONS_BY_ROLE[nextRole]));
            }}
            className="w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent-border focus:ring-2 focus:ring-accent/30"
          >
            {(Object.keys(ROLE_LABELS) as UserProfileRole[]).map((key) => (
              <option key={key} value={key}>
                {ROLE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <Field id="password" name="password" type="password" label="Senha" autoComplete="new-password" required />
        <Field
          id="password2"
          name="password2"
          type="password"
          label="Confirmar senha"
          autoComplete="new-password"
          required
        />
        <fieldset className="space-y-3 rounded-xl border border-line-soft bg-elevated/40 p-4">
          <legend className="px-1 text-sm font-medium text-ink">Permissões</legend>
          <ul className="space-y-2">
            {visiblePermissions.map((p) => (
              <li key={p.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.id}
                  id={`perm-${p.id}`}
                  checked={selected.has(p.id as PermissionId)}
                  onChange={() => togglePermission(p.id as PermissionId)}
                  className="mt-0.5 rounded border-line text-accent"
                />
                <label htmlFor={`perm-${p.id}`} className="cursor-pointer text-muted">
                  <span className="font-medium text-ink">{p.label}</span>
                  <span className="block text-xs text-subtle">{p.description}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
          <input type="checkbox" name="enable2fa" className="mt-1 rounded border-line text-accent" />
          <span>Exigir autenticação em dois fatores (TOTP) — o QR/chave será mostrado após salvar</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Cadastrar usuário"}
        </button>
      </form>
    </div>
  );
}

function ResultBanner({ state }: { state: CreateUserResult }) {
  if (!state) return null;
  if (state.ok) return null;
  return (
    <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
      {state.error}
    </p>
  );
}
