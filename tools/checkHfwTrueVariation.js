import path from "node:path";

import {
  getHfwAllowedFormatsForPhase,
  hfwPhaseKey,
  isHfwClozeFormat,
  isHfwDirectRecognitionFormat
} from "../src/data/hfwAssessmentFormatConfig.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionImagePaths,
  getQuestionTargetWord,
  normalizeWord,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const HFW_SKILL_IDS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const PHASE_KEYS = ["L1P1", "L1P2", "L2P1", "L2P2"];
const ROUND_LENGTH = 15;
const REPLACEMENTS_NEEDED = 12;

const ambiguityGroups = [
  ["a", "an", "the"],
  ["this", "that", "it"],
  ["my", "your", "his", "her", "our"],
  ["is", "are", "was"],
  ["to", "in", "on", "of", "for", "with", "by", "into", "out", "over", "around", "before", "after"]
];

function questionId(question = {}) {
  return question.id || question.questionId || "(missing id)";
}

function levelOf(question = {}) {
  const level = Number(question.level || question.assessmentLevel || question.depthLevel || 0);
  if (Number.isFinite(level) && level >= 1) return level >= 2 ? 2 : 1;
  const difficulty = Number(question.difficultyLevel || question.difficulty || 0);
  return Number.isFinite(difficulty) && difficulty >= 2 ? 2 : 1;
}

function phaseOf(question = {}) {
  const raw = question.phase || question.assessmentPhase || question.phaseNumber || question.stage || "";
  const numeric = Number(raw);
  if (numeric === 1 || numeric === 2) return numeric;
  const text = String(raw || "").toLowerCase();
  if (/phase_?2|p2/.test(text)) return 2;
  if (/phase_?1|p1/.test(text)) return 1;
  return 1;
}

function formatOf(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function primaryImage(question = {}) {
  return getQuestionImagePaths(question)[0] || "";
}

function promptContext(question = {}) {
  return normalizeWord(question.sentence || question.passage || question.context || question.question || question.prompt || "");
}

function answerOf(question = {}) {
  return normalizeWord(question.answer || question.correctAnswer || question.targetWord || question.itemKey || "");
}

function optionValue(option) {
  if (option && typeof option === "object") return option.value || option.word || option.label || option.text || option.answer || "";
  return option || "";
}

function answerOptions(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function optionWords(question = {}) {
  return answerOptions(question).map(optionValue).map(normalizeWord).filter(Boolean);
}

function targetOf(question = {}) {
  return normalizeWord(question.targetWord || getQuestionTargetWord(question) || question.itemKey || answerOf(question));
}

function contentKey(question = {}) {
  return [
    targetOf(question),
    formatOf(question),
    promptContext(question),
    answerOf(question),
    optionWords(question).sort().join("|"),
    primaryImage(question)
  ].filter(Boolean).join("::");
}

function targetTemplateKey(question = {}) {
  return `${targetOf(question)}::${formatOf(question)}`;
}

function targetImageKey(question = {}) {
  return `${targetOf(question)}::${primaryImage(question)}`;
}

function promptAnswerKey(question = {}) {
  return `${promptContext(question)}::${answerOf(question)}`;
}

function answerSetKey(question = {}) {
  return optionWords(question).sort().join("|");
}

function duplicateGroups(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key.replace(/[:|]/g, "")) continue;
    const rows = groups.get(key) || [];
    rows.push(item);
    groups.set(key, rows);
  }
  return [...groups.entries()].filter(([, rows]) => rows.length > 1);
}

function sameAmbiguityGroup(answer, options) {
  const group = ambiguityGroups.find(words => words.includes(answer));
  if (!group) return false;
  return options.some(word => word !== answer && group.includes(word));
}

function clozeIssues(question = {}) {
  const format = formatOf(question);
  if (!isHfwClozeFormat(format)) return [];
  const sentence = String(question.sentence || question.passage || question.context || "");
  const options = optionWords(question);
  const answer = answerOf(question);
  const issues = [];
  if ((sentence.match(/___/g) || []).length !== 1) issues.push("not exactly one blank");
  if (options.length !== 4) issues.push("not four choices");
  if (new Set(options).size !== options.length) issues.push("duplicate choices");
  if (!answer || !options.includes(answer)) issues.push("answer missing from choices");
  if (sameAmbiguityGroup(answer, options)) issues.push("same ambiguity group choices");
  return issues;
}

