import { expect, test } from "@playwright/test";

const INITIAL_SEED = {
  phraseFlow: "adventure:cycle-25:speed:initial-v3",
  heartWord: "adventure:cycle-25:spell:initial-v3",
  letterPress: "adventure:cycle-1:letters:initial-v3",
  wordWindow: "adventure:cycle-1:quick:initial-v3"
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

  const correction = frame.locator('[data-correction-model="true"]');
  await expect(correction).toBeVisible();
  await expect(correction.locator("[data-correction-unit]")).toHaveText(["A", "→", "a"]);

  await correctChoice.click();
  await expect(frame).toHaveAttribute("data-feedback-tone", "correct");
  await expect(round.getByRole("heading", { name: "2 of 4" })).toBeVisible();
});

test("a tall phone mechanic brings its shared third-miss correction model fully into view", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This gate covers the phone stage scroller.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const round = await openMechanic(page, {
    cycle: "cycle-1",
    station: "quick",
    mechanic: "wordWindow",
    stage: "word-window",
    seed: INITIAL_SEED.wordWindow
  });
  const mechanic = round.locator('[data-mechanic-stage="word-window"]');
  const studyWord = String(await mechanic.locator(".adventure-word-window__study-word").textContent()).trim();

  await mechanic.getByRole("button", { name: "Close study window" }).click();
  const choices = mechanic.locator("[data-word-choice]");
  const wrongIndex = await choices.evaluateAll((buttons, target) => (
    buttons.findIndex(button => button.getAttribute("data-word-choice") !== target)
  ), studyWord);
  expect(wrongIndex, "Word Window needs a visible non-target choice").toBeGreaterThanOrEqual(0);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await choices.nth(wrongIndex).click();
    await mechanic.getByRole("button", { name: "Reveal and compare" }).click();
    await expect(mechanic).toHaveAttribute("data-window-phase", "revealed");
    if (attempt < 3) {
      await mechanic.getByRole("button", { name: "Try the word again" }).click();
      await expect(mechanic).toHaveAttribute("data-window-phase", "choose");
    }
  }

  const model = round.locator('.adventure-round-frame__correction-model[data-correction-model="true"]');
  await expect(model).toHaveAttribute("data-correction-model-key", "0:3");
  await expect(model).toBeFocused();
  const geometry = await model.evaluate(element => {
    const stage = element.closest(".adventure-round-frame__stage");
    const modelRect = element.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    if (!stageRect) return null;
    const intersectionWidth = Math.max(
      0,
      Math.min(modelRect.right, stageRect.right) - Math.max(modelRect.left, stageRect.left)
    );
    const intersectionHeight = Math.max(
      0,
      Math.min(modelRect.bottom, stageRect.bottom) - Math.max(modelRect.top, stageRect.top)
    );
    return {
      intersectionWidth,
      intersectionHeight,
      modelWidth: modelRect.width,
      modelHeight: modelRect.height
    };
  });
  expect(geometry).toBeTruthy();
  expect(geometry.intersectionWidth).toBeGreaterThanOrEqual(geometry.modelWidth - 1);
  expect(geometry.intersectionHeight).toBeGreaterThanOrEqual(geometry.modelHeight - 1);
});

test("corrupt local Adventure progress offers an explicit Adventure-only fresh start", async ({ page }) => {
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&corruptAdventure=1",
    { waitUntil: "domcontentloaded" }
  );

  const recovery = page.locator('[data-child-surface="adventure-map"][data-quest-view="progress-recovery"]');
  await expect(recovery).toBeVisible();
  await expect(recovery.getByRole("heading", { name: "Adventure Map needs a fresh start" })).toBeVisible();
  await expect(recovery.getByText("Your other learning stays safe.", { exact: false })).toBeVisible();
  await expect(page.locator("[data-child-progress], [data-node-state]")).toHaveCount(0);
  await expect(page.locator('[data-quest-view="round"]')).toHaveCount(0);

  await recovery.getByRole("button", { name: "Clear map copy and try again" }).click();
  await expect(page.locator('[data-child-surface="adventure-map"][data-read-state="ready"]')).toBeVisible();
  await expect(page.locator("[data-child-progress]")).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    adventure: window.localStorage.getItem("lp-el-quest:child-surface-preview"),
    phonicsQuest: window.localStorage.getItem("lp-quest:child-surface-preview")
  }))).toEqual({
    adventure: JSON.stringify({ schemaVersion: 2, progressEpoch: 2, cycles: {} }),
    phonicsQuest: JSON.stringify({ untouched: true })
  });
});

test("an existing empty Adventure record opens the same explicit recovery front door", async ({ page }) => {
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map",
    { waitUntil: "domcontentloaded" }
  );
  await page.evaluate(() => {
    window.localStorage.setItem("lp-el-quest:child-surface-preview", "");
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "child-surface-preview" }
    }));
  });

  const recovery = page.locator('[data-child-surface="adventure-map"][data-quest-view="progress-recovery"]');
  await expect(recovery).toBeVisible();
  await recovery.getByRole("button", { name: "Clear map copy and try again" }).click();
  await expect(page.locator('[data-child-surface="adventure-map"][data-read-state="ready"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem("lp-el-quest:child-surface-preview")
  ))).toBe(JSON.stringify({ schemaVersion: 2, progressEpoch: 2, cycles: {} }));
});

