import { expect, test } from "@playwright/test";

import {
  CHILD_SURFACE_REQUIRED_REGIONS,
  CHILD_SURFACE_ROUTES,
  validateChildSurfaceRegions
} from "../../src/policy/childSurfaceRules.js";

for (const route of CHILD_SURFACE_ROUTES) {
  test(`A3.1 ${route.label} renders the complete child-surface contract`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/preview/child-surfaces.html?surface=${route.id}`);

    const surface = page.locator(`[data-child-surface="${route.id}"]`);
    await expect(surface).toBeVisible();

    const counts = {};
    for (const region of CHILD_SURFACE_REQUIRED_REGIONS) {
      const locator = surface.locator(`[data-child-${region}]`);
      await expect(locator.first()).toBeVisible();
      counts[region] = await locator.count();
    }
    expect(validateChildSurfaceRegions(counts)).toEqual({ pass: true, missing: [] });
    await expect(surface.locator("[data-child-title]")).toHaveCount(1);
    await expect(surface.locator("[data-child-title]")).toHaveJSProperty("tagName", "H1");
    await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
    expect(pageErrors).toEqual([]);
  });
}
