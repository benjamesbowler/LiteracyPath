import { test, expect } from "@playwright/test";

test("startup motion preference follows live OS changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tests/fixtures/reduced-motion.html");
  const preference = page.getByRole("status", { name: "Motion preference" });
  await expect(preference).toHaveText("reduced");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(preference).toHaveText("full");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preference).toHaveText("reduced");
});

test("teacher entry retains its appearance animation and honours reduced motion", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  const hero = page.locator(".auth-hero");
  await expect(hero).toBeVisible();
  await expect(hero).toHaveCSS("animation-name", "auth-hero-enter");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
});
