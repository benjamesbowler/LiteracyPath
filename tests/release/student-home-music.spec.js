import { expect, test } from "@playwright/test";

const MUSIC_KEY = "lp-child-home-music-enabled-v1:student-home-preview";

async function instrumentMusic(page, { legacyPreference = null, blockFirstPlay = false, deferPlayback = false } = {}) {
  await page.addInitScript(({ key, saved, blocked, deferred }) => {
    if (saved === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, saved);
    window.__homeMusicPlayCalls = 0;
    window.__homeMusicPauseCalls = 0;
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function () {
      if (this.hasAttribute("data-child-home-music-audio")) {
        window.__homeMusicPlayCalls += 1;
        if (blocked && window.__homeMusicPlayCalls === 1) return Promise.reject(new DOMException("Tap to play", "NotAllowedError"));
        if (deferred) return new Promise(resolve => { window.__finishHomeMusicPlay = resolve; });
      }
      return play.call(this);
    };
    HTMLMediaElement.prototype.pause = function () {
      if (this.hasAttribute("data-child-home-music-audio")) window.__homeMusicPauseCalls += 1;
      return pause.call(this);
    };
  }, { key: MUSIC_KEY, saved: legacyPreference, blocked: blockFirstPlay, deferred: deferPlayback });
  await page.goto("/preview/student-home-preview.html");
}

async function unrelatedInput(page) {
  await page.locator("h1").click();
  await page.keyboard.press("Tab");
}

for (const legacyPreference of [null, "true", "false"]) {
  test(`Home music stays off without a music-control tap (legacy preference: ${legacyPreference})`, async ({ page }) => {
    await instrumentMusic(page, { legacyPreference });
    const control = page.locator("[data-child-home-music]");
    const audio = page.locator("[data-child-home-music-audio]");
    await expect(control).toHaveAttribute("data-playback-state", "off");
    await expect(control).toHaveAttribute("aria-pressed", "false");
    await expect(control).toHaveText("Music off");
    await unrelatedInput(page);
    expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(0);
    expect(await audio.evaluate(element => element.paused)).toBe(true);
  });
}

test("a Home music tap plays quietly, and a new visit always opens with music off", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await instrumentMusic(page);
  const control = page.locator("[data-child-home-music]");
  const audio = page.locator("[data-child-home-music-audio]");
  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "playing");
  await expect(control).toHaveText("Music on");
  await expect(control).toHaveAttribute("aria-pressed", "true");
  const playing = await audio.evaluate(element => ({
    paused: element.paused, loop: element.loop, volume: element.volume, source: element.currentSrc
  }));
  expect(playing.paused).toBe(false);
  expect(playing.loop).toBe(true);
  expect(playing.volume).toBeCloseTo(0.14, 5);
  expect(playing.source).toMatch(/\/audio\/music\/child-home\/a-to-z-animal-song\.mp3$/);
  expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(1);

  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "off");
  expect(await audio.evaluate(element => ({ paused: element.paused, currentTime: element.currentTime })))
    .toEqual({ paused: true, currentTime: 0 });
  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "playing");
  await page.reload();
  await expect(control).toHaveAttribute("data-playback-state", "off");
  await unrelatedInput(page);
  expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("a lifecycle stop or hidden page needs a fresh music-control tap", async ({ page }) => {
  await instrumentMusic(page);
  const control = page.locator("[data-child-home-music]");
  const audio = page.locator("[data-child-home-music-audio]");
  for (const boundary of ["child-audio", "hidden", "pagehide"]) {
    await control.click();
    await expect(control).toHaveAttribute("data-playback-state", "playing");
    const before = await page.evaluate(() => window.__homeMusicPlayCalls);
    await page.evaluate(reason => {
      if (reason === "hidden") {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
        document.dispatchEvent(new Event("visibilitychange"));
      } else if (reason === "pagehide") window.dispatchEvent(new Event("pagehide"));
      else window.dispatchEvent(new CustomEvent("lp-stop-child-audio", { detail: { reason: "test" } }));
    }, boundary);
    await expect(control).toHaveAttribute("data-playback-state", "off");
    expect(await audio.evaluate(element => element.paused)).toBe(true);
    await unrelatedInput(page);
    expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(before);
  }
});

test("blocked music never retries from an unrelated tap or key", async ({ page }) => {
  await instrumentMusic(page, { blockFirstPlay: true });
  const control = page.locator("[data-child-home-music]");
  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "waiting");
  await expect(control).toHaveText("Play music");
  await unrelatedInput(page);
  expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(1);
  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "playing");
  expect(await page.evaluate(() => window.__homeMusicPlayCalls)).toBe(2);
});

test("a late play promise cannot restart music after a lifecycle stop", async ({ page }) => {
  await instrumentMusic(page, { deferPlayback: true });
  const control = page.locator("[data-child-home-music]");
  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "starting");
  const pauses = await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("lp-stop-child-audio"));
    const count = window.__homeMusicPauseCalls;
    window.__finishHomeMusicPlay();
    return count;
  });
  await expect(control).toHaveAttribute("data-playback-state", "off");
  expect(await page.evaluate(() => window.__homeMusicPauseCalls)).toBeGreaterThan(pauses);
  expect(await page.locator("[data-child-home-music-audio]").evaluate(element => element.paused)).toBe(true);
});
