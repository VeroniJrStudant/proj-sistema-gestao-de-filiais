import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token.trim() : "";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-shell p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/95 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Nova senha</h1>
        <p className="mt-2 text-sm text-muted">Defina uma senha forte com ao menos 8 caracteres.</p>
        <div className="mt-8">
          {token.length >= 20 ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4 text-sm text-muted">
              <p>Este link é inválido ou está incompleto. Abra o endereço completo que veio no e-mail ou peça um novo.</p>
              <Link
                href="/recuperar-senha"
                className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
              >
                Solicitar novo link
              </Link>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent-muted hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
