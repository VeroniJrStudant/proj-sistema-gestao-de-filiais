/**
 * Dados pseudoaleatórios para `prisma/seed.ts` — alunos, responsáveis, funcionários,
 * fornecedores e itens de estoque (limpeza, escolar, farmácia, zeladoria).
 */

import type { Prisma } from "@/generated/prisma/client";
import { InventoryCategory } from "@/generated/prisma/client";

const FIRST = [
  "Ana",
  "Bruno",
  "Clara",
  "Davi",
  "Elena",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Karina",
  "Lucas",
  "Mariana",
  "Nicolas",
  "Olívia",
  "Pedro",
  "Quésia",
  "Rafael",
  "Sofia",
  "Thiago",
  "Valentina",
  "William",
  "Yasmin",
  "Zeca",
] as const;

const LAST = [
  "Silva",
  "Costa",
  "Mendes",
  "Oliveira",
  "Rocha",
  "Santos",
  "Lima",
  "Alves",
  "Duarte",
  "Nunes",
  "Freitas",
  "Martins",
  "Cardoso",
  "Araújo",
  "Campos",
  "Lopes",
  "Ribeiro",
  "Monteiro",
  "Barros",
  "Ferreira",
  "Gomes",
  "Pires",
  "Teixeira",
  "Vieira",
] as const;

export const JOB_ROLES = [
  "Professora — berçário I",
  "Professor — maternal I",
  "Coordenadora pedagógica",
  "Auxiliar de berçário",
  "Professor — musicalização",
  "Educador físico",
  "Zelador",
  "Nutricionista",
  "Recepcionista",
  "Cozinheira",
  "Motorista",
  "Psicóloga escolar",
] as const;

const SPECIALTIES = [
  "Educação infantil",
  "Psicomotricidade",
  "Libras",
  "Inglês infantil",
  "Música",
  "Literatura",
  null,
  "Primeiros socorros",
] as const;

const STREETS = [
  "Rua das Flores",
  "Av. Brasil",
  "Rua XV de Novembro",
  "Rua do Comércio",
  "Alameda Santos",
  "Rua Oscar Freire",
  "Av. Paulista",
] as const;

const NEIGHBORHOODS = ["Centro", "Jardim Europa", "Vila Nova", "Boa Vista", "Parque Industrial"] as const;

const CITIES = [
  { city: "São Paulo", state: "SP" },
  { city: "Guarulhos", state: "SP" },
  { city: "Osasco", state: "SP" },
  { city: "Campinas", state: "SP" },
  { city: "Santos", state: "SP" },
] as const;

const TUITION_METHODS = [
  "PIX",
  "BOLETO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "DINHEIRO",
  "DEBITO_AUTOMATICO",
  "OUTRO",
] as const;

const DIDACTIC_PLANS = ["PAID_START", "PAY_DURING_YEAR", "NOT_APPLICABLE"] as const;

const SALARY_PAY_METHODS = ["PIX", "TRANSFERENCIA", "BOLETO", "DINHEIRO"] as const;

const UF = ["SP", "RJ", "MG", "PR", "RS", "SC"] as const;

const NOTES_SNIPPETS = [
  "Contrato assinado digitalmente.",
  "Desconto irmão aplicado.",
  "Entrega de documentação pendente.",
  "Autorização saída antecipada em arquivo.",
  "Alergia controlada com medicação.",
  null,
] as const;

const ALLERGY_SAMPLES = [
  null,
  "Leite de vaca",
  "Amendoim",
  "Ovo",
  "Glúten",
  "Frutos do mar",
] as const;

const HEALTH_SAMPLES = [
  null,
  "Asma leve — bombinha na secretaria.",
  "Uso ocular de colírio quando necessário.",
  "Acompanhamento fonoaudiológico.",
] as const;

const DIET_SAMPLES = [
  null,
  "Sem lactose",
  "Cardápio sem glúten",
  "Evitar frituras",
  "Reforço de frutas no lanche",
] as const;

function r(): number {
  return Math.random();
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)]!;
}

