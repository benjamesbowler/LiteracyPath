import { expect, test } from "@playwright/test";

test.describe("Student Home My Hollow card", () => {
  test("fills the grid, loads its art, and opens the Hollow action", async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 1600, height: 1000 });
    }
    await page.goto("/preview/student-home-preview.html");

    const cards = page.locator(".hs-card");
    const soundSeekers = cards.filter({ hasText: "Sound Seekers" });
    const myHollow = cards.filter({ hasText: "My Hollow" });
    await expect(cards).toHaveCount(7);
    await expect(myHollow).toHaveCount(1);

    await page.waitForFunction(() => (
      [...document.querySelectorAll(".hs-thumb img")]
        .every(image => image.complete && image.naturalWidth > 0)
    ));
    await expect(myHollow.locator("img")).toHaveAttribute("src", "/images/home-sage/my-hollow.webp");

    const cardRects = await cards.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return {
        title: element.querySelector("h2")?.textContent || "",
        width: Math.round(rect.width),
        y: Math.round(rect.y)
      };
    }));
    const rowCounts = Object.values(cardRects.reduce((rows, card) => {
      rows[card.y] = (rows[card.y] || 0) + 1;
      return rows;
    }, {}));

    if ((page.viewportSize()?.width || 0) >= 1000) {
      expect(rowCounts).toEqual([3, 4]);
      expect(cardRects[0].title).toBe("Sound Seekers");
      expect(cardRects[0].width).toBeGreaterThan(cardRects[1].width * 1.9);
    } else {
      expect(rowCounts).toEqual([1, 1, 1, 1, 1, 1, 1]);
      expect(cardRects.every(card => card.width === cardRects[0].width)).toBe(true);
    }

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
