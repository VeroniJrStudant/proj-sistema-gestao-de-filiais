import { parseTuitionPaymentMethod } from "./tuition-payment-options";
import {
  parseTuitionPaymentDetailsJson,
  serializeTuitionPaymentDetailsJson,
  emptyTuitionPaymentDetails,
  type TuitionPaymentDetails,
} from "./tuition-payment-details";

export type { TuitionPaymentDetails };

/** Apostilas / material didático no início do ano. */
export const DIDACTIC_MATERIALS_OPTIONS = [
  { value: "PAID_START", label: "Pago no início do ano letivo" },
  { value: "PAY_DURING_YEAR", label: "Será pago ao longo do ano letivo" },
  { value: "NOT_APPLICABLE", label: "Não se aplica / sem material neste formato" },
] as const;

const DIDACTIC_ALLOWED = new Set<string>(
  DIDACTIC_MATERIALS_OPTIONS.map((o) => o.value),
);

export function parseDidacticMaterialsPlan(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return DIDACTIC_ALLOWED.has(t) ? t : null;
}

export type EnrollmentFinanceSnapshot = {
  tuitionPaymentMethod: string;
  yearStartInstallmentsPaid: number | null;
  madeEntryPayment: boolean | null;
  didacticMaterialsPlan: string | null;
  owedPreviousSchoolYears: boolean | null;
  tuitionDiscountCents: number | null;
  tuitionMonthlyAmountCents: number | null;
  didacticMaterialsAmountCents: number | null;
  /** Data do pagamento / recibo (YYYY-MM-DD). */
  tuitionPaymentDate: string | null;
  tuitionPaymentDetails: TuitionPaymentDetails;
};

export function normalizeYearStartInstallmentsPaid(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 48) return null;
  return n;
}

export function normalizeMoneyCents(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return null;
  return n;
}

/** Entrada em texto pt-BR (vírgula decimal) → centavos. */
export function parseMoneyInputToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const noThousands = trimmed.replace(/\./g, "");
  const normalized = noThousands.replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n) || n < 0) return null;
  if (n > 9_999_999.99) return null;
  return Math.round(n * 100);
}

export function centsToMoneyInputString(cents: number | null): string {
  if (cents == null || cents < 0) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function parseTriBool(raw: string): boolean | null {
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return null;
}

export function triBoolToString(v: boolean | null | undefined): "" | "yes" | "no" {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "";
}

function parseTuitionPaymentDateInput(raw: string | null | undefined): Date | null {
  if (raw == null || raw.trim() === "") return null;
  const d = new Date(`${raw.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateOnlyForInput(d: Date | null | undefined): string | null {
  if (!d) return null;
  const iso = d.toISOString().slice(0, 10);
  return iso;
}

export function emptyEnrollmentFinanceSnapshot(): EnrollmentFinanceSnapshot {
  return {
    tuitionPaymentMethod: "",
    yearStartInstallmentsPaid: null,
    madeEntryPayment: null,
    didacticMaterialsPlan: null,
    owedPreviousSchoolYears: null,
    tuitionDiscountCents: null,
    tuitionMonthlyAmountCents: null,
    didacticMaterialsAmountCents: null,
    tuitionPaymentDate: null,
    tuitionPaymentDetails: emptyTuitionPaymentDetails(),
  };
}

/** Converte snapshot do formulário para colunas Prisma. */
export function snapshotToPrismaData(s: EnrollmentFinanceSnapshot) {
  const detailsJson = serializeTuitionPaymentDetailsJson(s.tuitionPaymentDetails);
  return {
    tuitionPaymentMethod: parseTuitionPaymentMethod(
      s.tuitionPaymentMethod === "" ? null : s.tuitionPaymentMethod,
    ),
    yearStartInstallmentsPaid: normalizeYearStartInstallmentsPaid(s.yearStartInstallmentsPaid),
    madeEntryPayment: s.madeEntryPayment,
    didacticMaterialsPlan: parseDidacticMaterialsPlan(s.didacticMaterialsPlan),
    owedPreviousSchoolYears: s.owedPreviousSchoolYears,
    tuitionDiscountCents: normalizeMoneyCents(s.tuitionDiscountCents),
    tuitionMonthlyAmountCents: normalizeMoneyCents(s.tuitionMonthlyAmountCents),
    didacticMaterialsAmountCents: normalizeMoneyCents(s.didacticMaterialsAmountCents),
    tuitionPaymentDate: parseTuitionPaymentDateInput(s.tuitionPaymentDate),
    tuitionPaymentDetailsJson: detailsJson,
  };
}

export { parseTuitionPaymentDetailsJson, emptyTuitionPaymentDetails };