export function randInt(min: number, max: number): number {
  return Math.floor(r() * (max - min + 1)) + min;
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export function fakeDigits(n: number): string {
  return Array.from({ length: n }, () => String(randInt(0, 9))).join("");
}

export function randomPhone(): string {
  return `(11) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`;
}

export function randomCep(): string {
  return `${String(randInt(10000, 99999)).padStart(5, "0")}-${String(randInt(100, 999)).padStart(3, "0")}`;
}

export function randomEmailFromName(displayName: string, suffix: string): string {
  return `${slug(displayName)}.${suffix}@teste-creche.local`;
}

export function randomFullName(seed: number): string {
  const f = FIRST[seed % FIRST.length]!;
  const l1 = LAST[(seed * 7) % LAST.length]!;
  const l2 = LAST[(seed * 13) % LAST.length]!;
  return r() > 0.4 ? `${f} ${l1}` : `${f} ${l1} ${l2}`;
}

export function fotoPlaceholderSeed(key: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(key)}/128/128`;
}

export type RandomTeacherRow = Prisma.TeacherCreateManyInput;

export function randomTeacherRow(
  year: number,
  index: number,
  opts: {
    roles: { id: string; name: string }[];
    employeeCategories: { id: string }[];
  },
): RandomTeacherRow {
  const code = `P${year}${String(index + 1).padStart(4, "0")}`;
  const name = randomFullName(index + 42);
  const first = name.split(" ")[0] ?? name;
  const loc = pick(CITIES);
  const active = r() > 0.08;
  const birth = new Date(randInt(1970, 1998), randInt(0, 11), randInt(1, 28));
  const admission = new Date(randInt(2018, 2025), randInt(0, 11), randInt(1, 28));
  let dismissal: Date | null = null;
  if (!active && r() > 0.3) {
    dismissal = new Date(admission.getTime() + randInt(30, 800) * 86400000);
  }

  const role =
    opts.roles.length > 0
      ? pick(opts.roles)
      : { id: null as string | null, name: pick(JOB_ROLES) };
  const cat = opts.employeeCategories.length > 0 && r() > 0.2 ? pick(opts.employeeCategories) : null;

  return {
    employeeCode: code,
    name,
    nickname: r() > 0.35 ? first.slice(0, 12) : first,
    jobRole: role.name,
    employeeJobRoleId: role.id,
    employeeCategoryId: cat?.id ?? null,
    active,
    birthDate: birth,
    phone: randomPhone(),
    email: randomEmailFromName(name, code),
    document: fakeDigits(11),
    specialty: pick(SPECIALTIES) ?? undefined,
    notes: pick(NOTES_SNIPPETS) ?? undefined,
    photoUrl: fotoPlaceholderSeed(`func-${code}-${name}`),
    street: pick(STREETS),
    number: String(randInt(1, 3200)),
    complement: r() > 0.65 ? `Apto ${randInt(1, 120)}` : null,
    neighborhood: pick(NEIGHBORHOODS),
    city: loc.city,
    state: loc.state,
    zip: randomCep(),
    workCardNumber: String(randInt(1000000, 9999999)),
    workCardSeries: String(randInt(100, 999)),
    workCardUf: pick(UF),
    admissionDate: admission,
    dismissalDate: dismissal,
    salaryCents: randInt(180000, 650000),
    salaryPaymentMethod: pick(SALARY_PAY_METHODS),
    salaryPaymentDay: randInt(1, 28),
  };
}

export function randomGuardianCreate(index: number): Prisma.GuardianCreateInput {
  const name = randomFullName(index + 500);
  const loc = pick(CITIES);
  return {
    name,
    phone: randomPhone(),
    email: randomEmailFromName(name, `g${index}`),
    document: fakeDigits(11),
    photoUrl: fotoPlaceholderSeed(`resp-${index}-${name}`),
    street: pick(STREETS),
    number: String(randInt(1, 4000)),
    complement: r() > 0.7 ? `Bl ${pick(["A", "B", "C"])}` : null,
    neighborhood: pick(NEIGHBORHOODS),
    city: loc.city,
    state: loc.state,
    zip: randomCep(),
  };
}

export function tuitionDetailsJson(): string {
  return JSON.stringify({
    banco: pick(["Itaú", "Bradesco", "Nubank", "Inter"]),
    agencia: String(randInt(1000, 9999)),
    conta: `${randInt(10000, 99999)}-${randInt(0, 9)}`,
    pix: pick(["email", "cpf", "telefone"]),
  });
}

export function randomStudentCreateInput(
  index: number,
  guardianId: string,
): Prisma.StudentCreateInput {
  const year = 2026;
  const matricula = `${year}${String(index + 1).padStart(4, "0")}`;
  const name = randomFullName(index);
  const birthYear = 2016 - randInt(0, 5);
  const birthDate = new Date(birthYear, randInt(0, 11), randInt(1, 28));

  const tuitionPaymentDate =
    r() > 0.4 ? new Date(2026, randInt(0, 3), randInt(1, 28)) : null;

  return {
    matricula,
    name,
    birthDate,
    active: r() > 0.05,
    photoUrl: fotoPlaceholderSeed(`aluno-${matricula}-${name}`),
    notes: pick(NOTES_SNIPPETS) ?? undefined,
    allergies: pick(ALLERGY_SAMPLES) ?? undefined,
    healthNotes: pick(HEALTH_SAMPLES) ?? undefined,
    dietaryNotes: pick(DIET_SAMPLES) ?? undefined,
    tuitionPaymentMethod: pick(TUITION_METHODS),
    yearStartInstallmentsPaid: randInt(0, 12),
    madeEntryPayment: r() > 0.4,
    didacticMaterialsPlan: pick(DIDACTIC_PLANS),
    owedPreviousSchoolYears: r() > 0.85,
    tuitionDiscountCents: r() > 0.75 ? null : randInt(0, 50000),
    tuitionMonthlyAmountCents: randInt(80000, 220000),
    didacticMaterialsAmountCents: randInt(0, 45000),
    tuitionPaymentDate: tuitionPaymentDate ?? undefined,
    tuitionPaymentDetailsJson: r() > 0.25 ? tuitionDetailsJson() : null,
    guardians: {
      create: [
        {
          guardianId,
          relation: pick(["Mãe", "Pai", "Avó", "Avô", "Tia", "Tio", "Responsável legal"]),
          pickupAuthorized: r() > 0.35,
        },
      ],
    },
  };
}

const SUPPLIER_LEGAL_FORMS = ["Ltda.", "ME", "EPP", "SA", "Comércio"] as const;
const SUPPLIER_LABELS = ["Alpha", "Beta", "Norte", "União", "Central", "Litoral", "Oeste"] as const;
const PAYMENT_METHODS_SUPPLIER = [
  "PIX",
  "Boleto bancário",
  "Transferência TED",
  "Cartão corporativo",
  "Dinheiro",
] as const;

function fakeCnpj(): string {
  const p = () => String(randInt(10, 99));
  const t = () => String(randInt(100, 999));
  return `${p()}.${t()}.${t()}/0001-${String(randInt(10, 99)).padStart(2, "0")}`;
}

/** Fornecedor com todos os campos preenchidos (testes). */
export function randomSupplierRow(
  index: number,
  opts?: { supplierCategories?: { id: string }[] },
): Prisma.SupplierCreateManyInput {
  const loc = pick(CITIES);
  const razao = `${pick(["Comercial", "Distribuidora", "Atacadista", "Importadora"])} ${pick(SUPPLIER_LABELS)} ${pick(SUPPLIER_LEGAL_FORMS)}`;
  const pay = new Date(2026, randInt(0, 11), randInt(1, 28));
  const year = 2026;
  const cats = opts?.supplierCategories;
  const supplierCategoryId =
    cats && cats.length > 0 && r() > 0.15 ? pick(cats).id : undefined;
  return {
    supplierCode: `F${year}${String(index + 1).padStart(4, "0")}`,
    name: razao,
    supplierCategoryId,
    tradeName: `${pick(["Loja", "Depósito", "Express", "Mix"])} ${pick(SUPPLIER_LABELS)}`,
    document: fakeCnpj(),
    phone: randomPhone(),
    email: `fornecedor.${index}@teste-creche.local`,
    street: pick(STREETS),
    number: String(randInt(1, 5200)),
    complement: `Sala ${randInt(1, 50)}`,
    neighborhood: pick(NEIGHBORHOODS),
    city: loc.city,
    state: loc.state,
    zip: randomCep(),
    notes: `Pedidos: ${pick([
      "Seg–Sex 8h–18h",
      "WhatsApp no cardápio",
      "Mínimo R$ 200 para frete",
    ])}.`,
    paymentMethod: pick(PAYMENT_METHODS_SUPPLIER),
    paymentDate: pay,
    active: true,
  };
}

type InvDef = {
  name: string;
  productCategory: string;
  brand: string;
  unit: string;
};

const CLEANING_ITEMS: readonly InvDef[] = [
  { name: "Detergente neutro 5 L", productCategory: "Limpeza", brand: "Neutro Clean", unit: "galão" },
  { name: "Desinfetante perfumado 2 L", productCategory: "Higiene", brand: "Floral", unit: "fr" },
  { name: "Papel higiênico double 30 m", productCategory: "Higiene", brand: "Soft Roll", unit: "pct" },
  { name: "Esponja multiuso", productCategory: "Limpeza", brand: "Scotch", unit: "pct" },
  { name: "Saco de lixo 100 L", productCategory: "Limpeza", brand: "Fort", unit: "pct" },
  { name: "Álcool 70% 1 L", productCategory: "Higiene", brand: "Medi", unit: "fr" },
  { name: "Desodorizador sanitas", productCategory: "Limpeza", brand: "Fresh", unit: "fr" },
  { name: "Pano de chão algodão", productCategory: "Limpeza", brand: "Doméstico", unit: "UN" },
] as const;

const SCHOOL_ITEMS: readonly InvDef[] = [
  { name: "Papel sulfite A4 500 fls", productCategory: "Papelaria", brand: "Chamex", unit: "pct" },
  { name: "Caneta esferográfica azul caixa 50", productCategory: "Papelaria", brand: "Bic", unit: "cx" },
  { name: "Lápis de cor 24 cores", productCategory: "Didático", brand: "Faber", unit: "cx" },
  { name: "Cola branca escolar 1 kg", productCategory: "Papelaria", brand: "Tenaz", unit: "fr" },
  { name: "Tesoura infantil sem ponta", productCategory: "Papelaria", brand: "Maped", unit: "UN" },
  { name: "Tintas guache 12 cores", productCategory: "Didático", brand: "Acrilex", unit: "cx" },
  { name: "Giz de cera grosso", productCategory: "Didático", brand: "Acrilex", unit: "cx" },
  { name: "Plasticina educativa 500 g", productCategory: "Didático", brand: "Soft", unit: "pct" },
] as const;

const PHARMACY_ITEMS: readonly InvDef[] = [
  { name: "Soro fisiológico 0,9% 10 ml", productCategory: "Medicamentos", brand: "Equiplex", unit: "fr" },
  { name: "Atadura crepe 10 cm", productCategory: "Curativos", brand: "Cremer", unit: "UN" },
  { name: "Álcool gel 70% 500 ml", productCategory: "Higiene", brand: "Medi", unit: "fr" },
  { name: "Luvas procedimento M", productCategory: "EPI", brand: "Descarpack", unit: "cx" },
  { name: "Termômetro digital", productCategory: "Instrumentos", brand: "G-Tech", unit: "UN" },
  { name: "Band-aid hipoalergênico", productCategory: "Curativos", brand: "Band", unit: "cx" },
  { name: "Seringa descartável 5 ml", productCategory: "Insumos", brand: "Descarpack", unit: "pct" },
  { name: "Gaze esterilizada", productCategory: "Curativos", brand: "Cremer", unit: "pct" },
] as const;

const BUILDING_ITEMS: readonly InvDef[] = [
  { name: "Lâmpada LED tubular 18 W", productCategory: "Elétrica", brand: "Osram", unit: "UN" },
  { name: "Fita isolante 20 m", productCategory: "Elétrica", brand: "3M", unit: "UN" },
  { name: "Bujão curva 2\"", productCategory: "Hidráulica", brand: "Tigre", unit: "UN" },
  { name: "Silicone acético 280 g", productCategory: "Manutenção", brand: "Tekbond", unit: "fr" },
  { name: "Tinta acrílica branca 3,6 L", productCategory: "Pintura", brand: "Suvinil", unit: "lata" },
  { name: "Chave inglesa 8\"", productCategory: "Ferramentas", brand: "Tramontina", unit: "UN" },
  { name: "Disjuntor monofásico 20 A", productCategory: "Elétrica", brand: "Siemens", unit: "UN" },
  { name: "Cimento cola 1 kg", productCategory: "Alvenaria", brand: "Quartzolit", unit: "sc" },
] as const;

function inventoryRow(
  category: InventoryCategory,
  skuLetter: string,
  year: number,
  seq: number,
  def: InvDef,
): Prisma.InventoryItemCreateManyInput {
  const sku = `${skuLetter}${year}${String(seq).padStart(4, "0")}`;
  return {
    category,
    name: def.name,
    productCategory: def.productCategory,
    brand: def.brand,
    sku,
    quantity: randInt(2, 140),
    minQuantity: randInt(2, 28),
    unit: def.unit,
    location: pick([
      "Depósito — subsolo",
      "Almoxarifado — térreo",
      "Sala de materiais — 2º andar",
      "Farmácia escolar — copa",
    ]),
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(sku)}/96/96`,
    unitPriceCents: randInt(90, 42000),
  };
}

/** Itens de estoque para as 4 categorias (limpeza, escolar, farmácia, zeladoria). */
export function buildInventoryItemsForSeed(year: number): Prisma.InventoryItemCreateManyInput[] {
  const out: Prisma.InventoryItemCreateManyInput[] = [];
  let n = 1;
  for (const def of CLEANING_ITEMS) {
    out.push(inventoryRow(InventoryCategory.CLEANING, "L", year, n++, def));
  }
  n = 1;
  for (const def of SCHOOL_ITEMS) {
    out.push(inventoryRow(InventoryCategory.SCHOOL_SUPPLIES, "M", year, n++, def));
  }
  n = 1;
  for (const def of PHARMACY_ITEMS) {
    out.push(inventoryRow(InventoryCategory.PHARMACY, "F", year, n++, def));
  }
  n = 1;
  for (const def of BUILDING_ITEMS) {
    out.push(inventoryRow(InventoryCategory.BUILDING_MAINTENANCE, "Z", year, n++, def));
  }
  return out;
}
