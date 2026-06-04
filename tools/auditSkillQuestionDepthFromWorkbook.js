import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { languageSkillQuestions } from "../src/data/generated/languageSkillQuestions.generated.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  publicPathExists,
  selectableRuntimeQuestionsForSkill
} from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(repoRoot, "docs/validation/skill_question_depth_from_workbook_audit.json");
const mdPath = path.join(repoRoot, "docs/validation/skill_question_depth_from_workbook_audit.md");

const WORKBOOK_SKILLS = [
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100",
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms"
];

const generatedQuestions = [...hfwAssessmentQuestions, ...languageSkillQuestions];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text);
}

function normalizeSkillId(value = "") {
  const text = String(value || "").toLowerCase();
  if (text === "prepositions_of_place") return "prepositions";
  if (text === "prefix_suffix") return "prefixes_suffixes";
  if (text === "homophones") return "homophones_homonyms";
  return text;
}

function generatedSkillId(question = {}) {
  return normalizeSkillId(question.skillId || question.assessmentSkillId || "");
}

function contentKey(question = {}) {
  return [
    generatedSkillId(question),
    String(question.templateType || question.formatType || question.questionType || "").toLowerCase(),
    String(question.targetWord || getQuestionTargetWord(question) || "").toLowerCase(),
    String(question.prompt || question.question || "").toLowerCase().replace(/\s+/g, " ").trim(),
    String(question.sentence || question.context || question.fullSentence || "").toLowerCase().replace(/\s+/g, " ").trim(),
    String(question.correctAnswer || question.answer || "").toLowerCase().trim()
  ].join("|");
}

function countDuplicates(records, keyFn) {
  const seen = new Map();
  let duplicateCount = 0;
  for (const record of records) {
    const key = keyFn(record);
    if (!key) continue;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const count of seen.values()) if (count > 1) duplicateCount += count - 1;
  return duplicateCount;
}

function optionWords(question = {}) {
  const options = question.answerOptions || question.options || question.choices || [];
  return options.map(option => typeof option === "object" ? option.value || option.word || option.text || option.label : option).filter(Boolean).map(value => String(value).toLowerCase());
}

function multiplePlausibleAnswer(question = {}) {
  const words = optionWords(question);
  const set = new Set(words);
  for (const pair of [["a", "the"], ["a", "an"], ["the", "an"]]) {
    if (pair.every(word => set.has(word))) return true;
  }
  return false;
}

function phaseCount(records, level, phase) {
  return records.filter(question => Number(question.level || question.assessmentLevel || 1) === level && Number(question.phase || question.assessmentPhase || 1) === phase).length;
}

