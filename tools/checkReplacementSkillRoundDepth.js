import path from "node:path";

import { getAssessmentContentIssues } from "../src/assessmentContentValidation.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import {
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const ROUND_LENGTH = 15;
const REQUIRED_STEPS = ["L1P1", "L1P2", "L2P1", "L2P2"];

const SKILLS = [
  { id: "hfw_1_25", label: "High-Frequency Words 1-25", minTotal: 60, forbidQuestionAudio: true },
  { id: "hfw_26_50", label: "High-Frequency Words 26-50", minTotal: 60, forbidQuestionAudio: true },
  { id: "hfw_51_75", label: "High-Frequency Words 51-75", minTotal: 60, forbidQuestionAudio: true },
  { id: "hfw_76_100", label: "High-Frequency Words 76-100", minTotal: 60, forbidQuestionAudio: true },
  { id: "blends", label: "Blends", minTotal: 60 },
  { id: "digraphs", label: "Digraphs", minTotal: 60, requireDigraphMedia: true },
  { id: "long_vowels_silent_e", label: "Long Vowels and Silent E", minTotal: 60 },
  { id: "nouns", label: "Nouns", minTotal: 60, allowAnswerOptionAudio: true },
  { id: "verbs", label: "Verbs", minTotal: 60, allowAnswerOptionAudio: true },
  { id: "adjectives", label: "Adjectives", minTotal: 60, allowAnswerOptionAudio: true }
];

function stepKey(question = {}) {
  const level = Number(question.level || question.assessmentLevel || question.difficulty || 1) >= 2 ? 2 : 1;
  const phase = Number(question.phase || question.assessmentPhase || 1) === 2 ? 2 : 1;
  return `L${level}P${phase}`;
}

function questionAudioFields(question = {}) {
  return [
    question.audioPath,
    question.audioUrl,
    question.audioText,
    question.spokenPrompt
  ].filter(Boolean);
}

function optionAudioCount(question = {}) {
  return (question.answerOptions || []).filter(option =>
    option?.audio || option?.audioPath || option?.audioUrl
  ).length;
}

function mediaPaths(question = {}) {
  return [
    question.imagePath,
    question.imageUrl,
    question.targetImage,
    question.targetImagePath,
    question.audioPath,
    question.audioUrl,
    ...(question.imageCards || []).flatMap(card => [card.image, card.imagePath, card.imageUrl, card.audio, card.audioPath, card.audioUrl])
  ].filter(Boolean);
}

function table(headers, rows) {
  return [
    `| ${headers.join(" |")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

const failures = [];
const summaryRows = [];
const detailRows = [];

for (const skill of SKILLS) {
  const questions = selectableRuntimeQuestionsForSkill(skill.id);
  const signatures = questions.map(question => getQuestionSignature(question));
  const duplicateSignatureCount = signatures.length - new Set(signatures).size;
  const contentIssueRows = questions
    .map(question => [question.id, getAssessmentContentIssues(question, {})])
    .filter(([, issues]) => issues.length);
  const questionAudioRows = questions.filter(question => questionAudioFields(question).length);
  const answerOptionAudioRows = questions.filter(question => optionAudioCount(question));
  const missingMediaRows = skill.requireDigraphMedia
    ? questions.filter(question => mediaPaths(question).some(item => String(item).startsWith("/") && !publicPathExists(item)))
    : [];

  const byStep = REQUIRED_STEPS.reduce((counts, key) => ({
    ...counts,
    [key]: questions.filter(question => stepKey(question) === key).length
  }), {});

  if (questions.length < skill.minTotal) failures.push(`${skill.label}: ${questions.length} selectable, expected at least ${skill.minTotal}`);
  for (const key of REQUIRED_STEPS) {
    if (byStep[key] < ROUND_LENGTH) failures.push(`${skill.label}: ${key} has ${byStep[key]} questions, expected at least ${ROUND_LENGTH}`);
  }
  if (duplicateSignatureCount) failures.push(`${skill.label}: ${duplicateSignatureCount} duplicate runtime signatures`);
  if (contentIssueRows.length) failures.push(`${skill.label}: ${contentIssueRows.length} content issue rows`);
  if (skill.forbidQuestionAudio && questionAudioRows.length) failures.push(`${skill.label}: ${questionAudioRows.length} HFW rows include question audio`);
  if (!skill.allowAnswerOptionAudio && answerOptionAudioRows.length) failures.push(`${skill.label}: ${answerOptionAudioRows.length} rows include answer-option audio`);
  if (missingMediaRows.length) failures.push(`${skill.label}: ${missingMediaRows.length} rows reference missing imported media`);

  summaryRows.push([
    skill.label,
    questions.length,
    Object.entries(byStep).map(([key, count]) => `${key}: ${count}`).join(", "),
    new Set(signatures).size,
    contentIssueRows.length,
    questionAudioRows.length,
    answerOptionAudioRows.length,
    missingMediaRows.length
  ]);

  for (const key of REQUIRED_STEPS) {
    const rows = questions.filter(question => stepKey(question) === key);
    detailRows.push([
      skill.label,
      key,
      rows.length,
      [...new Set(rows.map(question => question.targetPattern || question.phonicsPattern || question.itemKey || question.targetWord).filter(Boolean))].join(", ")
    ]);
  }
}

const markdown = `# Replacement Skill Round Depth Audit

Generated: ${new Date().toISOString()}

## Summary

${table(["Skill", "Selectable", "Level/phase counts", "Unique signatures", "Content issues", "Question audio rows", "Answer audio rows", "Missing media rows"], summaryRows)}

## Level/Phase Detail

${table(["Skill", "Step", "Questions", "Targets/patterns"], detailRows)}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "_None._"}
`;

writeFile(path.join(repoRoot, "docs/validation/replacement_skill_round_depth_audit.md"), markdown);

console.log("Replacement Skill Round Depth Audit");
console.table(summaryRows.map(row => ({
  skill: row[0],
  selectable: row[1],
  steps: row[2],
  uniqueSignatures: row[3],
  contentIssues: row[4],
  questionAudioRows: row[5],
  answerAudioRows: row[6],
  missingMediaRows: row[7]
})));
console.log(`Fatal replacement-depth failures: ${failures.length}`);
console.log("Wrote docs/validation/replacement_skill_round_depth_audit.md");

if (failures.length) {
  console.error(failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}
