import { expect, test } from "@playwright/test";
import { storyQuests } from "../../src/data/storyQuests.js";
import { STORY_WORLDS, questWorldId } from "../../src/policy/childLibraryPolicy.js";

const viewports = [
  { width: 320, height: 568 },
  { width: 568, height: 320 }
];

for (const viewport of viewports) {
  test(`Story Quest covers and page arrows fit at ${viewport.width}×${viewport.height}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=story-quests");
    const shelf = page.locator('[data-child-surface="story-quests"]');
    const next = shelf.getByRole("button", { name: "Next stories", exact: true });
    const previous = shelf.getByRole("button", { name: "Previous stories", exact: true });
    const card = shelf.locator(".kg-quest-open");
    await expect(shelf).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    for (const world of STORY_WORLDS) {
      await shelf.getByRole("button", { name: world.label, exact: true }).click();
      const expectedNames = storyQuests.filter(quest => questWorldId(quest) === world.id)
        .map(quest => `Open ${quest.title}`).sort();
      const found = [];
      await expect(previous).toBeDisabled();
      for (const [index] of expectedNames.entries()) {
        await expect(card).toHaveCount(1);
        await expect.poll(() => card.locator("img").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        const geometry = await shelf.evaluate(element => {
          const viewport = element.closest(".kg-main").getBoundingClientRect();
          const card = element.querySelector(".kg-quest-card").getBoundingClientRect();
          const title = element.querySelector(".kg-quest-title");
          const titleRange = document.createRange();
          titleRange.selectNodeContents(title);
          const content = [
            ...element.querySelectorAll(".kg-quest-art img, .kg-quest-action, .kg-quest-listen, .kg-quest-pagination button")
          ];
          const outside = (box, limits) => box.width <= 0 || box.height <= 0
            || box.left < limits.left - 1 || box.right > limits.right + 1
            || box.top < limits.top - 1 || box.bottom > limits.bottom + 1;
          return {
            clipped: content.filter(item => (
              outside(item.getBoundingClientRect(), viewport)
              || (item.closest(".kg-quest-card") && outside(item.getBoundingClientRect(), card))
            )).map(item => item.getAttribute("aria-label") || item.className),
            clippedTitle: [...titleRange.getClientRects()].some(box => outside(box, card)),
            scroll: element.closest(".kg-main").scrollTop
          };
        });
        expect(geometry).toEqual({ clipped: [], clippedTitle: false, scroll: 0 });
        found.push(await card.getAttribute("aria-label"));
        if (index + 1 < expectedNames.length) await next.click();
      }
      expect(found.sort()).toEqual(expectedNames);
      await expect(next).toBeDisabled();
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect(next).toBeEnabled();
    }
    await page.screenshot({ path: info.outputPath("story-quest-page.png") });
  });
}
