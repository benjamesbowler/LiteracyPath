import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getAssessmentSkillGroup,
  loadHfwAssessmentBank
} from "../src/data/loadAssessmentSkillBank.js";
import {
  HFW_ALLOWED_FORMATS
} from "../src/data/hfwRuntimeEligibility.js";
import {
  HFW_WORD_BANDS,
  getHfwBandWords
} from "../src/data/highFrequencyWordBands.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(repoRoot, "docs", "validation", "high_frequency_words_coverage_audit.md");
const roundLength = 15;
const skillIds = Object.keys(HFW_WORD_BANDS);

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levelOf(question = {}) {
  return Number(question.level || question.assessmentLevel || question.difficultyLevel || 1) >= 2 ? 2 : 1;
}

function formatOf(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function targetOf(question = {}) {
  return normalize(question.targetWord || question.itemKey || question.correctAnswer || question.answer);
}

function choicesOf(question = {}) {
  const raw = question.answerOptions?.length
    ? question.answerOptions
    : question.options?.length
      ? question.options
      : question.choices || [];
  return raw.map(choice => normalize(
    choice && typeof choice === "object"
      ? choice.value || choice.word || choice.label || choice.text || choice.answer
      : choice
  )).filter(Boolean);
}

function table(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function sampleRound(items = [], level = 1) {
  const selected = [];
  const usedTargets = new Set();
  for (const question of items.filter(item => levelOf(item) === level)) {
    const target = targetOf(question);
    if (!target || usedTargets.has(target)) continue;
    usedTargets.add(target);
    selected.push(question);
    if (selected.length === roundLength) break;
  }
  return selected;
}

const failures = [];
const summaryRows = [];
const perTargetRows = [];
const sampleRows = [];
let totalQuestions = 0;
const totalTargets = new Set();

for (const skillId of skillIds) {
  const configuredWords = getHfwBandWords(skillId).map(normalize);
  const configuredWordSet = new Set(configuredWords);
  const questions = await loadHfwAssessmentBank(skillId);
  const questionIds = questions.map(question => String(question.id || question.questionId || "")).filter(Boolean);
  const targets = new Set(questions.map(targetOf).filter(Boolean));
  const levelOne = questions.filter(question => levelOf(question) === 1);
  const levelTwo = questions.filter(question => levelOf(question) === 2);
  const levelOneRound = sampleRound(questions, 1);
  const levelTwoRound = sampleRound(questions, 2);
  const missingTargets = configuredWords.filter(word => !targets.has(word));
  const outsideTargets = [...targets].filter(word => !configuredWordSet.has(word));
  const missingByLevel = { 1: [], 2: [] };

  totalQuestions += questions.length;
  targets.forEach(target => totalTargets.add(target));

  if (getAssessmentSkillGroup(skillId) !== "hfw") {
    failures.push(`${skillId}: assessment routing is not the HFW group.`);
  }
  if (configuredWords.length !== 25 || configuredWordSet.size !== 25) {
    failures.push(`${skillId}: approved curriculum must contain 25 unique words, found ${configuredWordSet.size}.`);
  }
  if (missingTargets.length) {
    failures.push(`${skillId}: live runtime has no question for ${missingTargets.join(", ")}.`);
  }
  if (outsideTargets.length) {
    failures.push(`${skillId}: live runtime exposes words outside the approved band: ${outsideTargets.join(", ")}.`);
  }
  if (levelOneRound.length !== roundLength || levelTwoRound.length !== roundLength) {
    failures.push(`${skillId}: cannot build a ${roundLength}-question round at both levels.`);
  }
  if (new Set(questionIds).size !== questionIds.length) {
    failures.push(`${skillId}: live runtime contains duplicate question IDs.`);
  }

  for (const word of configuredWords) {
    const wordRows = questions.filter(question => targetOf(question) === word);
    const levelOneCount = wordRows.filter(question => levelOf(question) === 1).length;
    const levelTwoCount = wordRows.filter(question => levelOf(question) === 2).length;
    if (!levelOneCount) missingByLevel[1].push(word);
    if (!levelTwoCount) missingByLevel[2].push(word);
    perTargetRows.push([skillId, word, levelOneCount, levelTwoCount, levelOneCount + levelTwoCount]);
  }

  for (const level of [1, 2]) {
    if (missingByLevel[level].length) {
      failures.push(`${skillId}: Level ${level} has no live question for ${missingByLevel[level].join(", ")}.`);
    }
  }

  for (const question of questions) {
    const id = question.id || question.questionId || "(missing id)";
    const target = targetOf(question);
    const answer = normalize(question.correctAnswer || question.answer);
    const choices = choicesOf(question);
    const format = formatOf(question);
    if (!id || id === "(missing id)") failures.push(`${skillId}: a live question is missing its ID.`);
    if (question.source !== "approved_hfw_workbook") failures.push(`${skillId}/${id}: source is not the approved HFW workbook.`);
    if (!HFW_ALLOWED_FORMATS.has(format)) failures.push(`${skillId}/${id}: format ${format} is not HFW-safe.`);
    if (!target || !configuredWordSet.has(target)) failures.push(`${skillId}/${id}: target "${target}" is not in the approved band.`);
    if (answer !== target) failures.push(`${skillId}/${id}: answer "${answer}" does not match target "${target}".`);
    if (levelOf(question) === 1) {
      if (choices.length !== 4 || new Set(choices).size !== 4 || !choices.includes(answer)) {
        failures.push(`${skillId}/${id}: Level 1 choices are not four unique options containing the answer.`);
      }
    }
    if (question.audio || question.audioUrl || question.audioPath) {
      failures.push(`${skillId}/${id}: no-audio HFW question exposes a playable audio path.`);
    }
  }

  summaryRows.push([
    skillId,
    configuredWordSet.size,
    questions.length,
    targets.size,
    levelOne.length,
    levelTwo.length,
    `${levelOneRound.length}/${roundLength}`,
    `${levelTwoRound.length}/${roundLength}`,
    missingTargets.length
  ]);
  for (const [level, rows] of [[1, levelOneRound], [2, levelTwoRound]]) {
    sampleRows.push(...rows.map(question => [
      skillId,
      level,
      question.id || question.questionId,
      targetOf(question),
      formatOf(question)
    ]));
  }
}

if (totalTargets.size !== 100) {
  failures.push(`Live HFW runtime covers ${totalTargets.size}/100 unique approved words.`);
}

const report = `# High-Frequency Words Coverage Audit

Generated: ${new Date().toISOString()}

This audit reads the same published, eligibility-filtered HFW banks used by a live assessment. It does not count legacy or non-published question files.

## Summary

- Approved bands: ${skillIds.length}
- Approved words: ${Object.values(HFW_WORD_BANDS).flat().length}
- Live eligible questions: ${totalQuestions}
- Live unique targets: ${totalTargets.size}/100
- Structural failures: ${failures.length}

${table(
    ["Skill", "Approved words", "Live questions", "Live targets", "Level 1", "Level 2", "L1 round", "L2 round", "Missing targets"],
    summaryRows
  )}

## Coverage by target

${table(["Skill", "Word", "Level 1 questions", "Level 2 questions", "Total"], perTargetRows)}

## Deterministic sample rounds

${table(["Skill", "Level", "Question ID", "Target", "Format"], sampleRows)}

## Failures

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "_None._"}
`;

fs.writeFileSync(reportPath, report);
console.log(`High-Frequency Words live questions: ${totalQuestions}`);
console.log(`High-Frequency Words live targets: ${totalTargets.size}/100`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("High-Frequency Words coverage audit passed.");
