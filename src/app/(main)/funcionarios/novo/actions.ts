"use server";

import { revalidatePath } from "next/cache";
import { CategoryScope, Prisma } from "@/generated/prisma/client";
import { parseBrlStringToCents } from "@/lib/brl-parse";
import { prisma } from "@/lib/prisma";
import { saveTeacherPhoto } from "@/lib/save-teacher-photo";
import { parseTuitionPaymentMethod } from "@/lib/tuition/tuition-payment-options";

export type SaveTeacherPayload = {
  /** Quando presente, atualiza o registro existente. */
  teacherId?: string | null;
  employeeCodeAuto: boolean;
  employeeCodeManual: string;
  name: string;
  nickname: string;
  /** IDs dos cadastros auxiliares (administração). */
  employeeJobRoleId: string | null;
  employeeCategoryId: string | null;
  active: boolean;
  birthDate: string | null;
  phone: string;
  email: string;
  document: string;
  specialty: string;
  notes: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  workCardNumber: string;
  workCardSeries: string;
  workCardUf: string;
  admissionDate: string | null;
  dismissalDate: string | null;
  /** Valor em texto pt-BR; vazio = não informado. */
  salaryAmount: string;
  salaryPaymentMethod: string;
  /** Dia do pagamento no mês (1–31) ou null. */
  salaryPaymentDay: number | null;
};

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function getOptionalFile(formData: FormData, key: string): File | null {
  const v = formData.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

async function nextEmployeeCodeForYear(
  db: Pick<typeof prisma, "teacher">,
  year: number,
): Promise<string> {
  const prefix = `P${year}`;
  const last = await db.teacher.findFirst({
    where: { employeeCode: { startsWith: prefix } },
    orderBy: { employeeCode: "desc" },
    select: { employeeCode: true },
  });
  let seq = 1;
  if (last?.employeeCode) {
    const rest = last.employeeCode.slice(prefix.length);
    const n = parseInt(rest, 10);
    if (!Number.isNaN(n)) {
      seq = n + 1;
    }
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function previewNextEmployeeCode(): Promise<string> {
  const year = new Date().getFullYear();
  return nextEmployeeCodeForYear(prisma, year);
}

function validatePayload(payload: SaveTeacherPayload, isUpdate: boolean): string | null {
  const name = payload.name.trim();
  if (!name) {
    return "Informe o nome completo do(a) funcionário(a).";
  }

  if (!payload.employeeCodeAuto) {
    const c = payload.employeeCodeManual.trim();
    if (!c) {
      return "Informe o código de registro ou marque a opção para gerar automaticamente.";
    }
    if (c.length > 32) {
      return "Código de registro muito longo (máx. 32 caracteres).";
    }
  }

  if (isUpdate && !payload.teacherId?.trim()) {
    return "Funcionário(a) inválido(a) para atualização.";
  }

  let admissionMs: number | null = null;
  let dismissalMs: number | null = null;
  if (payload.admissionDate?.trim()) {
    const d = new Date(`${payload.admissionDate.trim()}T12:00:00`);
    if (!Number.isNaN(d.getTime())) admissionMs = d.getTime();
  }
  if (payload.dismissalDate?.trim()) {
    const d = new Date(`${payload.dismissalDate.trim()}T12:00:00`);
    if (!Number.isNaN(d.getTime())) dismissalMs = d.getTime();
  }
  if (admissionMs !== null && dismissalMs !== null && dismissalMs < admissionMs) {
    return "A data de demissão não pode ser anterior à data de admissão.";
  }

  const salaryRaw = String(payload.salaryAmount ?? "").trim();
  if (salaryRaw) {
    const cents = parseBrlStringToCents(salaryRaw);
    if (cents === null) {
      return "Valor do salário inválido. Use formato como 3500,00 ou 3.500,50.";
    }
  }

  const pm = String(payload.salaryPaymentMethod ?? "").trim();
  if (pm && parseTuitionPaymentMethod(pm) === null) {
    return "Forma de pagamento do salário inválida.";
  }

  const day = payload.salaryPaymentDay;
  if (day !== null && day !== undefined) {
    const n = typeof day === "number" ? day : Number(day);
    if (!Number.isInteger(n) || n < 1 || n > 31) {
      return "Dia do pagamento deve ser entre 1 e 31.";
    }
  }

  return null;
}

async function resolveTeacherRegistryFields(
  payload: SaveTeacherPayload,
): Promise<
  | {
      ok: true;
      data: {
        jobRole: string | null;
        employeeJobRoleId: string | null;
        employeeCategoryId: string | null;
      };
    }
  | { ok: false; error: string }
> {
  const rid = payload.employeeJobRoleId?.trim() || null;
  const cid = payload.employeeCategoryId?.trim() || null;

  let jobRole: string | null = null;
  let employeeJobRoleId: string | null = null;
  if (rid) {
    const jr = await prisma.employeeJobRole.findUnique({ where: { id: rid } });
    if (!jr || !jr.active) {
      return { ok: false, error: "Selecione uma função válida ou cadastre em Administração → Funções e categorias." };
    }
    employeeJobRoleId = rid;
    jobRole = jr.name;
  }

  let employeeCategoryId: string | null = null;
  if (cid) {
    const cat = await prisma.registryCategory.findFirst({
      where: { id: cid, scope: CategoryScope.EMPLOYEE, active: true },
    });
    if (!cat) {
      return {
        ok: false,
        error: "Selecione uma categoria válida ou cadastre em Administração → Funções e categorias.",
      };
    }
    employeeCategoryId = cid;
  }

  return { ok: true, data: { jobRole, employeeJobRoleId, employeeCategoryId } };
}

function teacherDataFromPayload(payload: SaveTeacherPayload, employeeCode: string) {
  let birthDate: Date | null = null;
  if (payload.birthDate) {
    const d = new Date(`${payload.birthDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      birthDate = d;
    }
  }

  let admissionDate: Date | null = null;
  if (payload.admissionDate) {
    const d = new Date(`${payload.admissionDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      admissionDate = d;
    }
  }

  let dismissalDate: Date | null = null;
  if (payload.dismissalDate) {
    const d = new Date(`${payload.dismissalDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      dismissalDate = d;
    }
  }

  const salaryRaw = String(payload.salaryAmount ?? "").trim();
  const salaryCents = salaryRaw ? parseBrlStringToCents(salaryRaw) : null;

  const pmRaw = String(payload.salaryPaymentMethod ?? "").trim();
  const salaryPaymentMethod = pmRaw ? parseTuitionPaymentMethod(pmRaw) : null;

  let salaryPaymentDay: number | null = null;
  const dayVal = payload.salaryPaymentDay;
  if (dayVal !== null && dayVal !== undefined) {
    const n = typeof dayVal === "number" ? dayVal : Number(dayVal);
    if (Number.isInteger(n) && n >= 1 && n <= 31) {
      salaryPaymentDay = n;
    }
  }

  const uf = emptyToNull(payload.workCardUf)?.toUpperCase().slice(0, 2) ?? null;

  return {
    employeeCode,
    name: payload.name.trim(),
    nickname: emptyToNull(payload.nickname),
    active: payload.active !== false,
    birthDate,
    phone: emptyToNull(payload.phone),
    email: emptyToNull(payload.email),
    document: emptyToNull(payload.document),
    specialty: emptyToNull(payload.specialty),
    notes: emptyToNull(payload.notes),
    street: emptyToNull(payload.street),
    number: emptyToNull(payload.number),
    complement: emptyToNull(payload.complement),
    neighborhood: emptyToNull(payload.neighborhood),
    city: emptyToNull(payload.city),
    state: emptyToNull(payload.state),
    zip: emptyToNull(payload.zip),
    workCardNumber: emptyToNull(payload.workCardNumber),
    workCardSeries: emptyToNull(payload.workCardSeries),
    workCardUf: uf,
    admissionDate,
    dismissalDate,
    salaryCents,
    salaryPaymentMethod,
    salaryPaymentDay,
  };
}

export async function updateTeacherActive(
  teacherId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = teacherId.trim();
  if (!id) {
    return { ok: false, error: "Funcionário(a) inválido(a)." };
  }
  try {
    const row = await prisma.teacher.findUnique({ where: { id }, select: { id: true } });
    if (!row) {
      return { ok: false, error: "Funcionário(a) não encontrado(a)." };
    }
    await prisma.teacher.update({
      where: { id },
      data: { active },
    });
    revalidatePath("/funcionarios/novo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar a situação." };
  }
}

export async function saveTeacherForm(
  formData: FormData,
): Promise<{ ok: true; teacherId: string } | { ok: false; error: string }> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { ok: false, error: "Dados do formulário inválidos." };
  }

  let payload: SaveTeacherPayload;
  try {
    payload = JSON.parse(raw) as SaveTeacherPayload;
  } catch {
    return { ok: false, error: "Dados do formulário inválidos." };
  }

  const existingId = payload.teacherId?.trim() || null;
  const isUpdate = !!existingId;

  const validationError = validatePayload(payload, isUpdate);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const year = new Date().getFullYear();
  let employeeCode: string;
  if (payload.employeeCodeAuto) {
    if (isUpdate && existingId) {
      const current = await prisma.teacher.findUnique({
        where: { id: existingId },
        select: { employeeCode: true },
      });
      if (current?.employeeCode?.trim()) {
        employeeCode = current.employeeCode.trim();
      } else {
        employeeCode = await nextEmployeeCodeForYear(prisma, year);
      }
    } else {
      employeeCode = await nextEmployeeCodeForYear(prisma, year);
    }
  } else {
    employeeCode = payload.employeeCodeManual.trim();
    const taken = await prisma.teacher.findFirst({
      where: {
        employeeCode,
        ...(isUpdate && existingId ? { NOT: { id: existingId } } : {}),
      },
      select: { id: true },
    });
    if (taken) {
      return { ok: false, error: "Este código de registro já está em uso. Informe outro." };
    }
  }

  const registry = await resolveTeacherRegistryFields(payload);
  if (!registry.ok) {
    return { ok: false, error: registry.error };
  }

  const baseData = teacherDataFromPayload(payload, employeeCode);
  const data = { ...baseData, ...registry.data };
  const photoFile = getOptionalFile(formData, "photo_teacher");

  let teacherId: string;

  try {
    if (isUpdate && existingId) {
      await prisma.teacher.update({
        where: { id: existingId },
        data,
      });
      teacherId = existingId;
    } else {
      const created = await prisma.teacher.create({ data });
      teacherId = created.id;
    }
  } catch (e) {
    console.error(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Este código de registro já está em uso. Informe outro." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }

  if (photoFile) {
    try {
      const url = await saveTeacherPhoto(teacherId, photoFile, "professor");
      await prisma.teacher.update({
        where: { id: teacherId },
        data: { photoUrl: url },
      });
    } catch (e) {
      console.error(e);
      if (!isUpdate) {
        try {
          await prisma.teacher.delete({ where: { id: teacherId } });
        } catch {
          /* ignore */
        }
      }
      const msg = e instanceof Error ? e.message : "Erro ao salvar imagem.";
      return { ok: false, error: msg };
    }
  }

  revalidatePath("/funcionarios/novo");
  revalidatePath("/");
  return { ok: true, teacherId };
}
