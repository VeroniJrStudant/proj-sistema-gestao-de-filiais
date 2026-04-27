"use client";

import Link from "next/link";
import { useState } from "react";

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

type Props = {
  needsBootstrap: boolean;
};

export function RecoverForm({ needsBootstrap }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = (await res.json()) as { error?: string; message?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o pedido.");
        return;
      }
      setMessage(
        data.message ??
          "Se existir uma conta para os dados informados, enviamos um e-mail com o link para redefinir a senha.",
      );
      setIdentifier("");
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (needsBootstrap) {
    return (
      <p className="text-sm text-muted">
        Ainda não há usuários cadastrados.{" "}
        <Link href="/primeiro-acesso" className="font-medium text-accent-muted hover:underline">
          Configure o primeiro administrador
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-success-border bg-success-bg px-3 py-2 text-sm text-success-fg">
          {message}
        </p>
      ) : null}
      <Field
        id="identifier"
        label="E-mail ou nome de usuário"
        name="identifier"
        autoComplete="username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <p className="text-xs text-subtle">
        Enviaremos o link para o <strong>e-mail cadastrado</strong> na conta (por privacidade, a mensagem de sucesso é a
        mesma mesmo se não encontrarmos o usuário).
      </p>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar link por e-mail"}
      </button>
    </form>
  );
}
