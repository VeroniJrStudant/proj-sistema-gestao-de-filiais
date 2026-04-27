import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

export type CompanySettingsFormValues = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  phone: string;
  financeEmail: string;
  website: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  bankCode: string;
  bankName: string;
  agency: string;
  agencyDigit: string;
  accountNumber: string;
  accountDigit: string;
  accountType: string;
  pixKey: string;
  pixKeyType: string;
  boletoConvenio: string;
  boletoCarteira: string;
  boletoVariacao: string;
  boletoInstrucoes: string;
  boletoBatchNotes: string;
  invoicePaymentNotes: string;
  depositNotes: string;
  nfeNotes: string;
};

export function emptyCompanySettingsForm(): CompanySettingsFormValues {
  return {
    legalName: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    municipalRegistration: "",
    phone: "",
    financeEmail: "",
    website: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    bankCode: "",
    bankName: "",
    agency: "",
    agencyDigit: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "",
    pixKey: "",
    pixKeyType: "",
    boletoConvenio: "",
    boletoCarteira: "",
    boletoVariacao: "",
    boletoInstrucoes: "",
    boletoBatchNotes: "",
    invoicePaymentNotes: "",
    depositNotes: "",
    nfeNotes: "",
  };
}

function rowToForm(row: {
  legalName: string | null;
  tradeName: string | null;
  cnpj: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  phone: string | null;
  financeEmail: string | null;
  website: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  bankCode: string | null;
  bankName: string | null;
  agency: string | null;
  agencyDigit: string | null;
  accountNumber: string | null;
  accountDigit: string | null;
  accountType: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
  boletoConvenio: string | null;
  boletoCarteira: string | null;
  boletoVariacao: string | null;
  boletoInstrucoes: string | null;
  boletoBatchNotes: string | null;
  invoicePaymentNotes: string | null;
  depositNotes: string | null;
  nfeNotes: string | null;
}): CompanySettingsFormValues {
  return {
    legalName: row.legalName ?? "",
    tradeName: row.tradeName ?? "",
    cnpj: row.cnpj ?? "",
    stateRegistration: row.stateRegistration ?? "",
    municipalRegistration: row.municipalRegistration ?? "",
    phone: row.phone ?? "",
    financeEmail: row.financeEmail ?? "",
    website: row.website ?? "",
    street: row.street ?? "",
    number: row.number ?? "",
    complement: row.complement ?? "",
    neighborhood: row.neighborhood ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
    bankCode: row.bankCode ?? "",
    bankName: row.bankName ?? "",
    agency: row.agency ?? "",
    agencyDigit: row.agencyDigit ?? "",
    accountNumber: row.accountNumber ?? "",
    accountDigit: row.accountDigit ?? "",
    accountType: row.accountType ?? "",
    pixKey: row.pixKey ?? "",
    pixKeyType: row.pixKeyType ?? "",
    boletoConvenio: row.boletoConvenio ?? "",
    boletoCarteira: row.boletoCarteira ?? "",
    boletoVariacao: row.boletoVariacao ?? "",
    boletoInstrucoes: row.boletoInstrucoes ?? "",
    boletoBatchNotes: row.boletoBatchNotes ?? "",
    invoicePaymentNotes: row.invoicePaymentNotes ?? "",
    depositNotes: row.depositNotes ?? "",
    nfeNotes: row.nfeNotes ?? "",
  };
}

export async function loadCompanySettingsForm(): Promise<CompanySettingsFormValues> {
  const row = await prisma.companySettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) {
    return emptyCompanySettingsForm();
  }
  return rowToForm(row);
}

export async function getSchoolDisplayName(): Promise<string> {
  const row = await prisma.companySettings.findUnique({ where: { id: SETTINGS_ID } });
  const fromDb = row?.tradeName?.trim() || row?.legalName?.trim();
  if (fromDb) {
    return fromDb;
  }
  return process.env.SCHOOL_NAME?.trim() || process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "Creche";
}
