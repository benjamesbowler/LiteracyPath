import { expect, test } from "@playwright/test";

import { getGuidedReadingMeasure } from "../../src/policy/guidedReadingMeasure.js";

const LEVEL_CASES = [
  {
    bookId: "first-facts-level-a-03-big-and-little",
    level: "A",
    title: "Big and Little"
  },
  {
    bookId: "gr-b-32",
    level: "B",
    title: "Fruits"
  },
  {
    bookId: "level-c-nonfiction-01-bees",
    level: "C",
    title: "Honeybees and Pollination"
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

async function readerPageGeometry(reader) {
  return reader.locator(".guided-page-layout").evaluate(layout => {
    const image = layout.querySelector(".guided-page-image");
    const pageText = layout.querySelector(".guided-page-text");
    if (!(image instanceof HTMLImageElement) || !(pageText instanceof HTMLElement)) return null;

    const imageRect = image.getBoundingClientRect();
    const imageStyle = getComputedStyle(image);
    const scale = Math.min(
      imageRect.width / image.naturalWidth,
      imageRect.height / image.naturalHeight
    );
    const renderedImageWidth = image.naturalWidth * scale;
    const renderedImageHeight = image.naturalHeight * scale;
    const walker = document.createTreeWalker(pageText, NodeFilter.SHOW_TEXT);
    let firstLineTop = null;
    let textNode = walker.nextNode();

    while (textNode && firstLineTop === null) {
      const firstVisibleCharacter = [...textNode.data].findIndex(character => !/\s/.test(character));
      if (firstVisibleCharacter >= 0) {
        const range = document.createRange();
        range.setStart(textNode, firstVisibleCharacter);
        range.setEnd(textNode, firstVisibleCharacter + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) firstLineTop = rect.top;
      }
      textNode = walker.nextNode();
    }

    return {
      firstLineTop,
      imageBoxHeight: imageRect.height,
      imageBoxTop: imageRect.top,
      imageBoxWidth: imageRect.width,
      objectFit: imageStyle.objectFit,
      objectPosition: imageStyle.objectPosition,
      renderedImageHeight,
      renderedImageWidth
    };
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
    const pageTextFor = pageNumber => reader.locator(
      `.guided-page-layout[data-page-number="${pageNumber}"] .guided-page-text`
    );
    let pageText = pageTextFor(1);
    const imageCard = reader.locator(".guided-page-image-card");
    const readingCard = reader.locator(".guided-page-reading");
    const viewControls = reader.getByRole("group", { name: "Reader view controls" });
    const lineFocus = viewControls.getByRole("button", { name: "Line focus", exact: true });
    const progress = reader.getByRole("status", { name: "Reading progress" });

    await expect(layout).toHaveAttribute("data-reading-level", levelCase.level);
    await expect(layout).toHaveAttribute("data-reading-template", measure.templateId);
    await expect(pageText).toHaveClass(/is-ready/);

    const pageCount = Number((await progress.textContent())?.match(/of\s+(\d+)/)?.[1] || 0);
    expect(pageCount).toBeGreaterThan(0);
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      await expect(progress).toContainText(`Page ${pageIndex + 1} of ${pageCount}`);
      pageText = pageTextFor(pageIndex + 1);
      await expect(pageText).toBeVisible();
      await expect(pageText).toHaveClass(/is-ready/);
      const lineCounts = await renderedCharacterCountsByLine(pageText);
      expect(lineCounts.length, `Level ${levelCase.level} page ${pageIndex + 1} renders text`).toBeGreaterThan(0);
      expect(
        Math.max(...lineCounts),
        `Level ${levelCase.level} page ${pageIndex + 1} rendered characters per line`
      ).toBeLessThanOrEqual(measure.maxRenderedCharactersPerLine);

      if (pageIndex < pageCount - 1) {
        await reader.getByRole("button", { name: "Next page", exact: true }).click();
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

    const geometry = await readerPageGeometry(reader);
    expect(geometry).not.toBeNull();
    expect(geometry.objectFit).toBe("contain");
    expect(geometry.objectPosition).toMatch(/^50% 0(?:px|%)$/);
    expect(
      Math.abs(geometry.firstLineTop - geometry.imageBoxTop),
      `Level ${levelCase.level} image top aligns with the first reading line`
    ).toBeLessThanOrEqual(16);
    expect(
      Math.max(
        geometry.renderedImageWidth / geometry.imageBoxWidth,
        geometry.renderedImageHeight / geometry.imageBoxHeight
      ),
      `Level ${levelCase.level} image uses the largest full-image fit`
    ).toBeGreaterThanOrEqual(0.99);
    expect(geometry.renderedImageWidth).toBeLessThanOrEqual(geometry.imageBoxWidth + 1);
    expect(geometry.renderedImageHeight).toBeLessThanOrEqual(geometry.imageBoxHeight + 1);

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
    expect(controlSizes.every(control => control.height >= 56 && control.width >= 56)).toBe(true);

    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    pageText = pageTextFor(1);
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

test("Guided Reading preserves the full-image composition in portrait and landscape", async ({ page }) => {
  const cases = [
    { height: 1024, orientation: "portrait", width: 768 },
    { height: 720, orientation: "landscape", width: 1180 }
  ];

  for (const viewport of cases) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/guided-reading-preview.html?book=first-facts-level-a-03-big-and-little");
    await page.evaluate(() => document.fonts.ready);

    const reader = page.getByLabel("Big and Little full-screen reader");
    const viewControls = reader.getByRole("group", { name: "Reader view controls" });
    await viewControls.getByRole("button", { name: "Full screen", exact: true }).click();
    await expect(reader).toHaveClass(/fullscreen/);
    const pageText = reader.locator(".guided-page-text");
    const image = reader.locator(".guided-page-image");
    await expect(pageText).toHaveClass(/is-ready/);
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);

    const geometry = await readerPageGeometry(reader);
    expect(geometry.objectFit).toBe("contain");
    expect(geometry.objectPosition).toMatch(/^50% 0(?:px|%)$/);
    expect(
      Math.max(
        geometry.renderedImageWidth / geometry.imageBoxWidth,
        geometry.renderedImageHeight / geometry.imageBoxHeight
      ),
      `${viewport.orientation} image uses the largest full-image fit`
    ).toBeGreaterThanOrEqual(0.99);
    expect(geometry.renderedImageWidth).toBeLessThanOrEqual(geometry.imageBoxWidth + 1);
    expect(geometry.renderedImageHeight).toBeLessThanOrEqual(geometry.imageBoxHeight + 1);

    const layout = await reader.locator(".guided-page-layout").evaluate(element => {
      const imageCard = element.querySelector(".guided-page-image-card").getBoundingClientRect();
      const textFrame = element.querySelector(".guided-page-text-frame").getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        imageBottom: imageCard.bottom,
        imageLeft: imageCard.left,
        textLeft: textFrame.left,
        textTop: textFrame.top
      };
    });
    expect(layout.documentOverflow).toBeLessThanOrEqual(0);

    if (viewport.orientation === "portrait") {
      expect(layout.textTop).toBeGreaterThanOrEqual(layout.imageBottom - 1);
    } else {
      expect(layout.textLeft).toBeGreaterThan(layout.imageLeft);
      expect(Math.abs(geometry.firstLineTop - geometry.imageBoxTop)).toBeLessThanOrEqual(16);
    }

    await viewControls.getByRole("button", { name: "Exit", exact: true }).click();
    await expect(reader).not.toHaveClass(/fullscreen/);
  }
});