test("future Adventure progress blocks old gameplay without rewriting its payload", async ({ page }) => {
  const futurePayload = JSON.stringify({
    schemaVersion: 3,
    progressEpoch: 2,
    cycles: { "cycle-1": { stars: 3 } },
    futureOnly: { checkpoint: "keep-exactly" }
  });
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&futureAdventure=1",
    { waitUntil: "domcontentloaded" }
  );

  const update = page.locator('[data-child-surface="adventure-map"][data-quest-view="progress-update-required"]');
  await expect(update).toBeVisible();
  await expect(update.getByRole("heading", { name: "Adventure Map needs an update" })).toBeVisible();
  await expect(page.locator("[data-child-progress], [data-node-state]")).toHaveCount(0);
  await expect(page.locator('[data-quest-view="round"]')).toHaveCount(0);
  await expect(update.getByRole("button", { name: "Check for the update" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem("lp-el-quest:child-surface-preview")
  ))).toBe(futurePayload);

  await update.getByRole("button", { name: "Check for the update" }).click();
  await expect(page.locator('[data-quest-view="progress-update-required"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window.localStorage.getItem("lp-el-quest:child-surface-preview")
  ))).toBe(futurePayload);
});

test("future hydration cancels a pending final-round save before it can overwrite the payload", async ({ page }) => {
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters",
    { waitUntil: "domcontentloaded" }
  );
  const round = page.locator('[data-quest-view="round"][data-round-type="letterPair"]');
  const stage = round.locator('[data-mechanic-stage="letter-press"]');

  async function chooseCurrentPartner() {
    const model = String(await stage.locator(".am-code-sign-slot").first().locator("strong").textContent());
    const partner = model === model.toUpperCase() ? model.toLowerCase() : model.toUpperCase();
    await stage.getByRole("button", { name: partner, exact: true }).click();
  }

  for (let completed = 1; completed < 4; completed += 1) {
    await chooseCurrentPartner();
    await expect(round.getByRole("heading", { name: `${completed + 1} of 4` })).toBeVisible();
  }

  const futurePayload = JSON.stringify({
    schemaVersion: 3,
    progressEpoch: 2,
    cycles: { "cycle-1": { stars: 3 } },
    futureOnly: { checkpoint: "keep-exactly" }
  });
  await chooseCurrentPartner();
  await page.evaluate(raw => {
    window.localStorage.setItem("lp-el-quest:child-surface-preview", raw);
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "child-surface-preview" }
    }));
  }, futurePayload);

  await expect(page.locator('[data-quest-view="progress-update-required"]')).toBeVisible();
  await page.waitForTimeout(900);
  const storage = await page.evaluate(() => ({
    adventure: window.localStorage.getItem("lp-el-quest:child-surface-preview"),
    queuedAdventureWrites: Array.from({ length: window.localStorage.length }, (_, index) => (
      window.localStorage.key(index)
    )).filter(key => key?.startsWith("lp-progress-sync-entry-v2:")).length
  }));
  expect(storage).toEqual({ adventure: futurePayload, queuedAdventureWrites: 0 });
});

test("current hydration during a final answer merges with the station completion", async ({ page }) => {
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters",
    { waitUntil: "domcontentloaded" }
  );
  const round = page.locator('[data-quest-view="round"][data-round-type="letterPair"]');
  const stage = round.locator('[data-mechanic-stage="letter-press"]');

  async function chooseCurrentPartner() {
    const model = String(await stage.locator(".am-code-sign-slot").first().locator("strong").textContent());
    const partner = model === model.toUpperCase() ? model.toLowerCase() : model.toUpperCase();
    await stage.getByRole("button", { name: partner, exact: true }).click();
  }

  for (let completed = 1; completed < 4; completed += 1) {
    await chooseCurrentPartner();
    await expect(round.getByRole("heading", { name: `${completed + 1} of 4` })).toBeVisible();
  }

  await chooseCurrentPartner();
  await page.evaluate(() => {
    window.localStorage.setItem("lp-el-quest:child-surface-preview", JSON.stringify({
      schemaVersion: 2,
      progressEpoch: 2,
      cycles: {
        "cycle-9": {
          stars: 3,
          bestScore: 100,
          stations: { letters: true }
        }
      }
    }));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "child-surface-preview" }
    }));
  });

  await expect(page.locator('[data-quest-view="celebration"]')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(
    window.localStorage.getItem("lp-el-quest:child-surface-preview") || "null"
  ));
  expect(saved.cycles["cycle-9"]).toEqual({
    stars: 3,
    bestScore: 100,
    stations: { letters: true }
  });
  expect(saved.cycles["cycle-1"].stations.letters).toBe(true);
});
