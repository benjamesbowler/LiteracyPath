import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { getHfwDirectAnswerLeakageIssues } from "../src/data/hfwAssessmentFormatConfig.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  getHfwFillerPhraseHits,
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues,
  normalizeHfwSentenceFrame,
  normalizeHfwText
} from "../src/data/hfwQualityRules.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(repoRoot, "docs", "review");
const workbookPath = path.join(outputDir, "hfw_question_review.xlsx");
const csvPath = path.join(outputDir, "hfw_question_review.csv");
const HFW_SKILLS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

const columns = [
  "acceptable",
  "review_notes",
  "delete_reason",
  "skill_id",
  "band",
  "level",
  "phase",
  "question_id",
  "question_type",
  "target_word",
  "prompt",
  "sentence_with_blank",
  "full_sentence",
  "answer_choices",
  "correct_answer",
  "letter_tiles",
  "correct_letter_sequence",
  "image_path",
  "audio_path",
  "template_key",
  "content_key",
  "target_template_key",
  "source",
  "source_sheet",
  "generator_notes",
  "possible_problem_flags"
];

function valueOf(option) {
  if (option && typeof option === "object") return option.value || option.word || option.label || option.text || "";
  return option || "";
}

function optionWords(question = {}) {
  return [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ].map(valueOf).map(value => String(value || "").trim()).filter(Boolean);
}

function answerOf(question = {}) {
  return String(question.answer || question.correctAnswer || question.targetWord || "").trim();
}

function sentenceOf(question = {}) {
  return String(question.visibleSentenceWithBlank || question.sentence || question.context || "");
}

function fullSentenceOf(question = {}) {
  return String(question.fullSentence || question.sentenceText || sentenceOf(question).replace("___", answerOf(question)));
}

function templateOf(question = {}) {
  return String(question.templateType || question.formatType || question.questionType || "");
}

function contentKey(question = {}) {
  return [
    question.targetWord || "",
    templateOf(question),
    normalizeHfwText(sentenceOf(question)),
    answerOf(question),
    optionWords(question).map(normalizeHfwText).sort().join("|"),
    question.imagePath || question.imageUrl || ""
  ].filter(Boolean).join("::");
}

function targetTemplateKey(question = {}) {
  return `${question.targetWord || ""}::${templateOf(question)}`;
}

function bandLabel(skillId = "") {
  return skillId.replace("hfw_", "").replace("_", "-");
}

function sourceSheet(question = {}) {
  return `HFW ${bandLabel(question.skillId)}`;
}

function repeatedMaps(questions) {
  const maps = {
    content: new Map(),
    targetTemplate: new Map(),
    frame: new Map()
  };
  for (const question of questions) {
    const keys = {
      content: contentKey(question),
      targetTemplate: targetTemplateKey(question),
      frame: `${question.targetWord || ""}::${normalizeHfwSentenceFrame(sentenceOf(question))}`
    };
    for (const [name, key] of Object.entries(keys)) {
      const rows = maps[name].get(key) || [];
      rows.push(question.id);
      maps[name].set(key, rows);
    }
  }
  return maps;
}

function problemFlags(question, maps) {
  const flags = new Set();
  if (getHfwDirectAnswerLeakageIssues(question).length) flags.add("direct_answer_leakage");
  if (getHfwFillerPhraseHits(question).length) flags.add("filler_phrase");
  if (getWeakGenericHfwPromptIssues(question).length) flags.add("awkward_sentence");
  if (getMultiplePlausibleHfwAnswerIssues(question).length) flags.add("multiple_plausible_answers");
  if (!question.imagePath && !question.imageUrl) flags.add("no_image");
  if (String(question.questionType || "").includes("spell") && !question.audioPath && !question.audioUrl && !question.sentenceAudio) flags.add("no_audio");
  if (Array.isArray(question.letterTiles) && question.targetWord) {
    const tileCounts = question.letterTiles.reduce((counts, letter) => {
      counts[letter] = (counts[letter] || 0) + 1;
      return counts;
    }, {});
    for (const letter of String(question.targetWord).split("")) {
      if (!tileCounts[letter]) flags.add("spelling_tiles_missing");
      tileCounts[letter] -= 1;
    }
  }
  if ((maps.content.get(contentKey(question)) || []).length > 1) flags.add("repeated_content");
  if ((maps.targetTemplate.get(targetTemplateKey(question)) || []).length > 1) flags.add("repeated_template");
  if (/^when\b/i.test(sentenceOf(question))) flags.add("mechanical_sentence");
  if (/\b(?:truck stopped|word the|random|during harder practice)\b/i.test(sentenceOf(question))) flags.add("awkward_sentence");
  if (/look_s09|bonus-look|watermark|ai生成/i.test(String(question.imagePath || question.imageUrl || ""))) {
    flags.add("image_mismatch_risk");
  }
  return [...flags].join(", ");
}

