import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "../src/content/initialSounds/initialSoundSelector.js";
import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundWordBank
} from "../src/content/initialSounds/initialSoundWordBank.js";
import { hasImportedInitialSoundMedia } from "../src/content/initialSounds/initialSoundMediaManifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const failures = [];
const warnings = [];
const simulatedHistory = [];

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function completeLetters(level) {
  return INITIAL_SOUND_LETTERS.filter(letter =>
    initialSoundWordBank.some(item => item.letter === letter && item.level === level && hasImportedInitialSoundMedia(item))
  );
}

function completeCount(letter, level) {
  return initialSoundWordBank.filter(item => item.letter === letter && item.level === level && hasImportedInitialSoundMedia(item)).length;
}

function duplicateValues(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function simulateRound({ label, level, expectedNewLetters = [] }) {
  const progress = buildInitialSoundsProgressFromAnswerHistory(simulatedHistory);
  const plan = getInitialSoundRoundPlan({
    studentProgress: { initialSoundsProgress: progress },
    level,
    roundNumber: null,
    seed: 9000 + simulatedHistory.length
  });
  const letters = plan.items.map(item => item.letter);
  const words = plan.items.map(item => item.targetWord.toLowerCase());
  const duplicateLetters = duplicateValues(letters);
  const duplicateWords = duplicateValues(words);
  const missingExpected = expectedNewLetters.filter(letter => !letters.includes(letter));

  if (plan.items.length !== INITIAL_SOUND_ROUND_LENGTH) {
    failures.push(`${label}: selected ${plan.items.length}, expected ${INITIAL_SOUND_ROUND_LENGTH}.`);
  }
  if (letters.includes("x")) failures.push(`${label}: selected excluded letter x.`);
  if (duplicateLetters.length) failures.push(`${label}: repeated letters ${duplicateLetters.join(", ")}.`);
  if (duplicateWords.length) failures.push(`${label}: repeated target words ${duplicateWords.join(", ")}.`);
  if (missingExpected.length) failures.push(`${label}: missing expected media-complete letters ${missingExpected.join(", ")}.`);

  plan.items.forEach(item => {
    simulatedHistory.push({
      skillId: "initial_sounds",
      stage: "Initial Sounds",
      skill: "Initial Sounds",
      questionId: item.id,
      itemKey: item.letter,
      itemType: "initial_sound",
      itemLevel: item.level,
      targetWord: item.targetWord,
      diagnosticTarget: item.targetWord,
      isCorrect: true
    });
  });

  return {
    label,
    level,
    phase: plan.meta.phase,
    selectedLetters: letters,
    selectedTargetWords: words,
    reviewLetters: plan.meta.reviewLetters,
    blockedLetters: plan.meta.blockedLetters,
    missingExpected,
    selectedReasons: plan.meta.selectedReasons
  };
}

const level1Available = completeLetters(1);
const level2Available = completeLetters(2);
const level1Blocked = INITIAL_SOUND_LETTERS.filter(letter => !level1Available.includes(letter));
const level2Blocked = INITIAL_SOUND_LETTERS.filter(letter => !level2Available.includes(letter));

if (level1Blocked.length) warnings.push(`Level 1 blocked letters due to missing complete media: ${level1Blocked.join(", ")}.`);
if (level2Blocked.length) warnings.push(`Level 2 blocked letters due to missing complete media: ${level2Blocked.join(", ")}.`);

const round1L1 = simulateRound({
  label: "Round 1 Level 1",
  level: 1,
  expectedNewLetters: level1Available.slice(0, 15)
});
const remainingL1 = level1Available.filter(letter => !round1L1.selectedLetters.includes(letter));
const round2L1 = simulateRound({
  label: "Continue Round 2 Level 1",
  level: 1,
  expectedNewLetters: remainingL1
});

const coveredL1 = new Set([...round1L1.selectedLetters, ...round2L1.selectedLetters]);
const missingAfterTwoL1 = level1Available.filter(letter => !coveredL1.has(letter));
if (missingAfterTwoL1.length) failures.push(`Level 1 first two rounds did not cover available letters: ${missingAfterTwoL1.join(", ")}.`);

const round1L2 = simulateRound({
  label: "Round 3 Level 2",
  level: 2,
  expectedNewLetters: level2Available.slice(0, 15)
});
const remainingL2 = level2Available.filter(letter => !round1L2.selectedLetters.includes(letter));
const round2L2 = simulateRound({
  label: "Continue Round 4 Level 2",
  level: 2,
  expectedNewLetters: remainingL2
});

const coveredL2 = new Set([...round1L2.selectedLetters, ...round2L2.selectedLetters]);
const missingAfterTwoL2 = level2Available.filter(letter => !coveredL2.has(letter));
if (missingAfterTwoL2.length) failures.push(`Level 2 first two rounds did not cover available letters: ${missingAfterTwoL2.join(", ")}.`);

function roundSummary(round) {
  return `## ${round.label}\n\n- Level: ${round.level}\n- Phase: ${round.phase}\n- Letters: ${round.selectedLetters.join(", ")}\n- Target words: ${round.selectedTargetWords.join(", ")}\n- Review letters: ${round.reviewLetters.join(", ") || "none"}\n- Blocked letters: ${round.blockedLetters.join(", ") || "none"}\n- Missing expected available letters: ${round.missingExpected.join(", ") || "none"}`;
}

const coverageRows = INITIAL_SOUND_LETTERS.map(letter =>
  `| ${letter} | ${completeCount(letter, 1)} | ${completeCount(letter, 2)} | ${level1Blocked.includes(letter) ? "blocked" : "available"} | ${level2Blocked.includes(letter) ? "blocked" : "available"} |`
).join("\n");

write(
  path.join(rootDir, "docs", "validation", "initial_sound_progression_audit.md"),
  `# Initial Sound Progression Audit\n\nDate: 2026-05-25\n\n## Summary\n\n- Level 1 media-complete letters: ${level1Available.length}/${INITIAL_SOUND_LETTERS.length}\n- Level 2 media-complete letters: ${level2Available.length}/${INITIAL_SOUND_LETTERS.length}\n- Failures: ${failures.length}\n- Warnings: ${warnings.length}\n\n## Per-Letter Complete Media Coverage\n\n| Letter | Level 1 Complete Items | Level 2 Complete Items | Level 1 Status | Level 2 Status |\n|---|---:|---:|---|---|\n${coverageRows}\n\n${[round1L1, round2L1, round1L2, round2L2].map(roundSummary).join("\n\n")}\n\n## Warnings\n\n${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}\n\n## Failures\n\n${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}\n`
);

console.log(`Level 1 available letters: ${level1Available.length}/${INITIAL_SOUND_LETTERS.length}`);
console.log(`Level 2 available letters: ${level2Available.length}/${INITIAL_SOUND_LETTERS.length}`);
console.log(`Round 1 Level 1: ${round1L1.selectedLetters.join(", ")}`);
console.log(`Round 2 Level 1: ${round2L1.selectedLetters.join(", ")}`);
console.log(`Round 3 Level 2: ${round1L2.selectedLetters.join(", ")}`);
console.log(`Round 4 Level 2: ${round2L2.selectedLetters.join(", ")}`);
console.log(`Warnings: ${warnings.length}`);

if (failures.length) {
  console.error(`Initial Sound progression failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Initial Sound progression check passed for all media-complete letters.");
