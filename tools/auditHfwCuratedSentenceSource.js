import path from "node:path";

import {
  isHfwClozeFormat,
  isHfwSentenceSpellFormat
} from "../src/data/hfwAssessmentFormatConfig.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  hfwCuratedSentences,
  hfwCuratedSentenceContentKeys,
  hfwCuratedSentenceIds,
  hfwCuratedSentenceTextKeys
} from "../src/data/generated/hfwCuratedSentences.generated.js";
import {
  HFW_ZERO_TOLERANCE_FILLER_PHRASES,
  getHfwFillerPhraseHits,
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues,
  normalizeHfwText
} from "../src/data/hfwQualityRules.js";
import {
  buildRuntimeQuestionsForSkill,
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const HFW_SKILL_IDS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

function questionId(question = {}) {
  return String(question.id || question.questionId || "(missing id)");
}

function formatOf(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
}

function isHfwSentenceQuestion(question = {}) {
  const format = formatOf(question);
  return isHfwClozeFormat(format) || isHfwSentenceSpellFormat(format);
}

function answerOf(question = {}) {
  return normalizeWord(question.answer || question.correctAnswer || question.targetWord || question.itemKey || "");
}

function skillIdOf(question = {}) {
  return String(question.skillId || question.assessmentSkillId || "").trim();
}

function sentenceWithBlankOf(question = {}) {
  return String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
}

function fullSentenceOf(question = {}) {
  return String(question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
}

function curatedTextKey(question = {}) {
  return [skillIdOf(question), answerOf(question), sentenceWithBlankOf(question), fullSentenceOf(question)].join("::").toLowerCase();
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
const examples = [];
const failures = [];
const failureRows = [];

for (const skillId of HFW_SKILL_IDS) {
  const rawRuntime = buildRuntimeQuestionsForSkill(skillId);
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const rawSentenceQuestions = rawRuntime.filter(isHfwSentenceQuestion);
  const selectableSentenceQuestions = selectable.filter(isHfwSentenceQuestion);
  const curatedRows = hfwCuratedSentences.filter(row => row.skillId === skillId);
  const rawSourceFailures = rawSentenceQuestions
    .map(question => ({ question, issues: curatedSourceIssues(question) }))
    .filter(row => row.issues.length);
  const selectableSourceFailures = selectableSentenceQuestions
    .map(question => ({ question, issues: curatedSourceIssues(question) }))
    .filter(row => row.issues.length);
  const bannedPhraseRows = rawSentenceQuestions
    .map(question => ({ question, phrases: getHfwFillerPhraseHits(question) }))
    .filter(row => row.phrases.some(phrase => HFW_ZERO_TOLERANCE_FILLER_PHRASES.has(phrase)));
  const weakGenericRows = rawSentenceQuestions
    .map(question => ({ question, issues: getWeakGenericHfwPromptIssues(question) }))
    .filter(row => row.issues.length);
  const ambiguousRows = rawSentenceQuestions
    .map(question => ({ question, issues: isHfwClozeFormat(formatOf(question)) ? getMultiplePlausibleHfwAnswerIssues(question) : [] }))
    .filter(row => row.issues.length);
  const targetWords = new Set(curatedRows.map(row => row.targetWord).filter(Boolean));
  const runtimeTargets = new Set(rawSentenceQuestions.map(answerOf).filter(Boolean));

  for (const row of [
    ...rawSourceFailures.map(item => ({ ...item, category: "non_workbook_source" })),
    ...selectableSourceFailures.map(item => ({ ...item, category: "active_non_workbook_source" })),
    ...bannedPhraseRows.map(item => ({ question: item.question, issues: item.phrases.map(phrase => `banned_phrase:${normalizeHfwText(phrase)}`), category: "banned_phrase" })),
    ...weakGenericRows.map(item => ({ ...item, category: "weak_generic_sentence" })),
    ...ambiguousRows.map(item => ({ ...item, category: "multiple_plausible_answers" }))
  ]) {
    failures.push(`${skillId}: ${row.category}: ${questionId(row.question)} (${row.issues.join(", ")})`);
    failureRows.push([
      skillId,
      row.category,
      questionId(row.question),
      answerOf(row.question),
      row.issues.join("; "),
      sentenceWithBlankOf(row.question)
    ]);
  }

  summaries.push({
    skillId,
    bandWords: HFW_WORD_BANDS[skillId]?.length || 0,
    curatedWorkbookRows: curatedRows.length,
    curatedWorkbookTargets: targetWords.size,
    rawRuntimeQuestions: rawRuntime.length,
    rawSentenceQuestions: rawSentenceQuestions.length,
    rawSentenceTargets: runtimeTargets.size,
    selectableQuestions: selectable.length,
    selectableSentenceQuestions: selectableSentenceQuestions.length,
    nonWorkbookRawRows: rawSourceFailures.length,
    nonWorkbookSelectableRows: selectableSourceFailures.length,
    bannedPhraseRows: bannedPhraseRows.length,
    weakGenericRows: weakGenericRows.length,
    ambiguousRows: ambiguousRows.length,
    status: rawSourceFailures.length || selectableSourceFailures.length || bannedPhraseRows.length || weakGenericRows.length || ambiguousRows.length
      ? "fail"
      : "pass"
  });

  for (const question of rawSentenceQuestions.slice(0, 3)) {
    examples.push([
      skillId,
      questionId(question),
      answerOf(question),
      sentenceWithBlankOf(question),
      question.sourceSheet || "",
      question.sourceRow || ""
    ]);
  }
}

const summaryRows = summaries.map(row => [
  row.skillId,
  row.bandWords,
  row.curatedWorkbookRows,
  row.curatedWorkbookTargets,
  row.rawSentenceQuestions,
  row.rawSentenceTargets,
  row.selectableSentenceQuestions,
  row.nonWorkbookRawRows,
  row.bannedPhraseRows,
  row.ambiguousRows,
  row.status
]);

const markdown = [
  "# HFW Curated Sentence Source Audit",
  "",
  "Generated by `npm run audit:hfw-curated-source`.",
  "",
  "## Summary",
  "",
  table([
    "Skill",
    "Band Words",
    "Curated Workbook Rows",
    "Curated Workbook Targets",
    "Runtime Sentence Rows",
    "Runtime Sentence Targets",
    "Selectable Sentence Rows",
    "Non-Workbook Raw Rows",
    "Banned Phrase Rows",
    "Ambiguous Rows",
    "Status"
  ], summaryRows),
  "",
  "## Workbook-Derived Examples",
  "",
  examples.length
    ? table(["Skill", "Question ID", "Target", "Sentence With Blank", "Source Sheet", "Source Row"], examples)
    : "None.",
  "",
  "## Failures",
  "",
  failureRows.length
    ? table(["Skill", "Category", "Question ID", "Target", "Issues", "Sentence"], failureRows)
    : "None.",
  ""
].join("\n");

const audit = {
  generatedBy: "npm run audit:hfw-curated-source",
  sourceWorkbook: "docs/imports/LiteracyPath_K5_Skill_Word_Bank_Through_Homophones.xlsx",
  sheets: [
    "HFW 1-25 Sentences",
    "HFW 26-50 Sentences",
    "HFW 51-75 Sentences",
    "HFW 76-100 Sentences"
  ],
  summaries,
  examples: examples.map(row => ({
    skillId: row[0],
    id: row[1],
    targetWord: row[2],
    sentenceWithBlank: row[3],
    sourceSheet: row[4],
    sourceRow: row[5]
  })),
  failures
};

writeFile(path.join(repoRoot, "docs/validation/hfw_curated_sentence_source_audit.md"), markdown);
writeFile(path.join(repoRoot, "docs/validation/hfw_curated_sentence_source_audit.json"), `${JSON.stringify(audit, null, 2)}\n`);

console.log("HFW curated sentence source audit");
console.table(summaries.map(row => ({
  skillId: row.skillId,
  curatedWorkbookRows: row.curatedWorkbookRows,
  runtimeSentenceRows: row.rawSentenceQuestions,
  nonWorkbookRawRows: row.nonWorkbookRawRows,
  bannedPhraseRows: row.bannedPhraseRows,
  ambiguousRows: row.ambiguousRows,
  status: row.status
})));
console.log("Wrote docs/validation/hfw_curated_sentence_source_audit.md");
console.log("Wrote docs/validation/hfw_curated_sentence_source_audit.json");

if (failures.length) {
  failures.slice(0, 80).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 80) console.error(`...and ${failures.length - 80} more`);
  process.exit(1);
}

console.log("HFW curated sentence source audit passed.");
