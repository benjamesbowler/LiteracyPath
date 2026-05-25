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

| Skill | Level | Target | Target Word | Needed Media | Expected Path | Kimi Prompt | Reason |
|---|---:|---|---|---|---|---|---|
${missingRequestRows || "| - | - | none | none | none | - | - | - |"}
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
