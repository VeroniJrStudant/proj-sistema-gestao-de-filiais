/** Valor de `payeeId` quando o lançamento é depósito em lote para todos os funcionários ativos. */
export const ALL_TEACHERS_DEPOSIT_PAYEE_ID = "__ALL_TEACHERS_DEPOSIT__";

export type BatchPayeeType = "SUPPLIER" | "TEACHER" | "OTHER";

export type BatchPaymentRowInput = {
  payeeType: BatchPayeeType;
  payeeId: string | null;
  otherName: string | null;
  amountBrl: string;
  dueDate: string | null;
  settledDate: string | null;
  notes: string | null;
  barcodeLine: string | null;
  referenceDocument: string | null;
};
