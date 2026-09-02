import { expect, test } from "@playwright/test";

async function visibleEnabledButtonGeometry(reader) {
  return reader.locator("button:not(:disabled)").evaluateAll(buttons => buttons.flatMap(button => {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    if (
      rect.width <= 0
      || rect.height <= 0
      || style.display === "none"
      || style.visibility === "hidden"
      || rect.bottom <= 0
      || rect.top >= window.innerHeight
      || rect.right <= 0
      || rect.left >= window.innerWidth
    ) return [];

    return [{
      bottom: rect.bottom,
      height: rect.height,
      label: button.getAttribute("aria-label") || button.textContent?.trim() || "button",
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width
    }];
  }));
}

function expectChildTargetsToFitViewport(controls, viewport) {
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(control.width, `${control.label} target width`).toBeGreaterThanOrEqual(56);
    expect(control.height, `${control.label} target height`).toBeGreaterThanOrEqual(56);
    expect(control.left, `${control.label} left edge`).toBeGreaterThanOrEqual(0);
    expect(control.top, `${control.label} top edge`).toBeGreaterThanOrEqual(0);
    expect(control.right, `${control.label} right edge`).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(control.bottom, `${control.label} bottom edge`).toBeLessThanOrEqual(viewport.height + 0.5);
  }
}

