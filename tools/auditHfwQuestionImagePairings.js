import path from "node:path";

import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { hfwQuestionImageReviewRows } from "../src/data/generated/hfwQuestionImageReview.generated.js";
import { getAssessmentMediaByPath } from "../src/data/assessmentMediaRegistry.js";
import { resolveQuestionMediaDynamically } from "../src/data/assessmentMediaPicker.js";
import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = process.cwd();
const outMd = path.join(repoRoot, "docs/validation/hfw_question_image_pairing_audit.md");
const outJson = path.join(repoRoot, "docs/validation/hfw_question_image_pairing_audit.json");
const hfwSkillIds = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]);
const blockedQaStatuses = new Set(["review_needed", "blocked", "rejected", "deprecated"]);

function imagePathFor(question = {}) {
  return String(question.imagePath || question.imageUrl || question.image || question.primaryImage || question.questionImage || question.targetImagePath || question.targetImageUrl || question.targetImage || "").trim();
}

function pairKey(questionId = "", imagePath = "") {
  return `${questionId}::${String(imagePath || "").trim()}`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

const reviewByPair = new Map(hfwQuestionImageReviewRows.map(row => [pairKey(row.questionId, row.currentImagePath), row]));
const reviewByQuestion = new Map(hfwQuestionImageReviewRows.map(row => [row.questionId, row]));

const rows = hfwAssessmentQuestions
  .filter(question => hfwSkillIds.has(question.skillId))
  .map(question => {
    const questionId = question.approvedQuestionId || question.questionId || question.id || "";
    const sourceImagePath = imagePathFor(question);
    const review = reviewByPair.get(pairKey(questionId, sourceImagePath)) || reviewByQuestion.get(questionId) || null;
    const record = sourceImagePath ? getAssessmentMediaByPath(sourceImagePath, "image") : null;
    const resolved = resolveQuestionMediaDynamically(question, { skillId: question.skillId, level: question.level, phase: question.phase });
    const runtimeImagePath = imagePathFor(resolved);
    const approvedExactPair = Boolean(sourceImagePath && review?.qaStatus === "approved" && review.currentImagePath === sourceImagePath);
    const photorealistic = Boolean(sourceImagePath && (record?.styleType === "photorealistic" || /photo|photoreal|stock|realistic/i.test(sourceImagePath)));
    const embeddedTextRisk = Boolean(sourceImagePath && /watermark|logo|embedded[_-]?text|text[_-]?in[_-]?image/i.test(`${sourceImagePath} ${record?.qaStatus || ""} ${record?.notes || ""}`));
    const blockedMedia = Boolean(sourceImagePath && (!record?.available || blockedQaStatuses.has(record?.qaStatus)));
    const randomGenericFallback = Boolean(sourceImagePath && !approvedExactPair && /generic|fallback|vocabulary|child-assets|lexicon|imported/i.test(`${sourceImagePath} ${record?.imageRole || ""} ${review?.imageSource || ""}`));
    const mismatchRisk = Boolean(sourceImagePath && !approvedExactPair);
    const failures = [];
    if (runtimeImagePath && !approvedExactPair) failures.push("runtime_image_without_exact_qa_approval");
    if (sourceImagePath && photorealistic) failures.push("photorealistic_hfw_image");
    if (sourceImagePath && blockedMedia) failures.push("blocked_or_rejected_media_record");
    if (runtimeImagePath && review?.qaStatus === "rejected") failures.push("rejected_pairing_still_renders");
    if (runtimeImagePath && randomGenericFallback) failures.push("random_generic_fallback_renders");
    return {
      questionId,
      skillId: question.skillId,
      level: question.level,
      phase: question.phase,
      targetWord: question.targetWord,
      fullSentence: question.fullSentence || question.sentenceText || "",
      sourceImagePath,
      runtimeImagePath,
      qaStatus: review?.qaStatus || "missing_review_row",
      imageRole: record?.imageRole || review?.imageRole || "",
      imagePolicy: question.imagePolicy || question.hfwImagePolicy || review?.imagePolicy || "",
      approvedExactPair,
      photorealistic,
      embeddedTextRisk,
      randomGenericFallback,
      mismatchRisk,
      needsKimi: ["rejected", "needs_kimi"].includes(review?.qaStatus),
      failures
    };
  });

const counts = rows.reduce((summary, row) => {
  summary.totalHfwQuestions += 1;
  if (row.sourceImagePath) summary.questionsWithImagePath += 1;
  if (row.approvedExactPair) summary.approvedExactPairings += 1;
  if (row.qaStatus === "pending") summary.pendingPairings += 1;
  if (row.qaStatus === "rejected") summary.rejectedPairings += 1;
  if (row.qaStatus === "needs_kimi") summary.needsKimiPairings += 1;
  if (row.qaStatus === "no_image_required") summary.noImageRequiredRows += 1;
  if (row.runtimeImagePath) summary.runtimeWithImage += 1;
  else summary.runtimeWithoutImage += 1;
  if (row.photorealistic) summary.photorealisticImagesFound += 1;
  if (row.embeddedTextRisk) summary.embeddedTextWatermarkLogoRisk += 1;
  if (row.randomGenericFallback) summary.randomGenericFallbackFound += 1;
  if (row.mismatchRisk) summary.imageMismatchRisk += 1;
  if (row.needsKimi) summary.rowsNeedingKimiReplacement += 1;
  return summary;
}, {
  totalHfwQuestions: 0,
  questionsWithImagePath: 0,
  approvedExactPairings: 0,
  pendingPairings: 0,
  rejectedPairings: 0,
  needsKimiPairings: 0,
  noImageRequiredRows: 0,
  runtimeWithImage: 0,
  runtimeWithoutImage: 0,
  photorealisticImagesFound: 0,
  embeddedTextWatermarkLogoRisk: 0,
  randomGenericFallbackFound: 0,
  imageMismatchRisk: 0,
  rowsNeedingKimiReplacement: 0
});

const failureRows = rows.filter(row => row.failures.length);
const kimiRows = rows.filter(row => row.needsKimi);

writeFile(outJson, `${JSON.stringify({ summary: counts, failures: failureRows, rows }, null, 2)}\n`);
writeFile(outMd, [
  "# HFW Question Image Pairing Audit",
  "",
  "Generated by `npm run audit:hfw-question-images`.",
  "",
  "## Summary",
  "",
  ...Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Failures",
  "",
  failureRows.length
    ? markdownTable(["Question ID", "Skill", "Target", "Image", "Runtime Image", "QA Status", "Failures"], failureRows.map(row => [
      row.questionId,
      row.skillId,
      row.targetWord,
      row.sourceImagePath,
      row.runtimeImagePath,
      row.qaStatus,
      row.failures.join("; ")
    ]))
    : "None.",
  "",
  "## Rows Needing Kimi",
  "",
  kimiRows.length
    ? markdownTable(["Question ID", "Skill", "Target", "Sentence", "Image", "QA Status"], kimiRows.map(row => [
      row.questionId,
      row.skillId,
      row.targetWord,
      row.fullSentence,
      row.sourceImagePath,
      row.qaStatus
    ]))
    : "None.",
  ""
].join("\n"));

console.log("HFW question image pairing audit");
console.table([counts]);
console.log(`Wrote ${path.relative(repoRoot, outMd)}`);

if (failureRows.length) {
  failureRows.slice(0, 80).forEach(row => console.error(`- ${row.questionId}: ${row.failures.join("; ")}`));
  if (failureRows.length > 80) console.error(`...and ${failureRows.length - 80} more`);
  process.exit(1);
}
