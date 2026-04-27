"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  previewNextEmployeeCode,
  saveTeacherForm,
  updateTeacherActive,
  type SaveTeacherPayload,
} from "./actions";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { useOptionalTeacherFichaHeader } from "./teacher-ficha-header-context";
import { useTeacherPhoto } from "./teacher-photo-context";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-sm font-medium text-muted";

function FormSection({
  step,
  badgeText,
  showStepBadge = true,
  title,
  description,
  children,
}: {
  step: number;
  badgeText?: string;
  showStepBadge?: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const badge = badgeText ?? String(step);
  return (
    <section
      id={`cadastro-funcionario-passo-${step}`}
      className="scroll-mt-24 rounded-2xl border border-line bg-elevated-2 shadow-sm"
    >
      <div className="border-b border-line-soft px-5 py-4 sm:px-6">
        <div className="flex gap-3 sm:gap-4">
          {showStepBadge ? (
            <span
              className={`flex min-h-10 min-w-10 max-w-[5.25rem] shrink-0 items-center justify-center rounded-xl bg-accent px-1 font-bold text-on-accent shadow-sm ${
                badgeText ? "text-[11px] tabular-nums leading-tight" : "text-sm"
              }`}
              aria-hidden
            >
              {badge}
            </span>
          ) : null}
          <div className={`min-w-0 ${showStepBadge ? "pt-0.5" : ""}`}>
            <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export type TeacherFormInitial = {
  name: string;
  nickname: string;
  employeeJobRoleId: string | null;
  employeeCategoryId: string | null;
  /** Texto legado quando ainda não havia função cadastrada */
  jobRoleLegacy?: string | null;
  employeeCode: string | null;
  active: boolean;
  birthDate: string;
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
  admissionDate: string;
  dismissalDate: string;
  salaryAmount: string;
  salaryPaymentMethod: string;
  salaryPaymentDay: number | null;
};

function emptyInitial(): TeacherFormInitial {
  return {
    name: "",
    nickname: "",
    employeeJobRoleId: null,
    employeeCategoryId: null,
    jobRoleLegacy: null,
    employeeCode: null,
    active: true,
    birthDate: "",
    phone: "",
    email: "",
    document: "",
    specialty: "",
    notes: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    workCardNumber: "",
    workCardSeries: "",
    workCardUf: "",
    admissionDate: "",
    dismissalDate: "",
    salaryAmount: "",
    salaryPaymentMethod: "",
    salaryPaymentDay: null,
  };
}

export function TeacherForm({
  lastSavedTeacherId,
  initial,
  jobRoleOptions,
  employeeCategoryOptions,
}: {
  lastSavedTeacherId?: string;
  initial?: TeacherFormInitial;
  jobRoleOptions: readonly { id: string; name: string }[];
  employeeCategoryOptions: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const base = initial ?? emptyInitial();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(base.name);
  const [nickname, setNickname] = useState(base.nickname);
  const [employeeJobRoleId, setEmployeeJobRoleId] = useState<string>(base.employeeJobRoleId ?? "");
  const [employeeCategoryId, setEmployeeCategoryId] = useState<string>(base.employeeCategoryId ?? "");
  const [employeeCodeAuto, setEmployeeCodeAuto] = useState(true);
  const [employeeCodeManual, setEmployeeCodeManual] = useState("");
  const [teacherActive, setTeacherActive] = useState(base.active);
  const [activeStatusSaving, setActiveStatusSaving] = useState(false);
  const [birthDate, setBirthDate] = useState(base.birthDate);
  const [phone, setPhone] = useState(base.phone);
  const [email, setEmail] = useState(base.email);
  const [document, setDocument] = useState(base.document);
  const [specialty, setSpecialty] = useState(base.specialty);
  const [notes, setNotes] = useState(base.notes);
  const [street, setStreet] = useState(base.street);
  const [number, setNumber] = useState(base.number);
  const [complement, setComplement] = useState(base.complement);
  const [neighborhood, setNeighborhood] = useState(base.neighborhood);
  const [city, setCity] = useState(base.city);
  const [state, setState] = useState(base.state);
  const [zip, setZip] = useState(base.zip);
  const [workCardNumber, setWorkCardNumber] = useState(base.workCardNumber);
  const [workCardSeries, setWorkCardSeries] = useState(base.workCardSeries);
  const [workCardUf, setWorkCardUf] = useState(base.workCardUf);
  const [admissionDate, setAdmissionDate] = useState(base.admissionDate);
  const [dismissalDate, setDismissalDate] = useState(base.dismissalDate);
  const [salaryAmount, setSalaryAmount] = useState(base.salaryAmount);
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState(base.salaryPaymentMethod);
  const [salaryPaymentDay, setSalaryPaymentDay] = useState<number | null>(base.salaryPaymentDay);

  const [codePreview, setCodePreview] = useState<string | null>(null);
  const { teacherPhoto, setTeacherPhoto } = useTeacherPhoto();
  const fichaHeader = useOptionalTeacherFichaHeader();
  const setHeaderName = fichaHeader?.setDraftName;
  const setHeaderNickname = fichaHeader?.setDraftNickname;
  const setHeaderJobRole = fichaHeader?.setDraftJobRole;
  const setHeaderCode = fichaHeader?.setDraftEmployeeCodeLine;

  useEffect(() => {
    let cancelled = false;
    previewNextEmployeeCode().then((v) => {
      if (!cancelled) setCodePreview(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const employeeCodeBadgeText = employeeCodeAuto
    ? (base.employeeCode?.trim() || codePreview || "···")
    : employeeCodeManual.trim() || "—";

  useEffect(() => {
    if (!setHeaderName) return;
    setHeaderName(name);
    return () => setHeaderName("");
  }, [name, setHeaderName]);

  useEffect(() => {
    if (!setHeaderNickname) return;
    setHeaderNickname(nickname);
    return () => setHeaderNickname("");
  }, [nickname, setHeaderNickname]);

  const resolvedJobRoleLabel = useMemo(() => {
    if (employeeJobRoleId) {
      const opt = jobRoleOptions.find((o) => o.id === employeeJobRoleId);
      if (opt) return opt.name;
    }
    return base.jobRoleLegacy?.trim() || "";
  }, [employeeJobRoleId, jobRoleOptions, base.jobRoleLegacy]);

  useEffect(() => {
    if (!setHeaderJobRole) return;
    setHeaderJobRole(resolvedJobRoleLabel);
    return () => setHeaderJobRole("");
  }, [resolvedJobRoleLabel, setHeaderJobRole]);

  useEffect(() => {
    if (!setHeaderCode) return;
    setHeaderCode(employeeCodeBadgeText);
    return () => setHeaderCode("");
  }, [employeeCodeBadgeText, setHeaderCode]);

  const payload: SaveTeacherPayload = useMemo(
    () => ({
      teacherId: lastSavedTeacherId ?? null,
      employeeCodeAuto,
      employeeCodeManual,
      name,
      nickname,
      employeeJobRoleId: employeeJobRoleId.trim() || null,
      employeeCategoryId: employeeCategoryId.trim() || null,
      active: teacherActive,
      birthDate: birthDate.trim() || null,
      phone,
      email,
      document,
      specialty,
      notes,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zip,
      workCardNumber,
      workCardSeries,
      workCardUf,
      admissionDate: admissionDate.trim() || null,
      dismissalDate: dismissalDate.trim() || null,
      salaryAmount,
      salaryPaymentMethod,
      salaryPaymentDay,
    }),
    [
      lastSavedTeacherId,
      employeeCodeAuto,
      employeeCodeManual,
      name,
      nickname,
      employeeJobRoleId,
      employeeCategoryId,
      teacherActive,
      birthDate,
      phone,
      email,
      document,
      specialty,
      notes,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zip,
      workCardNumber,
      workCardSeries,
      workCardUf,
      admissionDate,
      dismissalDate,
      salaryAmount,
      salaryPaymentMethod,
      salaryPaymentDay,
    ],
  );

  async function handleTeacherActiveChange(next: boolean) {
    if (next === teacherActive || activeStatusSaving) return;
    if (lastSavedTeacherId) {
      setActiveStatusSaving(true);
      setError(null);
      const result = await updateTeacherActive(lastSavedTeacherId, next);
      setActiveStatusSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }
    setTeacherActive(next);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      if (teacherPhoto) fd.append("photo_teacher", teacherPhoto);

      const result = await saveTeacherForm(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTeacherPhoto(null);
      previewNextEmployeeCode().then(setCodePreview);
      router.push(
        `/funcionarios/novo?ok=1&ficha=1&funcionario=${encodeURIComponent(result.teacherId)}`,
      );
    });
  }

  return (
    <form id="cadastro-funcionario" onSubmit={onSubmit} className="w-full">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
        >
          {error}
        </div>
      )}

      <div className="mt-2 min-w-0 space-y-6 pb-28 lg:pb-0">
          <FormSection
            step={1}
            title="Identificação"
            showStepBadge={false}
            description="Nome e dados básicos. O código de registro aparece na ficha no topo."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Nome completo *</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                <span className={labelClass}>Apelido</span>
                <input
                  className={inputClass}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Como prefere ser chamado(a)"
                  autoComplete="nickname"
                />
              </label>
              <label>
                <span className={labelClass}>Função</span>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={employeeJobRoleId}
                  onChange={(e) => setEmployeeJobRoleId(e.target.value)}
                >
                  <option value="">— Selecione —</option>
                  {jobRoleOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {base.jobRoleLegacy?.trim() && !employeeJobRoleId ? (
                  <p className="mt-1 text-xs text-muted">
                    Texto anterior: {base.jobRoleLegacy.trim()} — escolha uma função cadastrada para
                    padronizar.
                  </p>
                ) : null}
                {jobRoleOptions.length === 0 ? (
                  <p className="mt-1 text-xs text-muted">
                    Nenhuma função cadastrada.{" "}
                    <Link href="/administracao/funcoes-e-categorias" className="font-medium text-accent underline">
                      Cadastrar funções
                    </Link>{" "}
                    (requer permissão de administrador).
                  </p>
                ) : null}
              </label>
              <label>
                <span className={labelClass}>Categoria</span>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={employeeCategoryId}
                  onChange={(e) => setEmployeeCategoryId(e.target.value)}
                >
                  <option value="">— Nenhuma —</option>
                  {employeeCategoryOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Data de nascimento</span>
                <input
                  type="date"
                  className={inputClass}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>CPF / documento</span>
                <input
                  className={inputClass}
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Carteira de trabalho e remuneração"
            showStepBadge={false}
            description="CTPS, datas de admissão e demissão e dados do pagamento do salário (opcionais, conforme política da escola)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>CTPS — número</span>
                <input
                  className={inputClass}
                  value={workCardNumber}
                  onChange={(e) => setWorkCardNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
              <label>
                <span className={labelClass}>CTPS — série</span>
                <input
                  className={inputClass}
                  value={workCardSeries}
                  onChange={(e) => setWorkCardSeries(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                <span className={labelClass}>CTPS — UF</span>
                <input
                  className={inputClass}
                  value={workCardUf}
                  onChange={(e) => setWorkCardUf(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="Ex.: SP"
                />
              </label>
              <label>
                <span className={labelClass}>Data de admissão</span>
                <input
                  type="date"
                  className={inputClass}
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Data de demissão</span>
                <input
                  type="date"
                  className={inputClass}
                  value={dismissalDate}
                  onChange={(e) => setDismissalDate(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Valor do salário (R$)</span>
                <input
                  className={`${inputClass} tabular-nums`}
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder="Ex.: 3500,00"
                  inputMode="decimal"
                />
              </label>
              <label>
                <span className={labelClass}>Forma de pagamento do salário</span>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={salaryPaymentMethod}
                  onChange={(e) => setSalaryPaymentMethod(e.target.value)}
                >
                  <option value="">Não informado</option>
                  {TUITION_PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Dia do pagamento no mês</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className={`${inputClass} tabular-nums`}
                  value={salaryPaymentDay ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setSalaryPaymentDay(null);
                      return;
                    }
                    const n = Number.parseInt(v, 10);
                    if (Number.isInteger(n) && n >= 1 && n <= 31) {
                      setSalaryPaymentDay(n);
                    }
                  }}
                  placeholder="1 a 31"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            step={3}
            title="Contato"
            showStepBadge={false}
            description="Telefone e e-mail para comunicação com a escola."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Telefone / WhatsApp</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label>
                <span className={labelClass}>E-mail</span>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            step={4}
            title="Endereço"
            showStepBadge={false}
            description="Opcional — útil para documentação ou correspondência."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Logradouro</span>
                <input
                  className={inputClass}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Número</span>
                <input className={inputClass} value={number} onChange={(e) => setNumber(e.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Complemento</span>
                <input
                  className={inputClass}
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Bairro</span>
                <input
                  className={inputClass}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </label>
              <label>
                <span className={labelClass}>Cidade</span>
                <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label>
                <span className={labelClass}>UF</span>
                <input
                  className={inputClass}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                />
              </label>
              <label>
                <span className={labelClass}>CEP</span>
                <input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} />
              </label>
            </div>
          </FormSection>

          <FormSection
            step={5}
            title="Formação e observações"
            showStepBadge={false}
            description="Área de atuação, disciplinas ou notas internas."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Formação / especialidade / turmas</span>
                <input
                  className={inputClass}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex.: Educação infantil, Berçário II…"
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Observações</span>
                <textarea
                  className={`${inputClass} min-h-[6rem] resize-y`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </label>
            </div>
          </FormSection>

          <div className="space-y-4 border-t border-line-soft pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-lg border border-line-soft bg-shell/50 px-3 py-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                    checked={employeeCodeAuto}
                    onChange={(e) => setEmployeeCodeAuto(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Gerar código de registro automaticamente</span>
                    <span className="mt-0.5 block text-muted">
                      Sequência por ano (ex.: P20260001). Desmarque para informar um código próprio.
                    </span>
                  </span>
                </label>
                {!employeeCodeAuto ? (
                  <label className="mt-3 block">
                    <span className={labelClass}>Código de registro *</span>
                    <input
                      className={inputClass}
                      value={employeeCodeManual}
                      onChange={(e) => setEmployeeCodeManual(e.target.value)}
                      placeholder="Ex.: P2026-INT-01"
                      maxLength={32}
                      required
                    />
                  </label>
                ) : null}
              </div>

              <div className="sm:col-span-2 rounded-lg border border-line-soft bg-shell/50 px-3 py-3">
                <span className={labelClass}>Situação no sistema</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={activeStatusSaving}
                    onClick={() => void handleTeacherActiveChange(true)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                      teacherActive
                        ? "border-accent-border bg-accent-soft text-ink ring-2 ring-accent/30"
                        : "border-line bg-elevated-2 text-muted hover:border-line-soft hover:text-ink"
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    disabled={activeStatusSaving}
                    onClick={() => void handleTeacherActiveChange(false)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                      !teacherActive
                        ? "border-warn-border bg-warn-bg text-warn-text ring-2 ring-warn-border/40"
                        : "border-line bg-elevated-2 text-muted hover:border-line-soft hover:text-ink"
                    }`}
                  >
                    Inativo
                  </button>
                </div>
                {lastSavedTeacherId ? (
                  <p className="mt-2 text-xs text-muted">
                    {activeStatusSaving
                      ? "Salvando…"
                      : "Para este cadastro, a situação é gravada ao escolher Ativo ou Inativo."}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Será aplicada ao salvar pela primeira vez.
                  </p>
                )}
              </div>
            </div>
          </div>
      </div>

      <div className="hidden flex-col gap-3 border-t border-line-soft pt-6 lg:flex lg:flex-row lg:flex-wrap lg:items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent shadow-md transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Salvando…" : lastSavedTeacherId ? "Atualizar cadastro" : "Salvar cadastro"}
        </button>
        <p className="w-full text-xs text-subtle lg:w-auto lg:flex-1">
          * Obrigatório: nome completo. Com código automático desmarcado, informe o código de registro.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-elevated-2/95 p-3 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="submit"
          form="cadastro-funcionario"
          disabled={pending}
          className="mx-auto flex min-h-[48px] w-full max-w-lg rounded-xl bg-accent py-3 text-sm font-semibold text-on-accent shadow-md hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Salvando…" : lastSavedTeacherId ? "Atualizar cadastro" : "Salvar cadastro"}
        </button>
      </div>
    </form>
  );
}
