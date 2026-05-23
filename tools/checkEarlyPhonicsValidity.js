import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../src/data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../src/data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../src/data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../src/data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../src/data/kimiDataset7RuntimeQuestions.js";
import { safeContentExpansionQuestions } from "../src/data/safeContentExpansionQuestions.js";
import { ixlStyleSeedQuestions } from "../src/data/ixlStyleSeedQuestions.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { skillTree } from "../src/skillTree.js";
import { getAssessmentContentIssues, isAssessmentContentValid } from "../src/assessmentContentValidation.js";
import { getAudioPronunciationIssues, getEarlyPhonicsValidityIssues } from "../src/data/earlyPhonicsValidation.js";
import { enrichInitialSoundPairQuestion } from "../src/data/initialSoundPairAssets.js";
import { enrichListenAndFindWordQuestion } from "../src/data/listenAndFindAssets.js";
import { applyQuestionFormatMetadata } from "../src/questionFormatFramework.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const banks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

const earlyStages = new Set([
  "Initial Sounds",
  "Final Sounds",
  "Rhyming",
  "CVC and Short Vowels",
  "Short Vowel Discrimination",
  "Blends",
  "Digraphs"
]);

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function stageFor(question) {
  const skill = normalize(question.skill || question.skillName);
  if (skill.includes("short vowel discrimination")) {
    return skillTree.find(stage => stage.label === "Short Vowel Discrimination");
  }
  const exact = skillTree.find(stage => normalize(stage.label) === skill);
  if (exact) return exact;
  return skillTree.find(stage =>
    stage.match.some(term => skill === normalize(term) || skill.includes(normalize(term)))
  );
}

function markdownTable(headers, rows) {
  const escapeCell = value => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

function answerValue(question) {
  if (Array.isArray(question.correctAnswers)) return question.correctAnswers.join("|");
  return question.answer || question.correctAnswer || "";
}

function targetWord(question) {
  return question.targetWord || question.audioText || question.imageKey || question.answer || question.correctAnswer || "";
}

function signature(question) {
  return `${normalize(question.prompt || question.question)}::${normalize(answerValue(question))}`;
}

const questions = banks.flatMap(([source, bank]) =>
  bank.map(question => ({
    ...applyQuestionFormatMetadata(enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question))),
    source
  }))
);

const earlyRows = questions
  .map(question => ({
    question,
    stage: stageFor(question),
    contentIssues: getAssessmentContentIssues(question),
    audioIssues: getAudioPronunciationIssues(question),
    phonicsIssues: getEarlyPhonicsValidityIssues(question)
  }))
  .filter(row => row.stage && earlyStages.has(row.stage.label));

const activeRows = earlyRows.filter(row => isAssessmentContentValid(row.question));
const invalidRows = earlyRows.filter(row => row.contentIssues.length > 0);
const audioFailures = earlyRows.filter(row => row.audioIssues.length > 0);
const phonicsFailures = earlyRows.filter(row => row.phonicsIssues.length > 0);

const summaryRows = [...earlyStages].map(stageLabel => {
  const rows = earlyRows.filter(row => row.stage.label === stageLabel);
  const active = rows.filter(row => isAssessmentContentValid(row.question));
  const audio = rows.filter(row => row.audioIssues.length > 0);
  const phonics = rows.filter(row => row.phonicsIssues.length > 0);
  const malformed = rows.filter(row => row.contentIssues.some(issue => /template|duplicate|missing|correct answer/i.test(issue)));
  const itemKeys = new Set(active.map(row => row.question.itemKey).filter(Boolean).map(normalize));

  return [
    stageLabel,
    active.length,
    audio.length,
    phonics.length,
    malformed.length,
    [...itemKeys].sort().join(", ") || "none"
  ];
});

function writeAudioDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "audio_pronunciation_failures.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const rows = audioFailures.map(({ question, stage, audioIssues }) => [
    question.id || "",
    stage.label,
    question.templateType || question.formatType || question.questionType || "",
    targetWord(question),
    question.audioKey || "",
    question.audioPath || "",
    question.source || "",
    audioIssues.join("; ")
  ]);

  const body = [
    "# Audio Pronunciation Failures",
    "",
    "Generated by `node tools/checkEarlyPhonicsValidity.js`.",
    "",
    "These questions are blocked from active runtime when their word-listening audio mapping does not point to approved whole-word audio.",
    "",
    `Failures found: ${rows.length}`,
    "",
    rows.length
      ? markdownTable(["Question ID", "Skill", "Template", "Target word", "Audio key", "Audio path", "Source file", "Failure reason"], rows)
      : "No whole-word audio pronunciation failures were found."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function writeEarlyDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "early_phonics_validity_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const invalidDetailRows = invalidRows.slice(0, 160).map(({ question, stage, contentIssues }) => [
    stage.label,
    question.id || "",
    question.source || "",
    question.itemKey || "",
    question.templateType || question.formatType || question.questionType || "",
    targetWord(question),
    contentIssues.join("; ")
  ]);

  const body = [
    "# Early Phonics Validity Audit",
    "",
    "Generated by `node tools/checkEarlyPhonicsValidity.js`.",
    "",
    "Early Initial Sounds are limited to the configured 25-target set `a b c d e f g h i j k l m n o p q r s t u v w y z` with no `x`. Early Final Sounds are limited to simple final single-letter phonemes; advanced endings are blocked for later phonics skills.",
    "",
    "## Summary",
    "",
    markdownTable(["Skill", "Active valid", "Excluded by audio", "Excluded by instructional level", "Excluded malformed/duplicate", "Active itemKeys"], summaryRows),
    "",
    "## Excluded / Flagged Details",
    "",
    invalidDetailRows.length
      ? markdownTable(["Skill", "Question ID", "Source", "ItemKey", "Template", "Target", "Issue"], invalidDetailRows)
      : "No early phonics validation failures were found."
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

function simulateRound(stageLabel) {
  const pool = activeRows
    .filter(row => row.stage.label === stageLabel)
    .map(row => row.question);
  const picked = [];
  const usedIds = new Set();
  const usedTargets = new Set();
  const usedKeys = new Set();
  const usedAnswers = new Set();
  const usedSignatures = new Set();
  const warnings = [];

  for (const question of pool) {
    if (picked.length >= 15) break;
    const target = normalize(targetWord(question));
    const key = normalize(question.itemKey || "");
    const answer = normalize(answerValue(question));
    const sig = signature(question);
    const duplicate =
      usedIds.has(question.id) ||
      (target && usedTargets.has(target)) ||
      (key && usedKeys.has(key)) ||
      (answer && usedAnswers.has(answer)) ||
      usedSignatures.has(sig);

    if (duplicate) continue;

    picked.push(question);
    usedIds.add(question.id);
    if (target) usedTargets.add(target);
    if (key) usedKeys.add(key);
    if (answer) usedAnswers.add(answer);
    usedSignatures.add(sig);
  }

  if (picked.length < 15) {
    warnings.push(`Only ${picked.length}/15 strict non-duplicate questions are available before a relaxed fallback would be needed.`);
  }

  return { picked, warnings };
}

function writeRoundDoc() {
  const docPath = path.join(rootDir, "docs", "validation", "round_selection_audit.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });

  const sections = [...earlyStages].map(stageLabel => {
    const { picked, warnings } = simulateRound(stageLabel);
    const rows = picked.map(question => [
      question.id || "",
      targetWord(question),
      question.itemKey || "",
      answerValue(question),
      signature(question)
    ]);

    return [
      `## ${stageLabel}`,
      "",
      warnings.length ? warnings.map(warning => `- Warning: ${warning}`).join("\n") : "- No duplicate warnings in simulated strict selection.",
      "",
      rows.length
        ? markdownTable(["Selected question ID", "Target word", "ItemKey", "Correct answer", "Prompt + answer signature"], rows)
        : "_No valid questions available for simulation._"
    ].join("\n");
  });

  const body = [
    "# Round Selection Audit",
    "",
    "Generated by `node tools/checkEarlyPhonicsValidity.js`.",
    "",
    "Runtime selection now rejects duplicate question IDs, target words, itemKeys, correct answers, and prompt+answer signatures inside a 15-question round whenever enough alternatives exist. This file simulates the strict pass for early phonics skills.",
    "",
    sections.join("\n\n")
  ].join("\n");

  fs.writeFileSync(docPath, `${body}\n`);
  return docPath;
}

const audioDoc = writeAudioDoc();
const earlyDoc = writeEarlyDoc();
const roundDoc = writeRoundDoc();

console.log(`Early phonics rows scanned: ${earlyRows.length}`);
console.log(`Active valid early phonics rows: ${activeRows.length}`);
console.log(`Audio pronunciation failures: ${audioFailures.length}`);
console.log(`Instructional-level failures: ${phonicsFailures.length}`);
console.log(`Content validation failures: ${invalidRows.length}`);
console.log(`Wrote ${path.relative(rootDir, audioDoc)}`);
console.log(`Wrote ${path.relative(rootDir, earlyDoc)}`);
console.log(`Wrote ${path.relative(rootDir, roundDoc)}`);