function directIssues(question = {}) {
  const format = formatOf(question);
  if (!isHfwDirectRecognitionFormat(format)) return [];
  const options = optionWords(question);
  const answer = answerOf(question);
  const issues = [];
  if (options.length !== 4) issues.push("not four choices");
  if (new Set(options).size !== options.length) issues.push("duplicate choices");
  if (!answer || !options.includes(answer)) issues.push("answer missing from choices");
  return issues;
}

function retrySafeReplacementCount(phaseQuestions) {
  const firstRound = sampleRound(phaseQuestions, ROUND_LENGTH);
  const mastered = firstRound.slice(0, REPLACEMENTS_NEEDED);
  const blockedContent = new Set(mastered.map(contentKey));
  const blockedTargetTemplate = new Set(mastered.map(targetTemplateKey));
  const blockedTargetImage = new Set(mastered.map(targetImageKey));
  const blockedPromptAnswer = new Set(mastered.map(promptAnswerKey));
  const candidates = phaseQuestions.filter(question =>
    !firstRound.includes(question) &&
    !blockedContent.has(contentKey(question)) &&
    !blockedTargetTemplate.has(targetTemplateKey(question)) &&
    !blockedTargetImage.has(targetImageKey(question)) &&
    !blockedPromptAnswer.has(promptAnswerKey(question))
  );
  return sampleRound(candidates, REPLACEMENTS_NEEDED).length;
}

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

const summaries = [];
const phaseRows = [];
const failureRows = [];
const reports = [];

