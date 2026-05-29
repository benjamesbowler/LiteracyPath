#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  audioPreferenceManifest,
  getAudioPreferenceForPath,
  getAudioPreferenceStatus,
  getApprovedAudioPath
} from "../src/data/audioPreferenceManifest.js";
import {
  ASSESSMENT_AUDIO_STANDARD,
  classifyAssessmentAudioPath,
  normalizeAssessmentAudioText,
  replacementInstructionForAudio
} from "../src/utils/audio/assessmentAudioClassifier.js";
import {
  getQuestionAudioPaths,
  getQuestionSkillLabel,
  getQuestionTargetWord,
  loadCoreQuestionPool,
  publicPathExists,
  repoRoot,
  writeFile
} from "./phonicsRuntimeUtils.js";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".ogg"]);
const generatedJsonPath = path.join(repoRoot, "src/content/assessments/assessmentAudioInventory.generated.json");
const generatedSummaryPath = path.join(repoRoot, "src/content/assessments/assessmentAudioCoverageSummary.generated.json");
const baselinePath = path.join(repoRoot, "docs/assets/assessment_audio_voice_baseline.md");
const inventoryPath = path.join(repoRoot, "docs/assets/assessment_audio_inventory.md");
const requestPath = path.join(repoRoot, "docs/assets/replacement_assessment_audio_request.md");
const methodPath = path.join(repoRoot, "docs/assets/assessment_audio_audit_method.md");

function normalizePath(value = "") {
  const text = String(value || "");
  if (!text) return "";
  if (text.startsWith("/")) return text;
  if (text.startsWith("public/")) return `/${text.replace(/^public\//, "")}`;
  return text;
}

function publicFilePath(publicPath = "") {
  if (!publicPath.startsWith("/")) return "";
  return path.join(repoRoot, "public", publicPath.replace(/^\//, ""));
}

function existsPublic(publicPath = "") {
  return publicPath.startsWith("/") && fs.existsSync(publicFilePath(publicPath));
}

function listAudioFiles(dir) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (full.includes(`${path.sep}guided-reading${path.sep}`)) continue;
        walk(full);
      } else if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        out.push(`/${path.relative(path.join(repoRoot, "public"), full).replace(/\\/g, "/")}`);
      }
    }
  };
  walk(root);
  return out;
}

function inferAssessmentType(question = {}) {
  const text = [
    question.assessmentType,
    question.type,
    question.stage,
    question.source,
    question._source,
    question.prompt,
    question.question
  ].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("benchmark")) return "benchmark";
  if (text.includes("cycle")) return "cycle";
  if (text.includes("daily")) return "daily";
  if (text.includes("snapshot")) return "snapshot";
  if (text.includes("exit")) return "exit ticket";
  if (text.includes("question")) return "question bank";
  return "question bank";
}

function inferSkillCategory(question = {}, role = "") {
  const text = [
    question.skillId,
    question.skillName,
    question.skill,
    question.stage,
    question.templateType,
    question.formatType,
    role
  ].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("initial")) return "initial sounds";
  if (text.includes("final") || text.includes("ending")) return "ending sounds";
  if (text.includes("rhyme")) return "rhyming";
  if (text.includes("blend")) return "blending";
  if (text.includes("spell") || text.includes("dictation")) return "spelling";
  if (text.includes("decode") || text.includes("cvc") || text.includes("vowel") || text.includes("digraph")) return "decoding";
  if (text.includes("hfw") || text.includes("high-frequency")) return "word audio";
  if (role.includes("prompt")) return "instructions/prompts";
  if (role.includes("answer")) return "answer options";
  return "other";
}

function scriptForQuestionAudio(question = {}, role = "", option = null) {
  if (option) {
    return normalizeAssessmentAudioText(option.audioText || option.word || option.label || option.text || option.value || option.answer || "");
  }
  if (role.includes("prompt")) {
    return normalizeAssessmentAudioText(question.spokenPrompt || question.promptAudioText || question.prompt || question.question || "");
  }
  return normalizeAssessmentAudioText(
    question.audioText ||
    question.targetWord ||
    getQuestionTargetWord(question) ||
    question.answer ||
    question.correctAnswer ||
    question.prompt ||
    question.question ||
    ""
  );
}

