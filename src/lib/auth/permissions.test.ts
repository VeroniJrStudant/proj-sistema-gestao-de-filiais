import { describe, expect, it } from "vitest";
import { DEFAULT_PERMISSIONS_BY_ROLE, resolveStoredPermissions, sanitizePermissionsForRole } from "./permissions";

describe("auth/permissions", () => {
  it("sanitizePermissionsForRole filtra inválidas, fora do pool e duplicadas", () => {
    const out = sanitizePermissionsForRole("TEACHER", [
      "attendance.access",
      "attendance.access",
      "users.manage", // fora do pool TEACHER
      "nao-existe",
      "dashboard.view",
    ]);

    expect(out).toEqual(["attendance.access", "dashboard.view"]);
  });

  it("resolveStoredPermissions retorna defaults quando JSON inválido", () => {
    const out = resolveStoredPermissions("STUDENT", "{not-json");
    expect(out).toEqual([...DEFAULT_PERMISSIONS_BY_ROLE.STUDENT]);
  });

  it("resolveStoredPermissions retorna defaults quando não é array", () => {
    const out = resolveStoredPermissions("PARENT", JSON.stringify({ a: 1 }));
    expect(out).toEqual([...DEFAULT_PERMISSIONS_BY_ROLE.PARENT]);
  });

  it("resolveStoredPermissions sanitiza e mantém apenas permissões permitidas", () => {
    const out = resolveStoredPermissions("LEGAL_GUARDIAN", JSON.stringify(["finance.access", "users.manage"]));
    expect(out).toEqual(["finance.access"]);
  });

  it("resolveStoredPermissions retorna defaults quando sanitizado fica vazio", () => {
    const out = resolveStoredPermissions("TEACHER", JSON.stringify(["users.manage"]));
    expect(out).toEqual([...DEFAULT_PERMISSIONS_BY_ROLE.TEACHER]);
  });
});

