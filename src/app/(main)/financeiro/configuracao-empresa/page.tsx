import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleGate } from "@/components/module-gate";
import { loadCompanySettingsForm } from "@/lib/company-settings";
import { getSession } from "@/lib/auth/session";
import { CompanySettingsForm } from "./company-settings-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracaoEmpresaPage() {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    redirect("/");
  }

  const initial = await loadCompanySettingsForm();

  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-4xl space-y-6 px-3 sm:px-4">
        <nav className="text-sm text-muted">
          <Link href="/financeiro" className="text-accent-muted underline decoration-dotted hover:text-accent">
            Financeiro
          </Link>
          <span className="text-subtle"> · </span>
          <span className="text-ink">Dados da empresa</span>
        </nav>

        <header>
          <h1 className="text-xl font-semibold text-ink">Configuração da empresa</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Cadastro central da unidade: identificação fiscal, endereço, conta bancária, PIX, parâmetros de
            boletos (inclusive remessa em lote) e políticas para pagamento de faturas e NF-e. Essas informações
            alimentam o financeiro, recibos e fluxos de cobrança; apenas administradores podem editar.
          </p>
        </header>

        <CompanySettingsForm initial={initial} />
      </div>
    </ModuleGate>
  );
}
