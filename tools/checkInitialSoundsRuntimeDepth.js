import path from "node:path";

import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "../src/content/initialSounds/initialSoundSelector.js";
import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundWordBank
} from "../src/content/initialSounds/initialSoundWordBank.js";
import {
  hasImportedInitialSoundAudio,
  hasImportedInitialSoundImage
} from "../src/content/initialSounds/initialSoundMediaManifest.js";
import { repoRoot, writeFile } from "./phonicsRuntimeUtils.js";

const failures = [];
const warnings = [];

const selectableItems = initialSoundWordBank.filter(item =>
  item.active !== false &&
  hasImportedInitialSoundImage(item)
);
const imageBacked = selectableItems.length;
const audioBacked = selectableItems.filter(hasImportedInitialSoundAudio).length;
const lettersByLevel = level => INITIAL_SOUND_LETTERS.filter(letter =>
  selectableItems.some(item => item.level === level && item.letter === letter)
);

if (imageBacked < 100) failures.push(`Initial Sounds has ${imageBacked} image-backed runtime-selectable items; expected at least 100.`);
for (const level of [1, 2]) {
  const letters = lettersByLevel(level);
  if (letters.length !== INITIAL_SOUND_LETTERS.length) {
    failures.push(`Initial Sounds Level ${level} can reach ${letters.length}/${INITIAL_SOUND_LETTERS.length} letters.`);
  }
}

function duplicates(values) {
  return [...new Set(values.filter((value, index, list) => list.indexOf(value) !== index))];
}

const history = [];
const roundSummaries = [];
for (const [index, level] of [1, 1, 2, 2, 1, 2].entries()) {
  const progress = buildInitialSoundsProgressFromAnswerHistory(history);
  const plan = getInitialSoundRoundPlan({
    studentProgress: { initialSoundsProgress: progress },
    level,
    seed: 1200 + index
  });
  const letters = plan.items.map(item => item.letter);
  const words = plan.items.map(item => item.targetWord);
  const duplicateWords = duplicates(words);
  const duplicateLetters = duplicates(letters);

  if (plan.items.length !== INITIAL_SOUND_ROUND_LENGTH) {
    failures.push(`Simulated round ${index + 1} returned ${plan.items.length}; expected ${INITIAL_SOUND_ROUND_LENGTH}.`);
  }
  if (duplicateWords.length) failures.push(`Simulated round ${index + 1} repeated target words: ${duplicateWords.join(", ")}.`);
  if (duplicateLetters.length && index < 4) {
    failures.push(`Simulated round ${index + 1} repeated letters during first four progression rounds: ${duplicateLetters.join(", ")}.`);
  }

  roundSummaries.push({
    round: index + 1,
    level,
    phase: plan.meta.phase,
    letters,
    words,
    reasons: plan.meta.selectedReasons
  });

  plan.items.forEach(item => history.push({
    skillId: "initial_sounds",
    stage: "Initial Sounds",
    itemKey: item.letter,
    itemLevel: item.level,
    targetWord: item.targetWord,
    isCorrect: true
  }));
}

const l1Covered = new Set(roundSummaries.slice(0, 2).flatMap(round => round.letters));
const l2Covered = new Set(roundSummaries.slice(2, 4).flatMap(round => round.letters));
const missingL1 = INITIAL_SOUND_LETTERS.filter(letter => !l1Covered.has(letter));
const missingL2 = INITIAL_SOUND_LETTERS.filter(letter => !l2Covered.has(letter));
if (missingL1.length) failures.push(`Level 1 first two rounds missed letters: ${missingL1.join(", ")}.`);
if (missingL2.length) failures.push(`Level 2 first two rounds missed letters: ${missingL2.join(", ")}.`);

const lines = [
  "# Initial Sounds Runtime Depth Check",
  "",
  "Date: 2026-05-25",
  "",
  `- Runtime-selectable image-backed items: ${imageBacked}`,
  `- Runtime-selectable image+audio-backed items: ${audioBacked}`,
  `- Level 1 reachable letters: ${lettersByLevel(1).length}/${INITIAL_SOUND_LETTERS.length}`,
  `- Level 2 reachable letters: ${lettersByLevel(2).length}/${INITIAL_SOUND_LETTERS.length}`,
  `- Failures: ${failures.length}`,
  `- Warnings: ${warnings.length}`,
  "",
  "## Simulated Rounds",
  "",
  ...roundSummaries.flatMap(round => [
    `### Round ${round.round} - Level ${round.level}`,
    "",
    `- Phase: ${round.phase}`,
    `- Letters: ${round.letters.join(", ")}`,
    `- Words: ${round.words.join(", ")}`,
    ""
  ]),
  "## Failures",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none",
  ""
];

writeFile(path.join(repoRoot, "docs/validation/initial_sounds_runtime_depth_check.md"), lines.join("\n"));

console.log(`Initial Sounds runtime-selectable image-backed items: ${imageBacked}`);
console.log(`Initial Sounds image+audio-backed items: ${audioBacked}`);
for (const round of roundSummaries) {
  console.log(`Round ${round.round} L${round.level}: ${round.words.join(", ")}`);
}
console.log("Wrote docs/validation/initial_sounds_runtime_depth_check.md");

if (failures.length) {
  console.error(`Initial Sounds runtime depth failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Initial Sounds runtime depth check passed.");
