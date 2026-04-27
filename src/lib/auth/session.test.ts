import { describe, expect, it, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import type { SessionTokenPayload } from "./jwt";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userAccount: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("./jwt", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./jwt")>();
  return {
    ...mod,
    verifySessionToken: vi.fn(),
  };
});

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "./jwt";
import { requirePermission } from "./session";

describe("auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as never);
    vi.mocked(prisma.userAccount.findUnique).mockResolvedValue({ active: true });
  });

  it("requirePermission lança UNAUTHORIZED quando sem sessão", async () => {
    await expect(requirePermission("finance.access")).rejects.toThrow("UNAUTHORIZED");
    expect(verifySessionToken).not.toHaveBeenCalled();
  });

  it("requirePermission lança FORBIDDEN quando não tem permissão", async () => {
    vi.mocked(verifySessionToken).mockResolvedValueOnce({
      sub: "u1",
      email: "a@a.com",
      loginName: "a",
      displayName: "a",
      role: "ADMIN",
      permissions: ["dashboard.view"],
    } satisfies SessionTokenPayload);
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: "tok" }),
    } as never);

    await expect(requirePermission("finance.access")).rejects.toThrow("FORBIDDEN");
  });

  it("requirePermission retorna a sessão quando tem permissão", async () => {
    const payload: SessionTokenPayload = {
      sub: "u2",
      email: "b@b.com",
      loginName: "b",
      displayName: "b",
      role: "ADMIN",
      permissions: ["finance.access"],
    };
    vi.mocked(verifySessionToken).mockResolvedValueOnce(payload);
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: "tok" }),
    } as never);

    await expect(requirePermission("finance.access")).resolves.toMatchObject({ sub: "u2" });
  });
});
