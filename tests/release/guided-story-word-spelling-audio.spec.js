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
    return Promise.resolve();
  };
}

test("Guided Reading word taps reach recorded whole-word and letter-name audio", async ({ page }) => {
  await page.addInitScript(captureAudioPlayback);
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  const word = reader.getByRole("button", { name: "Get reading help for garden", exact: true });
  await word.click();
  await expect(reader.locator(".guided-decoding-support.stage-whole_word_audio")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/isolated_word/");

  await word.click();
  await expect(reader.locator(".guided-decoding-support.stage-letter_spelling")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/letter_name/");
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

test("Story Quest word taps play the word, then its recorded spelling", async ({ page }) => {
  await page.addInitScript(captureAudioPlayback);
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Dino", exact: true }).click();
  await page.getByRole("button").filter({ hasText: "Shy's Snail Shade" }).click();

  const reader = page.getByRole("region", { name: "Shy's Snail Shade Story Quest" });
  const word = reader.locator(".story-quest-word").first();
  await word.click();
  await expect(reader.locator(".story-quest-word-support.stage-whole_word")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/isolated_word/");

  await word.click();
  await expect(reader.locator(".story-quest-word-support.stage-letter_spelling")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__childReadingAudioSources.at(-1) || ""))
    .toContain("/audio/production/en-US/letter_name/");
});
