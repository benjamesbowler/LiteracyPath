import { expect, test } from "@playwright/test";

test("A2.8 Guided Reading makes Read Page primary and groups view controls", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  const readAloud = reader.getByRole("group", { name: "Read aloud controls" });
  const readPage = readAloud.getByRole("button", { name: "Read page", exact: true });
  const progress = reader.getByRole("status", { name: "Reading progress" });
  const viewControls = reader.getByRole("group", { name: "Reader view controls" });

  await expect(readPage).toBeVisible();
  await expect(readPage).toHaveClass(/lp-button-primary/);
  await expect(readPage).toHaveAttribute("data-control-priority", "primary");
  await expect(readAloud.getByRole("button", { name: "Read whole book", exact: true }))
    .toHaveClass(/lp-button-secondary/);

  await expect(progress).toHaveText(/Page 1 of \d+/);
  await expect(progress).toHaveJSProperty("tagName", "P");
  await expect(viewControls.getByRole("button", { name: "Full screen", exact: true }))
    .toHaveClass(/lp-button-secondary/);
  await expect(viewControls.getByRole("button", { name: "Back to library", exact: true }))
    .toHaveClass(/lp-button-secondary/);
  await expect(viewControls.getByRole("button", { name: "Read page", exact: true }))
    .toHaveCount(0);
  await expect(reader.locator(".guided-reader-header")).toHaveScreenshot(
    testInfo.project.name === "mobile"
      ? "guided-reading-control-hierarchy-mobile.png"
      : "guided-reading-control-hierarchy.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01
    }
  );

  await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveText(/Page 2 of \d+/);

  await viewControls.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(reader.getByRole("group", { name: "Page navigation" })).toBeVisible();
  await expect(viewControls.getByRole("button", { name: "Exit", exact: true })).toBeVisible();
  await expect(viewControls.getByRole("button", { name: "Back to library", exact: true }))
    .toHaveCount(0);
  await expect(reader.getByRole("status", { name: "Reading progress" }))
    .toHaveText(/Page 2 of \d+/);

  expect(pageErrors).toEqual([]);
});

test("normal child full-book audio ignores stale group-reading state", async ({ page }) => {
  await page.addInitScript(() => {
    window.__guidedReadingPlayCalls = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__guidedReadingLastPlayedAudio = this;
      window.__guidedReadingPlayCalls.push(this.src || this.currentSrc || "");
      return Promise.resolve();
    };
  });
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees&stale-group=1");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  const readWholeBook = reader.getByRole("button", { name: "Read whole book", exact: true });
  await expect(readWholeBook).toBeVisible();
  await expect(readWholeBook).toBeEnabled();
  await expect(reader.locator(".guided-audio-notice")).toHaveCount(0);
  await readWholeBook.click();
  await expect(reader.getByRole("button", { name: "Stop book", exact: true })).toBeVisible();
  await expect(reader.locator(".guided-audio-notice")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__guidedReadingPlayCalls.length)).toBeGreaterThan(0);
});

test("Read whole book plays every page in order before it finishes", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    window.__guidedReadingSequenceAudio = [];
    window.__guidedReadingPlayCalls = [];
    window.Audio = function AuditedAudio(src) {
      const audio = new BrowserAudio(src);
      window.__guidedReadingSequenceAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = BrowserAudio.prototype;
    HTMLMediaElement.prototype.play = function play() {
      window.__guidedReadingLastPlayedAudio = this;
      window.__guidedReadingPlayCalls.push(this.src || this.currentSrc || "");
      return Promise.resolve();
    };
  });
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  const progress = reader.getByRole("status", { name: "Reading progress" });
  const progressText = await progress.textContent();
  const totalPages = Number(progressText?.match(/of (\d+)/)?.[1] || 0);
  expect(totalPages).toBeGreaterThan(1);

  await reader.getByRole("button", { name: "Read whole book", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__guidedReadingPlayCalls.length)).toBe(1);

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    await page.evaluate(() => {
      window.__guidedReadingLastPlayedAudio?.onended?.();
    });
    await expect(progress).toHaveText(`Page ${pageNumber} of ${totalPages}`, { timeout: 10_000 });
    await expect.poll(
      () => page.evaluate(() => window.__guidedReadingPlayCalls.length),
      { timeout: 10_000 }
    ).toBe(pageNumber);
  }

  const playedSources = await page.evaluate(() => window.__guidedReadingPlayCalls);
  expect(new Set(playedSources).size).toBe(totalPages);
  await page.evaluate(() => {
    window.__guidedReadingLastPlayedAudio?.onended?.();
  });
  await expect(reader.getByRole("button", { name: "Read whole book", exact: true }))
    .toBeVisible({ timeout: 10_000 });
});
