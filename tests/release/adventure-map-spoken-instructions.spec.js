import { expect, test } from "@playwright/test";

import { QUEST_STORY_QUESTIONS } from "../../src/data/generated/questStoryQuestions.generated.js";

const STATIONS = [
  ["cycle-1", "letters"],
  ["cycle-1", "sounds"],
  ["cycle-1", "hunt"],
  ["cycle-1", "quick"],
  ["cycle-1", "build"],
  ["cycle-1", "play"],
  ["cycle-1", "poem"],
  ["cycle-1", "story"],
  ["cycle-1", "trace"],
  ["cycle-1", "check"],
  ["cycle-25", "pattern"],
  ["cycle-25", "chain"],
  ["cycle-25", "speed"],
  ["cycle-25", "poem"],
  ["cycle-25", "spell"],
  ["cycle-25", "check"]
];

async function installAudioRecorder(page) {
  await page.addInitScript(() => {
    window.__adventurePlayedAudio = [];
    window.Audio = class TestAudio extends EventTarget {
      constructor(src = "") {
        super();
        this.src = String(src || "");
        this.currentTime = 0;
        this.volume = 1;
        this.preload = "";
      }

      load() {}

      play() {
        window.__adventurePlayedAudio.push(new URL(this.src, window.location.href).pathname);
        window.setTimeout(() => this.dispatchEvent(new Event("ended")), 5);
        return Promise.resolve();
      }

      pause() {}
    };
  });
}

async function playedAudio(page) {
  return page.evaluate(() => window.__adventurePlayedAudio || []);
}

async function clearPlayedAudio(page) {
  await page.evaluate(() => { window.__adventurePlayedAudio = []; });
}

test("every Adventure Map station speaks its instruction automatically and can replay it", async ({ page }) => {
  test.setTimeout(120_000);
  await installAudioRecorder(page);

  for (const [cycle, station] of STATIONS) {
    await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`);
    await expect(page.locator(`[data-quest-view="round"][data-station-id="${station}"]`)).toBeVisible();
    const replay = page.getByRole("button", { name: "Hear instructions again" });
    await expect(replay, `${cycle} ${station} needs a persistent instruction replay`).toBeVisible();
    await expect(replay).toHaveAttribute("data-instruction-audio", /\S/);

    await expect.poll(() => playedAudio(page), {
      message: `${cycle} ${station} must speak on entry`
    }).not.toEqual([]);
    const automatic = await playedAudio(page);

    // Let the mocked entry sequence finish before isolating the replay. The
    // real clips are several seconds long; the test double ends each clip in
    // 5ms but preserves the production 180ms breath between clips.
    await page.waitForTimeout(450);
    await clearPlayedAudio(page);
    await replay.click();
    await expect.poll(() => playedAudio(page), {
      message: `${cycle} ${station} must replay its instruction`
    }).not.toEqual([]);
    const replayed = await playedAudio(page);
    expect(replayed[0], `${cycle} ${station} must replay the same instruction first`).toBe(automatic[0]);
  }
});

test("Letter Spot keeps directions separate from the target letter-name cue", async ({ page }) => {
  await installAudioRecorder(page);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters");
  await expect(page.locator('[data-quest-view="round"][data-station-id="letters"]')).toBeVisible();

  await clearPlayedAudio(page);
  await page.getByRole("button", { name: "Hear instructions again" }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const instructionPaths = await playedAudio(page);

  await clearPlayedAudio(page);
  await page.getByRole("button", { name: "Listen" }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const targetPaths = await playedAudio(page);

  expect(instructionPaths[0]).not.toBe(targetPaths[0]);
});

test("a station tap starts its recorded direction once from the trusted gesture", async ({ page }) => {
  await installAudioRecorder(page);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1");
  await expect(page.getByRole("button", { name: /Letter Spot/i })).toBeVisible();

  await clearPlayedAudio(page);
  await page.getByRole("button", { name: /Letter Spot/i }).click();
  const replay = page.getByRole("button", { name: "Hear instructions again" });
  await expect(replay).toBeVisible();
  const instructionPath = await replay.getAttribute("data-instruction-audio");
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const automatic = await playedAudio(page);

  expect(automatic[0]).toBe(instructionPath);
  expect(automatic.filter(path => path === instructionPath)).toHaveLength(1);
});

test("Stop cancels a pending wrong-answer coaching cue", async ({ page }) => {
  await installAudioRecorder(page);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters");
  await expect(page.locator('[data-quest-view="round"][data-station-id="letters"]')).toBeVisible();

  // Let the automatic direction/target sequence finish, then capture the
  // current round's target cue independently from the mocked player.
  await page.waitForTimeout(450);
  await clearPlayedAudio(page);
  await page.getByRole("button", { name: "Listen" }).click();
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [targetPath] = await playedAudio(page);
  await page.waitForTimeout(30);
  await clearPlayedAudio(page);

  const shownLetter = (await page.locator(".sbq-round-display").textContent())?.trim().toLowerCase();
  const choices = page.locator(".sbq-answer-grid button");
  const choiceLabels = (await choices.allTextContents()).map(label => label.trim().toLowerCase());
  const wrongIndex = choiceLabels.findIndex(label => label !== shownLetter);
  expect(wrongIndex).toBeGreaterThanOrEqual(0);

  await choices.nth(wrongIndex).click();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator('[data-quest-view="cycle"]')).toBeVisible();
  await page.waitForTimeout(850);

  expect(await playedAudio(page)).not.toContain(targetPath);
});

test("directions stay stopped after leaving or completing a station", async ({ page }) => {
  await installAudioRecorder(page);

  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters");
  const letterReplay = page.getByRole("button", { name: "Hear instructions again" });
  await expect(letterReplay).toBeVisible();
  const letterInstruction = await letterReplay.getAttribute("data-instruction-audio");
  await page.waitForTimeout(450);
  await clearPlayedAudio(page);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator('[data-quest-view="cycle"]')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await playedAudio(page)).not.toContain(letterInstruction);

  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=story");
  const storyReplay = page.getByRole("button", { name: "Hear instructions again" });
  await expect(storyReplay).toBeVisible();
  const storyInstruction = await storyReplay.getAttribute("data-instruction-audio");
  const answerByTitle = new Map(
    Object.values(QUEST_STORY_QUESTIONS).flatMap(bank => (
      bank.questions.map(question => [question.title, question.answer])
    ))
  );
  for (let round = 1; round <= 4; round += 1) {
    await expect(page.getByRole("heading", { name: `${round} of 4` })).toBeVisible();
    const title = await page.locator(".sbq-story-cover figcaption").textContent();
    const answer = answerByTitle.get(title?.trim());
    expect(answer, `story title ${title} needs a known answer`).toBeTruthy();
    await page.locator(".sbq-answer-grid").getByRole("button", { name: answer, exact: true }).click();
  }
  await expect(page.locator('[data-quest-view="celebration"]')).toBeVisible();
  await clearPlayedAudio(page);
  await page.waitForTimeout(300);
  expect(await playedAudio(page)).not.toContain(storyInstruction);
});
