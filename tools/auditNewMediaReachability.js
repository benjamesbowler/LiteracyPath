import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessmentMediaRegistry,
  getAssessmentMediaByPath,
  normalizeAssessmentMediaWord,
  normalizeAssessmentSkillId
} from "../src/data/assessmentMediaRegistry.js";
import {
  kimiHighQualityMediaStyleImageTasks,
  kimiHighQualityMediaStyleAudioTasks
} from "../src/data/generated/kimiHighQualityMediaStyleManifest.generated.js";
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { languageSkillQuestions } from "../src/data/generated/languageSkillQuestions.generated.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  publicPathExists,
  selectableRuntimeQuestionsForSkill
} from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outJson = path.join(repoRoot, "docs/validation/new_media_reachability_audit.json");
const outMd = path.join(repoRoot, "docs/validation/new_media_reachability_audit.md");
const blockersJson = path.join(repoRoot, "docs/validation/current_assessment_media_blockers.json");
const blockersMd = path.join(repoRoot, "docs/validation/current_assessment_media_blockers.md");
const importAuditPath = path.join(repoRoot, "docs/assets/kimi_high_quality_media_style_import_audit.json");
const priorityAuditPath = path.join(repoRoot, "docs/validation/workbook_media_priority_audit.json");
const contractAuditPath = path.join(repoRoot, "docs/validation/assessment_skill_contract_audit.json");

const LANGUAGE_SKILLS = [
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms"
];
const HFW_SKILLS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const TARGET_SKILLS = [...LANGUAGE_SKILLS, ...HFW_SKILLS];
const TEXT_ONLY_LANGUAGE_SKILLS = new Set(["prefixes_suffixes"]);
const INCOMPLETE_PHASE_MAP_SKILLS = new Set([
  "initial_sounds",
  "final_sounds",
  "cvc_short_vowels",
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "vowel_teams",
  "r_controlled",
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms"
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text);
}

function readJsonIfExists(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listPublicFiles(relativeDir, extensions) {
  const root = path.join(repoRoot, "public", relativeDir);
  if (!fs.existsSync(root)) return [];
  const extSet = new Set(extensions.map(ext => ext.toLowerCase()));
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extSet.has(path.extname(entry.name).toLowerCase())) {
        out.push(`/${path.relative(path.join(repoRoot, "public"), full).replace(/\\/g, "/")}`);
      }
    }
  };
  walk(root);
  return out.sort();
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSkill(value = "") {
  const normalized = normalizeAssessmentSkillId(value);
  if (normalized === "prepositions_of_place") return "prepositions";
  if (normalized === "r_controlled_vowels") return "r_controlled";
  return normalized;
}

