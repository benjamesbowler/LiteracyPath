import { expect, test } from "@playwright/test";

const INITIAL_SEED = {
  phraseFlow: "adventure:cycle-25:speed:initial-v3",
  heartWord: "adventure:cycle-25:spell:initial-v3",
  letterPress: "adventure:cycle-1:letters:initial-v3"
};

async function installAudioRecorder(page) {
  await page.addInitScript(() => {
    window.__adventurePlayedAudio = [];
    window.__adventurePausedAudio = [];
    window.__adventureAudioEndMs = 5;
    window.Audio = class TestAudio extends EventTarget {
      constructor(src = "") {
        super();
        this.src = String(src || "");
        this.currentTime = 0;
        this.volume = 1;
        this.preload = "";
        this.playing = false;
        this.endTimer = null;
      }

      load() {}

      play() {
        const path = new URL(this.src, window.location.href).pathname;
        window.__adventurePlayedAudio.push(path);
        this.playing = true;
        if (this.endTimer !== null) window.clearTimeout(this.endTimer);
        this.endTimer = window.setTimeout(() => {
          this.endTimer = null;
          this.playing = false;
          this.dispatchEvent(new Event("ended"));
        }, window.__adventureAudioEndMs);
        return Promise.resolve();
      }

      pause() {
        if (this.endTimer !== null) window.clearTimeout(this.endTimer);
        this.endTimer = null;
        if (this.playing && this.src) {
          window.__adventurePausedAudio.push(new URL(this.src, window.location.href).pathname);
        }
        this.playing = false;
      }
    };
  });
}

