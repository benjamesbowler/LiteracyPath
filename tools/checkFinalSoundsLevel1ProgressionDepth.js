import path from "node:path";

import {
  buildFinalSoundAvailabilitySummary,
  buildFinalSoundAvailableWordMap,
  evaluateFinalSoundLevelOneMasteryDepth,
  finalSoundLevelOneTargets,
  FINAL_SOUND_LEVEL_ONE_PASS_SCORE,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS,
  FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH,
  getFinalSoundLevelOneRequiredContentWords,
  getFinalSoundTargetFromEvidence,
  getFinalSoundTargetWordFromEvidence
} from "../src/data/finalSoundMasteryDepth.js";
import { isFinalSoundsLevel1Question } from "../src/data/earlyPhonicsValidation.js";
import {
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const failures = [];
const warnings = [];

function recordFromQuestion(question, isCorrect = true) {
  return {
    questionId: question.id,
    skillId: "final_sounds",
    stage: "Final Sounds",
    itemType: "final_sound",
    itemKey: getFinalSoundTargetFromEvidence(question),
    targetWord: getFinalSoundTargetWordFromEvidence(question),
    correct: question.correctAnswer || question.answer || getFinalSoundTargetFromEvidence(question),
    isCorrect
  };
}

function syntheticRecord(target, word, isCorrect = true) {
  return {
    questionId: `synthetic_${target}_${word}`,
    skillId: "final_sounds",
    stage: "Final Sounds",
    itemType: "final_sound",
    itemKey: target,
    targetWord: word,
    correct: target,
    isCorrect
  };
}

function buildSyntheticMasteryRecords() {
  const records = [];
  finalSoundLevelOneTargets.forEach(target => {
    ["one", "two", "three"].forEach(suffix => {
      records.push(syntheticRecord(target, `${target}${suffix}`, true));
    });
  });

  while (records.length < FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH * FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS) {
    const target = finalSoundLevelOneTargets[records.length % finalSoundLevelOneTargets.length];
    records.push(syntheticRecord(target, `${target}extra${records.length}`, true));
  }

  return records;
}

const levelOnePool = selectableRuntimeQuestionsForSkill("final_sounds").filter(isFinalSoundsLevel1Question);
const availableWordsBySound = buildFinalSoundAvailableWordMap(levelOnePool);
const availabilitySummary = buildFinalSoundAvailabilitySummary(levelOnePool);
const countsBySound = Object.fromEntries(finalSoundLevelOneTargets.map(target => [
  target,
  [...(availableWordsBySound[target] || [])].sort()
]));

const onePerfectRound = sampleRound(levelOnePool, FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH).map(question => recordFromQuestion(question, true));
const oneRoundDepth = evaluateFinalSoundLevelOneMasteryDepth(onePerfectRound, {
  availableWordsBySound,
  roundLength: FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH,
  passScore: FINAL_SOUND_LEVEL_ONE_PASS_SCORE
});

if (oneRoundDepth.levelOneMastered) {
  failures.push("One perfect 15-question Level 1 round incorrectly unlocked Level 2.");
}
if (oneRoundDepth.successfulRounds !== 1) {
  failures.push(`One perfect round recorded ${oneRoundDepth.successfulRounds} successful rounds; expected 1.`);
}

const nextRoundPoolAfterOneRound = levelOnePool.filter(question =>
  finalSoundLevelOneTargets.includes(getFinalSoundTargetFromEvidence(question))
);
const nextRound = sampleRound(nextRoundPoolAfterOneRound, FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH);
const dirtyNextRound = nextRound.filter(question => !isFinalSoundsLevel1Question(question));
if (nextRound.length !== FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH) {
  failures.push(`Next Level 1 round after shallow coverage produced ${nextRound.length}; expected ${FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH}.`);
}
if (dirtyNextRound.length) {
  failures.push(`Next Level 1 round contained non-Level 1 questions: ${dirtyNextRound.map(question => question.id).join(", ")}`);
}

const syntheticAvailable = Object.fromEntries(finalSoundLevelOneTargets.map(target => [
  target,
  new Set(Array.from(
    { length: getFinalSoundLevelOneRequiredContentWords(target) },
    (_, index) => `${target}word${index + 1}`
  ))
]));
const syntheticDepth = evaluateFinalSoundLevelOneMasteryDepth(buildSyntheticMasteryRecords(), {
  availableWordsBySound: syntheticAvailable,
  roundLength: FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH,
  passScore: FINAL_SOUND_LEVEL_ONE_PASS_SCORE
});
if (!syntheticDepth.levelOneMastered) {
  failures.push("Depth evaluator did not unlock Level 2 after enough correct unique examples per sound and two successful rounds.");
}

const realContentGapDepth = evaluateFinalSoundLevelOneMasteryDepth([], {
  availableWordsBySound,
  roundLength: FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH,
  passScore: FINAL_SOUND_LEVEL_ONE_PASS_SCORE
});
if (realContentGapDepth.contentGaps.length) {
  warnings.push(`Some Level 1 final sounds do not have enough distinct usable target words: ${realContentGapDepth.contentGaps.map(gap => `${gap.target}(${gap.availableWordCount}/${gap.requiredWordCount})`).join(", ")}.`);
}

const reportPath = path.join(repoRoot, "docs", "validation", "final_sounds_level1_progression_depth_audit.md");
const rows = finalSoundLevelOneTargets.map(target => {
  const words = countsBySound[target] || [];
  const summary = availabilitySummary[target];
  const requiredContentWords = getFinalSoundLevelOneRequiredContentWords(target);
  return `| ${target} | ${words.length} | ${summary?.runtimeVariantCount || 0} | ${summary?.activeItemCount || 0} | ${summary?.usableImageCount || 0} | ${summary?.usableAudioCount || 0} | ${summary?.missingImageCount || 0} | ${summary?.missingAudioCount || 0} | ${requiredContentWords} | ${words.join(", ") || "-"} | ${words.length >= requiredContentWords ? "yes" : "no"} |`;
}).join("\n");

writeFile(reportPath, `# Final Sounds Level 1 Progression Depth Audit

Generated: ${new Date().toISOString()}

## New Mastery Rule

Final Sounds Level 1 no longer unlocks Level 2 after simple 8/8 sound coverage.

Each Level 1 final sound must have:

- ${FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT} correct answers
- ${FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS} different correct target words where possible
- enough distinct usable media-backed content words for the sound
- ${FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS} successful Level 1 rounds

Level 1 sounds stay limited to: ${finalSoundLevelOneTargets.join(", ")}.

## Runtime Depth Inventory

| Sound | Distinct usable words | Runtime variants | Active items | Image-backed variants | Audio-backed variants | Missing image | Missing audio | Required content words | Words | Enough content? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
${rows}

## Simulation Results

- One perfect 15-question Level 1 round unlocks Level 2: ${oneRoundDepth.levelOneMastered ? "yes" : "no"}
- One-round successful rounds: ${oneRoundDepth.successfulRounds}/${FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS}
- Next round after one perfect round stayed Level 1 clean: ${dirtyNextRound.length === 0 && nextRound.length === FINAL_SOUND_LEVEL_ONE_ROUND_LENGTH ? "yes" : "no"}
- Synthetic full-depth evidence unlocks Level 2: ${syntheticDepth.levelOneMastered ? "yes" : "no"}

## Content Gaps

${realContentGapDepth.contentGaps.length
  ? realContentGapDepth.contentGaps.map(gap => `- ${gap.target}: ${gap.availableWordCount}/${gap.requiredWordCount} distinct usable words (${gap.availableTargetWords.join(", ") || "none"})`).join("\n")
  : "- none"}

## Warnings

${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}
`);

console.log(`Final Sounds Level 1 usable questions: ${levelOnePool.length}`);
console.log(`Usable words by sound: ${finalSoundLevelOneTargets.map(target => `${target}:${countsBySound[target]?.length || 0}`).join(", ")}`);
console.log(`One perfect round unlocks Level 2: ${oneRoundDepth.levelOneMastered ? "yes" : "no"}`);
console.log(`Synthetic full-depth evidence unlocks Level 2: ${syntheticDepth.levelOneMastered ? "yes" : "no"}`);
if (warnings.length) warnings.forEach(warning => console.warn(`Warning: ${warning}`));
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
