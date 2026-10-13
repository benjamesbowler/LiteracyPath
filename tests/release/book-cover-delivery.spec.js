import { expect, test } from "@playwright/test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { bookCoverSources } from "../../src/policy/childLibraryPolicy.js";
import { GUIDED_READING_COVER_RENDITIONS } from "../../src/data/generated/guidedReadingCoverRenditions.generated.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";

const library = getRuntimeGuidedReadingBooks();
const pathname = source => new URL(source, "https://literacy.guide").pathname;

test("large child book galleries decode canonical card artwork and retain full reader images", async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const cards = page.locator(".kg-book-card");
  await expect(cards).toHaveCount(library.length);
  // Keep the real, parallel decode gate: source-only/lazy-decode workarounds
  // still failed here with valid original multi-megapixel covers.
  await expectVisibleImagesReady(page, "full projector book gallery");
  for (const id of ["ab-c-09", "ab-c-07"]) {
    const book = library.find(item => item.id === id);
    const source = bookCoverSources(book)[0];
    const cover = page.locator(`.kg-book-card[data-book-id="${id}"] .kg-book-cover-frame`);
    await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
    await expect(cover.locator("img")).toHaveAttribute("src", GUIDED_READING_COVER_RENDITIONS[source].src);
    expect(await cover.locator("img").evaluate(image => Math.max(image.naturalWidth, image.naturalHeight))).toBeLessThanOrEqual(512);
  }
  await page.screenshot({ path: info.outputPath("projector-book-gallery.png") });
  await cards.last().scrollIntoViewIfNeeded();
  await expectVisibleImagesReady(page, "last books in the complete gallery");
  await expect(cards.last().locator(".kg-book-cover-frame")).toHaveAttribute("data-book-cover-state", "ready");
  const book = library.find(item => item.id === "ab-c-09");
  await page.locator(`.kg-book-card[data-book-id="${book.id}"]`).click();
  const illustration = page.locator(".guided-reader-shell.fullscreen .guided-page-image");
  await expect(illustration).toBeVisible();
  await expectVisibleImagesReady(page, "full original reader illustration");
  expect(pathname(await illustration.getAttribute("src"))).toBe(book.pages[0].image);
  expect(await illustration.evaluate(image => Math.max(image.naturalWidth, image.naturalHeight))).toBeGreaterThan(512);
});

test("failed card delivery retries its own canonical cover then its own approved page", async ({ page }) => {
  const book = library.find(item => item.id === "ab-c-09");
  const sources = bookCoverSources(book);
  const rendition = GUIDED_READING_COVER_RENDITIONS[sources[0]].src;
  const failed = [];
  await page.route("**/guided-reading/**", route => {
    const source = pathname(route.request().url());
    if (source === rendition || source === sources[0]) {
      failed.push(source);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const card = page.locator(`.kg-book-card[data-book-id="${book.id}"]`);
  await card.scrollIntoViewIfNeeded();
  const cover = card.locator(".kg-book-cover-frame");
  await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
  expect(pathname(await cover.locator("img").getAttribute("src"))).toBe(sources[1]);
  expect(failed).toContain(rendition);
  expect(failed).toContain(sources[0]);
  await expect(card).toContainText(book.title);
  await expectVisibleImagesReady(page, "same-book fallback after genuine delivery failures");
});

test("unavailable card art keeps its own title fallback and the book remains openable", async ({ page }) => {
  const book = library.find(item => item.id === "ab-c-09");
  const sources = new Set(bookCoverSources(book));
  const rendition = GUIDED_READING_COVER_RENDITIONS[bookCoverSources(book)[0]].src;
  await page.route("**/guided-reading/**", route => {
    const source = pathname(route.request().url());
    return source === rendition || sources.has(source) ? route.abort() : route.continue();
  });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const card = page.locator(`.kg-book-card[data-book-id="${book.id}"]`);
  await card.scrollIntoViewIfNeeded();
  const cover = card.locator(".kg-book-cover-frame");
  await expect(cover).toHaveAttribute("data-book-cover-state", "fallback");
  await expect(cover.locator("img")).toHaveCount(0);
  await expect(cover.locator("strong")).toHaveText(book.title);
  await page.unroute("**/guided-reading/**");
  await card.click();
  await expect(page.locator(".guided-reader-shell.fullscreen")).toBeVisible();
  await expectVisibleImagesReady(page, "book remains readable after card failures");
});
