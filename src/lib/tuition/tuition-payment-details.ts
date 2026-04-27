/** Campos opcionais para recibo / comprovante conforme a forma de pagamento. */
export type TuitionPaymentDetails = {
  pixKeyType?: string;
  pixKey?: string;
  boletoBank?: string;
  boletoDigitableLine?: string;
  boletoOurNumber?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardAuthCode?: string;
  bankName?: string;
  bankCode?: string;
  bankAgency?: string;
  bankAgencyDigit?: string;
  bankAccount?: string;
  bankAccountDigit?: string;
  bankAccountType?: string;
  beneficiaryName?: string;
  beneficiaryDocument?: string;
  receiptNumber?: string;
  receivedByName?: string;
  paymentNotes?: string;
};

export const PIX_KEY_TYPES = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "RANDOM", label: "Chave aleatória" },
] as const;

export const CARD_BRANDS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "AMEX", label: "American Express" },
  { value: "OUTRA", label: "Outra" },
] as const;

export const BANK_ACCOUNT_TYPES = [
  { value: "CORRENTE", label: "Conta corrente" },
  { value: "POUPANCA", label: "Conta poupança" },
  { value: "PAGAMENTO", label: "Conta pagamento" },
] as const;

export function emptyTuitionPaymentDetails(): TuitionPaymentDetails {
  return {};
}

const MAX_JSON_CHARS = 12_000;

function trimRecord(d: TuitionPaymentDetails): TuitionPaymentDetails {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t !== "") out[k] = t;
  }
  return out as TuitionPaymentDetails;
}

export function parseTuitionPaymentDetailsJson(raw: string | null | undefined): TuitionPaymentDetails {
  if (raw == null || raw.trim() === "") return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (v == null || typeof v !== "object" || Array.isArray(v)) return {};
    return trimRecord(v as TuitionPaymentDetails);
  } catch {
    return {};
  }
}

export function serializeTuitionPaymentDetailsJson(d: TuitionPaymentDetails): string | null {
  const t = trimRecord(d);
  if (Object.keys(t).length === 0) return null;
  const s = JSON.stringify(t);
  if (s.length > MAX_JSON_CHARS) return null;
  return s;
}

export function tuitionPaymentDetailsHasValues(d: TuitionPaymentDetails): boolean {
  return Object.keys(trimRecord(d)).length > 0;
}
