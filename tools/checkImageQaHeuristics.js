import fs from "node:fs";
import path from "node:path";

import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const inventoryPath = path.join(repoRoot, "docs", "validation", "app_image_inventory_audit.json");
const outputJsonPath = path.join(repoRoot, "docs", "validation", "image_qa_heuristics_audit.json");
const outputMdPath = path.join(repoRoot, "docs", "validation", "image_qa_heuristics_audit.md");

if (!fs.existsSync(inventoryPath)) {
  throw new Error("Run npm run audit:app-image-inventory first.");
}

const images = JSON.parse(fs.readFileSync(inventoryPath, "utf8")).images || [];
const hashGroups = images.reduce((groups, row) => {
  const rows = groups.get(row.sha1) || [];
  rows.push(row);
  groups.set(row.sha1, rows);
  return groups;
}, new Map());

function flagsFor(row) {
  const flags = [];
  const ratio = row.height ? row.width / row.height : 0;
  if (!row.width || !row.height) flags.push("missing_dimensions");
  if (row.width && row.width < 240 || row.height && row.height < 240) flags.push("very_small_dimensions");
  if (ratio && (ratio < 0.45 || ratio > 2.25)) flags.push("unusual_aspect_ratio");
  if (row.file_size_bytes > 2_500_000) flags.push("unusually_large_file");
  if (row.file_size_bytes < 4_000) flags.push("unusually_tiny_file");
  if (["assessment", "vocabulary"].includes(row.area) && row.extension !== "webp" && row.extension !== "svg") flags.push("non_webp_assessment_or_vocab");
  if (row.used_by_app !== "yes") flags.push("not_referenced_by_scanned_app_sources");
  if (/(?:screenshot|download|test|tmp|watermark|logo|ai生成|generated)/i.test(row.path)) flags.push("filename_or_folder_hint");
  if ((hashGroups.get(row.sha1) || []).length > 1) flags.push("duplicate_file_hash");
  if (/bonus-look-02|hfw_workbook_hfw_1_25_look_s09/i.test(row.path)) flags.push("known_manual_review_needed");
  return flags;
}

const rows = images.map(row => ({ ...row, heuristic_flags: flagsFor(row) })).filter(row => row.heuristic_flags.length);
const byFlag = rows.reduce((counts, row) => {
  for (const flag of row.heuristic_flags) counts[flag] = (counts[flag] || 0) + 1;
  return counts;
}, {});

writeFile(outputJsonPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: "Heuristic only. Automated checks cannot reliably detect extra fingers, two heads, bad anatomy, malformed animals, or wrong word sense.",
  warningCount: rows.length,
  byFlag,
  rows
}, null, 2)}\n`);
writeFile(outputMdPath, [
  "# Image QA Heuristics Audit",
  "",
  "Automated heuristics only. Human contact-sheet review is required for AI anatomy slop, extra fingers, double heads, wrong word sense, and child suitability.",
  "",
  `- Heuristic warning rows: ${rows.length}`,
  "",
  "## By Flag",
  "",
  "| Flag | Rows |",
  "| --- | --- |",
  ...Object.entries(byFlag).sort().map(([flag, count]) => `| ${flag} | ${count} |`),
  "",
  "## Sample Rows",
  "",
  "| Image | Flags |",
  "| --- | --- |",
  ...rows.slice(0, 60).map(row => `| \`${row.path}\` | ${row.heuristic_flags.join(", ")} |`),
  ""
].join("\n"));

console.log(JSON.stringify({ heuristicWarnings: rows.length, byFlag }, null, 2));
