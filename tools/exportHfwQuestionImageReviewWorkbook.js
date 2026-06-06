import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

import { hfwQuestionImageReviewRows } from "../src/data/generated/hfwQuestionImageReview.generated.js";

const repoRoot = process.cwd();
const outXlsx = path.join(repoRoot, "docs/review/hfw_question_image_review.xlsx");
const outCsv = path.join(repoRoot, "docs/review/hfw_question_image_review.csv");
const bands = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

const columns = [
  ["qa_status", "qaStatus"],
  ["acceptable", "acceptable"],
  ["rejection_reason", "rejectionReason"],
  ["reviewer_notes", "reviewerNotes"],
  ["question_id", "questionId"],
  ["skill_id", "skillId"],
  ["band", "band"],
  ["level", "level"],
  ["phase", "phase"],
  ["target_word", "targetWord"],
  ["question_type", "questionType"],
  ["sentence_with_blank", "sentenceWithBlank"],
  ["full_sentence", "fullSentence"],
  ["correct_answer", "correctAnswer"],
  ["answer_choices", "answerChoicesText"],
  ["image_path", "currentImagePath"],
  ["image_preview_path", "currentImagePath"],
  ["image_role", "imageRole"],
  ["image_policy", "imagePolicy"],
  ["replacement_needed", "replacementNeeded"],
  ["kimi_prompt", "replacementPrompt"]
];

function acceptableFor(row = {}) {
  if (row.qaStatus === "approved") return "Y";
  if (["pending", "rejected", "needs_kimi"].includes(row.qaStatus)) return "N";
  return "";
}

function exportRow(row = {}) {
  return {
    ...row,
    acceptable: acceptableFor(row),
    replacementNeeded: ["rejected", "needs_kimi"].includes(row.qaStatus) ? "Y" : "N",
    answerChoicesText: Array.isArray(row.answerChoices) ? row.answerChoices.join(" | ") : ""
  };
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

fs.mkdirSync(path.dirname(outXlsx), { recursive: true });

const workbook = new ExcelJS.Workbook();
workbook.creator = "LiteracyPath";
workbook.created = new Date();

for (const band of bands) {
  const sheet = workbook.addWorksheet(band);
  sheet.columns = columns.map(([header, key]) => ({
    header,
    key,
    width: ["sentence_with_blank", "full_sentence", "kimi_prompt"].includes(header) ? 44 : 20
  }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + columns.length)}1`
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { wrapText: true, vertical: "top" };
  for (const row of hfwQuestionImageReviewRows.filter(item => item.skillId === band).map(exportRow)) {
    sheet.addRow(Object.fromEntries(columns.map(([, key]) => [key, row[key] ?? ""])));
  }
  sheet.eachRow(row => {
    row.alignment = { wrapText: true, vertical: "top" };
  });
}

await workbook.xlsx.writeFile(outXlsx);

const csvRows = [
  columns.map(([header]) => header),
  ...hfwQuestionImageReviewRows.map(row => {
    const out = exportRow(row);
    return columns.map(([, key]) => out[key] ?? "");
  })
];
fs.writeFileSync(outCsv, `${csvRows.map(row => row.map(csvEscape).join(",")).join("\n")}\n`);

console.log(JSON.stringify({
  rows: hfwQuestionImageReviewRows.length,
  workbook: path.relative(repoRoot, outXlsx),
  csv: path.relative(repoRoot, outCsv)
}, null, 2));
