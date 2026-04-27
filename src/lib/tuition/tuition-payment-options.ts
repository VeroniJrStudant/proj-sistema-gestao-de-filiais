/** Formas comuns de pagamento de mensalidade no Brasil (valor persistido no banco). */
export const TUITION_PAYMENT_OPTIONS = [
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto bancário" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência bancária (TED / DOC)" },
  { value: "DINHEIRO", label: "Dinheiro (presencial)" },
  { value: "DEBITO_AUTOMATICO", label: "Débito automático em conta" },
  { value: "OUTRO", label: "Outro / a combinar" },
] as const;

export type TuitionPaymentMethodCode = (typeof TUITION_PAYMENT_OPTIONS)[number]["value"];

const ALLOWED = new Set<string>(TUITION_PAYMENT_OPTIONS.map((o) => o.value));

export function parseTuitionPaymentMethod(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return ALLOWED.has(t) ? t : null;
}
