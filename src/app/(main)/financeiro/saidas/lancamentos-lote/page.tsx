import { ModuleGate } from "@/components/module-gate";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BatchPaymentsForm } from "./batch-payments-form";

export default async function LancamentosLotePage() {
  const [suppliers, teachers] = await Promise.all([
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tradeName: true,
        supplierCode: true,
        document: true,
        phone: true,
        email: true,
      },
      take: 1200,
    }),
    prisma.teacher.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        nickname: true,
        jobRole: true,
        phone: true,
        email: true,
        document: true,
      },
      take: 1200,
    }),
  ]);

  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6 px-3 sm:px-4">
        <nav className="text-sm text-muted">
          <Link href="/financeiro" className="text-accent-muted underline decoration-dotted hover:text-accent">
            Financeiro
          </Link>
          <span className="text-subtle"> · </span>
          <Link href="/financeiro/saidas" className="text-accent-muted underline decoration-dotted hover:text-accent">
            Saídas
          </Link>
          <span className="text-subtle"> · </span>
          <span className="text-ink">Lançamentos em lote</span>
        </nav>

        <header className="rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Contas a pagar</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Lançamentos em lote</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            Registre vários pagamentos de uma vez (fornecedores, funcionários ou outros favorecidos). Inclua código de
            barras ou linha digitável e o documento de referência quando existir. Para depósito em lote de salários,
            use a opção “Todos os funcionários” para gerar um lançamento por funcionário ativo com o mesmo valor.
          </p>
        </header>

        <BatchPaymentsForm suppliers={suppliers} teachers={teachers} />
      </div>
    </ModuleGate>
  );
}
