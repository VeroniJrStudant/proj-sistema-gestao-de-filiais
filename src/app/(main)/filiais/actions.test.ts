import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    branch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { deleteBranch, saveBranch } from "./actions";

function form(entries: Record<string, string | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, v);
  }
  return f;
}

describe(`saveBranch / deleteBranch (${AREA.filiaisActions})`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita nome vazio (validação de entrada)", async () => {
    const r = await saveBranch(form({ name: "   " }));
    expect(r.ok, regression(AREA.filiaisActions, "nome vazio → ok:false")).toBe(false);
    if (!r.ok) {
      expect(r.error, regression(AREA.filiaisActions, "mensagem deve mencionar nome")).toMatch(/nome/i);
    }
    expect(prisma.branch.create).not.toHaveBeenCalled();
  });

  it("rejeita código acima de 32 caracteres", async () => {
    const r = await saveBranch(
      form({
        name: "Filial X",
        code: "x".repeat(33),
      }),
    );
    expect(r.ok, regression(AREA.filiaisActions, "código > 32 chars")).toBe(false);
    expect(prisma.branch.create).not.toHaveBeenCalled();
  });

  it("cria filial e retorna id", async () => {
    vi.mocked(prisma.branch.create).mockResolvedValueOnce({ id: "b-new" } as never);
    const r = await saveBranch(
      form({
        name: "Matriz",
        active: "on",
      }),
    );
    expect(r, regression(AREA.filiaisActions, "create bem-sucedido → ok:true + id")).toEqual({
      ok: true,
      id: "b-new",
    });
    expect(prisma.branch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Matriz", active: true }),
      }),
    );
  });

  it("falha update quando filial não existe", async () => {
    vi.mocked(prisma.branch.findUnique).mockResolvedValueOnce(null);
    const r = await saveBranch(
      form({
        id: "missing",
        name: "X",
      }),
    );
    expect(r.ok, regression(AREA.filiaisActions, "update sem registro")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/não encontrada/i);
    expect(prisma.branch.update).not.toHaveBeenCalled();
  });

  it("retorna erro amigável em violação de unicidade (P2002)", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    vi.mocked(prisma.branch.create).mockRejectedValueOnce(err);
    const r = await saveBranch(form({ name: "Dup" }));
    expect(r.ok, regression(AREA.filiaisActions, "P2002 → mensagem de código duplicado")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/código/i);
  });

  it("deleteBranch rejeita id vazio", async () => {
    const r = await deleteBranch("  ");
    expect(r.ok, regression(AREA.filiaisActions, "id vazio no delete")).toBe(false);
    expect(prisma.branch.delete).not.toHaveBeenCalled();
  });

  it("deleteBranch propaga falha do banco", async () => {
    vi.mocked(prisma.branch.delete).mockRejectedValueOnce(new Error("FK"));
    const r = await deleteBranch("b1");
    expect(r.ok, regression(AREA.filiaisActions, "delete com exceção → ok:false")).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/vínculos/i);
  });
});
