import path from "node:path";

import {
  buildRuntimeQuestionsForSkill,
  inferPatternForSkill,
  normalizeWord,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import {
  finalSoundLevelOneAllowedItemKeys,
  finalSoundLevelOneForbiddenItemKeys
} from "../src/data/coverageExpectations.js";
import {
  getFinalSoundsLevel1QuestionIssues,
  isFinalSoundsLevel1Question
} from "../src/data/earlyPhonicsValidation.js";
import { finalSoundsGeneratedQuestions } from "../src/data/generated/finalSounds.generated.js";
import { getEarlySkillRuntimeEligibilityIssues } from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

const ROUND_LENGTH = 15;
const FRESH_ROUNDS = 100;
const REMEDIATION_ROUNDS = 100;
const allowed = new Set(finalSoundLevelOneAllowedItemKeys);
const forbidden = new Set(finalSoundLevelOneForbiddenItemKeys);

function seededShuffle(items, seed) {
  const copy = [...items];
  let value = seed;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const swapIndex = value % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function answerOptions(question = {}) {
  return [...new Set([
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.map(option => option?.value || option?.label || option?.word || option) : [])
  ].map(normalizeWord).filter(Boolean))];
}

function finalTarget(question = {}) {
  return normalizeWord(
    question.coverageTarget ||
    question.targetFinalSound ||
    question.targetSound ||
    question.itemKey ||
    question.phonicsPattern ||
    question.targetPattern ||
    inferPatternForSkill("final_sounds", question)
  );
}

function validateQuestion(question, context, failures) {
  const issues = getFinalSoundsLevel1QuestionIssues(question);
  if (issues.length) {
    failures.push(`${context}: ${question.id || "(missing id)"} failed Level 1 guard: ${issues.join("; ")}`);
  }
  const runtimeIssues = getEarlySkillRuntimeEligibilityIssues(question, {
    skillId: "final_sounds",
    level: 1,
    pathExists: publicPathExists
  });
  if (runtimeIssues.length) {
    failures.push(`${context}: ${question.id || "(missing id)"} failed runtime eligibility: ${runtimeIssues.join("; ")}`);
  }
  const target = finalTarget(question);
  if (!allowed.has(target) || forbidden.has(target)) {
    failures.push(`${context}: ${question.id || "(missing id)"} has forbidden target "${target || "(missing)"}".`);
  }
  const correct = normalizeWord(question.correctAnswer || question.answer || target);
  if (!allowed.has(correct) || correct.length !== 1) {
    failures.push(`${context}: ${question.id || "(missing id)"} has invalid correct answer "${correct || "(missing)"}".`);
  }
  answerOptions(question).forEach(option => {
    if (option.length !== 1 || !allowed.has(option) || forbidden.has(option)) {
      failures.push(`${context}: ${question.id || "(missing id)"} has invalid answer option "${option}".`);
    }
  });
}

function buildFreshRound(seed, pool) {
  return sampleRound(seededShuffle(pool, seed), ROUND_LENGTH);
}

function buildRemediationRound(seed, pool) {
  const targetOrder = ["l", "b", "d", "g", "m", "n", "p", "t"];
  const shuffled = seededShuffle(pool, seed);
  return sampleRound([
    ...targetOrder.flatMap(target => shuffled.filter(question => finalTarget(question) === target)),
    ...shuffled
  ], ROUND_LENGTH);
}

const failures = [];
const warnings = [];
const allFinalRuntime = buildRuntimeQuestionsForSkill("final_sounds");
const selectableFinalRuntime = selectableRuntimeQuestionsForSkill("final_sounds");
const invalidExplicitLevelOne = selectableFinalRuntime.filter(question => {
  const level = Number(question.level || question.difficulty || 1) || 1;
  return level === 1 && !isFinalSoundsLevel1Question(question);
});
const levelOnePool = selectableFinalRuntime.filter(isFinalSoundsLevel1Question);
const generatedLevelOnePool = finalSoundsGeneratedQuestions.filter(question => Number(question.level || question.difficulty || 1) === 1);
const invalidGeneratedLevelOne = generatedLevelOnePool.filter(question => !isFinalSoundsLevel1Question(question));
const levelOneTargets = [...new Set(levelOnePool.map(finalTarget).filter(Boolean))].sort();
const missingTargets = finalSoundLevelOneAllowedItemKeys.filter(target => !levelOneTargets.includes(target));

if (levelOnePool.length < ROUND_LENGTH) {
  failures.push(`Only ${levelOnePool.length} clean Final Sounds Level 1 runtime questions are selectable; expected at least ${ROUND_LENGTH}.`);
}
if (missingTargets.length) {
  failures.push(`Clean Final Sounds Level 1 runtime pool is missing targets: ${missingTargets.join(", ")}.`);
}

invalidExplicitLevelOne.forEach(question => {
  failures.push(
    `Runtime Level 1 candidate blocked: ${question.id || "(missing id)"} from ${question._source || question.source || "unknown"} (${getFinalSoundsLevel1QuestionIssues(question).join("; ")})`
  );
});

invalidGeneratedLevelOne.forEach(question => {
  failures.push(
    `Generated Level 1 candidate is dirty: ${question.id || "(missing id)"} (${getFinalSoundsLevel1QuestionIssues(question).join("; ")})`
  );
});

for (let index = 0; index < FRESH_ROUNDS; index += 1) {
  const round = buildFreshRound(12000 + index, levelOnePool);
  if (round.length !== ROUND_LENGTH) {
    failures.push(`Fresh Level 1 round ${index + 1} produced ${round.length} questions; expected ${ROUND_LENGTH}.`);
  }
  round.forEach(question => validateQuestion(question, `fresh round ${index + 1}`, failures));
}

for (let index = 0; index < REMEDIATION_ROUNDS; index += 1) {
  const round = buildRemediationRound(22000 + index, levelOnePool);
  if (round.length !== ROUND_LENGTH) {
    failures.push(`Remediation Level 1 round ${index + 1} produced ${round.length} questions; expected ${ROUND_LENGTH}.`);
  }
  round.forEach(question => validateQuestion(question, `remediation round ${index + 1}`, failures));
}

for (let index = 0; index < 100; index += 1) {
  const generatedSample = buildFreshRound(32000 + index, generatedLevelOnePool);
  generatedSample.forEach(question => validateQuestion(question, `generated candidate sample ${index + 1}`, failures));
}

const sampleFresh = buildFreshRound(12000, levelOnePool);
const sampleRemediation = buildRemediationRound(22000, levelOnePool);
const reportPath = path.join(repoRoot, "docs", "validation", "final_sounds_level1_purity_audit.md");

writeFile(reportPath, `# Final Sounds Level 1 Purity Audit

Date: 2026-05-26

## Summary

- Runtime Final Sounds candidates scanned: ${allFinalRuntime.length}
- Runtime-selectable Final Sounds candidates: ${selectableFinalRuntime.length}
- Clean Level 1 runtime candidates after last-mile guard: ${levelOnePool.length}
- Generated Level 1 candidates scanned: ${generatedLevelOnePool.length}
- Dirty generated Level 1 candidates: ${invalidGeneratedLevelOne.length}
- Explicit Level 1 candidates blocked by guard: ${invalidExplicitLevelOne.length}
- Fresh Level 1 rounds tested: ${FRESH_ROUNDS}
- Remediation Level 1 rounds tested: ${REMEDIATION_ROUNDS}
- Generated candidate samples tested: 100
- Fatal failures: ${failures.length}
- Warnings: ${warnings.length}

## Level 1 Rule

- Allowed targets: ${finalSoundLevelOneAllowedItemKeys.join(", ")}
- Forbidden targets/options: ${finalSoundLevelOneForbiddenItemKeys.join(", ")}
- Every Level 1 answer option must be one letter.

## Leak Source And Fix

- Advanced endings such as \`sh\`, \`th\`, and \`sk\` exist only in the Level 2 Final Sounds pools.
- Level 1 previously had fuzzy validation around double-final spellings such as \`bell\`, \`ball\`, \`hill\`, \`doll\`, and generated examples such as \`egg\`; these are now rejected as double consonants.
- A final runtime guard now runs in \`src/App.jsx\` immediately before early-phonics runtime eligibility filtering. If the current Final Sounds level is 1, any question that fails \`getFinalSoundsLevel1QuestionIssues()\` is removed before selection.

## Coverage

- Available clean targets: ${levelOneTargets.join(", ") || "none"}
- Missing clean targets: ${missingTargets.join(", ") || "none"}

## Sample Fresh Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
${sampleFresh.map((question, index) => `| ${index + 1} | ${question.id || ""} | ${finalTarget(question)} | ${normalizeWord(question.targetWord || question.audioText || "")} | ${answerOptions(question).join(", ")} |`).join("\n")}

## Sample Remediation Round

| # | id | target | word | answer options |
|---:|---|---|---|---|
${sampleRemediation.map((question, index) => `| ${index + 1} | ${question.id || ""} | ${finalTarget(question)} | ${normalizeWord(question.targetWord || question.audioText || "")} | ${answerOptions(question).join(", ")} |`).join("\n")}

## Blocked Runtime Level 1 Candidates

${invalidExplicitLevelOne.length
  ? invalidExplicitLevelOne.map(question => `- ${question.id || "(missing id)"} (${question._source || question.source || "unknown"}): ${getFinalSoundsLevel1QuestionIssues(question).join("; ")}`).join("\n")
  : "- none"}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}
`);

console.log(`Final Sounds Level 1 clean runtime candidates: ${levelOnePool.length}`);
console.log(`Final Sounds Level 1 clean targets: ${levelOneTargets.join(", ")}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Final Sounds Level 1 purity check passed.");
