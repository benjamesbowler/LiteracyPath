import { test, expect } from "@playwright/test";
import { HOP_AND_STOP_PAGES, HOP_AND_STOP_ACTIONS, HOP_AND_STOP_ROUNDS, HOP_AND_STOP_REQUIRED_MEDIA } from "../../src/data/hopAndStop.js";

test("the complete Books entry opens the actual song and leaving stops playback", async ({ page }, testInfo) => {
  // Exercise publication eligibility without creating a production receipt.
  await page.route("**/action-songs/hop-and-stop/release.json", route => route.fulfill({
    json: { schemaVersion: 1, id: "hop-and-stop", status: "complete", verifiedMedia: HOP_AND_STOP_REQUIRED_MEDIA }
  }));
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const open = page.getByRole("button", { name: "Open song and story", exact: true });
  await open.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.artifacts/hop-and-stop/books-${testInfo.project.name}.png` });
  await open.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Watch the song", exact: true }).click();
  const movie = page.getByLabel("Hop and Stop animated song", { exact: true });
  await expect.poll(() => movie.evaluate(video => video.readyState)).toBeGreaterThanOrEqual(2);
  expect(await movie.evaluate(video => video.duration)).toBeGreaterThan(72);
  // Space activates the real native media control, rather than mocking play().
  await movie.press("Space");
  await expect.poll(() => movie.evaluate(video => !video.paused && video.currentTime > 0)).toBe(true);
  await page.evaluate(() => { window.__hopVideoForExitCheck = document.querySelector("video"); });
  await page.getByRole("button", { name: "Choose an activity", exact: true }).click();
  expect(await page.evaluate(() => window.__hopVideoForExitCheck.paused)).toBe(true);
  await page.getByRole("button", { name: "Back to Books", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open song and story", exact: true })).toBeVisible();
});

test("a missing publication receipt keeps the unfinished unit out of Books", async ({ page }) => {
  await page.route("**/action-songs/hop-and-stop/release.json", route => route.fulfill({ status: 404, body: "Not released" }));
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await expect(page.getByRole("heading", { name: "Books", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open song and story", exact: true })).toHaveCount(0);
});

test("the reader-and-game download omits song controls throughout while keeping both activities reachable", async ({ page }) => {
  await page.goto("/preview/hop-and-stop.html?song=unavailable");
  const noSongControls = async () => {
    await expect(page.getByRole("button", { name: /Watch the song|Listen to the song|Stop song/ })).toHaveCount(0);
    await expect(page.locator('a[download][href$="hop-and-stop.mp4"], a[download][href$="hop-and-stop.mp3"]')).toHaveCount(0);
    await expect(page.locator("video")).toHaveCount(0);
  };
  await expect(page.getByText("Read together or play with Bouncy and Speedy.", { exact: true })).toBeVisible();
  await expect(page.getByText("8 story pages · 8 action rounds", { exact: true })).toBeVisible();
  await noSongControls();
  await page.getByRole("button", { name: "Read Together", exact: true }).click();
  await expect(page.locator("figcaption")).toHaveText(HOP_AND_STOP_PAGES[0].text);
  await noSongControls();
  await page.getByRole("button", { name: "Choose an activity", exact: true }).click();
  await page.getByRole("button", { name: "Play the action game", exact: true }).click();
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  for (const [index, round] of HOP_AND_STOP_ROUNDS.entries()) {
    await expect(page.getByText(`Round ${index + 1} of 8`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: HOP_AND_STOP_ACTIONS[round.target].alt, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "You tried all four actions!" })).toBeVisible();
  await noSongControls();
  await page.getByRole("button", { name: "Read Together", exact: true }).click();
  await expect(page.locator("figcaption")).toHaveText(HOP_AND_STOP_PAGES[0].text);
});

test("reader shows the exact pages and completes into an unscored game", async ({ page }) => {
  await page.goto("/preview/hop-and-stop.html");
  await page.getByRole("button", { name: "Read Together", exact: true }).click();
  for (const [index, item] of HOP_AND_STOP_PAGES.entries()) {
    await expect(page.getByText(`Page ${index + 1} of 8`, { exact: true })).toBeVisible();
    await expect(page.locator("figcaption")).toHaveText(item.text);
    await expect(page.getByRole("img", { name: item.alt, exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 7 ? "Finish story" : "Next page", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "You read the story together!" })).toBeVisible();
  await page.getByRole("button", { name: "Play the action game", exact: true }).click();
  await expect(page.getByText("Round 1 of 8", { exact: true })).toBeVisible();
});

test("sound-off support allows all eight untimed picture rounds, including a useful retry", async ({ page }) => {
  await page.goto("/preview/hop-and-stop.html");
  await page.getByRole("button", { name: "Play the action game", exact: true }).click();
  await expect(page.getByRole("button", { name: HOP_AND_STOP_ACTIONS.hop.alt, exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect(page.getByText("Sound is off. Read the word or ask a grown-up to say it.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: HOP_AND_STOP_ACTIONS.stop.alt, exact: true }).click();
  await expect(page.getByText("That picture shows stop. Let’s find hop.", { exact: true })).toBeVisible();
  await expect(page.getByText("Round 1 of 8", { exact: true })).toBeVisible();
  for (const [index, round] of HOP_AND_STOP_ROUNDS.entries()) {
    await expect(page.getByText(`Round ${index + 1} of 8`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: HOP_AND_STOP_ACTIONS[round.target].alt, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "You tried all four actions!" })).toBeVisible();
  await expect(page.getByText("8 action rounds finished", { exact: true })).toBeVisible();
  await expect(page.getByText(/score|mastery|independent accuracy/i)).toHaveCount(0);
});

test("a real cue failure exposes supported text instead of pretending the word was heard", async ({ page }) => {
  await page.route("**/action-songs/hop-and-stop/audio/hop.mp3", route => route.abort());
  await page.goto("/preview/hop-and-stop.html");
  await page.getByRole("button", { name: "Play the action game", exact: true }).click();
  await page.getByRole("button", { name: "Hear the word", exact: true }).click();
  await expect(page.getByText("A recording or picture is unavailable. Use the word and a grown-up’s help.", { exact: true })).toBeVisible();
  await expect(page.locator(".hop-stop-target")).toHaveText("hop");
  await expect(page.getByRole("button", { name: HOP_AND_STOP_ACTIONS.hop.alt, exact: true })).toBeEnabled();
});

test("pausing holds feedback and never submits another answer", async ({ page }) => {
  await page.goto("/preview/hop-and-stop.html");
  await page.getByRole("button", { name: "Play the action game", exact: true }).click();
  await page.getByRole("button", { name: "Show the word", exact: true }).click();
  await page.getByRole("button", { name: HOP_AND_STOP_ACTIONS.hop.alt, exact: true }).click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.waitForTimeout(1700);
  await expect(page.getByText("Round 1 of 8", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: HOP_AND_STOP_ACTIONS.stop.alt, exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await expect(page.getByText("Round 2 of 8", { exact: true })).toBeVisible();
});

test("page navigation and leaving the reader stop the actual page recording", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__hopAndStopRecordings = [];
    window.Audio = function (...args) {
      const recording = new NativeAudio(...args);
      window.__hopAndStopRecordings.push(recording);
      return recording;
    };
  });
  await page.goto("/preview/hop-and-stop.html");
  await page.getByRole("button", { name: "Read Together", exact: true }).click();
  await page.getByRole("button", { name: "Hear this page", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__hopAndStopRecordings.some(audio => !audio.paused && audio.currentTime > 0))).toBe(true);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  expect(await page.evaluate(() => window.__hopAndStopRecordings.every(audio => audio.paused))).toBe(true);
  await page.getByRole("button", { name: "Hear this page", exact: true }).click();
  await page.getByRole("button", { name: "Choose an activity", exact: true }).click();
  expect(await page.evaluate(() => window.__hopAndStopRecordings.every(audio => audio.paused))).toBe(true);
});
