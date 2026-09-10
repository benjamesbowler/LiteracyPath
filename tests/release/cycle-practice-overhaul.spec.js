import { mkdir, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { buildCyclePlan, cycleStorageKey } from "../../src/components/cycle-practice/cyclePracticeState.js";
import { resolveCyclePracticeAudio } from "../../src/components/cycle-practice/cyclePracticeAudio.js";
import { cyclePracticeReadiness } from "../../src/components/cycle-practice/cyclePracticeContent.js";
import { CYCLE_ACTIVITY_REVISION, CYCLE_PRACTICE_VERSION, cycleQuestionRecord } from "../../src/policy/cyclePracticePolicy.js";

const scope = "child-surface-preview";
const cycle = elSkillsBlockCycles.find(row => row.id === "cycle-1");
const seed = `${scope}:preview`;
const key = cycleStorageKey(scope, "preview", cycle.id);
const plan = buildCyclePlan(cycle, seed).rounds;
const check = buildCyclePlan(cycle, `${seed}:assessment`, 0, true).rounds;
const fixtures = new Set();
const completedCoverage = [];
for (const round of plan) {
  completedCoverage.push(cycleQuestionRecord(round, { correct: true, selected: round.answer, evidence: { activityRevision: CYCLE_ACTIVITY_REVISION } }, { mode: "practice", audioDelivery: "delivered" }));
  if (cyclePracticeReadiness(cycle, completedCoverage, 1800).ready) break;
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => { throw error; });
  await page.setViewportSize({ width: 1024, height: 768 });
});
test.afterEach(async () => {
  for (const file of fixtures) await rm(file, { force: true });
  fixtures.clear();
});

async function audioDouble(page, unavailable = false) {
  await page.addInitScript(fail => {
    window.__cycleAudio = { unavailable: fail, played: [] };
    window.Audio = class CycleRecordedAudioDouble extends EventTarget {
      constructor() { super(); this.src = ""; this.currentTime = 0; this.readyState = 4; this.volume = 1; this.preload = ""; this.timer = null; this.paused = true; }
      load() { this.dispatchEvent(new Event("canplay")); }
      play() {
        if (window.__cycleAudio.unavailable) return Promise.reject(new DOMException("Audio unavailable in this test", "NotAllowedError"));
        this.paused = false;
        window.__cycleAudio.played.push({ src: this.src, mechanic: document.querySelector(".cycle-playground")?.dataset.mechanicStage });
        this.dispatchEvent(new Event("play"));
        this.timer = setTimeout(() => { this.timer = null; this.paused = true; this.dispatchEvent(new Event("ended")); }, window.__cycleAudio.duration || 8);
        return Promise.resolve();
      }
      pause() { if (this.timer !== null) clearTimeout(this.timer); this.timer = null; this.paused = true; }
    };
  }, unavailable);
}

function initialState(patch = {}) {
  return { version: CYCLE_PRACTICE_VERSION, activityRevision: CYCLE_ACTIVITY_REVISION, mode: "practice", practiceIndex: 0, pass: 0, assessmentIndex: 0,
    assessmentRecords: [], practiceRecords: [], attempts: 0, pendingAttempt: null, result: null,
    paused: false, earnedCount: 0, attemptId: "overhaul-browser-attempt", startedAt: "2026-09-09T01:00:00.000Z",
    clock: { activePracticeSeconds: 0, sessionElapsedSeconds: 0, checkSeconds: 0 }, ...patch };
}

async function startAt(page, patch = {}, options = {}) {
  await audioDouble(page, options.unavailable);
  await page.addInitScript(({ storageKey, state }) => { if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(state)); }, { storageKey: key, state: initialState(patch) });
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  if (!options.unavailable && options.waitReady !== false) await ready(page);
}

const saved = page => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);

async function ready(page) {
  await expect(page.locator(".cycle-listen-button")).toHaveAttribute("data-audio-state", "ready");
  await expect(page.locator(".cycle-activity-space")).not.toHaveAttribute("inert");
}

