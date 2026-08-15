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
        let visibleLeft = Math.max(0, rect.left);
        let visibleTop = Math.max(0, rect.top);
        let visibleRight = Math.min(window.innerWidth, rect.right);
        let visibleBottom = Math.min(window.innerHeight, rect.bottom);
        let ancestor = image.parentElement;

        while (ancestor && visibleRight > visibleLeft && visibleBottom > visibleTop) {
          const style = getComputedStyle(ancestor);
          const clipsX = /(auto|hidden|scroll|clip)/.test(style.overflowX);
          const clipsY = /(auto|hidden|scroll|clip)/.test(style.overflowY);
          if (clipsX || clipsY) {
            const ancestorRect = ancestor.getBoundingClientRect();
            if (clipsX) {
              visibleLeft = Math.max(visibleLeft, ancestorRect.left);
              visibleRight = Math.min(visibleRight, ancestorRect.right);
            }
            if (clipsY) {
              visibleTop = Math.max(visibleTop, ancestorRect.top);
              visibleBottom = Math.min(visibleBottom, ancestorRect.bottom);
            }
          }
          ancestor = ancestor.parentElement;
        }

        return rect.width > 0
          && rect.height > 0
          && visibleRight > visibleLeft
          && visibleBottom > visibleTop;
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
  let releaseImages;
  const imagesReleased = new Promise(resolve => {
    releaseImages = resolve;
  });
  const holdImage = async route => {
    await imagesReleased;
    await route.continue();
  };
  await page.route("**/images/home-sage/**", holdImage);
  await page.route("**/images/backdrops/**", holdImage);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview/student-home-preview.html", { waitUntil: "domcontentloaded" });

  const home = page.locator('[data-child-surface="student-home"]');
  const primary = home.locator("[data-child-primary]");
  const firstPlaceholder = home.locator('[data-media-state="loading"]').first();
  await expect(firstPlaceholder).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAccessibleName(/Continue Adventure Map/);
  const placeholderBox = await firstPlaceholder.boundingBox();
  expect(placeholderBox?.width).toBeGreaterThan(300);
  expect(placeholderBox?.height).toBeGreaterThan(150);
  releaseImages();
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
