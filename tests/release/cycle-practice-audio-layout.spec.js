import { expect, test } from "@playwright/test";

async function installAudioSpy(page) {
  await page.addInitScript(() => {
    window.__cyclePracticePlayedAudio = [];
    window.__cyclePracticeCreatedAudio = [];
    window.Audio = class CyclePracticeTestAudio extends EventTarget {
      constructor() {
        super();
        this._src = "";
        Object.defineProperty(this, "src", {
          configurable: true,
          get: () => this._src,
          set: value => {
            this._src = String(value || "");
            window.__cyclePracticeCreatedAudio.push(this._src);
          }
        });
        this.currentTime = 0;
        this.volume = 1;
        this.preload = "";
        this.timer = null;
      }

      load() {
        this.dispatchEvent(new Event("canplay"));
      }

      play() {
        window.__cyclePracticePlayedAudio.push(this.src);
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          this.timer = null;
          this.dispatchEvent(new Event("ended"));
        }, 4);
        return Promise.resolve();
      }

      pause() {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
      }
    };
  });
}

async function advanceRound(page) {
  const before = await page.locator(".cycle-practice-topbar__round strong").textContent();
  const choices = page.locator("[data-mechanic-stage] button:not(:disabled)");
  const count = await choices.count();
  for (let index = 0; index < count; index += 1) {
    await choices.nth(index).click();
    await page.waitForTimeout(1150);
    if ((await page.locator(".cycle-practice-topbar__round strong").textContent()) !== before) return true;
  }
  return false;
}

test("Cycle Practice warms ahead and plays Sound Catch target audio first", async ({ page }) => {
  await installAudioSpy(page);
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1");
  await expect(page.locator('[data-cycle-id="cycle-1"]')).toBeVisible();

  await expect.poll(() => page.evaluate(() => new Set(window.__cyclePracticeCreatedAudio).size))
    .toBeGreaterThanOrEqual(3);

  await advanceRound(page);
  await advanceRound(page);
  await page.evaluate(() => { window.__cyclePracticePlayedAudio = []; });
  await advanceRound(page);

  await expect(page.locator('[data-mechanic-stage="sound-choice"]')).toBeVisible();
  const played = await page.evaluate(() => window.__cyclePracticePlayedAudio);
  expect(played.length).toBeGreaterThan(0);
  expect(played[0]).not.toMatch(/\/audio\/production\/en-US\/instruction\//u);
  expect(played[0]).toMatch(/\/audio\/(?:phonemes|production\/en-US\/isolated_word)\//u);
});

test("Cycle Practice gives Sound Hunt the full stage", async ({ page }) => {
  await installAudioSpy(page);
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1");

  for (let index = 0; index < 8; index += 1) {
    const advanced = await advanceRound(page);
    if (!advanced) break;
  }

  await expect(page.locator('[data-mechanic-stage="scene-hunt"]')).toBeVisible();
  const cards = page.locator(".am-scene-object");
  await expect(cards).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const box = await cards.nth(index).boundingBox();
    expect(box?.width).toBeGreaterThan(220);
    expect(box?.height).toBeGreaterThan(250);
  }
  await expect(page.locator('[data-audio-action="replay"]')).toHaveCount(2);
  await expect(page.locator(".am-scene-hear-name")).toHaveCount(3);
});
