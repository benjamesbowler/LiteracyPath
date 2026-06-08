import path from "node:path";

import { ALL_HFW_WORD_SET, normalizeHfwSkillId } from "../src/data/highFrequencyWordBands.js";
import {
  hfwCuratedSentences,
  hfwCuratedSentenceContentKeys,
  hfwCuratedSentenceIds,
  hfwCuratedSentenceTextKeys
} from "../src/data/generated/hfwCuratedSentences.generated.js";
import {
  isHfwClozeFormat,
  isHfwDirectRecognitionFormat,
  isHfwSentenceSpellFormat
} from "../src/data/hfwAssessmentFormatConfig.js";
import {
  HFW_ZERO_TOLERANCE_FILLER_PHRASES,
  getHfwFillerPhraseHits,
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues,
  normalizeHfwText
} from "../src/data/hfwQualityRules.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionSkillLabel,
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const hfwSkills = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

function getPrompt(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" ");
}

function getOptions(question = {}) {
  return [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ].map(option => {
    if (option && typeof option === "object") return option.value || option.word || option.label || option.text || "";
    return option;
  }).map(normalizeWord).filter(Boolean);
}

function getAnswer(question = {}) {
  return normalizeWord(question.correctAnswer || question.answer || question.targetWord || question.itemKey || "");
}

function getFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
}

function getSkillId(question = {}) {
  return String(question.skillId || question.assessmentSkillId || "").trim();
}

function getSentenceWithBlank(question = {}) {
  return String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
}

