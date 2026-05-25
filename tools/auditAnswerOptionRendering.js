import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getQuestionChoices,
  getSkillBankItems,
  runtimeQuestionSources
} from "../src/content/skillMedia/skillAssetRegistry.js";
import {
  getAnswerOptionLabel,
  getAnswerOptionValue
} from "../src/utils/answerOptions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function markdownTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function getVisibleOptions(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  if (Array.isArray(question.imageCards) && question.imageCards.length) return question.imageCards;
  return [];
}

function getCorrectAnswer(question = {}, skillItem = {}) {
  return question.correctAnswer ?? question.answer ?? skillItem.correctAnswer ?? "";
}

function getCorrectTokens(question = {}, skillItem = {}) {
  return [
    ...(Array.isArray(question.correctWords) ? question.correctWords : []),
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : []),
    getCorrectAnswer(question, skillItem)
  ]
    .flatMap(value => String(value || "").split("|"))
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function isImageOnlyQuestion(question = {}) {
  return question.imageOnly === true || question.hideWrittenLabels === true;
}

const skillItems = getSkillBankItems().filter(item => item.active !== false);
const renderingFailures = [];
const imageOnlyRows = [];
const fixedRenderRows = [];
const runtimeWarnings = [];

for (const item of skillItems) {
  const question = item.raw || {};
  const options = item.answerOptions?.length ? item.answerOptions : getVisibleOptions(question);
  if (!options.length) continue;

  const labels = options.map(getAnswerOptionLabel);
  const values = options.map(option => getAnswerOptionValue(option) || getAnswerOptionLabel(option));
  const missing = options
    .map((option, index) => ({ option, index, label: labels[index], value: values[index] }))
    .filter(option => !option.label);
  const correctTokens = [...new Set(getCorrectTokens(question, item))];

  if (isImageOnlyQuestion(question)) {
    imageOnlyRows.push([
      item.id,
      item.skillId,
      question.questionType || question.templateType || "unknown",
      labels.filter(Boolean).join(", ") || "(no text labels)"
    ]);
  }

  if (missing.length) {
    renderingFailures.push([
      item.id,
      item.skillId,
      item.source,
      `Missing visible label for option indexes: ${missing.map(option => option.index).join(", ")}`
    ]);
  }

  if (!isImageOnlyQuestion(question)) {
    correctTokens.forEach(token => {
      const correctCount = labels.filter(label => label.toLowerCase() === token).length;
      if (correctCount !== 1) {
        renderingFailures.push([
          item.id,
          item.skillId,
          item.source,
          `Correct answer "${token}" should resolve to one visible option label, found ${correctCount}.`
        ]);
      }
    });
  }

  if (options.some(option => option && typeof option === "object") && labels.every(Boolean)) {
    fixedRenderRows.push([
      item.id,
      item.skillId,
      item.source,
      labels.join(", ")
    ]);
  }
}

for (const question of runtimeQuestionSources) {
  const options = getVisibleOptions(question);
  if (!options.length) continue;
  const labels = options.map(getAnswerOptionLabel);
  if (labels.some(label => !label) && !isImageOnlyQuestion(question)) {
    runtimeWarnings.push([
      question.id || "(missing id)",
      question.skill || question.skillId || "(missing skill)",
      question.questionType || question.templateType || "unknown",
      "Runtime source includes an option that cannot resolve to visible text."
    ]);
  }
}

const doc = `# Answer Option Rendering Audit

Generated: ${new Date().toISOString()}

This audit checks that active assessment answer options resolve to visible labels for buttons/cards. Image-only questions must opt in explicitly with \`imageOnly\` or \`hideWrittenLabels\`.

## Summary

- Active skill-bank items checked: ${skillItems.length}
- Active label failures: ${renderingFailures.length}
- Explicit image-only questions: ${imageOnlyRows.length}
- Object-option render cases covered by shared helper: ${fixedRenderRows.length}
- Runtime source warnings: ${runtimeWarnings.length}

## Active Label Failures

${markdownTable(["question id", "skill", "source", "issue"], renderingFailures)}

## Explicit Image-Only Questions

${markdownTable(["question id", "skill", "template", "resolved labels"], imageOnlyRows.slice(0, 120))}

## Object Options Covered By Shared Label Helper

${markdownTable(["question id", "skill", "source", "visible labels"], fixedRenderRows.slice(0, 160))}

## Runtime Source Warnings

${markdownTable(["question id", "skill", "template", "warning"], runtimeWarnings)}
`;

write(path.join(rootDir, "docs", "validation", "answer_option_rendering_audit.md"), doc);

console.log(`Active skill-bank items checked: ${skillItems.length}`);
console.log(`Active label failures: ${renderingFailures.length}`);
console.log("Wrote docs/validation/answer_option_rendering_audit.md");

if (renderingFailures.length) {
  renderingFailures.forEach(row => console.error(`- ${row[0]}: ${row[3]}`));
  process.exit(1);
}

console.log("Answer option rendering audit passed.");
