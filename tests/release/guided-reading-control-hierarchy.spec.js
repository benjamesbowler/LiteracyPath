import { expect, test } from "@playwright/test";

test("A2.8 Guided Reading makes Read Page primary and groups view controls", async ({ page }) => {
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
    "guided-reading-control-hierarchy.png",
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
      window.__guidedReadingPlayCalls.push(this.currentSrc || this.src || "");
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
