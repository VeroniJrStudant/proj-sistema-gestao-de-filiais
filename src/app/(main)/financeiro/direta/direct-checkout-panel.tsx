"use client";

import { FinanceStudentSearchPicker } from "@/components/finance/student-search-picker";
import { centsToMoneyInputString } from "@/lib/tuition/enrollment-finance";
import {
  buildDescriptionFromEmployee,
  buildDescriptionFromSearch,
  buildDescriptionFromSupplier,
  resolveContactFromEmployee,
  resolveContactFromSearch,
  resolveContactFromSupplier,
  type FinanceClassRoomOption,
  type FinanceEmployeeSearchRow,
  type FinanceShiftOption,
  type FinanceStudentSearchRow,
  type FinanceSupplierSearchRow,
} from "@/lib/finance/student-search";
import type { DirectIntegrationStatus } from "@/lib/integrations/direct-checkout-types";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { registerDirectCheckoutRequest, type DirectCheckoutChannel } from "./actions";

const PAYMENT_TYPE_OPTIONS: { value: DirectCheckoutChannel; label: string }[] = [
  { value: "PIX_IMEDIATO", label: "PIX — crédito imediato" },
  { value: "DOCUMENTO_DEBITO", label: "Documento de débito (impressão + e-mail)" },
  { value: "BOLETO_AUTO", label: "Boleto bancário (emissão automática)" },
  { value: "CARTAO_AVISTA", label: "Cartão — à vista ou parcelado" },
  { value: "CARTAO_RECORRENTE", label: "Cartão — recorrente" },
  { value: "NFE", label: "Nota fiscal eletrônica (NF-e)" },
];

type BannerPayload =
  | { type: "ok"; text: string; recordId?: string; documentPrint?: boolean }
  | { type: "err"; text: string }
  | null;

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

export type DirectCheckoutFormContext = {
  studentRow: FinanceStudentSearchRow | null;
  employeeRow: FinanceEmployeeSearchRow | null;
  supplierRow: FinanceSupplierSearchRow | null;
  resetKey: number;
  searchQueryAtSelect: string;
};

function defaultNotesForContext(
  studentRow: FinanceStudentSearchRow | null,
  employeeRow: FinanceEmployeeSearchRow | null,
  supplierRow: FinanceSupplierSearchRow | null,
  searchQueryAtSelect: string,
): string {
  if (studentRow) {
    return buildDescriptionFromSearch(studentRow, searchQueryAtSelect);
  }
  if (employeeRow) {
    return buildDescriptionFromEmployee(employeeRow, searchQueryAtSelect);
  }
  if (supplierRow) {
    return buildDescriptionFromSupplier(supplierRow, searchQueryAtSelect);
  }
  return "";
}

function AmountAndNotes({
  studentRow,
  employeeRow,
  supplierRow,
  resetKey,
  searchQueryAtSelect,
}: {
  studentRow: FinanceStudentSearchRow | null;
  employeeRow: FinanceEmployeeSearchRow | null;
  supplierRow: FinanceSupplierSearchRow | null;
  resetKey: number;
  searchQueryAtSelect: string;
}) {
  const defaultAmount =
    studentRow?.tuitionMonthlyAmountCents != null
      ? centsToMoneyInputString(studentRow.tuitionMonthlyAmountCents)
      : "";
  const notesKey = `notes-${resetKey}-${studentRow?.id ?? "n"}-${employeeRow?.id ?? "n"}-${supplierRow?.id ?? "n"}-${searchQueryAtSelect}`;
  return (
    <>
      <label className="block sm:col-span-1">
        <span className={labelClass}>Valor (R$)</span>
        <input
          name="amount"
          required
          key={`amt-${resetKey}-${studentRow?.id ?? "n"}`}
          defaultValue={defaultAmount}
          className={inputClass}
          inputMode="decimal"
          placeholder="0,00"
        />
      </label>
      <label className="block sm:col-span-1">
        <span className={labelClass}>Observações internas</span>
        <input
          name="notes"
          key={notesKey}
          defaultValue={defaultNotesForContext(studentRow, employeeRow, supplierRow, searchQueryAtSelect)}
          className={inputClass}
          maxLength={2000}
          placeholder="Referência, contrato…"
        />
      </label>
    </>
  );
}

