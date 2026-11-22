import { expect, test } from "@playwright/test";
import { COMPREHENSION_PASSAGES, passageById } from "../../src/content/comprehension/passages.js";

const passage = passageById("pip-bag");
const preview = "/preview/child-surfaces.html?surface=reading-comprehension";

async function expectCatalogueInFrame(catalogue) {
  const result = await catalogue.evaluate(node => {
    const clip = node.closest("dialog")?.getBoundingClientRect() ?? node.closest(".kg-main").getBoundingClientRect();
    const clips = [...node.querySelectorAll("button, select, input, img, .rc-card-copy")].flatMap(el => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      const action = el.matches("button, select, input");
      return rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1 ||
        rect.left < clip.left - 1 || rect.right > clip.right + 1 ||
        (action && (!el.contains(hit) || rect.height < 43.9 || rect.width < 43.9)) ?
        [el.getAttribute("aria-label") || el.textContent] : [];
    });
    return { clips, scroll: Math.max(node.scrollTop, node.scrollHeight - node.clientHeight) };
  });
  expect(result).toEqual({ clips: [], scroll: 0 });
}

for (const [width, height] of [[320, 568], [568, 320], [1024, 768]]) {
  test(`learner passage pages and filters fit at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.goto(preview);
    const catalogue = page.locator(".rc-child-catalogue");
    await expect(catalogue).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const cards = catalogue.locator(".rc-card-open");
    const pager = catalogue.getByRole("navigation", { name: "Passage pages" });
    const next = pager.getByRole("button", { name: "Next", exact: true });
    const firstSet = await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")));
    const shown = [];
    for (;;) {
      await expectCatalogueInFrame(catalogue);
      shown.push(...await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label"))));
      if (width !== 1024 || await next.getAttribute("aria-disabled") === "true") break;
      await next.click();
    }
    if (width === 1024) {
      expect(shown).toEqual(COMPREHENSION_PASSAGES.map(story => `Read ${story.title}`));
    } else {
      await next.click();
      await expectCatalogueInFrame(catalogue);
      expect(await cards.first().getAttribute("aria-label")).not.toBe(firstSet[0]);
    }

    await catalogue.getByRole("button", { name: "Find a story", exact: true }).click();
    const filters = page.getByRole("dialog", { name: "Find a passage" });
    await expect(filters.getByRole("button", { name: "Show stories", exact: true })).toBeFocused();
    await expectCatalogueInFrame(filters);
    await filters.getByRole("searchbox", { name: "Find a story", exact: true }).fill(passage.title);
    await expect(filters.getByRole("status")).toContainText("1 passage");
    await filters.getByRole("button", { name: "Show stories", exact: true }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toHaveAccessibleName(`Read ${passage.title}`);
    await expectCatalogueInFrame(catalogue);
  });
}

async function expectLessonInFrame(stage) {
  const dimensions = await stage.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const elements = [...node.querySelectorAll("button, select, input, h1, h2, .rc-lesson-text:not(.rc-text-measure)")];
    const clipped = elements.filter(el => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(el).visibility === "hidden") return false;
      const midpoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1
        || rect.left < bounds.left - 1 || rect.right > bounds.right + 1
        || !el.contains(midpoint);
    });
    return {
      overflow: Math.max(node.scrollHeight - node.clientHeight, node.scrollWidth - node.clientWidth, node.scrollTop),
      clipped: clipped.map(el => el.getAttribute("aria-label") || el.textContent)
    };
  });
  expect(dimensions.overflow).toBeLessThanOrEqual(1);
  expect(dimensions.clipped).toEqual([]);
}

for (const [width, height] of [[320, 568], [568, 320], [1024, 768]]) {
  test(`child comprehension opens in a complete lesson at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.goto(preview);
    const choose = page.getByRole("button", { name: `Read ${passage.title}`, exact: true });
    await choose.click();

    const stage = page.locator("#rc-lesson-stage");
    const button = name => stage.getByRole("button", { name, exact: true });
    await expect(stage.getByRole("dialog", { name: `${passage.title} · reading lesson` })).toBeVisible();
    await expect(stage.getByRole("heading", { name: passage.title })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expectLessonInFrame(stage);

    if (await button("Next story page").isVisible() && await button("Next story page").isEnabled()) {
      await button("Next story page").click();
      await expect(stage.locator('[data-lesson-text="story"]')).toHaveAttribute("data-page-index", "1");
    }
    if (await button("Pictures").isVisible()) await button("Pictures").click();
    await expect(stage.getByRole("region", { name: "Story pictures" })).toBeVisible();
    await expectLessonInFrame(stage);

    await button("Print pages").click();
    await expect(stage.getByRole("combobox", { name: "Page" })).toBeVisible();
    await button("Preview page").click();
    await expect(stage.getByRole("document")).toBeVisible();
    await expectLessonInFrame(stage);
    await button("Print pages").click();
    if (await button("Questions").isVisible()) await button("Questions").click();
    await expectLessonInFrame(stage);

    for (const [index, question] of passage.questions.entries()) {
      if (index === 0) {
        await button(question.options.find(option => option !== question.answer)).click();
        await button("Check answer").click();
        await expect(stage.getByText(/Look back at this part/).filter({ visible: true })).toBeVisible();
        await expectLessonInFrame(stage);
        if (await button("Back to choices").isVisible()) await button("Back to choices").click();
      }
      await button(question.answer).click();
      await button("Check answer").click();
      await expect(stage.getByText(/That fits the story/).filter({ visible: true })).toBeVisible();
      await expectLessonInFrame(stage);
      await button(index === passage.questions.length - 1 ? "Finish" : "Next").click();
    }
    await expect(stage.getByRole("heading", { name: "You finished this practice!" })).toBeVisible();
    await expect(button("Print a drawing page")).toBeVisible();
    if (width === 568) {
      await page.evaluate(() => { window.open = () => null; });
      await button("Print a drawing page").click();
      await expect(stage.getByText("Allow pop-ups for this site, then try Print again.")).toBeVisible();
    }
    await expectLessonInFrame(stage);
    await button("Start again").click();
    await expect(stage.getByRole("heading", { name: passage.questions[0].prompt })).toBeVisible();
    await button("All passages").click();
    await expect(page.getByRole("heading", { name: "Reading Comprehension", exact: true })).toBeFocused();
    await expect(choose).toBeVisible();
  });
}

test("teacher comprehension opens the workbook with class and print actions", async ({ page }) => {
  await page.goto(`${preview}&teacher=1`);
  await page.getByRole("button", { name: `Read ${passage.title}`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Full screen", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal answer and evidence" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print / Save as PDF" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: `Whole group completed: ${passage.title}` })).toBeVisible();
});
