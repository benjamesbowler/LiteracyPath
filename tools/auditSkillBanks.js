import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getManagedSkillIds,
  getSkillBankItems,
  managedSkillDefinitions
} from "../src/content/skillMedia/skillAssetRegistry.js";
import {
  getDuplicateValues,
  hasMediaForItem,
  summarizeSkillBankItems
} from "../src/content/skillMedia/skillCoverageUtils.js";
import {
  buildMissingMediaRequestRows,
  validateSkillBankItem
} from "../src/content/skillMedia/skillMediaValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const blockedAssessmentImagePaths = new Set([
  "/media/initial-sounds/images/a/acorn.webp",
  "/media/initial-sounds/images/n/nut.webp",
  "/images/child-mode/short-u/nut.png"
]);
const excludedAssessmentWords = new Set([
  "zinnia",
  "zinnia flower",
  "zannia",
  "zone",
  "observer",
  "opera",
  "quartz",
  "quiver",
  "quickstep",
  "upbeat",
  "uplift",
  "urban garden",
  "velvet",
  "yodeler",
  "yucca plant"
]);

const assetExists = assetPath => {
  if (!assetPath) return false;
  if (!String(assetPath).startsWith("/")) return true;
  return fs.existsSync(path.join(rootDir, "public", String(assetPath).replace(/^\//, "")));
};

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const items = getSkillBankItems();
const summaries = summarizeSkillBankItems({ assetExists, items });
const failures = [];
const warnings = [];

for (const skillId of getManagedSkillIds()) {
  const summary = summaries[skillId];
  const definition = managedSkillDefinitions[skillId];
  const skillItems = items.filter(item => item.skillId === skillId && item.active !== false);
  const mediaComplete = skillItems.filter(item => hasMediaForItem(item, assetExists).complete);
  const completeDuplicateIds = getDuplicateValues(mediaComplete.map(item => item.id));
  const completeDuplicateSignatures = getDuplicateValues(mediaComplete.map(item => item.signature));
  const validationIssues = mediaComplete.flatMap(item =>
    validateSkillBankItem(item, { assetExists }).map(issue => ({ item, issue }))
  );

  if (completeDuplicateIds.length) failures.push(`${summary.label}: duplicate media-complete active IDs: ${completeDuplicateIds.join(", ")}`);
  if (completeDuplicateSignatures.length) warnings.push(`${summary.label}: ${completeDuplicateSignatures.length} duplicate-equivalent media-complete signatures blocked from expansion/progression candidate priority.`);
  validationIssues.forEach(({ item, issue }) => failures.push(`${summary.label} ${item.id}: ${issue}`));
  skillItems.forEach(item => {
    const blockedPath = [item.imageUrl, ...(item.imagePaths || [])].filter(Boolean).find(imagePath => blockedAssessmentImagePaths.has(imagePath));
    if (blockedPath) failures.push(`${summary.label} ${item.id}: active item uses blocked image ${blockedPath}.`);
    if (excludedAssessmentWords.has(String(item.targetWord || "").toLowerCase())) {
      failures.push(`${summary.label} ${item.id}: active item uses excluded/weird target word "${item.targetWord}".`);
    }
  });
  if (summary.belowMinimum) warnings.push(`${summary.label}: ${summary.validMediaItems} media-complete items, below target ${definition.minimumValidItems}.`);
  if (summary.blockedTargets.length) warnings.push(`${summary.label}: blocked/missing targets ${summary.blockedTargets.join(", ")}.`);
}

const rows = Object.values(summaries).map(summary => {
  const levels = Object.entries(summary.byLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, count]) => `L${level}:${count}`)
    .join(", ") || "none";
  return `| ${summary.label} | ${summary.activeItems} | ${summary.validMediaItems} | ${summary.uniqueTargets} | ${summary.validTargets} | ${levels} | ${summary.missingImages.length} | ${summary.missingAudio.length} | ${summary.blockedTargets.join(", ") || "none"} |`;
}).join("\n");

const detailSections = Object.values(summaries).map(summary => {
  const duplicateInfo = [
    summary.duplicateIds.length ? `- Raw duplicate IDs: ${summary.duplicateIds.join(", ")}` : "- Raw duplicate IDs: none",
    summary.duplicateSignatures.length ? `- Raw duplicate signatures: ${summary.duplicateSignatures.length}` : "- Raw duplicate signatures: none",
    summary.duplicateTargetWords.length ? `- Duplicate target words by level: ${summary.duplicateTargetWords.slice(0, 40).join(", ")}` : "- Duplicate target words by level: none"
  ].join("\n");
  const rhymeIssues = summary.rhymeIssues.length
    ? summary.rhymeIssues.slice(0, 40).map(({ item, issue }) => `- ${item.id}: ${issue}`).join("\n")
    : "- none";

  return `## ${summary.label}

- Skill ID: ${summary.skillId}
- Active items: ${summary.activeItems}
- Media-complete active items: ${summary.validMediaItems}
- Unique active targets: ${summary.uniqueTargets}
- Unique media-complete targets: ${summary.validTargets}
- Blocked targets: ${summary.blockedTargets.join(", ") || "none"}
- Below minimum warning: ${summary.belowMinimum ? "yes" : "no"}

${duplicateInfo}

### Rhyming/Phonics Logic Issues

${rhymeIssues}`;
}).join("\n\n");

const missingRows = buildMissingMediaRequestRows(summaries);
const missingRequestRows = missingRows.map(row =>
  `| ${row.skill} | ${row.level || ""} | ${row.target} | ${row.targetWord || ""} | ${row.mediaType} | ${row.expectedPath} | ${row.prompt} | ${row.reason} |`
).join("\n");
const qualityReplacementRows = [
  [
    "Initial Sounds",
    1,
    "a",
    "acorn",
    "replacement image",
    "/media/initial-sounds/images/a/acorn.webp",
    "Create a clean, naturally colored acorn image with a plain background and no face, rainbow cap, embedded text, or extra objects.",
    "Current image is overly rainbow/stylized for an ordinary acorn and is blocked from active assessment use."
  ],
  [
    "Initial Sounds",
    1,
    "n",
    "nut",
    "replacement image",
    "/media/initial-sounds/images/n/nut.webp",
    "Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no face, rainbow colors, embedded text, or acorn shape.",
    "Current image is overly rainbow/stylized and too confusable with acorn-style imagery for assessment use."
  ],
  [
    "Initial Sounds",
    1,
    "n",
    "nut",
    "replacement image",
    "/images/child-mode/short-u/nut.png",
    "Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no acorn cap, no face, no embedded text, and no rainbow colors.",
    "Current child-mode nut image is visually an acorn and is blocked from active assessment use."
  ]
].map(row => `| ${row.join(" | ")} |`).join("\n");
const excludedWeirdWordRows = [
  ["Initial Sounds", 1, "z", "zinnia", "excluded word", "-", "Do not generate audio or image for this target. Replace with zebra, zipper, zoo, zero, or zigzag if another /z/ item is needed.", "Zinnia is too unusual for K-2 Initial Sounds."],
  ["Initial Sounds", 2, "z", "zinnia flower", "excluded word", "-", "Do not generate audio or image for this target. Replace with a simpler /z/ concrete object if needed.", "Zinnia flower is too unusual for K-2 Initial Sounds."],
  ["Initial Sounds", 1, "z", "zone", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /z/ item if needed.", "Zone is abstract and hard to image clearly."],
  ["Initial Sounds", 2, "o", "observer", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /o/ item if needed.", "Observer is abstract/role-based and hard to image clearly."],
  ["Initial Sounds", 2, "o", "opera", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /o/ item if needed.", "Opera is culturally specific and not a strong early assessment target."],
  ["Initial Sounds", 2, "q", "quartz", "excluded word", "-", "Do not generate audio or image for this target. Replace with a familiar /q/ item if needed.", "Quartz is obscure for K-2 assessment."],
  ["Initial Sounds", 2, "q", "quiver", "excluded word", "-", "Do not generate audio or image for this target. Replace with a familiar /q/ item if needed.", "Quiver is potentially ambiguous for K-2 assessment."],
  ["Initial Sounds", 2, "q", "quickstep", "excluded word", "-", "Do not generate audio or image for this target. Replace with a familiar /q/ item if needed.", "Quickstep is obscure/culturally specific."],
  ["Initial Sounds", 2, "u", "upbeat", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /u/ item if needed.", "Upbeat is abstract and hard to image clearly."],
  ["Initial Sounds", 2, "u", "uplift", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /u/ item if needed.", "Uplift is abstract and hard to image clearly."],
  ["Initial Sounds", 2, "u", "urban garden", "excluded word", "-", "Do not generate audio or image for this target. Replace with a clearer /u/ item if needed.", "Urban garden is a phrase with no single clear target object."],
  ["Initial Sounds", 2, "v", "velvet", "excluded word", "-", "Do not generate audio or image for this target. Replace with a concrete /v/ item if needed.", "Velvet is texture-based and hard to image unambiguously."],
  ["Initial Sounds", 2, "y", "yodeler", "excluded word", "-", "Do not generate audio or image for this target. Replace with a familiar /y/ item if needed.", "Yodeler is culturally specific."],
  ["Initial Sounds", 2, "y", "yucca plant", "excluded word", "-", "Do not generate audio or image for this target. Replace with a familiar /y/ item if needed.", "Yucca plant is less familiar for K-2 assessment."]
].map(row => `| ${row.join(" | ")} |`).join("\n");

write(
  path.join(rootDir, "docs", "validation", "skill_bank_master_audit.md"),
  `# Skill Bank Master Audit

Date: 2026-05-25

## Summary

- Managed skills: ${getManagedSkillIds().length}
- Skill-bank items scanned: ${items.length}
- Fatal active media-complete failures: ${failures.length}
- Expansion/media warnings: ${warnings.length}

## Skill Coverage Table

| Skill | Active Items | Media-Complete Items | Active Targets | Media-Complete Targets | Per-Level Count | Missing Images | Missing Audio | Blocked Targets |
|---|---:|---:|---:|---:|---|---:|---:|---|
${rows}

## Warnings

${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}

${detailSections}
`
);

write(
  path.join(rootDir, "docs", "assets", "kimi_missing_skill_media_request.md"),
  `# Kimi Missing Skill Media Request

Date: 2026-05-25

This file is generated by \`tools/auditSkillBanks.js\`. It lists media gaps for managed skill-bank expansion. Do not fake or substitute unrelated media.

## Image Style Rule

Cute cartoon educational images are good. Rainbow-colored ordinary objects are not acceptable. Use realistic/natural colors unless the target word itself requires color. Examples: apple should be red or green, cat should use natural cat colors, nut should be a walnut/peanut/hazelnut-style nut and not an acorn, and rainbow should only be used when the target word is \`rainbow\`.

| Skill | Level | Target | Target Word | Needed Media | Expected Path | Kimi Prompt | Reason |
|---|---:|---|---|---|---|---|---|
${missingRequestRows || "| - | - | none | none | none | - | - | - |"}

## Quality Replacement Requests

These assets exist, but are blocked because the visual style or semantic clarity is not assessment-safe. These are IMAGE ONLY requests. Audio is not needed for these rows unless another audit separately proves it missing or broken.

| Skill | Level | Target | Target Word | Needed Media | Expected Path | Kimi Prompt | Reason |
|---|---:|---|---|---|---|---|---|
${qualityReplacementRows}

## Excluded Weird/Unusual Words

These targets are intentionally inactive. Do not generate replacement audio for them. Only replace the target itself with a clearer K-2 word if this slot must be restored.

| Skill | Level | Target | Target Word | Needed Media | Expected Path | Kimi Prompt | Reason |
|---|---:|---|---|---|---|---|---|
${excludedWeirdWordRows}
`
);

console.log(`Skill-bank items scanned: ${items.length}`);
console.log(`Managed skills: ${getManagedSkillIds().length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log("Wrote docs/validation/skill_bank_master_audit.md");
console.log("Wrote docs/assets/kimi_missing_skill_media_request.md");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Skill bank master audit passed.");