function PayerBlockControlled({
  payerName,
  setPayerName,
  payerEmail,
  setPayerEmail,
  payerDocument,
  setPayerDocument,
}: {
  payerName: string;
  setPayerName: (v: string) => void;
  payerEmail: string;
  setPayerEmail: (v: string) => void;
  payerDocument: string;
  setPayerDocument: (v: string) => void;
}) {
  return (
    <>
      <label className="block sm:col-span-1">
        <span className={labelClass}>Nome (pagador / tomador)</span>
        <input
          name="payerName"
          required
          className={inputClass}
          autoComplete="name"
          maxLength={200}
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
        />
      </label>
      <label className="block sm:col-span-1">
        <span className={labelClass}>CPF ou CNPJ (somente números)</span>
        <input
          name="payerDocument"
          className={inputClass}
          inputMode="numeric"
          maxLength={18}
          placeholder="00000000000"
          value={payerDocument}
          onChange={(e) => setPayerDocument(e.target.value)}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={labelClass}>E-mail (para boleto, NF-e ou comprovante)</span>
        <input
          name="payerEmail"
          type="email"
          className={inputClass}
          autoComplete="email"
          maxLength={120}
          value={payerEmail}
          onChange={(e) => setPayerEmail(e.target.value)}
        />
      </label>
    </>
  );
}

