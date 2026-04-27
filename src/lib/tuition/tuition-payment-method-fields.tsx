"use client";

import type { TuitionPaymentDetails } from "./tuition-payment-details";
import {
  BANK_ACCOUNT_TYPES,
  CARD_BRANDS,
  PIX_KEY_TYPES,
} from "./tuition-payment-details";

export function TuitionPaymentMethodFields({
  method,
  details,
  onPatch,
  disabled,
  inputClass,
  selectClass,
  labelClass,
}: {
  method: string;
  details: TuitionPaymentDetails;
  onPatch: (patch: Partial<TuitionPaymentDetails>) => void;
  disabled?: boolean;
  inputClass: string;
  selectClass: string;
  labelClass: string;
}) {
  if (!method) {
    return (
      <p className="text-xs text-muted">
        Selecione a forma de pagamento para preencher os dados do recibo ou comprovante.
      </p>
    );
  }

  const text = (
    k: keyof TuitionPaymentDetails,
    label: string,
    placeholder?: string,
    opts?: { maxLength?: number },
  ) => (
    <label key={String(k)} className="block sm:col-span-1">
      <span className={labelClass}>{label}</span>
      <input
        className={`${inputClass} mt-1`}
        disabled={disabled}
        value={details[k] ?? ""}
        maxLength={opts?.maxLength}
        placeholder={placeholder}
        onChange={(e) => onPatch({ [k]: e.target.value } as Partial<TuitionPaymentDetails>)}
      />
    </label>
  );

  const blockTitle = (t: string) => (
    <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-accent-muted">
      {t}
    </p>
  );

  if (method === "PIX") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {blockTitle("Dados para recibo — PIX")}
        <label className="sm:col-span-1">
          <span className={labelClass}>Tipo de chave</span>
          <select
            className={`${selectClass} mt-1`}
            disabled={disabled}
            value={details.pixKeyType ?? ""}
            onChange={(e) => onPatch({ pixKeyType: e.target.value })}
          >
            <option value="">Selecione</option>
            {PIX_KEY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {text("pixKey", "Chave PIX", "CPF, e-mail, telefone ou chave…")}
      </div>
    );
  }

  if (method === "BOLETO") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {blockTitle("Dados para recibo — boleto")}
        {text("boletoBank", "Banco / beneficiário no boleto")}
        {text("boletoOurNumber", "Nosso número", undefined, { maxLength: 64 })}
        {text(
          "boletoDigitableLine",
          "Linha digitável",
          "47 dígitos…",
          { maxLength: 54 },
        )}
      </div>
    );
  }

  if (method === "CARTAO_CREDITO" || method === "CARTAO_DEBITO") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {blockTitle(
          method === "CARTAO_CREDITO"
            ? "Dados para recibo — cartão de crédito"
            : "Dados para recibo — cartão de débito",
        )}
        <label className="sm:col-span-1">
          <span className={labelClass}>Bandeira</span>
          <select
            className={`${selectClass} mt-1`}
            disabled={disabled}
            value={details.cardBrand ?? ""}
            onChange={(e) => onPatch({ cardBrand: e.target.value })}
          >
            <option value="">Selecione</option>
            {CARD_BRANDS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {text("cardLast4", "Últimos 4 dígitos do cartão", "0000", { maxLength: 4 })}
        {text("cardAuthCode", "Código de autorização / NSU", undefined, { maxLength: 32 })}
      </div>
    );
  }

  if (method === "TRANSFERENCIA" || method === "DEBITO_AUTOMATICO") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {blockTitle(
          method === "TRANSFERENCIA"
            ? "Dados para recibo — transferência (TED / DOC / PIX institucional)"
            : "Dados para recibo — débito automático",
        )}
        {text("bankName", "Nome do banco")}
        {text("bankCode", "Código do banco (ex.: 001)", undefined, { maxLength: 8 })}
        {text("bankAgency", "Agência", undefined, { maxLength: 12 })}
        {text("bankAgencyDigit", "Dígito da agência", undefined, { maxLength: 2 })}
        {text("bankAccount", "Conta", undefined, { maxLength: 20 })}
        {text("bankAccountDigit", "Dígito da conta", undefined, { maxLength: 2 })}
        <label className="sm:col-span-1">
          <span className={labelClass}>Tipo de conta</span>
          <select
            className={`${selectClass} mt-1`}
            disabled={disabled}
            value={details.bankAccountType ?? ""}
            onChange={(e) => onPatch({ bankAccountType: e.target.value })}
          >
            <option value="">Selecione</option>
            {BANK_ACCOUNT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {text("beneficiaryName", "Titular da conta (nome)")}
        {text("beneficiaryDocument", "CPF ou CNPJ do titular", undefined, { maxLength: 18 })}
      </div>
    );
  }

  if (method === "DINHEIRO") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {blockTitle("Dados para recibo — dinheiro")}
        {text("receiptNumber", "Número do recibo (opcional)", undefined, { maxLength: 40 })}
        {text("receivedByName", "Recebido por (nome na secretaria)", undefined, { maxLength: 120 })}
      </div>
    );
  }

  if (method === "OUTRO") {
    return (
      <div className="grid gap-3">
        {blockTitle("Dados para recibo — outro acordo")}
        <label className="block">
          <span className={labelClass}>Descrição / referência do pagamento</span>
          <textarea
            className={`${inputClass} mt-1 min-h-[5rem] resize-y`}
            disabled={disabled}
            value={details.paymentNotes ?? ""}
            maxLength={2000}
            placeholder="Combine aqui o que constará no recibo ou contrato."
            onChange={(e) => onPatch({ paymentNotes: e.target.value })}
          />
        </label>
      </div>
    );
  }

  return null;
}
