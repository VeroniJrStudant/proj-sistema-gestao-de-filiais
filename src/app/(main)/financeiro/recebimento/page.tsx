import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { ModuleGate } from "@/components/module-gate";
import {
  resolveTeacherEmployeeCode,
  type FinanceClassRoomOption,
  type FinanceEmployeeSearchRow,
  type FinanceShiftOption,
  type FinanceStudentSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ensureAcceptedPaymentMethodsSeeded } from "../ensure-accepted-payment-methods";
import { TuitionReceiptForm } from "./tuition-receipt-form";

const labelByCode = new Map<string, string>(
  TUITION_PAYMENT_OPTIONS.map((o) => [o.value, o.label]),
);

export default async function RecebimentoMensalidadesPage() {
  await ensureAcceptedPaymentMethodsSeeded();

  const enrollmentYear = new Date().getFullYear();

  const [methods, studentsRaw, shiftsRaw, classRoomsRaw, teachersRaw, suppliersRaw] = await Promise.all([
    prisma.acceptedSchoolPaymentMethod.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.student.findMany({
      orderBy: { name: "asc" },
      take: 1500,
      select: {
        id: true,
        name: true,
        matricula: true,
        active: true,
        tuitionMonthlyAmountCents: true,
        guardians: {
          select: {
            relation: true,
            guardian: {
              select: { name: true, phone: true, email: true, document: true },
            },
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { enrolledAt: "desc" },
          select: {
            classRoom: {
              select: {
                id: true,
                name: true,
                room: true,
                teacherName: true,
                shiftId: true,
                shift: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.shift.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.classRoom.findMany({
      where: { year: enrollmentYear, active: true },
      select: { id: true, name: true, shiftId: true, room: true },
      orderBy: [{ shift: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.teacher.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        employeeCode: true,
        phone: true,
        email: true,
        document: true,
        jobRole: true,
      },
    }),
    prisma.supplier.findMany({
      where: { active: true },
      take: 800,
      select: {
        id: true,
        supplierCode: true,
        name: true,
        tradeName: true,
        document: true,
        phone: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeMethods = methods.map((m) => ({
    code: m.code,
    label: labelByCode.get(m.code) ?? m.code,
  }));

  const studentRows: FinanceStudentSearchRow[] = studentsRaw.map((s) => {
    const cr = s.enrollments[0]?.classRoom;
    const roomPart = cr?.room?.trim();
    const label =
      cr && roomPart ? `${cr.name.trim()} — ${roomPart}` : cr?.name.trim() ?? null;
    return {
      id: s.id,
      name: s.name.trim(),
      matricula: s.matricula?.trim() ?? null,
      active: s.active,
      shiftId: cr?.shiftId ?? null,
      shiftName: cr?.shift.name.trim() ?? null,
      classRoomId: cr?.id ?? null,
      classRoomLabel: label,
      teacherName: cr?.teacherName?.trim() ?? null,
      teacherEmployeeCode: resolveTeacherEmployeeCode(cr?.teacherName ?? null, teachersRaw),
      guardians: s.guardians.map((sg) => ({
        name: sg.guardian.name.trim(),
        relation: sg.relation?.trim() ?? null,
        phone: sg.guardian.phone?.trim() ?? null,
        email: sg.guardian.email?.trim() ?? null,
        document: sg.guardian.document?.trim() ?? null,
      })),
      tuitionMonthlyAmountCents: s.tuitionMonthlyAmountCents,
    };
  });

  const shifts: FinanceShiftOption[] = shiftsRaw.map((x) => ({
    id: x.id,
    name: x.name.trim(),
  }));

  const classRooms: FinanceClassRoomOption[] = classRoomsRaw.map((c) => ({
    id: c.id,
    name: c.name.trim(),
    shiftId: c.shiftId,
    room: c.room?.trim() ?? null,
  }));

  const supplierRows: FinanceSupplierSearchRow[] = suppliersRaw.map((x) => ({
    id: x.id,
    supplierCode: x.supplierCode?.trim() ?? null,
    name: x.name.trim(),
    tradeName: x.tradeName?.trim() ?? null,
    document: x.document?.trim() ?? null,
    phone: x.phone?.trim() ?? null,
    email: x.email?.trim() ?? null,
  }));

  const employeeRows: FinanceEmployeeSearchRow[] = teachersRaw.map((t) => ({
    id: t.id,
    name: t.name.trim(),
    nickname: t.nickname?.trim() ?? null,
    employeeCode: t.employeeCode?.trim() ?? null,
    phone: t.phone?.trim() ?? null,
    email: t.email?.trim() ?? null,
    document: t.document?.trim() ?? null,
    jobRole: t.jobRole?.trim() ?? null,
  }));

  return (
    <ModuleGate id="finance">
      <div className="mx-auto min-w-0 max-w-4xl space-y-6 px-3 sm:px-4">
        <nav className="text-sm text-muted">
          <Link href="/financeiro" className="text-accent-muted underline decoration-dotted hover:text-accent">
            Financeiro
          </Link>
          <span className="text-subtle"> · </span>
          <span className="text-ink">Recebimento de mensalidades</span>
        </nav>

        <header>
          <h1 className="text-xl font-semibold text-ink">Recebimento de mensalidades</h1>
          <p className="mt-1 text-sm text-muted">
            Registre pagamentos recebidos (PIX, cartão, dinheiro, transferência etc.) ou cadastre um{" "}
            boleto em aberto com vencimento e dados da cobrança (linha digitável, nosso número, banco). As
            formas disponíveis seguem a mesma política configurada em Financeiro → formas de pagamento
            aderidas. Não há integração bancária: o boleto é registrado para controle interno e
            aparece nos lançamentos recentes e no painel.
          </p>
        </header>

        {activeMethods.length === 0 ? (
          <p className="rounded-xl border border-caution-soft bg-caution-soft/30 px-4 py-3 text-sm text-ink">
            Nenhuma forma de pagamento está ativa. Abra{" "}
            <Link href="/financeiro?cadastro=1" className="font-medium underline decoration-dotted">
              Financeiro → Cadastrar ou editar política de recebimento
            </Link>{" "}
            e ative ao menos uma opção.
          </p>
        ) : (
          <TuitionReceiptForm
            rows={studentRows}
            shifts={shifts}
            classRooms={classRooms}
            suppliers={supplierRows}
            employees={employeeRows}
            activeMethods={activeMethods}
          />
        )}
      </div>
    </ModuleGate>
  );
}
