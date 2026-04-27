import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    branch: { findUnique: vi.fn() },
    property: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteProperty, saveProperty } from "./actions";

function form(entries: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, v);
  }
  return f;
}

describe(`saveProperty / deleteProperty (${AREA.imoveisActions})`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita nome vazio", async () => {
    const r = await saveProperty(form({ name: "" }));
    expect(r.ok, regression(AREA.imoveisActions, "nome obrigatório")).toBe(false);
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it("rejeita filial inexistente ou inativa", async () => {
    vi.mocked(prisma.branch.findUnique).mockResolvedValueOnce(null);
    const r = await saveProperty(
      form({
        name: "Casa 1",
        branchId: "b1",
      }),
    );
    expect(r.ok, regression(AREA.imoveisActions, "branchId inválida/inativa")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/filial/i);
  });

  it("rejeita valor de aluguel sugerido negativo", async () => {
    const r = await saveProperty(
      form({
        name: "Casa 1",
        rentSuggestedCents: "-1",
      }),
    );
    expect(r.ok, regression(AREA.imoveisActions, "rentSuggestedCents < 0")).toBe(false);
  });

  it("cria imóvel", async () => {
    vi.mocked(prisma.property.create).mockResolvedValueOnce({ id: "p1" } as never);
    const r = await saveProperty(form({ name: "Apartamento", active: "on" }));
    expect(r, regression(AREA.imoveisActions, "create ok")).toEqual({ ok: true, id: "p1" });
  });

  it("P2002 retorna mensagem de código duplicado", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    vi.mocked(prisma.property.create).mockRejectedValueOnce(err);
    const r = await saveProperty(form({ name: "X" }));
    expect(r.ok, regression(AREA.imoveisActions, "P2002 código")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/código/i);
  });

  it("deleteProperty com id vazio", async () => {
    const r = await deleteProperty(" ");
    expect(r.ok, regression(AREA.imoveisActions, "delete id vazio")).toBe(false);
  });
});
