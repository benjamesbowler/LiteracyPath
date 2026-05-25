import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  INITIAL_SOUND_LETTERS,
  INITIAL_SOUND_ROUND_LENGTH,
  initialSoundCoreWords,
  initialSoundPrioritySubstitutions,
  initialSoundRawWordBank,
  initialSoundRequestedCoreWords,
  initialSoundWordBank,
  normalizeInitialSoundWord
} from "../src/content/initialSounds/initialSoundWordBank.js";
import { getInitialSoundCoverage } from "../src/content/initialSounds/initialSoundCoverage.js";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRound,
  getInitialSoundRoundPlan
} from "../src/content/initialSounds/initialSoundSelector.js";
import { hasImportedInitialSoundMedia } from "../src/content/initialSounds/initialSoundMediaManifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const failures = [];
const warnings = [];

const assetExists = url => fs.existsSync(path.join(rootDir, "public", String(url || "").replace(/^\//, "")));
const coverage = getInitialSoundCoverage({ assetExists });
const targetWords = initialSoundWordBank.map(item => normalizeInitialSoundWord(item.targetWord));
const duplicateWords = targetWords.filter((word, index) => targetWords.indexOf(word) !== index);

if (initialSoundWordBank.length < 500) failures.push(`Expected at least 500 items, found ${initialSoundWordBank.length}.`);
if (initialSoundWordBank.some(item => item.letter === "x")) failures.push("Initial Sounds bank contains letter x.");
if (duplicateWords.length) failures.push(`Duplicate target words found: ${[...new Set(duplicateWords)].join(", ")}.`);

coverage.rows.forEach(row => {
  if (row.level1 < 10) failures.push(`${row.letter}: fewer than 10 Level 1 words.`);
  if (row.level2 < 10) failures.push(`${row.letter}: fewer than 10 Level 2 words.`);
  if (row.missingImageCount) warnings.push(`${row.letter}: ${row.missingImageCount} missing image files.`);
  if (row.missingAudioCount) warnings.push(`${row.letter}: ${row.missingAudioCount} missing audio files.`);
});

const roundOne = getInitialSoundRound({
  studentProgress: {},
  level: 1,
  roundNumber: 1,
  seed: 101
});

const roundOneHistory = roundOne.map(item => ({
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
}));

const roundTwo = getInitialSoundRound({
  studentProgress: {
    initialSoundsProgress: buildInitialSoundsProgressFromAnswerHistory(roundOneHistory)
  },
  level: 1,
  roundNumber: 2,
  seed: 202
});
const levelOneRoundPlan = getInitialSoundRoundPlan({ studentProgress: {}, level: 1, roundNumber: null, seed: 303 });
const levelTwoRoundPlan = getInitialSoundRoundPlan({ studentProgress: {}, level: 2, roundNumber: null, seed: 404 });

if (roundOne.length !== INITIAL_SOUND_ROUND_LENGTH) failures.push(`Round 1 length is ${roundOne.length}, expected ${INITIAL_SOUND_ROUND_LENGTH}.`);
if (roundTwo.length !== INITIAL_SOUND_ROUND_LENGTH) failures.push(`Round 2 length is ${roundTwo.length}, expected ${INITIAL_SOUND_ROUND_LENGTH}.`);

for (const [name, round] of [["Round 1", roundOne], ["Round 2", roundTwo]]) {
  const words = round.map(item => item.targetWord);
  const letters = round.map(item => item.letter);
  const duplicateRoundWords = words.filter((word, index) => words.indexOf(word) !== index);
  const duplicateRoundLetters = letters.filter((letter, index) => letters.indexOf(letter) !== index);
  if (duplicateRoundWords.length) failures.push(`${name} repeats target words: ${[...new Set(duplicateRoundWords)].join(", ")}.`);
  if (duplicateRoundLetters.length) warnings.push(`${name} repeats letters: ${[...new Set(duplicateRoundLetters)].join(", ")}.`);
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const mediaRequestSections = INITIAL_SOUND_LETTERS.map(letter => {
  const levelOne = initialSoundRawWordBank[1][letter];
  const levelTwo = initialSoundRawWordBank[2][letter];
  const levelRows = (level, words) => words
    .map(word => {
      const key = normalizeInitialSoundWord(word);
      return `| ${word} | /media/initial-sounds/images/${letter}/${key}.webp | /media/initial-sounds/audio/${letter}/${key}.mp3 |`;
    })
    .join("\n");

  return `## Letter ${letter.toUpperCase()}

### Level 1

| Word | Image filename | Audio filename |
|---|---|---|
${levelRows(1, levelOne)}

### Level 2

| Word | Image filename | Audio filename |
|---|---|---|
${levelRows(2, levelTwo)}`;
}).join("\n\n");

write(
  path.join(rootDir, "docs", "assets", "kimi_initial_sounds_media_request.md"),
  `# Kimi Initial Sounds Media Request

Date: 2026-05-24

## Goal

Generate the complete media pack for LiteracyPath Initial Sounds Level 1 and Level 2.

- Letters: ${INITIAL_SOUND_LETTERS.join(" ")}
- Excluded letter: X
- Level 1 words: ${coverage.level1Items}
- Level 2 words: ${coverage.level2Items}
- Total requested word/image/audio pairs: ${initialSoundWordBank.length}

## Folder Structure

Images:
\`public/media/initial-sounds/images/{letter}/{word}.webp\`

Audio:
\`public/media/initial-sounds/audio/{letter}/{word}.mp3\`

## Image Requirements

- One centered object or scene representing the target word.
- White or very clean background.
- Bright, colorful educational style.
- Cute cartoon educational images are acceptable, but ordinary objects must use natural/realistic colors.
- Rainbow-colored ordinary objects are forbidden unless the target word is literally \`rainbow\`.
- Examples: apple should be red or green, zebra should be black and white, cat should use natural cat colors, and nut must be a walnut/peanut/hazelnut-style nut rather than an acorn.
- No embedded text, labels, captions, or watermarks.
- No multiple objects unless essential to the word.
- Consistent visual style across the full pack.
- Kindergarten-safe visuals.
- Use portrait/thumbnail-friendly composition.

## Audio Requirements

- American English.
- Clear natural human pronunciation.
- Spoken word only.
- No music.
- No sound effects.
- Normalized volume.
- Short silence before and after the word.
- Do not spell the word letter by letter.

${mediaRequestSections}
`
);

const coverageRows = coverage.rows.map(row =>
  {
    const level1Complete = initialSoundWordBank.filter(item => item.letter === row.letter && item.level === 1 && hasImportedInitialSoundMedia(item)).length;
    const level2Complete = initialSoundWordBank.filter(item => item.letter === row.letter && item.level === 2 && hasImportedInitialSoundMedia(item)).length;
    return `| ${row.letter} | ${row.level1} | ${row.level2} | ${level1Complete} | ${level2Complete} | ${level1Complete ? "yes" : "no"} | ${level2Complete ? "yes" : "no"} | ${row.missingImageCount} | ${row.missingAudioCount} | ${row.inactiveCount} | ${row.warnings.join("; ") || "none"} |`;
  }
).join("\n");
const priorityRows = INITIAL_SOUND_LETTERS.flatMap(letter => [1, 2].map(level => {
  const requested = initialSoundRequestedCoreWords[level]?.[letter] || "";
  const selected = initialSoundCoreWords[level]?.[letter] || "";
  const selectedItem = initialSoundWordBank.find(item =>
    item.letter === letter &&
    item.level === level &&
    normalizeInitialSoundWord(item.targetWord) === normalizeInitialSoundWord(selected)
  );
  return `| ${level} | ${letter} | ${requested} | ${selected} | ${selectedItem?.progressionBand || ""} | ${selectedItem?.roundPriority || ""} | ${selectedItem?.active === false ? "blocked" : "active"} |`;
})).join("\n");
const substitutionRows = initialSoundPrioritySubstitutions
  .map(item => `| ${item.level} | ${item.letter} | ${item.requested} | ${item.selected} |`)
  .join("\n");

write(
  path.join(rootDir, "docs", "validation", "initial_sounds_level_architecture_audit.md"),
  `# Initial Sounds Level 1/2 Architecture Audit

Date: 2026-05-24

## Summary

- Total items: ${initialSoundWordBank.length}
- Letters: ${INITIAL_SOUND_LETTERS.length}
- Letter X present: ${initialSoundWordBank.some(item => item.letter === "x") ? "yes" : "no"}
- Duplicate target words: ${duplicateWords.length}
- Round length: ${INITIAL_SOUND_ROUND_LENGTH}
- Round 1 sample letters: ${roundOne.map(item => item.letter).join(", ")}
- Round 1 sample words: ${roundOne.map(item => item.targetWord).join(", ")}
- Round 2 sample letters: ${roundTwo.map(item => item.letter).join(", ")}
- Round 2 sample words: ${roundTwo.map(item => item.targetWord).join(", ")}
- Level 1 available media-complete letters: ${levelOneRoundPlan.meta.availableLetters.join(", ")}
- Level 1 blocked letters: ${levelOneRoundPlan.meta.blockedLetters.join(", ") || "none"}
- Level 2 available media-complete letters: ${levelTwoRoundPlan.meta.availableLetters.join(", ")}
- Level 2 blocked letters: ${levelTwoRoundPlan.meta.blockedLetters.join(", ") || "none"}
- Missing image files: ${coverage.missingImages}
- Missing audio files: ${coverage.missingAudio}

## Coverage Table

| Letter | Level 1 Items | Level 2 Items | Level 1 Complete | Level 2 Complete | Round 1/2 Eligible | Round 3/4 Eligible | Missing Images | Missing Audio | Inactive | Warnings |
|---|---:|---:|---:|---:|---|---|---:|---:|---:|---|
${coverageRows}

## Initial Sounds Priority Metadata

| Level | Letter | Requested Core Word | Active Core Word | Progression Band | Round Priority | Status |
|---:|---|---|---|---|---:|---|
${priorityRows}

## Core Word Substitutions

| Level | Letter | Requested | Selected |
|---:|---|---|---|
${substitutionRows || "| - | - | none | none |"}

${warnings.length ? `## Warnings\n\n${warnings.map(warning => `- ${warning}`).join("\n")}\n` : ""}
${failures.length ? `## Failures\n\n${failures.map(failure => `- ${failure}`).join("\n")}\n` : "## Status\n\nPASS\n"}
`
);

console.log(`Initial Sounds items: ${initialSoundWordBank.length}`);
console.log(`Letters: ${INITIAL_SOUND_LETTERS.length}`);
console.log(`Missing images: ${coverage.missingImages}`);
console.log(`Missing audio: ${coverage.missingAudio}`);
console.log(`Warnings: ${warnings.length}`);

if (failures.length) {
  console.error(`Failures: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Initial Sounds architecture audit passed.");
