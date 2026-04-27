import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("login page carrega", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("rota protegida redireciona para /login quando sem sessão", async ({ page }) => {
    await page.goto("/financeiro");
    await expect(page).toHaveURL((raw) => {
      const u = new URL(raw);
      return u.pathname === "/login" && u.searchParams.get("from") === "/financeiro";
    });
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});
