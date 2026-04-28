"use server";

import {
  Prisma,
  CustomerBillingProfile,
  CustomerDocumentType,
  CustomerKind,
  CustomerOperationLinkKind,
  ParkingFacilityStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function parseIntOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseMoneyToCentsOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const norm = t.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

const PAYMENT_CODES = new Set<string>(TUITION_PAYMENT_OPTIONS.map((o) => o.value));

function parsePreferredPaymentMethodsJson(formData: FormData): string {
  const raw = formData.getAll("preferredPaymentMethod").map((v) => String(v).trim());
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (!PAYMENT_CODES.has(r)) continue;
    if (seen.has(r)) continue;
    seen.add(r);
    uniq.push(r);
  }
  return JSON.stringify(uniq);
}

function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
}

type OperationFks = {
  operationLinkKind: CustomerOperationLinkKind;
  branchId: string | null;
  propertyId: string | null;
  parkingFacilityId: string | null;
};

async function parseOperationLinkFields(
  formData: FormData,
  existingCustomerId: string | null,
): Promise<{ ok: false; error: string } | { ok: true; links: OperationFks }> {
  const kindRaw = String(formData.get("operationLinkKind") ?? "").trim();
  const operationLinkKind = (Object.values(CustomerOperationLinkKind) as string[]).includes(kindRaw)
    ? (kindRaw as CustomerOperationLinkKind)
    : CustomerOperationLinkKind.NONE;

  const entityIdRaw = emptyToNull(String(formData.get("operationEntityId") ?? ""));

  const emptyLinks: OperationFks = {
    operationLinkKind: CustomerOperationLinkKind.NONE,
    branchId: null,
    propertyId: null,
    parkingFacilityId: null,
  };

  if (operationLinkKind === CustomerOperationLinkKind.NONE) {
    return { ok: true, links: emptyLinks };
  }

  if (!entityIdRaw) {
    return {
      ok: false,
      error: 'Selecione o cadastro vinculado ou altere o tipo para "Nenhum (qualquer)".',
    };
  }

  const cur =
    existingCustomerId ?
      await prisma.customer.findUnique({
        where: { id: existingCustomerId },
        select: {
          operationLinkKind: true,
          branchId: true,
          propertyId: true,
          parkingFacilityId: true,
        },
      })
    : null;

  switch (operationLinkKind) {
    case CustomerOperationLinkKind.BRANCH: {
      const b = await prisma.branch.findUnique({ where: { id: entityIdRaw }, select: { id: true, active: true } });
      if (!b) return { ok: false, error: "Filial inválida." };
      if (!b.active) {
        if (cur?.operationLinkKind !== CustomerOperationLinkKind.BRANCH || cur.branchId !== b.id) {
          return { ok: false, error: "Filial inativa. Escolha outra ou use \"Nenhum (qualquer)\"." };
        }
      }
      return {
        ok: true,
        links: {
          operationLinkKind,
          branchId: b.id,
          propertyId: null,
          parkingFacilityId: null,
        },
      };
    }
    case CustomerOperationLinkKind.PROPERTY: {
      const p = await prisma.property.findUnique({ where: { id: entityIdRaw }, select: { id: true, active: true } });
      if (!p) return { ok: false, error: "Imóvel inválido." };
      if (!p.active) {
        if (cur?.operationLinkKind !== CustomerOperationLinkKind.PROPERTY || cur.propertyId !== p.id) {
          return { ok: false, error: "Imóvel inativo. Escolha outro ou use \"Nenhum (qualquer)\"." };
        }
      }
      return {
        ok: true,
        links: {
          operationLinkKind,
          branchId: null,
          propertyId: p.id,
          parkingFacilityId: null,
        },
      };
    }
    case CustomerOperationLinkKind.PARKING_FACILITY: {
      const pf = await prisma.parkingFacility.findUnique({
        where: { id: entityIdRaw },
        select: { id: true, status: true },
      });
      if (!pf) return { ok: false, error: "Estacionamento inválido." };
      if (pf.status === ParkingFacilityStatus.INACTIVE) {
        if (
          cur?.operationLinkKind !== CustomerOperationLinkKind.PARKING_FACILITY ||
          cur.parkingFacilityId !== pf.id
        ) {
          return { ok: false, error: "Estacionamento inativo. Escolha outro ou use \"Nenhum (qualquer)\"." };
        }
      }
      return {
        ok: true,
        links: {
          operationLinkKind,
          branchId: null,
          propertyId: null,
          parkingFacilityId: pf.id,
        },
      };
    }
    default:
      return { ok: true, links: emptyLinks };
  }
}