async function largeLearningType(page) {
  for (const label of await page.locator(".cycle-answer--word, .cycle-letter-block, .cycle-change-letter").all()) {
    expect(await label.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), await label.getAttribute("aria-label")).toBeGreaterThanOrEqual(30);
  }
  for (const label of await page.locator(".cycle-answer--letter").all()) {
    expect(await label.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), await label.getAttribute("aria-label")).toBeGreaterThanOrEqual(40);
  }
}

async function choose(page, round, correct = true) {
  if (round.mechanicId === "letterTrace") {
    if (!correct) { await page.locator(".cycle-trace__pad").click({ position: { x: 30, y: 30 } }); return; }
    for (let remaining = 16; remaining > 0; remaining -= 1) {
      const help = page.getByRole("button", { name: "Help me trace one part" });
      if (await help.isDisabled() || !(await help.count())) break;
      await help.click();
    }
    return;
  }
  if (round.mechanicId === "soundSort" && round.objects?.length) {
    const objects = correct ? round.objects : round.objects.slice(0, 1);
    for (const [index, object] of objects.entries()) {
      if (index > 0) await ready(page);
      const choice = round.choices.find(item => (String(item.value) === String(object.answer)) === correct);
      await page.locator(`[data-cycle-bin="${choice.value}"]`).click();
    }
    return;
  }
  if (round.mechanicId === "wordBuild" && round.variant !== "wordParts") {
    const answer = Array.isArray(round.answer) ? round.answer : round.letters || round.graphemes || [...round.answer];
    if (round.variant === "wordChange") {
      await page.getByRole("button", { name: `Change letter ${round.changeIndex + 1}: ${round.beforeLetters[round.changeIndex]}`, exact: true }).click();
      const choice = round.choices.find(item => (String(item.value) === String(answer[round.changeIndex])) === correct);
      await page.getByRole("button", { name: `Add ${choice.label || choice.value}`, exact: true }).click();
      return;
    }
    if (!correct) {
      const wrong = round.choices.find(choice => String(choice.value) !== String(answer[0]));
      await page.getByRole("button", { name: `Add ${wrong.label || wrong.value}`, exact: true }).click();
    } else for (const part of answer) await page.getByRole("button", { name: `Add ${part}`, exact: true }).click();
    return;
  }
  const choice = round.choices.find(item => (String(item.value) === String(round.answer)) === correct);
  if (round.mechanicId === "soundSort") await page.getByRole("button", { name: `Put ${round.targetWord} in ${choice.label || choice.value}`, exact: true }).click();
  else await page.getByRole("button", { name: choice.label || String(choice.value), exact: true }).click();
}