function collectQuestionAudioReferences() {
  const references = [];
  const questions = loadCoreQuestionPool();
  for (const question of questions) {
    const base = {
      question,
      audioIdPrefix: question.id || question.questionId || `${question._source || "question"}-${question._sourceIndex || 0}`,
      sourceReference: `${question._source || "unknown"}${question._sourceIndex !== undefined ? `#${question._sourceIndex}` : ""}`,
      assessmentType: inferAssessmentType(question),
      skill: getQuestionSkillLabel(question) || question.skillId || "unknown",
      active: question.active !== false
    };

    for (const key of ["audioPath", "audioUrl", "audio"]) {
      if (question[key]) {
        references.push({
          ...base,
          audioId: `${base.audioIdPrefix}:${key}`,
          path: normalizePath(question[key]),
          role: key.includes("audio") ? "target/prompt audio" : "target audio",
          script: scriptForQuestionAudio(question, key)
        });
      }
    }

    for (const [index, card] of (question.imageCards || []).entries()) {
      for (const key of ["audio", "audioUrl", "audioPath"]) {
        if (card?.[key]) {
          references.push({
            ...base,
            audioId: `${base.audioIdPrefix}:imageCard:${index}:${key}`,
            path: normalizePath(card[key]),
            role: "answer option audio",
            script: scriptForQuestionAudio(question, "answer option audio", card)
          });
        }
      }
    }

    for (const [index, option] of (question.answerOptions || []).entries()) {
      for (const key of ["audio", "audioUrl", "audioPath"]) {
        if (option?.[key]) {
          references.push({
            ...base,
            audioId: `${base.audioIdPrefix}:answerOption:${index}:${key}`,
            path: normalizePath(option[key]),
            role: "answer option audio",
            script: scriptForQuestionAudio(question, "answer option audio", option)
          });
        }
      }
    }
  }
  return references;
}

function audioMetadata(publicPath = "") {
  const full = publicFilePath(publicPath);
  const ext = path.extname(publicPath).replace(".", "").toLowerCase();
  const base = {
    durationMs: 0,
    format: ext,
    sampleRate: 0,
    bitrate: 0,
    channels: 0,
    bytes: fs.existsSync(full) ? fs.statSync(full).size : 0
  };

  if (!fs.existsSync(full)) return base;

  try {
    const output = execFileSync("afinfo", [full], { encoding: "utf8", maxBuffer: 1024 * 1024 });
    const duration = output.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
    const dataFormat = output.match(/Data format:\s+(\d+)\s+ch,\s+(\d+)\s+Hz/i);
    const bitrate = output.match(/bit rate:\s*(\d+)\s*bits per second/i);
    return {
      ...base,
      durationMs: duration ? Math.round(Number(duration[1]) * 1000) : 0,
      sampleRate: dataFormat ? Number(dataFormat[2]) : 0,
      channels: dataFormat ? Number(dataFormat[1]) : 0,
      bitrate: bitrate ? Number(bitrate[1]) : 0
    };
  } catch {
    return base;
  }
}

function issueForMetadata(meta = {}) {
  const issues = [];
  if (!meta.bytes) issues.push("missing_file");
  if (meta.bytes > 0 && meta.bytes < 800) issues.push("low_quality");
  if (meta.durationMs > 0 && meta.durationMs < 180) issues.push("clipped");
  if (meta.durationMs > 10000) issues.push("script_mismatch");
  if (meta.sampleRate && meta.sampleRate < 22050) issues.push("low_quality");
  if (meta.channels && meta.channels > 1) issues.push("needs_human_review");
  return issues;
}

function replacementPathFor(item) {
  if (item.path.includes("/audio/child-mode/clean-human/")) return item.path;
  const scriptSlug = normalizeAssessmentAudioText(item.script)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-$/g, "") || path.basename(item.path, path.extname(item.path)) || "assessment-audio";
  if (item.skill.includes("high-frequency") || item.skill.toLowerCase().includes("hfw")) {
    return `/audio/child-mode/clean-human/hfw/${scriptSlug}.mp3`;
  }
  if (item.role.includes("prompt") || item.skillCategory === "instructions/prompts") {
    return `/audio/child-mode/clean-human/phrases/${scriptSlug}.mp3`;
  }
  return `/audio/child-mode/clean-human/words/${scriptSlug}.mp3`;
}

