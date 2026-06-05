import path from "node:path";

import {
  getHfwDirectAnswerLeakageIssues,
  getHfwAllowedFormatsForPhase,
  hfwPhaseKey,
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
import {
  HFW_FILLER_REUSE_THRESHOLD,
  HFW_ZERO_TOLERANCE_FILLER_PHRASES,
  getHfwFillerPhraseHits,
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues,
  normalizeHfwSentenceFrame
} from "../src/data/hfwQualityRules.js";

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

function skillIdOf(question = {}) {
  return String(question.skillId || question.assessmentSkillId || "").trim();
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

function sentenceFrameKey(question = {}) {
  return `${targetOf(question)}::${normalizeHfwSentenceFrame(question.sentence || question.visibleSentenceWithBlank || question.context || "")}`;
}

function answerOrderOnlyKey(question = {}) {
  return [
    targetOf(question),
    formatOf(question),
    promptContext(question),
    answerOf(question),
    answerSetKey(question)
  ].join("::");
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

function curatedTextKey(question = {}) {
  const visibleSentence = String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
  const fullSentence = String(question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
  return [skillIdOf(question), targetOf(question), visibleSentence, fullSentence].join("::").toLowerCase();
}

function curatedSourceIssues(question = {}) {
  const issues = [];
  const source = String(question.source || question.approvedSource || "").toLowerCase();
  if (!/(workbook|curated)/.test(source)) issues.push("source is not workbook/curated");
  if (!question.sentenceId) issues.push("missing sentenceId");
  if (question.sentenceId && !hfwCuratedSentenceIds.has(question.sentenceId)) {
    issues.push("sentenceId not in curated workbook bank");
  }
  if (!question.curatedContentKey) {
    issues.push("missing curatedContentKey");
  } else if (!hfwCuratedSentenceContentKeys.has(question.curatedContentKey)) {
    issues.push("curatedContentKey not in curated workbook bank");
  }
  if (!hfwCuratedSentenceTextKeys.has(curatedTextKey(question))) {
    issues.push("sentence text does not match curated workbook bank");
  }
  return issues;
}

function isHfwSentenceQuestion(question = {}) {
  const format = formatOf(question);
  return isHfwClozeFormat(format) || isHfwSentenceSpellFormat(format);
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
  issues.push(...curatedSourceIssues(question));
  issues.push(...getWeakGenericHfwPromptIssues(question));
  issues.push(...getMultiplePlausibleHfwAnswerIssues(question));
  return issues;
}

function directIssues(question = {}) {
  return getHfwDirectAnswerLeakageIssues(question);
}

function sentenceSpellIssues(question = {}) {
  const format = formatOf(question);
  if (!isHfwSentenceSpellFormat(format)) return [];
  const answer = answerOf(question);
  const sequence = Array.isArray(question.correctLetterSequence)
    ? question.correctLetterSequence.map(value => String(value || "").toLowerCase()).join("")
    : "";
  const tiles = Array.isArray(question.letterTiles) && question.letterTiles.length ? question.letterTiles : question.soundTiles;
  const sentence = String(question.visibleSentenceWithBlank || question.sentence || question.context || "");
  const audioText = String(question.sentenceAudio || question.sentenceText || question.fullSentence || question.spokenPrompt || "");
  const options = optionWords(question);
  const issues = [];
  if ((sentence.match(/___/g) || []).length !== 1) issues.push("not exactly one visible blank");
  if (sequence !== answer) issues.push("letter sequence does not spell answer");
  if (!Array.isArray(tiles) || tiles.length !== 12) issues.push("not twelve letter tiles");
  if (!audioText || !normalizeWord(audioText).split(/\s+/).includes(answer)) issues.push("sentence audio text missing answer context");
  if (options.length) issues.push("sentence spell should not use text answer choices");
  issues.push(...curatedSourceIssues(question));
  issues.push(...getWeakGenericHfwPromptIssues(question));
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
  const runtimeSentenceRows = runtime.filter(isHfwSentenceQuestion);
  const selectableSentenceRows = selectable.filter(isHfwSentenceQuestion);
  const curatedWorkbookRows = hfwCuratedSentences.filter(row => row.skillId === skillId);
  const rawCuratedSourceIssueRows = runtimeSentenceRows
    .map(question => ({ question, issues: curatedSourceIssues(question) }))
    .filter(row => row.issues.length);
  const selectableCuratedSourceIssueRows = selectableSentenceRows
    .map(question => ({ question, issues: curatedSourceIssues(question) }))
    .filter(row => row.issues.length);
  const rawBannedPhraseRows = runtimeSentenceRows
    .map(question => ({ question, phrases: getHfwFillerPhraseHits(question) }))
    .filter(row => row.phrases.some(phrase => HFW_ZERO_TOLERANCE_FILLER_PHRASES.has(phrase)));
  const rawAmbiguousRows = runtimeSentenceRows
    .map(question => ({ question, issues: isHfwClozeFormat(formatOf(question)) ? getMultiplePlausibleHfwAnswerIssues(question) : [] }))
    .filter(row => row.issues.length);
  const targets = new Set(selectable.map(targetOf).filter(Boolean));
  const templates = new Set(selectable.map(formatOf).filter(Boolean));
  const prompts = new Set(selectable.map(promptContext).filter(Boolean));
  const images = new Set(selectable.map(primaryImage).filter(Boolean));
  const answerSets = new Set(selectable.map(answerSetKey).filter(Boolean));
  const duplicateContent = duplicateGroups(selectable, contentKey);
  const duplicateTargetTemplate = duplicateGroups(selectable, targetTemplateKey);
  const duplicateTargetImage = duplicateGroups(selectable, targetImageKey);
  const duplicatePromptAnswer = duplicateGroups(selectable, promptAnswerKey);
  const repeatedSentenceFrames = duplicateGroups(selectable, sentenceFrameKey).filter(([, rows]) => rows.length > 2);
  const answerOrderOnlyVariants = duplicateGroups(selectable, answerOrderOnlyKey);
  const missingMedia = selectable.filter(question => !primaryImage(question) || !publicPathExists(primaryImage(question)));
  const invalidFormatRows = selectable.filter(question => !getHfwAllowedFormatsForPhase(levelOf(question), phaseOf(question)).includes(formatOf(question)));
  const clozeIssueRows = selectable
    .map(question => ({ question, issues: clozeIssues(question) }))
    .filter(row => row.issues.length);
  const directIssueRows = selectable
    .map(question => ({ question, issues: directIssues(question) }))
    .filter(row => row.issues.length);
  const sentenceSpellIssueRows = selectable
    .map(question => ({ question, issues: sentenceSpellIssues(question) }))
    .filter(row => row.issues.length);
  const fillerPhraseGroups = new Map();
  for (const question of selectable) {
    for (const phrase of getHfwFillerPhraseHits(question)) {
      const rows = fillerPhraseGroups.get(phrase) || [];
      rows.push(question);
      fillerPhraseGroups.set(phrase, rows);
    }
  }
  const fillerPhraseRows = [...fillerPhraseGroups.entries()]
    .map(([phrase, rows]) => ({
      phrase,
      rows,
      isFailure: HFW_ZERO_TOLERANCE_FILLER_PHRASES.has(phrase) || rows.length > HFW_FILLER_REUSE_THRESHOLD
    }))
    .filter(row => row.isFailure);

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
    ...repeatedSentenceFrames.map(([key, rows]) => `repeated_sentence_frame ${rows.length} times: ${key}`),
    ...answerOrderOnlyVariants.map(([key, rows]) => `answer_order_only_variants ${rows.length} times: ${key}`),
    ...missingMedia.map(question => `missing media: ${questionId(question)}`),
    ...invalidFormatRows.map(question => `invalid phase format: ${questionId(question)} ${formatOf(question)}`),
    ...rawCuratedSourceIssueRows.map(row => `non_curated_hfw_sentence_source: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...selectableCuratedSourceIssueRows.map(row => `active_non_curated_hfw_sentence_source: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...rawBannedPhraseRows.map(row => `banned_hfw_sentence_phrase: ${questionId(row.question)} (${row.phrases.join(", ")})`),
    ...rawAmbiguousRows.map(row => `raw_multiple_plausible_answers: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...clozeIssueRows.map(row => `multiple_plausible_answers: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...fillerPhraseRows.map(row => `filler_phrase_reuse: "${row.phrase}" used ${row.rows.length} times by ${row.rows.map(questionId).slice(0, 10).join(", ")}${row.rows.length > 10 ? "..." : ""}`),
    ...directIssueRows.map(row => `direct_answer_leakage: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...sentenceSpellIssueRows.map(row => `sentence spell issue: ${questionId(row.question)} (${row.issues.join(", ")})`),
    ...PHASE_KEYS.filter(phaseKey => phaseCounts[phaseKey] < ROUND_LENGTH).map(phaseKey => `${phaseKey} below ${ROUND_LENGTH} selectable questions`),
    ...PHASE_KEYS.filter(phaseKey => retryCounts[phaseKey] < REPLACEMENTS_NEEDED).map(phaseKey => `${phaseKey} has only ${retryCounts[phaseKey]}/${REPLACEMENTS_NEEDED} retry-safe replacements`)
  ];

  failureRows.push(...failures.map(failure => [skillId, failure]));
  summaries.push([
    skillId,
    runtime.length,
    selectable.length,
    HFW_WORD_BANDS[skillId]?.length || 0,
    curatedWorkbookRows.length,
    runtimeSentenceRows.length,
    rawCuratedSourceIssueRows.length,
    rawBannedPhraseRows.length,
    rawAmbiguousRows.length,
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
    directIssueRows.length,
    sentenceSpellIssueRows.length,
    missingMedia.length,
    failures.length ? "fail" : "pass"
  ]);

  reports.push({
    skillId,
    runtime: runtime.length,
    selectable: selectable.length,
    bandWords: HFW_WORD_BANDS[skillId]?.length || 0,
    curatedWorkbookRows: curatedWorkbookRows.length,
    runtimeSentenceRows: runtimeSentenceRows.length,
    selectableSentenceRows: selectableSentenceRows.length,
    nonCuratedRuntimeSentenceRows: rawCuratedSourceIssueRows.length,
    nonCuratedSelectableSentenceRows: selectableCuratedSourceIssueRows.length,
    bannedPhraseRuntimeRows: rawBannedPhraseRows.length,
    ambiguousRuntimeSentenceRows: rawAmbiguousRows.length,
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
      promptAnswer: duplicatePromptAnswer.length,
      repeatedSentenceFrame: repeatedSentenceFrames.length,
      answerOrderOnlyVariants: answerOrderOnlyVariants.length
    },
    fillerPhraseReuse: fillerPhraseRows.map(row => ({
      phrase: row.phrase,
      uses: row.rows.length,
      questionIds: row.rows.map(questionId),
      targetWords: [...new Set(row.rows.map(targetOf).filter(Boolean))],
      skillBand: skillId
    })),
    invalidFormats: invalidFormatRows.length,
    clozeIssues: clozeIssueRows.length,
    directAnswerLeakage: directIssueRows.length,
    sentenceSpellIssues: sentenceSpellIssueRows.length,
    missingMedia: missingMedia.length,
    failures
  });
}

const markdown = [
  "# HFW True Variation Audit",
  "",
  "Generated by `npm run check:hfw-true-variation`.",
  "",
  "## Categories",
  "",
  "- direct_answer_leakage",
  "- filler_phrase_reuse",
  "- repeated_sentence_frame",
  "- multiple_plausible_answers",
  "- weak_generic_prompt",
  "- answer_order_only_variants",
  "",
  "## Summary",
  "",
  table([
    "Skill",
    "Runtime",
    "Selectable",
    "Band Words",
    "Curated Workbook Rows",
    "Runtime Sentence Rows",
    "Non-Curated Runtime Rows",
    "Banned Phrase Rows",
    "Ambiguous Raw Rows",
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
    "Direct Answer Leakage",
    "Sentence Spell Issues",
    "Missing Media",
    "Status"
  ], summaries),
  "",
  "## Phase Detail",
  "",
  table(["Skill", "Phase", "Selectable", "Sampled Round", "Retry-Safe Replacements", "Targets", "Templates"], phaseRows),
  "",
  "## Filler Phrase Reuse",
  "",
  reports.some(report => report.fillerPhraseReuse.length)
    ? table(
      ["Skill Band", "Phrase", "Uses", "Target Words", "Affected Question IDs"],
      reports.flatMap(report => report.fillerPhraseReuse.map(row => [
        row.skillBand,
        row.phrase,
        row.uses,
        row.targetWords.join(", "),
        row.questionIds.slice(0, 20).join(", ") + (row.questionIds.length > 20 ? ", ..." : "")
      ]))
    )
    : "None.",
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
  curatedWorkbookRows: row[4],
  nonCuratedRuntimeRows: row[6],
  bannedPhraseRows: row[7],
  ambiguousRawRows: row[8],
  uniqueTargets: row[9],
  uniqueTemplates: row[10],
  uniquePrompts: row[11],
  uniqueImages: row[12],
  status: row[24]
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
