"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfileRole } from "@/generated/prisma/enums";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_POOL,
  PERMISSION_REGISTRY,
  ROLE_LABELS,
  isPermissionId,
  sanitizePermissionsForRole,
  type PermissionId,
} from "@/lib/auth/permissions";
import { updateUserAccount, type UpdateUserResult } from "./actions";

export type UserEditInitial = {
  id: string;
  displayName: string;
  email: string;
  loginName: string;
  profileRole: UserProfileRole;
  phone: string;
  document: string;
  permissionsJson: string;
  /** ISO — usado em `key` para remontar o formulário após `refresh()`. */
  updatedAt: string;
};

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

function parseStoredPermissions(raw: string): PermissionId[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is PermissionId => typeof x === "string" && isPermissionId(x));
  } catch {
    return [];
  }
}

export function UsersEditForm({ user }: { user: UserEditInitial }) {
  const router = useRouter();
  const [role, setRole] = useState<UserProfileRole>(user.profileRole);
  const [state, formAction, pending] = useActionState(updateUserAccount, null);

  const pool = PERMISSION_POOL[role];
  const [selected, setSelected] = useState<Set<PermissionId>>(() => {
    const parsed = parseStoredPermissions(user.permissionsJson);
    return new Set(
      sanitizePermissionsForRole(
        user.profileRole,
        parsed.length ? parsed : [...DEFAULT_PERMISSIONS_BY_ROLE[user.profileRole]],
      ),
    );
  });

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

  return (
    <div className="rounded-2xl border border-line bg-panel/90 p-6">
      <p className="text-sm font-medium text-ink">
        Editando: <span className="text-muted">{user.displayName}</span>
      </p>
      <p className="mt-1 text-xs text-subtle">
        Altere dados e permissões e clique em salvar. A senha continua a mesma; use &quot;Redefinir senha (e-mail)&quot; na
        ficha para trocar.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="userId" value={user.id} />
        <EditResultBanner state={state} />
        <Field
          id="edit-displayName"
          name="displayName"
          label="Nome de exibição"
          required
          defaultValue={user.displayName}
        />
        <Field id="edit-email" name="email" type="email" label="E-mail" required defaultValue={user.email} />
        <Field
          id="edit-loginName"
          name="loginName"
          label="Nome de usuário"
          autoComplete="username"
          required
          defaultValue={user.loginName}
        />
        <Field
          id="edit-phone"
          name="phone"
          label="Telefone"
          placeholder="(11) 99999-9999"
          defaultValue={user.phone}
        />
        <Field
          id="edit-document"
          name="document"
          label="CPF/Documento"
          placeholder="000.000.000-00"
          defaultValue={user.document}
        />
        <div className="space-y-1.5">
          <label htmlFor="edit-profileRole" className="block text-sm font-medium text-ink">
            Perfil
          </label>
          <select
            id="edit-profileRole"
            name="profileRole"
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as UserProfileRole;
              setRole(nextRole);
              setSelected((prev) =>
                new Set(
                  sanitizePermissionsForRole(
                    nextRole,
                    prev.size ? [...prev] : [...DEFAULT_PERMISSIONS_BY_ROLE[nextRole]],
                  ),
                ),
              );
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
        <fieldset className="space-y-3 rounded-xl border border-line-soft bg-elevated/40 p-4">
          <legend className="px-1 text-sm font-medium text-ink">Permissões</legend>
          <ul className="space-y-2">
            {visiblePermissions.map((p) => (
              <li key={p.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.id}
                  id={`edit-perm-${p.id}`}
                  checked={selected.has(p.id as PermissionId)}
                  onChange={() => togglePermission(p.id as PermissionId)}
                  className="mt-0.5 rounded border-line text-accent"
                />
                <label htmlFor={`edit-perm-${p.id}`} className="cursor-pointer text-muted">
                  <span className="font-medium text-ink">{p.label}</span>
                  <span className="block text-xs text-subtle">{p.description}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}

function EditResultBanner({ state }: { state: UpdateUserResult }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p className="rounded-lg border border-success-border bg-success-bg px-3 py-2 text-sm text-success-fg">
        Alterações salvas com sucesso.
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
      {state.error}
    </p>
  );
}
