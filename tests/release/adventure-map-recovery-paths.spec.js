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

test("wrong letter answers keep the goal visible before a third-miss model and correct retry", async ({ page }) => {
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

  await expect(round.getByRole("heading", { name: "1 of 4" })).toBeVisible();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await wrongChoice.click();
    await expect(frame).toHaveAttribute("data-feedback-tone", "retry");
    await expect(round.getByRole("heading", { name: "1 of 4" })).toBeVisible();
    await expect(feedback).toContainText("Find");
    if (attempt < 3) await expect(frame.locator('[data-correction-model="true"]')).toHaveCount(0);

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

test("a phone brings the third-miss letter model fully into view and supports another answer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This check covers the phone stage scroller.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installAudioRecorder(page);
  const round = await openMechanic(page, {
    cycle: "cycle-1", station: "letters", mechanic: "letterPair",
    stage: "letter-press", seed: INITIAL_SEED.letterPress
  });
  const stage = round.locator('[data-mechanic-stage="letter-press"]');
  const wrong = stage.getByRole("button", { name: "m", exact: true });
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await wrong.click();
    await expect(round.locator(".adventure-round-frame")).toHaveAttribute("data-feedback-tone", "retry");
    await expect(wrong).toBeEnabled();
  }
  const model = round.locator('.adventure-round-frame__correction-model[data-correction-model="true"]');
  await expect(model).toHaveAttribute("data-correction-model-key", "0:3");
  await expect(model).toBeFocused();
  expect(await model.evaluate(element => {
    const stage = element.closest(".adventure-round-frame__stage")?.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return Boolean(stage && rect.left >= stage.left - 1 && rect.right <= stage.right + 1
      && rect.top >= stage.top - 1 && rect.bottom <= stage.bottom + 1);
  })).toBe(true);
  await stage.getByRole("button", { name: "a", exact: true }).click();
  await expect(round.getByRole("heading", { name: "2 of 4" })).toBeVisible();
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
