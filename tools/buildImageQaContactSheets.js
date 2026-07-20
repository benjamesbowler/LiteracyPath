import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const inventoryPath = path.join(repoRoot, "docs", "validation", "app_image_inventory_audit.json");
const contactSheetDir = path.join(repoRoot, "docs", "image-qa", "contact-sheets");
const reviewDir = path.join(repoRoot, "docs", "image-qa", "review-data");
const reviewXlsxPath = path.join(reviewDir, "image_qa_review.xlsx");
const reviewCsvPath = path.join(reviewDir, "image_qa_review.csv");
const PAGE_SIZE = 80;

const areaGroups = {
  "assessment-vocabulary-images": row => row.area === "vocabulary",
  "hfw-scene-variants": row => row.area === "assessment" && row.path.includes("/hfw/"),
  "rhyming-variants": row => row.path.toLowerCase().includes("rhym"),
  "language-skill-images": row => row.area === "assessment" && !row.path.includes("/hfw/") && !row.path.toLowerCase().includes("rhym"),
  "guided-reading-covers-pages": row => row.area === "guided_reading",
  "story-quest-images": row => row.area === "story_quest",
  "generated-legacy-images": row => ["generated", "unknown"].includes(row.area)
};

const columns = [
  "acceptable",
  "issue_type",
  "severity",
  "replacement_needed",
  "reviewer_notes",
  "image_id",
  "path",
  "target_word",
  "skill_id",
  "area",
  "contact_sheet",
  "contact_sheet_position",
  "current_qa_status",
  "suggested_kimi_replacement_prompt"
];

const issueTypes = [
  "ai_slop_anatomy",
  "extra_hands_fingers_limbs",
  "double_head_or_extra_face",
  "disconnected_body_part",
  "malformed_animal",
  "wrong_target",
  "wrong_word_sense",
  "photorealistic",
  "watermark",
  "embedded_text",
  "fake_letters_or_numbers",
  "logo_or_brand",
  "inconsistent_style",
  "low_resolution",
  "too_cluttered",
  "too_dark",
  "not_child_friendly",
  "duplicate_or_near_duplicate",
  "face_on_inanimate_object",
  "rainbow_styled_ordinary_object",
  "baby_kawaii_style",
  "other"
];

