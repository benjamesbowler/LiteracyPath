// Item-universe generator for the student report's real denominators.
//
// Loads the SAME runtime-eligible question pools the app serves (via
// loadAssessmentSkillBank / loadHfwAssessmentBank — the loader pattern from
// tools/auditCheckpointIntegrity.js), plus the EL letter list and the EL
// advanced phonics pattern list, and runs every question through the SAME
// item-key inference the app applies to live answers
// (extractMasteryFromAssessmentAttempt in src/data/assessmentHistoryStore.js).
//
// Emits src/data/generated/itemUniverse.generated.js with the count of
// DISTINCT item keys per itemType. The report chart derives its Level 1 /
// Level 2 sound totals from those counts instead of hardcoded constants
// (FinishedReportPage previously used level1Total=25 and a Level 2
// denominator that grew with mastery, so the bar could never reach 100%).
//
// FAILS (exit 1) if any itemType the report depends on comes back with a
// count of zero — an empty universe means the loader or inference broke.
//
// Run: node tools/generateItemUniverse.js (wired into "prebuild").

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAssessmentSkillGroupMetadata,
  loadAssessmentSkillBank,
  loadHfwAssessmentBank
} from "../src/data/loadAssessmentSkillBank.js";
import { extractMasteryFromAssessmentAttempt } from "../src/data/assessmentHistoryStore.js";
import { EL_FORMAL_LETTERS } from "../src/data/elFormalAssessmentReportBuilder.js";
import { advancedPhonicsPatterns } from "../src/data/advancedPhonicsPatterns.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "src", "data", "generated", "itemUniverse.generated.js");

// The report's sounds chart reads exactly these types; a zero count for any
// of them would silently break its denominators, so they are hard-required.
const REQUIRED_ITEM_TYPES = [
  "initial_sound",
  "rhyming_family",
  "short_vowel",
  "final_sound",
  "letter_sound",
  "phonics_pattern",
  "letter_name"
];

const keysByType = new Map();

function addRow(itemType, itemKey) {
  if (!itemType || !itemKey) return;
  const bucket = keysByType.get(itemType) || new Set();
  bucket.add(itemKey);
  keysByType.set(itemType, bucket);
}

// Mirror buildAssessmentAttemptRecord's live-round field mapping so the bank
// question flows through the identical inference a real answer would.
function toQuestionRecord(question = {}, skillId = "") {
  return {
    questionId: question.id || question.questionId || "",
    prompt: question.prompt || question.question || "",
    targetWord: question.targetWord || "",
    targetLetter: question.targetLetter || question.letter || "",
    targetSound: question.targetSound || "",
    targetPattern: question.targetPattern || "",
    itemKey: question.itemKey || "",
    itemType: question.itemType || "",
    correctAnswer: question.answer ?? question.correctAnswer ?? "",
    isCorrect: true,
    skillId,
    templateType: question.templateType || question.formatType || "",
    level: question.level || question.assessmentLevel || 1
  };
}

function collectFromAttempt(skillId, skillName, questionRecords) {
  if (!questionRecords.length) return;
  const mastery = extractMasteryFromAssessmentAttempt({
    skillId,
    skillName,
    questionRecords
  });
  mastery.rows.forEach(row => addRow(row.itemType, row.itemKey));
}

// ── 1. Checkpoint question banks (same loaders as the running app) ─────────
const groups = getAssessmentSkillGroupMetadata();
for (const group of groups) {
  for (const skillId of group.skillIds) {
    const questions = group.id === "hfw"
      ? await loadHfwAssessmentBank(skillId)
      : await loadAssessmentSkillBank(skillId);
    collectFromAttempt(
      skillId,
      skillId,
      questions.map(question => toQuestionRecord(question, skillId))
    );
    console.log(`${skillId}: ${questions.length} runtime-eligible questions scanned`);
  }
}

// ── 2. EL letter assessment (letter_name + letter_sound, one per letter) ───
collectFromAttempt(
  "el_letter_assessment",
  "EL Letter Assessment",
  EL_FORMAL_LETTERS.flatMap(letter => [
    { targetLetter: letter, templateType: "letter_name", isCorrect: true },
    { targetLetter: letter, templateType: "letter_sound", isCorrect: true }
  ])
);

// ── 3. EL advanced phonics patterns (the list the app assesses with) ───────
collectFromAttempt(
  "advanced_phonics_patterns",
  "Advanced Phonics Patterns",
  advancedPhonicsPatterns.map(item => ({ targetPattern: item.pattern, isCorrect: true }))
);

// ── Emit (deterministic: sorted keys, no timestamp, so git stays quiet) ─────
const counts = {};
Array.from(keysByType.keys()).sort().forEach(itemType => {
  counts[itemType] = keysByType.get(itemType).size;
});

const missing = REQUIRED_ITEM_TYPES.filter(itemType => !(counts[itemType] > 0));
if (missing.length) {
  console.error(`FAIL: zero distinct item keys for required itemType(s): ${missing.join(", ")}`);
  process.exit(1);
}

const body = Object.entries(counts)
  .map(([itemType, count]) => `  ${itemType}: ${count}`)
  .join(",\n");
const fileContents = `// Generated by tools/generateItemUniverse.js. Do not edit by hand.
//
// Distinct assessable item keys per itemType, derived from the same runtime
// question banks the app serves (loadAssessmentSkillBank /
// loadHfwAssessmentBank) plus the EL letter list and the EL advanced phonics
// pattern list, using the same item-key inference applied to live answers.
// The student report derives its Level 1 / Level 2 sounds-chart denominators
// from these counts. Regenerate with: node tools/generateItemUniverse.js
export const itemUniverseCounts = {
${body}
};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents);

console.log(`\nDistinct item keys per itemType: ${JSON.stringify(counts)}`);
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
