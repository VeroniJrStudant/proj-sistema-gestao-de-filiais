import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: vi.fn() },
    tenant: { findUnique: vi.fn() },
    leaseContract: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteLease, saveLease } from "./actions";

function form(entries: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, v);
  }
  return f;
}

const validBase = {
  propertyId: "p1",
  tenantId: "t1",
  startsAt: "2026-01-15",
  dueDay: "10",
  monthlyRentCents: "100000",
  status: "ACTIVE",
};

describe(`saveLease / deleteLease (${AREA.locacoesActions})`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ id: "p1", active: true } as never);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: "t1" } as never);
  });

  it("rejeita sem imóvel", async () => {
    const r = await saveLease(form({ ...validBase, propertyId: "" }));
    expect(r.ok, regression(AREA.locacoesActions, "propertyId obrigatório")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/imóvel/i);
  });

  it("rejeita sem locatário", async () => {
    const r = await saveLease(form({ ...validBase, tenantId: "" }));
    expect(r.ok, regression(AREA.locacoesActions, "tenantId obrigatório")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/locatário/i);
  });

  it("rejeita data de início inválida", async () => {
    const r = await saveLease(form({ ...validBase, startsAt: "not-a-date" }));
    expect(r.ok, regression(AREA.locacoesActions, "startsAt parseável")).toBe(false);
  });

  it("rejeita dia de vencimento fora de 1–31", async () => {
    const r = await saveLease(form({ ...validBase, dueDay: "32" }));
    expect(r.ok, regression(AREA.locacoesActions, "dueDay 1-31")).toBe(false);
  });

  it("rejeita valor mensal <= 0", async () => {
    const r = await saveLease(form({ ...validBase, monthlyRentCents: "0" }));
    expect(r.ok, regression(AREA.locacoesActions, "monthlyRentCents > 0")).toBe(false);
  });

  it("rejeita caução/depósito não numérico", async () => {
    const r = await saveLease(form({ ...validBase, depositCents: "abc" }));
    expect(r.ok, regression(AREA.locacoesActions, "depositCents numérico")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/caução|depósito/i);
  });

  it("rejeita imóvel inativo", async () => {
    vi.mocked(prisma.property.findUnique).mockResolvedValueOnce({ id: "p1", active: false } as never);
    const r = await saveLease(form(validBase));
    expect(r.ok, regression(AREA.locacoesActions, "property.active")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/inativo/i);
  });

  it("rejeita locatário inexistente", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null);
    const r = await saveLease(form(validBase));
    expect(r.ok, regression(AREA.locacoesActions, "tenant exists")).toBe(false);
  });

  it("cria contrato", async () => {
    vi.mocked(prisma.leaseContract.create).mockResolvedValueOnce({ id: "lc1" } as never);
    const r = await saveLease(form(validBase));
    expect(r, regression(AREA.locacoesActions, "create ok")).toEqual({ ok: true, id: "lc1" });
  });

  it("PrismaClientKnownRequestError mapeia para mensagem de campos", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("x", { code: "P2003", clientVersion: "test" });
    vi.mocked(prisma.leaseContract.create).mockRejectedValueOnce(err);
    const r = await saveLease(form(validBase));
    expect(r.ok, regression(AREA.locacoesActions, "erro Prisma conhecido")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/campos/i);
  });

  it("deleteLease id vazio", async () => {
    const r = await deleteLease(" ");
    expect(r.ok, regression(AREA.locacoesActions, "delete id")).toBe(false);
  });
});
