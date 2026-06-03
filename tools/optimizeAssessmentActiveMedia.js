import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { resolveAssessmentSkillId } from "../src/data/assessmentSkillMapping.js";
import {
  loadCoreQuestionPool,
  questionFilterReason,
  repoRoot
} from "./phonicsRuntimeUtils.js";

const IMAGE_LIMIT_BYTES = 200 * 1024;
const TARGET_DIMENSION = 768;
const outputPath = path.join(repoRoot, "docs", "validation", "assessment_active_media_optimization_report.md");
const backupRoot = path.join("/tmp", `lp-assessment-media-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg"]);
const SKILL_ID_ALIASES = {
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
};

function normalizeSkillId(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SKILL_ID_ALIASES[normalized] || normalized;
}

function canonicalSkillId(question = {}) {
  return normalizeSkillId(
    resolveAssessmentSkillId(question) ||
      question.skillId ||
      question.assessmentSkillId ||
      question.skillName ||
      question.skill ||
      ""
  );
}

function isSelectable(question = {}) {
  const reason = question.filterReason || "";
  return !reason || reason.startsWith("missing optional audio");
}

function isImageUrl(value = "") {
  const text = String(value || "").trim();
  if (!text || /\s/.test(text)) return false;
  return /^(\/|https?:\/\/).+\.(webp|png|jpe?g)(\?|$)/i.test(text);
}

function publicFilePath(url = "") {
  const clean = String(url || "").split("?")[0];
  if (!clean.startsWith("/")) return "";
  return path.join(repoRoot, "public", clean.replace(/^\//, ""));
}

function collectImageUrls(question = {}) {
  const urls = [];

  function walk(value) {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      if (isImageUrl(value)) urls.push(value.trim());
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value !== "object") return;
    Object.values(value).forEach(walk);
  }

  walk(question);
  return urls;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function backupFile(filePath) {
  const relative = path.relative(repoRoot, filePath);
  const backupPath = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function optimizePng(filePath, tempPath) {
  execFileSync("magick", [
    filePath,
    "-resize",
    `${TARGET_DIMENSION}x${TARGET_DIMENSION}>`,
    "-strip",
    `PNG8:${tempPath}`
  ]);
}

function optimizeWebp(filePath, tempPath) {
  execFileSync("cwebp", [
    "-quiet",
    "-q",
    "78",
    "-resize",
    String(TARGET_DIMENSION),
    String(TARGET_DIMENSION),
    filePath,
    "-o",
    tempPath
  ]);
}

function optimizeJpeg(filePath, tempPath) {
  execFileSync("magick", [
    filePath,
    "-resize",
    `${TARGET_DIMENSION}x${TARGET_DIMENSION}>`,
    "-strip",
    "-quality",
    "82",
    tempPath
  ]);
}

function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = `${filePath}.lp-optimized${ext}`;

  if (ext === ".png") optimizePng(filePath, tempPath);
  else if (ext === ".webp") optimizeWebp(filePath, tempPath);
  else if (ext === ".jpg" || ext === ".jpeg") optimizeJpeg(filePath, tempPath);
  else return { status: "skipped", reason: `Unsupported extension ${ext}` };

  const before = fs.statSync(filePath).size;
  const after = fs.statSync(tempPath).size;
  if (after <= 0 || after >= before) {
    fs.rmSync(tempPath, { force: true });
    return { status: "skipped", reason: "Optimized file was not smaller", before, after };
  }

  const backupPath = backupFile(filePath);
  fs.renameSync(tempPath, filePath);
  return { status: "optimized", before, after, backupPath };
}

const usageByPath = new Map();
loadCoreQuestionPool()
  .map(question => ({ ...question, filterReason: questionFilterReason(question) }))
  .filter(isSelectable)
  .forEach(question => {
    const skillId = canonicalSkillId(question);
    const questionId = question.id || question.questionId || "(missing id)";
    collectImageUrls(question).forEach(url => {
      const filePath = publicFilePath(url);
      if (!filePath || !fs.existsSync(filePath)) return;
      const ext = path.extname(filePath).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) return;
      const row = usageByPath.get(url) || {
        url,
        filePath,
        skills: new Set(),
        questionIds: new Set()
      };
      row.skills.add(skillId);
      row.questionIds.add(questionId);
      usageByPath.set(url, row);
    });
  });

const candidates = Array.from(usageByPath.values())
  .map(row => ({
    ...row,
    before: fs.statSync(row.filePath).size
  }))
  .filter(row => row.before > IMAGE_LIMIT_BYTES)
  .sort((a, b) => b.before - a.before || a.url.localeCompare(b.url));

const results = candidates.map(row => {
  const result = optimizeImage(row.filePath);
  const finalSize = fs.statSync(row.filePath).size;
  return {
    url: row.url,
    skills: Array.from(row.skills).sort(),
    sampleQuestionIds: Array.from(row.questionIds).sort().slice(0, 8),
    before: row.before,
    after: finalSize,
    saved: row.before - finalSize,
    status: result.status,
    reason: result.reason || "",
    backupPath: result.backupPath || ""
  };
});

const optimized = results.filter(row => row.status === "optimized");
const unresolved = results.filter(row => row.after > IMAGE_LIMIT_BYTES);
const totalBefore = results.reduce((sum, row) => sum + row.before, 0);
const totalAfter = results.reduce((sum, row) => sum + row.after, 0);

const markdown = [
  "# Assessment Active Media Optimization Report",
  "",
  "Generated by `node tools/optimizeAssessmentActiveMedia.js`.",
  "",
  "## Summary",
  "",
  `- Backup folder: \`${backupRoot}\``,
  `- Oversized active image candidates before optimization: ${candidates.length}`,
  `- Images optimized: ${optimized.length}`,
  `- Images still over ${formatBytes(IMAGE_LIMIT_BYTES)}: ${unresolved.length}`,
  `- Total before: ${formatBytes(totalBefore)}`,
  `- Total after: ${formatBytes(totalAfter)}`,
  `- Total saved: ${formatBytes(totalBefore - totalAfter)}`,
  "",
  "## Optimized Images",
  "",
  "| Before | After | Saved | Path | Active skills | Sample question ids |",
  "| --- | --- | --- | --- | --- | --- |",
  ...optimized.map(row =>
    `| ${formatBytes(row.before)} | ${formatBytes(row.after)} | ${formatBytes(row.saved)} | \`${row.url}\` | ${row.skills.join(", ")} | ${row.sampleQuestionIds.join(", ")} |`
  ),
  "",
  "## Remaining Oversized Images",
  "",
  unresolved.length
    ? [
        "| Before | After | Path | Active skills | Reason |",
        "| --- | --- | --- | --- | --- |",
        ...unresolved.map(row =>
          `| ${formatBytes(row.before)} | ${formatBytes(row.after)} | \`${row.url}\` | ${row.skills.join(", ")} | ${row.reason || "Still above threshold after safe compression"} |`
        )
      ].join("\n")
    : "None.",
  ""
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.table([{
  candidates: candidates.length,
  optimized: optimized.length,
  unresolved: unresolved.length,
  before: formatBytes(totalBefore),
  after: formatBytes(totalAfter),
  saved: formatBytes(totalBefore - totalAfter),
  backupRoot
}]);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
