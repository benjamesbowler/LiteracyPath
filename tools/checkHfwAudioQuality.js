import fs from "node:fs";
import path from "node:path";

import {
  getApprovedAudioPath,
  getAudioPreference,
  getAudioPreferenceForPath,
  getAudioPreferenceStatus,
  getAudioReviewNote
} from "../src/data/audioPreferenceManifest.js";
import {
  buildRuntimeQuestionsForSkill,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const hfwSkillIds = ["hfw_1_25", "hfw_26_50", "hfw_51_100"];
const audioFormats = new Set(["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"]);
const knownBadWholeWordAudio = new Map([
  ["for", {
    problem: "Live QA heard the MP3 spell the letters f-o-r instead of saying the whole word.",
    replacementPath: "/audio/child-mode/clean-human/hfw/for.mp3"
  }]
]);

function format(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function targetWord(question = {}) {
  return normalizeWord(question.audioText || question.targetWord || question.itemKey || question.answer || question.correctAnswer);
}

function audioPath(question = {}) {
  return question.audioPath || question.audioUrl || question.audio || "";
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function fileSize(assetPath = "") {
  if (!assetPath.startsWith("/")) return 0;
  const full = path.join(repoRoot, "public", assetPath.replace(/^\//, ""));
  if (!fs.existsSync(full)) return 0;
  return fs.statSync(full).size;
}

function inspectQuestion(question, skillId) {
  const word = targetWord(question);
  const pathValue = audioPath(question);
  const preference = getAudioPreferenceForPath(pathValue) || getAudioPreference(word);
  const status = getAudioPreferenceStatus(word, pathValue);
  const approvedPath = getApprovedAudioPath(word, pathValue);
  const knownBad = knownBadWholeWordAudio.get(word);
  const note = getAudioReviewNote(pathValue) || preference?.notes || "";
  const issues = [];

  if (!pathValue) issues.push("missing target audio path");
  if (!approvedPath) {
    issues.push(`not approved exact-word audio; status=${status}`);
  } else if (!publicPathExists(approvedPath)) {
    issues.push(`approved audio file missing on disk: ${approvedPath}`);
  }
  if (knownBad) issues.push(knownBad.problem);
  if (/\b(letter|alphabet|spell|spelling|phoneme|sound)\b/i.test(`${pathValue} ${note}`)) {
    issues.push("suspicious letter/spelling metadata or path");
  }

  return {
    skillId,
    questionId: question.id,
    word,
    audioPath: pathValue,
    approvedPath,
    status,
    source: question.source || question._source || "",
    bytes: fileSize(pathValue),
    issues,
    manualReviewRequired: issues.length === 0,
    replacementPath: knownBad?.replacementPath || pathValue || `/audio/child-mode/clean-human/hfw/${word}.mp3`
  };
}

const rows = [];
const liveRows = [];
for (const skillId of hfwSkillIds) {
  for (const question of buildRuntimeQuestionsForSkill(skillId)) {
    if (audioFormats.has(format(question))) {
      rows.push(inspectQuestion(question, skillId));
    }
  }
  for (const question of selectableRuntimeQuestionsForSkill(skillId)) {
    if (audioFormats.has(format(question))) {
      liveRows.push(inspectQuestion(question, skillId));
    }
  }
}

const badOrSuspicious = rows.filter(row => row.issues.length > 0);
const manualReview = rows.filter(row => row.manualReviewRequired);
const liveBad = liveRows.filter(row => row.issues.length > 0);
const knownBadStillApproved = rows.filter(row =>
  knownBadWholeWordAudio.has(row.word) &&
  Boolean(row.approvedPath)
);

const badRows = badOrSuspicious.map(row => [
  row.skillId,
  row.questionId,
  row.word,
  row.audioPath,
  row.status,
  row.issues.join("; ")
]);

const manualRows = manualReview.map(row => [
  row.skillId,
  row.questionId,
  row.word,
  row.audioPath,
  row.bytes,
  "manual_review_required"
]);

const markdown = `# HFW Audio Quality Audit

Generated: ${new Date().toISOString()}

## Summary

- HFW audio-recognition candidates inspected: ${rows.length}
- Live selectable HFW audio-recognition candidates: ${liveRows.length}
- Bad/suspicious candidates: ${badOrSuspicious.length}
- Bad/suspicious live candidates: ${liveBad.length}
- Known bad words blocked from approved live audio: ${knownBadStillApproved.length === 0 ? "yes" : "no"}
- Manual listen-review candidates: ${manualReview.length}

Automated code cannot hear MP3 content. This audit blocks known bad/review-needed mappings and flags the remaining approved HFW audio-recognition files for human listening review.

## Bad Or Suspicious HFW Audio

${badRows.length ? table(["Skill", "Question ID", "Word", "Current path", "Status", "Problem"], badRows) : "_None._"}

## Manual Review Required

${manualRows.length ? table(["Skill", "Question ID", "Word", "Path", "Bytes", "Status"], manualRows) : "_None._"}
`;

const replacementRequests = new Map();
for (const row of badOrSuspicious
  .filter(row => row.word && (knownBadWholeWordAudio.has(row.word) || row.status !== "approved"))
  ) {
  const key = row.replacementPath || row.audioPath || row.word;
  if (!replacementRequests.has(key)) {
    replacementRequests.set(key, {
      ...row,
      questionIds: new Set([row.questionId]),
      skillIds: new Set([row.skillId])
    });
  } else {
    const existing = replacementRequests.get(key);
    existing.questionIds.add(row.questionId);
    existing.skillIds.add(row.skillId);
  }
}

const requestRows = Array.from(replacementRequests.values()).map(row => [
  row.word,
  row.audioPath,
  row.issues.join("; "),
  row.replacementPath,
  Array.from(row.skillIds).sort().join(", "),
  Array.from(row.questionIds).sort().join(", "),
  `Record MP3 saying only "${row.word}". Clear adult voice; American or neutral international English; no spelling; no sentence; no music; no effects; normalized volume; short silence before and after.`
]);

const requestMarkdown = `# Kimi HFW Bad Audio Replacement Request

Generated: ${new Date().toISOString()}

Create clean replacement MP3 files for each row.

Rules for every file:
- Say the exact word only.
- Do not spell letters.
- Do not say "the word is".
- No sentence, music, sound effects, or commentary.
- Clear adult voice.
- American or neutral international English.
- Normalized volume with short silence before and after.

${requestRows.length ? table(["Word", "Current path", "Problem", "Required replacement path", "Skills", "Question IDs", "Instruction"], requestRows) : "_No replacement rows generated._"}
`;

writeFile(path.join(repoRoot, "docs/validation/hfw_audio_quality_audit.md"), markdown);
writeFile(path.join(repoRoot, "docs/assets/kimi_hfw_bad_audio_replacement_request.md"), requestMarkdown);

console.log("HFW Audio Quality Audit");
console.log(`Inspected audio-recognition candidates: ${rows.length}`);
console.log(`Live selectable audio-recognition candidates: ${liveRows.length}`);
console.log(`Bad/suspicious candidates: ${badOrSuspicious.length}`);
console.log(`Bad/suspicious live candidates: ${liveBad.length}`);
console.log(`Manual review candidates: ${manualReview.length}`);
console.log(`Known bad still approved: ${knownBadStillApproved.length}`);
console.log("Wrote docs/validation/hfw_audio_quality_audit.md");
console.log("Wrote docs/assets/kimi_hfw_bad_audio_replacement_request.md");

if (knownBadStillApproved.length || liveBad.length) {
  console.error(badRows.slice(0, 20).map(row => `- ${row.join(" | ")}`).join("\n"));
  process.exit(1);
}
