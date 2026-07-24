import { expect, test } from "@playwright/test";

import { getGuidedReadingMeasure } from "../../src/policy/guidedReadingMeasure.js";

const LEVEL_CASES = [
  {
    bookId: "first-facts-level-a-01-colors",
    level: "A",
    title: "Colors"
  },
  {
    bookId: "first-facts-a-01-look-at-the-colours",
    level: "B",
    title: "Look at the Colours!"
  },
  {
    bookId: "level-c-nonfiction-01-bees",
    level: "C",
    title: "Bees"
  }
];

async function renderedCharacterCountsByLine(pageText) {
  return pageText.evaluate(element => {
    const lineCounts = new Map();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();

    while (textNode) {
      for (let index = 0; index < textNode.data.length; index += 1) {
        const character = textNode.data[index];
        if (character === "\n" || character === "\r") continue;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const lineKey = Math.round(rect.top);
          lineCounts.set(lineKey, (lineCounts.get(lineKey) || 0) + 1);
        }
      }
      textNode = walker.nextNode();
    }

    return [...lineCounts.values()];
  });
}

for (const levelCase of LEVEL_CASES) {
  test(`A3.7 Level ${levelCase.level} constrains rendered lines and applies its image/text template`, async ({
    page
  }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(`/preview/guided-reading-preview.html?book=${levelCase.bookId}`);
    await page.evaluate(() => document.fonts.ready);

    const measure = getGuidedReadingMeasure(levelCase.level);
    const reader = page.getByLabel(`${levelCase.title} full-screen reader`);
    const layout = reader.locator(".guided-page-layout");
    const pageText = reader.locator(".guided-page-text");
    const imageCard = reader.locator(".guided-page-image-card");
    const readingCard = reader.locator(".guided-page-reading");
    const viewControls = reader.getByRole("group", { name: "Reader view controls" });
    const lineFocus = viewControls.getByRole("button", { name: "Line Focus", exact: true });
    const progress = reader.getByRole("status", { name: "Reading progress" });

    await expect(layout).toHaveAttribute("data-reading-level", levelCase.level);
    await expect(layout).toHaveAttribute("data-reading-template", measure.templateId);
    await expect(pageText).toHaveClass(/is-ready/);

    const pageCount = Number((await progress.textContent())?.match(/of\s+(\d+)/)?.[1] || 0);
    expect(pageCount).toBeGreaterThan(0);
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      await expect(progress).toContainText(`Page ${pageIndex + 1} of ${pageCount}`);
      await expect(pageText).toHaveClass(/is-ready/);
      const lineCounts = await renderedCharacterCountsByLine(pageText);
      expect(lineCounts.length, `Level ${levelCase.level} page ${pageIndex + 1} renders text`).toBeGreaterThan(0);
      expect(
        Math.max(...lineCounts),
        `Level ${levelCase.level} page ${pageIndex + 1} rendered characters per line`
      ).toBeLessThanOrEqual(measure.maxRenderedCharactersPerLine);

      if (pageIndex < pageCount - 1) {
        await reader.getByRole("button", { name: "Next Page", exact: true }).click();
      }
    }

    const [imageBox, readingBox] = await Promise.all([
      imageCard.boundingBox(),
      readingCard.boundingBox()
    ]);
    expect(imageBox).not.toBeNull();
    expect(readingBox).not.toBeNull();
    const renderedImageFraction = imageBox.width / (imageBox.width + readingBox.width);
    expect(Math.abs(renderedImageFraction - measure.imageFraction / 100)).toBeLessThanOrEqual(0.015);

    const controlSizes = await viewControls.getByRole("button").evaluateAll(buttons => (
      buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return {
          label: button.textContent?.trim() || "",
          height: rect.height,
          width: rect.width
        };
      })
    ));
    expect(controlSizes.every(control => control.height >= 44 && control.width >= 44)).toBe(true);

    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await expect(progress).toContainText(`Page 1 of ${pageCount}`);
    await expect(pageText).toHaveClass(/is-ready/);
    await expect(lineFocus).toHaveAttribute("aria-pressed", "false");
    await lineFocus.click();
    await expect(lineFocus).toHaveAttribute("aria-pressed", "true");
    await expect(pageText.locator(".guided-sentence.line-focused")).toHaveCount(1);
    await expect(pageText.locator(".guided-sentence").first()).toHaveClass(/line-focused/);

    const secondSentenceWord = pageText.locator(".guided-sentence").nth(1).locator(".guided-word").first();
    await expect(secondSentenceWord).toBeVisible();
    await secondSentenceWord.click();
    await expect(pageText.locator(".guided-sentence").nth(1)).toHaveClass(/line-focused/);
    await expect(pageText.locator(".guided-sentence").first()).not.toHaveClass(/line-focused/);

    await expect(reader.locator(".guided-reader-card")).toHaveScreenshot(
      `guided-reading-measure-level-${levelCase.level.toLowerCase()}.png`,
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.01
      }
    );
    expect(pageErrors).toEqual([]);
  });
}
