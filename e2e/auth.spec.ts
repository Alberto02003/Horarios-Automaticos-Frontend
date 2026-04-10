import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Bienvenida")).toBeVisible();
    await expect(page.getByPlaceholder("tu@email.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("tu@email.com").fill("jeny@horarios.app");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.getByText("Entrar").click();

    // Should navigate to dashboard
    await expect(page.getByText("Horarios")).toBeVisible({ timeout: 10000 });
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("tu@email.com").fill("wrong@test.com");
    await page.getByPlaceholder("••••••••").fill("wrong");
    await page.getByText("Entrar").click();

    await expect(page.getByText("Credenciales incorrectas").or(page.getByText("Sesion expirada"))).toBeVisible({ timeout: 5000 });
  });
});
