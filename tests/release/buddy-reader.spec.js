import { expect, test } from "@playwright/test";

test("Buddy Reader alternates a child turn with LEDA and records no child media", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__buddyAudio = null;
    window.Audio = class PreviewAudio {
      constructor(src) { this.src = src; window.__buddyAudio = this; }
      play() { return Promise.resolve(); }
      pause() {}
      load() {}
    };
  });
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");
  const reader = page.getByRole("region", { name: /full-screen reader/ });
  await reader.getByRole("button", { name: "Read with Leda" }).click();

  const buddy = reader.getByRole("region", { name: "Buddy Reader with Leda" });
  await expect(buddy).toContainText("Your turn");
  await expect(buddy).toContainText("Your voice is never recorded");
  await buddy.getByRole("button", { name: "I read this page" }).click();
  await expect(buddy).toContainText("Leda’s turn");
  await buddy.getByRole("button", { name: "Hear Leda read" }).click();
  await page.evaluate(() => window.__buddyAudio.onended());
  await expect(buddy.getByRole("button", { name: "My turn next" })).toBeVisible();
  await buddy.getByRole("button", { name: "My turn next" }).click();
  await expect(buddy).toContainText("Your turn");

  const evidence = await page.evaluate(() => {
    const record = Object.values(window.__guidedReadingPreviewRecords)[0];
    return record.buddyReader;
  });
  expect(evidence.childMediaCollected).toBe(false);
  expect(evidence.turns).toHaveLength(2);
  expect(evidence.turns.every(turn => turn.scored === false)).toBe(true);
  expect(errors).toEqual([]);
});

test("Buddy Reader remains usable on a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");
  const reader = page.getByRole("region", { name: /full-screen reader/ });
  await reader.getByRole("button", { name: "Read with Leda" }).click();
  const buddy = reader.getByRole("region", { name: "Buddy Reader with Leda" });
  await expect(buddy).toBeVisible();
  const metrics = await buddy.evaluate(element => ({
    overflow: element.scrollWidth - element.clientWidth,
    buttonHeights: [...element.querySelectorAll("button")].map(button => button.getBoundingClientRect().height)
  }));
  expect(metrics.overflow).toBe(0);
  expect(Math.min(...metrics.buttonHeights)).toBeGreaterThanOrEqual(56);
});

test("phone landscape fullscreen gives the book page the flexible workspace", async ({ page }) => {
  await page.addInitScript(() => {
    let fullscreenElement = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement
    });
    HTMLElement.prototype.requestFullscreen = async function requestFullscreen() {
      fullscreenElement = this;
      document.dispatchEvent(new Event("fullscreenchange"));
    };
    document.exitFullscreen = async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    };
  });
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");
  const reader = page.getByRole("region", { name: /full-screen reader/ });
  await reader.getByRole("group", { name: "Reader view controls" }).getByRole("button", { name: "Full screen" }).click();
  await expect(reader).toHaveClass(/fullscreen/);
  await expect(reader.getByRole("region", { name: "Buddy Reader option" })).toHaveCount(0);
  const workspace = await reader.locator(".guided-page-layout").evaluate(element => ({
    height: element.getBoundingClientRect().height,
    width: element.getBoundingClientRect().width
  }));
  expect(workspace.height).toBeGreaterThanOrEqual(140);
  expect(workspace.width).toBeGreaterThanOrEqual(500);
  await expect(reader.locator(".guided-page-image-card img")).toBeVisible();
  await expect(reader.locator(".guided-page-text")).toBeVisible();
});
