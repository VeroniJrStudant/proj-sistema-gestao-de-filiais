import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  AttendanceStatus,
  CameraStatus,
  CategoryScope,
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
  PrismaClient,
} from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { DEFAULT_PERMISSIONS_BY_ROLE, sanitizePermissionsForRole } from "../src/lib/auth/permissions";
import {
  buildInventoryItemsForSeed,
  JOB_ROLES,
  randomGuardianCreate,
  randomStudentCreateInput,
  randomSupplierRow,
  randomTeacherRow,
  randInt,
} from "../src/lib/dev/seed-random-fixtures";
import { SEED_TEST_USER_DEFS } from "../src/lib/dev/seed-test-users";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/gestao-filiais-dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

/** 7 salas físicas (3 podem ficar livres para encaixe futuro). */
const SALAS_FISICAS = [
  { code: "SALA-01", name: "Sala 101 — Berçário", floor: "1º andar", capacity: 18 },
  { code: "SALA-02", name: "Sala 102 — Berçário", floor: "1º andar", capacity: 18 },
  { code: "SALA-03", name: "Sala 103 — Multifuncional", floor: "1º andar", capacity: 16 },
  { code: "SALA-04", name: "Sala 201 — Maternal", floor: "2º andar", capacity: 22 },
  { code: "SALA-05", name: "Sala 202 — Maternal", floor: "2º andar", capacity: 22 },
  { code: "SALA-06", name: "Sala 203 — Oficinas", floor: "2º andar", capacity: 20 },
  { code: "SALA-07", name: "Sala 301 — Brinquedoteca", floor: "3º andar", capacity: 24 },
] as const;

/** 4 turmas: índice da sala em `SALAS_FISICAS`; nome do professor vem da lista criada no seed (aleatória). */
const TURMAS_DEF = [
  { name: "Berçário A", salaIdx: 0, capacity: 16 },
  { name: "Berçário B", salaIdx: 1, capacity: 16 },
  { name: "Maternal A", salaIdx: 3, capacity: 20 },
  { name: "Maternal B", salaIdx: 4, capacity: 20 },
] as const;

/**
 * Empresa fictícia só para desenvolvimento e testes (CNPJ, banco e PIX não são reais).
 * Preenche Financeiro → Dados da empresa, PIX impresso e demais telas que leem o cadastro.
 */
const DEMO_COMPANY_SETTINGS = {
  legalName: "CRECHE E PRÉ-ESCOLA SOL NASCENTE LTDA",
  tradeName: "Sol Nascente — Educação Infantil",
  cnpj: "12.345.678/0001-90",
  stateRegistration: "110.042.118.119",
  municipalRegistration: "1.234.567-8",
  phone: "(11) 3456-7890",
  financeEmail: "financeiro@solnascente-demo.local",
  website: "https://solnascente-demo.local",
  street: "Rua das Acácias",
  number: "450",
  complement: "Bloco B",
  neighborhood: "Jardim Primavera",
  city: "São Paulo",
  state: "SP",
  zip: "01310-100",
  bankCode: "341",
  bankName: "Itaú Unibanco S.A.",
  agency: "1234",
  agencyDigit: "5",
  accountNumber: "67890",
  accountDigit: "1",
  accountType: "Conta corrente PJ",
  pixKeyType: "E-mail",
  pixKey: "cobranca@solnascente-demo.local",
  boletoConvenio: "3124567",
  boletoCarteira: "109",
  boletoVariacao: "019",
  boletoInstrucoes:
    "Não receber após o vencimento. Após vencimento, multa de 2% e juros de 1% ao mês. Dúvidas: financeiro@solnascente-demo.local.",
  boletoBatchNotes:
    "Remessa CNAB 240 — layout Itaú; arquivo gerado toda segunda às 8h; retorno processado no dia seguinte. Pasta rede: \\\\servidor\\financeiro\\boletos\\2026.",
  invoicePaymentNotes:
    "NF-e de fornecedores: conferência em dupla (secretaria + direção) acima de R$ 2.000. Pagamento preferencial PIX para CNPJ cadastrado; boleto com vencimento mínimo D+2.",
  depositNotes:
    "Conciliação diária no extrato Itaú; depósitos em dinheiro registrados no caixa e depositados até 16h no dia útil.",
  nfeNotes:
    "Regime Simples Nacional — anexo III; série NF-e 1; ambiente de homologação para testes antes de produção.",
} as const;

