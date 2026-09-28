import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { importV3Bank } from "../../src/data/v3/v3Registry.js";

const COMPREHENSION = new Set([
  "sentence_comprehension", "key_details", "sequencing", "main_idea", "inference",
  "cause_effect", "context_clues", "theme_higher_comprehension"
]);
const PORTRAIT_SKILLS = new Set([...COMPREHENSION, "prepositions_of_place",
  "hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]);
const LANDSCAPE = { width: 1024, height: 768 };
const PORTRAIT = { width: 768, height: 1024 };
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const choiceValue = value => typeof value === "string" ? value : value.value ?? value.word ?? value.label;

function isNewAuthoredItem(item, skill, level) {
  const variant = Number(item.id.match(/\.v(\d+)$/)?.[1]);
  return item.level === level && variant >= (COMPREHENSION.has(skill) ? 40 : 101)
    && !item.isRetention && !item.id.includes(".R.");
}

async function newQuestion(skill, level) {
  const candidates = (await importV3Bank(skill)).filter(item => isNewAuthoredItem(item, skill, level));
  expect(candidates.length, `${skill} level ${level} must include the authored depth expansion`).toBeGreaterThan(0);
  // Stress the longest new language context; explicitly exercise the reviewed
  // replacement O anchor instead of letting a stable old item mask its wiring.
  if (skill === "initial_sounds" && level === 2) {
    const office = candidates.find(item => item.targetWord === "office");
    expect(office, "the familiar office anchor must replace olive").toBeTruthy();
    return office;
  }
  const length = item => [item.passage, item.sentence, item.sentenceText, item.prompt,
    ...item.choices.map(choiceValue)].join(" ").length;
  return candidates.sort((left, right) => length(right) - length(left))[0];
}

async function reachable(control, viewport) {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await expect(control).toBeInViewport();
  const bounds = await control.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
  await control.click({ trial: true });
}

async function exerciseItem({ page }, testInfo, skill, level, viewport) {
  const item = await newQuestion(skill, level);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize(viewport);
  let saves = 0;
  await page.route("**/__preview_assessment_answer__", route => {
    saves += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto(`/preview/assessment-media-evidence.html?scenario=response-latency&skill=${skill}&item=${encodeURIComponent(item.id)}`);
  const preview = page.locator('[data-preview-surface="assessment-media-evidence"]');
  const question = page.locator(`[data-assessment-question-id="${item.id}"]`);
  await expect(question).toBeVisible();
  await expect.poll(() => question.locator("img").evaluateAll(images =>
    images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  const listen = question.getByRole("button", { name: "Listen to question", exact: true });
  await reachable(listen, viewport);
  await listen.click();
  await expect(preview).not.toHaveAttribute("data-last-audio-request", "");
  const audio = JSON.parse(await preview.getAttribute("data-last-audio-request"));
  expect(audio.requireApprovedAudio).toBe(true);
  expect(audio.audioPath).toMatch(/^\/audio\/.*\.mp3$/);
  const servedAudio = await page.request.get(audio.audioPath);
  expect(servedAudio.ok()).toBe(true);
  const bytes = await servedAudio.body();
  expect(bytes.length).toBeGreaterThan(100);
  expect(hash(bytes)).toBe(hash(await fs.readFile(`public${audio.audioPath}`)));

  const building = item.formatType === "HFW_LETTER_BUILD";
  const answers = building
    ? question.getByRole("button", { name: /^Add / })
    : question.locator(".assessment-answer-card, .ixl-answer-button, .visual-assessment-card-button");
  const answerCount = await answers.count();
  expect(answerCount).toBeGreaterThan(0);
  if (!building) expect(answerCount).toBe(item.choices.length);
  for (let index = 0; index < answerCount; index += 1) await reachable(answers.nth(index), viewport);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(preview).toHaveAttribute("data-answer-count", "0");
  if (viewport.width === PORTRAIT.width) {
    await page.screenshot({ path: testInfo.outputPath("question-portrait.png"), fullPage: true });
  }

  if (building) {
    for (const letter of item.answer) {
      const tile = question.getByRole("button", { name: `Add ${letter}`, exact: true }).and(question.locator(":enabled")).first();
      await tile.click();
    }
  } else {
    const correctIndex = item.choices.findIndex(choice => choiceValue(choice) === item.answer);
    expect(correctIndex).toBeGreaterThanOrEqual(0);
    await answers.nth(correctIndex).click();
  }
  await expect(preview).toHaveAttribute("data-answer-count", "1");
  await expect(preview).toHaveAttribute("data-last-answer", JSON.stringify(item.answer));
  expect(saves).toBe(1);
  expect(errors).toEqual([]);
  await testInfo.attach("administered-question.json", {
    body: JSON.stringify({ skill, level, questionId: item.id, format: item.formatType,
      viewport, answerCount, audioPath: audio.audioPath, servedAudioBytes: bytes.length,
      savedAnswer: item.answer, evidenceScope: "Browser interaction and approved audio wiring; not human listening or physical-device evidence." }, null, 2),
    contentType: "application/json"
  });
}

test.use({ hasTouch: true });
test.describe.configure({ mode: "parallel" });
for (const skill of Object.keys(skillBlueprints)) {
  for (const level of [1, 2]) {
    test(`new ${skill} level ${level} can be heard and answered in landscape`, async ({ page }, testInfo) => {
      await exerciseItem({ page }, testInfo, skill, level, LANDSCAPE);
    });
  }
  if (PORTRAIT_SKILLS.has(skill)) {
    test(`new ${skill} level 2 can be heard and answered in portrait`, async ({ page }, testInfo) => {
      await exerciseItem({ page }, testInfo, skill, 2, PORTRAIT);
    });
  }
}
