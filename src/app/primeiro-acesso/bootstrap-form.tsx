"use client";

import { useActionState } from "react";
import Link from "next/link";
import { bootstrapFirstAdmin, type BootstrapResult } from "./actions";

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

export function BootstrapForm() {
  const [state, formAction, pending] = useActionState(bootstrapFirstAdmin, null);

  if (state?.ok && state.twoFactor) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(state.twoFactor.otpauthUrl)}`;
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          Conta criada. Escaneie o QR no aplicativo autenticador (Google Authenticator, 1Password, etc.) ou digite a chave
          manualmente.
        </p>
        <img src={qr} alt="QR code do autenticador" className="mx-auto rounded-lg border border-line bg-white p-2" />
        <p className="break-all font-mono text-xs text-subtle">{state.twoFactor.secret}</p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      ) : null}
      <Field id="displayName" name="displayName" label="Nome completo" autoComplete="name" required />
      <Field id="email" name="email" type="email" label="E-mail" autoComplete="email" required />
      <Field
        id="loginName"
        name="loginName"
        label="Nome de usuário (login alternativo)"
        autoComplete="username"
        required
      />
      <Field id="password" name="password" type="password" label="Senha" autoComplete="new-password" required />
      <Field
        id="password2"
        name="password2"
        type="password"
        label="Confirmar senha"
        autoComplete="new-password"
        required
      />
      <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
        <input type="checkbox" name="enable2fa" className="mt-1 rounded border-line text-accent" />
        <span>Ativar autenticação em dois fatores (TOTP) já neste administrador</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Criar administrador"}
      </button>
    </form>
  );
}