function rowFor(question, maps) {
  return {
    acceptable: "Y",
    review_notes: "",
    delete_reason: "",
    skill_id: question.skillId || "",
    band: bandLabel(question.skillId || ""),
    level: question.level || "",
    phase: question.phase || "",
    question_id: question.id || "",
    question_type: question.questionType || "",
    target_word: question.targetWord || "",
    prompt: question.prompt || question.question || "",
    sentence_with_blank: sentenceOf(question),
    full_sentence: fullSentenceOf(question),
    answer_choices: optionWords(question).join(" | "),
    correct_answer: answerOf(question),
    letter_tiles: Array.isArray(question.letterTiles) ? question.letterTiles.join(" ") : "",
    correct_letter_sequence: Array.isArray(question.correctLetterSequence) ? question.correctLetterSequence.join("") : "",
    image_path: question.imagePath || question.imageUrl || "",
    audio_path: question.audioPath || question.audioUrl || question.audio || "",
    template_key: templateOf(question),
    content_key: contentKey(question),
    target_template_key: targetTemplateKey(question),
    source: question.source || "",
    source_sheet: sourceSheet(question),
    generator_notes: `sentence_frame=${normalizeHfwSentenceFrame(sentenceOf(question))}`,
    possible_problem_flags: problemFlags(question, maps)
  };
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function styleSheet(sheet, rows) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: "A1",
    to: `${sheet.getColumn(columns.length).letter}1`
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  const widths = {
    acceptable: 12,
    review_notes: 38,
    delete_reason: 28,
    prompt: 34,
    sentence_with_blank: 46,
    full_sentence: 48,
    answer_choices: 28,
    image_path: 56,
    generator_notes: 36,
    possible_problem_flags: 38
  };
  columns.forEach((key, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = widths[key] || Math.min(Math.max(key.length + 4, 12), 24);
    column.alignment = { vertical: "top", wrapText: true };
  });
  const acceptableColumn = sheet.getColumn(1);
  acceptableColumn.eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return;
    cell.dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Y,N,REVIEW"']
    };
  });
  sheet.addConditionalFormatting({
    ref: `A2:Z${rows.length + 1}`,
    rules: [{
      type: "expression",
      formulae: ["$A2=\"N\""],
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFC7CE" } } }
    }]
  });
}

function addRows(sheet, rows) {
  sheet.addRow(columns);
  rows.forEach(row => sheet.addRow(columns.map(column => row[column] ?? "")));
  styleSheet(sheet, rows);
}

function addSummary(workbook, rows) {
  const sheet = workbook.addWorksheet("Summary");
  const byBand = HFW_SKILLS.map(skillId => {
    const bandRows = rows.filter(row => row.skill_id === skillId);
    return [
      skillId,
      bandLabel(skillId),
      bandRows.length,
      new Set(bandRows.map(row => row.target_word)).size,
      bandRows.filter(row => row.question_type === "multiple_choice").length,
      bandRows.filter(row => row.question_type === "hfw_sentence_spell").length,
      bandRows.filter(row => row.possible_problem_flags).length
    ];
  });
  sheet.addRows([
    ["HFW Question Review Workbook"],
    ["Teacher workflow", "Change acceptable to N for bad rows; add notes/reasons; return workbook for import."],
    [],
    ["Skill", "Band", "Rows", "Targets", "Cloze Rows", "Spell Rows", "Rows With Flags"],
    ...byBand,
    [],
    ["Flag", "Rows"],
    ...[...new Set(rows.flatMap(row => row.possible_problem_flags.split(", ").filter(Boolean)))]
      .sort()
      .map(flag => [flag, rows.filter(row => row.possible_problem_flags.split(", ").includes(flag)).length])
  ]);
  sheet.getColumn(1).width = 34;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 14;
  sheet.getRow(1).font = { bold: true, size: 16 };
  sheet.getRow(4).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 4 }];
}

fs.mkdirSync(outputDir, { recursive: true });
const hfwQuestions = hfwAssessmentQuestions.filter(question => HFW_SKILLS.includes(question.skillId));
const maps = repeatedMaps(hfwQuestions);
const rows = hfwQuestions.map(question => rowFor(question, maps));

const workbook = new ExcelJS.Workbook();
workbook.creator = "LiteracyPath";
workbook.created = new Date();
addSummary(workbook, rows);
addRows(workbook.addWorksheet("All HFW"), rows);
for (const skillId of HFW_SKILLS) {
  addRows(workbook.addWorksheet(`HFW ${bandLabel(skillId)}`), rows.filter(row => row.skill_id === skillId));
}

await workbook.xlsx.writeFile(workbookPath);
fs.writeFileSync(csvPath, [
  columns.join(","),
  ...rows.map(row => columns.map(column => csvEscape(row[column])).join(","))
].join("\n"));

const flaggedRows = rows.filter(row => row.possible_problem_flags).length;
console.log(JSON.stringify({
  workbookPath: path.relative(repoRoot, workbookPath),
  csvPath: path.relative(repoRoot, csvPath),
  rows: rows.length,
  byBand: Object.fromEntries(HFW_SKILLS.map(skillId => [skillId, rows.filter(row => row.skill_id === skillId).length])),
  flaggedRows
}, null, 2));