async function openMechanic(page, { cycle, station, mechanic, stage, seed }) {
  await page.goto(
    `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
    { waitUntil: "domcontentloaded" }
  );
  const round = page.locator(
    `[data-quest-view="round"][data-station-id="${station}"][data-round-type="${mechanic}"]`
  );
  await expect(round).toBeVisible();
  await expect(round).toHaveAttribute("data-run-seed", seed);
  await expect(round.locator(`[data-mechanic-stage="${stage}"]`)).toBeVisible();
  return round;
}

async function playedAudio(page) {
  return page.evaluate(() => window.__adventurePlayedAudio || []);
}

async function pausedAudio(page) {
  return page.evaluate(() => window.__adventurePausedAudio || []);
}

async function prepareLongAudio(page) {
  await page.evaluate(() => {
    window.__adventurePlayedAudio = [];
    window.__adventurePausedAudio = [];
    window.__adventureAudioEndMs = 5_000;
  });
}

test("Phrase Flow recovers through its visible model when instruction replay interrupts model audio", async ({ page }) => {
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-25",
    station: "speed",
    mechanic: "phraseFlow",
    stage: "phrase-flow",
    seed: INITIAL_SEED.phraseFlow
  });
  const stage = round.locator('[data-mechanic-stage="phrase-flow"]');

  await expect(round.getByRole("heading", { name: "1 of 2" })).toBeVisible();
  await stage.getByRole("button", { name: "After “say”", exact: true }).click();
  const model = stage.locator(".sbq-phrase-model");
  await expect(model).toBeVisible();
  await expect(model).toHaveAttribute("data-model-playback", "idle");

  // Let the short mocked entry instruction finish before isolating the model.
  await page.waitForTimeout(450);
  await prepareLongAudio(page);
  await model.getByRole("button", { name: "Play and follow the phrase model" }).click();
  await expect(model).toHaveAttribute("data-model-playback", "playing");
  await expect.poll(() => playedAudio(page)).not.toEqual([]);
  const [modelPath] = await playedAudio(page);

  await round.getByRole("button", { name: "Hear instructions again" }).click();
  await expect.poll(() => pausedAudio(page)).toContain(modelPath);
  await expect(model).toHaveAttribute("data-model-playback", "unavailable");

  const visibleFallback = model.getByRole("button", { name: "I followed the visible model" });
  await expect(visibleFallback).toBeVisible();
  await expect(visibleFallback).toBeEnabled();
  await visibleFallback.click();

  const echo = stage.getByRole("button", { name: "I echo-read the phrase" });
  await expect(echo).toBeVisible();
  await echo.click();
  await expect(round.getByRole("heading", { name: "2 of 2" })).toBeVisible();
});

test("Heart Word keeps the correct prefix, reveals the first difference, and can be repaired with returned tiles", async ({ page }) => {
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-25",
    station: "spell",
    mechanic: "heartWord",
    stage: "heart-word-studio",
    seed: INITIAL_SEED.heartWord
  });
  const stage = round.locator('[data-mechanic-stage="heart-word-studio"]');
  const modelUnits = stage.locator('.sbq-heart-model > span');

  await expect(round.getByRole("heading", { name: "1 of 3" })).toBeVisible();
  await expect(modelUnits).toHaveText(["a", "g", "a", "i", "n"]);
  await stage.getByRole("button", { name: "Hide the word and spell it" }).click();

  // Use every tile exactly once, but make only the first grapheme correct:
  // a-a-g-n-i rather than a-g-a-i-n.
  for (const tileId of [0, 2, 1, 4, 3]) {
    await stage.locator(`[data-heart-tile-id="${tileId}"]`).click();
  }
  const slots = stage.locator('.sbq-heart-slots > span');
  await expect(slots.locator('span[aria-hidden="true"]')).toHaveText(["a", "a", "g", "n", "i"]);
  await stage.getByRole("button", { name: "Reveal and check" }).click();

  await expect(stage).toHaveAttribute("data-phase", "repair");
  await expect(stage.getByText("You chose a. Repair this spot with g.", { exact: true })).toBeVisible();
  await expect(slots.nth(0).locator('span[aria-hidden="true"]')).toHaveText("a");
  await expect(slots.nth(1)).toHaveClass(/is-first-difference/);
  await expect(slots.nth(1).locator('span[aria-hidden="true"]')).toHaveText("g");

  const retainedPrefixTile = stage.locator('[data-heart-tile-id="0"]');
  const revealedRepairTile = stage.locator('[data-heart-tile-id="1"]');
  await expect(retainedPrefixTile).toBeDisabled();
  await expect(revealedRepairTile).toBeEnabled();
  await expect(stage.locator('[data-heart-tile-id="2"]')).toBeEnabled();

  await revealedRepairTile.click();
  await expect(stage).toHaveAttribute("data-phase", "spell");
  for (const tileId of [2, 3, 4]) {
    await stage.locator(`[data-heart-tile-id="${tileId}"]`).click();
  }
  await stage.getByRole("button", { name: "Reveal and check" }).click();

  await expect(round.getByRole("heading", { name: "2 of 3" })).toBeVisible();
  await expect(stage.locator('.sbq-heart-model > span')).toHaveText(["d", "a", "y"]);
});

test("three wrong Letter Press commits show escalating feedback before a correct retry advances", async ({ page }) => {
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-1",
    station: "letters",
    mechanic: "letterPair",
    stage: "letter-press",
    seed: INITIAL_SEED.letterPress
  });
  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  const frame = round.locator(".adventure-round-frame");
  const feedback = frame.locator(".adventure-round-frame__feedback");
  const wrongChoice = stage.getByRole("button", { name: "m", exact: true });
  const correctChoice = stage.getByRole("button", { name: "a", exact: true });
  const messages = [];

  await expect(round.getByRole("heading", { name: "1 of 4" })).toBeVisible();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const previousMessage = messages.at(-1) || "Your turn.";
    await wrongChoice.click();
    await expect(frame).toHaveAttribute("data-feedback-tone", "retry");
    await expect(round.getByRole("heading", { name: "1 of 4" })).toBeVisible();
    await expect.poll(async () => (await feedback.textContent())?.trim()).not.toBe(previousMessage);

    const message = (await feedback.textContent())?.trim();
    expect(message, `wrong attempt ${attempt} needs visible controller feedback`).toBeTruthy();
    messages.push(message);
    expect(new Set(messages).size, `wrong attempt ${attempt} needs new feedback`).toBe(messages.length);

    // The controller owns a short retry lock while feedback and coaching play.
    await expect(wrongChoice).toBeEnabled();
  }

  await correctChoice.click();
  await expect(frame).toHaveAttribute("data-feedback-tone", "correct");
  await expect(round.getByRole("heading", { name: "2 of 4" })).toBeVisible();
});
