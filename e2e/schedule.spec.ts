import { test, expect } from "@playwright/test";

test.describe("Schedule management", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder("tu@email.com").fill("jeny@horarios.app");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.getByText("Entrar").click();
    await expect(page.getByText("Horarios")).toBeVisible({ timeout: 10000 });
  });

  test("dashboard shows stats cards", async ({ page }) => {
    await expect(page.getByText("Miembros")).toBeVisible();
    await expect(page.getByText("Turnos")).toBeVisible();
    await expect(page.getByText("Borradores")).toBeVisible();
    await expect(page.getByText("Activos")).toBeVisible();
  });

  test("navigate to calendar view", async ({ page }) => {
    await page.getByText("Calendario").click();
    await expect(page.getByText("Semana").or(page.getByText("Mes"))).toBeVisible({ timeout: 5000 });
  });

  test("open config dialog", async ({ page }) => {
    await page.getByLabel("Configuracion").click();
    await expect(page.getByText("Generacion").or(page.getByText("Equipo"))).toBeVisible({ timeout: 5000 });
  });
});
