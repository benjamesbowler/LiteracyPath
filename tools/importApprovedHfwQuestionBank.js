import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workbookPath = path.join(repoRoot, "docs/imports/LiteracyPath_HFW_Approved_Question_Bank_Min6.xlsx");
const outputPath = path.join(repoRoot, "src/data/generated/hfwApprovedQuestionBank.generated.js");
const validationPath = path.join(repoRoot, "docs/validation/approved_hfw_question_bank_import_audit.json");
const bundledPython = "/Users/benjaminbowler/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const sourceSheet = "HFW Approved Bank";

function normalizeText(value = "") {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWord(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9'-]+/g, " ")
    .trim();
}

function parsePipeList(value = "") {
  return normalizeText(value)
    .split("|")
    .map(item => normalizeWord(item))
    .filter(Boolean);
}

function parseLetterList(value = "") {
  return normalizeText(value)
    .split(/\s+/)
    .map(item => item.toLowerCase().replace(/[^a-z]/g, ""))
    .filter(Boolean);
}

function levelPhaseFor(row = {}) {
  const questionType = normalizeText(row.question_type).toLowerCase();
  const variant = Number(row.variant_no) || 1;
  const level = questionType.includes("level 2") ? 2 : 1;
  const phase = level === 1
    ? (variant <= 1 ? 1 : 2)
    : (variant <= 4 ? 1 : 2);
  return { level, phase };
}

function runtimeQuestionType(row = {}) {
  return normalizeText(row.question_type).toLowerCase().includes("spell")
    ? "hfw_sentence_spell"
    : "multiple_choice";
}

function imagePolicyFor(row = {}) {
  const rawPolicy = normalizeText(row.image_policy).toLowerCase();
  if (rawPolicy.includes("target")) return "verified_cartoon_target_scene";
  if (rawPolicy.includes("sentence") && normalizeText(row.verified_image_path)) return "verified_cartoon_sentence_scene";
  return "no_image";
}

function templateKeyFor(row = {}) {
  const { level, phase } = levelPhaseFor(row);
  const family = level === 2 ? "HFW_SENTENCE_SPELL" : "HFW_SENTENCE_CLOZE";
  const variant = String(Number(row.variant_no) || 1).padStart(2, "0");
  return `${family}_L${level}P${phase}_${variant}`;
}

function contentKeyFor(row = {}) {
  return [
    normalizeWord(row.skill_id),
    normalizeWord(row.target_word),
    normalizeText(row.sentence_with_blank).toLowerCase(),
    normalizeText(row.full_sentence).toLowerCase()
  ].join("::");
}

function readWorkbookRows() {
  const python = fs.existsSync(bundledPython) ? bundledPython : "python3";
  const script = `
import json, sys
from openpyxl import load_workbook
path = sys.argv[1]
sheet_name = sys.argv[2]
wb = load_workbook(path, data_only=True)
ws = wb[sheet_name]
headers = [str(ws.cell(1, c).value or '').strip() for c in range(1, ws.max_column + 1)]
rows = []
for r in range(2, ws.max_row + 1):
    row = {}
    empty = True
    for c, header in enumerate(headers, start=1):
        if not header:
            continue
        value = ws.cell(r, c).value
        if value is not None:
            empty = False
        row[header] = value
    if not empty:
        row['_source_row'] = r
        rows.append(row)
print(json.dumps(rows, ensure_ascii=False))
`;
  const result = spawnSync(python, ["-c", script, workbookPath, sourceSheet], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `Failed to read ${workbookPath}`);
  }
  return JSON.parse(result.stdout || "[]");
}

function normalizeRow(row = {}) {
  const { level, phase } = levelPhaseFor(row);
  const questionId = normalizeText(row.question_id);
  const targetWord = normalizeWord(row.target_word);
  const questionType = runtimeQuestionType(row);
  const answerChoices = parsePipeList(row.answer_choices);
  const correctAnswer = normalizeWord(row.correct_answer || row.target_word);
  const letterTiles = parseLetterList(row.letter_tiles);
  const correctLetterSequence = parseLetterList(row.correct_letter_sequence || correctAnswer.split("").join(" "));
  const templateKey = templateKeyFor(row);
  return {
    questionId,
    skillId: normalizeText(row.skill_id),
    band: normalizeText(row.band),
    targetWord,
    level,
    phase,
    variantNo: Number(row.variant_no) || null,
    questionType,
    workbookQuestionType: normalizeText(row.question_type),
    fullSentence: normalizeText(row.full_sentence),
    sentenceWithBlank: normalizeText(row.sentence_with_blank),
    prompt: normalizeText(row.prompt),
    correctAnswer,
    answerChoices,
    letterTiles,
    correctLetterSequence,
    cartoonImageNeeded: /^y$/i.test(normalizeText(row.cartoon_image_needed)),
    imagePolicy: imagePolicyFor(row),
    workbookImagePolicy: normalizeText(row.image_policy),
    imageUseRule: normalizeText(row.image_use_rule),
    imagePrompt: normalizeText(row.kimi_image_prompt),
    approvedSource: "approved_hfw_workbook",
    sourceWorkbook: "docs/imports/LiteracyPath_HFW_Approved_Question_Bank_Min6.xlsx",
    sourceSheet,
    sourceRow: Number(row._source_row) || null,
    sourceSentenceNo: Number(row.source_sentence_no) || null,
    sourceStatus: normalizeText(row.source_status),
    contentKey: contentKeyFor(row),
    workbookContentKey: normalizeText(row.content_key),
    templateKey
  };
}