function buildInventoryItems() {
  const refs = collectQuestionAudioReferences();
  const physicalAudio = [...new Set([
    ...listAudioFiles("public/audio"),
    ...listAudioFiles("public/media")
  ])].sort();
  const referencedPaths = new Set(refs.map(ref => ref.path).filter(Boolean));
  const items = [];

  for (const ref of refs) {
    const preference = getAudioPreferenceForPath(ref.path);
    const meta = audioMetadata(ref.path);
    const exists = existsPublic(ref.path);
    const classification = classifyAssessmentAudioPath(ref.path, preference);
    const metadataIssues = issueForMetadata(meta);
    const approved = getApprovedAudioPath(ref.script, ref.path);
    const issues = [...new Set([
      ...classification.issues,
      ...metadataIssues,
      ...(!exists ? ["missing_file", "broken_reference"] : []),
      ...(ref.script ? [] : ["script_mismatch", "needs_human_review"]),
      ...(approved && approved !== ref.path ? ["old_original_audio"] : [])
    ])];
    let status = classification.status;
    if (!exists) status = "MISSING_AUDIO";
    else if (issues.includes("broken_reference")) status = "BROKEN_REFERENCE";
    else if (issues.includes("script_mismatch")) status = "REPLACE_SCRIPT_MISMATCH";
    else if (issues.includes("low_quality") || issues.includes("clipped")) status = "REPLACE_LOW_QUALITY";
    else if (issues.includes("old_original_audio")) status = "REPLACE_OLD_ORIGINAL";
    else if (issues.includes("wrong_voice")) status = "REPLACE_WRONG_VOICE";
    else if (issues.includes("needs_human_review") && status !== "KEEP_STANDARD_VOICE") status = "NEEDS_HUMAN_REVIEW";

    items.push({
      audioId: ref.audioId,
      path: ref.path,
      url: ref.path,
      sourceReference: ref.sourceReference,
      assessmentType: ref.assessmentType,
      skill: ref.skill,
      skillCategory: inferSkillCategory(ref.question, ref.role),
      role: ref.role,
      script: ref.script,
      actualFilename: path.basename(ref.path || ""),
      fileExists: exists,
      referenceWorks: exists,
      preferenceStatus: getAudioPreferenceStatus(ref.script, ref.path),
      approvedReplacementPath: approved,
      active: ref.active,
      ...meta,
      matchesStandardVoice: classification.matchesStandardVoice,
      issues,
      status,
      replacementPath: replacementPathFor({ ...ref, skillCategory: inferSkillCategory(ref.question, ref.role) })
    });
  }

  for (const filePath of physicalAudio) {
    if (referencedPaths.has(filePath)) continue;
    const preference = getAudioPreferenceForPath(filePath);
    const meta = audioMetadata(filePath);
    const classification = classifyAssessmentAudioPath(filePath, preference);
    items.push({
      audioId: `physical:${filePath}`,
      path: filePath,
      url: filePath,
      sourceReference: "physical file scan",
      assessmentType: "unknown",
      skill: "unreferenced assessment audio candidate",
      skillCategory: filePath.includes("/phrases/") ? "instructions/prompts" : "other",
      role: "physical file",
      script: preference?.textSpoken || path.basename(filePath, path.extname(filePath)).replace(/-/g, " "),
      actualFilename: path.basename(filePath),
      fileExists: true,
      referenceWorks: false,
      preferenceStatus: preference?.status || "unreferenced",
      approvedReplacementPath: "",
      active: false,
      ...meta,
      matchesStandardVoice: classification.matchesStandardVoice,
      issues: [...new Set([...classification.issues, "needs_human_review"])],
      status: classification.status === "KEEP_STANDARD_VOICE" ? "KEEP_STANDARD_VOICE" : "NEEDS_HUMAN_REVIEW",
      replacementPath: replacementPathFor({ path: filePath, script: preference?.textSpoken || "", skill: "", role: "physical file", skillCategory: "" })
    });
  }

  return { items, refs, physicalAudio };
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function countBy(items, fn) {
  const out = {};
  for (const item of items) {
    const key = fn(item) || "unknown";
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function uniqueBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function baselineCandidateFromPreference(preference, category) {
  const publicPath = preference?.preferredAudioPath || "";
  if (!publicPath || !existsPublic(publicPath)) return null;
  const classification = classifyAssessmentAudioPath(publicPath, preference);
  if (preference.status !== "approved") return null;
  const isPrompt = category === "prompt";
  const isCleanStandard = classification.status === "KEEP_STANDARD_VOICE";
  if (!isPrompt && !isCleanStandard) return null;
  return {
    audioId: `baseline:${preference.key || publicPath}`,
    path: publicPath,
    script: preference.textSpoken || preference.word || preference.key || "",
    skillCategory: category,
    preferenceStatus: preference.status,
    fileExists: true,
    referenceWorks: true,
    matchesStandardVoice: isCleanStandard ? "yes" : "uncertain",
    status: isCleanStandard ? "KEEP_STANDARD_VOICE" : "NEEDS_HUMAN_REVIEW",
    issues: isCleanStandard ? [] : ["needs_human_review"],
    baselineCategory: category,
    baselineReason: isCleanStandard
      ? `Approved clean-human ${category} baseline.`
      : `Approved prompt audio baseline. This path is not clean-human and should be regenerated if prompt voice consistency is required.`,
    ...audioMetadata(publicPath)
  };
}

function baselineFiles(items) {
  const usedPaths = new Set();
  const chosen = [];
  const referenced = items
    .filter(item => item.matchesStandardVoice === "yes" && item.status === "KEEP_STANDARD_VOICE" && item.fileExists)
    .sort((a, b) => a.path.localeCompare(b.path));
  const byPath = uniqueBy(referenced, item => item.path);
  const preferenceBaselines = Object.values(audioPreferenceManifest).map(preference => {
    const publicPath = preference.preferredAudioPath || "";
    if (publicPath.includes("/hfw/")) return baselineCandidateFromPreference(preference, "hfw");
    if (publicPath.includes("/phrases/")) return baselineCandidateFromPreference(preference, "prompt");
    if (publicPath.includes("/words/")) return baselineCandidateFromPreference(preference, "word");
    return null;
  }).filter(Boolean);

  function take(label, candidates, limit) {
    for (const item of candidates) {
      if (chosen.length >= 10 || chosen.filter(row => row.baselineCategory === label).length >= limit) continue;
      if (usedPaths.has(item.path)) continue;
      usedPaths.add(item.path);
      chosen.push({
        ...item,
        baselineCategory: label,
        baselineReason: item.baselineReason || `Approved ${label} baseline.`
      });
    }
  }

  take("hfw", preferenceBaselines.filter(item => item.baselineCategory === "hfw"), 3);
  take("word", preferenceBaselines.filter(item => item.baselineCategory === "word"), 2);
  take("prompt", preferenceBaselines.filter(item => item.baselineCategory === "prompt"), 2);
  take("phonics", byPath.filter(item =>
    item.path.includes("/words/") &&
    ["initial sounds", "ending sounds", "rhyming", "blending", "decoding"].includes(item.skillCategory)
  ), 3);
  take("word", byPath.filter(item => item.path.includes("/words/")), 10);
  take("hfw", byPath.filter(item => item.path.includes("/hfw/")), 10);

  return chosen.slice(0, 10);
}

function buildReplacementItems(referencedItems) {
  const grouped = new Map();
  const candidates = referencedItems.filter(item =>
    item.status !== "KEEP_STANDARD_VOICE" ||
    item.issues.includes("needs_human_review")
  );

  for (const item of candidates) {
    const key = `${item.replacementPath}::${item.script}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        audioIds: new Set([item.audioId]),
        sourceReferences: new Set([item.sourceReference]),
        statuses: new Set([item.status]),
        issuesSet: new Set(item.issues || []),
        totalReferences: 0,
        activeReferences: 0
      });
    }
    const existing = grouped.get(key);
    existing.totalReferences += 1;
    if (item.active) existing.activeReferences += 1;
    existing.audioIds.add(item.audioId);
    existing.sourceReferences.add(item.sourceReference);
    existing.statuses.add(item.status);
    for (const issue of item.issues || []) existing.issuesSet.add(issue);
  }

  return Array.from(grouped.values()).map(item => ({
    ...item,
    audioIds: Array.from(item.audioIds).sort(),
    sourceReferences: Array.from(item.sourceReferences).sort(),
    statuses: Array.from(item.statuses).sort(),
    issues: Array.from(item.issuesSet).sort()
  })).sort((a, b) => a.replacementPath.localeCompare(b.replacementPath));
}

function priorityForReplacementItem(item) {
  const active = item.activeReferences > 0;
  if (active && (item.statuses.includes("MISSING_AUDIO") || item.statuses.includes("BROKEN_REFERENCE") || item.issues.includes("missing_file") || item.issues.includes("broken_reference"))) {
    return "1. Missing/broken audio affecting active assessment questions";
  }
  if (active && (item.statuses.includes("REPLACE_OLD_ORIGINAL") || item.issues.includes("old_original_audio"))) {
    return "2. Old/original audio used in active assessment questions";
  }
  if (item.statuses.includes("NEEDS_HUMAN_REVIEW") && item.totalReferences >= 5) {
    return "3. Human-review items used frequently";
  }
  return "4. Low-priority inactive/rare/uncertain items";
}

function replacementTableRows(items) {
  return items.map(item => [
    item.audioIds.slice(0, 4).join("<br>"),
    item.assessmentType,
    item.skillCategory,
    item.path,
    item.replacementPath,
    item.script || "[SCRIPT NEEDED]",
    item.activeReferences,
    item.totalReferences,
    item.skillCategory.includes("letter") || item.skillCategory.includes("phonological") ? "Confirm whether this is a letter name or phoneme/sound before recording." : "",
    item.role,
    item.path === item.replacementPath ? "overwrite after approval" : "create new clean-human replacement, then update manifest",
    item.statuses.join(", "),
    item.issues.join(", ") || "needs_human_review",
    replacementInstructionForAudio(item.script, item.skillCategory.includes("letter") ? "For letter/sound items, do not confuse letter names with phonemes." : "")
  ]);
}

function buildSummary(items, refs, physicalAudio) {
  const referenced = items.filter(item => item.sourceReference !== "physical file scan");
  return {
    totalReferences: refs.length,
    totalFiles: physicalAudio.length,
    standardVoiceCount: referenced.filter(item => item.status === "KEEP_STANDARD_VOICE").length,
    replacementNeededCount: referenced.filter(item => item.status.startsWith("REPLACE_") || item.status === "MISSING_AUDIO" || item.status === "BROKEN_REFERENCE").length,
    missingCount: referenced.filter(item => item.status === "MISSING_AUDIO" || item.issues.includes("missing_file")).length,
    brokenReferenceCount: referenced.filter(item => item.issues.includes("broken_reference")).length,
    needsHumanReviewCount: referenced.filter(item => item.status === "NEEDS_HUMAN_REVIEW" || item.issues.includes("needs_human_review")).length
  };
}

function writeReports({ items, refs, physicalAudio }) {
  const generatedAt = new Date().toISOString();
  const summary = buildSummary(items, refs, physicalAudio);
  const baseline = baselineFiles(items);
  const referencedItems = items.filter(item => item.sourceReference !== "physical file scan");
  const replacementItems = buildReplacementItems(referencedItems);

  const standardVoice = {
    ...ASSESSMENT_AUDIO_STANDARD,
    baselineFiles: baseline.map(item => ({
      path: item.path,
      script: item.script,
      durationMs: item.durationMs,
      sampleRate: item.sampleRate,
      bitrate: item.bitrate,
      channels: item.channels,
      category: item.baselineCategory || item.skillCategory,
      reason: item.baselineReason || "Approved clean-human path used by assessment questions."
    }))
  };

  writeFile(generatedJsonPath, `${JSON.stringify({
    generatedAt,
    standardVoice,
    summary,
    items: referencedItems.map(item => ({
      audioId: item.audioId,
      path: item.path,
      url: item.url,
      sourceReference: item.sourceReference,
      assessmentType: item.assessmentType,
      skill: item.skill,
      skillCategory: item.skillCategory,
      script: item.script,
      durationMs: item.durationMs,
      format: item.format,
      sampleRate: item.sampleRate,
      bitrate: item.bitrate,
      channels: item.channels,
      matchesStandardVoice: item.matchesStandardVoice,
      issues: item.issues,
      status: item.status
    }))
  }, null, 2)}\n`);
  writeFile(generatedSummaryPath, `${JSON.stringify({
    generatedAt,
    standardVoice,
    summary,
    statusCounts: countBy(referencedItems, item => item.status),
    issueCounts: countBy(referencedItems.flatMap(item => item.issues), issue => issue),
    skillCategoryCounts: countBy(referencedItems, item => item.skillCategory)
  }, null, 2)}\n`);

  const baselineRows = baseline.map(item => [
    item.baselineCategory || item.skillCategory || "",
    item.path,
    item.script,
    item.durationMs,
    item.sampleRate,
    item.bitrate,
    item.channels,
    item.preferenceStatus,
    item.baselineReason || "Approved clean-human path used by assessment questions."
  ]);

  writeFile(baselinePath, `# Assessment Audio Voice Baseline

Generated: ${generatedAt}

## Target Voice

- ${ASSESSMENT_AUDIO_STANDARD.description}
- American English
- Calm, warm, clear, teacher-like
- Child-friendly but not cartoonish
- Consistent pacing and volume
- Clean generated-audio quality
- No background noise, music, sound effects, character acting, clipping, or muffling

## Discovered Config

| Field | Value |
| --- | --- |
| Provider | ${ASSESSMENT_AUDIO_STANDARD.provider || "Not formally recorded in repo"} |
| Voice ID | ${ASSESSMENT_AUDIO_STANDARD.voiceId || "Not formally recorded in repo"} |
| Model ID | ${ASSESSMENT_AUDIO_STANDARD.modelId || "Not formally recorded in repo"} |
| Standard root | ${ASSESSMENT_AUDIO_STANDARD.standardRoot} |
| Import/source convention | ${ASSESSMENT_AUDIO_STANDARD.source} |
| Generation script found | \`tools/generateAudioBatch.js\` defaults to OpenAI TTS env vars, but current approved assessment standard is represented by imported clean-human files. |

## Baseline Files

${baselineRows.length ? table(["Category", "Path", "Expected script", "Duration ms", "Sample rate", "Bitrate", "Channels", "Status", "Reason"], baselineRows) : "_No approved baseline files found._"}

## Notes

No formal provider voice ID was found for the imported clean-human Kimi/Pack 6 files. The baseline therefore uses approved files selected by \`src/data/audioPreferenceManifest.js\`. HFW, word, and phonics examples come from the clean-human standard root where available. Prompt-audio examples are included from currently approved prompt paths; they are marked for future review if they are not yet clean-human.
`);

  const summaryRows = [
    ["Total assessment audio references", summary.totalReferences],
    ["Total physical assessment audio files scanned", summary.totalFiles],
    ["Files matching standard voice", summary.standardVoiceCount],
    ["Files needing replacement", summary.replacementNeededCount],
    ["Missing audio files", summary.missingCount],
    ["Broken references", summary.brokenReferenceCount],
    ["Files needing human review", summary.needsHumanReviewCount]
  ];
  const statusRows = Object.entries(countBy(referencedItems, item => item.status)).sort().map(([status, count]) => [status, count]);
  const issueRows = Object.entries(countBy(referencedItems.flatMap(item => item.issues), issue => issue)).sort().map(([issue, count]) => [issue, count]);
  const inventoryRows = referencedItems.slice(0, 250).map(item => [
    item.audioId,
    item.path,
    item.sourceReference,
    item.assessmentType,
    item.skillCategory,
    item.script,
    item.durationMs,
    item.sampleRate,
    item.bitrate,
    item.channels,
    item.fileExists ? "yes" : "no",
    item.referenceWorks ? "yes" : "no",
    item.matchesStandardVoice,
    item.status,
    item.issues.join(", ") || "-"
  ]);

  writeFile(inventoryPath, `# Assessment Audio Inventory

Generated: ${generatedAt}

## Summary

${table(["Metric", "Count"], summaryRows)}

## Status Counts

${table(["Status", "Count"], statusRows)}

## Issue Counts

${issueRows.length ? table(["Issue", "Count"], issueRows) : "_No issues found._"}

## Skill/Category Counts

${table(["Skill/category", "References"], Object.entries(countBy(referencedItems, item => item.skillCategory)).sort().map(([key, count]) => [key, count]))}

## Inventory Preview

Showing the first 250 referenced assessment audio rows. The complete machine-readable inventory is written to \`src/content/assessments/assessmentAudioInventory.generated.json\`.

${table(["Audio ID", "Path", "Source", "Assessment type", "Skill/category", "Expected script", "Duration ms", "Sample rate", "Bitrate", "Channels", "File exists", "Reference works", "Standard voice", "Status", "Issues"], inventoryRows)}
`);

  const priorityGroups = replacementItems.reduce((groups, item) => {
    const priority = priorityForReplacementItem(item);
    if (!groups[priority]) groups[priority] = [];
    groups[priority].push(item);
    return groups;
  }, {});
  const priorityOrder = [
    "1. Missing/broken audio affecting active assessment questions",
    "2. Old/original audio used in active assessment questions",
    "3. Human-review items used frequently",
    "4. Low-priority inactive/rare/uncertain items"
  ];
  const prioritySections = priorityOrder.map(priority => {
    const rows = priorityGroups[priority] || [];
    return `## Priority ${priority}\n\n- Items: ${rows.length}\n\n${rows.length ? table(["Audio IDs", "Assessment section", "Skill/category", "Current path", "Target replacement path", "Expected spoken script", "Active refs", "Total refs", "Pronunciation notes", "Phoneme/role notes", "Overwrite or version", "Statuses", "Reason", "Instruction"], replacementTableRows(rows)) : "_No items in this priority batch._"}`;
  }).join("\n\n");

  writeFile(requestPath, `# Replacement Assessment Audio Request

Generated: ${generatedAt}

This request includes only referenced assessment audio that is missing, broken, old/original, low-quality, script-mismatched, or uncertain enough to require regeneration/human review.

## Voice Standard

- Neutral soft American female voice
- American English
- Calm, warm, clear, teacher-like
- Child-friendly but not cartoonish
- Natural pacing, slightly slower than normal adult speech but not exaggerated
- Exact script only
- No extra words, intro, file names, music, sound effects, character acting, or background noise
- Normalize volume consistently
- Tiny silence at the beginning and end

## Priority Batch Summary

${table(["Batch", "Items"], priorityOrder.map(priority => [priority, priorityGroups[priority]?.length || 0]))}

${prioritySections}
`);

  writeFile(methodPath, `# Assessment Audio Audit Method

Generated: ${generatedAt}

## What The Tool Checks

- All audio references in the assessment question banks loaded by \`tools/phonicsRuntimeUtils.js\`
- Physical audio files under \`public/audio\` and \`public/media\`, excluding Guided Reading folders
- Whether referenced files exist
- Whether paths are approved by \`src/data/audioPreferenceManifest.js\`
- Whether paths use the current clean-human standard root
- Whether paths are deprecated, review-needed, old/original, Kimi-suffixed alternates, or choice-audio legacy files
- Basic file metadata from macOS \`afinfo\`: duration, sample rate, bitrate, channel count, and file size

## What The Tool Cannot Prove

Code cannot reliably identify speaker voice by listening. Files that are not clearly approved clean-human standard audio are marked for replacement or human review instead of being falsely marked clean.

## Status Rules

- \`KEEP_STANDARD_VOICE\`: approved clean-human path with no detected issue
- \`REPLACE_OLD_ORIGINAL\`: older child-mode, choice-audio, or deprecated audio path
- \`REPLACE_WRONG_VOICE\`: Kimi alternate/review path or known nonstandard voice signal
- \`REPLACE_LOW_QUALITY\`: metadata suggests clipping, very short file, low sample rate, or tiny file
- \`REPLACE_SCRIPT_MISMATCH\`: missing script or suspicious duration/script mismatch
- \`MISSING_AUDIO\`: referenced path does not exist
- \`BROKEN_REFERENCE\`: reference cannot resolve to a public file
- \`NEEDS_HUMAN_REVIEW\`: exists, but voice/script cannot be proven standard by metadata

## Repeatable Command

\`\`\`bash
node tools/auditAssessmentAudio.js
\`\`\`
`);

  return { summary, replacementItems, baseline };
}

const result = buildInventoryItems();
const { summary, replacementItems, baseline } = writeReports(result);

console.log("Assessment Audio Audit");
console.table(summary);
console.log(`Baseline files: ${baseline.length}`);
console.log(`Replacement/human-review request rows: ${replacementItems.length}`);
console.log(`Wrote ${path.relative(repoRoot, baselinePath)}`);
console.log(`Wrote ${path.relative(repoRoot, inventoryPath)}`);
console.log(`Wrote ${path.relative(repoRoot, requestPath)}`);
console.log(`Wrote ${path.relative(repoRoot, methodPath)}`);
console.log(`Wrote ${path.relative(repoRoot, generatedJsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, generatedSummaryPath)}`);
