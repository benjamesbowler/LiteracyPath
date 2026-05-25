import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { coverageExpectations } from "../src/data/coverageExpectations.js";
import { getQuestionRoutingIssue } from "../src/data/skillTemplateRouting.js";
import { getSkillBankItems } from "../src/content/skillMedia/skillAssetRegistry.js";
import { hasMediaForItem } from "../src/content/skillMedia/skillCoverageUtils.js";
import { buildSkillRoundPlan, emptySkillProgress } from "../src/content/skillMedia/skillProgressionRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const ROUND_LENGTH = 15;
const ADVANCED_LEVEL_ONE_BLOCKLIST = new Set([
  "nd",
  "sk",
  "st",
  "mp",
  "nk",
  "ng",
  "sh",
  "ch",
  "th",
  "ll",
  "ss",
  "ff",
  "ck"
]);

const assetExists = assetPath => {
  if (!assetPath) return false;
  if (!String(assetPath).startsWith("/")) return true;
  return fs.existsSync(path.join(rootDir, "public", String(assetPath).replace(/^\//, "")));
};

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function questionText(question = {}) {
  return normalize([question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" "));
}

function questionLevel(question = {}) {
  return Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
}

function finalSound(question = {}) {
  return normalize(question.targetFinalSound || question.targetSound || question.itemKey || question.correctAnswer || question.answer);
}

function finalSoundType(question = {}) {
  return normalize(question.finalSoundType);
}

function isInitialPrompt(question = {}) {
  return /\b(start|starts|starting|first|beginning|initial)\b/.test(questionText(question));
}

function isEndingPrompt(question = {}) {
  return /\b(end|ending|final)\b/.test(questionText(question));
}

function assertSimpleLevelOne(question, failures) {
  const sound = finalSound(question);
  const type = finalSoundType(question);
  if (sound.length !== 1 || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
    failures.push(`${question.id}: Level 1 uses advanced/multi-letter final sound "${sound || "(missing)"}".`);
  }
  if (type && type !== "single_letter") {
    failures.push(`${question.id}: Level 1 finalSoundType must be single_letter, found "${type}".`);
  }
}

function recordRound(progress, level, items) {
  const key = `level${level}`;
  if (!progress.levels[key]) {
    progress.levels[key] = {
      coveredTargets: [],
      masteredTargets: [],
      weakTargets: [],
      usedTargetWordsByTarget: {}
    };
  }

  const levelProgress = progress.levels[key];
  items.forEach(item => {
    if (item.target && !levelProgress.coveredTargets.includes(item.target)) levelProgress.coveredTargets.push(item.target);
    if (item.target && !levelProgress.masteredTargets.includes(item.target)) levelProgress.masteredTargets.push(item.target);
    if (item.target && item.targetWord) {
      levelProgress.usedTargetWordsByTarget[item.target] = [
        ...(levelProgress.usedTargetWordsByTarget[item.target] || []),
        item.targetWord
      ].filter((word, index, list) => list.indexOf(word) === index);
    }
  });
}

const failures = [];
const warnings = [];
const sourceQuestions = finalSoundCoverageQuestions.filter(question => question.active !== false);
const levelOneSource = sourceQuestions.filter(question => questionLevel(question) === 1);
const levelTwoSource = sourceQuestions.filter(question => questionLevel(question) === 2);

sourceQuestions.forEach(question => {
  const routeIssue = getQuestionRoutingIssue(question, "final_sounds");
  if (routeIssue) failures.push(`${question.id}: ${routeIssue}`);
  if (isInitialPrompt(question)) failures.push(`${question.id}: contains first/start/initial-sound language.`);
  if (!isEndingPrompt(question)) failures.push(`${question.id}: missing ending/final-sound language.`);
  if (questionLevel(question) === 1) assertSimpleLevelOne(question, failures);
});

if (levelOneSource.length < 25) {
  failures.push(`Final Sounds Level 1 has ${levelOneSource.length} active source questions; expected at least 25.`);
}
if (levelTwoSource.length < 25) {
  failures.push(`Final Sounds Level 2 has ${levelTwoSource.length} active source questions; expected at least 25.`);
}

const allItems = getSkillBankItems();
const finalItems = allItems.filter(item => item.skillId === "ending_sounds" && item.active !== false);
const mediaCompleteFinalItems = finalItems.filter(item => hasMediaForItem(item, assetExists).complete);
const levelOneItems = mediaCompleteFinalItems.filter(item => Number(item.level || 1) === 1);
const levelTwoItems = mediaCompleteFinalItems.filter(item => Number(item.level || 1) >= 2);

finalItems.forEach(item => {
  const raw = item.raw || {};
  const routeIssue = getQuestionRoutingIssue(raw, "final_sounds");
  if (routeIssue) failures.push(`${item.id}: ${routeIssue}`);
  if (Number(item.level || 1) === 1) {
    const sound = normalize(item.targetFinalSound || raw.targetFinalSound || raw.targetSound || raw.itemKey || item.target);
    const type = normalize(item.finalSoundType || raw.finalSoundType);
    if (sound.length !== 1 || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
      failures.push(`${item.id}: managed Level 1 item uses advanced/multi-letter final sound "${sound || "(missing)"}".`);
    }
    if (type && type !== "single_letter") {
      failures.push(`${item.id}: managed Level 1 item has finalSoundType "${type}".`);
    }
  }
});

const preMasteryPool = mediaCompleteFinalItems.filter(item => Number(item.level || 1) === 1);
const postMasteryPool = mediaCompleteFinalItems.filter(item => Number(item.level || 1) >= 2);
if (preMasteryPool.some(item => Number(item.level || 1) >= 2)) {
  failures.push("Pre-mastery Final Sounds selector pool contains Level 2 items.");
}
if (!postMasteryPool.length) {
  failures.push("Post-mastery Final Sounds selector pool has no Level 2 items.");
}

const progress = emptySkillProgress();
const levelOnePlan = buildSkillRoundPlan({
  skillId: "ending_sounds",
  items: mediaCompleteFinalItems,
  progress,
  level: 1,
  roundLength: ROUND_LENGTH,
  seed: 7401
});
if (levelOneItems.length >= ROUND_LENGTH && levelOnePlan.items.length !== ROUND_LENGTH) {
  failures.push(`Generated Level 1 round selected ${levelOnePlan.items.length}; expected ${ROUND_LENGTH}.`);
}
levelOnePlan.items.forEach(item => {
  const sound = normalize(item.targetFinalSound || item.raw?.targetFinalSound || item.raw?.targetSound || item.raw?.itemKey || item.target);
  if (sound.length !== 1 || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
    failures.push(`Generated Level 1 round includes advanced final sound "${sound}" from ${item.id}.`);
  }
});
recordRound(progress, 1, levelOnePlan.items);

const levelTwoPlan = buildSkillRoundPlan({
  skillId: "ending_sounds",
  items: mediaCompleteFinalItems,
  progress,
  level: 2,
  roundLength: ROUND_LENGTH,
  seed: 7402
});
if (levelTwoItems.length >= ROUND_LENGTH && levelTwoPlan.items.length !== ROUND_LENGTH) {
  warnings.push(`Generated Level 2 round selected ${levelTwoPlan.items.length}; expected ${ROUND_LENGTH}.`);
}

const levelOneTargets = [...new Set(levelOneItems.map(item => item.target).filter(Boolean))].sort();
const levelTwoTargets = [...new Set(levelTwoItems.map(item => item.target).filter(Boolean))].sort();
const expectedLevelOneTargets = coverageExpectations.final_sounds.itemKeys || [];
const missingLevelOneTargets = expectedLevelOneTargets.filter(target => !levelOneTargets.includes(target));

const reportPath = path.join(rootDir, "docs", "validation", "final_sound_progression_audit.md");
write(reportPath, `# Final Sound Progression Audit

Date: 2026-05-25

## Summary

- Active source Final Sounds questions: ${sourceQuestions.length}
- Level 1 source questions: ${levelOneSource.length}
- Level 2 source questions: ${levelTwoSource.length}
- Media-complete managed Level 1 items: ${levelOneItems.length}
- Media-complete managed Level 2 items: ${levelTwoItems.length}
- Fatal failures: ${failures.length}
- Warnings: ${warnings.length}

## Level Rules

- Level 1: simple one-letter final sounds only.
- Level 1 blocked endings: ${[...ADVANCED_LEVEL_ONE_BLOCKLIST].join(", ")}
- Level 2: harder final blends, digraphs, double letters, and review single-letter endings.
- Final Sounds prompts must use ending/final-sound language and must not use first/start/initial-sound language.

## Runtime Selector Gate

- Before Level 1 mastery, eligible level: Level 1 only.
- After Level 1 mastery, eligible level: Level 2.
- Level 1 expected targets: ${expectedLevelOneTargets.join(", ")}
- Missing media-complete Level 1 targets: ${missingLevelOneTargets.join(", ") || "none"}

## Simulated Rounds

| Round | Selected | Targets | Target Words |
|---|---:|---|---|
| Level 1 | ${levelOnePlan.items.length} | ${levelOnePlan.items.map(item => item.target).join(", ")} | ${levelOnePlan.items.map(item => item.targetWord).join(", ")} |
| Level 2 | ${levelTwoPlan.items.length} | ${levelTwoPlan.items.map(item => item.target).join(", ")} | ${levelTwoPlan.items.map(item => item.targetWord).join(", ")} |

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}

## Warnings

${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}
`);

console.log(`Final Sounds source questions: ${sourceQuestions.length}`);
console.log(`Level 1 source questions: ${levelOneSource.length}`);
console.log(`Level 2 source questions: ${levelTwoSource.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Final Sound progression check passed.");