export type SaveCustomerResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveCustomer(formData: FormData): Promise<SaveCustomerResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome do cliente." };

  const kindRaw = String(formData.get("kind") ?? "").trim();
  const kind = (Object.values(CustomerKind) as string[]).includes(kindRaw) ? (kindRaw as CustomerKind) : CustomerKind.PERSON;

  const docTypeRaw = String(formData.get("documentType") ?? "").trim();
  const documentType = (Object.values(CustomerDocumentType) as string[]).includes(docTypeRaw)
    ? (docTypeRaw as CustomerDocumentType)
    : CustomerDocumentType.OTHER;

  const billingRaw = String(formData.get("billingProfile") ?? "").trim();
  const billingProfile = (Object.values(CustomerBillingProfile) as string[]).includes(billingRaw)
    ? (billingRaw as CustomerBillingProfile)
    : CustomerBillingProfile.AVULSO;

  const linkResult = await parseOperationLinkFields(formData, id);
  if (!linkResult.ok) return linkResult;

  const preferredDueDay = parseIntOrNull(String(formData.get("preferredDueDay") ?? ""));
  if (preferredDueDay != null && (preferredDueDay < 1 || preferredDueDay > 31)) {
    return { ok: false, error: "Dia de vencimento inválido (1–31)." };
  }

  const suggestedAmountCents = parseMoneyToCentsOrNull(String(formData.get("suggestedAmount") ?? ""));
  const preferredPaymentMethodsJson = parsePreferredPaymentMethodsJson(formData);
  const notes = emptyToNull(String(formData.get("notes") ?? ""));
  if (notes && notes.length > 2000) return { ok: false, error: "Observações muito longas (máx. 2000)." };

  const documentRaw = emptyToNull(String(formData.get("document") ?? ""));
  const documentDigits = documentRaw ? normalizeDigits(documentRaw) : "";
  if (documentType === CustomerDocumentType.CPF && documentDigits && documentDigits.length !== 11) {
    return { ok: false, error: "CPF inválido (11 dígitos)." };
  }
  if (documentType === CustomerDocumentType.CNPJ && documentDigits && documentDigits.length !== 14) {
    return { ok: false, error: "CNPJ inválido (14 dígitos)." };
  }

  const data = {
    ...linkResult.links,
    kind,
    name,
    tradeName: emptyToNull(String(formData.get("tradeName") ?? "")),
    documentType,
    document: documentRaw,
    phone: emptyToNull(String(formData.get("phone") ?? "")),
    email: emptyToNull(String(formData.get("email") ?? "")),
    street: emptyToNull(String(formData.get("street") ?? "")),
    number: emptyToNull(String(formData.get("number") ?? "")),
    complement: emptyToNull(String(formData.get("complement") ?? "")),
    neighborhood: emptyToNull(String(formData.get("neighborhood") ?? "")),
    city: emptyToNull(String(formData.get("city") ?? "")),
    state: emptyToNull(String(formData.get("state") ?? "")),
    zip: emptyToNull(String(formData.get("zip") ?? "")),
    billingProfile,
    preferredDueDay,
    suggestedAmountCents,
    preferredPaymentMethodsJson,
    notes,
    active: formData.get("active") === "on",
  };

  try {
    if (id) {
      const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Cliente não encontrado." };
      await prisma.customer.update({ where: { id }, data });
      revalidatePath("/clientes");
      return { ok: true, id };
    }
    const created = await prisma.customer.create({ data });
    revalidatePath("/clientes");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe um cliente com este documento." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteCustomer(idRaw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = idRaw.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/clientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
