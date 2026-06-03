import fs from "node:fs";
import path from "node:path";

import { resolveAssessmentSkillId } from "../src/data/assessmentSkillMapping.js";
import { skillTree } from "../src/skillTree.js";
import {
  loadCoreQuestionPool,
  questionFilterReason,
  repoRoot
} from "./phonicsRuntimeUtils.js";

const outputPath = path.join(repoRoot, "docs", "validation", "assessment_active_media_size_audit.md");
const IMAGE_LIMIT_BYTES = 200 * 1024;
const AUDIO_LIMIT_BYTES = 300 * 1024;
const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".webm"]);

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

function isMediaUrl(value = "") {
  const text = String(value || "").trim();
  if (!text || /\s/.test(text)) return false;
  return Boolean(
    text.startsWith("data:image/") ||
      /^(\/|https?:\/\/).+\.(webp|png|jpe?g|gif|avif|svg|mp3|m4a|ogg|wav|webm)(\?|$)/i.test(text)
  );
}

function mediaKind(value = "") {
  const ext = path.extname(String(value).split("?")[0]).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext) || String(value).startsWith("data:image/")) return "image";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "";
}

function publicFilePath(url = "") {
  const clean = String(url || "").split("?")[0];
  if (!clean.startsWith("/")) return "";
  return path.join(repoRoot, "public", clean.replace(/^\//, ""));
}

function fileSize(url = "") {
  const filePath = publicFilePath(url);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.statSync(filePath).size;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function collectDeclaredMedia(question = {}) {
  const declared = [];

  function walk(value, fieldPath = []) {
    if (value === null || value === undefined) return;

    if (typeof value === "string") {
      if (isMediaUrl(value)) {
        declared.push({
          url: value.trim(),
          kind: mediaKind(value),
          fieldPath: fieldPath.join(".")
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => walk(item, [...fieldPath, "[]"]));
      return;
    }

    if (typeof value !== "object") return;

    Object.entries(value).forEach(([key, nested]) => {
      walk(nested, [...fieldPath, key]);
    });
  }

  walk(question, []);
  return declared.filter(item => item.kind);
}

function addUsage(map, item, question) {
  if (!item.url.startsWith("/")) return;
  const size = fileSize(item.url);
  if (size === null) return;
  const key = `${item.kind}:${item.url}`;
  const row = map.get(key) || {
    kind: item.kind,
    path: item.url,
    size,
    skills: new Set(),
    fieldPaths: new Set(),
    questionIds: new Set()
  };
  row.skills.add(canonicalSkillId(question));
  row.fieldPaths.add(item.fieldPath);
  row.questionIds.add(question.id || question.questionId || "(missing id)");
  map.set(key, row);
}

function toPlainRow(row) {
  return {
    kind: row.kind,
    path: row.path,
    size: row.size,
    skills: Array.from(row.skills).sort(),
    fieldPaths: Array.from(row.fieldPaths).sort(),
    sampleQuestionIds: Array.from(row.questionIds).sort().slice(0, 8)
  };
}

function priorityScore(row) {
  const priorities = ["final_sounds", "initial_sounds", "cvc_short_vowels", "rhyming"];
  const best = priorities.findIndex(skillId => row.skills.includes(skillId));
  return best === -1 ? priorities.length : best;
}

function renderRows(rows, limit = 400) {
  if (!rows.length) return "None.";
  return [
    "| Size | Path | Active skills | Fields | Sample question ids |",
    "| --- | --- | --- | --- | --- |",
    ...rows.slice(0, limit).map(row =>
      `| ${formatBytes(row.size)} | \`${row.path}\` | ${row.skills.join(", ")} | ${row.fieldPaths.join(", ")} | ${row.sampleQuestionIds.join(", ")} |`
    )
  ].join("\n");
}

const selectableQuestions = loadCoreQuestionPool()
  .map(question => ({ ...question, filterReason: questionFilterReason(question) }))
  .filter(isSelectable);

const usageMap = new Map();
selectableQuestions.forEach(question => {
  collectDeclaredMedia(question).forEach(item => addUsage(usageMap, item, question));
});

const rows = Array.from(usageMap.values()).map(toPlainRow);
const imageRows = rows.filter(row => row.kind === "image");
const audioRows = rows.filter(row => row.kind === "audio");
const oversizedImages = imageRows
  .filter(row => row.size > IMAGE_LIMIT_BYTES)
  .sort((a, b) => priorityScore(a) - priorityScore(b) || b.size - a.size || a.path.localeCompare(b.path));
const oversizedAudio = audioRows
  .filter(row => row.size > AUDIO_LIMIT_BYTES)
  .sort((a, b) => b.size - a.size || a.path.localeCompare(b.path));
const skillSummary = skillTree.map(skill => {
  const skillImages = imageRows.filter(row => row.skills.includes(skill.id));
  const skillOversizedImages = oversizedImages.filter(row => row.skills.includes(skill.id));
  return {
    skillId: skill.id,
    imageFiles: skillImages.length,
    oversizedImages: skillOversizedImages.length,
    largestImage: skillImages.length ? Math.max(...skillImages.map(row => row.size)) : 0
  };
});

const markdown = [
  "# Active Assessment Media Size Audit",
  "",
  "Generated by `npm run check:assessment-active-media-sizes`.",
  "",
  "## Summary",
  "",
  `- Runtime-selectable questions inspected: ${selectableQuestions.length}`,
  `- Unique active image files referenced: ${imageRows.length}`,
  `- Unique active audio files referenced: ${audioRows.length}`,
  `- Oversized active images over ${formatBytes(IMAGE_LIMIT_BYTES)}: ${oversizedImages.length}`,
  `- Oversized active audio files over ${formatBytes(AUDIO_LIMIT_BYTES)}: ${oversizedAudio.length}`,
  "",
  "## Skill Summary",
  "",
  "| Skill | Active image files | Oversized active images | Largest active image |",
  "| --- | --- | --- | --- |",
  ...skillSummary.map(row =>
    `| ${row.skillId} | ${row.imageFiles} | ${row.oversizedImages} | ${row.largestImage ? formatBytes(row.largestImage) : "n/a"} |`
  ),
  "",
  "## Oversized Active Images",
  "",
  renderRows(oversizedImages),
  "",
  "## Oversized Active Audio",
  "",
  renderRows(oversizedAudio),
  ""
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.table([{
  selectableQuestions: selectableQuestions.length,
  activeImages: imageRows.length,
  activeAudio: audioRows.length,
  oversizedImages: oversizedImages.length,
  oversizedAudio: oversizedAudio.length
}]);
console.log("\nOversized active images by priority:");
console.table(oversizedImages.slice(0, 40).map(row => ({
  size: formatBytes(row.size),
  path: row.path,
  skills: row.skills.join(", ")
})));
console.log(`\nWrote ${path.relative(repoRoot, outputPath)}`);
