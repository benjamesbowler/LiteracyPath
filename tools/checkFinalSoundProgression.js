import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import {
  coverageExpectations,
  finalSoundLevelOneAllowedItemKeys,
  finalSoundLevelOneForbiddenItemKeys
} from "../src/data/coverageExpectations.js";
import { getQuestionRoutingIssue } from "../src/data/skillTemplateRouting.js";
import { getSkillBankItems } from "../src/content/skillMedia/skillAssetRegistry.js";
import { hasMediaForItem } from "../src/content/skillMedia/skillCoverageUtils.js";
import { buildSkillRoundPlan, emptySkillProgress } from "../src/content/skillMedia/skillProgressionRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const ROUND_LENGTH = 15;
const LEVEL_ONE_ALLOWED = new Set(finalSoundLevelOneAllowedItemKeys);
const ADVANCED_LEVEL_ONE_BLOCKLIST = new Set(finalSoundLevelOneForbiddenItemKeys);
const ADVANCED_WORD_BLOCKLIST = new Set(["ring", "fish", "bath", "hand", "pink"]);

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
  const sound = finalSound(question);
  if (sound && !LEVEL_ONE_ALLOWED.has(sound)) return 2;
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
  if (!LEVEL_ONE_ALLOWED.has(sound) || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
    failures.push(`${question.id}: Level 1 uses non-Level-1 final sound "${sound || "(missing)"}".`);
  }
  if (type && type !== "single_letter") {
    failures.push(`${question.id}: Level 1 finalSoundType must be single_letter, found "${type}".`);
  }
  const options = [
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.map(option => option?.value || option?.label || option) : [])
  ].map(option => normalize(option)).filter(Boolean);
  const soundOptions = options.filter(option => /^[a-z]+$/.test(option) && option.length <= 3);
  soundOptions.forEach(option => {
    if (option.length !== 1) failures.push(`${question.id}: Level 1 answer option "${option}" is not a single letter.`);
  });
  const word = normalize(question.targetWord || question.audioText || "");
  if (ADVANCED_WORD_BLOCKLIST.has(word)) {
    failures.push(`${question.id}: advanced target word "${word}" must not appear in Level 1.`);
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

if (levelOneSource.length < 30) {
  failures.push(`Final Sounds Level 1 has ${levelOneSource.length} active source questions; expected at least 30.`);
}
if (levelTwoSource.length < 30) {
  failures.push(`Final Sounds Level 2 has ${levelTwoSource.length} active source questions; expected at least 30.`);
}

const allItems = getSkillBankItems();
const finalItems = allItems.filter(item => item.skillId === "ending_sounds" && item.active !== false);
const mediaCompleteFinalItems = finalItems.filter(item => hasMediaForItem(item, assetExists).complete);
const levelOneItems = mediaCompleteFinalItems.filter(item => Number(item.level || 1) === 1);
const levelTwoItems = mediaCompleteFinalItems.filter(item => Number(item.level || 1) >= 2);
const activeLevelOneItems = finalItems.filter(item => Number(item.level || 1) === 1);
const levelOneMissingImage = activeLevelOneItems.filter(item => !hasMediaForItem(item, assetExists).image);
const levelOneMissingAudio = activeLevelOneItems.filter(item => !hasMediaForItem(item, assetExists).audio);

finalItems.forEach(item => {
  const raw = item.raw || {};
  const routeIssue = getQuestionRoutingIssue(raw, "final_sounds");
  if (routeIssue) failures.push(`${item.id}: ${routeIssue}`);
  if (Number(item.level || 1) === 1) {
    const sound = normalize(item.targetFinalSound || raw.targetFinalSound || raw.targetSound || raw.itemKey || item.target);
    const type = normalize(item.finalSoundType || raw.finalSoundType);
    if (!LEVEL_ONE_ALLOWED.has(sound) || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
      failures.push(`${item.id}: managed Level 1 item uses non-Level-1 final sound "${sound || "(missing)"}".`);
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
  if (!LEVEL_ONE_ALLOWED.has(sound) || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
    failures.push(`Generated Level 1 round includes non-Level-1 final sound "${sound}" from ${item.id}.`);
  }
  (item.answerOptions || []).forEach(option => {
    const label = normalize(option?.value || option?.label || option);
    if (label.length > 1 && /^[a-z]+$/.test(label)) {
      failures.push(`Generated Level 1 round includes non-letter answer option "${label}" from ${item.id}.`);
    }
  });
});
recordRound(progress, 1, levelOnePlan.items);

for (let index = 0; index < 50; index += 1) {
  const plan = buildSkillRoundPlan({
    skillId: "ending_sounds",
    items: mediaCompleteFinalItems,
    progress: emptySkillProgress(),
    level: 1,
    roundLength: ROUND_LENGTH,
    seed: 9100 + index
  });
  plan.items.forEach(item => {
    const sound = normalize(item.targetFinalSound || item.raw?.targetFinalSound || item.raw?.targetSound || item.raw?.itemKey || item.target);
    if (!LEVEL_ONE_ALLOWED.has(sound) || ADVANCED_LEVEL_ONE_BLOCKLIST.has(sound)) {
      failures.push(`Simulated Level 1 round ${index + 1} includes non-Level-1 final sound "${sound}" from ${item.id}.`);
    }
    const word = normalize(item.targetWord || item.raw?.targetWord || item.raw?.audioText || "");
    if (ADVANCED_WORD_BLOCKLIST.has(word)) {
      failures.push(`Simulated Level 1 round ${index + 1} includes advanced word "${word}" from ${item.id}.`);
    }
  });
}

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
- Active managed Level 1 items: ${activeLevelOneItems.length}
- Level 1 missing images: ${levelOneMissingImage.length}
- Level 1 missing audio: ${levelOneMissingAudio.length}
- Fatal failures: ${failures.length}
- Warnings: ${warnings.length}

## Level Rules

- Level 1 allowed targets only: ${[...LEVEL_ONE_ALLOWED].join(", ")}
- Level 1 blocked endings: ${[...ADVANCED_LEVEL_ONE_BLOCKLIST].join(", ")}
- Level 2: harder final blends, digraphs, double letters, and review single-letter endings.
- Final Sounds prompts must use ending/final-sound language and must not use first/start/initial-sound language.

## Runtime Selector Gate

- Before Level 1 mastery, eligible level: Level 1 only.
- After Level 1 mastery, eligible level: Level 2.
- Level 1 expected targets: ${expectedLevelOneTargets.join(", ")}
- Missing media-complete Level 1 targets: ${missingLevelOneTargets.join(", ") || "none"}

## Level 1 Missing Media

- Missing images: ${levelOneMissingImage.length ? levelOneMissingImage.map(item => `${item.id} (${item.targetWord || item.target})`).join(", ") : "none"}
- Missing audio: ${levelOneMissingAudio.length ? levelOneMissingAudio.map(item => `${item.id} (${item.targetWord || item.target})`).join(", ") : "none"}

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
