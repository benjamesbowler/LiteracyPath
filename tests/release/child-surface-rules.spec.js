import { expect, test } from "@playwright/test";

import {
  CHILD_SURFACE_REQUIRED_REGIONS,
  CHILD_SURFACE_ROUTES,
  validateChildSurfaceRegions
} from "../../src/policy/childSurfaceRules.js";

test("A3.1 child previews load the production self-hosted child typefaces", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=adventure-map");
  await expect(page.locator('[data-child-surface="adventure-map"]')).toBeVisible();

  const fontEvidence = await page.evaluate(async () => {
    const [displayFaces, bodyFaces] = await Promise.all([
      document.fonts.load('700 19px "Baloo 2"', "Adventure Map"),
      document.fonts.load("700 16px Nunito", "This is your next unfinished stop")
    ]);
    const serialise = face => ({
      family: face.family.replaceAll('"', ""),
      status: face.status,
      weight: face.weight
    });
    return {
      displayFaces: displayFaces.map(serialise),
      bodyFaces: bodyFaces.map(serialise)
    };
  });

  expect(fontEvidence.displayFaces).toContainEqual({
    family: "Baloo 2",
    status: "loaded",
    weight: "700"
  });
  expect(fontEvidence.bodyFaces).toContainEqual({
    family: "Nunito",
    status: "loaded",
    weight: "700"
  });
});

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
