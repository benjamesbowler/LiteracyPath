import path from "node:path";

import { imageQaReviewBlocklist } from "../src/data/generated/imageQaReviewBlocklist.generated.js";
import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputDir = path.join(repoRoot, "docs", "assets", "kimi-image-qa-replacements");

function replacementFilename(row) {
  const ext = path.extname(row.path || "") || ".webp";
  const base = path.basename(row.path || "replacement", ext).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${base}-replacement${ext === ".svg" ? ".webp" : ext}`;
}

function requestFor(row) {
  const style = row.area === "guided_reading"
    ? "guided reading page art with strict page continuity"
    : row.area === "story_quest"
      ? "Story Quest scene art with strict character consistency"
      : row.area === "assessment"
        ? "simple clear K-2 assessment art"
        : "K-2 app style";
  return {
    originalImagePath: row.path,
    area: row.area,
    targetWord: row.targetWord,
    skillId: row.skillId,
    issueType: row.issueType,
    reviewerNotes: row.reviewerNotes,
    replacementFilename: replacementFilename(row),
    exactTargetMeaning: row.targetWord || "match the original app context",
    requiredStyle: style,
    forbiddenIssues: [
      "watermarks",
      "embedded text",
      "fake letters/numbers",
      "logos",
      "photorealism unless explicitly requested",
      "extra limbs/fingers",
      "disconnected arms/legs",
      "malformed hands",
      "double heads/faces",
      "distorted eyes/mouths",
      "malformed animals",
      "clutter",
      "wrong object or word sense"
    ],
    childFriendly: true
  };
}

const requests = imageQaReviewBlocklist
  .filter(row => row.status === "rejected" || row.status === "review_needed" || row.replacementNeeded)
  .map(requestFor);

writeFile(path.join(outputDir, "kimi_image_qa_replacement_request.json"), `${JSON.stringify(requests, null, 2)}\n`);
writeFile(path.join(outputDir, "kimi_image_qa_replacement_request.csv"), [
  "original_image_path,area,target_word,skill_id,issue_type,replacement_filename,reviewer_notes",
  ...requests.map(row => [
    row.originalImagePath,
    row.area,
    row.targetWord,
    row.skillId,
    row.issueType,
    row.replacementFilename,
    row.reviewerNotes
  ].map(value => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
].join("\n"));
writeFile(path.join(outputDir, "kimi_image_qa_replacement_request.md"), [
  "# Kimi Image QA Replacement Request",
  "",
  "Global rules: no watermarks, no embedded text, no fake letters/numbers, no logos, no extra limbs, no extra fingers, no disconnected arms/legs, no malformed hands, no double heads/faces, no distorted eyes/mouths, no malformed animals, no clutter, no wrong object/word sense, child-friendly K–2 style.",
  "",
  requests.length
    ? requests.map((row, index) => [
      `## ${index + 1}. ${row.replacementFilename}`,
      "",
      `- Original: \`${row.originalImagePath}\``,
      `- Area: ${row.area}`,
      `- Target: ${row.exactTargetMeaning}`,
      `- Issue: ${row.issueType || "review rejection"}`,
      `- Notes: ${row.reviewerNotes || ""}`,
      `- Required style: ${row.requiredStyle}`,
      ""
    ].join("\n")).join("\n")
    : "No rejected or review-needed images yet. Human review is pending.",
  ""
].join("\n"));
writeFile(path.join(outputDir, "kimi_image_qa_replacement_summary.md"), [
  "# Kimi Image QA Replacement Summary",
  "",
  `- Replacement request count: ${requests.length}`,
  ""
].join("\n"));

console.log(JSON.stringify({ replacementRequestCount: requests.length }, null, 2));
