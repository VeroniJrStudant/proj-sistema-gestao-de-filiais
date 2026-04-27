"use server";

import { Prisma, ParkingFacilityStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export type SaveParkingResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveParkingFacility(formData: FormData): Promise<SaveParkingResult> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome do estacionamento." };

  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = (Object.values(ParkingFacilityStatus) as string[]).includes(statusRaw)
    ? (statusRaw as ParkingFacilityStatus)
    : ParkingFacilityStatus.ACTIVE;

  const branchId = emptyToNull(String(formData.get("branchId") ?? ""));
  if (branchId) {
    const b = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, active: true } });
    if (!b?.active) return { ok: false, error: "Filial inválida ou inativa." };
  }

  const capacityCars = parseIntOrNull(String(formData.get("capacityCars") ?? ""));
  const capacityMotorcycles = parseIntOrNull(String(formData.get("capacityMotorcycles") ?? ""));

  const data = {
    name,
    code: emptyToNull(String(formData.get("code") ?? "")),
    branchId,
    status,
    addressLabel: emptyToNull(String(formData.get("addressLabel") ?? "")),
    capacityCars,
    capacityMotorcycles,
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };

  try {
    if (id) {
      const exists = await prisma.parkingFacility.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return { ok: false, error: "Estacionamento não encontrado." };
      await prisma.parkingFacility.update({ where: { id }, data });
      revalidatePath("/estacionamentos");
      revalidatePath("/");
      return { ok: true, id };
    }
    const created = await prisma.parkingFacility.create({ data });
    revalidatePath("/estacionamentos");
    revalidatePath("/");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe um estacionamento com este código." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function deleteParkingFacility(idRaw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = idRaw.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };
  try {
    await prisma.parkingFacility.delete({ where: { id } });
    revalidatePath("/estacionamentos");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}