async function main() {
  await prisma.financialRecord.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.securityCamera.deleteMany();
  await prisma.academicHistoryEntry.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.physicalRoom.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.employeeJobRole.deleteMany();
  await prisma.registryCategory.deleteMany();

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD?.trim() || "Teste@123";
  const passwordHash = await hashPassword(defaultPassword);

  for (const u of SEED_TEST_USER_DEFS) {
    const perms = sanitizePermissionsForRole(u.role, [...DEFAULT_PERMISSIONS_BY_ROLE[u.role]]);
    await prisma.userAccount.upsert({
      where: { email: u.email },
      update: {
        displayName: u.displayName,
        loginName: u.loginName,
        active: true,
        profileRole: u.role,
        permissionsJson: JSON.stringify(perms),
        passwordHash,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      create: {
        displayName: u.displayName,
        email: u.email,
        loginName: u.loginName,
        active: true,
        profileRole: u.role,
        permissionsJson: JSON.stringify(perms),
        passwordHash,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  await prisma.companySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...DEMO_COMPANY_SETTINGS,
    },
    update: {
      ...DEMO_COMPANY_SETTINGS,
    },
  });

  const manha = await prisma.shift.create({
    data: {
      name: "Manhã",
      startTime: "07:00",
      endTime: "12:00",
      lessonDurationMinutes: 45,
      snackDurationMinutes: 15,
    },
  });
  const tarde = await prisma.shift.create({
    data: {
      name: "Tarde",
      startTime: "13:00",
      endTime: "18:00",
      lessonDurationMinutes: 45,
      snackDurationMinutes: 15,
    },
  });

  const salas = await Promise.all(
    SALAS_FISICAS.map((s) =>
      prisma.physicalRoom.create({
        data: {
          code: s.code,
          name: s.name,
          floor: s.floor,
          capacity: s.capacity,
          active: true,
        },
      }),
    ),
  );

  const year = 2026;

  const employeeJobRoles = await Promise.all(
    JOB_ROLES.map((name, i) =>
      prisma.employeeJobRole.create({
        data: { name, sortOrder: i },
      }),
    ),
  );

  await prisma.registryCategory.createMany({
    data: [
      { name: "Docente", scope: CategoryScope.EMPLOYEE, sortOrder: 0 },
      { name: "Administrativo", scope: CategoryScope.EMPLOYEE, sortOrder: 1 },
      { name: "Apoio operacional", scope: CategoryScope.EMPLOYEE, sortOrder: 2 },
      { name: "Alimentação", scope: CategoryScope.SUPPLIER, sortOrder: 0 },
      { name: "Material escolar", scope: CategoryScope.SUPPLIER, sortOrder: 1 },
      { name: "Serviços e manutenção", scope: CategoryScope.SUPPLIER, sortOrder: 2 },
      { name: "Higiene e limpeza", scope: CategoryScope.STOCK_CLEANING, sortOrder: 0 },
      { name: "Descartáveis", scope: CategoryScope.STOCK_CLEANING, sortOrder: 1 },
      { name: "Papelaria", scope: CategoryScope.STOCK_SCHOOL_SUPPLIES, sortOrder: 0 },
      { name: "Didáticos e jogos", scope: CategoryScope.STOCK_SCHOOL_SUPPLIES, sortOrder: 1 },
      { name: "Primeiros socorros", scope: CategoryScope.STOCK_PHARMACY, sortOrder: 0 },
      { name: "Medicamentos", scope: CategoryScope.STOCK_PHARMACY, sortOrder: 1 },
      { name: "Elétrica e iluminação", scope: CategoryScope.STOCK_BUILDING_MAINTENANCE, sortOrder: 0 },
      { name: "Hidráulica", scope: CategoryScope.STOCK_BUILDING_MAINTENANCE, sortOrder: 1 },
    ],
  });

  const employeeCategories = await prisma.registryCategory.findMany({
    where: { scope: CategoryScope.EMPLOYEE },
  });
  const supplierCategories = await prisma.registryCategory.findMany({
    where: { scope: CategoryScope.SUPPLIER },
  });

  const teacherRows = Array.from({ length: 12 }, (_, i) =>
    randomTeacherRow(year, i, {
      roles: employeeJobRoles.map((r) => ({ id: r.id, name: r.name })),
      employeeCategories: employeeCategories.map((c) => ({ id: c.id })),
    }),
  );
  await prisma.teacher.createMany({ data: teacherRows });

  const teachers = await prisma.teacher.findMany({ orderBy: { employeeCode: "asc" } });

  const turmaShift = [manha, manha, tarde, tarde] as const;
  const turmas = await Promise.all(
    TURMAS_DEF.map((turma, i) => {
      const sala = salas[turma.salaIdx]!;
      const teacherName = teachers[i % teachers.length]!.name;
      return prisma.classRoom.create({
        data: {
          name: turma.name,
          room: sala.name,
          teacherName,
          capacity: turma.capacity,
          year,
          shiftId: turmaShift[i].id,
          physicalRoomId: sala.id,
        },
      });
    }),
  );

  const guardians = await Promise.all(
    Array.from({ length: 24 }, (_, i) =>
      prisma.guardian.create({ data: randomGuardianCreate(i) }),
    ),
  );

  const students = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      prisma.student.create({
        data: randomStudentCreateInput(i, guardians[i % guardians.length]!.id),
      }),
    ),
  );

  const turmaIds = turmas.map((t) => t.id);
  await prisma.enrollment.createMany({
    data: students.map((s, i) => ({
      studentId: s.id,
      classRoomId: turmaIds[i % turmaIds.length]!,
      status: "ACTIVE",
    })),
  });

  await prisma.userAccount.updateMany({
    where: {
      email: { in: ["pai@teste.local", "mae@teste.local", "responsavel@teste.local"] },
    },
    data: { guardianId: guardians[0]!.id },
  });

  const supplierRows = Array.from({ length: 18 }, (_, i) =>
    randomSupplierRow(i, {
      supplierCategories: supplierCategories.map((c) => ({ id: c.id })),
    }),
  );
  await prisma.supplier.createMany({ data: supplierRows });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.attendanceRecord.createMany({
    data: students.map((s, i) => ({
      studentId: s.id,
      date: today,
      status: i % 5 === 0 ? AttendanceStatus.ABSENT : i % 7 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      entryAt:
        i % 5 === 0
          ? null
          : new Date(today.getTime() + (7.5 + (i % 3) * 0.25) * 3600000),
      exitAt: i % 5 === 0 ? null : new Date(today.getTime() + (11 + (i % 2)) * 3600000),
    })),
  });

  const mat = await prisma.subject.create({ data: { name: "Maternalidade" } });
  await prisma.gradeRecord.create({
    data: {
      studentId: students[1]!.id,
      subjectId: mat.id,
      title: "Socialização",
      period: "2026-T1",
      score: 8.5,
      comment: "Ótima adaptação.",
    },
  });

  await prisma.academicHistoryEntry.create({
    data: {
      studentId: students[0]!.id,
      schoolYear: "2025",
      summary: "Primeiro ano no berçário; desenvolvimento motor dentro do esperado.",
    },
  });

  const invYear = year;
  await prisma.inventoryItem.createMany({
    data: buildInventoryItemsForSeed(invYear),
  });
  const itemsForMovements = await prisma.inventoryItem.findMany({
    take: 14,
    orderBy: { sku: "asc" },
  });
  await prisma.stockMovement.createMany({
    data: itemsForMovements.map((item, i) => ({
      itemId: item.id,
      quantityChange: i % 3 === 0 ? -randInt(1, 4) : randInt(2, 12),
      reason: i % 3 === 0 ? "Consumo / uso na unidade" : "Entrada — reposição de teste",
    })),
  });

  await prisma.securityCamera.createMany({
    data: [
      {
        name: "Entrada principal",
        location: "Hall",
        streamUrl: "https://exemplo.local/cam/1",
        status: CameraStatus.ONLINE,
      },
      {
        name: "Pátio",
        location: "Área externa",
        status: CameraStatus.OFFLINE,
      },
    ],
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        direction: FinancialDirection.IN,
        kind: FinancialKind.TUITION,
        status: FinancialStatus.PENDING,
        amountCents: 120000,
        dueDate: new Date(Date.now() + 5 * 86400000),
        description: "Mensalidade abril — Ana Silva",
        studentId: students[0]!.id,
      },
      {
        direction: FinancialDirection.IN,
        kind: FinancialKind.PIX,
        status: FinancialStatus.PENDING,
        amountCents: 60000,
        description: "PIX avulso — material",
      },
      {
        direction: FinancialDirection.IN,
        kind: FinancialKind.BOLETO,
        status: FinancialStatus.PENDING,
        amountCents: 120000,
        externalRef: "BOLETO-DEMO-001",
        studentId: students[1]!.id,
      },
      {
        direction: FinancialDirection.IN,
        kind: FinancialKind.PAYMENT,
        status: FinancialStatus.SETTLED,
        amountCents: 120000,
        settledAt: new Date(),
        description: "Mensalidade março paga",
        studentId: students[0]!.id,
      },
      {
        direction: FinancialDirection.OUT,
        kind: FinancialKind.DEBIT,
        status: FinancialStatus.SETTLED,
        amountCents: 35000,
        settledAt: new Date(),
        description: "Manutenção ar condicionado",
      },
      {
        direction: FinancialDirection.IN,
        kind: FinancialKind.DEPOSIT,
        status: FinancialStatus.SETTLED,
        amountCents: 500000,
        settledAt: new Date(),
        description: "Depósito conta corrente — reserva",
      },
    ],
  });

  console.log(
    "Seed concluído: empresa fictícia “Sol Nascente” em CompanySettings; 7 salas físicas, turnos com aula 45 min + lanche 15 min, 20 alunos (campos aleatórios), 12 funcionários (campos aleatórios), 24 responsáveis (campos aleatórios), 4 turmas, 18 fornecedores (campos aleatórios), 32 itens de estoque (8 por categoria: limpeza, escolar, farmácia, zeladoria), movimentações, presença, notas, câmeras e lançamentos.",
  );
  console.log(`Senha padrão dos usuários de teste: ${defaultPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
