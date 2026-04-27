"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendUserPasswordResetEmail, setUserAccountActive } from "./actions";

export function UserRowActions({
  userId,
  active,
  isCurrentUser,
  layout = "compact",
}: {
  userId: string;
  active: boolean;
  isCurrentUser: boolean;
  layout?: "compact" | "header";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setNotice(null);
    setError(null);
    startTransition(() => {
      void (async () => {
        const r = await action();
        if (r.ok) {
          setNotice(r.message ?? "Concluído.");
          router.refresh();
        } else {
          setError(r.error ?? "Falha na operação.");
        }
      })();
    });
  }

  const btnOutline =
    layout === "header"
      ? "rounded-xl border border-line bg-elevated-2 px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      : "rounded-md border border-line bg-elevated-2 px-2 py-1 text-xs font-medium text-ink hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50";
  const btnCaution =
    layout === "header"
      ? "rounded-xl border border-caution-border bg-caution-soft px-4 py-2.5 text-sm font-semibold text-caution shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      : "rounded-md border border-caution-border bg-caution-soft px-2 py-1 text-xs font-medium text-caution hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
  const btnSuccess =
    layout === "header"
      ? "rounded-xl border border-success-border bg-success-bg px-4 py-2.5 text-sm font-semibold text-success-fg shadow-sm transition hover:opacity-90 disabled:opacity-50"
      : "rounded-md border border-success-border bg-success-bg px-2 py-1 text-xs font-medium text-success-fg hover:opacity-90 disabled:opacity-50";

  return (
    <div className="space-y-2">
      {notice ? (
        <p className={`text-success-fg ${layout === "header" ? "text-sm" : "text-xs"}`}>{notice}</p>
      ) : null}
      {error ? (
        <p className={`text-danger-text ${layout === "header" ? "text-sm" : "text-xs"}`}>{error}</p>
      ) : null}
      <div className={`flex flex-wrap ${layout === "header" ? "gap-2" : "gap-1.5"}`}>
        <button
          type="button"
          disabled={pending || !active}
          title={!active ? "Ative a conta para enviar o link de senha." : undefined}
          onClick={() => run(() => sendUserPasswordResetEmail(userId))}
          className={btnOutline}
        >
          Redefinir senha (e-mail)
        </button>
        {active ? (
          <button
            type="button"
            disabled={pending || isCurrentUser}
            title={isCurrentUser ? "Você não pode inativar a própria conta." : undefined}
            onClick={() => run(() => setUserAccountActive(userId, false))}
            className={btnCaution}
          >
            Inativar
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setUserAccountActive(userId, true))}
            className={btnSuccess}
          >
            Ativar
          </button>
        )}
      </div>
    </div>
  );
}