for (const mechanic of ["pictureSound", "letterMatch", "rhymeMatch", "wordBuild", "soundSort", "letterTrace"]) {
  test(`${mechanic} has images and automatic audio, retries locally, then advances once without a submit control`, async ({ page }) => {
    const index = plan.findIndex(round => round.mechanicId === mechanic);
    const round = plan[index];
    await startAt(page, { practiceIndex: index });
    await expect(page.locator(".cycle-playground")).toHaveAttribute("data-mechanic-stage", mechanic);
    await expect(page.getByRole("button", { name: /check (my|the)|check answer|submit|remember|sound gate|start cycle check/i })).toHaveCount(0);
    const images = page.locator(".cycle-activity-space img");
    expect(await images.count()).toBeGreaterThan(0);
    for (const img of await images.all()) await expect.poll(() => img.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const instruction = resolveCyclePracticeAudio(round).instructionAudio;
    expect(await page.evaluate(path => window.__cycleAudio.played.some(event => event.src === path), instruction)).toBe(true);
    await choose(page, round, false);
    if (mechanic !== "letterTrace") {
      await expect.poll(async () => (await saved(page)).attempts).toBe(1);
      await ready(page);
    } else await expect(page.locator(".cycle-trace__status")).toContainText("Follow");
    expect((await saved(page)).practiceIndex).toBe(index);
    await choose(page, round);
    await expect.poll(async () => (await saved(page)).practiceIndex).toBe(index + 1);
    await ready(page);
    const state = await saved(page);
    expect(state.earnedCount).toBe(1);
    const ownRecords = state.practiceRecords.filter(record => record.questionId === round.id || record.questionId.startsWith(`${round.id}:object:`));
    expect(ownRecords.length).toBe(mechanic === "letterTrace" ? 1 : 1 + (round.objects?.length || 1));
    if (mechanic !== "letterTrace") {
      const copying = round.variant === "highFrequency" || Boolean(round.modelWord);
      expect(state.practiceRecords[0].responseStatus).toBe(copying ? "supported" : "incorrect");
      expect(state.practiceRecords[0].selected).not.toEqual(round.answer);
    }
    expect(ownRecords.some(record => record.responseStatus === "supported")).toBe(true);
  });
}

test("unavailable instructions block answers and award no independent response until successful replay", async ({ page }) => {
  await startAt(page, {}, { unavailable: true });
  await expect(page.getByRole("button", { name: "Play instructions", exact: true })).toBeVisible();
  for (const button of await page.locator(".cycle-answer").all()) await expect(button).toBeDisabled();
  await page.keyboard.press("Enter");
  expect((await saved(page)).practiceRecords).toEqual([]);
  expect((await saved(page)).practiceIndex).toBe(0);
  await page.evaluate(() => { window.__cycleAudio.unavailable = false; });
  await page.getByRole("button", { name: "Play instructions", exact: true }).click();
  await ready(page);
  await choose(page, plan[0]);
  await expect.poll(async () => (await saved(page)).practiceIndex).toBe(1);
  expect((await saved(page)).practiceRecords[0].audioDelivery).toBe("delivered");
});

test("a missing tracing picture blocks practice and successfully reloads before the child can trace", async ({ page }) => {
  const practiceIndex = plan.findIndex(round => round.mechanicId === "letterTrace");
  const round = plan[practiceIndex];
  const imagePattern = `**${round.image}`;
  await page.route(imagePattern, route => route.abort());
  await startAt(page, { practiceIndex }, { waitReady: false });
  await expect(page.getByRole("button", { name: "Reload pictures", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help me trace one part" })).toBeDisabled();
  expect((await saved(page)).practiceRecords).toHaveLength(0);
  await page.unroute(imagePattern);
  await page.getByRole("button", { name: "Reload pictures", exact: true }).click();
  await ready(page);
  await expect.poll(() => page.locator(".cycle-trace__picture-card img").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await choose(page, round);
  await expect.poll(async () => (await saved(page)).practiceIndex).toBe(practiceIndex + 1);
});

for (const fixture of [
  { name: "thirty minutes without coverage stays in practice", seconds: 1800, records: [], expectedMode: "practice" },
  { name: "completed coverage before thirty active minutes stays in practice", seconds: 1700, records: completedCoverage, expectedMode: "practice" },
  { name: "completed coverage and thirty active minutes move automatically into the check", seconds: 1800, records: completedCoverage, expectedMode: "assessment" },
]) {
  test(fixture.name, async ({ page }) => {
    expect(cyclePracticeReadiness(cycle, completedCoverage, 1800).ready).toBe(true);
    await startAt(page, { practiceRecords: fixture.records,
      clock: { activePracticeSeconds: fixture.seconds, sessionElapsedSeconds: fixture.seconds, checkSeconds: 0 } });
    await choose(page, plan[0]);
    await expect.poll(async () => (await saved(page)).earnedCount).toBe(1);
    await ready(page);
    await expect.poll(async () => (await saved(page)).mode).toBe(fixture.expectedMode);
    if (fixture.expectedMode === "assessment") expect((await saved(page)).frozenPracticeSeconds).toBeGreaterThanOrEqual(1800);
    else expect((await saved(page)).practiceIndex).toBe(1);
  });
}

test("the full check retains its first wrong answer and saves exactly one immutable preview result", async ({ page }) => {
  test.setTimeout(60000);
  await startAt(page, { mode: "assessment", practiceRecords: completedCoverage, frozenPracticeSeconds: 1800,
    clock: { activePracticeSeconds: 1800, sessionElapsedSeconds: 1800, checkSeconds: 0 } });
  for (const [index, round] of check.entries()) {
    await ready(page);
    await choose(page, round, index !== 0);
    if (index === 0 && round.objects?.length > 1) {
      await ready(page);
      await choose(page, { ...round, objects: round.objects.slice(1) });
    }
    if (index < check.length - 1) await expect.poll(async () => (await saved(page)).assessmentIndex).toBe(index + 1);
  }
  await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
  const completed = await saved(page);
  const responseCount = check.reduce((total, round) => total + (round.objects?.length || 1), 0);
  expect(completed.result.totalQuestions).toBe(responseCount);
  expect(completed.result.questionRecords[0].responseStatus).toBe("incorrect");
  expect(completed.result.correctCount).toBe(responseCount - 1);
  expect(completed.result.savedToTeacher).toBe(false);
  expect(completed.pendingAttempt).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
  expect((await saved(page)).result).toEqual(completed.result);
});

test("refreshing a partly sorted check resumes the next object without scoring the first picture twice", async ({ page }) => {
  const assessmentIndex = check.findIndex(round => round.objects?.length > 1);
  const round = check[assessmentIndex];
  await startAt(page, { mode: "assessment", assessmentIndex, practiceRecords: completedCoverage, frozenPracticeSeconds: 1800,
    clock: { activePracticeSeconds: 1800, sessionElapsedSeconds: 1800, checkSeconds: 0 } });
  const first = round.objects[0];
  const wrong = round.choices.find(choice => String(choice.value) !== String(first.answer));
  await page.locator(`[data-cycle-bin="${wrong.value}"]`).click();
  await expect.poll(async () => (await saved(page)).assessmentRecords.length).toBe(1);
  await ready(page);
  await expect(page.getByRole("button", { name: `Pick up ${round.objects[1].word}`, exact: true })).toBeVisible();
  const firstResponse = (await saved(page)).assessmentRecords[0];
  expect(firstResponse.responseStatus).toBe("incorrect");
  await page.reload();
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await ready(page);
  await expect(page.getByRole("button", { name: `Pick up ${round.objects[1].word}`, exact: true })).toBeVisible();
  for (const object of round.objects.slice(1)) {
    await ready(page);
    await page.locator(`[data-cycle-bin="${object.answer}"]`).click();
  }
  await expect.poll(async () => (await saved(page)).assessmentIndex).toBe(assessmentIndex + 1);
  const responses = (await saved(page)).assessmentRecords;
  expect(responses).toHaveLength(round.objects.length);
  expect(new Set(responses.map(record => record.questionId)).size).toBe(round.objects.length);
  expect(responses[0]).toEqual(firstResponse);
});

for (const interruption of ["pause", "hide"]) {
  test(`${interruption} during the final check feedback resumes into one automatic saved result`, async ({ page }) => {
    const records = check.slice(0, -1).flatMap(round => (round.objects || [null]).map(object => cycleQuestionRecord(
      object ? { ...round, id: `${round.id}:object:${object.word}`, targetWord: object.word, itemKey: object.word } : round,
      { correct: true, selected: object?.answer || round.answer, evidence: { activityRevision: CYCLE_ACTIVITY_REVISION } }, { mode: "assessment", audioDelivery: "delivered" }
    )));
    await startAt(page, { mode: "assessment", assessmentIndex: check.length - 1, assessmentRecords: records,
      practiceRecords: completedCoverage, frozenPracticeSeconds: 1800,
      clock: { activePracticeSeconds: 1800, sessionElapsedSeconds: 1800, checkSeconds: 0 } });
    await page.evaluate(() => { window.__cycleAudio.duration = 500; });
    await choose(page, check.at(-1));
    await expect.poll(async () => Boolean((await saved(page)).pendingAttempt)).toBe(true);
    if (interruption === "pause") await page.getByRole("button", { name: "Pause practice", exact: true }).click();
    else await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(async () => (await saved(page)).paused).toBe(true);
    const pending = (await saved(page)).pendingAttempt;
    expect((await saved(page)).result).toBeNull();
    if (interruption === "hide") await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.locator(".cycle-play-overlay").getByRole("button", { name: "Resume practice", exact: true }).click();
    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
    const result = (await saved(page)).result;
    expect(result.attemptId).toBe(pending.attemptId);
    expect(result.questionRecords).toEqual(pending.questionRecords);
    expect((await saved(page)).pendingAttempt).toBeNull();
    await page.reload();
    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
    expect((await saved(page)).result).toEqual(result);
  });
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test(`all six activities fit ${viewport.width} by ${viewport.height} with 56px controls`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    await audioDouble(page);
    await page.addInitScript(storageKey => {
      const fixture = sessionStorage.getItem("cycle-overhaul-layout-fixture");
      if (fixture) localStorage.setItem(storageKey, fixture);
    }, key);
    await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced");
    for (const mechanic of ["pictureSound", "letterMatch", "rhymeMatch", "wordBuild", "soundSort", "letterTrace"]) {
      const practiceIndex = plan.findIndex(round => round.mechanicId === mechanic);
      await page.evaluate(state => sessionStorage.setItem("cycle-overhaul-layout-fixture", JSON.stringify(state)), initialState({ practiceIndex }));
      await page.reload();
      await page.getByRole("button", { name: "Start playing", exact: true }).click();
      await ready(page);
      await expect(page.locator(".cycle-playground")).toHaveAttribute("data-mechanic-stage", mechanic);
      await largeLearningType(page);
      if (viewport.width === 1024) await page.screenshot({ path: `.artifacts/cycle-overhaul-${mechanic}-tablet.png` });
      const layout = await page.locator(".cycle-practice-page").evaluate(element => ({
        pageFits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
        controls: [...element.querySelectorAll("button")].filter(button => button.getClientRects().length).map(button => {
          const r = button.getBoundingClientRect();
          const clip = button.closest(".cycle-playground")?.getBoundingClientRect();
          const transforms = [];
          for (let parent = button; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            if (style.transform !== "none" || style.scale !== "none") transforms.push({ tag: parent.tagName, className: parent.className, transform: style.transform, scale: style.scale });
          }
          return { label: button.getAttribute("aria-label") || button.textContent, width: r.width, height: r.height,
            transforms,
            fits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight
              && (!clip || r.top >= clip.top && r.left >= clip.left && r.right <= clip.right && r.bottom <= clip.bottom) };
        })
      }));
      expect(layout.pageFits, mechanic).toBe(true);
      for (const control of layout.controls) {
        expect(control.width, `${mechanic}: ${JSON.stringify(control)}`).toBeGreaterThanOrEqual(56);
        expect(control.height, `${mechanic}: ${JSON.stringify(control)}`).toBeGreaterThanOrEqual(56);
        expect(control.fits, `${mechanic}: ${control.label}`).toBe(true);
      }
    }
  });
}

for (const [cycleId, variant] of [["cycle-2", "highFrequency"], ["cycle-3", undefined]]) {
  test(`word train ${variant || "spelling"} commits on the final letter and exposes every model as support`, async ({ page }) => {
    const chosenCycle = elSkillsBlockCycles.find(row => row.id === cycleId);
    const chosenPlan = buildCyclePlan(chosenCycle, seed).rounds;
    const practiceIndex = chosenPlan.findIndex(round => round.mechanicId === "wordBuild" && round.variant === variant);
    const round = chosenPlan[practiceIndex];
    const storageKey = cycleStorageKey(scope, "preview", cycleId);
    await audioDouble(page);
    await page.addInitScript(({ storageKey, state }) => localStorage.setItem(storageKey, JSON.stringify(state)), { storageKey, state: initialState({ practiceIndex }) });
    await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${cycleId}&motion=reduced`);
    await page.getByRole("button", { name: "Start playing", exact: true }).click();
    await ready(page);
    await largeLearningType(page);
    await page.screenshot({ path: `.artifacts/cycle-overhaul-word-train-${variant || "spelling"}.png` });
    const records = () => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).practiceRecords, storageKey);
    for (const [index, letter] of round.answer.entries()) {
      await page.getByRole("button", { name: `Add ${letter}`, exact: true }).click();
      if (index < round.answer.length - 1) expect(await records()).toHaveLength(0);
    }
    await expect.poll(async () => (await records()).length).toBe(1);
    const record = (await records())[0];
    expect(record.selected).toEqual(round.answer);
    expect(record.responseStatus).toBe(variant === "highFrequency" ? "supported" : "correct");
    if (variant === "highFrequency") expect(record.evidence.supportUsed).toContain("visible_word_model");
  });
}

test("changing a word requires finding the changed sound before adding its replacement", async ({ page }) => {
  const chosenCycle = elSkillsBlockCycles.find(row => row.cycleNumber >= 15 && buildCyclePlan(row, seed).rounds.some(round => round.variant === "wordChange"));
  const chosenPlan = buildCyclePlan(chosenCycle, seed).rounds;
  const practiceIndex = chosenPlan.findIndex(round => round.variant === "wordChange");
  const round = chosenPlan[practiceIndex];
  const storageKey = cycleStorageKey(scope, "preview", chosenCycle.id);
  await audioDouble(page);
  await page.addInitScript(({ storageKey, state }) => localStorage.setItem(storageKey, JSON.stringify(state)), { storageKey, state: initialState({ practiceIndex }) });
  await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${chosenCycle.id}&motion=reduced`);
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await ready(page);
  await largeLearningType(page);
  await page.screenshot({ path: ".artifacts/cycle-overhaul-word-change.png" });
  const records = () => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).practiceRecords, storageKey);
  for (const [index, letter] of round.beforeLetters.entries()) {
    await expect(page.getByRole("button", { name: `Change letter ${index + 1}: ${letter}`, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
  for (const button of await page.getByRole("button", { name: /^Add / }).all()) await expect(button).toBeDisabled();
  const wrongIndex = (round.changeIndex + 1) % round.beforeLetters.length;
  await page.getByRole("button", { name: `Change letter ${wrongIndex + 1}: ${round.beforeLetters[wrongIndex]}`, exact: true }).click();
  expect(await records()).toHaveLength(0);
  await page.getByRole("button", { name: `Add ${round.answer[round.changeIndex]}`, exact: true }).click();
  await expect.poll(async () => (await records()).length).toBe(1);
  expect((await records())[0].responseStatus).toBe("incorrect");
  await ready(page);
  await choose(page, round);
  await expect.poll(async () => (await records()).length).toBe(2);
  const final = (await records())[1];
  expect(final.selected).toEqual(round.answer);
  expect(final.construct).toMatch(/phoneme_substitution$/);
  expect(final.responseStatus).toBe("supported");
});

test("high frequency word listening keeps picture context and scores the heard word without answer-preview audio", async ({ page }) => {
  const chosenCycle = elSkillsBlockCycles.find(row => buildCyclePlan(row, seed).rounds.some(round => round.variant === "wordListen"));
  const chosenPlan = buildCyclePlan(chosenCycle, seed).rounds;
  const practiceIndex = chosenPlan.findIndex(round => round.variant === "wordListen");
  const round = chosenPlan[practiceIndex];
  const storageKey = cycleStorageKey(scope, "preview", chosenCycle.id);
  await audioDouble(page);
  await page.addInitScript(({ storageKey, state }) => localStorage.setItem(storageKey, JSON.stringify(state)), { storageKey, state: initialState({ practiceIndex }) });
  await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${chosenCycle.id}&motion=reduced`);
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await ready(page);
  await largeLearningType(page);
  await expect(page.locator(".cycle-answer--word")).toHaveCount(round.choices.length);
  await page.screenshot({ path: ".artifacts/cycle-overhaul-word-listen.png" });
  await expect(page.locator(".cycle-play-choices").getByRole("button", { name: /^Hear / })).toHaveCount(0);
  await expect.poll(() => page.locator(".cycle-activity-space img").first().evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await choose(page, round);
  await expect.poll(async () => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).practiceRecords.length, storageKey)).toBe(1);
  const record = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).practiceRecords[0], storageKey);
  expect(record.construct).toBe("auditory_word_recognition");
  expect(record.responseStatus).toBe("correct");
});

test("case matching, spoken beats, and word parts retain distinct picture-led actions", async ({ page }) => {
  await audioDouble(page);
  await page.addInitScript(storageKey => {
    const fixture = sessionStorage.getItem("cycle-overhaul-variant-fixture");
    if (fixture) localStorage.setItem(storageKey, fixture);
  }, key);
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced");
  for (const variant of ["letterCase", "syllableSort", "wordParts"]) {
    const practiceIndex = plan.findIndex(round => round.variant === variant);
    const round = plan[practiceIndex];
    expect(round).toBeTruthy();
    await page.evaluate(state => sessionStorage.setItem("cycle-overhaul-variant-fixture", JSON.stringify(state)), initialState({ practiceIndex }));
    await page.reload();
    await page.getByRole("button", { name: "Start playing", exact: true }).click();
    await ready(page);
    await largeLearningType(page);
    await page.screenshot({ path: `.artifacts/cycle-overhaul-${variant}.png` });
    await expect.poll(() => page.locator(".cycle-activity-space img").first().evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    if (variant === "letterCase") await expect(page.locator(".cycle-model-letter")).toHaveText(round.model);
    if (variant === "wordParts") await expect(page.locator(".cycle-answer--picture")).toHaveCount(round.choices.length);
    if (variant === "syllableSort") await expect(page.locator("[data-cycle-bin]")).toHaveCount(round.choices.length);
    await choose(page, round);
    await expect.poll(async () => (await saved(page)).practiceIndex).toBe(practiceIndex + 1);
    expect((await saved(page)).practiceRecords[0].construct).toBe(round.construct);
  }
});

test("a failed teacher save retries the identical final payload and refresh preserves the recovery copy", async ({ page }) => {
  const sessionId = "cycle-overhaul-test-session";
  const storageKey = cycleStorageKey(scope, sessionId, cycle.id);
  const sessionPlan = buildCyclePlan(cycle, `${scope}:${sessionId}:assessment`, 0, true).rounds;
  const records = sessionPlan.slice(0, -1).flatMap(round => (round.objects || [null]).map(object => cycleQuestionRecord(
    object ? { ...round, id: `${round.id}:object:${object.word}`, targetWord: object.word, itemKey: object.word } : round,
    { correct: true, selected: object?.answer || round.answer, evidence: { activityRevision: CYCLE_ACTIVITY_REVISION } }, { mode: "assessment", audioDelivery: "delivered" }
  )));
  const state = initialState({ mode: "assessment", assessmentIndex: sessionPlan.length - 1, assessmentRecords: records, practiceRecords: completedCoverage, frozenPracticeSeconds: 1800,
    clock: { activePracticeSeconds: 1800, sessionElapsedSeconds: 1800, checkSeconds: 0 } });
  const file = `.artifacts/cycle-overhaul-session-${randomUUID()}.jsx`;
  await mkdir(".artifacts", { recursive: true });
  await writeFile(file, `
import React from 'react';
import { createRoot } from 'react-dom/client';
import '/src/index.css';
import { CyclePracticePage } from '/src/components/cycle-practice/CyclePracticePage.jsx';
document.body.style.cssText='margin:0;height:100vh';
document.getElementById('root').style.height='100vh';
window.__cycleSaveCalls=[];
const client={call:async(name,args)=>{window.__cycleSaveCalls.push(JSON.parse(JSON.stringify({name,args})));return window.__cycleSaveCalls.length===1?{data:null,error:new Error('offline')}:{data:{ok:true},error:null};}};
if(!localStorage.getItem(${JSON.stringify(storageKey)}))localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify(state))});
createRoot(document.getElementById('root')).render(React.createElement(CyclePracticePage,{progressScopeKey:${JSON.stringify(scope)},focusSession:{id:${JSON.stringify(sessionId)},resolved_config:{cycle_id:'cycle-1'}},focusToken:'synthetic-preview-token',client,reducedMotion:true}));`);
  fixtures.add(file);
  await page.route("**/cycle-overhaul-session-check", async route => {
    const response = await page.request.get("/preview/child-surfaces.html");
    await route.fulfill({ contentType: "text/html", body: (await response.text()).replace("/src/child-surfaces-preview.jsx", `/${file}`) });
  });
  await audioDouble(page);
  await page.goto("/cycle-overhaul-session-check");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await ready(page);
  await choose(page, sessionPlan.at(-1));
  await expect(page.getByRole("button", { name: "Retry save", exact: true })).toBeEnabled();
  const pending = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).pendingAttempt, storageKey);
  expect(pending.questionRecords).toHaveLength(sessionPlan.reduce((total, round) => total + (round.objects?.length || 1), 0));
const first = await page.evaluate(() => window.__cycleSaveCalls[0].args.p_attempt);
  expect(first).toEqual(pending);
  // Browser evidence must satisfy the new activity/audio boundary exercised
  // independently by tests/sql/cycle_practice_activity_audio.sql.
  const allowed = new Set(["pictureSound", "letterMatch", "rhymeMatch", "wordBuild", "soundSort", "letterTrace"]);
  expect(new Set(first.questionRecords.map(record => record.questionId)).size).toBe(first.questionRecords.length);
  for (const record of first.questionRecords) {
    expect(allowed.has(record.mechanicId)).toBe(true);
    expect(record.audioRequired).toBe(true);
    expect(record.audioDelivery).toBe("delivered");
    expect(record.evidence.activityRevision).toBe(CYCLE_ACTIVITY_REVISION);
  }
  await page.reload();
  await expect(page.getByRole("button", { name: "Retry save", exact: true })).toBeEnabled();
  expect(await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).pendingAttempt, storageKey)).toEqual(pending);
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry save", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
  const calls = await page.evaluate(() => window.__cycleSaveCalls);
  expect(calls).toHaveLength(2);
  expect(calls.every(call => call.name === "student_complete_focus_cycle_practice" && JSON.stringify(call.args.p_attempt) === JSON.stringify(pending))).toBe(true);
  const final = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), storageKey);
  expect(final.pendingAttempt).toBeNull();
  expect(final.result.savedToTeacher).toBe(true);
});

for (const mode of ['practice', 'assessment']) {
  test(`${mode} sorting feedback names the last sorted picture rather than the first`, async ({ page }) => {
    const rounds = mode === 'assessment' ? check : plan;
    const index = rounds.findIndex(round => round.objects?.length > 1 && round.objects.at(-1).audio !== round.audio);
    expect(index).toBeGreaterThanOrEqual(0);
    const round = rounds[index];
    await startAt(page, { mode, practiceIndex: index, assessmentIndex: index });
    for (const object of round.objects.slice(0, -1)) {
      await ready(page);
      await page.locator(`[data-cycle-bin="${object.answer}"]`).click();
    }
    await ready(page);
    await page.evaluate(() => { window.__cycleAudio.played = []; });
    const last = round.objects.at(-1);
    await page.locator(`[data-cycle-bin="${last.answer}"]`).click();
    await expect.poll(() => page.evaluate(() => window.__cycleAudio.played.length)).toBeGreaterThanOrEqual(2);
    const played = await page.evaluate(() => window.__cycleAudio.played);
    expect(played[1].src).toBe(last.audio);
  });
}