function validateRows(rows = []) {
  const issues = [];
  const ids = new Set();
  const countsByWord = new Map();
  for (const row of rows) {
    if (!row.questionId) issues.push(`row ${row.sourceRow}: missing questionId`);
    if (ids.has(row.questionId)) issues.push(`duplicate questionId: ${row.questionId}`);
    ids.add(row.questionId);
    if (!row.skillId || !row.targetWord) issues.push(`${row.questionId}: missing skillId/targetWord`);
    if (!row.fullSentence || !row.sentenceWithBlank) issues.push(`${row.questionId}: missing sentence text`);
    if ((row.sentenceWithBlank.match(/___/g) || []).length !== 1) issues.push(`${row.questionId}: sentenceWithBlank must contain exactly one blank`);
    if (row.correctAnswer !== row.targetWord) issues.push(`${row.questionId}: correctAnswer does not match targetWord`);
    if (row.level === 1) {
      if (row.questionType !== "multiple_choice") issues.push(`${row.questionId}: level 1 must be cloze choice`);
      if (row.answerChoices.length !== 4) issues.push(`${row.questionId}: level 1 must have four answer choices`);
      if (!row.answerChoices.includes(row.correctAnswer)) issues.push(`${row.questionId}: answer choices missing correct answer`);
    }
    if (row.level === 2) {
      if (row.questionType !== "hfw_sentence_spell") issues.push(`${row.questionId}: level 2 must be listen-and-spell`);
      const tileCounts = row.letterTiles.reduce((counts, letter) => {
        counts[letter] = (counts[letter] || 0) + 1;
        return counts;
      }, {});
      for (const letter of row.correctAnswer.split("")) {
        if (!tileCounts[letter]) {
          issues.push(`${row.questionId}: letterTiles cannot spell ${row.correctAnswer}`);
          break;
        }
        tileCounts[letter] -= 1;
      }
      if (row.correctLetterSequence.join("") !== row.correctAnswer) {
        issues.push(`${row.questionId}: correctLetterSequence does not spell target`);
      }
    }
    const countKey = `${row.skillId}:${row.targetWord}`;
    countsByWord.set(countKey, (countsByWord.get(countKey) || 0) + 1);
  }
  for (const [key, count] of countsByWord) {
    if (count !== 6) issues.push(`${key}: expected 6 approved rows, found ${count}`);
  }
  return issues;
}

function moduleText(rows = []) {
  const ids = rows.map(row => row.questionId);
  const contentKeys = rows.map(row => row.contentKey);
  const textKeys = rows.map(row => [
    row.skillId,
    row.targetWord,
    row.sentenceWithBlank,
    row.fullSentence
  ].join("::").toLowerCase());
  const words = [...new Set(rows.map(row => row.targetWord))].sort();
  const wordsBySkill = {};
  for (const row of rows) {
    wordsBySkill[row.skillId] ||= [];
    if (!wordsBySkill[row.skillId].includes(row.targetWord)) wordsBySkill[row.skillId].push(row.targetWord);
  }
  for (const words of Object.values(wordsBySkill)) words.sort();
  return `// Generated by tools/importApprovedHfwQuestionBank.js. Do not hand-edit.\n\nexport const hfwApprovedQuestionBank = ${JSON.stringify(rows, null, 2)};\nexport const hfwApprovedQuestionIds = new Set(${JSON.stringify(ids)});\nexport const hfwApprovedQuestionContentKeys = new Set(${JSON.stringify(contentKeys)});\nexport const hfwApprovedQuestionTextKeys = new Set(${JSON.stringify(textKeys)});\nexport const hfwApprovedWords = ${JSON.stringify(words, null, 2)};\nexport const hfwApprovedWordSet = new Set(hfwApprovedWords);\nexport const hfwApprovedWordsBySkill = ${JSON.stringify(wordsBySkill, null, 2)};\nexport const hfwApprovedWordSetsBySkill = Object.fromEntries(Object.entries(hfwApprovedWordsBySkill).map(([skillId, words]) => [skillId, new Set(words)]));\nexport const hfwApprovedRowsByQuestionId = new Map(hfwApprovedQuestionBank.map(row => [row.questionId, row]));\n`;
}

function main() {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${path.relative(repoRoot, workbookPath)}`);
  }
  const rawRows = readWorkbookRows();
  const rows = rawRows
    .filter(row => /^y$/i.test(normalizeText(row.approved)))
    .map(normalizeRow);
  const issues = validateRows(rows);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(validationPath), { recursive: true });
  fs.writeFileSync(outputPath, moduleText(rows));
  const countsBySkill = rows.reduce((counts, row) => {
    counts[row.skillId] = (counts[row.skillId] || 0) + 1;
    return counts;
  }, {});
  const countsByWord = rows.reduce((counts, row) => {
    const key = `${row.skillId}:${row.targetWord}`;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  fs.writeFileSync(validationPath, `${JSON.stringify({
    sourceWorkbook: path.relative(repoRoot, workbookPath),
    sourceSheet,
    approvedRows: rows.length,
    countsBySkill,
    wordCount: Object.keys(countsByWord).length,
    minimumRowsPerWord: Math.min(...Object.values(countsByWord)),
    maximumRowsPerWord: Math.max(...Object.values(countsByWord)),
    issues
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    generated: path.relative(repoRoot, outputPath),
    approvedRows: rows.length,
    countsBySkill,
    wordCount: Object.keys(countsByWord).length,
    minimumRowsPerWord: Math.min(...Object.values(countsByWord)),
    maximumRowsPerWord: Math.max(...Object.values(countsByWord)),
    issues: issues.length
  }, null, 2));
  if (issues.length) {
    issues.slice(0, 80).forEach(issue => console.error(`- ${issue}`));
    if (issues.length > 80) console.error(`...and ${issues.length - 80} more`);
    process.exit(1);
  }
}

main();