function rectanglesOverlap(first, second) {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

test("A2.8 Guided Reading keeps the forward page action primary and groups audio and view controls", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  const reader = page.getByRole("region", { name: /full-screen reader/ });
  const readAloud = reader.getByRole("group", { name: "Read aloud controls" });
  const readPage = readAloud.getByRole("button", { name: "Read page", exact: true });
  const progress = reader.getByRole("status", { name: "Reading progress" });
  const viewControls = reader.getByRole("group", { name: "Reader view controls" });

  await expect(readPage).toBeVisible();
  await expect(readPage).toHaveClass(/lp-button-secondary/);
  await expect(readPage).toHaveClass(/guided-read-page-audio/);
  await expect(readPage).not.toHaveClass(/lp-button-primary/);
  await expect(readPage).toHaveAttribute("data-control-priority", "secondary");
  await expect(readAloud.getByRole("button", { name: "Read whole book", exact: true }))
    .toHaveClass(/lp-button-secondary/);

  const nextPage = reader.getByRole("button", { name: "Next page", exact: true });
  await expect(nextPage).toHaveClass(/lp-button-primary/);
  await expect(reader.locator(".lp-button-primary:visible")).toHaveCount(1);

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

test("teacher discussion support is collapsed, book-specific, and navigates to its visual page", async ({ page }) => {
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees&mode=teacher");

  const reader = page.getByRole("region", { name: /Honeybees and Pollination full-screen reader/ });
  const discussion = reader.getByText("Discuss this book", { exact: true }).locator("..");
  await expect(discussion).not.toHaveAttribute("open", "");
  await expect(discussion.getByText("How does a honeybee help fruit grow after it visits one flower?"))
    .not.toBeVisible();

  await discussion.getByText("Discuss this book", { exact: true }).click();
  await expect(discussion).toContainText("How does a honeybee help fruit grow after it visits one flower?");
  await expect(discussion).toContainText("nectar and dusty pollen");
  await discussion.getByRole("button", { name: "Look again at page 3" }).click();
  await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText(/Page 3 of \d+/);
});

test("student Guided Reading does not mount or serialize private discussion text", async ({ page }) => {
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  await expect(page.getByText("Discuss this book", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    "How does a honeybee help fruit grow after it visits one flower?"
  );
  await expect(page.locator("body")).not.toContainText("nectar and dusty pollen");
});

test("child Guided Reading exposes meaningful art, one primary, and 56px targets at supported sizes", async ({ page }) => {
  const cases = [
    { fullscreen: false, height: 953, width: 1467 },
    { fullscreen: false, height: 768, width: 1024 },
    { fullscreen: true, height: 320, width: 568 }
  ];

  for (const viewport of cases) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/guided-reading-preview.html?book=first-facts-level-a-03-big-and-little");
    await page.evaluate(() => document.fonts.ready);

    const reader = page.getByRole("region", { name: "Big and Little full-screen reader" });
    if (viewport.fullscreen) {
      await reader.getByRole("button", { name: "Full screen", exact: true }).click();
      await expect(reader).toHaveClass(/fullscreen/);
    }

    const pageImage = reader.locator(".guided-page-image");
    await expect(pageImage).toHaveAttribute(
      "alt",
      "Illustration for page 1 of Big and Little, matching the reading text: Big dog. Little bug."
    );
    await expect(reader.getByRole("button", { name: "Read page", exact: true }))
      .toHaveClass(/lp-button-secondary/);
    await expect(reader.locator(".lp-button-primary:visible")).toHaveCount(1);

    const controls = await visibleEnabledButtonGeometry(reader);
    expectChildTargetsToFitViewport(controls, viewport);

    const documentGeometry = await page.evaluate(() => ({
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(documentGeometry.scrollWidth).toBe(documentGeometry.clientWidth);
    expect(documentGeometry.scrollHeight).toBe(documentGeometry.clientHeight);
  }
});

test("locked Guided Reading keeps the teacher notice in the child header and clear of iPad controls", async ({ page }) => {
  const viewports = [
    { height: 1024, width: 768 },
    { height: 768, width: 1024 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees&locked=1");
    await page.evaluate(() => document.fonts.ready);

    const header = page.locator(".kg-header");
    const notice = header.locator(".student-session-notice--header");
    const reader = page.getByRole("region", { name: /full-screen reader/ });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("One Guided Reading Book");
    await expect(notice).toContainText("Your teacher has chosen this activity");

    const geometry = await page.evaluate(() => {
      const toRect = element => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top
        };
      };
      const noticeElement = document.querySelector(".student-session-notice--header");
      const headerElement = document.querySelector(".kg-header");
      const controls = [
        ...document.querySelectorAll(".guided-page-controls button:enabled, .guided-reader-actions button:enabled")
      ].filter(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0
          && rect.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden";
      });
      return {
        header: toRect(headerElement),
        notice: toRect(noticeElement),
        noticePosition: getComputedStyle(noticeElement).position,
        controls: controls.map(toRect)
      };
    });

    expect(geometry.noticePosition).toBe("static");
    expect(geometry.notice.top).toBeGreaterThanOrEqual(geometry.header.top - 0.5);
    expect(geometry.notice.bottom).toBeLessThanOrEqual(geometry.header.bottom + 0.5);
    expect(geometry.controls.length).toBeGreaterThan(0);
    for (const control of geometry.controls) {
      expect(rectanglesOverlap(geometry.notice, control)).toBe(false);
    }
    await expect(reader).toBeVisible();

    await reader.getByRole("button", { name: "Full screen", exact: true }).click();
    await expect(reader).toHaveClass(/fullscreen/);
    const fullscreenStack = await page.evaluate(() => {
      const noticeElement = document.querySelector(".student-session-notice--header");
      const readerElement = document.querySelector(".guided-reader-shell.fullscreen");
      const noticeRect = noticeElement.getBoundingClientRect();
      const controlRegions = [
        ...document.querySelectorAll(".guided-page-controls, .guided-read-aloud-controls")
      ].map(element => element.getBoundingClientRect()).filter(rect => (
        rect.width > 0 && rect.height > 0
      ));
      const overlappingRegions = controlRegions.filter(rect => (
        noticeRect.left < rect.right
        && noticeRect.right > rect.left
        && noticeRect.top < rect.bottom
        && noticeRect.bottom > rect.top
      ));
      const previousPointerEvents = noticeElement.style.pointerEvents;
      noticeElement.style.pointerEvents = "auto";
      const noticePaintsAboveControls = overlappingRegions.some(rect => {
        const left = Math.max(noticeRect.left, rect.left);
        const right = Math.min(noticeRect.right, rect.right);
        const top = Math.max(noticeRect.top, rect.top);
        const bottom = Math.min(noticeRect.bottom, rect.bottom);
        const topElement = document.elementFromPoint(
          left + ((right - left) / 2),
          top + ((bottom - top) / 2)
        );
        return noticeElement === topElement || noticeElement.contains(topElement);
      });
      noticeElement.style.pointerEvents = previousPointerEvents;
      return {
        noticePaintsAboveControls,
        overlappingRegionCount: overlappingRegions.length,
        readerPosition: getComputedStyle(readerElement).position,
        readerZIndex: getComputedStyle(readerElement).zIndex
      };
    });
    expect(fullscreenStack.overlappingRegionCount).toBeGreaterThan(0);
    expect(fullscreenStack.noticePaintsAboveControls).toBe(false);
    expect(fullscreenStack.readerPosition).toBe("fixed");
    expect(Number(fullscreenStack.readerZIndex)).toBeGreaterThan(0);
    await reader.getByRole("button", { name: "Exit", exact: true }).click();
    await expect(reader).not.toHaveClass(/fullscreen/);
  }
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
