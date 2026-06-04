import path from "node:path";

import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionImagePaths,
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const REPORT_MD = path.join(repoRoot, "docs/validation/assessment_variant_depth_audit.md");
const REPORT_JSON = path.join(repoRoot, "docs/validation/assessment_variant_depth_audit.json");
const ROUND_SIZE = 15;
const RETRY_WRONG_ALLOWANCE = 3;
const RETRY_SAFE_PHASE_MINIMUM = ROUND_SIZE * 2 - RETRY_WRONG_ALLOWANCE;
const BUFFER_MULTIPLIER = 1.25;

function escapeMarkdown(value = "") {
  return String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeMarkdown).join(" | ")} |`)
  ].join("\n");
}

function questionLevel(question = {}) {
  return Number(question.level || question.assessmentLevel || question.depthLevel || question.difficulty || 1) >= 2 ? 2 : 1;
}

function questionPhase(question = {}) {
  const raw = question.phase ?? question.assessmentPhase ?? question.levelPhase ?? question.phaseTarget ?? "";
  const numeric = Number(raw);
  if (numeric === 1 || numeric === 2) return numeric;
  const text = String(raw || "").toLowerCase();
  if (/phase_?2|p2/.test(text)) return 2;
  return 1;
}

function questionId(question = {}) {
  return question.id || question.questionId || "(missing id)";
}

function questionFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

function answerOptions(question = {}) {
  if (Array.isArray(question.imageCards) && question.imageCards.length) return question.imageCards;
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function targetWord(question = {}) {
  return normalizeWord(
    question.targetWord ||
    question.itemKey ||
    question.coverageTarget ||
    question.targetPattern ||
    question.rhymeGroup ||
    question.rime ||
    question.targetSound ||
    question.answer ||
    question.correctAnswer ||
    ""
  );
}

function familyKey(question = {}) {
  return normalizeWord(
    question.itemKey ||
    question.coverageTarget ||
    question.rhymeGroup ||
    question.rime ||
    question.targetPattern ||
    question.targetSound ||
    ""
  ).replace(/ /g, "_");
}

function promptText(question = {}) {
  return normalizeWord(question.sentence || question.passage || question.context || question.question || question.prompt || "");
}

function primaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function answerSetKey(question = {}) {
  return answerOptions(question)
    .map(optionValue)
    .map(normalizeWord)
    .filter(Boolean)
    .sort()
    .join("|");
}

function contentVariantKey(question = {}) {
  return [
    targetWord(question),
    questionFormat(question),
    promptText(question),
    normalizeWord(question.answer || question.correctAnswer || ""),
    answerSetKey(question),
    primaryImage(question)
  ].filter(Boolean).join("::");
}

function uniqueCount(questions, getter) {
  return new Set(questions.map(getter).filter(Boolean)).size;
}

function groupBy(questions, getter) {
  const map = new Map();
  for (const question of questions) {
    const key = getter(question) || "(none)";
    const rows = map.get(key) || [];
    rows.push(question);
    map.set(key, rows);
  }
  return map;
}

const SKILL_ID_ALIASES = {
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
};

const skills = managedAssessmentSkillDepthConfig.map(skill => SKILL_ID_ALIASES[skill.skillId] || skill.skillId);
const summary = [];
const phaseRows = [];
const subskillRows = [];
const hfwWordRows = [];
const rhymingFamilyRows = [];
const rhymingTargetRows = [];

for (const skillId of skills) {
  const raw = buildRuntimeQuestionsForSkill(skillId);
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const byPhase = groupBy(selectable, question => `L${questionLevel(question)}P${questionPhase(question)}`);
  const byTarget = groupBy(selectable, targetWord);
  const byFamily = groupBy(selectable, familyKey);

  summary.push({
    skillId,
    rawCount: raw.length,
    selectableCount: selectable.length,
    subskillCount: skillId === "rhyming" ? byFamily.size : byTarget.size,
    uniqueContentVariants: uniqueCount(selectable, contentVariantKey),
    uniquePrompts: uniqueCount(selectable, promptText),
    uniquePrimaryImages: uniqueCount(selectable, primaryImage),
    uniqueAnswerSets: uniqueCount(selectable, answerSetKey)
  });

  for (const phase of ["L1P1", "L1P2", "L2P1", "L2P2"]) {
    const rows = byPhase.get(phase) || [];
    phaseRows.push({
      skillId,
      phase,
      count: rows.length,
      uniqueContentVariants: uniqueCount(rows, contentVariantKey),
      uniquePrompts: uniqueCount(rows, promptText),
      uniquePrimaryImages: uniqueCount(rows, primaryImage),
      uniqueAnswerSets: uniqueCount(rows, answerSetKey),
      retrySafeMinimum: RETRY_SAFE_PHASE_MINIMUM,
      meetsRetrySafeMinimum: rows.length >= RETRY_SAFE_PHASE_MINIMUM
    });
  }

  const detailMap = skillId === "rhyming" ? byFamily : byTarget;
  for (const [subskill, rows] of [...detailMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    subskillRows.push({
      skillId,
      subskill,
      count: rows.length,
      uniqueContentVariants: uniqueCount(rows, contentVariantKey),
      uniquePrompts: uniqueCount(rows, promptText),
      uniquePrimaryImages: uniqueCount(rows, primaryImage),
      uniqueAnswerSets: uniqueCount(rows, answerSetKey),
      exampleIds: rows.slice(0, 6).map(questionId)
    });
  }

  if (HFW_WORD_BANDS[skillId]) {
    for (const word of HFW_WORD_BANDS[skillId]) {
      const rows = selectable.filter(question => targetWord(question) === word);
      hfwWordRows.push({
        skillId,
        word,
        count: rows.length,
        uniqueContentVariants: uniqueCount(rows, contentVariantKey),
        uniquePrompts: uniqueCount(rows, promptText),
        uniquePrimaryImages: uniqueCount(rows, primaryImage),
        uniqueAnswerSets: uniqueCount(rows, answerSetKey),
        minimumVariantsPerWord: 4,
        meetsFourVariantMinimum: uniqueCount(rows, contentVariantKey) >= 4 && uniqueCount(rows, promptText) >= 4 && uniqueCount(rows, primaryImage) >= 4
      });
    }
  }

  if (skillId === "rhyming") {
    for (const [family, rows] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      rhymingFamilyRows.push({
        family,
        count: rows.length,
        uniqueContentVariants: uniqueCount(rows, contentVariantKey),
        uniquePrompts: uniqueCount(rows, promptText),
        uniquePrimaryImages: uniqueCount(rows, primaryImage),
        uniqueAnswerSets: uniqueCount(rows, answerSetKey),
        targetCount: groupBy(rows, targetWord).size
      });
    }
    for (const [family, rows] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const byTarget = groupBy(rows, targetWord);
      for (const [target, targetRows] of [...byTarget.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        rhymingTargetRows.push({
          family,
          target,
          count: targetRows.length,
          uniqueContentVariants: uniqueCount(targetRows, contentVariantKey),
          uniquePrompts: uniqueCount(targetRows, promptText),
          uniquePrimaryImages: uniqueCount(targetRows, primaryImage),
          uniqueAnswerSets: uniqueCount(targetRows, answerSetKey),
          exampleIds: targetRows.slice(0, 6).map(questionId)
        });
      }
    }
  }
}

const hfwRequiredSlots = Object.keys(HFW_WORD_BANDS).length * 4 * Math.ceil(RETRY_SAFE_PHASE_MINIMUM * BUFFER_MULTIPLIER);
const hfwCurrentUniqueImages = hfwWordRows.reduce((sum, row) => sum + Math.min(row.uniquePrimaryImages, 1), 0);
const hfwBufferedRequest = {
  bufferMultiplier: BUFFER_MULTIPLIER,
  phaseMinimumWithoutBuffer: RETRY_SAFE_PHASE_MINIMUM,
  phaseMinimumWithBuffer: Math.ceil(RETRY_SAFE_PHASE_MINIMUM * BUFFER_MULTIPLIER),
  requiredUniqueQuestionImageSlots: hfwRequiredSlots,
  currentUniqueWordImages: hfwCurrentUniqueImages,
  additionalUniqueImagesNeeded: Math.max(0, hfwRequiredSlots - hfwCurrentUniqueImages)
};

const rhymingTargets = new Set(rhymingTargetRows.map(row => `${row.family}/${row.target}`));
const rhymingRequiredTargetVariantSlots = rhymingTargets.size * 4;
const rhymingCurrentTargetImageSlots = rhymingTargetRows.reduce((sum, row) => sum + Math.min(row.uniquePrimaryImages, 1), 0);
const rhymingBufferedRequest = {
  activeFamilyTargetPairs: rhymingTargets.size,
  minimumVariantsPerFamilyTargetPair: 4,
  bufferMultiplier: BUFFER_MULTIPLIER,
  requiredUniqueTargetQuestionSlots: rhymingRequiredTargetVariantSlots,
  bufferedUniqueTargetQuestionSlots: Math.ceil(rhymingRequiredTargetVariantSlots * BUFFER_MULTIPLIER),
  currentUniqueTargetImages: rhymingCurrentTargetImageSlots,
  additionalTargetSceneImagesNeededForBufferedFourVariantSet: Math.max(0, Math.ceil(rhymingRequiredTargetVariantSlots * BUFFER_MULTIPLIER) - rhymingCurrentTargetImageSlots)
};

const report = {
  generatedAt: new Date().toISOString(),
  roundSize: ROUND_SIZE,
  retryWrongAllowance: RETRY_WRONG_ALLOWANCE,
  retrySafePhaseMinimum: RETRY_SAFE_PHASE_MINIMUM,
  bufferMultiplier: BUFFER_MULTIPLIER,
  hfwBufferedRequest,
  rhymingBufferedRequest,
  summary,
  phaseRows,
  subskillRows,
  hfwWordRows,
  rhymingFamilyRows,
  rhymingTargetRows
};

writeFile(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

writeFile(REPORT_MD, [
  "# Assessment Variant Depth Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Retry-safe phase minimum: ${RETRY_SAFE_PHASE_MINIMUM} unique rows per phase (${ROUND_SIZE} first-round questions + ${ROUND_SIZE - RETRY_WRONG_ALLOWANCE} fresh retry questions).`,
  `Buffered target: ${Math.round(BUFFER_MULTIPLIER * 100)}% of retry-safe minimum.`,
  "",
  "## HFW Buffered Media Need",
  "",
  table(["Metric", "Value"], Object.entries(hfwBufferedRequest).map(([key, value]) => [key, value])),
  "",
  "## Rhyming Buffered Media Need",
  "",
  table(["Metric", "Value"], Object.entries(rhymingBufferedRequest).map(([key, value]) => [key, value])),
  "",
  "## Skill Summary",
  "",
  table([
    "Skill ID",
    "Raw",
    "Selectable",
    "Subskills",
    "Unique Content Variants",
    "Unique Prompts",
    "Unique Primary Images",
    "Unique Answer Sets"
  ], summary.map(row => [
    row.skillId,
    row.rawCount,
    row.selectableCount,
    row.subskillCount,
    row.uniqueContentVariants,
    row.uniquePrompts,
    row.uniquePrimaryImages,
    row.uniqueAnswerSets
  ])),
  "",
  "## Phase Summary",
  "",
  table([
    "Skill ID",
    "Phase",
    "Rows",
    "Unique Content Variants",
    "Unique Prompts",
    "Unique Primary Images",
    "Unique Answer Sets",
    "Retry-Safe Minimum",
    "Meets Minimum"
  ], phaseRows.map(row => [
    row.skillId,
    row.phase,
    row.count,
    row.uniqueContentVariants,
    row.uniquePrompts,
    row.uniquePrimaryImages,
    row.uniqueAnswerSets,
    row.retrySafeMinimum,
    row.meetsRetrySafeMinimum ? "yes" : "no"
  ])),
  "",
  "## HFW Word Detail",
  "",
  table([
    "Skill ID",
    "Word",
    "Rows",
    "Unique Content Variants",
    "Unique Prompts",
    "Unique Images",
    "Unique Answer Sets",
    "Meets 4 Real Variants"
  ], hfwWordRows.map(row => [
    row.skillId,
    row.word,
    row.count,
    row.uniqueContentVariants,
    row.uniquePrompts,
    row.uniquePrimaryImages,
    row.uniqueAnswerSets,
    row.meetsFourVariantMinimum ? "yes" : "no"
  ])),
  "",
  "## Rhyming Family Detail",
  "",
  table([
    "Family",
    "Rows",
    "Targets",
    "Unique Content Variants",
    "Unique Prompts",
    "Unique Images",
    "Unique Answer Sets"
  ], rhymingFamilyRows.map(row => [
    row.family,
    row.count,
    row.targetCount,
    row.uniqueContentVariants,
    row.uniquePrompts,
    row.uniquePrimaryImages,
    row.uniqueAnswerSets
  ])),
  "",
  "## Rhyming Target Detail",
  "",
  table([
    "Family",
    "Target",
    "Rows",
    "Unique Content Variants",
    "Unique Prompts",
    "Unique Images",
    "Unique Answer Sets",
    "Example IDs"
  ], rhymingTargetRows.map(row => [
    row.family,
    row.target,
    row.count,
    row.uniqueContentVariants,
    row.uniquePrompts,
    row.uniquePrimaryImages,
    row.uniqueAnswerSets,
    row.exampleIds.join(", ")
  ])),
  ""
].join("\n"));

console.log("Assessment variant depth audit");
console.table(summary.map(row => ({
  skillId: row.skillId,
  selectable: row.selectableCount,
  subskills: row.subskillCount,
  uniqueContentVariants: row.uniqueContentVariants,
  uniquePrompts: row.uniquePrompts,
  uniqueImages: row.uniquePrimaryImages,
  uniqueAnswerSets: row.uniqueAnswerSets
})));
console.log(`HFW additional unique images needed for 125% buffer: ${hfwBufferedRequest.additionalUniqueImagesNeeded}`);
console.log(`Rhyming additional target scene images for buffered 4-variant set: ${rhymingBufferedRequest.additionalTargetSceneImagesNeededForBufferedFourVariantSet}`);
console.log(`Wrote ${path.relative(repoRoot, REPORT_MD)}`);
console.log(`Wrote ${path.relative(repoRoot, REPORT_JSON)}`);
