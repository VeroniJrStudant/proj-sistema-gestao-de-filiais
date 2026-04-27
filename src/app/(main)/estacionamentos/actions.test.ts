import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    branch: { findUnique: vi.fn() },
    parkingFacility: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteParkingFacility, saveParkingFacility } from "./actions";

function form(entries: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, v);
  }
  return f;
}

describe(`saveParkingFacility (${AREA.estacionamentosActions})`, () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita nome vazio", async () => {
    const r = await saveParkingFacility(form({ name: "" }));
    expect(r.ok, regression(AREA.estacionamentosActions, "nome obrigatório")).toBe(false);
  });

  it("rejeita filial inativa quando branchId informado", async () => {
    vi.mocked(prisma.branch.findUnique).mockResolvedValueOnce({ id: "b1", active: false } as never);
    const r = await saveParkingFacility(form({ name: "Garagem", branchId: "b1" }));
    expect(r.ok, regression(AREA.estacionamentosActions, "filial inativa")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/filial/i);
  });

  it("cria estacionamento", async () => {
    vi.mocked(prisma.parkingFacility.create).mockResolvedValueOnce({ id: "pk1" } as never);
    const r = await saveParkingFacility(form({ name: "Estacionamento Central" }));
    expect(r).toEqual({ ok: true, id: "pk1" });
  });

  it("P2002 em código duplicado", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    vi.mocked(prisma.parkingFacility.create).mockRejectedValueOnce(err);
    const r = await saveParkingFacility(form({ name: "X" }));
    expect(r.ok, regression(AREA.estacionamentosActions, "P2002")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/código/i);
  });

  it("deleteParkingFacility id vazio", async () => {
    const r = await deleteParkingFacility("  ");
    expect(r.ok, regression(AREA.estacionamentosActions, "delete id")).toBe(false);
  });
});
