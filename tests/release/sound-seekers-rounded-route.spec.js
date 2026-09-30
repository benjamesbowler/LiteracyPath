import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { CAMPAIGN_MISSIONS } from "../../src/features/soundSeekers/v3/content/campaign.js";

test.use({ screenshot: "only-on-failure" });

const remoteMutations = new WeakMap();
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const blocked = [];
  remoteMutations.set(page, blocked);
  await page.route("**/*", async route => {
    const request = route.request();
    const destination = new URL(request.url());
    if (destination.origin !== origin && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
      blocked.push({ method: request.method(), origin: destination.origin });
      await route.abort("blockedbyclient");
      return;
    }
    await route.fallback();
  });
});
test.afterEach(async ({ page }) => {
  expect(remoteMutations.get(page), "isolated preview must never attempt a hosted write").toEqual([]);
});

const GAME = '[data-sound-seekers-game="rounded-campaign"]';
const FIRST_STAGE_MAIN = CAMPAIGN_MISSIONS.filter(mission => mission.stageId === "meadow-01" && mission.kind === "main");
const fullScope = scope => `sound-seekers-preview:rounded:${scope}`;
const storageKey = scope => `lp-quest:${fullScope(scope)}:v3:campaign-v1`;
const previewUrl = (scope, resume = false) => `/preview/rounded-campaign.html?stage=meadow-01&scope=${scope}&sound=1${resume ? "&resume=1" : ""}`;

// This models Web Audio ownership and elapsed completion, not human hearing or
// recording quality. The application still fetches its real authored clips.
async function controlledAudio(page) {
  await page.addInitScript(() => {
    const active = new Set();
    const responsePaths = new WeakMap();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const bytes = await arrayBuffer.call(this);
      responsePaths.set(bytes, new URL(this.url, location.href).pathname);
      return bytes;
    };
    window.__roundedAudio = { hold: false, started: 0, ended: 0, stopped: 0, decoded: 0, active: 0, pathsStarted: [], pathsEnded: [] };
    class ControlledAudioContext {
      constructor() { this.state = "suspended"; this.sampleRate = 44100; this.destination = {}; }
      get currentTime() { return performance.now() / 1000; }
      resume() { this.state = "running"; return Promise.resolve(); }
      close() {
        this.state = "closed";
        for (const source of [...active]) source.stop();
        return Promise.resolve();
      }
      createGain() {
        return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      }
      createBuffer(channels, length, sampleRate) { return { duration: length / sampleRate, length, sampleRate }; }
      decodeAudioData(bytes) {
        if (!bytes.byteLength) return Promise.reject(new Error("Missing authored audio bytes"));
        window.__roundedAudio.decoded += 1;
        return Promise.resolve({ duration: 0.055, length: 2425, sampleRate: 44100, testSourcePath: responsePaths.get(bytes) });
      }
      createBufferSource() {
        let timer;
        let live = false;
        const source = {
          buffer: null, onended: null, connect() {}, disconnect() {},
          start() {
            const voice = source.buffer.length > 1;
            live = true;
            if (voice) {
              active.add(source);
              window.__roundedAudio.started += 1;
              window.__roundedAudio.pathsStarted.push(source.buffer.testSourcePath);
              window.__roundedAudio.active = active.size;
            }
            if (!voice || !window.__roundedAudio.hold) timer = setTimeout(() => {
              if (!live) return;
              live = false;
              if (voice) {
                active.delete(source);
                window.__roundedAudio.ended += 1;
                window.__roundedAudio.pathsEnded.push(source.buffer.testSourcePath);
                window.__roundedAudio.active = active.size;
              }
              source.onended?.();
            }, Math.max(1, source.buffer.duration * 1000));
          },
          stop() {
            clearTimeout(timer);
            if (!live) return;
            live = false;
            if (active.delete(source)) window.__roundedAudio.stopped += 1;
            window.__roundedAudio.active = active.size;
          }
        };
        return source;
      }
      createOscillator() {
        const context = this;
        let timer;
        const source = {
          frequency: { value: 0 }, type: "sine", onended: null, connect() {}, disconnect() {}, start() {},
          stop(at) {
            clearTimeout(timer);
            if (at !== undefined) timer = setTimeout(() => source.onended?.(), Math.max(0, (at - context.currentTime) * 1000));
          }
        };
        return source;
      }
    }
    window.AudioContext = ControlledAudioContext;
    window.webkitAudioContext = ControlledAudioContext;
  });
}

