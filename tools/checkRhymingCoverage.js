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
  return String(question.itemKey || question.rimeFamily || question.rhymeGroup || question.rime || question.coverageTarget || "").toLowerCase();
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

function cardValue(card = {}) {
  return String(card.value || card.word || card.label || "").toLowerCase().trim();
}

function correctAnswersForQuestion(question = {}) {
  return Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0
    ? question.correctAnswers.map(answer => String(answer).toLowerCase().trim()).filter(Boolean)
    : [question.correctAnswer || question.answer].map(answer => String(answer || "").toLowerCase().trim()).filter(Boolean);
}

function targetImageForQuestion(question = {}) {
  return question.imagePath || question.imageUrl || question.targetImage || question.targetImagePath || question.targetImageUrl || "";
}

function buildCoverageForcedRound(items, alreadyCoveredFamilies, length = 15) {
  const selected = [];
  const selectedFamilies = new Set();
  const selectedTargets = new Set();
  const missingFamilies = rhymingExpectedItemKeys.filter(family => !alreadyCoveredFamilies.has(family));

  for (const family of missingFamilies) {
    const candidate = items.find(item =>
      familyForQuestion(item) === family &&
      !selectedTargets.has(String(item.targetWord || "").toLowerCase())
    );
    if (candidate) {
      selected.push(candidate);
      selectedFamilies.add(family);
      selectedTargets.add(String(candidate.targetWord || "").toLowerCase());
    }
  }

  for (const item of items) {
    if (selected.length >= length) break;
    if (selected.includes(item)) continue;
    const family = familyForQuestion(item);
    const target = String(item.targetWord || "").toLowerCase();
    if (target && selectedTargets.has(target)) continue;
    if (selectedFamilies.has(family) && selected.length < length - 3) continue;
    selected.push(item);
    selectedFamilies.add(family);
    if (target) selectedTargets.add(target);
  }

  for (const item of items) {
    if (selected.length >= length) break;
    if (!selected.includes(item)) selected.push(item);
  }

  return selected;
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

runtimeItems.forEach(question => {
  const cards = question.imageCards || [];
  const cardValues = cards.map(cardValue).filter(Boolean);
  const uniqueValues = new Set(cardValues);
  const correctAnswers = correctAnswersForQuestion(question);
  const targetImage = targetImageForQuestion(question);
  const format = String(question.formatType || question.templateType || "").toUpperCase();

  if (format !== "RHYMING_PICTURE") failures.push(`${question.id}: live rhyming question is not RHYMING_PICTURE.`);
  if (cards.length !== 4) failures.push(`${question.id}: live rhyming question has ${cards.length} answer cards, expected exactly 4.`);
  if (!targetImage || !publicPathExists(targetImage)) failures.push(`${question.id}: missing target image ${targetImage || "none"}.`);
  if (!cards.every(card => card.image && publicPathExists(card.image))) failures.push(`${question.id}: one or more answer cards have missing images.`);
  if (uniqueValues.size !== cardValues.length) failures.push(`${question.id}: duplicate answer options in ${cardValues.join(", ")}.`);
  if (![1, 2].includes(correctAnswers.length)) failures.push(`${question.id}: expected one or two correct answers, found ${correctAnswers.length}.`);
  if (!correctAnswers.every(answer => uniqueValues.has(answer))) failures.push(`${question.id}: correct answer(s) missing from answer cards.`);
  if (correctAnswers.length === 1) {
    const family = familyForQuestion(question);
    const accidentalRhymes = cardValues.filter(value => value !== correctAnswers[0] && (rhymeGroups[family] || []).includes(value));
    if (accidentalRhymes.length) failures.push(`${question.id}: single-answer item has accidental extra rhyming answer(s): ${accidentalRhymes.join(", ")}.`);
  }
  if (correctAnswers.length === 2 && !/which two words/i.test(question.prompt || question.question || "")) {
    failures.push(`${question.id}: two-answer item prompt does not ask for two words.`);
  }
});

const missingFourScenario = new Set(rhymingExpectedItemKeys.filter(family => !["ag", "ad", "eg", "ip"].includes(family)));
const forcedRound = buildCoverageForcedRound(levelOneItems, missingFourScenario, 15);
const forcedFamilies = new Set(forcedRound.map(familyForQuestion));
["ag", "ad", "eg", "ip"].forEach(family => {
  if (!forcedFamilies.has(family)) failures.push(`Selector simulation omitted uncovered required family -${family}.`);
});
const simulatedCoveredAfterCorrect = new Set([...missingFourScenario, ...forcedRound.map(familyForQuestion).filter(family => levelOneFamilies.has(family))]);
if (simulatedCoveredAfterCorrect.size !== rhymingExpectedItemKeys.length) {
  failures.push(`Checkpoint simulation reached ${simulatedCoveredAfterCorrect.size}/${rhymingExpectedItemKeys.length}, expected 21/21.`);
}

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
- Simulated missing ag/ad/eg/ip round families: ${Array.from(forcedFamilies).join(", ")}
- Simulated checkpoint coverage after correct answers: ${simulatedCoveredAfterCorrect.size}/${rhymingExpectedItemKeys.length}
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
