import { expect, test } from "@playwright/test";
import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from "../../src/policy/studentDeviceMatrix.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";
import { importV3Bank } from "../../src/data/v3/v3Registry.js";
import { collectAssessmentEvidenceImages } from "../../src/policy/assessmentMediaEvidence.js";
import { getQuestionAnswer } from "../../src/appState/assessmentRuntime.js";

// Cold imports of the production bank/renderer and three page reloads are
// included in these flows; individual interaction expectations stay bounded.
test.describe.configure({ timeout: 120000 });

const url = "/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1";
const key = "literacy-guide-learn-games:child-surface-preview";
async function saved(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}").games?.["skills-trail"] || {}, key); }

async function syntheticAudio(page, durationMs = 20) {
  await page.addInitScript(({ durationMs }) => {
    crypto.randomUUID = () => "test-session";
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ""; this.currentTime = 0; this.volume = 1; this.readyState = 4; this.duration = 0.02; this.paused = true; }
      load() { this.dispatchEvent(new Event("canplay")); }
      play() { window.__skillsAudioStarted = (window.__skillsAudioStarted || 0) + 1; this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event("ended")); }, durationMs); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  }, { durationMs });
}

for (const profile of STUDENT_DEVICE_PROFILES) {
  test(`Skills trail Home focus outline stays clear at ${profile.id}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.goto(url);
    const surface = page.locator('[data-child-surface="skills-practice"]');
    const home = surface.getByRole("button", { name: "Home", exact: true });
    await expect(home).toBeVisible();
    await page.keyboard.press("Tab");
    await home.focus();
    const geometry = await home.evaluate(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const scaleX = rect.width / element.offsetWidth;
      const scaleY = rect.height / element.offsetHeight;
      const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;
      const extent = outlineWidth + (Number.parseFloat(style.outlineOffset) || 0);
      const outline = {
        left: rect.left - extent * scaleX,
        top: rect.top - extent * scaleY,
        right: rect.right + extent * scaleX,
        bottom: rect.bottom + extent * scaleY
      };
      const primary = element.closest("main").querySelector("[data-child-primary]").getBoundingClientRect();
      const startRow = element.closest("main").querySelector(".skills-practice-start").getBoundingClientRect();
      const pane = document.querySelector(".kg-main").getBoundingClientRect();
      const navigation = document.querySelector(".kg-tabbar").getBoundingClientRect();
      const usableBottom = Math.min(pane.bottom, navigation.top, window.innerHeight);
      return {
        focusVisible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth,
        clearOfStickyRow: outline.bottom <= startRow.top,
        outlineInsidePane: outline.left >= Math.max(0, pane.left)
          && outline.top >= Math.max(0, pane.top)
          && outline.right <= Math.min(window.innerWidth, pane.right)
          && outline.bottom <= usableBottom,
        primaryInsidePane: primary.left >= Math.max(0, pane.left)
          && primary.top >= Math.max(0, pane.top)
          && primary.right <= Math.min(window.innerWidth, pane.right)
          && primary.bottom <= usableBottom,
        homeTarget: { width: rect.width, height: rect.height },
        primaryTarget: { width: primary.width, height: primary.height },
        outline,
        startRowTop: startRow.top
      };
    });
    expect(geometry.focusVisible).toBe(true);
    expect(geometry.outlineStyle).not.toBe("none");
    expect(geometry.outlineWidth).toBeGreaterThanOrEqual(3);
    expect(geometry.clearOfStickyRow, JSON.stringify(geometry)).toBe(true);
    expect(geometry.outlineInsidePane, JSON.stringify(geometry)).toBe(true);
    expect(geometry.primaryInsidePane, JSON.stringify(geometry)).toBe(true);
    for (const target of [geometry.homeTarget, geometry.primaryTarget]) {
      expect(target.width).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
      expect(target.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
    }
    await expectVisibleImagesReady(page, `${profile.id} Skills keyboard focus`);
    await page.screenshot({ path: info.outputPath(`skills-home-focus-${profile.id}.png`), fullPage: false });
  });
}

test("first input is accepted during long instruction playback without inventing listening evidence", async ({ page }) => {
  await syntheticAudio(page, 30000);
  await page.goto(url);
  await page.getByRole("button", { name: /Short Vowel Discrimination/ }).click();
  await page.locator("[data-child-primary]").click();
  await expect.poll(() => page.evaluate(() => window.__skillsAudioStarted || 0)).toBeGreaterThan(0);
  await page.locator(".assessment-answer-card, .ixl-answer-button, .visual-assessment-card-button").first().click();
  await expect.poll(async () => (await saved(page)).practiceRecord?.completions?.length).toBe(1);
  const step = (await saved(page)).practiceRecord.completions[0].steps[0];
  expect(step.responseStatus).toBe("answered");
  expect(typeof step.answerMatch).toBe("boolean");
  expect(step.responseTimeMs).toBe(null);
  expect(step.instructionDelivery).toBe("started");
  expect(step.targetDelivery).toBe("not_started");
  expect(step.isCorrect).toBe(null);
  expect(step.firstResponseCorrect).toBe(null);
  expect(step.evidenceType).toBe("unscored");
  expect(step.validity).toBe("invalid");
});

test("Skills trail exposes all 30 free choices and fits tablet and small phone", async ({ page }, info) => {
  await page.goto(url);
  const labels = new Set();
  for (const group of await page.locator(".skills-practice-groups button").all()) {
    await group.click();
    for (const label of await page.locator(".skills-practice-stops strong").allTextContents()) labels.add(label);
  }
  expect(labels.size).toBe(30);
  for (const size of [{ width: 1024, height: 768 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size);
    await expect(page.locator("[data-child-primary]")).toBeVisible();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fits).toBe(true);
    await page.screenshot({ path: info.outputPath(`skills-map-${size.width}.png`), fullPage: true });
  }
});

test("first answer is immutable, help stays supported, and reload resumes without answering twice", async ({ page }, info) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await syntheticAudio(page);
  await page.goto(url);
  await page.locator("[data-child-primary]").click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  const firstQuestion = await page.locator("[data-assessment-question-id]").getAttribute("data-assessment-question-id");
  const choices = page.locator(".assessment-answer-card, .ixl-answer-button, .visual-assessment-card-button");
  await choices.first().click();
  await expect.poll(async () => (await saved(page)).practiceRecord?.completions?.length).toBe(1);
  const first = (await saved(page)).practiceRecord.completions[0];
  await choices.last().click({ force: true });
  expect((await saved(page)).practiceRecord.completions).toEqual([first]);
  await page.screenshot({ path: info.outputPath("skills-first-answer.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Carry on", exact: true }).click();
  await expect(page.locator("[data-assessment-question-id]")).not.toHaveAttribute("data-assessment-question-id", firstQuestion);
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  await page.getByRole("button", { name: "Show me", exact: true }).click();
  await page.locator(".assessment-answer-card, .ixl-answer-button, .visual-assessment-card-button").first().click();
  await expect.poll(async () => (await saved(page)).practiceRecord?.completions?.length).toBe(2);
  const supported = (await saved(page)).practiceRecord.completions[1];
  expect(supported.steps[0].supportUsed).toBe(true);
  expect(supported.steps[0].isCorrect).toBe(null);
  expect(first.steps[0].responseTimeMs).toBeGreaterThanOrEqual(0);
  expect((await saved(page)).stars).toBeUndefined();
  expect((await saved(page)).plays).toBeUndefined();
  await page.goto("/preview/child-surfaces.html?surface=skills-practice-report&preserveSkills=1");
  await expect(page.getByRole("heading", { name: "Self-chosen Skills practice" })).toBeVisible();
  await expect(page.getByText(/2 answered questions · 1 with help/)).toBeVisible();
  await page.getByText("View saved questions and responses", { exact: true }).click();
  await expect(page.getByText(/First response without help/).first()).toBeVisible();
  await expect(page.getByText(/With help/).last()).toBeVisible();
  await page.screenshot({ path: info.outputPath("skills-teacher-report.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("missing image is unscored and replaced with another real question", async ({ page }) => {
  await syntheticAudio(page);
  let failedSource = "";
  await page.route("**/images/assessment/**", async route => {
    if (!failedSource) failedSource = new URL(route.request().url()).pathname;
    if (new URL(route.request().url()).pathname === failedSource) await route.abort();
    else await route.continue();
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Words and sentences", exact: true }).click();
  await page.getByRole("button", { name: /Prepositions of Place/ }).click();
  await page.locator("[data-child-primary]").click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  await expect.poll(async () => (await saved(page)).practiceRecord?.completions?.filter(event => event.steps[0].responseStatus === "media_failed").length || 0).toBe(1);
  const record = (await saved(page)).practiceRecord.completions[0];
  expect(record.steps[0].isCorrect).toBe(null);
  expect(record.steps[0].selected).toBe(null);
  const checkpoint = (await saved(page)).checkpoints.practice;
  expect(checkpoint.failedMediaSources).toContain(failedSource);
  const bank = await importV3Bank(checkpoint.skillId);
  for (const id of checkpoint.questionIds.slice(checkpoint.index)) {
    expect(collectAssessmentEvidenceImages(bank.find(item => item.id === id)).map(item => item.src)).not.toContain(failedSource);
  }
  await page.reload();
  await page.getByRole("button", { name: "Carry on", exact: true }).click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  expect((await saved(page)).checkpoints.practice.failedMediaSources).toEqual(checkpoint.failedMediaSources);
  expect((await saved(page)).practiceRecord.completions.filter(event => event.steps[0].responseStatus === "media_failed")).toHaveLength(1);
});

test("choosing a different skill after playing updates the launch title and selected difficulty", async ({ page }) => {
  await syntheticAudio(page);
  await page.goto(url);
  await page.locator("[data-child-primary]").click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  await page.getByRole("button", { name: "Choose a skill", exact: true }).click();
  await page.locator(".skills-practice-stops").getByRole("button", { name: /^Final Sounds/ }).click();
  await expect(page.locator(".skills-practice-selected h2")).toHaveText("Final Sounds");
  await expect(page.locator("[data-child-primary]")).toHaveText("Play Final Sounds");
  await page.getByRole("switch", { name: "Try harder questions" }).click();
  await expect(page.getByRole("switch", { name: "Try harder questions" })).toHaveAttribute("aria-checked", "true");
  await page.locator("[data-child-primary]").click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  expect((await saved(page)).checkpoints.practice.skillId).toBe("final_sounds");
  expect((await saved(page)).checkpoints.practice.level).toBe(2);
});

for (const [label, correct, viewport] of [["Correct", true, { width: 1024, height: 768 }], ["Not yet", false, { width: 568, height: 320 }]]) {
  test(`${label} feedback is centred and contained in the question area`, async ({ page }, info) => {
    await syntheticAudio(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto(url);
    await page.locator("[data-child-primary]").click();
    await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
    const id = await page.locator("[data-assessment-question-id]").getAttribute("data-assessment-question-id");
    const bank = await importV3Bank("initial_sounds");
    const answer = String(getQuestionAnswer(bank.find(item => item.id === id)));
    const choices = page.locator(".assessment-answer-card");
    const texts = await choices.allTextContents();
    const selected = texts.findIndex(text => (text.trim() === answer) === correct);
    expect(selected).toBeGreaterThanOrEqual(0);
    await choices.nth(selected).click();
    const feedback = page.locator(".skills-practice-feedback-layer .assessment-feedback");
    await expect(feedback.getByRole("heading", { name: label, exact: true })).toBeVisible();
    const geometry = await feedback.evaluate(element => {
      const card = element.getBoundingClientRect();
      const layer = element.parentElement.getBoundingClientRect();
      const tabs = document.querySelector(".kg-tabbar").getBoundingClientRect();
      return { centreDelta: Math.abs((card.left + card.right) / 2 - (layer.left + layer.right) / 2),
        contained: card.top >= layer.top && card.bottom <= layer.bottom && card.bottom <= tabs.top,
        border: getComputedStyle(element).borderRadius };
    });
    expect(geometry.centreDelta).toBeLessThanOrEqual(1);
    expect(geometry.contained).toBe(true);
    expect(geometry.border).toBe("22px");
    expect((await saved(page)).practiceRecord.completions[0].steps[0].answerMatch).toBe(correct);
    await page.screenshot({ path: info.outputPath(`skills-feedback-${correct ? "correct" : "not-yet"}.png`), fullPage: false });
  });
}

test("leaving an offered question preserves no-response evidence before a later answer", async ({ page }) => {
  await syntheticAudio(page);
  await page.goto(url);
  await page.locator("[data-child-primary]").click();
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  const questionId = await page.locator("[data-assessment-question-id]").getAttribute("data-assessment-question-id");
  await page.getByRole("button", { name: "Choose a skill", exact: true }).click();
  const unanswered = (await saved(page)).practiceRecord.completions[0];
  expect(unanswered.steps[0].responseStatus).toBe("no_response");
  expect(unanswered.steps[0].isCorrect).toBe(null);
  await page.getByRole("button", { name: "Carry on", exact: true }).click();
  await expect(page.locator("[data-assessment-question-id]")).toHaveAttribute("data-assessment-question-id", questionId);
  await expect(page.locator(".skills-practice-play")).toHaveAttribute("data-skills-practice-ready", "true");
  await page.locator(".assessment-answer-card, .ixl-answer-button, .visual-assessment-card-button").first().click();
  await expect.poll(async () => (await saved(page)).practiceRecord?.completions?.length).toBe(2);
  const records = (await saved(page)).practiceRecord.completions;
  expect(records.find(event => event.id === unanswered.id)).toEqual(unanswered);
  expect(records.find(event => event.id !== unanswered.id).steps[0].responseStatus).toBe("answered");
});
