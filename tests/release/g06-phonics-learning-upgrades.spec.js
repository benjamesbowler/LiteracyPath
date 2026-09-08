import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus || page.isClosed()) return;
  const audio = await page.evaluate(() => window.__g06Audio ? {
    ...window.__g06Audio,
    live: window.Howler._howls.map(howl => ({ src: howl._src, playing: howl.playing(),
      sounds: howl._sounds.map(sound => ({ id: sound._id, paused: sound._paused, ended: sound._ended })) }))
  } : null).catch(() => null);
  if (audio) await testInfo.attach("recorded-playback-owners", { body: JSON.stringify(audio, null, 2), contentType: "application/json" });
});

async function openBuildWithStalledFinalRecording(page) {
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=2");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();
  await expect(page.locator(".cvc-build-step")).toBeVisible();
  await page.evaluate(async () => {
    const { getLetterSoundCue } = await import("/src/components/learn/phonics/cvc/cvcHelpers.js");
    const target = getLetterSoundCue("t", { vowel: "a" }).src;
    window.__g06Audio = { target, events: [] };
    const prototype = window.Howl.prototype;
    const emit = prototype._emit;
    prototype._emit = function (event, id, ...args) {
      const owned = this._src === target;
      if (event === "play") {
        window.__g06Audio.events.push({ event, id, src: this._src, playing: this.playing(id), at: performance.now() });
        // Keep the real decoded recording playing, but withhold its terminal
        // signal to reproduce a playback owner that starts and never settles.
        if (owned) this.loop(true, id);
      }
      if (owned && event === "end") return this;
      if (owned && event === "stop") window.__g06Audio.events.push({ event, id, src: this._src, at: performance.now() });
      return emit.call(this, event, id, ...args);
    };
  });
  for (const letter of ["c", "a", "t"]) {
    await page.getByRole("button", { name: `Use ${letter}`, exact: true }).first().click();
  }
  await expect.poll(() => page.evaluate(() => window.__g06Audio.events.some(event => event.event === "play" && event.src === window.__g06Audio.target && event.playing))).toBe(true);
}

