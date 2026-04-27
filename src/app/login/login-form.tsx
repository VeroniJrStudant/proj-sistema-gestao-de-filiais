"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";

type Props = {
  needsBootstrap: boolean;
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

export function LoginForm({ needsBootstrap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const senhaOk = searchParams.get("senha_ok");
  const inativo = searchParams.get("inativo");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFlow = useCallback(() => {
    setPendingToken(null);
    setCode("");
    setError(null);
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsTwoFactor?: boolean;
        pendingToken?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      if (data.needsTwoFactor && data.pendingToken) {
        setPendingToken(data.pendingToken);
        return;
      }
      if (data.ok) {
        router.replace(from.startsWith("/") ? from : "/");
        router.refresh();
      }
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function on2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Código inválido.");
        return;
      }
      if (data.ok) {
        router.replace(from.startsWith("/") ? from : "/");
        router.refresh();
      }
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const criado = searchParams.get("criado");

  return (
    <div className="space-y-6">
      {criado ? (
        <p className="rounded-lg border border-success-border bg-success-bg px-3 py-2 text-sm text-success-fg">
          Conta criada. Faça login com o e-mail ou usuário cadastrados.
        </p>
      ) : null}
      {senhaOk ? (
        <p className="rounded-lg border border-success-border bg-success-bg px-3 py-2 text-sm text-success-fg">
          Senha redefinida com sucesso. Entre com a nova senha.
        </p>
      ) : null}
      {inativo ? (
        <p className="rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-sm text-warn-text">
          Sua sessão foi encerrada porque a conta foi desativada. Se isso foi um engano, peça a um administrador para
          reativar o seu usuário.
        </p>
      ) : null}
      {needsBootstrap ? (
        <p className="rounded-lg border border-caution-border bg-caution-soft px-3 py-2 text-sm text-caution">
          Nenhum usuário cadastrado. Comece pelo primeiro acesso para criar o administrador.
        </p>
      ) : null}

      {!pendingToken ? (
        <form onSubmit={onLogin} className="space-y-4">
          {error ? (
            <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {error}
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
          <Field
            id="password"
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          {!needsBootstrap ? (
            <p className="text-center text-sm">
              <Link href="/recuperar-senha" className="text-accent-muted hover:underline">
                Esqueci minha senha
              </Link>
            </p>
          ) : null}
        </form>
      ) : (
        <form onSubmit={on2fa} className="space-y-4">
          <p className="text-sm text-muted">
            Digite o código de 6 dígitos do seu aplicativo autenticador.
          </p>
          {error ? (
            <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {error}
            </p>
          ) : null}
          <Field
            id="code"
            label="Código"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6,8}"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetFlow}
              className="flex-1 rounded-lg border border-line bg-elevated-2 px-4 py-2.5 text-sm font-medium text-ink hover:bg-elevated"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Verificando…" : "Confirmar"}
            </button>
          </div>
        </form>
      )}

      {needsBootstrap ? (
        <p className="text-center text-sm text-muted">
          <Link href="/primeiro-acesso" className="font-medium text-accent-muted hover:underline">
            Configurar primeiro administrador
          </Link>
        </p>
      ) : null}
    </div>
  );
}
