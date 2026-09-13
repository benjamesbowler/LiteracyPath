import { expect, test } from "@playwright/test";
import { MEADOW_PALS_SCIENCE_BOOKS } from "../../src/data/meadowPalsScienceBooks.js";

const book = MEADOW_PALS_SCIENCE_BOOKS[0];
const audioRoot = "/audio/production/en-US/meadow_science/missing-sandwich/";
const normalized = text => text.replace(/\s+/g, " ").trim();

async function openStory(page) {
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.getByRole("button", { name: "Read Together", exact: true }).click();
  await page.getByRole("button", { name: "Meadow Pals", exact: true }).click();
  await page.getByRole("button", { name: "Start reading", exact: true }).click();
  await expect(page.getByRole("heading", { name: book.title, exact: true })).toBeVisible();
}

async function observeNativeAudio(page) {
  // Observe native media events without replacing play(), decoding or timing.
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__scienceAudioEvents = [];
    window.__scienceAudioElements = [];
    window.Audio = function ObservedAudio(...args) {
      const audio = new NativeAudio(...args);
      window.__scienceAudioElements.push(audio);
      for (const type of ["playing", "ended", "error"]) {
        audio.addEventListener(type, () => window.__scienceAudioEvents.push({
          type, src: audio.currentSrc || audio.src,
          time: audio.currentTime, duration: audio.duration,
          sourceAttribute: audio.getAttribute("src"), errorCode: audio.error?.code || null
        }));
      }
      return audio;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
}

test("Meadow Pals plays the real character recordings through all twelve pages", async ({ page }) => {
  test.setTimeout(360_000);
  await observeNativeAudio(page);
  await openStory(page);
  await page.getByRole("button", { name: "Read whole book", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioEvents.some(event =>
    event.type === "playing" && event.src.endsWith("/missing-sandwich/page-01.mp3")))).toBe(true);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioElements.every(audio => audio.paused))).toBe(true);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioEvents.some(event =>
    event.type === "ended" && event.src.endsWith("/missing-sandwich/page-12.mp3"))),
  { timeout: 300_000, intervals: [1000] }).toBe(true);
  const events = await page.evaluate(() => window.__scienceAudioEvents);
  const completed = events.filter(event => event.type === "ended" && event.src.includes("/missing-sandwich/page-"));
  expect(completed.map(event => new URL(event.src).pathname)).toEqual(book.pages.map(item => item.pageAudioPath));
  expect(completed.every(event => event.duration > 0 && event.time >= event.duration - 0.2)).toBe(true);
  // Retired preload elements clear src; Chromium then reports code 4 for the
  // empty source while currentSrc still names the old, successfully played clip.
  expect(events.filter(event => event.type === "error" && event.sourceAttribute
    && event.src.includes(audioRoot))).toEqual([]);
  await expect(page.getByLabel("Reading progress")).toContainText("12 of 12");
  await expect(page.locator(".guided-page-text")).toHaveText(normalized(book.pages[11].text));
});

test("science word replay uses its new recordings and the exact Muddy sound", async ({ page }) => {
  test.setTimeout(60_000);
  await observeNativeAudio(page);
  await openStory(page);
  await page.getByRole("button", { name: "Read page", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioEvents.some(event =>
    event.type === "playing" && event.src.endsWith("/missing-sandwich/page-01.mp3")))).toBe(true);
  await page.getByRole("button", { name: "Stop reading", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioElements.every(audio => audio.paused))).toBe(true);
  await page.getByRole("button", { name: "Get reading help for digestive", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioEvents.some(event =>
    event.type === "ended" && event.src.endsWith("/missing-sandwich/words/digestive.mp3")))).toBe(true);
  for (let index = 0; index < 9; index += 1) {
    await page.getByRole("button", { name: "Next page", exact: true }).click();
  }
  await page.getByRole("button", { name: "Get reading help for Pffft", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioEvents.some(event =>
    event.type === "ended" && event.src.includes("/missing-sandwich/words/pffft")))).toBe(true);
  await page.getByRole("button", { name: "Back to library", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__scienceAudioElements.every(audio => audio.paused))).toBe(true);
});

test("all twelve science pages remain readable inside the phone child shell", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page);
  for (const [index, scene] of book.pages.entries()) {
    await expect(page.getByLabel("Reading progress")).toContainText(`${index + 1} of 12`);
    const picture = page.getByRole("img", { name: scene.imageAlt, exact: true });
    await expect(picture).toBeVisible();
    await expect.poll(() => picture.evaluate(img => img.complete && img.naturalWidth > 1000)).toBe(true);
    await expect(page.locator(".guided-page-text")).toHaveText(normalized(scene.text));
    if (index === 0 || index === 10) await page.screenshot({ path: testInfo.outputPath(`page-${index + 1}-phone.png`) });
    const lastWord = page.locator(".guided-page-text .guided-word").last();
    await lastWord.scrollIntoViewIfNeeded();
    await expect(lastWord).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (index < book.pages.length - 1) await page.getByRole("button", { name: "Next page", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Finish book", exact: true })).toBeVisible();
});
