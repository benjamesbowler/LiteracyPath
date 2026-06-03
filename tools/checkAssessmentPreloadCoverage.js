import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { skillTree } from "../src/skillTree.js";
import { resolveAssessmentSkillId } from "../src/data/assessmentSkillMapping.js";
import {
  collectQuestionMedia,
  PRELOAD_AUDIO_FIELDS,
  PRELOAD_IMAGE_FIELDS,
  PRELOAD_NESTED_COLLECTION_FIELDS
} from "../src/utils/preloadQuestionMedia.js";
import {
  loadCoreQuestionPool,
  questionFilterReason,
  repoRoot
} from "./phonicsRuntimeUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(repoRoot, "docs", "validation", "assessment_preload_coverage_audit.md");

const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".webm"]);
const IMAGE_LIMIT_BYTES = 200 * 1024;
const AUDIO_LIMIT_BYTES = 300 * 1024;

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

function fileExists(url = "") {
  if (String(url).startsWith("data:image/")) return true;
  const filePath = publicFilePath(url);
  return Boolean(filePath && fs.existsSync(filePath));
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

function mean(values = []) {
  const valid = values.filter(value => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function addSet(map, key, value) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
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

function sample(values = [], limit = 8) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function rowForSkill(skill, questions) {
  const declared = questions.flatMap(question =>
    collectDeclaredMedia(question).map(item => ({
      ...item,
      questionId: question.id || question.questionId || "(missing id)"
    }))
  );
  const collectedByPreloader = questions.flatMap(question => {
    const media = collectQuestionMedia(question);
    return [
      ...media.images.map(url => ({ url, kind: "image" })),
      ...media.audio.map(url => ({ url, kind: "audio" }))
    ];
  });
  const collectedKeys = new Set(collectedByPreloader.map(item => `${item.kind}:${item.url}`));
  const unsupported = declared.filter(item => !collectedKeys.has(`${item.kind}:${item.url}`));
  const imagePaths = declared.filter(item => item.kind === "image").map(item => item.url);
  const audioPaths = declared.filter(item => item.kind === "audio").map(item => item.url);
  const missingImages = sample(imagePaths.filter(url => url.startsWith("/") && !fileExists(url)), 20);
  const missingAudio = sample(audioPaths.filter(url => url.startsWith("/") && !fileExists(url)), 20);
  const imageSizes = Array.from(new Set(imagePaths)).map(fileSize).filter(value => value !== null);
  const audioSizes = Array.from(new Set(audioPaths)).map(fileSize).filter(value => value !== null);

  return {
    skillId: skill.id,
    skillName: skill.label,
    totalEligibleQuestions: questions.length,
    questionsWithImageMedia: questions.filter(question => collectDeclaredMedia(question).some(item => item.kind === "image")).length,
    questionsWithAudioMedia: questions.filter(question => collectDeclaredMedia(question).some(item => item.kind === "audio")).length,
    mediaFieldsUsed: sample(declared.map(item => item.fieldPath), 60),
    imagePaths: sample(imagePaths, 30),
    audioPaths: sample(audioPaths, 30),
    unsupportedFields: sample(unsupported.map(item => item.fieldPath), 30),
    unsupportedSamples: sample(unsupported.map(item => `${item.questionId}:${item.fieldPath}`), 20),
    missingImages,
    missingAudio,
    oversizedImages: imageSizes.filter(size => size > IMAGE_LIMIT_BYTES).length,
    oversizedAudio: audioSizes.filter(size => size > AUDIO_LIMIT_BYTES).length,
    averageImageSize: mean(imageSizes),
    averageAudioSize: mean(audioSizes),
    preloaderCovered: unsupported.length === 0
  };
}

function formatList(items = []) {
  return items.length ? items.map(item => `- ${item}`).join("\n") : "- None";
}

function formatInlineList(items = []) {
  return items.length ? items.join(", ") : "None";
}

function renderSkillSection(row) {
  return [
    `### ${row.skillName}`,
    "",
    `- Skill id: \`${row.skillId}\``,
    `- Total eligible questions: ${row.totalEligibleQuestions}`,
    `- Questions with image media: ${row.questionsWithImageMedia}`,
    `- Questions with audio media: ${row.questionsWithAudioMedia}`,
    `- Preloader coverage: ${row.preloaderCovered ? "Covered" : "Unsupported fields found"}`,
    `- Oversized referenced images: ${row.oversizedImages}`,
    `- Oversized referenced audio: ${row.oversizedAudio}`,
    `- Average referenced image size: ${row.averageImageSize === null ? "n/a" : formatBytes(row.averageImageSize)}`,
    `- Average referenced audio size: ${row.averageAudioSize === null ? "n/a" : formatBytes(row.averageAudioSize)}`,
    "",
    "Media fields used:",
    formatList(row.mediaFieldsUsed),
    "",
    "Fields not currently handled by preloadQuestionMedia:",
    formatList(row.unsupportedFields),
    "",
    "Sample unsupported question ids:",
    formatList(row.unsupportedSamples),
    "",
    "Sample image paths discovered:",
    formatList(row.imagePaths),
    "",
    "Sample audio paths discovered:",
    formatList(row.audioPaths),
    "",
    "Missing referenced image files:",
    formatList(row.missingImages),
    "",
    "Missing referenced audio files:",
    formatList(row.missingAudio)
  ].join("\n");
}

function compareInitialFinal(rowsById, questionsBySkill) {
  const initial = rowsById.get("initial_sounds");
  const final = rowsById.get("final_sounds");
  const initialQuestions = questionsBySkill.get("initial_sounds") || [];
  const finalQuestions = questionsBySkill.get("final_sounds") || [];
  const appSource = fs.readFileSync(path.join(repoRoot, "src", "App.jsx"), "utf8");
  const hasWindowPreloader = /preloadAssessmentQuestionWindow\(\[\s*preparedQuestion,\s*\.\.\.prioritized\.filter/s.test(appSource);
  const hasInitialQueuePreloader = /initialSoundRoundQueueRef\.current\.slice\(0,\s*2\)/.test(appSource);

  return [
    "## Initial Sounds vs Final Sounds",
    "",
    `- Initial Sounds runtime-selectable questions: ${initialQuestions.length}`,
    `- Final Sounds runtime-selectable questions: ${finalQuestions.length}`,
    `- Initial Sounds image field names: ${formatInlineList((initial?.mediaFieldsUsed || []).filter(item => /image/i.test(item)))}`,
    `- Final Sounds image field names: ${formatInlineList((final?.mediaFieldsUsed || []).filter(item => /image/i.test(item)))}`,
    `- Initial Sounds audio field names: ${formatInlineList((initial?.mediaFieldsUsed || []).filter(item => /audio/i.test(item)))}`,
    `- Final Sounds audio field names: ${formatInlineList((final?.mediaFieldsUsed || []).filter(item => /audio/i.test(item)))}`,
    `- Initial Sounds average image size: ${initial?.averageImageSize === null ? "n/a" : formatBytes(initial?.averageImageSize)}`,
    `- Final Sounds average image size: ${final?.averageImageSize === null ? "n/a" : formatBytes(final?.averageImageSize)}`,
    `- Initial Sounds average audio size: ${initial?.averageAudioSize === null ? "n/a" : formatBytes(initial?.averageAudioSize)}`,
    `- Final Sounds average audio size: ${final?.averageAudioSize === null ? "n/a" : formatBytes(final?.averageAudioSize)}`,
    `- Both skills covered by preloadQuestionMedia: ${initial?.preloaderCovered && final?.preloaderCovered ? "Yes" : "No"}`,
    `- Final Sounds unsupported media fields: ${formatInlineList(final?.unsupportedFields || [])}`,
    "- Final Sounds media resolver: same runtime enrichment path as other assessment questions (`enrichQuestionWithExistingMedia`, plus audio role normalization).",
    `- Initial Sounds actual queue preload: ${hasInitialQueuePreloader ? "Yes, current plus next two queued Initial Sounds items." : "Not detected"}`,
    `- Final Sounds next-question preload: ${hasWindowPreloader ? "Yes, selected question plus next two prioritized candidate items." : "Not detected"}`,
    "- Audio warming note: current and next-question audio are loaded with browser-safe preload/fetch cache hints, but browsers may still limit full decode until a user gesture. Nothing autoplays."
  ].join("\n");
}

const rawQuestions = loadCoreQuestionPool().map(question => ({
  ...question,
  filterReason: questionFilterReason(question)
}));
const selectableQuestions = rawQuestions.filter(isSelectable);
const questionsBySkill = new Map(skillTree.map(skill => [skill.id, []]));

selectableQuestions.forEach(question => {
  const skillId = canonicalSkillId(question);
  if (questionsBySkill.has(skillId)) {
    questionsBySkill.get(skillId).push(question);
  }
});

const rows = skillTree.map(skill => rowForSkill(skill, questionsBySkill.get(skill.id) || []));
const rowsById = new Map(rows.map(row => [row.skillId, row]));
const uncoveredRows = rows.filter(row => !row.preloaderCovered);
const skillsWithoutQuestions = rows.filter(row => row.totalEligibleQuestions === 0);
const coveredSkills = rows.filter(row => row.totalEligibleQuestions > 0 && row.preloaderCovered);

const summary = {
  activeSkills: skillTree.length,
  coveredSkills: coveredSkills.length,
  unsupportedSkills: uncoveredRows.length,
  skillsWithoutQuestions: skillsWithoutQuestions.length,
  selectableQuestions: selectableQuestions.length,
  result: uncoveredRows.length || skillsWithoutQuestions.length ? "WARN" : "PASS"
};

const supportedContract = [
  "## Preloader Contract",
  "",
  `- Image fields scanned directly: ${PRELOAD_IMAGE_FIELDS.map(field => `\`${field}\``).join(", ")}`,
  `- Audio fields scanned directly: ${PRELOAD_AUDIO_FIELDS.map(field => `\`${field}\``).join(", ")}`,
  `- Nested collections scanned recursively: ${PRELOAD_NESTED_COLLECTION_FIELDS.map(field => `\`${field}\``).join(", ")}`,
  "- Object maps such as `choiceImages` and `choiceAudio` are scanned recursively by value.",
  "- Current behavior preloads the current question immediately and warms a three-question window where the assessment flow has candidate questions."
].join("\n");

const markdown = [
  "# Assessment Preload Coverage Audit",
  "",
  `Generated by \`npm run check:assessment-preload-coverage\`.`,
  "",
  "## Summary",
  "",
  `- Active assessment skills checked: ${summary.activeSkills}`,
  `- Skills with selectable questions and full preloader coverage: ${summary.coveredSkills}`,
  `- Skills with unsupported media fields: ${summary.unsupportedSkills}`,
  `- Skills without selectable questions: ${summary.skillsWithoutQuestions}`,
  `- Runtime-selectable questions inspected: ${summary.selectableQuestions}`,
  "",
  supportedContract,
  "",
  compareInitialFinal(rowsById, questionsBySkill),
  "",
  "## Skill Coverage Details",
  "",
  rows.map(renderSkillSection).join("\n\n"),
  "",
  "## Console Summary Data",
  "",
  "```json",
  JSON.stringify(summary, null, 2),
  "```",
  ""
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.table([summary]);
console.log("\nAssessment preload coverage by skill:");
console.table(rows.map(row => ({
  skillId: row.skillId,
  eligible: row.totalEligibleQuestions,
  imageQuestions: row.questionsWithImageMedia,
  audioQuestions: row.questionsWithAudioMedia,
  unsupportedFields: row.unsupportedFields.length,
  missingImages: row.missingImages.length,
  missingAudio: row.missingAudio.length,
  oversizedImages: row.oversizedImages,
  oversizedAudio: row.oversizedAudio,
  covered: row.preloaderCovered
})));
console.log(`\nWrote ${path.relative(repoRoot, outputPath)}`);

if (uncoveredRows.length > 0) {
  console.error(`Assessment preload coverage found unsupported media fields in ${uncoveredRows.length} skill(s).`);
  process.exit(1);
}

if (skillsWithoutQuestions.length > 0) {
  console.warn(`Assessment preload coverage warning: ${skillsWithoutQuestions.length} skill(s) had no selectable questions.`);
}

console.log("Assessment preload coverage passed.");
