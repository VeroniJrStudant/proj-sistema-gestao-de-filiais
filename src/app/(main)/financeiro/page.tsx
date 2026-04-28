import { CadastroEdicaoCollapsible } from "@/components/cadastro-edicao-collapsible";
import { ModuleGate } from "@/components/module-gate";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AcceptedPaymentMethodsCard } from "./accepted-payment-methods-card";
import { ensureAcceptedPaymentMethodsSeeded } from "./ensure-accepted-payment-methods";
import { RecentFinancialRecords } from "./recent-financial-records";
import { StudentFinanceContractsPanel } from "./student-finance-contracts-panel";
import type { AcceptedMethodRow, ClassRoomOption, ShiftOption, StudentFinanceContractRow } from "./types";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string }>;
}) {
  const sp = await searchParams;
  const initialCadastroOpen = sp.cadastro === "1";
  const session = await getSession();
  const canConfigureCompany = session?.permissions.includes("users.manage") ?? false;

  await ensureAcceptedPaymentMethodsSeeded();

  const enrollmentYear = new Date().getFullYear();

  const [acceptedMethods, classRoomsData, pickerStudentRows, financialRows] = await Promise.all([
    prisma.acceptedSchoolPaymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.classRoom.findMany({
      where: { year: enrollmentYear, active: true },
      include: { shift: { select: { id: true, name: true } } },
      orderBy: [{ shift: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.student.findMany({
      select: {
        id: true,
        name: true,
        matricula: true,
        active: true,
        createdAt: true,
        tuitionPaymentMethod: true,
        yearStartInstallmentsPaid: true,
        madeEntryPayment: true,
        didacticMaterialsPlan: true,
        owedPreviousSchoolYears: true,
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrolledAt: "desc" },
          take: 1,
          select: {
            classRoom: {
              select: {
                id: true,
                name: true,
                room: true,
                shiftId: true,
                shift: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 800,
    }),
    prisma.financialRecord.findMany({
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const shiftOrder = new Map<string, string>();
  for (const r of classRoomsData) {
    if (!shiftOrder.has(r.shiftId)) {
      shiftOrder.set(r.shiftId, r.shift.name);
    }
  }
  const shifts: ShiftOption[] = [...shiftOrder.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const classRooms: ClassRoomOption[] = classRoomsData.map((r) => ({
    id: r.id,
    name: r.name,
    shiftId: r.shiftId,
    room: r.room,
  }));

  const studentFinanceRows: StudentFinanceContractRow[] = pickerStudentRows.map((s) => {
    const cr = s.enrollments[0]?.classRoom;
    const roomPart = cr?.room?.trim();
    const label =
      cr && roomPart ? `${cr.name.trim()} — ${roomPart}` : cr?.name.trim() ?? null;
    return {
      id: s.id,
      name: s.name.trim(),
      matricula: s.matricula?.trim() ?? null,
      active: s.active,
      createdAt: s.createdAt.toISOString(),
      shiftId: cr?.shiftId ?? null,
      shiftName: cr?.shift.name.trim() ?? null,
      classRoomId: cr?.id ?? null,
      classRoomLabel: label,
      tuitionPaymentMethod: s.tuitionPaymentMethod?.trim() || null,
      yearStartInstallmentsPaid: s.yearStartInstallmentsPaid ?? null,
      madeEntryPayment: s.madeEntryPayment ?? null,
      didacticMaterialsPlan: s.didacticMaterialsPlan?.trim() || null,
      owedPreviousSchoolYears: s.owedPreviousSchoolYears ?? null,
    };
  });

  const acceptedRows: AcceptedMethodRow[] = acceptedMethods.map((m) => ({
    id: m.id,
    code: m.code,
    active: m.active,
    sortOrder: m.sortOrder,
    notes: m.notes,
  }));

  const recentRows = financialRows.map((r) => ({
    id: r.id,
    kind: r.kind,
    direction: r.direction,
    amountCents: r.amountCents,
    description: r.description,
    status: r.status,
    dueDate: r.dueDate?.toISOString() ?? null,
    settledAt: r.settledAt?.toISOString() ?? null,
    externalRef: r.externalRef,
    studentName: r.student?.name?.trim() ?? null,
  }));

  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-6xl space-y-8 px-3 sm:px-4">
        <header>
          <h1 className="text-xl font-semibold text-ink">Financeiro</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Política de formas de pagamento, visão do contrato por aluno (mensalidade, entrada, material e débitos),
            entradas e saídas resumidas em duas áreas, e lançamentos recentes — apoio à secretaria e ao dia a dia.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canConfigureCompany ? (
            <Link
              href="/financeiro/configuracao-empresa"
              className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md sm:col-span-2 lg:col-span-3"
            >
              <h2 className="text-sm font-semibold text-ink">Dados da empresa</h2>
              <p className="mt-2 text-sm text-muted">
                CNPJ, endereço, conta bancária, PIX, convênio de boletos (inclusive remessa em lote) e regras para
                pagamento de faturas e NF-e — base para cobrança e integrações.
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
                Configurar →
              </span>
            </Link>
          ) : null}
          <Link
            href="/financeiro/entradas"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md sm:col-span-2 lg:col-span-2"
          >
            <h2 className="text-sm font-semibold text-ink">Entradas</h2>
            <p className="mt-2 text-sm text-muted">
              Mensalidades recebidas ou a cobrar, pagamentos para famílias (PIX, cartão, boleto, NF) e PIX impresso —
              agrupados em subpáginas.
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
              Abrir entradas →
            </span>
          </Link>
          <Link
            href="/financeiro/saidas"
            className="group rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm transition hover:border-accent-border hover:shadow-md lg:col-span-1"
          >
            <h2 className="text-sm font-semibold text-ink">Saídas</h2>
            <p className="mt-2 text-sm text-muted">
              Pagamentos a fornecedores, funcionários e favorecidos — hoje com lançamentos em lote.
            </p>
            <span className="mt-3 inline-block text-xs font-medium text-accent-muted group-hover:underline">
              Abrir saídas →
            </span>
          </Link>
        </section>

        <CadastroEdicaoCollapsible
          initialOpen={initialCadastroOpen}
          showLabel="Cadastrar ou editar política de recebimento"
          className="!mt-0"
        >
          <AcceptedPaymentMethodsCard initial={acceptedRows} embedded />
        </CadastroEdicaoCollapsible>

        <StudentFinanceContractsPanel
          students={studentFinanceRows}
          shifts={shifts}
          classRooms={classRooms}
        />

        <RecentFinancialRecords rows={recentRows} />
      </div>
    </ModuleGate>
  );
}