// Private checkpoint access belongs only to this isolated synthetic learner.
// Correct answers are delivered through native rendered controls. No test hook,
// answer key or fabricated judgement is added to the production renderer.
async function savedProgress(page, scope) {
  return page.evaluate(async identity => {
    const { createCampaignStorage } = await import("/src/features/soundSeekers/v3/campaignStorage.js");
    return createCampaignStorage({ storage: localStorage, localOnly: true }).loadCampaignProgress(identity).progress;
  }, fullScope(scope));
}

async function snapshot(page, scope) {
  const progress = await savedProgress(page, scope);
  const checkpoint = progress?.campaign?.checkpoints?.[progress.campaign.activeMissionId];
  return { progress, checkpoint, beat: checkpoint && !checkpoint.completed ? checkpoint.challenges[checkpoint.beatIndex] : null };
}

async function scopeBytes(page, scope) {
  return page.evaluate(prefix => Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith(prefix)).sort().map(key => [key, localStorage.getItem(key)])), storageKey(scope));
}

async function openGame(page, scope) {
  await controlledAudio(page);
  await page.goto(previewUrl(scope));
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "title");
  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
}

async function placesMission(page, mission) {
  await page.getByRole("button", { name: "Places", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Places", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.locator(".rc-mission-list button").filter({ hasText: mission.title }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "activity");
}

function correctChoice(beat, state) {
  if (["word_forge", "sentence_build"].includes(beat.mechanic)) {
    return beat.key.sequence[state.placed?.length || 0];
  }
  if (beat.mechanic === "sound_sort") return beat.key.bins[beat.view.items[state.itemIndex || 0].id];
  return beat.key.optionId || beat.key.choiceId || beat.key.keyId;
}

async function choose(page, id) {
  const control = page.locator(`[data-choice-id=${JSON.stringify(id)}]`);
  await expect(control).toBeEnabled();
  await control.click();
}

async function waitForJudgedBeat(page, scope) {
  await expect.poll(async () => {
    const current = await snapshot(page, scope);
    return Boolean(current.beat && current.beat.mechanic !== "sound_signpost" && !current.checkpoint.beatState.done);
  }, { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await snapshot(page, scope)).checkpoint.beatState.heard).toBe(true);
  return snapshot(page, scope);
}

async function completeMissionThroughControls(page, scope, mission, onBeat) {
  let actions = 0;
  while (!(await savedProgress(page, scope)).campaign.completedMissions[mission.id]) {
    expect(actions++, `${mission.id}: bounded native play loop`).toBeLessThan(180);
    const current = await snapshot(page, scope);
    expect(current.checkpoint?.missionId).toBe(mission.id);
    const { beat, checkpoint } = current;
    if (beat.mechanic === "sound_signpost" || checkpoint.beatState.done) {
      await expect.poll(async () => {
        const next = await snapshot(page, scope);
        return !next.checkpoint || next.checkpoint.beatIndex !== checkpoint.beatIndex;
      }, { timeout: 30_000 }).toBe(true);
      continue;
    }
    await expect.poll(async () => {
      const state = (await snapshot(page, scope)).checkpoint?.beatState;
      return state?.heard || !beat.prompt.cues.length;
    }).toBe(true);
    if (onBeat) await onBeat(await snapshot(page, scope));
    const fresh = await snapshot(page, scope);
    const beforeState = fresh.checkpoint.beatState;
    await choose(page, correctChoice(fresh.beat, beforeState));
    await expect.poll(async () => {
      const next = await snapshot(page, scope);
      return !next.checkpoint || next.checkpoint.beatIndex !== fresh.checkpoint.beatIndex || JSON.stringify(next.checkpoint.beatState) !== JSON.stringify(beforeState);
    }).toBe(true);
  }
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
  const complete = await savedProgress(page, scope);
  expect(complete.campaign.activeMissionId).toBeNull();
  expect(complete.campaign.checkpoints[mission.id].completed).toBe(true);
  expect(complete.campaign.completedMissions[mission.id].previewFixture).toBeUndefined();
  expect(complete.campaign.completedMissions[mission.id].at).toBeGreaterThan(0);
  // A real elapsed beat-advance window confirms that the next Pal needs a new
  // child choice rather than starting automatically after this mission.
  await page.waitForTimeout(450);
  expect((await savedProgress(page, scope)).campaign.activeMissionId).toBeNull();
}

test("first stage earns five main missions, preserves supported partial word on reload and returns to exploration", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const scope = `route-earned-${testInfo.project.name}`;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await openGame(page, scope);
  expect(Object.keys((await savedProgress(page, scope)).campaign.completedMissions)).toEqual([]);
  await page.getByRole("button", { name: "Places", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Places" }).getByRole("button", { name: "Fern Steps", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Close Places", exact: true }).click();

  await placesMission(page, FIRST_STAGE_MAIN[0]);
  await completeMissionThroughControls(page, scope, FIRST_STAGE_MAIN[0]);
  await placesMission(page, FIRST_STAGE_MAIN[1]);
  await completeMissionThroughControls(page, scope, FIRST_STAGE_MAIN[1]);

  await placesMission(page, FIRST_STAGE_MAIN[2]);
  let partialBeatId;
  let partialAttemptId;
  let endedBeforeReload = 0;
  await completeMissionThroughControls(page, scope, FIRST_STAGE_MAIN[2], async current => {
    if (partialBeatId || current.beat.mechanic !== "word_forge" || current.checkpoint.beatState.placed.length) return;
    partialBeatId = current.beat.id;
    partialAttemptId = current.checkpoint.attemptId;
    await choose(page, current.beat.key.sequence[0]);
    const wrong = current.beat.view.tiles.find(tile => ![current.beat.key.sequence[0], current.beat.key.sequence[1]].includes(tile.id));
    expect(wrong, "authored unused wrong tile exists").toBeTruthy();
    await choose(page, wrong.id);
    await expect(page.locator(".rounded-activity-feedback")).toHaveAttribute("data-result", "incorrect");
    await page.getByRole("button", { name: "Read the clue", exact: true }).click();
    const clue = await page.locator(".rounded-activity [data-child-instruction]").innerText();
    const before = (await snapshot(page, scope)).checkpoint;
    expect(before.beatState.placed).toEqual([current.beat.key.sequence[0]]);
    expect(before.beatState.errors).toBeGreaterThanOrEqual(1);
    expect(before.beatState.supportUsed).toContain("text-support");
    endedBeforeReload = await page.evaluate(() => window.__roundedAudio.ended);
    await page.screenshot({ path: testInfo.outputPath("partial-supported-word.png") });
    await page.goto(previewUrl(scope, true));
    await page.getByRole("button", { name: "Carry on", exact: true }).click();
    const after = (await snapshot(page, scope)).checkpoint;
    expect(after.attemptId).toBe(before.attemptId);
    expect(after.challenges).toEqual(before.challenges);
    expect(after.beatIndex).toBe(before.beatIndex);
    expect(after.beatState.placed).toEqual(before.beatState.placed);
    expect(after.beatState.errors).toBe(before.beatState.errors);
    expect(after.beatState.supportUsed).toEqual(before.beatState.supportUsed);
    await expect(page.locator(".rounded-activity [data-child-instruction]")).toHaveText(clue);
    await expect(page.locator('[data-slot-index="0"]')).toHaveAttribute("data-placed-tile", current.beat.key.sequence[0]);
  });
  expect(partialBeatId).toBeTruthy();
  for (const mission of FIRST_STAGE_MAIN.slice(3)) {
    await placesMission(page, mission);
    await completeMissionThroughControls(page, scope, mission);
  }
  const finished = await savedProgress(page, scope);
  expect(Object.keys(finished.campaign.completedMissions).sort()).toEqual(FIRST_STAGE_MAIN.map(mission => mission.id).sort());
  expect(Object.keys(finished.campaign.checkpoints).sort()).toEqual(FIRST_STAGE_MAIN.map(mission => mission.id).sort());
  const supportedEvent = finished.evidence.find(event => event.attemptId === partialAttemptId && event.id === `${partialBeatId}:response`);
  expect(supportedEvent).toMatchObject({ independent: false, kind: "practice", evidenceType: "formative" });
  expect(supportedEvent.errors).toBeGreaterThanOrEqual(1);
  expect(supportedEvent.supportUsed).toContain("text-support");
  expect(finished.evidence.length).toBeGreaterThan(20);
  expect(finished.evidence.every(event => event.kind === "practice" && event.evidenceType === "formative")).toBe(true);
  const elapsedVoiceCompletions = endedBeforeReload + await page.evaluate(() => window.__roundedAudio.ended);
  expect(elapsedVoiceCompletions).toBeGreaterThan(20);
  const summaryPath = testInfo.outputPath("earned-first-stage-summary.json");
  await writeFile(summaryPath, JSON.stringify({
    syntheticLearner: true,
    completedMainMissionIds: Object.keys(finished.campaign.completedMissions),
    formativeAnswers: finished.evidence.length,
    supportedPartialWord: { resumedSameAttempt: true, errors: supportedEvent.errors, supportUsed: supportedEvent.supportUsed, independent: supportedEvent.independent },
    elapsedSimulatedVoiceCompletions: elapsedVoiceCompletions,
    humanListening: false,
    hostedLearnerWrites: false
  }, null, 2));
  await testInfo.attach("earned-first-stage-summary", { contentType: "application/json", path: summaryPath });
  await expect(page.locator(".rc-objective")).toContainText("Try an extra adventure");
  await expect(page.locator(".rc-objective img")).toHaveAttribute("alt", "Tiny");
  const goalEndedBefore = await page.evaluate(() => window.__roundedAudio.ended);
  const optionalGoal = page.waitForRequest(request => request.url().includes("mission-meadow-01-side-1-goal.mp3"));
  await page.getByRole("button", { name: "Hear the current Pal's problem", exact: true }).click();
  await optionalGoal;
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.ended)).toBeGreaterThan(goalEndedBefore);
  expect((await savedProgress(page, scope)).evidence).toEqual(finished.evidence);
  await expect(page.getByRole("button", { name: "Explore Fern Steps", exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("first-stage-earned.png") });
  await page.getByRole("button", { name: "Places", exact: true }).click();
  await page.getByRole("dialog", { name: "Places" }).getByRole("button", { name: "Fern Steps", exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute("data-stage-id", "meadow-02");
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
  expect((await savedProgress(page, scope)).campaign.activeMissionId).toBeNull();
  expect(errors).toEqual([]);
});

test("Find walks through the rendered first landscape and waits for native Help here before starting", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const scope = `route-walk-${testInfo.project.name}`;
  await openGame(page, scope);
  const canvas = page.locator(".rc-landscape canvas");
  await expect(canvas).toHaveAttribute("data-rendered-frames", /[1-9]/);
  await expect(page.locator(".rc-explore-footer")).not.toContainText("Opening the landscape");
  const before = await canvas.evaluate(element => ({ x: Number(element.dataset.playerX), z: Number(element.dataset.playerZ) }));
  await page.getByRole("button", { name: "Find Muddy", exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
  await expect.poll(async () => canvas.evaluate(element => ({ x: Number(element.dataset.playerX), z: Number(element.dataset.playerZ) }))).not.toEqual(before);
  await expect(page.getByRole("button", { name: "Help here", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath("find-arrives-at-pal.png") });
  expect((await savedProgress(page, scope)).campaign.activeMissionId).toBeNull();
  await page.getByRole("button", { name: "Help here", exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute("data-mode", "activity");
  expect((await snapshot(page, scope)).checkpoint.missionId).toBe(FIRST_STAGE_MAIN[0].id);
});

test("Start before approved GLBs finish loading applies exploration state before Find becomes ready", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const scope = `route-delayed-model-${testInfo.project.name}`;
  let releaseAssets;
  const release = new Promise(resolve => { releaseAssets = resolve; });
  const heldUrls = [];
  await page.route(/\.glb(?:\?.*)?$/, async route => {
    // Vite's ?url module imports are JavaScript. Hold only the actual model
    // response used by GLTFLoader; all approved bytes still come from the app.
    if (route.request().resourceType() !== "fetch") return route.continue();
    const response = await route.fetch();
    heldUrls.push(route.request().url());
    await release;
    await route.fulfill({ response });
  });
  try {
    await controlledAudio(page);
    await page.goto(previewUrl(scope), { waitUntil: "domcontentloaded" });
    await expect.poll(() => heldUrls.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Start exploring", exact: true }).click();
    await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
    await expect(page.locator(".rc-explore-footer")).toContainText("Opening the landscape");
    expect((await savedProgress(page, scope)).campaign.activeMissionId).toBeNull();
    // Explicit release after the native Start action reproduces the lifecycle
    // race without relying on an arbitrary network delay or forced reload.
    releaseAssets();
    await expect(page.getByRole("button", { name: "Find Muddy", exact: true })).toBeVisible();
    await expect(page.locator(".rc-explore-footer")).not.toContainText("Opening the landscape");
    const canvas = page.locator(".rc-landscape canvas");
    await expect(canvas).toHaveAttribute("data-rendered-frames", /[1-9]/);
    const before = await canvas.evaluate(element => ({ x: Number(element.dataset.playerX), z: Number(element.dataset.playerZ) }));
    await page.getByRole("button", { name: "Find Muddy", exact: true }).click();
    await expect.poll(async () => canvas.evaluate(element => ({ x: Number(element.dataset.playerX), z: Number(element.dataset.playerZ) }))).not.toEqual(before);
    await expect(page.getByRole("button", { name: "Help here", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(GAME)).toHaveAttribute("data-mode", "explore");
    await page.screenshot({ path: testInfo.outputPath("delayed-glbs-find-arrival.png") });
    await page.getByRole("button", { name: "Help here", exact: true }).click();
    await expect(page.locator(GAME)).toHaveAttribute("data-mode", "activity");
    expect((await snapshot(page, scope)).checkpoint.missionId).toBe(FIRST_STAGE_MAIN[0].id);
    await testInfo.attach("held-approved-model-requests", { contentType: "application/json", body: JSON.stringify({
      scope: "isolated preview only", models: heldUrls.map(url => new URL(url).pathname), releaseAfterNativeStart: true
    }, null, 2) });
  } finally {
    releaseAssets();
  }
});

test("wrong G2P choice completes recorded correction without revealing answer and Show me records model support", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const scope = `route-spoken-feedback-${testInfo.project.name}`;
  await openGame(page, scope);
  await placesMission(page, FIRST_STAGE_MAIN[0]);
  let current = await waitForJudgedBeat(page, scope);
  let preparatoryAnswers = 0;
  while (current.beat.view.direction !== "letter-to-sound") {
    expect(preparatoryAnswers++).toBeLessThan(6);
    await choose(page, correctChoice(current.beat, current.checkpoint.beatState));
    await expect.poll(async () => (await snapshot(page, scope)).checkpoint.beatIndex).toBeGreaterThan(current.checkpoint.beatIndex);
    current = await waitForJudgedBeat(page, scope);
  }
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.active)).toBe(0);
  const before = current;
  const right = before.beat.view.options.find(option => option.id === before.beat.key.optionId);
  const wrong = before.beat.view.options.find(option => option.id !== before.beat.key.optionId);
  const retryPath = await page.evaluate(async () => {
    const { woodlandAssetUrl } = await import("/demos/sound-seekers/src/assetUrls.js");
    const { AUDIO } = await import("/demos/sound-seekers/src/audio.js");
    return new URL(woodlandAssetUrl(AUDIO.wrong), location.href).pathname;
  });
  const instruction = before.beat.prompt.cues.map(cue => cue.src);
  const wrongExpected = [wrong.audio, retryPath, ...instruction];
  const wrongStart = await page.evaluate(() => window.__roundedAudio.pathsEnded.length);
  await choose(page, wrong.id);
  await expect(page.locator(".rounded-activity-feedback")).toHaveAttribute("data-result", "incorrect");
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.pathsEnded.length)).toBe(wrongStart + wrongExpected.length);
  const wrongPlayed = await page.evaluate(start => window.__roundedAudio.pathsEnded.slice(start), wrongStart);
  expect(wrongPlayed).toEqual(wrongExpected);
  expect(wrongPlayed).not.toContain(right.audio);
  const wrongSaved = await snapshot(page, scope);
  expect(wrongSaved.checkpoint.beatState).toMatchObject({ errors: 1, modelShown: false, done: false });
  expect(wrongSaved.progress.evidence).toEqual(before.progress.evidence);

  const modelStart = await page.evaluate(() => window.__roundedAudio.pathsEnded.length);
  await page.getByRole("button", { name: "Show me", exact: true }).click();
  await expect(page.locator(".rounded-activity-feedback")).toHaveAttribute("data-result", "model");
  const modelExpected = [...instruction, right.audio];
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.pathsEnded.length)).toBe(modelStart + modelExpected.length);
  expect(await page.evaluate(start => window.__roundedAudio.pathsEnded.slice(start), modelStart)).toEqual(modelExpected);
  const modelSaved = await snapshot(page, scope);
  expect(modelSaved.checkpoint.beatState.modelShown).toBe(true);
  expect(modelSaved.checkpoint.beatState.supportUsed).toContain("model");
  expect(modelSaved.progress.evidence).toEqual(before.progress.evidence);
  await page.screenshot({ path: testInfo.outputPath("recorded-model-supported.png") });
  await choose(page, right.id);
  await expect.poll(async () => (await savedProgress(page, scope)).evidence.length).toBe(before.progress.evidence.length + 1);
  const event = (await savedProgress(page, scope)).evidence.find(item => item.id === `${before.beat.id}:response`);
  expect(event).toMatchObject({ independent: false, errors: 1, kind: "practice", evidenceType: "formative" });
  expect(event.supportUsed).toContain("model");
  const recordingPath = testInfo.outputPath("recorded-feedback-lifecycle.json");
  await writeFile(recordingPath, JSON.stringify({ syntheticLearner: true, wrongPlayed, modelPlayed: modelExpected,
    answerSpokenOnFirstWrong: false, supportRecordedBeforeModel: true, humanListening: false }, null, 2));
  await testInfo.attach("recorded-feedback-lifecycle", { contentType: "application/json", path: recordingPath });
});

test("pause owns native modal focus and cancels in-flight teaching without hearing credit", async ({ page }, testInfo) => {
  const scope = `route-pause-${testInfo.project.name}`;
  await openGame(page, scope);
  await page.evaluate(() => { window.__roundedAudio.hold = true; });
  await placesMission(page, FIRST_STAGE_MAIN[0]);
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.active)).toBe(1);
  const before = await snapshot(page, scope);
  expect(before.beat.mechanic).toBe("sound_signpost");
  expect(before.checkpoint.beatState.cardsHeard).toEqual([]);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Paused", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Resume", exact: true })).toBeFocused();
  expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.active)).toBe(0);
  expect(await page.evaluate(() => window.__roundedAudio.stopped)).toBeGreaterThan(0);
  await page.waitForTimeout(450);
  const paused = await snapshot(page, scope);
  expect(paused.checkpoint.beatIndex).toBe(before.checkpoint.beatIndex);
  expect(paused.checkpoint.beatState.cardsHeard).toEqual([]);
  expect(paused.progress.evidence).toEqual(before.progress.evidence);
  const controls = dialog.getByRole("button");
  await controls.last().focus();
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await controls.first().focus();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("pause-native-dialog.png") });
  await page.evaluate(() => { window.__roundedAudio.hold = false; });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await waitForJudgedBeat(page, scope);
  expect((await snapshot(page, scope)).checkpoint.attemptId).toBe(before.checkpoint.attemptId);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Leave for Home", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sound Seekers is safely closed" })).toBeVisible();
  await expect(page.locator("[data-sound-seekers-route-portal]")).toHaveCount(0);
  expect(await page.evaluate(() => ({ active: window.__roundedAudio.active, overflow: document.body.style.overflow }))).toEqual({ active: 0, overflow: "" });
  await page.getByRole("button", { name: "Return to your saved place", exact: true }).click();
  await page.getByRole("button", { name: "Carry on", exact: true }).click();
  expect((await snapshot(page, scope)).checkpoint.attemptId).toBe(before.checkpoint.attemptId);
});

