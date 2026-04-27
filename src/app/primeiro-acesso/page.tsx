import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BootstrapForm } from "./bootstrap-form";

export const dynamic = "force-dynamic";

export default async function PrimeiroAcessoPage() {
  const count = await prisma.userAccount.count();
  if (count > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-shell p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/95 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Primeiro acesso</h1>
        <p className="mt-2 text-sm text-muted">
          Crie o administrador inicial do sistema. Depois você poderá cadastrar demais perfis em{" "}
          <span className="font-medium text-ink">Usuários</span>.
        </p>
        <div className="mt-8">
          <BootstrapForm />
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          Já possui conta?{" "}
          <Link href="/login" className="font-medium text-accent-muted hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
