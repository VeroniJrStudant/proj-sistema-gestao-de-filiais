import { describe, expect, it, vi } from "vitest";
import { signPending2FAToken, signSessionToken, verifyPending2FAToken, verifySessionToken } from "./jwt";

describe("auth/jwt", () => {
  it("assina e verifica session token (roundtrip)", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
    const token = await signSessionToken(
      {
        sub: "user_1",
        email: "a@b.com",
        loginName: "ab",
        displayName: "A B",
        role: "ADMIN",
        permissions: ["finance.access", "users.manage"],
      },
      60,
    );

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user_1");
    expect(payload?.role).toBe("ADMIN");
    expect(payload?.permissions).toContain("finance.access");
  });

  it("verifySessionToken retorna null se token não é do tipo esperado", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
    const token = await signPending2FAToken("user_2", 60);
    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();
  });

  it("verifyPending2FAToken retorna userId no roundtrip", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
    const token = await signPending2FAToken("user_3", 60);
    const userId = await verifyPending2FAToken(token);
    expect(userId).toBe("user_3");
  });

  it("em produção, AUTH_SECRET curto deve lançar erro", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.stubEnv("AUTH_SECRET", "short-secret");
    await expect(
      signSessionToken(
        {
          sub: "user_4",
          email: "c@d.com",
          loginName: "cd",
          displayName: "C D",
          role: "ADMIN",
          permissions: ["dashboard.view"],
        },
        60,
      ),
    ).rejects.toThrow(/AUTH_SECRET/);
    process.env.NODE_ENV = prev;
  });
});

