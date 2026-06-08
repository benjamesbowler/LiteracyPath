import fs from "node:fs";
import path from "node:path";

import { skillTree } from "../src/skillTree.js";
import { loadAssessmentSkillBank } from "../src/data/loadAssessmentSkillBank.js";
import { repoRoot } from "./phonicsRuntimeUtils.js";

const outputMd = path.join(repoRoot, "docs/validation/answer_choice_image_completeness_audit.md");
const outputJson = path.join(repoRoot, "docs/validation/answer_choice_image_completeness_audit.json");

function imageValue(value) {
  if (!value || typeof value !== "object") return "";
  return value.image || value.imagePath || value.imageUrl || "";
}

function publicPathExists(assetPath = "") {
  if (String(assetPath).startsWith("data:image/")) return true;
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, "")))
  );
}

function answerChoiceImageRows(question = {}) {
  const rows = [];
  if (Array.isArray(question.imageCards) && question.imageCards.length) {
    question.imageCards.forEach((card, index) => rows.push({
      collection: "imageCards",
      index,
      label: card.word || card.value || card.label || card.text || "",
      image: imageValue(card)
    }));
  }
  if (Array.isArray(question.promptImageCards) && question.promptImageCards.length) {
    question.promptImageCards.forEach((card, index) => rows.push({
      collection: "promptImageCards",
      index,
      label: card.word || card.value || card.label || card.text || "",
      image: imageValue(card)
    }));
  }
  if (Array.isArray(question.answerOptions) && question.answerOptions.some(option => imageValue(option))) {
    question.answerOptions.forEach((option, index) => rows.push({
      collection: "answerOptions",
      index,
      label: option.word || option.value || option.label || option.text || "",
      image: imageValue(option)
    }));
  }
  for (const [label, asset] of Object.entries(question.choiceImages || {})) {
    rows.push({
      collection: "choiceImages",
      index: label,
      label,
      image: imageValue(asset)
    });
  }
  return rows;
}

function escape(value = "") {
  return String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escape).join(" | ")} |`)
  ].join("\n");
}

const failures = [];
const skillRows = [];

for (const skill of skillTree) {
  const questions = await loadAssessmentSkillBank(skill.id);
  let imageChoiceQuestions = 0;
  let imageChoiceRows = 0;
  for (const question of questions) {
    const rows = answerChoiceImageRows(question);
    if (!rows.length) continue;
    imageChoiceQuestions += 1;
    imageChoiceRows += rows.length;
    for (const row of rows) {
      if (!row.image || !publicPathExists(row.image)) {
        failures.push({
          skillId: skill.id,
          questionId: question.id || question.questionId || "(missing id)",
          collection: row.collection,
          choice: row.label || row.index,
          image: row.image || "(missing)"
        });
      }
    }
  }
  skillRows.push({
    skillId: skill.id,
    questions: questions.length,
    imageChoiceQuestions,
    imageChoiceRows,
    failures: failures.filter(row => row.skillId === skill.id).length
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  failures,
  skills: skillRows
};

fs.mkdirSync(path.dirname(outputMd), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outputMd, [
  "# Answer Choice Image Completeness Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Status: ${failures.length ? "FAIL" : "PASS"}`,
  "",
  "## Skill Summary",
  "",
  table(
    ["Skill", "Questions", "Image-choice questions", "Image-choice rows", "Failures"],
    skillRows.map(row => [row.skillId, row.questions, row.imageChoiceQuestions, row.imageChoiceRows, row.failures])
  ),
  "",
  "## Failures",
  "",
  failures.length
    ? table(
      ["Skill", "Question", "Collection", "Choice", "Image"],
      failures.slice(0, 200).map(row => [row.skillId, row.questionId, row.collection, row.choice, row.image])
    )
    : "None."
].join("\n"));

console.table([{ failures: failures.length, result: failures.length ? "FAIL" : "PASS" }]);
console.log(`Wrote ${path.relative(repoRoot, outputMd)}`);
if (failures.length) {
  console.error(`Answer choice image completeness failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("Answer choice image completeness passed.");
}
