#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hfwLevel2Questions } from "../src/data/generated/hfwLevel2Questions.generated.js";
import { loadCoreQuestionPool } from "./phonicsRuntimeUtils.js";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const reportPath = path.join(repoRoot, "docs", "validation", "hfw_level_2_import_audit.md");

const EXPECTED_COUNTS = {
  high_frequency_words_1_25: 35,
  high_frequency_words_26_50: 35,
  high_frequency_words_51_100: 60
};

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function getBandId(question = {}) {
  const text = normalize([question.skillId, question.skillName, question.skill].filter(Boolean).join(" "));
  if (text.includes("high_frequency_words_1_25") || text.includes("high-frequency words 1-25")) return "high_frequency_words_1_25";
  if (text.includes("high_frequency_words_26_50") || text.includes("high-frequency words 26-50")) return "high_frequency_words_26_50";
  if (text.includes("high_frequency_words_51_100") || text.includes("high-frequency words 51-100")) return "high_frequency_words_51_100";
  return "";
}

function questionWord(question = {}) {
  return normalize(question.targetWord || question.correctAnswer || question.answer || "");
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const failures = [];
const warnings = [];
const ids = new Set();
const appAllowedWords = {
  high_frequency_words_1_25: new Set(),
  high_frequency_words_26_50: new Set(),
  high_frequency_words_51_100: new Set()
};

for (const question of loadCoreQuestionPool()) {
  if (question.source === "hfw_level_2_fixed_import") continue;
  const bandId = getBandId(question);
  if (!bandId) continue;
  const word = questionWord(question);
  if (/^[a-z]+$/.test(word)) appAllowedWords[bandId].add(word);
}

for (const [index, question] of hfwLevel2Questions.entries()) {
  if (ids.has(question.id)) failures.push(`Duplicate ID: ${question.id}`);
  ids.add(question.id);

  if (question.level !== 2) failures.push(`${question.id}: level is ${question.level}, expected 2`);
  if (!Array.isArray(question.answerOptions) || question.answerOptions.length !== 4) {
    failures.push(`${question.id}: expected exactly four answerOptions`);
  }

  const correctMatches = (question.answerOptions || []).filter(option => option === question.correctAnswer).length;
  if (correctMatches !== 1) failures.push(`${question.id}: correctAnswer appears ${correctMatches} times in answerOptions`);
  if (question.targetWord !== question.correctAnswer) {
    failures.push(`${question.id}: targetWord "${question.targetWord}" does not exactly match correctAnswer "${question.correctAnswer}"`);
  }
  if (String(question.sentence || "").includes("***")) failures.push(`${question.id}: sentence still contains ***`);
  if (!String(question.sentence || "").includes("___")) failures.push(`${question.id}: sentence does not contain ___`);

  const bandId = getBandId(question);
  if (!EXPECTED_COUNTS[bandId]) failures.push(`${question.id}: unexpected skillId ${question.skillId}`);
  const word = questionWord(question);
  if (bandId && !appAllowedWords[bandId]?.has(word)) {
    failures.push(`${question.id}: "${question.targetWord}" is not in the current app ${bandId} target list`);
  }
  if (question.source !== "hfw_level_2_fixed_import") warnings.push(`${question.id}: source marker is missing`);
  if (question.active !== true) failures.push(`${question.id}: active must be true`);
  if (question.itemType !== "sight_word") failures.push(`${question.id}: itemType must be sight_word`);
  if (question.itemKey !== word) failures.push(`${question.id}: itemKey should be normalized target word`);

  if (typeof question.answerOptions?.[0] !== "string") {
    failures.push(`${question.id || `index ${index}`}: answerOptions must stay string labels`);
  }
}

const counts = countBy(hfwLevel2Questions, question => question.skillId);
for (const [skillId, expected] of Object.entries(EXPECTED_COUNTS)) {
  if ((counts[skillId] || 0) !== expected) {
    failures.push(`${skillId}: expected ${expected} questions, found ${counts[skillId] || 0}`);
  }
}

const levelOneInImport = hfwLevel2Questions.filter(question => Number(question.level) === 1);
if (levelOneInImport.length) failures.push(`Imported bank contains ${levelOneInImport.length} Level 1 questions`);

const uniqueWordsByBand = Object.fromEntries(
  Object.keys(EXPECTED_COUNTS).map(skillId => [
    skillId,
    [...new Set(hfwLevel2Questions.filter(question => question.skillId === skillId).map(question => questionWord(question)))].sort()
  ])
);

const report = [
  "# HFW Level 2 Import Audit",
  "",
  "## Summary",
  "",
  `- Imported questions: ${hfwLevel2Questions.length}`,
  `- Expected questions: ${Object.values(EXPECTED_COUNTS).reduce((sum, count) => sum + count, 0)}`,
  `- Validation failures: ${failures.length}`,
  `- Validation warnings: ${warnings.length}`,
  "",
  "## Counts By Band",
  "",
  "| Skill ID | Imported | Expected | Unique words |",
  "|---|---:|---:|---:|",
  ...Object.entries(EXPECTED_COUNTS).map(([skillId, expected]) =>
    `| ${skillId} | ${counts[skillId] || 0} | ${expected} | ${uniqueWordsByBand[skillId].length} |`
  ),
  "",
  "## Allowed Word Check",
  "",
  ...Object.entries(uniqueWordsByBand).map(([skillId, words]) =>
    `- ${skillId}: ${words.join(", ")}`
  ),
  "",
  "## Failures",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "None.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None."
].join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report}\n`);

console.log(`HFW Level 2 imported questions: ${hfwLevel2Questions.length}`);
for (const [skillId, expected] of Object.entries(EXPECTED_COUNTS)) {
  console.log(`${skillId}: ${counts[skillId] || 0}/${expected} questions`);
}
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  console.error("HFW Level 2 validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("HFW Level 2 validation passed.");