function FormCard({
  title,
  subtitle,
  children,
  channel,
  onMessage,
  rows,
  shifts,
  classRooms,
  suppliers,
  employees,
  documentPrint = false,
  submitLabel = "Registrar solicitação",
  pendingLabel = "Registrando…",
}: {
  title: string;
  subtitle: string;
  children: (ctx: DirectCheckoutFormContext) => ReactNode;
  channel: DirectCheckoutChannel;
  onMessage: (m: BannerPayload) => void;
  rows: FinanceStudentSearchRow[];
  shifts: FinanceShiftOption[];
  classRooms: FinanceClassRoomOption[];
  suppliers: FinanceSupplierSearchRow[];
  employees: FinanceEmployeeSearchRow[];
  documentPrint?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [studentRow, setStudentRow] = useState<FinanceStudentSearchRow | null>(null);
  const [employeeRow, setEmployeeRow] = useState<FinanceEmployeeSearchRow | null>(null);
  const [supplierRow, setSupplierRow] = useState<FinanceSupplierSearchRow | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerDocument, setPayerDocument] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [searchQueryAtSelect, setSearchQueryAtSelect] = useState("");

  function applyStudent(row: FinanceStudentSearchRow, searchQuery: string) {
    setStudentRow(row);
    setEmployeeRow(null);
    setSupplierRow(null);
    setSearchQueryAtSelect(searchQuery);
    const c = resolveContactFromSearch(row, searchQuery);
    setPayerName(c.payerName);
    setPayerEmail(c.payerEmail);
    setPayerDocument(c.payerDocumentDigits);
  }

  function applyEmployee(row: FinanceEmployeeSearchRow, searchQuery: string) {
    setStudentRow(null);
    setSupplierRow(null);
    setEmployeeRow(row);
    setSearchQueryAtSelect(searchQuery);
    const c = resolveContactFromEmployee(row);
    setPayerName(c.payerName);
    setPayerEmail(c.payerEmail);
    setPayerDocument(c.payerDocumentDigits);
  }

  function applySupplier(row: FinanceSupplierSearchRow, searchQuery: string) {
    setStudentRow(null);
    setEmployeeRow(null);
    setSupplierRow(row);
    setSearchQueryAtSelect(searchQuery);
    const c = resolveContactFromSupplier(row);
    setPayerName(c.payerName);
    setPayerEmail(c.payerEmail);
    setPayerDocument(c.payerDocumentDigits);
  }

  function clearSelection() {
    setStudentRow(null);
    setEmployeeRow(null);
    setSupplierRow(null);
    setSearchQueryAtSelect("");
    setPayerName("");
    setPayerEmail("");
    setPayerDocument("");
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    onMessage(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await registerDirectCheckoutRequest(channel, fd);
      if (res.ok) {
        onMessage({ type: "ok", text: res.message, recordId: res.recordId, documentPrint });
        clearSelection();
        setResetKey((k) => k + 1);
        form.reset();
      } else {
        onMessage({ type: "err", text: res.error });
      }
    });
  }

  const ctx: DirectCheckoutFormContext = {
    studentRow,
    employeeRow,
    supplierRow,
    resetKey,
    searchQueryAtSelect,
  };

  return (
    <section className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="studentId" value={studentRow?.id ?? ""} />
        <fieldset
          disabled={pending}
          className="m-0 grid min-w-0 grid-cols-1 gap-4 border-0 p-0 sm:col-span-2 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <FinanceStudentSearchPicker
              rows={rows}
              shifts={shifts}
              classRooms={classRooms}
              suppliers={suppliers}
              employees={employees}
              optional
              selectedStudentId={studentRow?.id ?? null}
              selectedEmployeeId={employeeRow?.id ?? null}
              selectedSupplierId={supplierRow?.id ?? null}
              onSelect={applyStudent}
              onSelectEmployee={applyEmployee}
              onSelectSupplier={applySupplier}
              onClear={clearSelection}
              title="Quem paga / referência"
              hint="Aluno ou responsável (pai, mãe, documento): vincula o aluno e preenche o pagador. Funcionário (nome ou matrícula funcional): dados do cadastro de funcionários. Fornecedor: razão social, fantasia e CNPJ/CPF."
            />
          </div>
          <PayerBlockControlled
            payerName={payerName}
            setPayerName={setPayerName}
            payerEmail={payerEmail}
            setPayerEmail={setPayerEmail}
            payerDocument={payerDocument}
            setPayerDocument={setPayerDocument}
          />
          {children(ctx)}
        </fieldset>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-sm hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

export function DirectCheckoutPanel({
  rows,
  shifts,
  classRooms,
  suppliers,
  employees,
  integration,
}: {
  rows: FinanceStudentSearchRow[];
  shifts: FinanceShiftOption[];
  classRooms: FinanceClassRoomOption[];
  suppliers: FinanceSupplierSearchRow[];
  employees: FinanceEmployeeSearchRow[];
  integration: DirectIntegrationStatus;
}) {
  const [banner, setBanner] = useState<BannerPayload>(null);
  const [paymentType, setPaymentType] = useState<DirectCheckoutChannel>("PIX_IMEDIATO");

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          integration.paymentGatewayConfigured && integration.nfeConfigured
            ? "border-accent/40 bg-accent-soft/20 text-ink"
            : "border-line-soft bg-elevated text-muted"
        }`}
        role="status"
      >
        <p className="font-medium text-ink">Integrações no servidor</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{integration.paymentGatewaySummary}</li>
          <li>{integration.nfeSummary}</li>
        </ul>
        <p className="mt-2 text-xs text-subtle">
          O formulário abaixo registra a intenção no financeiro (pendente). A emissão automática de boleto,
          cobrança de cartão, PIX com liquidação imediata e envio de NF-e à SEFAZ dependem de API do provedor
          escolhido e de credenciais válidas. O <span className="text-ink">documento de débito</span> gera página
          para impressão e pode ser enviado por e-mail (SMTP no servidor).
        </p>
      </div>

      {banner ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${banner.type === "ok" ? "bg-accent-soft text-ink" : "bg-danger-soft text-ink"}`}
          role="alert"
        >
          <p>{banner.text}</p>
          {banner.type === "ok" && banner.recordId && banner.documentPrint ? (
            <p className="mt-2">
              <Link
                href={`/financeiro/documento-debito/${banner.recordId}`}
                className="font-medium text-accent-muted underline decoration-dotted hover:text-accent"
              >
                Abrir documento de débito para impressão
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-line-soft bg-elevated-2 p-4 shadow-sm sm:p-5">
        <label htmlFor="direct-checkout-payment-type" className={labelClass}>
          Tipo de pagamento
        </label>
        <select
          id="direct-checkout-payment-type"
          className={`${inputClass} mt-1`}
          value={paymentType}
          onChange={(e) => {
            setPaymentType(e.target.value as DirectCheckoutChannel);
            setBanner(null);
          }}
        >
          {PAYMENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-subtle">Escolha como a família vai pagar; só o formulário desse tipo é exibido.</p>
      </div>

      {paymentType === "BOLETO_AUTO" ? (
        <FormCard
          channel="BOLETO_AUTO"
          title="Boleto bancário — emissão automática"
          subtitle="Registra cobrança para geração de boleto pelo PSP. Com integração ativa, o sistema poderá solicitar o PDF e a linha digitável ao provedor."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
        >
          {(ctx) => (
            <>
              <label className="block sm:col-span-1">
                <span className={labelClass}>Vencimento</span>
                <input name="dueDate" type="date" required className={inputClass} />
              </label>
              <label className="block sm:col-span-1">
                <span className={labelClass}>E-mail alternativo para cópia do boleto</span>
                <input name="boletoEmailCopy" type="email" className={inputClass} maxLength={120} />
              </label>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
            </>
          )}
        </FormCard>
      ) : null}

      {paymentType === "CARTAO_AVISTA" ? (
        <FormCard
          channel="CARTAO_AVISTA"
          title="Cartão — à vista ou parcelado"
          subtitle="Cobrança única com parcelamento na adquirente. Recorrência real exige plano de assinatura no PSP."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
        >
          {(ctx) => (
            <>
              <label className="block sm:col-span-1">
                <span className={labelClass}>Parcelas (1 = à vista)</span>
                <select name="installments" className={inputClass} defaultValue="1">
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </select>
              </label>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
            </>
          )}
        </FormCard>
      ) : null}

      {paymentType === "CARTAO_RECORRENTE" ? (
        <FormCard
          channel="CARTAO_RECORRENTE"
          title="Cartão — recorrente"
          subtitle="Registra intenção de cobrança recorrente (mensalidade). O PSP cria a assinatura e renova as cobranças conforme a periodicidade."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
        >
          {(ctx) => (
            <>
              <label className="block sm:col-span-1">
                <span className={labelClass}>Periodicidade</span>
                <select name="periodicity" className={inputClass} defaultValue="MONTHLY">
                  <option value="MONTHLY">Mensal</option>
                  <option value="BIMONTHLY">Bimestral</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </label>
              <label className="block sm:col-span-1">
                <span className={labelClass}>Dia preferencial de cobrança (1–28, opcional)</span>
                <input name="billingDay" className={inputClass} inputMode="numeric" maxLength={2} placeholder="10" />
              </label>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
            </>
          )}
        </FormCard>
      ) : null}

      {paymentType === "PIX_IMEDIATO" ? (
        <FormCard
          channel="PIX_IMEDIATO"
          title="PIX — crédito imediato"
          subtitle="Cobrança com QR Code dinâmico ou copia e cola. Com PSP configurado, a confirmação pode ser em segundos (pix recebido / webhook)."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
        >
          {(ctx) => (
            <>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
              <label className="block sm:col-span-2">
                <span className={labelClass}>Referência da chave PIX da creche (opcional)</span>
                <input name="pixKeyHint" className={inputClass} placeholder="Ex.: CNPJ da unidade" maxLength={80} />
              </label>
            </>
          )}
        </FormCard>
      ) : null}

      {paymentType === "DOCUMENTO_DEBITO" ? (
        <FormCard
          channel="DOCUMENTO_DEBITO"
          title="Documento de débito"
          subtitle="Gera um documento formal com valor e vencimento para o responsável pagar à creche. Opcionalmente envia por e-mail (resumo + link para a mesma página de impressão). Configure SMTP no servidor."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
          documentPrint
          submitLabel="Gerar documento e registrar"
          pendingLabel="Gerando…"
        >
          {(ctx) => (
            <>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Referência da cobrança (aparece no documento)</span>
                <input
                  name="referenceLabel"
                  required
                  key={`ref-${ctx.resetKey}-${ctx.studentRow?.id ?? "n"}-${ctx.employeeRow?.id ?? "n"}-${ctx.supplierRow?.id ?? "n"}-${ctx.searchQueryAtSelect}`}
                  defaultValue={defaultNotesForContext(
                    ctx.studentRow,
                    ctx.employeeRow,
                    ctx.supplierRow,
                    ctx.searchQueryAtSelect,
                  )}
                  className={inputClass}
                  maxLength={500}
                  placeholder="Ex.: Mensalidade abril/2026 — educação infantil"
                />
              </label>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
              <label className="block sm:col-span-2">
                <span className={labelClass}>Vencimento</span>
                <input name="dueDate" type="date" required className={inputClass} />
              </label>
              <div className="flex items-start gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="sendEmail"
                  value="on"
                  id="debit-send-email"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
                />
                <label htmlFor="debit-send-email" className="text-sm text-muted">
                  Enviar por e-mail o resumo e o link para impressão (usa o e-mail do responsável acima; exige SMTP
                  configurado).
                </label>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="sendToGuardians"
                  value="on"
                  id="debit-send-guardians"
                  className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
                />
                <label htmlFor="debit-send-guardians" className="text-sm text-muted">
                  Incluir também os e-mails dos demais responsáveis cadastrados no aluno (selecione o aluno acima).
                </label>
              </div>
            </>
          )}
        </FormCard>
      ) : null}

      {paymentType === "NFE" ? (
        <FormCard
          channel="NFE"
          title="Nota fiscal eletrônica (NF-e / serviço)"
          subtitle="Registra pedido de emissão. O emissor (Focus NFe, eNotas, etc.) transmite o XML à SEFAZ com certificado A1 e autorização cadastral."
          onMessage={setBanner}
          rows={rows}
          shifts={shifts}
          classRooms={classRooms}
          suppliers={suppliers}
          employees={employees}
        >
          {(ctx) => (
            <>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Descrição do serviço / discriminação</span>
                <textarea
                  name="serviceDescription"
                  required
                  key={`svc-${ctx.resetKey}-${ctx.studentRow?.id ?? "n"}-${ctx.employeeRow?.id ?? "n"}-${ctx.supplierRow?.id ?? "n"}-${ctx.searchQueryAtSelect}`}
                  defaultValue={defaultNotesForContext(
                    ctx.studentRow,
                    ctx.employeeRow,
                    ctx.supplierRow,
                    ctx.searchQueryAtSelect,
                  )}
                  className={`${inputClass} min-h-[6rem] resize-y`}
                  maxLength={2000}
                  placeholder="Ex.: Mensalidade educação infantil — referência março/2026"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className={labelClass}>CFOP sugerido (opcional)</span>
                <input name="cfop" className={inputClass} placeholder="5933" maxLength={10} />
              </label>
              <label className="block sm:col-span-1">
                <span className={labelClass}>Inscrição estadual do tomador (se aplicável)</span>
                <input name="tomadorIe" className={inputClass} maxLength={20} />
              </label>
              <AmountAndNotes
                studentRow={ctx.studentRow}
                employeeRow={ctx.employeeRow}
                supplierRow={ctx.supplierRow}
                resetKey={ctx.resetKey}
                searchQueryAtSelect={ctx.searchQueryAtSelect}
              />
            </>
          )}
        </FormCard>
      ) : null}
    </div>
  );
}
