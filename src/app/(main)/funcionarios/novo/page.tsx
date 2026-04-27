import { CategoryScope } from "@/generated/prisma/client";
import { centsToBrlInput } from "@/lib/brl-parse";
import { prisma } from "@/lib/prisma";
import { FuncionarioNovoShell } from "./funcionario-novo-shell";
import { TeacherFichaHeaderProvider } from "./teacher-ficha-header-context";
import { type TeacherFormInitial } from "./teacher-form";
import { TeacherPageHeader } from "./teacher-page-header";
import { TeacherPhotoProvider } from "./teacher-photo-context";
import type { TeacherPickerRow } from "./teacher-search-panel";

type SearchParams = { ok?: string; funcionario?: string; cadastro?: string; ficha?: string };

function toDateInput(iso: Date | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function NovoFuncionarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const ok = sp.ok === "1";
  const funcionarioId = sp.funcionario?.trim() ?? null;
  /** Só abre o bloco "Cadastrar ou editar" por URL em fluxo explícito ou após salvar — não ao só selecionar funcionário na lista/ficha. */
  const initialCadastroOpen = sp.cadastro === "1" || sp.ok === "1";
  /** Ficha no topo só após lista (`ficha=1`), fluxo novo (`cadastro=1`) ou retorno do salvamento (`ok=1`). */
  const revealFichaFromParams =
    sp.ficha === "1" || sp.cadastro === "1" || sp.ok === "1";

  let savedPhotoUrl: string | null = null;
  let savedName: string | null = null;
  let savedNickname: string | null = null;
  let savedJobRole: string | null = null;
  let savedEmployeeCode: string | null = null;
  let savedTeacherActive = true;
  let initialForm: TeacherFormInitial | undefined;

  const [jobRoleOptions, employeeCategoryOptions] = await Promise.all([
    prisma.employeeJobRole.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.registryCategory.findMany({
      where: { active: true, scope: CategoryScope.EMPLOYEE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (funcionarioId) {
    const row = await prisma.teacher.findUnique({
      where: { id: funcionarioId },
      include: {
        employeeJobRole: { select: { name: true } },
      },
    });
    if (row) {
      savedPhotoUrl = row.photoUrl?.trim() || null;
      savedName = row.name.trim();
      savedNickname = row.nickname?.trim() || null;
      savedJobRole =
        row.employeeJobRole?.name?.trim() || row.jobRole?.trim() || null;
      savedEmployeeCode = row.employeeCode?.trim() || null;
      savedTeacherActive = row.active;
      initialForm = {
        name: row.name.trim(),
        nickname: row.nickname?.trim() ?? "",
        employeeJobRoleId: row.employeeJobRoleId,
        employeeCategoryId: row.employeeCategoryId,
        jobRoleLegacy: !row.employeeJobRoleId ? row.jobRole?.trim() ?? null : null,
        employeeCode: row.employeeCode?.trim() ?? null,
        active: row.active,
        birthDate: toDateInput(row.birthDate),
        phone: row.phone?.trim() ?? "",
        email: row.email?.trim() ?? "",
        document: row.document?.trim() ?? "",
        specialty: row.specialty?.trim() ?? "",
        notes: row.notes?.trim() ?? "",
        street: row.street?.trim() ?? "",
        number: row.number?.trim() ?? "",
        complement: row.complement?.trim() ?? "",
        neighborhood: row.neighborhood?.trim() ?? "",
        city: row.city?.trim() ?? "",
        state: row.state?.trim() ?? "",
        zip: row.zip?.trim() ?? "",
        workCardNumber: row.workCardNumber?.trim() ?? "",
        workCardSeries: row.workCardSeries?.trim() ?? "",
        workCardUf: row.workCardUf?.trim() ?? "",
        admissionDate: toDateInput(row.admissionDate),
        dismissalDate: toDateInput(row.dismissalDate),
        salaryAmount: centsToBrlInput(row.salaryCents),
        salaryPaymentMethod: row.salaryPaymentMethod?.trim() ?? "",
        salaryPaymentDay: row.salaryPaymentDay ?? null,
      };
    }
  }

  const pickerRows = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
    include: {
      employeeJobRole: { select: { name: true } },
    },
  });

  const teacherPickerRows: TeacherPickerRow[] = pickerRows.map((t) => ({
    id: t.id,
    name: t.name.trim(),
    nickname: t.nickname?.trim() || null,
    jobRole: t.employeeJobRole?.name?.trim() ?? t.jobRole?.trim() ?? null,
    employeeCode: t.employeeCode?.trim() ?? null,
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    birthDate: t.birthDate?.toISOString() ?? null,
    phone: t.phone?.trim() || null,
    email: t.email?.trim() || null,
    document: t.document?.trim() || null,
    specialty: t.specialty?.trim() || null,
    notes: t.notes?.trim() || null,
    photoUrl: t.photoUrl?.trim() || null,
    street: t.street?.trim() || null,
    number: t.number?.trim() || null,
    complement: t.complement?.trim() || null,
    neighborhood: t.neighborhood?.trim() || null,
    city: t.city?.trim() || null,
    state: t.state?.trim() || null,
    zip: t.zip?.trim() || null,
    workCardNumber: t.workCardNumber?.trim() || null,
    workCardSeries: t.workCardSeries?.trim() || null,
    workCardUf: t.workCardUf?.trim() || null,
    admissionDate: t.admissionDate?.toISOString() ?? null,
    dismissalDate: t.dismissalDate?.toISOString() ?? null,
    salaryCents: t.salaryCents ?? null,
    salaryPaymentMethod: t.salaryPaymentMethod?.trim() || null,
    salaryPaymentDay: t.salaryPaymentDay ?? null,
  }));

  const effectiveFuncionarioId = funcionarioId && initialForm ? funcionarioId : null;

  const shellLayoutKey = [
    effectiveFuncionarioId ?? "novo",
    sp.cadastro ?? "",
    sp.ficha ?? "",
    sp.ok ?? "",
  ].join("|");

  return (
    <TeacherPhotoProvider key={effectiveFuncionarioId ?? "novo"}>
      <TeacherFichaHeaderProvider>
        <div className="mx-auto max-w-6xl">
          <FuncionarioNovoShell
            key={shellLayoutKey}
            effectiveFuncionarioId={effectiveFuncionarioId}
            revealFichaFromParams={revealFichaFromParams}
            initialCadastroOpen={initialCadastroOpen}
            ok={ok}
            lastSavedTeacherId={effectiveFuncionarioId ?? undefined}
            initialForm={initialForm}
            jobRoleOptions={jobRoleOptions}
            employeeCategoryOptions={employeeCategoryOptions}
            header={
              <TeacherPageHeader
                funcionarioId={effectiveFuncionarioId}
                savedPhotoUrl={savedPhotoUrl}
                savedName={savedName}
                savedNickname={savedNickname}
                savedJobRole={savedJobRole}
                savedEmployeeCode={savedEmployeeCode}
                fichaActive={effectiveFuncionarioId ? savedTeacherActive : undefined}
              />
            }
            teachers={teacherPickerRows}
          />
        </div>
      </TeacherFichaHeaderProvider>
    </TeacherPhotoProvider>
  );
}
