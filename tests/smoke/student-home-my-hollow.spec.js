import { expect, test } from "@playwright/test";

test.describe("Student Home My Hollow card", () => {
  test("keeps My Hollow behind exploration, loads its art, and opens the action", async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });

    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 1600, height: 1000 });
    }
    await page.goto("/preview/student-home-preview.html");

    const cards = page.locator(".hs-card");
    const soundSeekers = cards.filter({ hasText: "Sound Seekers" });
    const myHollow = cards.filter({ hasText: "My Hollow" });
    await expect(cards).toHaveCount(7);
    await expect(myHollow).toHaveCount(1);
    await expect(page.locator('[data-home-priority="primary"]')).toHaveCount(1);
    await expect(page.locator('[data-home-priority="secondary"]')).toHaveCount(2);
    await expect(page.locator('[data-home-priority="explore"]')).toHaveCount(4);
    await expect(page.locator('[data-home-priority="primary"] h3')).toHaveText("Adventure Map");
    await expect(myHollow).toBeHidden();

    await page.waitForFunction(() => (
      [...document.querySelectorAll(".hs-thumb img")]
        .every(image => image.complete && image.naturalWidth > 0)
    ));
    await expect(myHollow.locator("img")).toHaveAttribute("src", "/images/home-sage/my-hollow.webp");

    if ((page.viewportSize()?.width || 0) >= 1000) {
      const primaryWidth = await page.locator('[data-home-priority="primary"]').evaluate(element => element.getBoundingClientRect().width);
      const secondaryWidth = await page.locator('[data-home-priority="secondary"]').first().evaluate(element => element.getBoundingClientRect().width);
      expect(primaryWidth).toBeGreaterThan(secondaryWidth * 1.8);
    }

    await page.locator(".hs-more-explore summary").click();
    await expect(myHollow).toBeVisible();
    await soundSeekers.focus();
    await expect(soundSeekers).toBeFocused();
    await myHollow.click();
    await expect(page.locator("html")).toHaveAttribute("data-hollow-opened", "true");

    const viewport = page.viewportSize();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(pageErrors).toEqual([]);
  });
});
