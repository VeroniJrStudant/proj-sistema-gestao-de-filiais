import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteTenant, saveTenant } from "./actions";

function form(entries: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, v);
  }
  return f;
}

describe(`saveTenant / deleteTenant (${AREA.locatariosActions})`, () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita nome vazio", async () => {
    const r = await saveTenant(form({ name: "" }));
    expect(r.ok, regression(AREA.locatariosActions, "nome obrigatório")).toBe(false);
  });

  it("cria locatário", async () => {
    vi.mocked(prisma.tenant.create).mockResolvedValueOnce({ id: "t1" } as never);
    const r = await saveTenant(form({ name: "João", type: "PERSON" }));
    expect(r).toEqual({ ok: true, id: "t1" });
  });

  it("update falha se não existir", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null);
    const r = await saveTenant(form({ id: "x", name: "Y" }));
    expect(r.ok, regression(AREA.locatariosActions, "update sem registro")).toBe(false);
  });

  it("P2002 retorna registro duplicado", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    vi.mocked(prisma.tenant.create).mockRejectedValueOnce(err);
    const r = await saveTenant(form({ name: "Dup" }));
    expect(r.ok, regression(AREA.locatariosActions, "P2002")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/duplicado/i);
  });

  it("deleteTenant id vazio", async () => {
    const r = await deleteTenant("");
    expect(r.ok, regression(AREA.locatariosActions, "delete id")).toBe(false);
  });
});
