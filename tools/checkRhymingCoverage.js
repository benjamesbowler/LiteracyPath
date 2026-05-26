import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import { rhymeGroups } from "../src/data/rhymeGroups.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import {
  getQuestionImagePaths,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "docs", "validation", "rhyming_coverage_audit.md");

const levelOneFamilies = new Set(rhymingExpectedItemKeys);
const levelTwoFamilies = new Set(rhymingLevelTwoExpectedItemKeys);
const failures = [];
const warnings = [];

function publicPathExists(assetPath = "") {
  if (!assetPath || !String(assetPath).startsWith("/")) return false;
  return fs.existsSync(path.join(rootDir, "public", String(assetPath).replace(/^\//, "")));
}

function familyForQuestion(question = {}) {
  return String(question.itemKey || question.rhymeGroup || question.rime || question.coverageTarget || "").toLowerCase();
}

function questionHasRuntimeImage(question = {}) {
  return getQuestionImagePaths(question).some(publicPathExists);
}

function wordHasImage(word) {
  const asset = getChildWordAsset(word);
  return Boolean(
    (asset?.image && publicPathExists(asset.image)) ||
    (asset?.fallbackImage && publicPathExists(asset.fallbackImage))
  );
}

function imageBackedWords(family) {
  return (rhymeGroups[family] || []).filter(wordHasImage);
}

function formatLooksInitial(question = {}) {
  return /first|initial|start/.test(String([
    question.templateType,
    question.formatType,
    question.questionType,
    question.prompt,
    question.question
  ].filter(Boolean).join(" ")).toLowerCase());
}

function makeRounds(items, count = 50) {
  return Array.from({ length: count }, (_, index) => sampleRound(
    items.slice(index).concat(items.slice(0, index)),
    15
  ));
}

const runtimeItems = selectableRuntimeQuestionsForSkill("rhyming");
const missingImageItems = runtimeItems.filter(item => !questionHasRuntimeImage(item));
const initialTemplateItems = runtimeItems.filter(formatLooksInitial);
const levelOneItems = runtimeItems.filter(item => {
  const family = familyForQuestion(item);
  return levelOneFamilies.has(family) || (!levelTwoFamilies.has(family) && Number(item.level || 1) <= 1);
});
const levelTwoItems = runtimeItems.filter(item => {
  const family = familyForQuestion(item);
  return levelTwoFamilies.has(family) || Number(item.level || 1) >= 2;
});

if (missingImageItems.length) {
  failures.push(`${missingImageItems.length} runtime-selectable rhyming questions are missing a real image.`);
}
if (initialTemplateItems.length) {
  failures.push(`${initialTemplateItems.length} rhyming questions look like Initial Sounds templates.`);
}

const levelOneWithLevelTwoFamilies = levelOneItems.filter(item => levelTwoFamilies.has(familyForQuestion(item)));
if (levelOneWithLevelTwoFamilies.length) {
  failures.push(`Level 1 rhyming contains Level 2 families: ${levelOneWithLevelTwoFamilies.map(item => `${item.id}:${familyForQuestion(item)}`).join(", ")}`);
}

const levelOneRows = rhymingExpectedItemKeys.map(family => {
  const count = runtimeItems.filter(item => familyForQuestion(item) === family).length;
  const imageWords = imageBackedWords(family);
  if (imageWords.length >= 4 && count < 5) {
    failures.push(`Level 1 family -${family} has ${count} usable questions; expected at least 5 because ${imageWords.length} image-backed words exist.`);
  } else if (imageWords.length < 4) {
    warnings.push(`Level 1 family -${family} has only ${imageWords.length} image-backed source words, so 5 distinct questions may not be possible yet.`);
  }
  return { family, count, imageWords };
});

const levelTwoRows = rhymingLevelTwoExpectedItemKeys.map(family => {
  const count = runtimeItems.filter(item => familyForQuestion(item) === family).length;
  const imageWords = imageBackedWords(family);
  if (imageWords.length >= 3 && count < 3) {
    failures.push(`Level 2 family -${family} has ${count} usable questions; expected at least 3 because ${imageWords.length} image-backed words exist.`);
  } else if (imageWords.length < 3) {
    warnings.push(`Level 2 family -${family} has only ${imageWords.length} image-backed source words, so 3 distinct questions may not be possible yet.`);
  }
  return { family, count, imageWords };
});

makeRounds(levelOneItems).forEach((round, index) => {
  if (levelOneItems.length >= 15 && round.length !== 15) {
    failures.push(`Level 1 simulated rhyming round ${index + 1} returned ${round.length}/15.`);
  }
  round.forEach(item => {
    if (!questionHasRuntimeImage(item)) failures.push(`Level 1 round ${index + 1} selected image-missing item ${item.id}.`);
    if (levelTwoFamilies.has(familyForQuestion(item))) failures.push(`Level 1 round ${index + 1} selected Level 2 family -${familyForQuestion(item)} from ${item.id}.`);
    if (formatLooksInitial(item)) failures.push(`Level 1 round ${index + 1} selected Initial Sounds-like item ${item.id}.`);
  });
});

makeRounds(levelTwoItems).forEach((round, index) => {
  if (levelTwoItems.length >= 15 && round.length !== 15) {
    failures.push(`Level 2 simulated rhyming round ${index + 1} returned ${round.length}/15.`);
  }
  round.forEach(item => {
    if (!questionHasRuntimeImage(item)) failures.push(`Level 2 round ${index + 1} selected image-missing item ${item.id}.`);
    if (formatLooksInitial(item)) failures.push(`Level 2 round ${index + 1} selected Initial Sounds-like item ${item.id}.`);
  });
});

writeFile(reportPath, `# Rhyming Coverage Audit

Generated: ${new Date().toISOString()}

## Summary

- Runtime-selectable rhyming questions: ${runtimeItems.length}
- Level 1 runtime questions: ${levelOneItems.length}
- Level 2 runtime questions: ${levelTwoItems.length}
- Runtime rhyming questions missing images: ${missingImageItems.length}
- Initial Sounds template contamination: ${initialTemplateItems.length}
- Fatal failures: ${failures.length}
- Warnings: ${warnings.length}

## Level 1 Families

| Family | Usable Questions | Image-Backed Source Words |
| --- | ---: | --- |
${levelOneRows.map(row => `| -${row.family} | ${row.count} | ${row.imageWords.join(", ") || "none"} |`).join("\n")}

## Level 2 Families

| Family | Usable Questions | Image-Backed Source Words |
| --- | ---: | --- |
${levelTwoRows.map(row => `| -${row.family} | ${row.count} | ${row.imageWords.join(", ") || "none"} |`).join("\n")}

## Missing Image Runtime Items

${missingImageItems.length ? missingImageItems.map(item => `- ${item.id}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}

## Warnings

${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}
`);

console.log(`Rhyming runtime questions: ${runtimeItems.length}`);
console.log(`Level 1 families: ${levelOneRows.map(row => `${row.family}:${row.count}`).join(", ")}`);
console.log(`Level 2 families: ${levelTwoRows.map(row => `${row.family}:${row.count}`).join(", ")}`);
console.log(`Missing rhyming images: ${missingImageItems.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.slice(0, 50).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("Rhyming coverage check passed.");
