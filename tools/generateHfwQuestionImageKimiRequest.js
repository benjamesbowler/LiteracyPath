import path from "node:path";

import { hfwQuestionImageReviewRows } from "../src/data/generated/hfwQuestionImageReview.generated.js";
import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = process.cwd();
const outMd = path.join(repoRoot, "docs/assets/kimi_hfw_question_image_replacement_request.md");
const outCsv = path.join(repoRoot, "docs/assets/kimi_hfw_question_image_replacement_request.csv");
const outJson = path.join(repoRoot, "docs/assets/kimi_hfw_question_image_replacement_request.json");

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function replacementFilename(row = {}) {
  return `/images/assessment/hfw/approved/${row.skillId}/${String(row.questionId || "").toLowerCase()}-sentence-scene.webp`;
}

function scenePrompt(row = {}) {
  const sentence = row.fullSentence || row.sentenceWithBlank || "";
  return [
    `Create one child-friendly LiteracyPath cartoon scene matching this exact sentence: "${sentence}".`,
    "The image must show the sentence meaning, not just the target word.",
    "No text, captions, signs, letters, numbers, watermarks, logos, photorealism, rainbow/babyish style, AI slop, extra hands/fingers/limbs, distorted faces, or clutter.",
    "Use a clean simple classroom-appropriate cartoon style."
  ].join(" ");
}

const requests = hfwQuestionImageReviewRows
  .filter(row => ["rejected", "needs_kimi"].includes(row.qaStatus))
  .map(row => ({
    questionId: row.questionId,
    targetWord: row.targetWord,
    fullSentence: row.fullSentence,
    sentenceWithBlank: row.sentenceWithBlank,
    correctAnswer: row.correctAnswer,
    rejectedImagePath: row.currentImagePath || "",
    rejectionReason: row.rejectionReason || "",
    reviewerNotes: row.reviewerNotes || "",
    requiredImageType: "verified_cartoon_sentence_scene",
    replacementFilename: replacementFilename(row),
    exactSceneDescription: scenePrompt(row),
    imagePrompt: scenePrompt(row)
  }));

writeFile(outJson, `${JSON.stringify(requests, null, 2)}\n`);
writeFile(outCsv, [
  ["questionId", "targetWord", "fullSentence", "sentenceWithBlank", "correctAnswer", "rejectedImagePath", "rejectionReason", "reviewerNotes", "requiredImageType", "replacementFilename", "exactSceneDescription", "imagePrompt"].join(","),
  ...requests.map(row => [
    row.questionId,
    row.targetWord,
    row.fullSentence,
    row.sentenceWithBlank,
    row.correctAnswer,
    row.rejectedImagePath,
    row.rejectionReason,
    row.reviewerNotes,
    row.requiredImageType,
    row.replacementFilename,
    row.exactSceneDescription,
    row.imagePrompt
  ].map(csvEscape).join(","))
].join("\n") + "\n");
writeFile(outMd, [
  "# Kimi HFW Question Image Replacement Request",
  "",
  "Create only clean child-friendly LiteracyPath cartoon sentence scenes. No text, watermarks, logos, photorealism, rainbow/babyish style, AI slop, extra hands/fingers/limbs, distorted faces, or clutter.",
  "",
  `Rows requested: ${requests.length}`,
  "",
  ...requests.map(row => [
    `## ${row.questionId} — ${row.targetWord}`,
    "",
    `- Full sentence: ${row.fullSentence}`,
    `- Sentence with blank: ${row.sentenceWithBlank}`,
    `- Correct answer: ${row.correctAnswer}`,
    `- Rejected image path: ${row.rejectedImagePath || "none"}`,
    `- Reason: ${row.rejectionReason || "needs replacement"}`,
    `- Reviewer notes: ${row.reviewerNotes || ""}`,
    `- Required image type: ${row.requiredImageType}`,
    `- Replacement filename: ${row.replacementFilename}`,
    `- Prompt: ${row.imagePrompt}`,
    ""
  ].join("\n"))
].join("\n"));

console.log(JSON.stringify({
  requests: requests.length,
  markdown: path.relative(repoRoot, outMd),
  csv: path.relative(repoRoot, outCsv),
  json: path.relative(repoRoot, outJson)
}, null, 2));
