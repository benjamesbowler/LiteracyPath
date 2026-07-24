import { expect, test } from "@playwright/test";

const KEY_ROUTES = Object.freeze([
  { id: "student-home", label: "Student Home" },
  { id: "sound-seekers", label: "Sound Seekers" },
  { id: "story-quests", label: "Learn" },
  { id: "reading-library", label: "Guided Reading" },
  { id: "my-hollow", label: "My Hollow" }
]);

const TARGET_VIEWPORTS = Object.freeze([
  { id: "desktop", width: 1280, height: 900 },
  { id: "phone", width: 390, height: 844 }
]);

const DELAYED_ROUTES = Object.freeze([
  { id: "sound-seekers", label: "Loading Sound Seekers..." },
  { id: "story-quests", label: "Loading Story Quest..." },
  { id: "reading-library", label: "Loading Reading Library..." },
  { id: "my-hollow", label: "Loading your Hollow..." }
]);

async function waitForVisibleImages(page) {
  await page.waitForFunction(() => (
    [...document.images]
      .filter(image => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0
          && rect.bottom > 0 && rect.top < window.innerHeight
          && rect.right > 0 && rect.left < window.innerWidth;
      })
      .every(image => image.complete)
  ));
}

for (const viewport of TARGET_VIEWPORTS) {
  for (const route of KEY_ROUTES) {
    test(`A3.2 ${route.label} matches the ${viewport.id} visual baseline`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

      const surface = page.locator(`[data-child-surface="${route.id}"]`);
      await expect(surface).toBeVisible();
      await expect(surface.locator("[data-child-title]")).toBeVisible();
      await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
      await waitForVisibleImages(page);
      await expect.poll(async () => page.evaluate(() => (
        document.documentElement.scrollWidth <= window.innerWidth
      ))).toBe(true);
      await expect(page).toHaveScreenshot(`key-route-${route.id}-${viewport.id}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.01
      });
      expect(pageErrors).toEqual([]);
    });
  }
}

test("A3.2 Student Home keeps its complete hierarchy while card art is delayed", async ({ page }) => {
  await page.route("**/images/home-sage/**", async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html", { waitUntil: "domcontentloaded" });

  const home = page.locator('[data-child-surface="student-home"]');
  const primary = home.locator("[data-child-primary]");
  const firstPlaceholder = home.locator('[data-media-state="loading"]').first();
  await expect(firstPlaceholder).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(primary.locator(".hs-card-action")).toContainText("Continue Adventure Map");
  const placeholderBox = await firstPlaceholder.boundingBox();
  expect(placeholderBox?.width).toBeGreaterThan(300);
  expect(placeholderBox?.height).toBeGreaterThan(150);
  await expect(home.locator('[data-media-state="ready"]').first()).toBeVisible({ timeout: 10_000 });
});

for (const route of DELAYED_ROUTES) {
  test(`A3.2 ${route.id} exposes a named, stable placeholder during a delayed route load`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      `/preview/child-route-loading.html?surface=${route.id}&delay=1200`,
      { waitUntil: "domcontentloaded" }
    );

    const fallback = page.locator("[data-route-loading]");
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute("data-loading-label", route.label);
    await expect(fallback).toContainText(route.label);
    await expect(fallback.locator(".lazy-letter")).toHaveCount(3);
    const fallbackBox = await fallback.boundingBox();
    expect(fallbackBox?.height).toBeGreaterThanOrEqual(500);

    await expect(page.locator(`[data-child-surface="${route.id}"]`)).toBeVisible({
      timeout: 15_000
    });
    await expect(fallback).toHaveCount(0);
  });
}
