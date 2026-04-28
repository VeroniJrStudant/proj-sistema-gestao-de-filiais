"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import type { CompanySettingsFormValues } from "@/lib/company-settings";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function normalizeUf(s: string): string | null {
  const t = s.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (t.length === 0) return null;
  return t.slice(0, 2);
}

export async function saveCompanySettings(
  values: CompanySettingsFormValues,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePermission("users.manage");
  } catch {
    return { ok: false, error: "Sem permissão para alterar os dados da empresa." };
  }

  const state = normalizeUf(values.state);
  if (values.state.trim() && state === null) {
    return { ok: false, error: "UF inválida (use 2 letras, ex.: SP)." };
  }

  const financeEmail = trimOrNull(values.financeEmail);
  if (financeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(financeEmail)) {
    return { ok: false, error: "E-mail financeiro inválido." };
  }

  try {
    await prisma.companySettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        legalName: trimOrNull(values.legalName),
        tradeName: trimOrNull(values.tradeName),
        cnpj: trimOrNull(values.cnpj),
        stateRegistration: trimOrNull(values.stateRegistration),
        municipalRegistration: trimOrNull(values.municipalRegistration),
        phone: trimOrNull(values.phone),
        financeEmail,
        website: trimOrNull(values.website),
        street: trimOrNull(values.street),
        number: trimOrNull(values.number),
        complement: trimOrNull(values.complement),
        neighborhood: trimOrNull(values.neighborhood),
        city: trimOrNull(values.city),
        state,
        zip: trimOrNull(values.zip),
        bankCode: trimOrNull(values.bankCode),
        bankName: trimOrNull(values.bankName),
        agency: trimOrNull(values.agency),
        agencyDigit: trimOrNull(values.agencyDigit),
        accountNumber: trimOrNull(values.accountNumber),
        accountDigit: trimOrNull(values.accountDigit),
        accountType: trimOrNull(values.accountType),
        pixKey: trimOrNull(values.pixKey),
        pixKeyType: trimOrNull(values.pixKeyType),
        boletoConvenio: trimOrNull(values.boletoConvenio),
        boletoCarteira: trimOrNull(values.boletoCarteira),
        boletoVariacao: trimOrNull(values.boletoVariacao),
        boletoInstrucoes: trimOrNull(values.boletoInstrucoes),
        boletoBatchNotes: trimOrNull(values.boletoBatchNotes),
        invoicePaymentNotes: trimOrNull(values.invoicePaymentNotes),
        depositNotes: trimOrNull(values.depositNotes),
        nfeNotes: trimOrNull(values.nfeNotes),
      },
      update: {
        legalName: trimOrNull(values.legalName),
        tradeName: trimOrNull(values.tradeName),
        cnpj: trimOrNull(values.cnpj),
        stateRegistration: trimOrNull(values.stateRegistration),
        municipalRegistration: trimOrNull(values.municipalRegistration),
        phone: trimOrNull(values.phone),
        financeEmail,
        website: trimOrNull(values.website),
        street: trimOrNull(values.street),
        number: trimOrNull(values.number),
        complement: trimOrNull(values.complement),
        neighborhood: trimOrNull(values.neighborhood),
        city: trimOrNull(values.city),
        state,
        zip: trimOrNull(values.zip),
        bankCode: trimOrNull(values.bankCode),
        bankName: trimOrNull(values.bankName),
        agency: trimOrNull(values.agency),
        agencyDigit: trimOrNull(values.agencyDigit),
        accountNumber: trimOrNull(values.accountNumber),
        accountDigit: trimOrNull(values.accountDigit),
        accountType: trimOrNull(values.accountType),
        pixKey: trimOrNull(values.pixKey),
        pixKeyType: trimOrNull(values.pixKeyType),
        boletoConvenio: trimOrNull(values.boletoConvenio),
        boletoCarteira: trimOrNull(values.boletoCarteira),
        boletoVariacao: trimOrNull(values.boletoVariacao),
        boletoInstrucoes: trimOrNull(values.boletoInstrucoes),
        boletoBatchNotes: trimOrNull(values.boletoBatchNotes),
        invoicePaymentNotes: trimOrNull(values.invoicePaymentNotes),
        depositNotes: trimOrNull(values.depositNotes),
        nfeNotes: trimOrNull(values.nfeNotes),
      },
    });
    revalidatePath("/financeiro");
    revalidatePath("/financeiro/configuracao-empresa");
    revalidatePath("/financeiro/pix-impresso");
    revalidatePath("/financeiro/entradas/pix-impresso");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}