function getFullSentence(question = {}) {
  return String(question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
}

function curatedTextKey(question = {}) {
  return [getSkillId(question), getAnswer(question), getSentenceWithBlank(question), getFullSentence(question)].join("::").toLowerCase();
}

function curatedSourceIssues(question = {}) {
  const issues = [];
  const source = String(question.source || question.approvedSource || "").toLowerCase();
  if (!/(workbook|curated)/.test(source)) issues.push("source_not_workbook_curated");
  if (!question.sentenceId) issues.push("missing_sentence_id");
  if (question.sentenceId && !hfwCuratedSentenceIds.has(question.sentenceId)) issues.push("sentence_id_not_curated");
  if (!question.curatedContentKey) {
    issues.push("missing_curated_content_key");
  } else if (!hfwCuratedSentenceContentKeys.has(question.curatedContentKey)) {
    issues.push("curated_content_key_not_curated");
  }
  if (!hfwCuratedSentenceTextKeys.has(curatedTextKey(question))) issues.push("sentence_text_not_curated");
  return issues;
}

function isHfwSentenceQuestion(question = {}) {
  const format = getFormat(question);
  return isHfwClozeFormat(format) || isHfwSentenceSpellFormat(format);
}

function promptTargetsSpecificWord(question = {}) {
  const prompt = normalizeWord(getPrompt(question));
  const answer = getAnswer(question);
  if (!answer) return false;
  return prompt.includes(`find the word ${answer}`) ||
    prompt.includes(`which word says ${answer}`) ||
    prompt.includes(`choose ${answer}`) ||
    prompt.includes(`listen to the word choose ${answer}`);
}

function isGenericHfwPrompt(question = {}) {
  const prompt = normalizeWord(getPrompt(question));
  return /\b(high frequency|sight word)\b/.test(prompt) && !promptTargetsSpecificWord(question);
}

const rows = [];
const failures = [];
const sourceRows = [];
const bandRows = [];

for (const skillId of hfwSkills) {
  const rawSentenceQuestions = buildRuntimeQuestionsForSkill(skillId).filter(isHfwSentenceQuestion);
  const curatedRows = hfwCuratedSentences.filter(row => row.skillId === skillId);
  const rawSourceIssues = rawSentenceQuestions
    .map(question => ({ question, issues: curatedSourceIssues(question) }))
    .filter(row => row.issues.length);
  const rawBannedPhraseRows = rawSentenceQuestions
    .map(question => ({ question, phrases: getHfwFillerPhraseHits(question) }))
    .filter(row => row.phrases.some(phrase => HFW_ZERO_TOLERANCE_FILLER_PHRASES.has(phrase)));
  const rawWeakGenericRows = rawSentenceQuestions
    .map(question => ({ question, issues: getWeakGenericHfwPromptIssues(question) }))
    .filter(row => row.issues.length);

  for (const row of rawSourceIssues) {
    sourceRows.push({
      skillId,
      id: row.question.id,
      answer: getAnswer(row.question),
      sentence: getSentenceWithBlank(row.question),
      issues: row.issues,
      action: "blocked; HFW sentence questions must come from curated workbook sentence bank"
    });
  }
  for (const row of rawBannedPhraseRows) {
    sourceRows.push({
      skillId,
      id: row.question.id,
      answer: getAnswer(row.question),
      sentence: getSentenceWithBlank(row.question),
      issues: row.phrases.map(phrase => `banned_phrase:${normalizeHfwText(phrase)}`),
      action: "blocked; banned HFW filler phrase"
    });
  }
  for (const row of rawWeakGenericRows) {
    sourceRows.push({
      skillId,
      id: row.question.id,
      answer: getAnswer(row.question),
      sentence: getSentenceWithBlank(row.question),
      issues: row.issues,
      action: "blocked; sentence frame must be workbook-approved and specific"
    });
  }

  for (const question of selectableRuntimeQuestionsForSkill(skillId)) {
    const format = getFormat(question);
    if (isHfwDirectRecognitionFormat(format)) continue;

    const options = getOptions(question);
    const hfwOptions = options.filter(word => ALL_HFW_WORD_SET.has(word));
    const genericPrompt = isGenericHfwPrompt(question);
    const explanation = String(question.explanation || question.teachingTip || question.feedback || "").toLowerCase();
    const genericExplanation = explanation.includes("this is a high-frequency word") && hfwOptions.length > 1;
    const sameBandGenericDistractors = genericPrompt && hfwOptions.length > 1;
    const plausibleAnswerIssues = isHfwClozeFormat(format) ? getMultiplePlausibleHfwAnswerIssues(question) : [];
    const weakGenericIssues = isHfwClozeFormat(format) ? getWeakGenericHfwPromptIssues(question) : [];

    if (sameBandGenericDistractors || genericExplanation || plausibleAnswerIssues.length || weakGenericIssues.length) {
      const issue = `${question.id}: ${[
        sameBandGenericDistractors || genericExplanation ? `generic HFW wording with valid HFW options (${hfwOptions.join(", ")})` : "",
        ...plausibleAnswerIssues,
        ...weakGenericIssues
      ].filter(Boolean).join("; ")}`;
      failures.push(issue);
      rows.push({
        skillId,
        id: question.id,
        format,
        prompt: getPrompt(question),
        answer: getAnswer(question),
        hfwOptions,
        issues: [
          sameBandGenericDistractors || genericExplanation ? "generic_hfw_prompt" : "",
          ...plausibleAnswerIssues,
          ...weakGenericIssues
        ].filter(Boolean),
        action: isHfwClozeFormat(format)
          ? "blocked by validator; cloze prompt must make one answer uniquely correct"
          : "blocked by validator; prompt must target a specific word or use non-HFW distractors"
      });
    }
  }

  bandRows.push({
    skillId,
    curatedWorkbookRows: curatedRows.length,
    rawSentenceQuestions: rawSentenceQuestions.length,
    rawSourceFailures: rawSourceIssues.length,
    rawBannedPhraseFailures: rawBannedPhraseRows.length,
    rawWeakGenericFailures: rawWeakGenericRows.length,
    selectableQuestions: selectableRuntimeQuestionsForSkill(skillId).length
  });
}

const report = [
  "# HFW Distractor Ambiguity Audit",
  "",
  "Generated by `npm run check:hfw-distractor-ambiguity`.",
  "",
  "## Summary",
  "",
  `- HFW skills checked: ${hfwSkills.join(", ")}`,
  `- Ambiguous active runtime questions: ${rows.length}`,
  `- Raw/non-selectable source warnings: ${sourceRows.length}`,
  "",
  "## Rule",
  "",
  "If a non-direct prompt asks generically for a high-frequency word, distractors must not also be valid HFWs. Direct word-recognition formats are allowed to use HFW options because they explicitly target one printed word.",
  "",
  "## Flagged Items",
  "",
  rows.length
    ? [
      "| Skill | Question ID | Answer | Valid HFW options | Action |",
      "| --- | --- | --- | --- | --- |",
      ...rows.map(row => `| ${row.skillId} | ${row.id} | ${row.answer} | ${row.hfwOptions.join(", ")} | ${row.issues.join("; ")} → ${row.action} |`)
    ].join("\n")
    : "None.",
  "",
  "## Curated Source Checks",
  "",
  "These rows are raw source/workbook cleanup warnings. They do not fail this check unless they become selectable active runtime rows.",
  "",
  sourceRows.length
    ? [
      "| Skill | Question ID | Answer | Issues | Action |",
      "| --- | --- | --- | --- | --- |",
      ...sourceRows.map(row => `| ${row.skillId} | ${row.id} | ${row.answer} | ${row.issues.join("; ")} | ${row.action} |`)
    ].join("\n")
    : "None.",
  "",
  "## Runtime Bands",
  "",
  ...bandRows.map(row => `- ${getQuestionSkillLabel({ skillId: row.skillId }) || normalizeHfwSkillId(row.skillId)}: ${row.selectableQuestions} selectable, ${row.curatedWorkbookRows} curated workbook rows, ${row.rawSentenceQuestions} raw sentence questions`),
  ""
];

writeFile(path.join(repoRoot, "docs/validation/hfw_distractor_ambiguity_audit.md"), report.join("\n"));
writeFile(path.join(repoRoot, "docs/validation/hfw_distractor_ambiguity_audit.json"), `${JSON.stringify({
  generatedBy: "npm run check:hfw-distractor-ambiguity",
  hfwSkills,
  bandRows,
  ambiguousRows: rows,
  curatedSourceRows: sourceRows,
  failures
}, null, 2)}\n`);
console.log("Wrote docs/validation/hfw_distractor_ambiguity_audit.md");
console.log("Wrote docs/validation/hfw_distractor_ambiguity_audit.json");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("HFW distractor ambiguity check passed.");