for (const damaged of [
  { name: "corrupt", bytes: '{"v":3,"campaign":broken', message: "Your saved adventure needs recovery. It has been kept safe." },
  { name: "future", bytes: '{"v":3,"campaign":{"v":99,"privateFutureData":"preserve-exactly"}}', message: "This saved adventure needs a newer version of the game." }
]) {
  test(`${damaged.name} save is preserved byte for byte and cannot start a replacement adventure`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const scope = `route-${damaged.name}-${testInfo.project.name}`;
    await page.addInitScript(({ key, bytes }) => { localStorage.setItem(key, bytes); }, { key: storageKey(scope), bytes: damaged.bytes });
    await page.goto(previewUrl(scope, true));
    await expect(page.locator(".rc-save")).toHaveText(damaged.message);
    await expect(page.getByRole("button", { name: "Start exploring", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Places", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Places" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Places" }).locator(".rc-mission-list button")).toHaveCount(7);
    for (const control of await page.getByRole("dialog", { name: "Places" }).locator(".rc-mission-list button").all()) await expect(control).toBeDisabled();
    await page.getByRole("button", { name: "Close Places", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`${damaged.name}-preserved.png`) });
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sound Seekers is safely closed" })).toBeVisible();
    expect(await scopeBytes(page, scope)).toEqual({ [storageKey(scope)]: damaged.bytes });
    expect(errors).toEqual([]);
  });
}

test("quota failure preserves durable bytes and exact supported in-memory answer until retry saves", async ({ page }, testInfo) => {
  const scope = `route-quota-${testInfo.project.name}`;
  await openGame(page, scope);
  await placesMission(page, FIRST_STAGE_MAIN[0]);
  const before = await waitForJudgedBeat(page, scope);
  await expect.poll(() => page.evaluate(() => window.__roundedAudio.active)).toBe(0);
  const durable = await scopeBytes(page, scope);
  const choices = before.beat.view.options;
  const wrong = choices.find(option => option.id !== before.beat.key.optionId);
  await page.evaluate(prefix => {
    const original = Storage.prototype.setItem;
    window.__roundedQuota = true;
    Storage.prototype.setItem = function (key, value) {
      if (window.__roundedQuota && key.startsWith(prefix)) throw new DOMException("Controlled isolated quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  }, storageKey(scope));
  await choose(page, wrong.id);
  await expect(page.getByRole("alert")).toContainText("This device could not save your adventure. Keep this page open and try again.");
  await page.getByRole("button", { name: "Read the clue", exact: true }).click();
  await choose(page, before.beat.key.optionId);
  await page.waitForTimeout(450);
  expect(await scopeBytes(page, scope)).toEqual(durable);
  await expect(page.locator(".rc-header")).toContainText(`${before.checkpoint.beatIndex + 1}/${before.checkpoint.challenges.length}`);
  await expect(page.locator(".rounded-activity-feedback")).toHaveAttribute("data-result", "correct");
  await page.screenshot({ path: testInfo.outputPath("quota-keeps-answer.png") });
  await page.evaluate(() => { window.__roundedQuota = false; });
  await page.getByRole("button", { name: "Try saving again", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect.poll(async () => (await snapshot(page, scope)).checkpoint.beatIndex).toBeGreaterThan(before.checkpoint.beatIndex);
  const recovered = await savedProgress(page, scope);
  expect(recovered.campaign.checkpoints[FIRST_STAGE_MAIN[0].id].attemptId).toBe(before.checkpoint.attemptId);
  expect(recovered.campaign.checkpoints[FIRST_STAGE_MAIN[0].id].challenges).toEqual(before.checkpoint.challenges);
  const event = recovered.evidence.find(item => item.id === `${before.beat.id}:response`);
  expect(event).toMatchObject({ independent: false, errors: 1, kind: "practice", evidenceType: "formative" });
  expect(event.supportUsed).toContain("text-support");
  expect(await page.locator(GAME).innerText()).not.toContain("sync-failed");
});
