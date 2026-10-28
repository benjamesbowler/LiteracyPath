import { expect, test } from "@playwright/test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";

const books = getRuntimeGuidedReadingBooks().filter(book => book.id.startsWith("small-steps-"));
const words = text => String(text).match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || [];

function observeRealAudio() {
  window.__smallStepsAudio = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    window.__smallStepsAudio.push(this);
    return play.apply(this, args);
  };
}

for (const viewport of [{ width: 768, height: 1024 }, { width: 320, height: 568 }]) {
  for (const book of books) {
    test(`${book.id} all pages and real audio at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
      test.setTimeout(90_000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(observeRealAudio);
      await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
      const reader = page.getByRole("region", { name: `${book.title} full-screen reader` });
      await expect(reader).toBeVisible();
      await expect(reader.locator("[data-decodable-guide]")).toHaveCount(0);
      for (const [index, readingPage] of book.pages.entries()) {
        await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText(`Page ${index + 1} of ${book.pages.length}`);
        const text = reader.locator(".guided-page-text");
        await expect(text).toHaveClass(/is-ready/);
        await expect.poll(async () => words(await text.innerText())).toEqual(words(readingPage.text));
        await expect.poll(() => reader.locator(".guided-page-image").getAttribute("src")).toContain(readingPage.image);
        await expect.poll(() => reader.locator(".guided-page-image").evaluate(image => image.complete && image.naturalWidth === 1536)).toBe(true);
        const geometry = await reader.evaluate(element => {
          const text = element.querySelector(".guided-page-text");
          const image = element.querySelector(".guided-page-image");
          return {
            overflowX: document.documentElement.scrollWidth > innerWidth,
            textOverflow: text.scrollHeight > text.clientHeight + 1,
            imageFit: getComputedStyle(image).objectFit,
            font: parseFloat(getComputedStyle(text).fontSize)
          };
        });
        expect(geometry.overflowX).toBe(false);
        expect(geometry.textOverflow).toBe(false);
        expect(geometry.imageFit).toBe("contain");
        expect(geometry.font).toBeGreaterThanOrEqual(18);
        const listen = reader.getByRole("button", { name: "Hear this page", exact: true });
        await expect(listen).toBeInViewport();
        await listen.click();
        const expectedPath = getGuidedReadingPageAudioPath(readingPage).split("?")[0];
        await expect.poll(() => page.evaluate(path => window.__smallStepsAudio.some(audio =>
          new URL(audio.currentSrc || audio.src).pathname === path && audio.currentTime > 0 && !audio.error
        ), expectedPath)).toBe(true);
        if (index === 0) {
          const word = words(readingPage.text).at(-1);
          await reader.getByRole("button", { name: `Get reading help for ${word}`, exact: true }).last().click();
          const wordPath = getGuidedReadingWordProductionAudioPath(word).split("?")[0];
          expect(wordPath).not.toBe("");
          await expect.poll(() => page.evaluate(path => window.__smallStepsAudio.some(audio =>
            new URL(audio.currentSrc || audio.src).pathname === path && audio.currentTime > 0 && !audio.error
          ), wordPath)).toBe(true);
          await page.screenshot({ path: info.outputPath("first-page-word-help.png") });
        }
        const next = reader.getByRole("button", { name: index + 1 === book.pages.length ? "Finish book" : "Next page", exact: true });
        await expect(next).toBeInViewport();
        await next.click();
      }
      await expect(reader).not.toBeVisible();
      await expect.poll(() => page.evaluate(id => window.__guidedReadingPreviewRecords[id]?.completed, book.id)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("Small Steps opens in phonics order from the actual child shelf", async ({ page }, info) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.getByRole("navigation", { name: "Book pictures" }).getByRole("button", { name: "Small Steps", exact: true }).click();
  const cards = page.locator("button[data-book-id^='small-steps-']");
  await expect(cards).toHaveCount(20);
  expect(await cards.evaluateAll(elements => elements.map(element => element.dataset.bookId))).toEqual(books.map(book => book.id));
  await expect(cards.first()).toContainText("Try the words");
  await cards.last().click();
  const reader = page.getByRole("region", { name: "A Bell in a Mess full-screen reader" });
  await expect(reader).toBeVisible();
  await page.screenshot({ path: info.outputPath("book20-from-child-shelf.png") });
});

test("teacher gets each book's actual prerequisite and explicitly taught words", async ({ page }, info) => {
  await page.goto("/preview/guided-reading-preview.html?book=small-steps-01&mode=teacher&library");
  for (const book of books) {
    const guide = page.locator(`[data-decodable-guide='${book.id}']`).first();
    // Search the actual print; this search intentionally indexes words, not titles.
    const search = page.getByRole("searchbox");
    await search.fill(words(book.pages[0].text).at(-1));
    await guide.getByText("Before reading", { exact: true }).click();
    await expect(guide).toContainText(`after Cycle ${book.decodableScope.afterCycle}`);
    for (const row of book.decodableScope.exceptions) await expect(guide).toContainText(row.word === "i" ? "I" : row.word);
    await expect(guide).toContainText("does not measure this child's independent reading");
  }
  await page.screenshot({ path: info.outputPath("teacher-prerequisites.png") });
});
