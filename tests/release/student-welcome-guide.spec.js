import { expect, test } from "@playwright/test";

const GUIDE_KEY = "lp-student-welcome-guide-v1:student-home-preview";

test.beforeEach(async ({ page }) => {
  await page.goto("/preview/student-home-preview.html");
  await page.evaluate(key => window.localStorage.removeItem(key), GUIDE_KEY);
});

test("a first student login gets a readable, keyboard-safe tour that Help can replay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/student-home-preview.html?scenario=onboarding&login=first");

  const dialog = page.getByRole("dialog", { name: "Your best next step" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Your best next step" })).toBeFocused();
  await expect(page.locator(".kg-header")).toHaveJSProperty("inert", true);
  await expect(page.locator(".kg-tabbar")).toHaveJSProperty("inert", true);
  await expect(page.locator('[data-child-surface="student-home"]')).toHaveJSProperty("inert", true);

  await dialog.getByRole("button", { name: "Hear this help" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-student-guide-spoken",
    /Welcome, Aaron\. Your best next step\./
  );

  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "You can choose, too" })).toBeFocused();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Help is always here" })).toBeFocused();
  await page.getByRole("button", { name: "Let’s go" }).click();
  await expect(dialog).toBeHidden();

  const help = page.getByRole("button", { name: "Help: show me around" });
  await help.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(help).toBeFocused();
});

test("the second and third logins get small reminders, then automatic help stops", async ({ page }) => {
  await page.goto("/preview/student-home-preview.html?scenario=onboarding&login=first");
  await page.getByRole("button", { name: "Skip for now" }).click();

  await page.goto("/preview/student-home-preview.html?scenario=onboarding&login=second");
  const reminder = page.getByRole("dialog", { name: "Want a quick tour?" });
  await expect(reminder).toBeVisible();
  await reminder.getByRole("button", { name: "Not now" }).click();

  await page.goto("/preview/student-home-preview.html?scenario=onboarding&login=third");
  await expect(reminder).toBeVisible();
  await reminder.getByRole("button", { name: "Show me" }).click();
  await expect(page.getByRole("dialog", { name: "Your best next step" })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();

  await page.goto("/preview/student-home-preview.html?scenario=onboarding&login=fourth");
  await expect(reminder).toHaveCount(0);
  await expect(page.locator("[data-student-welcome-guide]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Help: show me around" })).toBeVisible();
});

for (const viewport of [
  { id: "tablet portrait", width: 768, height: 1024 },
  { id: "tablet landscape", width: 1024, height: 768 }
]) {
  test(`the welcome tour fits ${viewport.id} with full-size controls`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`/preview/student-home-preview.html?scenario=onboarding&login=${encodeURIComponent(viewport.id)}`);
    const dialog = page.getByRole("dialog", { name: "Your best next step" });
    await expect(dialog).toBeVisible();

    const result = await dialog.evaluate((element, size) => {
      const dialogBox = element.getBoundingClientRect();
      const controls = [...element.querySelectorAll("button:not([disabled])")].map(control => {
        const box = control.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
      return {
        inViewport: dialogBox.left >= -1
          && dialogBox.top >= -1
          && dialogBox.right <= size.width + 1
          && dialogBox.bottom <= size.height + 1,
        controls,
        overflowX: document.documentElement.scrollWidth - window.innerWidth
      };
    }, viewport);

    expect(result.inViewport).toBe(true);
    expect(result.overflowX).toBe(0);
    expect(result.controls.length).toBeGreaterThan(0);
    expect(result.controls.filter(control => control.width < 44 || control.height < 44)).toEqual([]);
  });
}
