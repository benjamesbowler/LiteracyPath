import { expect, test } from "@playwright/test";

function captureAudioPlayback() {
  const BrowserAudio = window.Audio;
  window.__childReadingAudioElements = [];
  window.__childReadingAudioSources = [];
  window.Audio = function AuditedAudio(src) {
    const audio = new BrowserAudio(src);
    window.__childReadingAudioElements.push(audio);
    return audio;
  };
  window.Audio.prototype = BrowserAudio.prototype;
  HTMLMediaElement.prototype.play = function play() {
    window.__childReadingAudioSources.push(this.src || this.currentSrc || "");
    queueMicrotask(() => this.dispatchEvent(new Event("ended")));
    return Promise.resolve();
  };
}

test("Guided Reading word taps use contextual recorded sounds, never letter names", async ({ page }) => {
  await page.addInitScript(captureAudioPlayback);
  await page.goto("/preview/guided-reading-preview.html?book=bob-and-nan-02-park");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  const word = reader.getByRole("button", { name: "Get reading help for runs", exact: true });
  await word.click();
  await expect(reader.locator(".guided-decoding-support.stage-whole_word_audio")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/isolated_word/");

  await word.click();
  await expect(reader.locator(".guided-decoding-support.stage-segmented_phonemes")).toContainText("r · u · n · s");
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.slice(-4).map(src => new URL(src).pathname)))
    .toEqual([
      "/audio/phonemes/r.mp3",
      "/audio/phonemes/short_u.mp3",
      "/audio/phonemes/n.mp3",
      "/audio/phonemes/z.mp3"
    ]);
  expect(await page.evaluate(() => window.__childReadingAudioSources.some(src => src.includes("/letter_name/")))).toBe(false);
});

test("Guided Reading splits em-dash neighbours into separate audible word buttons", async ({ page }) => {
  await page.addInitScript(captureAudioPlayback);
  await page.goto("/preview/guided-reading-preview.html?book=ja-b-06");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  await reader.getByRole("button", { name: "Next page", exact: true }).click();

  const five = reader.getByRole("button", { name: "Get reading help for five", exact: true }).last();
  const safe = reader.getByRole("button", { name: "Get reading help for safe", exact: true });
  await expect(five).toBeVisible();
  await expect(safe).toBeVisible();
  await expect(reader.getByRole("button", { name: /five—safe/i })).toHaveCount(0);

  await safe.click();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/isolated_word/safe-");
});

test("Story Quest word taps repeat the word; spelling is an explicit separate choice", async ({ page }) => {
  await page.addInitScript(captureAudioPlayback);
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Dino", exact: true }).click();
  await page.locator(".kg-quest-open").filter({ hasText: "Shy’s Snail Trail" }).click();

  const reader = page.locator(".story-quest-reader");
  const word = reader.getByRole("button", { name: "Hear snail", exact: true });
  await word.click();
  await expect(reader.getByRole("group", { name: "Word help for snail" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/isolated_word/");

  const wholeWord = await page.evaluate(() => window.__childReadingAudioSources.at(-1));
  await word.click();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1))).toBe(wholeWord);
  expect(await page.evaluate(() => window.__childReadingAudioSources.some(src => src.includes("/letter_name/")))).toBe(false);
  await reader.getByRole("button", { name: "Hear the letters", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/letter_name/");
});
