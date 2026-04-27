export type StudentFinanceContractRow = {
  id: string;
  name: string;
  matricula: string | null;
  active: boolean;
  /** ISO — cadastro do aluno. */
  createdAt: string;
  shiftId: string | null;
  shiftName: string | null;
  classRoomId: string | null;
  classRoomLabel: string | null;
  tuitionPaymentMethod: string | null;
  yearStartInstallmentsPaid: number | null;
  madeEntryPayment: boolean | null;
  didacticMaterialsPlan: string | null;
  owedPreviousSchoolYears: boolean | null;
};

export type ShiftOption = { id: string; name: string };
export type ClassRoomOption = { id: string; name: string; shiftId: string; room: string | null };

export type AcceptedMethodRow = {
  id: string;
  code: string;
  active: boolean;
  sortOrder: number;
  notes: string | null;
};
