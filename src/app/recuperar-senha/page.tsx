import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RecoverForm } from "./recover-form";

export const dynamic = "force-dynamic";

export default async function RecuperarSenhaPage() {
  const count = await prisma.userAccount.count();
  const needsBootstrap = count === 0;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-shell p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/95 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted">
          Informe o mesmo e-mail ou usuário que você usa no login. Se a conta existir, você receberá um link válido por 1
          hora para criar uma nova senha.
        </p>
        <div className="mt-8">
          <RecoverForm needsBootstrap={needsBootstrap} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent-muted hover:underline">
            Voltar ao login
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-subtle">
          Em produção configure SMTP (<code className="rounded bg-accent-soft px-1 py-0.5 text-[0.7rem]">SMTP_HOST</code>
          , <code className="rounded bg-accent-soft px-1 py-0.5 text-[0.7rem]">SMTP_USER</code>,{" "}
          <code className="rounded bg-accent-soft px-1 py-0.5 text-[0.7rem]">SMTP_PASSWORD</code>) e{" "}
          <code className="rounded bg-accent-soft px-1 py-0.5 text-[0.7rem]">APP_BASE_URL</code> para o link do e-mail.
        </p>
      </div>
    </div>
  );
}
