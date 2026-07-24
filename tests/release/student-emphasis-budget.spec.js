import { expect, test } from "@playwright/test";

import {
  STUDENT_EMPHASIS_ROUTES,
  STUDENT_EMPHASIS_VIEWPORTS
} from "../../src/policy/studentEmphasisBudget.js";

async function waitForPrimaryMedia(primary) {
  const image = primary.locator("img").first();
  if (await image.count() === 0) return;
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate(element => (
    element.complete && element.naturalWidth > 0
  ))).toBe(true);
}

for (const viewport of STUDENT_EMPHASIS_VIEWPORTS) {
  for (const route of STUDENT_EMPHASIS_ROUTES) {
    test(`A3.9 ${route.id} keeps one strongest learning action at ${viewport.id}`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

      const surface = page.locator(`[data-child-surface="${route.id}"]`);
      const primary = surface.locator("[data-child-primary]");
      const cue = surface.locator(
        "[data-child-primary] [data-child-emphasis-cue],"
        + "[data-child-primary][data-child-emphasis-cue]"
      );

      await expect(surface).toBeVisible();
      await expect(primary).toHaveCount(1);
      await expect(primary).toBeVisible();
      await expect(primary).toHaveAttribute("data-child-emphasis", "primary");
      await expect(cue).toHaveCount(1);
      await expect(cue).toBeVisible();
      await expect(cue).toContainText(new RegExp(route.primaryCue, "i"));

      const hierarchy = await surface.evaluate(element => {
        const actions = [...element.querySelectorAll("button, a")];
        const primaryAction = element.querySelector("[data-child-primary]");
        const cueElement = primaryAction?.matches("[data-child-emphasis-cue]")
          ? primaryAction
          : primaryAction?.querySelector("[data-child-emphasis-cue]");
        const level = action => Number.parseInt(
          getComputedStyle(action).getPropertyValue("--child-emphasis-level"),
          10
        ) || 0;
        const box = primaryAction?.getBoundingClientRect();
        const cueBox = cueElement?.getBoundingClientRect();
        const intersectsViewport = rect => Boolean(rect
          && rect.bottom > 0
          && rect.top < window.innerHeight
          && rect.right > 0
          && rect.left < window.innerWidth);
        return {
          primaryLevel: primaryAction ? level(primaryAction) : 0,
          competingTierThree: actions.filter(action => action !== primaryAction && level(action) >= 3).length,
          primaryInViewport: Boolean(box
            && box.width >= 44
            && box.height >= 44
            && intersectsViewport(box)),
          cueInViewport: Boolean(cueBox
            && cueBox.top >= 0
            && cueBox.bottom <= window.innerHeight
            && cueBox.left >= 0
            && cueBox.right <= window.innerWidth)
        };
      });

      expect(hierarchy).toEqual({
        primaryLevel: 3,
        competingTierThree: 0,
        primaryInViewport: true,
        cueInViewport: true
      });
      await waitForPrimaryMedia(primary);
      await expect(page).toHaveScreenshot(
        `student-emphasis-${route.id}-${viewport.id}.png`,
        {
          animations: "disabled",
          caret: "hide",
          fullPage: false,
          maxDiffPixelRatio: 0.01
        }
      );
      expect(pageErrors).toEqual([]);
    });
  }
}