function taskPath(task, mediaType) {
  const raw = mediaType === "image" ? task.path || task.suggestedImagePath : task.path || task.suggestedAudioPath;
  return String(raw || "").replace(/^public\//, "/");
}

function expectedImageRole(task = {}) {
  if (task.skillId === "nouns" || task.itemType === "noun") return "noun_image";
  if (task.skillId === "verbs" || task.itemType === "verb") return "verb_action";
  if (task.skillId === "adjectives" || task.itemType === "adjective") return "adjective_visual";
  if (task.skillId === "prepositions") return "preposition_scene";
  if (task.skillId === "plurals" || task.itemType === "plural") return "plural_pair";
  if (task.skillId === "antonyms_synonyms") return "antonym_synonym_scene";
  if (task.skillId === "homophones_homonyms") return "homophone_context";
  if (String(task.skillId || "").startsWith("hfw_")) return "hfw_scene";
  if (task.skillId === "rhyming") return "rhyming_target";
  return "grammar_pos";
}

function questionWords(question = {}) {
  const values = [
    question.targetWord,
    question.word,
    question.answer,
    question.correctAnswer,
    getQuestionTargetWord(question),
    ...(question.answerOptions || []).map(option => option?.value || option?.word || option?.text || option?.label),
    ...(question.options || []).map(option => option?.value || option?.word || option?.text || option?.label),
    ...(question.choices || [])
  ];
  return new Set(values.map(normalizeAssessmentMediaWord).filter(Boolean));
}

function questionSkill(question = {}) {
  return normalizeSkill(question.skillId || question.assessmentSkillId || "");
}

function allRuntimeQuestions() {
  return TARGET_SKILLS.flatMap(skillId => selectableRuntimeQuestionsForSkill(skillId).map(question => ({ ...question, auditSkillId: skillId })));
}

const generatedQuestions = [...hfwAssessmentQuestions, ...languageSkillQuestions];
const runtimeQuestions = allRuntimeQuestions();
const generatedImagePaths = new Set(generatedQuestions.flatMap(getQuestionImagePaths));
const generatedAudioPaths = new Set(generatedQuestions.flatMap(getQuestionAudioPaths));
const runtimeImagePaths = new Set(runtimeQuestions.flatMap(getQuestionImagePaths));
const runtimeAudioPaths = new Set(runtimeQuestions.flatMap(getQuestionAudioPaths));
const runtimeQuestionsBySkill = new Map();
for (const question of runtimeQuestions) {
  const skill = normalizeSkill(question.auditSkillId || questionSkill(question));
  if (!runtimeQuestionsBySkill.has(skill)) runtimeQuestionsBySkill.set(skill, []);
  runtimeQuestionsBySkill.get(skill).push(question);
}

function hasMatchingQuestion(task, mediaType) {
  const skill = normalizeSkill(task.skillId);
  const word = normalizeAssessmentMediaWord(task.targetWord);
  const questions = runtimeQuestionsBySkill.get(skill) || [];
  return questions.some(question => questionWords(question).has(word) && (mediaType !== "image" || !TEXT_ONLY_LANGUAGE_SKILLS.has(skill)));
}

function classifyUnreachable({ task, record, mediaType, path: assetPath, isPhysicalOnly = false }) {
  if (!record) {
    return isPhysicalOnly ? "not in production task manifest" : "no registry record";
  }
  if (record.blocked || record.rejected || record.deprecated || !record.available) return "blocked/rejected/deprecated";
  const skill = normalizeSkill(task?.skillId || record.skillTags?.[0] || "");
  const word = normalizeAssessmentMediaWord(task?.targetWord || record.normalizedWord);
  if (!skill || !TARGET_SKILLS.includes(skill)) return "no matching skill";
  if (!word) return "no matching target word";
  if (mediaType === "image" && task && record.imageRole !== expectedImageRole(task)) return "role mismatch";
  if (mediaType === "audio" && record.audioType !== "whole_word") return "role mismatch";
  if (!hasMatchingQuestion(task || { skillId: skill, targetWord: word }, mediaType)) return "no matching question/template";
  if (INCOMPLETE_PHASE_MAP_SKILLS.has(skill) && !generatedImagePaths.has(assetPath) && !generatedAudioPaths.has(assetPath)) return "no formal phase map";
  return "not yet wired into generated language questions";
}

function assetRowsFromTasks(tasks, mediaType) {
  return tasks.map(task => {
    const assetPath = taskPath(task, mediaType);
    const records = assessmentMediaRegistry.filter(record => record.path === assetPath && record.mediaType === mediaType);
    const record = records.find(item => item.normalizedWord === normalizeAssessmentMediaWord(task.targetWord)) || records[0] || null;
    const generatedUsed = mediaType === "image" ? generatedImagePaths.has(assetPath) : generatedAudioPaths.has(assetPath);
    const runtimeUsed = mediaType === "image" ? runtimeImagePaths.has(assetPath) : runtimeAudioPaths.has(assetPath);
    const approved = Boolean(record?.available);
    const indexed = Boolean(record);
    const matchingQuestion = hasMatchingQuestion(task, mediaType);
    const reachable = approved && (runtimeUsed || generatedUsed || matchingQuestion);
    return {
      taskId: task.id,
      mediaType,
      path: assetPath,
      exists: publicPathExists(assetPath),
      skillId: normalizeSkill(task.skillId),
      targetWord: normalizeAssessmentMediaWord(task.targetWord),
      pair: normalizeAssessmentMediaWord(task.pair || ""),
      indexed,
      registryRecordCount: records.length,
      approved,
      qaStatus: record?.qaStatus || "missing_registry_record",
      blocked: Boolean(record?.blocked),
      rejected: Boolean(record?.rejected),
      deprecated: Boolean(record?.deprecated),
      imageRole: record?.imageRole || "",
      expectedImageRole: mediaType === "image" ? expectedImageRole(task) : "",
      audioType: record?.audioType || "",
      generatedUsed,
      runtimeUsed,
      matchingQuestion,
      reachable,
      unreachableReason: reachable ? "" : classifyUnreachable({ task, record, mediaType, path: assetPath })
    };
  });
}

const imageRows = assetRowsFromTasks(kimiHighQualityMediaStyleImageTasks, "image");
const audioRows = assetRowsFromTasks(kimiHighQualityMediaStyleAudioTasks, "audio");
const physicalImages = listPublicFiles("images/assessment/language", [".webp", ".png", ".jpg", ".jpeg"]);
const physicalAudio = listPublicFiles("audio/vocabulary", [".mp3", ".m4a", ".wav", ".ogg"]);
const taskPaths = new Set([...imageRows, ...audioRows].map(row => row.path));
const physicalOnlyRows = [...physicalImages, ...physicalAudio]
  .filter(assetPath => !taskPaths.has(assetPath))
  .map(assetPath => {
    const mediaType = /\.(?:mp3|m4a|wav|ogg)$/i.test(assetPath) ? "audio" : "image";
    const record = getAssessmentMediaByPath(assetPath, mediaType);
    return {
      taskId: "",
      mediaType,
      path: assetPath,
      exists: publicPathExists(assetPath),
      skillId: "",
      targetWord: "",
      pair: "",
      indexed: Boolean(record),
      registryRecordCount: record ? 1 : 0,
      approved: Boolean(record?.available),
      qaStatus: record?.qaStatus || "not_in_production_task_manifest",
      blocked: Boolean(record?.blocked),
      rejected: Boolean(record?.rejected),
      deprecated: Boolean(record?.deprecated),
      imageRole: record?.imageRole || "",
      expectedImageRole: "",
      audioType: record?.audioType || "",
      generatedUsed: mediaType === "image" ? generatedImagePaths.has(assetPath) : generatedAudioPaths.has(assetPath),
      runtimeUsed: mediaType === "image" ? runtimeImagePaths.has(assetPath) : runtimeAudioPaths.has(assetPath),
      matchingQuestion: false,
      reachable: false,
      unreachableReason: classifyUnreachable({ record, mediaType, path: assetPath, isPhysicalOnly: true })
    };
  });

const allRows = [...imageRows, ...audioRows, ...physicalOnlyRows];
const taskRows = [...imageRows, ...audioRows];
const usedRows = allRows.filter(row => row.runtimeUsed || row.generatedUsed);
const reachableRows = allRows.filter(row => row.reachable);
const unreachableRows = allRows.filter(row => !row.reachable);
const unsafeRows = allRows.filter(row => row.blocked || row.rejected || row.deprecated || row.qaStatus === "review_needed" || row.unreachableReason === "role mismatch");
const safeUnusedRows = unreachableRows.filter(row => row.approved && !unsafeRows.includes(row));

const usageBySkill = TARGET_SKILLS.map(skillId => {
  const rows = allRows.filter(row => row.skillId === skillId);
  const used = rows.filter(row => row.runtimeUsed || row.generatedUsed);
  const reachable = rows.filter(row => row.reachable);
  return {
    skillId,
    importedTaskRecords: rows.length,
    reachable: reachable.length,
    runtimeUsed: used.filter(row => row.runtimeUsed).length,
    generatedUsed: used.filter(row => row.generatedUsed).length,
    approved: rows.filter(row => row.approved).length,
    imagesUsed: unique(used.filter(row => row.mediaType === "image").map(row => row.path)).length,
    audioUsed: unique(used.filter(row => row.mediaType === "audio").map(row => row.path)).length
  };
});

const importAudit = readJsonIfExists(importAuditPath, {});
const priorityAudit = readJsonIfExists(priorityAuditPath, {});
const contractAudit = readJsonIfExists(contractAuditPath, {});
const p1Items = (priorityAudit.summary?.items || priorityAudit.items || []).filter(item => item.priority === "P1");
const hfwP1 = p1Items.filter(item => String(item.skillId || "").startsWith("hfw_"));
const blockerStatus = {
  generatedAt: new Date().toISOString(),
  remainingP1MediaBlockers: p1Items.map(item => ({
    skillId: item.skillId,
    targetWord: item.targetWord,
    itemType: item.itemType,
    imageNeeded: Boolean(item.imageNeeded),
    audioNeeded: Boolean(item.audioNeeded),
    reason: item.reason,
    existingImageCount: item.existingImageCount,
    existingAudioCount: item.existingAudioCount
  })),
  hfwWordsNeedingUniqueSceneVariants: countBy(hfwP1, item => item.skillId),
  hfwRemainingWords: hfwP1.map(item => ({ skillId: item.skillId, targetWord: item.targetWord, reason: item.reason })),
  verbAudioBlockers: p1Items.filter(item => item.skillId === "verbs" && item.audioNeeded).map(item => item.targetWord),
  skillsStillNeedingFormalPhaseMaps: contractAudit.incompleteSkills || [...INCOMPLETE_PHASE_MAP_SKILLS],
  skillsPassingCompleteContracts: contractAudit.passingSkills || [],
  skillsFailingOnlyBecauseMediaMissing: p1Items.length ? unique(p1Items.map(item => item.skillId)) : [],
  skillsFailingBecauseContentTemplatesAreWeak: ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"],
  skillsFailingBecauseFormalPhaseMapsAreIncomplete: contractAudit.incompleteSkills || [...INCOMPLETE_PHASE_MAP_SKILLS]
};

const audit = {
  generatedAt: new Date().toISOString(),
  sourcePack: "kimi_high_quality_media_style_2026-06-05",
  sourceImportAudit: "docs/assets/kimi_high_quality_media_style_import_audit.json",
  summary: {
    totalNewMediaFilesImported: physicalImages.length + physicalAudio.length,
    newImagesImported: physicalImages.length,
    newAudioImported: physicalAudio.length,
    productionTaskRecords: taskRows.length,
    imageTaskRecords: imageRows.length,
    audioTaskRecords: audioRows.length,
    indexedNewImages: unique(imageRows.filter(row => row.indexed).map(row => row.path)).length,
    indexedNewAudio: unique(audioRows.filter(row => row.indexed).map(row => row.path)).length,
    approvedNewImages: unique(imageRows.filter(row => row.approved).map(row => row.path)).length,
    approvedNewAudio: unique(audioRows.filter(row => row.approved).map(row => row.path)).length,
    reachableNewImages: unique(allRows.filter(row => row.mediaType === "image" && row.reachable).map(row => row.path)).length,
    reachableNewAudio: unique(allRows.filter(row => row.mediaType === "audio" && row.reachable).map(row => row.path)).length,
    runtimeUsedNewImages: unique(allRows.filter(row => row.mediaType === "image" && row.runtimeUsed).map(row => row.path)).length,
    runtimeUsedNewAudio: unique(allRows.filter(row => row.mediaType === "audio" && row.runtimeUsed).map(row => row.path)).length,
    unreachableNewImages: unique(allRows.filter(row => row.mediaType === "image" && !row.reachable).map(row => row.path)).length,
    unreachableNewAudio: unique(allRows.filter(row => row.mediaType === "audio" && !row.reachable).map(row => row.path)).length,
    approvedTaskRecords: taskRows.filter(row => row.approved).length,
    reachableTaskRecords: taskRows.filter(row => row.reachable).length,
    physicalOnlyFiles: physicalOnlyRows.length,
    unsafeOrQuestionableAssets: unsafeRows.length
  },
  importedPhysicalFiles: {
    images: physicalImages,
    audio: physicalAudio
  },
  unreachableByReason: countBy(unreachableRows, row => row.unreachableReason),
  reachableCountBySkill: Object.fromEntries(usageBySkill.map(row => [row.skillId, row.reachable])),
  newMediaUsageBySkill: usageBySkill,
  topSkillsImprovedByNewPack: usageBySkill
    .filter(row => row.runtimeUsed || row.generatedUsed)
    .sort((a, b) => (b.imagesUsed + b.audioUsed) - (a.imagesUsed + a.audioUsed))
    .slice(0, 10),
  assetsStillUnusedButSafe: safeUnusedRows.slice(0, 250),
  unsafeOrQuestionableAssets: unsafeRows,
  unindexedPhysicalFiles: allRows.filter(row => !row.indexed),
  rows: allRows,
  hfwStatus: {
    improvedByThisPack: importAudit?.remainingPriorityNeeds ? "No HFW scene-variation blocker was removed by this language pack." : "Not assessed in import audit.",
    remainingP1Words: blockerStatus.hfwRemainingWords,
    blockerSummary: blockerStatus.hfwWordsNeedingUniqueSceneVariants
  },
  blockers: blockerStatus
};

function mdTable(rows, headers) {
  const lines = [];
  lines.push(`| ${headers.map(h => h.label).join(" | ")} |`);
  lines.push(`| ${headers.map(h => h.align === "right" ? "---:" : "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${headers.map(h => String(row[h.key] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  }
  return lines.join("\n");
}

function buildMarkdown(data) {
  const lines = [];
  lines.push("# New Media Reachability Audit", "");
  lines.push(`Generated: ${data.generatedAt}`, "");
  lines.push("## Summary", "");
  for (const [key, value] of Object.entries(data.summary)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("", "## Unreachable By Reason", "");
  for (const [reason, count] of Object.entries(data.unreachableByReason)) {
    lines.push(`- ${reason}: ${count}`);
  }
  lines.push("", "## Usage By Skill", "");
  lines.push(mdTable(data.newMediaUsageBySkill, [
    { key: "skillId", label: "Skill" },
    { key: "importedTaskRecords", label: "Task Records", align: "right" },
    { key: "approved", label: "Approved", align: "right" },
    { key: "reachable", label: "Reachable", align: "right" },
    { key: "runtimeUsed", label: "Runtime Used", align: "right" },
    { key: "imagesUsed", label: "Images Used", align: "right" },
    { key: "audioUsed", label: "Audio Used", align: "right" }
  ]));
  lines.push("", "## Safe But Unused Samples", "");
  if (!data.assetsStillUnusedButSafe.length) lines.push("- None");
  for (const row of data.assetsStillUnusedButSafe.slice(0, 40)) {
    lines.push(`- ${row.path} (${row.skillId || "unknown"}/${row.targetWord || "unknown"}): ${row.unreachableReason}`);
  }
  lines.push("", "## Unsafe Or Questionable", "");
  if (!data.unsafeOrQuestionableAssets.length) lines.push("- None");
  for (const row of data.unsafeOrQuestionableAssets.slice(0, 80)) {
    lines.push(`- ${row.path}: ${row.unreachableReason || row.qaStatus}`);
  }
  lines.push("", "## HFW Status", "");
  lines.push("HFW remains blocked by unique scene-variation requirements. This audit does not fake-pass HFW by counting reused scenes or shuffled answers.", "");
  for (const [skill, count] of Object.entries(data.hfwStatus.blockerSummary)) {
    lines.push(`- ${skill}: ${count} target words still need unique scene variants`);
  }
  return `${lines.join("\n")}\n`;
}

function buildBlockersMarkdown(data) {
  const lines = [];
  lines.push("# Current Assessment Media Blockers", "");
  lines.push(`Generated: ${data.generatedAt}`, "");
  lines.push("## Remaining P1 Media Blockers", "");
  if (!data.remainingP1MediaBlockers.length) lines.push("- None");
  for (const item of data.remainingP1MediaBlockers) {
    lines.push(`- ${item.skillId} / ${item.targetWord}: imageNeeded=${item.imageNeeded}, audioNeeded=${item.audioNeeded}; ${item.reason || "no reason recorded"}`);
  }
  lines.push("", "## HFW Unique Scene Variant Blockers", "");
  for (const [skill, count] of Object.entries(data.hfwWordsNeedingUniqueSceneVariants)) {
    lines.push(`- ${skill}: ${count}`);
  }
  lines.push("", "## Verb Audio Blockers", "");
  lines.push(data.verbAudioBlockers.length ? data.verbAudioBlockers.map(word => `- ${word}`).join("\n") : "- None");
  lines.push("", "## Passing Complete Contracts", "");
  lines.push(data.skillsPassingCompleteContracts.length ? data.skillsPassingCompleteContracts.map(skill => `- ${skill}`).join("\n") : "- None");
  lines.push("", "## Formal Phase Maps Still Needed", "");
  lines.push(data.skillsStillNeedingFormalPhaseMaps.length ? data.skillsStillNeedingFormalPhaseMaps.map(skill => `- ${skill}`).join("\n") : "- None");
  lines.push("", "## Content/Template Weakness", "");
  lines.push(data.skillsFailingBecauseContentTemplatesAreWeak.map(skill => `- ${skill}`).join("\n"));
  return `${lines.join("\n")}\n`;
}

writeJson(outJson, audit);
writeText(outMd, buildMarkdown(audit));
writeJson(blockersJson, blockerStatus);
writeText(blockersMd, buildBlockersMarkdown(blockerStatus));

console.log(`Wrote ${path.relative(repoRoot, outMd)}`);
console.log(`Wrote ${path.relative(repoRoot, outJson)}`);
console.log(`Wrote ${path.relative(repoRoot, blockersMd)}`);
console.log(`Wrote ${path.relative(repoRoot, blockersJson)}`);
console.log(JSON.stringify(audit.summary, null, 2));

const hardFailures = allRows.filter(row =>
  row.unreachableReason === "role mismatch" ||
  ((row.blocked || row.rejected || row.deprecated) && row.reachable)
);
if (hardFailures.length) {
  console.error(`New media reachability audit found ${hardFailures.length} reachable unsafe/role mismatch assets.`);
  process.exitCode = 1;
}