function ensureInventory() {
  if (!fs.existsSync(inventoryPath)) {
    throw new Error("Run npm run audit:app-image-inventory before building image QA contact sheets.");
  }
  return JSON.parse(fs.readFileSync(inventoryPath, "utf8")).images || [];
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function promptFor(row) {
  return [
    `Create a clean ${row.style_expected || "K-2 app"} replacement for ${row.target_word || row.filename}.`,
    "No watermark, no embedded text, no fake letters/numbers, no logos, no photorealism unless explicitly requested.",
    "No extra limbs/fingers, no disconnected body parts, no malformed animals, no distorted faces, no clutter.",
    `Original path: ${row.path}`
  ].join(" ");
}

function htmlEscape(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function buildContactSheet(groupName, rows, pageIndex) {
  const filename = `${groupName}-${String(pageIndex + 1).padStart(3, "0")}.html`;
  const relative = `docs/image-qa/contact-sheets/${filename}`;
  const full = path.join(repoRoot, relative);
  const cards = rows.map((row, index) => `
    <figure>
      <img src="../../../public${row.path}" alt="${htmlEscape(row.image_id)}" loading="lazy" />
      <figcaption><strong>${htmlEscape(row.image_id)}</strong> · ${index + 1}<br>${htmlEscape(row.target_word || row.filename)}<br><code>${htmlEscape(row.path)}</code></figcaption>
    </figure>`).join("\n");
  writeFile(full, `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(groupName)} ${pageIndex + 1}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #1f2937; }
    h1 { font-size: 22px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(220px, 1fr)); gap: 18px; }
    figure { margin: 0; padding: 10px; border: 1px solid #d1d5db; border-radius: 10px; background: #fff; }
    img { width: 100%; height: 220px; object-fit: contain; background: #f9fafb; border-radius: 6px; }
    figcaption { font-size: 12px; line-height: 1.35; margin-top: 8px; word-break: break-word; }
    code { font-size: 11px; }
  </style>
</head>
<body>
  <h1>${htmlEscape(groupName)} — sheet ${pageIndex + 1}</h1>
  <p>Human visual review only. Automated checks cannot reliably catch anatomy slop.</p>
  <section class="grid">${cards}</section>
</body>
</html>`);
  return relative;
}

fs.mkdirSync(contactSheetDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });
const inventory = ensureInventory();
const reviewRows = [];
const contactSheets = [];
const assignedImageIds = new Set();

for (const [groupName, predicate] of Object.entries(areaGroups)) {
  const groupRows = inventory.filter(row => !assignedImageIds.has(row.image_id) && predicate(row));
  groupRows.forEach(row => assignedImageIds.add(row.image_id));
  for (let start = 0, pageIndex = 0; start < groupRows.length; start += PAGE_SIZE, pageIndex += 1) {
    const pageRows = groupRows.slice(start, start + PAGE_SIZE);
    if (!pageRows.length) continue;
    const contactSheet = buildContactSheet(groupName, pageRows, pageIndex);
    contactSheets.push(contactSheet);
    pageRows.forEach((row, index) => {
      reviewRows.push({
        acceptable: "REVIEW",
        issue_type: "",
        severity: "",
        replacement_needed: "N",
        reviewer_notes: "",
        image_id: row.image_id,
        path: row.path,
        target_word: row.target_word,
        skill_id: row.skill_id,
        area: row.area,
        contact_sheet: contactSheet,
        contact_sheet_position: index + 1,
        current_qa_status: row.current_qa_status,
        suggested_kimi_replacement_prompt: promptFor(row)
      });
    });
  }
}

const workbook = new ExcelJS.Workbook();
const validationSheet = workbook.addWorksheet("Validation Lists");
validationSheet.state = "hidden";
issueTypes.forEach((issueType, index) => {
  validationSheet.getCell(index + 1, 1).value = issueType;
});
const summary = workbook.addWorksheet("Summary");
summary.addRows([
  ["Image QA Review"],
  ["Instructions", "Open contact sheets, inspect each image visually, then mark acceptable as Y, N, or REVIEW in the Review sheet."],
  ["Images ready for review", reviewRows.length],
  ["Contact sheets", contactSheets.length],
  [],
  ["Area", "Rows"],
  ...Object.entries(reviewRows.reduce((counts, row) => {
    counts[row.area] = (counts[row.area] || 0) + 1;
    return counts;
  }, {})).sort()
]);
summary.getColumn(1).width = 28;
summary.getColumn(2).width = 80;
summary.getRow(1).font = { bold: true, size: 16 };

const sheet = workbook.addWorksheet("Review");
sheet.addRow(columns);
reviewRows.forEach(row => sheet.addRow(columns.map(column => row[column] ?? "")));
sheet.views = [{ state: "frozen", ySplit: 1 }];
sheet.autoFilter = { from: "A1", to: `${sheet.getColumn(columns.length).letter}1` };
sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
const widths = {
  acceptable: 12,
  issue_type: 28,
  severity: 14,
  replacement_needed: 18,
  reviewer_notes: 42,
  path: 70,
  contact_sheet: 46,
  suggested_kimi_replacement_prompt: 90
};
columns.forEach((column, index) => {
  const excelColumn = sheet.getColumn(index + 1);
  excelColumn.width = widths[column] || Math.min(Math.max(column.length + 4, 12), 24);
  excelColumn.alignment = { vertical: "top", wrapText: true };
});
sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;
  row.getCell(1).dataValidation = { type: "list", allowBlank: false, formulae: ['"Y,N,REVIEW"'] };
  row.getCell(2).dataValidation = { type: "list", allowBlank: true, formulae: [`'Validation Lists'!$A$1:$A$${issueTypes.length}`] };
  row.getCell(3).dataValidation = { type: "list", allowBlank: true, formulae: ['"blocker,major,minor"'] };
  row.getCell(4).dataValidation = { type: "list", allowBlank: false, formulae: ['"Y,N"'] };
});

await workbook.xlsx.writeFile(reviewXlsxPath);
writeFile(reviewCsvPath, [
  columns.join(","),
  ...reviewRows.map(row => columns.map(column => csvEscape(row[column])).join(","))
].join("\n"));

writeFile(path.join(reviewDir, "contact_sheet_index.json"), `${JSON.stringify({ contactSheets, reviewRows: reviewRows.length }, null, 2)}\n`);
console.log(JSON.stringify({
  contactSheets: contactSheets.length,
  reviewRows: reviewRows.length,
  workbookPath: path.relative(repoRoot, reviewXlsxPath),
  csvPath: path.relative(repoRoot, reviewCsvPath)
}, null, 2));
