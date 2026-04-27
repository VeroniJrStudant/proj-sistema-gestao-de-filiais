import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const count = await prisma.userAccount.count();
  const needsBootstrap = count === 0;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-shell p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/95 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Use seu e-mail ou nome de usuário. Se a conta tiver 2FA, você informará o código na sequência.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
            <LoginForm needsBootstrap={needsBootstrap} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          Acesso protegido com JWT em cookie httpOnly (7 dias nesta versão). Em produção, defina{" "}
          <code className="rounded bg-accent-soft px-1 py-0.5 text-[0.7rem] text-ink ring-1 ring-line-soft">
            AUTH_SECRET
          </code>{" "}
          com pelo menos 32 caracteres.
        </p>
        {!needsBootstrap ? (
          <p className="mt-3 text-center text-xs text-subtle">
            <Link href="/primeiro-acesso" className="text-muted hover:underline">
              Primeiro acesso
            </Link>{" "}
            só fica disponível enquanto não houver usuários.
          </p>
        ) : null}
      </div>
    </div>
  );
}