for (const skillId of HFW_SKILL_IDS) {
  const runtime = buildRuntimeQuestionsForSkill(skillId);
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const targets = new Set(selectable.map(targetOf).filter(Boolean));
  const templates = new Set(selectable.map(formatOf).filter(Boolean));
  const prompts = new Set(selectable.map(promptContext).filter(Boolean));
  const images = new Set(selectable.map(primaryImage).filter(Boolean));
  const answerSets = new Set(selectable.map(answerSetKey).filter(Boolean));
  const duplicateContent = duplicateGroups(selectable, contentKey);
  const duplicateTargetTemplate = duplicateGroups(selectable, targetTemplateKey);
  const duplicateTargetImage = duplicateGroups(selectable, targetImageKey);
  const duplicatePromptAnswer = duplicateGroups(selectable, promptAnswerKey);
  const missingMedia = selectable.filter(question => !primaryImage(question) || !publicPathExists(primaryImage(question)));
  const invalidFormatRows = selectable.filter(question => !getHfwAllowedFormatsForPhase(levelOf(question), phaseOf(question)).includes(formatOf(question)));
  const clozeIssueRows = selectable
    .map(question => ({ question, issues: clozeIssues(question) }))
    .filter(row => row.issues.length);
  const directIssueRows = selectable
    .map(question => ({ question, issues: directIssues(question) }))
    .filter(row => row.issues.length);

  const phaseCounts = {};
  const retryCounts = {};
  for (const phaseKey of PHASE_KEYS) {
    const phaseQuestions = selectable.filter(question => hfwPhaseKey(levelOf(question), phaseOf(question)) === phaseKey);
    phaseCounts[phaseKey] = phaseQuestions.length;
    retryCounts[phaseKey] = retrySafeReplacementCount(phaseQuestions);
    phaseRows.push([
      skillId,
      phaseKey,
      phaseQuestions.length,
      sampleRound(phaseQuestions, ROUND_LENGTH).length,
      retryCounts[phaseKey],
      new Set(phaseQuestions.map(targetOf).filter(Boolean)).size,
      new Set(phaseQuestions.map(formatOf).filter(Boolean)).size
    ]);
  }

  const failures = [
    ...duplicateContent.map(([key, rows]) => `content reused ${rows.length} times: ${key}`),
    ...duplicateTargetTemplate.map(([key, rows]) => `target/template reused ${rows.length} times: ${key}`),
    ...duplicateTargetImage.map(([key, rows]) => `target/image reused ${rows.length} times: ${key}`),
    ...duplicatePromptAnswer.map(([key, rows]) => `prompt/answer reused ${rows.length} times: ${key}`),
    ...missingMedia.map(question => `missing media: ${questionId(question)}`),
    ...invalidFormatRows.map(question => `invalid phase format: ${questionId(question)} ${formatOf(question)}`),
    ...clozeIssueRows.map(row => `ambiguous cloze: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...directIssueRows.map(row => `direct recognition issue: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...PHASE_KEYS.filter(phaseKey => phaseCounts[phaseKey] < ROUND_LENGTH).map(phaseKey => `${phaseKey} below ${ROUND_LENGTH} selectable questions`),
    ...PHASE_KEYS.filter(phaseKey => retryCounts[phaseKey] < REPLACEMENTS_NEEDED).map(phaseKey => `${phaseKey} has only ${retryCounts[phaseKey]}/${REPLACEMENTS_NEEDED} retry-safe replacements`)
  ];

  failureRows.push(...failures.map(failure => [skillId, failure]));
  summaries.push([
    skillId,
    runtime.length,
    selectable.length,
    HFW_WORD_BANDS[skillId]?.length || 0,
    targets.size,
    templates.size,
    prompts.size,
    images.size,
    answerSets.size,
    Object.entries(phaseCounts).map(([phaseKey, count]) => `${phaseKey}: ${count}`).join("<br>"),
    Object.entries(retryCounts).map(([phaseKey, count]) => `${phaseKey}: ${count}/${REPLACEMENTS_NEEDED}`).join("<br>"),
    duplicateContent.length,
    duplicateTargetTemplate.length,
    duplicateTargetImage.length,
    duplicatePromptAnswer.length,
    clozeIssueRows.length,
    missingMedia.length,
    failures.length ? "fail" : "pass"
  ]);

  reports.push({
    skillId,
    runtime: runtime.length,
    selectable: selectable.length,
    bandWords: HFW_WORD_BANDS[skillId]?.length || 0,
    uniqueTargets: targets.size,
    uniqueTemplates: templates.size,
    uniquePrompts: prompts.size,
    uniqueImages: images.size,
    uniqueAnswerSets: answerSets.size,
    phaseCounts,
    retrySafeReplacementCounts: retryCounts,
    duplicateGroups: {
      content: duplicateContent.length,
      targetTemplate: duplicateTargetTemplate.length,
      targetImage: duplicateTargetImage.length,
      promptAnswer: duplicatePromptAnswer.length
    },
    invalidFormats: invalidFormatRows.length,
    clozeIssues: clozeIssueRows.length,
    directIssues: directIssueRows.length,
    missingMedia: missingMedia.length,
    failures
  });
}

const markdown = [
  "# HFW True Variation Audit",
  "",
  "Generated by `npm run check:hfw-true-variation`.",
  "",
  "## Summary",
  "",
  table([
    "Skill",
    "Runtime",
    "Selectable",
    "Band Words",
    "Unique Targets",
    "Unique Templates",
    "Unique Prompts",
    "Unique Images",
    "Unique Answer Sets",
    "Phase Counts",
    "Retry-Safe Replacements",
    "Dup Content",
    "Dup Target/Template",
    "Dup Target/Image",
    "Dup Prompt/Answer",
    "Ambiguous Cloze",
    "Missing Media",
    "Status"
  ], summaries),
  "",
  "## Phase Detail",
  "",
  table(["Skill", "Phase", "Selectable", "Sampled Round", "Retry-Safe Replacements", "Targets", "Templates"], phaseRows),
  "",
  "## Failures",
  "",
  failureRows.length ? table(["Skill", "Failure"], failureRows) : "None.",
  ""
].join("\n");

writeFile(path.join(repoRoot, "docs/validation/hfw_true_variation_audit.md"), markdown);
writeFile(path.join(repoRoot, "docs/validation/hfw_true_variation_audit.json"), `${JSON.stringify(reports, null, 2)}\n`);

console.log("HFW true variation audit");
console.table(summaries.map(row => ({
  skillId: row[0],
  selectable: row[2],
  uniqueTargets: row[4],
  uniqueTemplates: row[5],
  uniquePrompts: row[6],
  uniqueImages: row[7],
  status: row[17]
})));
console.log("Wrote docs/validation/hfw_true_variation_audit.md");
console.log("Wrote docs/validation/hfw_true_variation_audit.json");

if (failureRows.length) {
  console.error(`HFW true variation audit failed: ${failureRows.length} failures`);
  failureRows.slice(0, 80).forEach(([skillId, failure]) => console.error(`- ${skillId}: ${failure}`));
  if (failureRows.length > 80) console.error(`...and ${failureRows.length - 80} more`);
  process.exit(1);
}

console.log("HFW true variation audit passed.");
