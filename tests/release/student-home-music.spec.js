import { expect, test } from "@playwright/test";

const MUSIC_KEY = "lp-child-home-music-enabled-v1:student-home-preview";

test("child Home music loops quietly, persists its toggle, and stops at the audio boundary", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/preview/student-home-preview.html");
  await page.evaluate(key => window.localStorage.removeItem(key), MUSIC_KEY);
  await page.reload();

  const control = page.locator("[data-child-home-music]");
  const audio = page.locator("[data-child-home-music-audio]");
  await expect(control).toHaveCount(1);
  await expect(audio).toHaveAttribute("data-track-id", "a-to-z-animal-song");

  if (await control.getAttribute("data-playback-state") !== "playing") {
    await control.click();
  }
  await expect(control).toHaveAttribute("data-playback-state", "playing");
  await expect(control).toHaveText("Music on");
  await expect(control).toHaveAttribute("aria-pressed", "true");

  const playing = await audio.evaluate(element => ({
    paused: element.paused,
    loop: element.loop,
    volume: element.volume,
    source: element.currentSrc
  }));
  expect(playing.paused).toBe(false);
  expect(playing.loop).toBe(true);
  expect(playing.volume).toBeCloseTo(0.14, 5);
  expect(playing.source).toMatch(/\/audio\/music\/child-home\/a-to-z-animal-song\.mp3$/);

  await control.click();
  await expect(control).toHaveAttribute("data-playback-state", "off");
  await expect(control).toHaveText("Music off");
  expect(await page.evaluate(key => window.localStorage.getItem(key), MUSIC_KEY)).toBe("false");
  expect(await audio.evaluate(element => ({ paused: element.paused, currentTime: element.currentTime })))
    .toEqual({ paused: true, currentTime: 0 });

  await page.reload();
  await expect(page.locator("[data-child-home-music]"))
    .toHaveAttribute("data-playback-state", "off");

  await page.locator("[data-child-home-music]").click();
  await expect(page.locator("[data-child-home-music]"))
    .toHaveAttribute("data-playback-state", "playing");
  expect(await page.evaluate(key => window.localStorage.getItem(key), MUSIC_KEY)).toBe("true");

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("lp-stop-child-audio", { detail: { reason: "test" } }));
  });
  await expect(page.locator("[data-child-home-music]"))
    .toHaveAttribute("data-playback-state", "waiting");
  expect(await page.locator("[data-child-home-music-audio]").evaluate(element => element.paused)).toBe(true);
  expect(pageErrors).toEqual([]);
});
