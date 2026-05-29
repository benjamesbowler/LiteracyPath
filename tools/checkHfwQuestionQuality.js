import path from "node:path";

import { getHfwRuntimeEligibilityIssues, HFW_ALLOWED_FORMATS } from "../src/data/hfwRuntimeEligibility.js";
import { getHfwBandWords } from "../src/data/highFrequencyWordBands.js";
import {
  buildRuntimeQuestionsForSkill,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const hfwSkillIds = ["hfw_1_25", "hfw_26_50", "hfw_51_100"];
const weakPromptPattern = /\b(find the word|which word is|find word)\s*:?\s*["“”']?[a-z]+\b/i;
const audioFormats = new Set(["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"]);

function format(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function options(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function optionValue(option) {
  if (option && typeof option === "object") return option.value || option.word || option.label || option.text || option.answer || "";
  return option;
}

function prompt(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" ");
}

function targetWord(question = {}) {
  return String(question.targetWord || question.audioText || question.itemKey || question.answer || question.correctAnswer || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

const summaryRows = [];
const rejectionRows = [];
const formatRows = [];
const failures = [];

for (const skillId of hfwSkillIds) {
  const all = buildRuntimeQuestionsForSkill(skillId);
  const runtime = selectableRuntimeQuestionsForSkill(skillId);
  const bandWords = getHfwBandWords(skillId);
  const formats = new Map();
  const runtimeWords = new Set(runtime.map(targetWord).filter(Boolean));

  for (const question of runtime) {
    const questionFormat = format(question);
    formats.set(questionFormat, (formats.get(questionFormat) || 0) + 1);
    const issues = [];
    const questionOptions = options(question).map(optionValue).filter(Boolean);
    if (!HFW_ALLOWED_FORMATS.has(questionFormat)) issues.push(`${questionFormat} is not allowed`);
    if (questionOptions.length !== 4) issues.push(`expected 4 options, found ${questionOptions.length}`);
    if (weakPromptPattern.test(prompt(question))) issues.push("weak printed-target find-word prompt");
    if (audioFormats.has(questionFormat) && prompt(question).toLowerCase().split(/\s+/).includes(targetWord(question))) {
      issues.push("audio recognition prompt prints target word");
    }
    issues.push(...getHfwRuntimeEligibilityIssues(question, skillId, { pathExists: publicPathExists }));
    if (issues.length) {
      failures.push(`${skillId} ${question.id}: ${[...new Set(issues)].join("; ")}`);
    }
  }

  const rejected = all
    .filter(question => targetWord(question) && !runtime.some(item => item.id === question.id))
    .slice(0, 60);
  for (const question of rejected) {
    const issues = getHfwRuntimeEligibilityIssues(question, skillId, { pathExists: publicPathExists });
    if (weakPromptPattern.test(prompt(question))) issues.push("weak printed-target find-word prompt");
    if (issues.length) {
      rejectionRows.push([
        skillId,
        question.id,
        format(question),
        targetWord(question),
        prompt(question),
        [...new Set(issues)].join("; ")
      ]);
    }
  }

  summaryRows.push([
    skillId,
    bandWords.length,
    runtime.length,
    runtimeWords.size,
    runtime.length >= 30 ? "yes" : "no",
    [...formats.entries()].map(([key, count]) => `${key}: ${count}`).join("<br>")
  ]);
  for (const [key, count] of formats.entries()) {
    formatRows.push([skillId, key, count]);
  }
}

const markdown = `# HFW Question Quality Audit

Generated: ${new Date().toISOString()}

## Summary

- Fatal HFW runtime quality failures: ${failures.length}
- Checked bands: ${hfwSkillIds.join(", ")}
- Weak printed-target prompts are blocked from live HFW runtime.

${table(["Skill", "Band words", "Runtime questions", "Runtime target words", "30+ ready?", "Formats"], summaryRows)}

## Runtime Format Counts

${formatRows.length ? table(["Skill", "Format", "Runtime count"], formatRows) : "_None._"}

## Rejected / Quarantined Examples

${rejectionRows.length ? table(["Skill", "Question ID", "Format", "Target", "Prompt", "Reason"], rejectionRows) : "_None._"}
`;

writeFile(path.join(repoRoot, "docs/validation/hfw_question_quality_audit.md"), markdown);

console.log("HFW Question Quality Audit");
console.table(summaryRows.map(([skillId, bandWords, runtime, targets, ready]) => ({ skillId, bandWords, runtime, targets, ready })));
console.log(`Fatal HFW runtime quality failures: ${failures.length}`);
console.log("Wrote docs/validation/hfw_question_quality_audit.md");

if (failures.length) {
  console.error(failures.slice(0, 40).map(item => `- ${item}`).join("\n"));
  process.exit(1);
}
