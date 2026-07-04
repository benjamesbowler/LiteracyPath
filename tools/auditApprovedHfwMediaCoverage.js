import path from "node:path";

import {
  hfwApprovedQuestionBank
} from "../src/data/generated/hfwApprovedQuestionBank.generated.js";
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import {
  getAssessmentMediaByPath,
  normalizeAssessmentMediaWord
} from "../src/data/assessmentMediaRegistry.js";
import { getQuestionImagePaths, repoRoot, writeFile } from "./phonicsRuntimeUtils.js";

const outMd = path.join(repoRoot, "docs/validation/approved_hfw_media_coverage_audit.md");
const outJson = path.join(repoRoot, "docs/validation/approved_hfw_media_coverage_audit.json");
const requestMd = path.join(repoRoot, "docs/assets/kimi_approved_hfw_missing_cartoon_media_request.md");
const requestCsv = path.join(repoRoot, "docs/assets/kimi_approved_hfw_missing_cartoon_media_request.csv");

const badPathPattern = /\b(?:photo|photoreal|photo-real|stock|watermark|logo|rainbow|realistic)\b/i;
const allowedPolicies = new Set(["no_image", "verified_cartoon_sentence_scene", "verified_cartoon_target_scene"]);
const verifiedPolicies = new Set(["verified_cartoon_sentence_scene", "verified_cartoon_target_scene"]);
const verifiedRoles = new Set(["verified_cartoon_sentence_scene", "verified_cartoon_target_scene", "verified_sentence_scene", "verified_target_scene"]);
const strictRuntimeRejectPattern = /Tap the word|Find the word|Which word says|When the train slowed|When the ball bounced|before snack|with a smile|may choose a book|truck stopped by the gate/i;

function questionId(question = {}) {
  return String(question.approvedQuestionId || question.questionId || question.id || "");
}

function imagePolicy(question = {}) {
  return String(question.imagePolicy || question.hfwImagePolicy || "no_image");
}