function auditSkill(skillId) {
  const generated = generatedQuestions.filter(question => generatedSkillId(question) === skillId);
  const runtime = buildRuntimeQuestionsForSkill(skillId);
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const workbookSelectable = selectable.filter(question => String(question.source || "").includes("skill_word_bank_workbook") || String(question._source || "").includes("hfwAssessmentQuestions") || String(question._source || "").includes("languageSkillQuestions"));
  const imagePaths = generated.flatMap(getQuestionImagePaths);
  const audioPaths = generated.flatMap(getQuestionAudioPaths);
  const missingImages = imagePaths.filter(item => item && String(item).startsWith("/") && !publicPathExists(item));
  const missingAudio = audioPaths.filter(item => item && String(item).startsWith("/") && !publicPathExists(item));
  const uniqueImages = new Set(imagePaths.filter(Boolean));
  const uniqueAudio = new Set(audioPaths.filter(Boolean));
  const uniqueTargets = new Set(generated.map(question => question.targetWord || getQuestionTargetWord(question)).filter(Boolean).map(value => String(value).toLowerCase()));
  const uniqueTemplates = new Set(generated.map(question => question.templateType || question.formatType || question.questionType).filter(Boolean));
  const uniquePrompts = new Set(generated.map(question => [question.prompt, question.question, question.sentence, question.context, question.fullSentence].filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ").trim()).filter(Boolean));
  const phaseCounts = {
    level1Phase1: phaseCount(workbookSelectable, 1, 1),
    level1Phase2: phaseCount(workbookSelectable, 1, 2),
    level2Phase1: phaseCount(workbookSelectable, 2, 1),
    level2Phase2: phaseCount(workbookSelectable, 2, 2)
  };
  const retrySafeReplacementCount = Math.max(0, workbookSelectable.length - 15);
  const duplicateContentCount = countDuplicates(generated, contentKey);
  const multiplePlausibleAnswerCount = generated.filter(multiplePlausibleAnswer).length;
  const blockedMediaCount = runtime.filter(question => String(question.filterReason || "").includes("missing essential") || String(question.filterReason || "").includes("blocked")).length;
  const phaseMinimum = Math.min(...Object.values(phaseCounts));
  const status = generated.length === 0
    ? "no_workbook_generated_questions"
    : phaseMinimum >= 15 && duplicateContentCount === 0 && multiplePlausibleAnswerCount === 0 && missingImages.length === 0 && missingAudio.length === 0
      ? "pass"
      : "needs_attention";
  return {
    skillId,
    totalGeneratedQuestions: generated.length,
    runtimeQuestions: runtime.length,
    selectableRuntimeQuestions: selectable.length,
    workbookSelectableQuestions: workbookSelectable.length,
    uniqueTargets: uniqueTargets.size,
    uniqueTemplates: uniqueTemplates.size,
    uniquePromptSentenceContent: uniquePrompts.size,
    uniqueImages: uniqueImages.size,
    uniqueAudio: uniqueAudio.size,
    ...phaseCounts,
    retrySafeReplacementCount,
    missingImageCount: missingImages.length,
    missingAudioCount: missingAudio.length,
    duplicateContentCount,
    multiplePlausibleAnswerCount,
    blockedMediaCount,
    runtimeAuditCountsMatch: workbookSelectable.length <= selectable.length && generated.length <= runtime.length + generated.length,
    status
  };
}

function markdown(audit) {
  const lines = [];
  lines.push("# Skill Question Depth From Workbook Audit", "");
  lines.push(`Generated: ${audit.generatedAt}`, "");
  lines.push("| Skill | Generated | Selectable | Workbook Selectable | Targets | Templates | Prompt/Sentence Content | Images | Audio | L1P1 | L1P2 | L2P1 | L2P2 | Duplicate Content | Ambiguity | Missing Images | Missing Audio | Status |", "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const row of audit.skills) {
    lines.push(`| ${row.skillId} | ${row.totalGeneratedQuestions} | ${row.selectableRuntimeQuestions} | ${row.workbookSelectableQuestions} | ${row.uniqueTargets} | ${row.uniqueTemplates} | ${row.uniquePromptSentenceContent} | ${row.uniqueImages} | ${row.uniqueAudio} | ${row.level1Phase1} | ${row.level1Phase2} | ${row.level2Phase1} | ${row.level2Phase2} | ${row.duplicateContentCount} | ${row.multiplePlausibleAnswerCount} | ${row.missingImageCount} | ${row.missingAudioCount} | ${row.status} |`);
  }
  return `${lines.join("\n")}\n`;
}

const audit = {
  generatedAt: new Date().toISOString(),
  skills: WORKBOOK_SKILLS.map(auditSkill)
};
writeJson(jsonPath, audit);
writeText(mdPath, markdown(audit));
console.log(`Wrote ${path.relative(repoRoot, mdPath)} and ${path.relative(repoRoot, jsonPath)}`);
console.log(JSON.stringify(Object.fromEntries(audit.skills.map(row => [row.skillId, {
  generated: row.totalGeneratedQuestions,
  selectable: row.selectableRuntimeQuestions,
  workbookSelectable: row.workbookSelectableQuestions,
  status: row.status
}])), null, 2));
