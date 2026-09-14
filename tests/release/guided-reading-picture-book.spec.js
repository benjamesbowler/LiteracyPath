import { expect, test } from "@playwright/test";
import { MISSING_SANDWICH_BOOK_ID } from "../../src/data/meadowPalsScienceBooks.js";

const bookUrl = `/preview/guided-reading-preview.html?book=${MISSING_SANDWICH_BOOK_ID}`;

async function geometry(reader) {
  return reader.evaluate(element => {
    const rect = node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom, right: box.right };
    };
    const text = element.querySelector(".guided-page-text");
    const image = element.querySelector(".guided-page-image");
    return {
      shell: rect(element),
      bar: rect(element.querySelector(".guided-transport")),
      page: rect(element.querySelector(".guided-page-layout")),
      image: rect(image),
      imageLoaded: image.naturalWidth > 0,
      objectFit: getComputedStyle(image).objectFit,
      font: parseFloat(getComputedStyle(text).fontSize),
      textOverflow: text.scrollHeight > text.clientHeight + 1,
      textScroll: getComputedStyle(text).overflowY,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight
    };
  });
}

for (const viewport of [
  { width: 1467, height: 885 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 568, height: 320 },
  { width: 320, height: 568 }
]) {
  test(`picture book keeps its art, text and compact transport reachable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${bookUrl}&mode=class`);
    await page.evaluate(() => document.fonts.ready);
    const reader = page.getByRole("region", { name: "The Case of the Missing Sandwich full-screen reader" });
    const progress = reader.getByRole("status", { name: "Reading progress" });
    await expect(reader).toHaveClass(/picture-book/);
    await expect(reader.locator(".guided-reader-modebar")).toHaveCount(0);
    await expect(reader.getByText("Discuss this book", { exact: true })).not.toBeVisible();

    for (let pageNumber = 1; pageNumber <= 12; pageNumber += 1) {
      await expect(progress).toHaveText(`Page ${pageNumber} of 12`);
      await expect(reader.locator(".guided-page-layout")).toHaveAttribute("data-page-number", String(pageNumber));
      await expect(reader.locator(".guided-page-text")).toHaveClass(/is-ready/);
      await expect.poll(() => reader.locator(".guided-page-image").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      if (viewport.width >= 768) {
        await expect.poll(async () => (await geometry(reader)).textOverflow, {
          message: `page ${pageNumber} finishes fitting its text`, timeout: 3000
        }).toBe(false);
      }
      const measured = await geometry(reader);
      expect(measured.bar.y).toBeGreaterThanOrEqual(0);
      expect(measured.bar.height).toBeLessThanOrEqual(viewport.width <= 480 ? 128 : 72);
      expect(measured.page.y).toBeLessThanOrEqual(measured.bar.bottom + 1);
      expect(measured.page.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(measured.shell.width).toBeCloseTo(viewport.width, 0);
      expect(measured.shell.height).toBeCloseTo(viewport.height, 0);
      expect(measured.imageLoaded).toBe(true);
      expect(measured.objectFit).toBe("contain");
      expect(measured.font).toBeGreaterThanOrEqual(18);
      expect(measured.font).toBeLessThanOrEqual(24);
      expect(measured.documentWidth).toBe(viewport.width);
      expect(measured.documentHeight).toBe(viewport.height);
      if (viewport.width >= 768) expect(measured.textOverflow, `page ${pageNumber} text fits`).toBe(false);
      else if (measured.textOverflow) {
        expect(measured.textScroll).toBe("auto");
        await reader.locator(".guided-word").last().scrollIntoViewIfNeeded();
        await expect(reader.locator(".guided-word").last()).toBeInViewport();
      }
      if (viewport.width > viewport.height && viewport.width >= 1024) {
        expect(measured.image.width).toBeGreaterThan(viewport.width * 0.65);
      }
      await expect(reader.locator(".lp-button-primary:visible")).toHaveCount(1);
      if (pageNumber === 1) {
        await page.screenshot({ path: testInfo.outputPath("reader.png") });
        const controls = await reader.locator(".guided-transport button:visible, .guided-transport summary:visible").all();
        for (const control of controls) {
          const box = await control.boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(56);
          expect(box.height).toBeGreaterThanOrEqual(56);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      }
      if (pageNumber < 12) await reader.getByRole("button", { name: "Next page", exact: true }).click();
    }
    await reader.getByRole("button", { name: "Finish book", exact: true }).click();
    await expect(reader).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("teacher discussion opens over the book, restores focus and never takes its page space", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${bookUrl}&mode=class`);
  const reader = page.locator(".guided-reader-shell");
  const before = await reader.locator(".guided-page-layout").boundingBox();
  const more = reader.getByLabel("More reader controls");
  await more.click();
  await reader.getByText("Discuss this book", { exact: true }).click();
  await expect(reader.getByText(/Muddy thought the whole sandwich became poop/)).toBeVisible();
  const after = await reader.locator(".guided-page-layout").boundingBox();
  for (const dimension of ["x", "y", "width", "height"]) expect(after[dimension]).toBeCloseTo(before[dimension], 0);
  await reader.getByRole("button", { name: "Look again at page 7" }).click();
  await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText("Page 7 of 12");
  await expect(reader.locator(".guided-transport-options")).not.toHaveAttribute("open", "");
  await expect(reader.locator(".guided-transport-options > summary")).toBeFocused();
  await more.click();
  await reader.getByRole("button", { name: "Line focus" }).click();
  await expect(reader.getByRole("button", { name: "Line focus" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(reader.locator(".guided-transport-options")).not.toHaveAttribute("open", "");
  await expect(reader.locator(".guided-page-text")).toHaveClass(/line-focus-enabled/);
});

test("student picture-book transport keeps teacher discussion private and records completion", async ({ page }) => {
  await page.goto(bookUrl);
  const reader = page.locator(".guided-reader-shell");
  await expect(reader).toHaveClass(/picture-book/);
  await expect(reader.locator(".guided-reading-discussion")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Muddy thought the whole sandwich became poop");
  for (let next = 1; next < 12; next += 1) {
    await reader.getByRole("button", { name: "Next page", exact: true }).click();
  }
  await reader.getByRole("button", { name: "Finish book", exact: true }).click();
  await expect(reader).not.toBeVisible();
  expect(await page.evaluate(bookId => window.__guidedReadingPreviewRecords[bookId].completed, MISSING_SANDWICH_BOOK_ID)).toBe(true);
});

test("fullscreen stays usable when the browser declines the native request", async ({ page }) => {
  await page.addInitScript(() => {
    window.__readerFullscreenRequests = 0;
    HTMLElement.prototype.requestFullscreen = () => {
      window.__readerFullscreenRequests += 1;
      return Promise.reject(new Error("Native fullscreen unavailable"));
    };
  });
  await page.goto(`${bookUrl}&mode=class`);
  const reader = page.locator(".guided-reader-shell");
  await reader.getByLabel("More reader controls").click();
  await reader.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(reader).toHaveClass(/fullscreen/);
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText("Page 2 of 12");
  await reader.getByRole("button", { name: "Exit", exact: true }).click();
  await expect(reader).not.toHaveClass(/fullscreen/);
  await expect(reader).toBeVisible();
  expect(await page.evaluate(() => window.__readerFullscreenRequests)).toBe(1);
});

test("transport keeps pause, resume and stop available throughout full-book playback", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.addInitScript(() => {
    window.__transportPlays = [];
    HTMLMediaElement.prototype.play = function play() {
      if (this.src.includes("/meadow_science/")) {
        window.__transportAudio = this;
        window.__transportPlays.push(this.src);
      }
      return Promise.resolve();
    };
  });
  await page.goto(`${bookUrl}&mode=class`);
  const reader = page.locator(".guided-reader-shell");
  await reader.getByLabel("More reader controls").click();
  await reader.getByRole("button", { name: "Full screen", exact: true }).click();
  await expect(reader).toHaveClass(/fullscreen/);
  await reader.getByRole("button", { name: "Read whole book", exact: true }).click();
  await expect(reader.getByRole("button", { name: "Stop book", exact: true })).toBeVisible();
  await expect(reader.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await reader.getByRole("button", { name: "Pause", exact: true }).click();
  const resume = reader.getByRole("button", { name: "Resume", exact: true });
  await expect(resume).toBeInViewport();
  const bar = await reader.locator(".guided-transport").boundingBox();
  expect(bar.height).toBeLessThanOrEqual(72);
  await resume.click();
  await expect(reader.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  for (let next = 2; next <= 12; next += 1) {
    await expect.poll(() => page.evaluate(() => typeof window.__transportAudio?.onended)).toBe("function");
    await page.evaluate(() => { window.__transportAudio.onended(); });
    await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText(`Page ${next} of 12`);
    await expect.poll(() => page.evaluate(() => window.__transportAudio.src)).toContain(`page-${String(next).padStart(2, "0")}.mp3`);
  }
  await reader.getByRole("button", { name: "Stop book", exact: true }).click();
  await expect(reader.getByRole("button", { name: "Read whole book", exact: true })).toBeVisible();
  expect(new Set(await page.evaluate(() => window.__transportPlays)).size).toBe(12);
  await reader.getByRole("button", { name: "Finish book", exact: true }).click();
  await expect(reader).not.toBeVisible();
});