test("Build cancels a real final recording that starts but never ends and saves supported delivery", async ({ page }) => {
  test.setTimeout(60000);
  await openBuildWithStalledFinalRecording(page);
  const next = page.getByRole("button", { name: "Next Word", exact: true });
  await expect(next).toBeDisabled();
  await expect(next).toBeEnabled({ timeout: 20000 });
  await expect(page.getByText("The sound did not finish. Your word is still built.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__g06Audio.events.some(event => event.event === "stop"))).toBe(true);
  expect(await page.evaluate(() => window.Howler._howls.some(howl => howl._src === window.__g06Audio.target && howl.playing()))).toBe(false);
  await next.click();
  await page.evaluate(() => window.Howler.mute(true));
  for (const word of ["bat", "hat"]) {
    for (const letter of word) await page.getByRole("button", { name: `Use ${letter}`, exact: true }).first().click();
    await page.getByRole("button", { name: word === "hat" ? "Continue" : "Next Word", exact: true }).click();
  }
  for (const letter of ["b", "h"]) await page.getByRole("button", { name: `Change to ${letter}`, exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Nest Built!", { exact: true })).toBeVisible();
  const build = await page.evaluate(() => JSON.parse(localStorage.getItem("lp_cvc_progress_child-surface-preview"))?.at?.completions?.at(-1)?.steps.find(step => step.step === "build"));
  expect(build.audioDelivery).toBe("unavailable");
  expect(build.supportUsed).toContain("media_unavailable");
  expect(build.independent).toBe(false);
});

test("leaving Build invalidates a started final recording before its timeout", async ({ page }) => {
  test.setTimeout(60000);
  await openBuildWithStalledFinalRecording(page);
  await page.getByRole("button", { name: "Back to words", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Word Workshop", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.Howler._howls.some(howl => howl.playing())), { timeout: 1500 }).toBe(false);
  const plays = await page.evaluate(() => new Set(window.__g06Audio.events.filter(event => event.event === "play").map(event => `${event.src}:${event.id}`)).size);
  await page.waitForTimeout(4500);
  expect(await page.evaluate(() => new Set(window.__g06Audio.events.filter(event => event.event === "play").map(event => `${event.src}:${event.id}`)).size)).toBe(plays);
  expect(await page.evaluate(() => window.Howler._howls.some(howl => howl.playing()))).toBe(false);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lp_cvc_progress_child-surface-preview"))?.at?.completions?.length || 0)).toBe(0);
});

test("picture replay supersedes the final tile without an automatic blend stealing its owner", async ({ page }) => {
  test.setTimeout(60000);
  await openBuildWithStalledFinalRecording(page);
  const plays = await page.evaluate(() => new Set(window.__g06Audio.events.filter(event => event.event === "play").map(event => `${event.src}:${event.id}`)).size);
  await page.getByRole("button", { name: "Hear cat", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.Howler._howls.some(howl => howl._src === window.__g06Audio.target && howl.playing())), { timeout: 1500 }).toBe(false);
  await expect(page.getByRole("button", { name: "Next Word", exact: true })).toBeEnabled();
  await expect(page.getByText("The sound did not finish. Your word is still built.", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Set(window.__g06Audio.events.filter(event => event.event === "play").map(event => `${event.src}:${event.id}`)).size)).toBe(plays + 1);
  await page.waitForTimeout(4500);
  expect(await page.evaluate(() => new Set(window.__g06Audio.events.filter(event => event.event === "play").map(event => `${event.src}:${event.id}`)).size)).toBe(plays + 1);
});

test("Word Magic models a change before offering authored grapheme choices", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=3");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();

  await expect(page.getByRole("button", { name: "Change to b", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change to b", exact: true }).click();
  await expect(page.getByRole("group", { name: "Target word hat" })).toBeVisible();
  await expect(page.getByText("Change bat to hat. Change the first sound from b to h.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hear target hat", exact: true })).toBeVisible();
  await expect(page.getByText("Choose the grapheme that makes hat.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change to h", exact: true })).toBeEnabled();
  await expect(page.locator(".cvc-magic-choice")).toHaveCount(2);
  await expect(page.locator(".cvc-magic-choice-image")).toHaveCount(0);

  await page.getByRole("button", { name: "Change to c", exact: true }).click();
  await expect(page.locator(".cvc-magic-feedback")).toContainText("different target");
  await expect(page.getByRole("button", { name: "Change to h", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Change to h", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Nest Built!", { exact: true })).toBeVisible();
  const completion = await page.evaluate(() => JSON.parse(localStorage.getItem("lp_cvc_progress_child-surface-preview"))?.at?.completions?.at(-1));
  const magic = completion.steps.find(step => step.step === "magic");
  expect(magic.supportUsed).toContain("target_grapheme_prompt");
  expect(magic.supportUsed).not.toContain("independent_choice");
  expect(magic.firstResponse.targetWord).toBe("hat");
  expect(magic.firstResponse.selectedWord).toBe("cat");
  expect(magic.firstResponse.selected).toBe("c");
  expect(magic.attempts).toBe(2);
});

test("two-word Word Magic families get a reverse grapheme choice", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=3");
  await page.getByRole("button", { name: "un word nest", exact: true }).click();

  await expect(page.getByRole("button", { name: "Change to b", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change to b", exact: true }).click();
  await expect(page.getByRole("group", { name: "Target word sun" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change to s", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Change to b", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Change to s", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Nest Built!", { exact: true })).toBeVisible();
  const completion = await page.evaluate(() => JSON.parse(localStorage.getItem("lp_cvc_progress_child-surface-preview"))?.un?.completions?.at(-1));
  const magic = completion.steps.find(step => step.step === "magic");
  expect(magic.firstResponse.targetWord).toBe("sun");
  expect(magic.firstResponse.selectedWord).toBe("sun");
  expect(magic.supportUsed).toContain("target_grapheme_prompt");
});

test("Match corrections keep a wrong picture retryable", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=3");
  await page.getByRole("button", { name: /^Letter A(?:,|$)/ }).click();
  const wrong = page.getByRole("button", { name: "Word tile: dog", exact: true });
  await wrong.click();
  await expect(page.locator(".phonics-match-hint")).toContainText("starts with D");
  await expect(wrong).toBeEnabled();
  await wrong.click();
  await expect(page.locator(".phonics-match-hint")).toContainText("starts with D");
});

test("Listen follows the authored ending contract and keeps picture taps available", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&step=2");
  await page.getByRole("button", { name: /^Letter X(?:,|$)/ }).click();

  await expect(page.getByText("Look at each picture. The ending sound is X.", { exact: true })).toBeVisible();
  const cards = page.locator(".phonics-listen-card");
  await expect(cards).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Hear the word fox", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Hear the word fox", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "could not play" })).toBeVisible();
});

test("Build exposes a bounded supported continuation above the tab bar", async ({ page }) => {
  await page.route("**/*.mp3", route => route.abort());
  await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1");
  await page.getByRole("button", { name: "at word nest", exact: true }).click();

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
    await page.getByRole("button", { name: "Continue with support", exact: true }).click();
  }
  await expect(page.locator(".cvc-build-step")).toBeVisible();

  for (const letter of ["c", "a", "t"]) {
    await page.getByRole("button", { name: `Use ${letter}`, exact: true }).first().click();
  }

  const nextWord = page.getByRole("button", { name: "Next Word", exact: true });
  await expect(nextWord).toBeVisible();
  const nextWordBox = await nextWord.boundingBox();
  const tabs = await page.locator(".kg-tabbar").boundingBox();
  expect((nextWordBox?.y || 0) + (nextWordBox?.height || 0)).toBeLessThanOrEqual((tabs?.y || 0) + 1);
  await expect(nextWord).toBeEnabled();
});
