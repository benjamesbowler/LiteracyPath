import { expect, test } from "@playwright/test";

const INITIAL_SEED = {
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

async function openMechanic(page, { cycle, station, mechanic, stage, seed, preserve = false }) {
  await page.goto(
    `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}${preserve ? "&preserveAdventure=1" : ""}`,
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

const ADVENTURE_STORAGE_KEY = "lp-el-quest:child-surface-preview";

async function readLearningCheckpoint(page) {
  return page.evaluate(key => JSON.parse(window.localStorage.getItem(key)).learningCheckpoint, ADVENTURE_STORAGE_KEY);
}

test("a first letter miss keeps its exact evidence through teaching reload and a fresh transfer", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-1", station: "letters", mechanic: "letterPair",
    stage: "letter-press", seed: INITIAL_SEED.letterPress, preserve: true
  });
  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  const frame = round.locator(".adventure-round-frame");
  const progress = round.getByRole("progressbar", { name: "Station progress" });
  const wrong = stage.getByRole("button", { name: "m", exact: true });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await wrong.click();
  await expect(frame).toHaveAttribute("data-feedback-tone", "retry");
  await expect(wrong).toBeDisabled();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(frame.locator(".adventure-round-frame__feedback")).toContainText("Find");

  // The deliberate answer is durable before its receipt ends, including the exact board.
  const receipt = await readLearningCheckpoint(page);
  expect(receipt.episode.phase).toBe("receipt");
  expect(receipt.episode.firstResponse).toMatchObject({
    selected: "m", expected: "a", isCorrect: false, observedCorrect: false,
    presentationRole: "first_probe", evidenceUse: "independent_practice_response"
  });
  expect(receipt.episode.firstResponse.question).toEqual(receipt.rounds[0]);
  expect(receipt.runState.firstAttempts[0]).toBe(false);
  expect(receipt.episode.responses).toHaveLength(1);

  const teaching = round.locator('[data-learning-phase="teaching"]');
  await expect(teaching).toBeVisible();
  await expect(stage).toHaveCount(0);
  await expect(teaching.locator(".learning-teaching-model > span")).toHaveText(["A", "→", "a"]);
  await expect(teaching.getByRole("heading", { name: "Look, listen, then match" })).toBeFocused();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await page.screenshot({ path: testInfo.outputPath("first-miss-teaching.png") });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(teaching).toBeVisible();
  const restored = await readLearningCheckpoint(page);
  expect(restored.episode.firstResponse).toEqual(receipt.episode.firstResponse);
  expect(restored.episode.firstQuestion).toEqual(receipt.episode.firstQuestion);
  expect(restored.rounds).toEqual(receipt.rounds);
  expect(restored.episode.responses).toHaveLength(1);
  await expect(teaching.getByRole("heading", { name: "Look, listen, then match" })).toBeFocused();

  // The modeled match is a supported action. Enter moves to a different task.
  const guided = teaching.getByRole("button", { name: "Match a", exact: true });
  await teaching.getByRole("button", { name: "Hear it again", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(guided).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(stage).toBeVisible();
  const transfer = await readLearningCheckpoint(page);
  expect(transfer.roundIndex).toBe(0);
  expect(transfer.episode.role).toBe("transfer");
  expect(transfer.episode.phase).toBe("answer");
  expect(transfer.episode.firstResponse).toEqual(receipt.episode.firstResponse);
  expect(transfer.episode.question.modelForm).not.toBe(receipt.episode.firstQuestion.modelForm);
  expect(transfer.episode.question.choices).not.toEqual(receipt.episode.firstQuestion.choices);
  expect(transfer.episode.responses).toHaveLength(1);
  expect(transfer.episode.guidedActions).toHaveLength(1);
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(stage.locator(".am-code-sign-slot strong").first()).toHaveText(transfer.episode.question.modelForm);
  await page.screenshot({ path: testInfo.outputPath("fresh-transfer.png") });

  await stage.getByRole("button", { name: String(transfer.episode.expected), exact: true }).click();
  await expect(frame).toHaveAttribute("data-feedback-tone", "correct");
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  const completed = await page.evaluate(({ key, id }) => JSON.parse(window.localStorage.getItem(key))
    .learningResponses.map(event => event.learningEpisode).findLast(episode => episode.id === id && episode.phase === "complete"),
  { key: ADVENTURE_STORAGE_KEY, id: receipt.episode.id });
  expect(completed.firstResponse).toEqual(receipt.episode.firstResponse);
  expect(completed.responses).toHaveLength(2);
  expect(completed.responses[1]).toMatchObject({
    presentationRole: "transfer", observedCorrect: true, isCorrect: null,
    evidenceUse: "formative_transfer_after_teaching"
  });
  expect(completed.completion).toMatchObject({ completed: true, supported: true });
  expect((await readLearningCheckpoint(page)).runState.firstAttempts[0]).toBe(false);
});

test("a phone reveals and focuses the first-miss teaching model before a fresh touch transfer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This check covers the phone stage scroller.");
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-1", station: "letters", mechanic: "letterPair",
    stage: "letter-press", seed: INITIAL_SEED.letterPress, preserve: true
  });
  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  await stage.getByRole("button", { name: "m", exact: true }).tap();
  const teaching = round.locator('[data-learning-phase="teaching"]');
  await expect(teaching).toBeVisible();
  await expect(stage).toHaveCount(0);
  const before = await readLearningCheckpoint(page);
  expect(before.episode.firstResponse.selected).toBe("m");
  expect(before.episode.firstResponse.isCorrect).toBe(false);
  expect(before.episode.responses).toHaveLength(1);
  await page.screenshot({ path: testInfo.outputPath("phone-first-miss-teaching.png") });

  const heading = teaching.getByRole("heading", { name: "Look, listen, then match" });
  const guided = teaching.getByRole("button", { name: "Match a", exact: true });
  await expect(teaching.locator(".learning-teaching-model > span")).toHaveText([before.episode.firstQuestion.modelForm, "→", "a"]);
  await expect(heading).toBeFocused();
  expect(await teaching.evaluate(element => {
    const stage = element.closest(".adventure-round-frame__stage")?.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return Boolean(stage && rect.left >= stage.left - 1 && rect.right <= stage.right + 1
      && rect.top >= stage.top - 1 && rect.bottom <= stage.bottom + 1);
  })).toBe(true);
  const bounds = await guided.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(56);
  expect(bounds.height).toBeGreaterThanOrEqual(56);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  expect(await guided.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(teaching).toBeVisible();
  await expect(heading).toBeFocused();
  expect((await readLearningCheckpoint(page)).episode.firstResponse).toEqual(before.episode.firstResponse);
  await guided.tap();
  await expect(stage).toBeVisible();
  const transfer = await readLearningCheckpoint(page);
  expect(transfer.episode.role).toBe("transfer");
  expect(transfer.episode.firstResponse).toEqual(before.episode.firstResponse);
  expect(transfer.episode.question.modelForm).not.toBe(before.episode.firstQuestion.modelForm);
  await page.screenshot({ path: testInfo.outputPath("phone-fresh-transfer.png") });
  await stage.getByRole("button", { name: String(transfer.episode.expected), exact: true }).tap();
  await expect(round.getByRole("progressbar", { name: "Station progress" })).toHaveAttribute("aria-valuenow", "1");
  expect((await readLearningCheckpoint(page)).runState.firstAttempts[0]).toBe(false);
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
    await expect(round.getByRole("progressbar", { name: "Station progress" })).toHaveAttribute("aria-valuenow", String(completed));
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
    await expect(round.getByRole("progressbar", { name: "Station progress" })).toHaveAttribute("aria-valuenow", String(completed));
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
