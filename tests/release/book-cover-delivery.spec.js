import { expect, test } from "@playwright/test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { bookCoverSources } from "../../src/policy/childLibraryPolicy.js";
import { GUIDED_READING_COVER_RENDITIONS } from "../../src/data/generated/guidedReadingCoverRenditions.generated.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";

const library = getRuntimeGuidedReadingBooks();
const pathname = source => new URL(source, "https://literacy.guide").pathname;

async function findBookCard(page, book) {
  await page.getByRole("button", { name: "Find a book", exact: true }).click();
  const finder = page.getByRole("dialog", { name: "Find a book" });
  await finder.getByRole("button", { name: "Find by title", exact: true }).click();
  await finder.getByRole("searchbox", { name: "Book title", exact: true }).fill(book.title);
  await finder.getByRole("button", { name: /^See [1-9]\d* books?$/ }).click();
  const card = page.locator(`.kg-book-card[data-book-id="${book.id}"]`);
  await expect(card).toBeInViewport({ ratio: 1 });
  return card;
}

test("large child book galleries decode canonical card artwork and retain full reader images", async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const shelf = page.locator(".kg-books");
  const cards = shelf.locator(".kg-book-card");
  await expect(shelf).toHaveAttribute("data-book-count", String(library.length));
  await expect(cards.first()).toBeInViewport({ ratio: 1 });
  await expectVisibleImagesReady(page, "first projector book page");
  await page.screenshot({ path: info.outputPath("projector-book-gallery.png") });
  const next = shelf.getByRole("navigation", { name: "Books pages" }).getByRole("button", { name: "Next", exact: true });
  await expect(next).toBeInViewport({ ratio: 1 });
  await next.click();
  await expect(shelf).toHaveAttribute("data-book-page", "2");
  await expectVisibleImagesReady(page, "next projector book page");
  await expect(cards.last().locator(".kg-book-cover-frame")).toHaveAttribute("data-book-cover-state", "ready");

  for (const id of ["ab-c-07", "ab-c-09"]) {
    const book = library.find(item => item.id === id);
    const source = bookCoverSources(book)[0];
    const card = await findBookCard(page, book);
    const cover = card.locator(".kg-book-cover-frame");
    await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
    await expect(cover.locator("img")).toHaveAttribute("src", GUIDED_READING_COVER_RENDITIONS[source].src);
    expect(await cover.locator("img").evaluate(image => Math.max(image.naturalWidth, image.naturalHeight))).toBeLessThanOrEqual(512);
  }
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
  const card = await findBookCard(page, book);
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
  const card = await findBookCard(page, book);
  const cover = card.locator(".kg-book-cover-frame");
  await expect(cover).toHaveAttribute("data-book-cover-state", "fallback");
  await expect(cover.locator("img")).toHaveCount(0);
  await expect(cover.locator("strong")).toHaveText(book.title);
  await page.unroute("**/guided-reading/**");
  await card.click();
  await expect(page.locator(".guided-reader-shell.fullscreen")).toBeVisible();
  await expectVisibleImagesReady(page, "book remains readable after card failures");
});
