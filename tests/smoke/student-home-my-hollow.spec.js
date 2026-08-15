import { expect, test } from "@playwright/test";

test.describe("Student Home My Hollow doorway", () => {
  test("keeps My Hollow among the quiet choices, loads its art, and opens the action", async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });

    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 1600, height: 1000 });
    }
    await page.goto("/preview/student-home-preview.html");

    const doors = page.locator(".kg-home-door");
    const adventureMap = doors.filter({ hasText: "Adventure Map" });
    const myHollow = doors.filter({ hasText: "My Hollow" });
    await expect(doors).toHaveCount(6);
    await expect(myHollow).toHaveCount(1);
    await expect(page.locator("[data-child-primary]")).toHaveCount(1);
    await expect(page.locator('[data-home-priority="choice"]')).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "Adventure Map", level: 1 })).toBeVisible();
    await expect(myHollow).toBeVisible();

    await page.waitForFunction(() => (
      [...document.querySelectorAll(".kg-home-door-art img")]
        .every(image => image.complete && image.naturalWidth > 0)
    ));
    await expect(myHollow.locator("img")).toHaveAttribute("src", "/images/home-sage/my-hollow.webp");

    if ((page.viewportSize()?.width || 0) >= 1000) {
      const widths = await doors.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(2);
    }

    await adventureMap.focus();
    await expect(adventureMap).toBeFocused();
    await myHollow.click();
    await expect(page.locator("html")).toHaveAttribute("data-hollow-opened", "true");

    const viewport = page.viewportSize();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(pageErrors).toEqual([]);
  });
});