function escapeMarkdown(value = "") {
  return String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeMarkdown).join(" | ")} |`)
  ].join("\n");
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function runtimeRowFor(approvedRow = {}) {
  return hfwAssessmentQuestions.find(question => questionId(question) === approvedRow.questionId) || null;
}

function isStrictRuntimeReject(approvedRow = {}) {
  return strictRuntimeRejectPattern.test([
    approvedRow.prompt,
    approvedRow.sentenceWithBlank,
    approvedRow.fullSentence
  ].filter(Boolean).join(" "));
}

function inspectRuntimeQuestion(question = {}) {
  const images = getQuestionImagePaths(question);
  const policy = imagePolicy(question);
  const failures = [];
  const records = images.map(imagePath => ({
    imagePath,
    record: getAssessmentMediaByPath(imagePath, "image")
  }));
  if (!allowedPolicies.has(policy)) failures.push(`invalid_image_policy:${policy}`);
  if (policy === "no_image" && images.length) failures.push("image_present_when_policy_no_image");
  for (const { imagePath, record } of records) {
    if (!record) {
      failures.push(`image_not_in_registry:${imagePath}`);
      continue;
    }
    if (!verifiedPolicies.has(policy)) failures.push(`unverified_image_policy:${policy}`);
    if (!verifiedRoles.has(record.imageRole)) failures.push(`unverified_image_role:${record.imageRole || "unknown"}`);
    if (policy === "verified_cartoon_target_scene" && record.normalizedWord !== normalizeAssessmentMediaWord(question.targetWord)) {
      failures.push(`image_target_mismatch:${record.normalizedWord}`);
    }
    if (record.styleType === "photorealistic" || badPathPattern.test(imagePath)) failures.push(`photoreal_or_bad_style:${imagePath}`);
    if (["review_needed", "blocked", "rejected", "deprecated"].includes(record.qaStatus)) failures.push(`bad_qa_status:${record.qaStatus}`);
    if (!record.available) failures.push(`image_not_runtime_available:${imagePath}`);
  }
  return {
    images,
    records,
    failures: [...new Set(failures)]
  };
}

const rows = hfwApprovedQuestionBank.map(approvedRow => {
  const question = runtimeRowFor(approvedRow);
  const strictRuntimeReject = !question && isStrictRuntimeReject(approvedRow);
  const inspection = question
    ? inspectRuntimeQuestion(question)
    : { images: [], records: [], failures: strictRuntimeReject ? [] : ["missing_runtime_question"] };
  return {
    questionId: approvedRow.questionId,
    skillId: approvedRow.skillId,
    targetWord: approvedRow.targetWord,
    level: approvedRow.level,
    sentenceWithBlank: approvedRow.sentenceWithBlank,
    fullSentence: approvedRow.fullSentence,
    imagePolicy: question ? imagePolicy(question) : approvedRow.imagePolicy,
    imagePath: inspection.images[0] || "",
    imageRole: inspection.records[0]?.record?.imageRole || "",
    imageTarget: inspection.records[0]?.record?.normalizedWord || "",
    styleType: inspection.records[0]?.record?.styleType || "",
    qaStatus: inspection.records[0]?.record?.qaStatus || "",
    cartoonImageNeeded: approvedRow.cartoonImageNeeded,
    imagePrompt: approvedRow.imagePrompt,
    runtimeGenerated: Boolean(question),
    strictRuntimeReject,
    status: inspection.failures.length ? "fail" : strictRuntimeReject ? "skipped" : "pass",
    failureReason: strictRuntimeReject ? "strict_runtime_reject" : inspection.failures.join("; ")
  };
});

const bySkill = {};
const byTarget = {};
for (const row of rows) {
  bySkill[row.skillId] ||= { total: 0, runtimeGenerated: 0, strictRuntimeRejected: 0, withVerifiedImage: 0, noImage: 0, failures: 0, needsKimi: 0 };
  byTarget[`${row.skillId}:${row.targetWord}`] ||= { total: 0, runtimeGenerated: 0, strictRuntimeRejected: 0, withVerifiedImage: 0, noImage: 0, failures: 0, needsKimi: 0 };
  for (const bucket of [bySkill[row.skillId], byTarget[`${row.skillId}:${row.targetWord}`]]) {
    bucket.total += 1;
    if (row.runtimeGenerated) bucket.runtimeGenerated += 1;
    if (row.strictRuntimeReject) bucket.strictRuntimeRejected += 1;
    if (row.imagePath && verifiedPolicies.has(row.imagePolicy)) bucket.withVerifiedImage += 1;
    if (row.runtimeGenerated && !row.imagePath && row.imagePolicy === "no_image") bucket.noImage += 1;
    if (row.status === "fail") bucket.failures += 1;
    if (row.runtimeGenerated && row.cartoonImageNeeded && !row.imagePath) bucket.needsKimi += 1;
  }
}

const failureRows = rows.filter(row => row.status === "fail");
const skippedRows = rows.filter(row => row.status === "skipped");
const runtimeRows = rows.filter(row => row.runtimeGenerated);
const kimiRows = rows.filter(row => row.runtimeGenerated && row.cartoonImageNeeded && !row.imagePath);
const photorealRows = rows.filter(row => /photoreal|photo|realistic/i.test(`${row.styleType} ${row.imagePath} ${row.failureReason}`));
const embeddedTextRows = rows.filter(row => /watermark|logo|embedded_text|text_in_image/i.test(`${row.imagePath} ${row.failureReason}`));
const randomMismatchRows = rows.filter(row => /mismatch|unverified_image_role|unverified_image_policy|image_present_when_policy_no_image/i.test(row.failureReason));

const summaryRows = Object.entries(bySkill).map(([skillId, counts]) => [
  skillId,
  counts.total,
  counts.runtimeGenerated,
  counts.strictRuntimeRejected,
  counts.withVerifiedImage,
  counts.noImage,
  counts.needsKimi,
  counts.failures
]);

const markdown = [
  "# Approved HFW Media Coverage Audit",
  "",
  "Generated by `npm run audit:approved-hfw-media`.",
  "",
  "## Summary",
  "",
  `- Total approved HFW rows: ${rows.length}`,
  `- Generated runtime HFW rows: ${runtimeRows.length}`,
  `- Strict runtime rejected rows: ${skippedRows.length}`,
  `- Rows with verified cartoon image: ${rows.filter(row => row.imagePath && verifiedPolicies.has(row.imagePolicy)).length}`,
  `- Runtime rows with no image and valid no_image policy: ${runtimeRows.filter(row => !row.imagePath && row.imagePolicy === "no_image").length}`,
  `- Rows with photorealistic image: ${photorealRows.length}`,
  `- Rows with embedded text/watermark/logo image: ${embeddedTextRows.length}`,
  `- Rows with random/mismatched/unverified image: ${randomMismatchRows.length}`,
  `- Rows needing Kimi cartoon replacement images: ${kimiRows.length}`,
  "",
  "## By Skill",
  "",
  table(["Skill", "Approved Rows", "Runtime Rows", "Strict Rejects", "Verified Images", "No Image Valid", "Needs Kimi", "Failures"], summaryRows),
  "",
  "## Failures",
  "",
  failureRows.length
    ? table(["Question ID", "Skill", "Target", "Image Path", "Policy", "Failure"], failureRows.map(row => [
      row.questionId,
      row.skillId,
      row.targetWord,
      row.imagePath,
      row.imagePolicy,
      row.failureReason
    ]))
    : "None.",
  ""
].join("\n");

const requestLines = [
  "# Kimi Approved HFW Missing Cartoon Media Request",
  "",
  "Create only clean cartoon LiteracyPath-style images. No photorealism, embedded text, watermarks, logos, rainbow/babyish style, AI slop, extra hands/fingers/limbs, or distorted faces.",
  "",
  "| Question ID | Skill | Target | Level | Sentence | Suggested Path | Prompt |",
  "|---|---|---|---:|---|---|---|",
  ...kimiRows.map(row => {
    const suggestedPath = `/images/assessment/hfw/approved/${row.skillId}/${row.questionId.toLowerCase()}.webp`;
    return `| ${row.questionId} | ${row.skillId} | ${row.targetWord} | ${row.level} | ${escapeMarkdown(row.fullSentence)} | ${suggestedPath} | ${escapeMarkdown(row.imagePrompt)} |`;
  }),
  ""
];

const csvRows = [
  ["questionId", "skillId", "targetWord", "level", "fullSentence", "suggestedPath", "imagePrompt"],
  ...kimiRows.map(row => [
    row.questionId,
    row.skillId,
    row.targetWord,
    row.level,
    row.fullSentence,
    `/images/assessment/hfw/approved/${row.skillId}/${row.questionId.toLowerCase()}.webp`,
    row.imagePrompt
  ])
];

writeFile(outMd, markdown);
writeFile(outJson, `${JSON.stringify({
  totalApprovedRows: rows.length,
  generatedRuntimeRows: runtimeRows.length,
  strictRuntimeRejectedRows: skippedRows.length,
  withVerifiedCartoonImage: rows.filter(row => row.imagePath && verifiedPolicies.has(row.imagePolicy)).length,
  noImageValid: runtimeRows.filter(row => !row.imagePath && row.imagePolicy === "no_image").length,
  photorealisticImageRows: photorealRows.length,
  embeddedTextWatermarkLogoRows: embeddedTextRows.length,
  randomMismatchedImageRows: randomMismatchRows.length,
  needsKimiCartoonImages: kimiRows.length,
  bySkill,
  byTarget,
  rows
}, null, 2)}\n`);
writeFile(requestMd, `${requestLines.join("\n")}\n`);
writeFile(requestCsv, `${csvRows.map(row => row.map(csvEscape).join(",")).join("\n")}\n`);

console.log("Approved HFW media coverage audit");
console.table(summaryRows.map(row => ({
  skillId: row[0],
  approvedRows: row[1],
  runtimeRows: row[2],
  strictRejects: row[3],
  verifiedImages: row[4],
  noImageValid: row[5],
  needsKimi: row[6],
  failures: row[7]
})));
console.log(`Rows needing Kimi cartoon media: ${kimiRows.length}`);
console.log(`Wrote ${path.relative(repoRoot, outMd)}`);
console.log(`Wrote ${path.relative(repoRoot, requestMd)}`);

if (failureRows.length) {
  failureRows.slice(0, 80).forEach(row => console.error(`- ${row.questionId}: ${row.failureReason}`));
  if (failureRows.length > 80) console.error(`...and ${failureRows.length - 80} more`);
  process.exit(1);
}
