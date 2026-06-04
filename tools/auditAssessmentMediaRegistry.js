import fs from "node:fs";
import path from "node:path";

import {
  getAssessmentMediaRegistry,
  getAssessmentMediaByPath,
  findAssessmentMediaCandidates,
  normalizeAssessmentMediaWord,
  normalizeAssessmentSkillId
} from "../src/data/assessmentMediaRegistry.js";
import {
  inferAssessmentQuestionTargetWord,
  validateResolvedQuestionMedia
} from "../src/data/assessmentMediaPicker.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionAudioPaths,
  getQuestionImagePaths,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const PRIORITY_SKILLS = [
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100"
];

const OUT_JSON = path.join(repoRoot, "docs/validation/assessment_media_registry_audit.json");
const OUT_MD = path.join(repoRoot, "docs/validation/assessment_media_registry_audit.md");

function increment(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function topEntries(map, limit = 50) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

function phaseKey(question = {}) {
  const level = Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
  const phase = Number(question.phase || question.assessmentPhase || question.initialSoundRoundPhase || 1) === 2 ? 2 : 1;
  return `L${level}P${phase}`;
}

function summarizeRegistry(registry) {
  const imageAssets = registry.filter(record => record.mediaType === "image");
  const audioAssets = registry.filter(record => record.mediaType === "audio");
  const blocked = registry.filter(record => record.blocked || record.rejected || record.deprecated || !record.available);
  const noWordOrTag = registry.filter(record => !record.normalizedWord && record.skillTags.length === 0);
  const noSkillEligibility = registry.filter(record => record.skillTags.length === 0);
  const missingFiles = registry.filter(record => record.path?.startsWith("/") && !publicPathExists(record.path));
  return {
    totalAssets: registry.length,
    totalImageAssets: imageAssets.length,
    totalAudioAssets: audioAssets.length,
    approvedImageAssets: imageAssets.filter(record => record.available).length,
    approvedAudioAssets: audioAssets.filter(record => record.available).length,
    blockedRejectedDeprecatedAssets: blocked.length,
    assetsWithNoWordOrTag: noWordOrTag.length,
    assetsWithNoSkillEligibility: noSkillEligibility.length,
    missingPublicFiles: missingFiles.length
  };
}

function summarizeWordVariants(registry, mediaType) {
  const byWord = new Map();
  for (const record of registry.filter(item => item.mediaType === mediaType && item.available)) {
    if (!record.normalizedWord) continue;
    const item = byWord.get(record.normalizedWord) || { word: record.normalizedWord, count: 0, roles: new Set(), skills: new Set() };
    item.count += 1;
    if (record.imageRole) item.roles.add(record.imageRole);
    for (const skill of record.skillTags || []) item.skills.add(skill);
    byWord.set(record.normalizedWord, item);
  }
  return [...byWord.values()]
    .map(item => ({ ...item, roles: [...item.roles], skills: [...item.skills] }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

function currentQuestionMediaUsage() {
  const imageCounts = new Map();
  const audioCounts = new Map();
  const reachablePaths = new Set();
  const reachableUnsafe = [];
  const missingWholeWordAudioCases = [];
  const imageRoleMismatches = [];
  const skillSummaries = [];

  for (const skillId of PRIORITY_SKILLS) {
    const all = buildRuntimeQuestionsForSkill(skillId);
    const selectable = selectableRuntimeQuestionsForSkill(skillId);
    const phaseCounts = {};
    const uniqueImages = new Set();
    const uniqueAudio = new Set();
    const uniqueTargets = new Set();

    for (const question of selectable) {
      phaseCounts[phaseKey(question)] = (phaseCounts[phaseKey(question)] || 0) + 1;
      const target = inferAssessmentQuestionTargetWord(question);
      if (target) uniqueTargets.add(target);
      const imagePaths = getQuestionImagePaths(question);
      const primaryImagePath = imagePaths[0] || "";
      for (const imagePath of imagePaths) {
        increment(imageCounts, imagePath);
        reachablePaths.add(`image:${imagePath}`);
        uniqueImages.add(imagePath);
        const record = getAssessmentMediaByPath(imagePath, "image");
        if (record && !record.available) reachableUnsafe.push({ skillId, questionId: question.id, mediaType: "image", path: imagePath, reason: record.qaStatus });
        if (imagePath === primaryImagePath && record?.normalizedWord && target && record.normalizedWord !== normalizeAssessmentMediaWord(target)) {
          imageRoleMismatches.push({ skillId, questionId: question.id, target, path: imagePath, registryWord: record.normalizedWord, imageRole: record.imageRole });
        }
      }
      for (const audioPath of getQuestionAudioPaths(question)) {
        increment(audioCounts, audioPath);
        reachablePaths.add(`audio:${audioPath}`);
        uniqueAudio.add(audioPath);
        const record = getAssessmentMediaByPath(audioPath, "audio");
        if (record && !record.available) reachableUnsafe.push({ skillId, questionId: question.id, mediaType: "audio", path: audioPath, reason: record.qaStatus });
        if (/listen|find the word|pick the word|matches the picture/i.test(String([question.prompt, question.question, question.templateType, question.formatType].join(" ")))) {
          if (!record || record.audioType !== "whole_word" || record.normalizedWord !== normalizeAssessmentMediaWord(target)) {
            missingWholeWordAudioCases.push({ skillId, questionId: question.id, target, path: audioPath || "(missing)" });
          }
        }
      }
      for (const issue of validateResolvedQuestionMedia(question)) {
        reachableUnsafe.push({ skillId, questionId: question.id, mediaType: "resolved", path: "", reason: issue });
      }
    }

    const approvedSkillImages = getAssessmentMediaRegistry().filter(record =>
      record.mediaType === "image" && record.available && record.skillTags.includes(skillId)
    ).length;
    skillSummaries.push({
      skillId,
      runtimeQuestions: all.length,
      selectableQuestions: selectable.length,
      phaseCounts,
      uniqueTargets: uniqueTargets.size,
      uniqueImages: uniqueImages.size,
      uniqueAudio: uniqueAudio.size,
      approvedSkillImages,
      weakMediaDiversity: selectable.length >= 60 && uniqueImages.size < 45 && approvedSkillImages > uniqueImages.size
    });
  }

  return {
    topOverusedImages: topEntries(imageCounts, 50),
    topOverusedAudio: topEntries(audioCounts, 50),
    reachablePaths,
    reachableUnsafe,
    missingWholeWordAudioCases,
    imageRoleMismatches,
    skillSummaries
  };
}

function buildMarkdown(audit) {
  const lines = [];
  lines.push("# Assessment Media Registry Audit");
  lines.push("");
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push("");
  lines.push("## Registry Summary");
  for (const [key, value] of Object.entries(audit.summary)) lines.push(`- ${key}: ${value}`);
  lines.push(`- reachableApprovedAssets: ${audit.reachability.reachableApprovedAssets}`);
  lines.push(`- unreachableApprovedAssets: ${audit.reachability.unreachableApprovedAssets}`);
  lines.push("");
  lines.push("## Skill Diversity");
  lines.push("| Skill | Selectable | Unique targets | Unique images | Approved skill images | Weak diversity |");
  lines.push("| --- | ---: | ---: | ---: | ---: | --- |");
  for (const skill of audit.skillSummaries) {
    lines.push(`| ${skill.skillId} | ${skill.selectableQuestions} | ${skill.uniqueTargets} | ${skill.uniqueImages} | ${skill.approvedSkillImages} | ${skill.weakMediaDiversity ? "YES" : "no"} |`);
  }
  lines.push("");
  lines.push("## Top Overused Images");
  for (const item of audit.topOverusedImages.slice(0, 20)) lines.push(`- ${item.count}x ${item.path}`);
  lines.push("");
  lines.push("## Top Overused Audio");
  for (const item of audit.topOverusedAudio.slice(0, 20)) lines.push(`- ${item.count}x ${item.path}`);
  lines.push("");
  lines.push("## Safety Findings");
  lines.push(`- reachable unsafe assets: ${audit.reachableUnsafe.length}`);
  lines.push(`- missing whole-word audio cases: ${audit.missingWholeWordAudioCases.length}`);
  lines.push(`- image role/word mismatches: ${audit.imageRoleMismatches.length}`);
  return `${lines.join("\n")}\n`;
}

const registry = getAssessmentMediaRegistry();
const summary = summarizeRegistry(registry);
const usage = currentQuestionMediaUsage();
const reachableAssetIds = new Set([...usage.reachablePaths].filter(id => getAssessmentMediaByPath(id.split(":").slice(1).join(":"), id.split(":")[0])?.available));
const approvedRegistry = registry.filter(record => record.available);
const unreachableApproved = approvedRegistry.filter(record => !usage.reachablePaths.has(`${record.mediaType}:${record.path}`));

const audit = {
  generatedAt: new Date().toISOString(),
  prioritySkills: PRIORITY_SKILLS,
  summary,
  reachability: {
    reachableApprovedAssets: reachableAssetIds.size,
    unreachableApprovedAssets: unreachableApproved.length,
    unreachableApprovedSamples: unreachableApproved.slice(0, 100).map(record => ({ id: record.id, word: record.normalizedWord, path: record.path, mediaType: record.mediaType, role: record.imageRole || record.audioType, sourceManifest: record.sourceManifest }))
  },
  targetWordsWithImageVariantCount: summarizeWordVariants(registry, "image"),
  targetWordsWithAudioVariantCount: summarizeWordVariants(registry, "audio"),
  skillSummaries: usage.skillSummaries,
  topOverusedImages: usage.topOverusedImages,
  topOverusedAudio: usage.topOverusedAudio,
  reachableUnsafe: usage.reachableUnsafe.slice(0, 200),
  missingWholeWordAudioCases: usage.missingWholeWordAudioCases.slice(0, 200),
  imageRoleMismatches: usage.imageRoleMismatches.slice(0, 200),
  registryFiles: {
    registryPath: "src/data/assessmentMediaRegistry.js",
    pickerPath: "src/data/assessmentMediaPicker.js"
  }
};

writeFile(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
writeFile(OUT_MD, buildMarkdown(audit));

console.log(`Assessment media registry audit written to ${path.relative(repoRoot, OUT_MD)}`);
console.log(`Images indexed: ${summary.totalImageAssets} (${summary.approvedImageAssets} approved)`);
console.log(`Audio indexed: ${summary.totalAudioAssets} (${summary.approvedAudioAssets} approved)`);
console.log(`Reachable approved assets: ${audit.reachability.reachableApprovedAssets}`);
console.log(`Unreachable approved assets: ${audit.reachability.unreachableApprovedAssets}`);
if (usage.reachableUnsafe.length || usage.imageRoleMismatches.length) {
  console.warn(`Unsafe/mismatched reachable media reported: ${usage.reachableUnsafe.length + usage.imageRoleMismatches.length}`);
}
