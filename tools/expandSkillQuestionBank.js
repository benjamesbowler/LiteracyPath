import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getManagedSkillIds,
  getSkillBankItems,
  managedSkillDefinitions
} from "../src/content/skillMedia/skillAssetRegistry.js";
import { hasMediaForItem, makeSkillItemSignature } from "../src/content/skillMedia/skillCoverageUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function getArg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const requestedSkill = getArg("skill", "all");
const writeMode = process.argv.includes("--write");
const targetSkills = requestedSkill === "all" ? getManagedSkillIds() : [requestedSkill];

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const assetExists = assetPath => {
  if (!assetPath) return false;
  if (!String(assetPath).startsWith("/")) return true;
  return fs.existsSync(path.join(rootDir, "public", String(assetPath).replace(/^\//, "")));
};

const items = getSkillBankItems();
const failures = [];
const warnings = [];
const sections = [];

targetSkills.forEach(skillId => {
  if (!managedSkillDefinitions[skillId]) {
    failures.push(`Unknown skill "${skillId}". Known skills: ${getManagedSkillIds().join(", ")}`);
    return;
  }

  const definition = managedSkillDefinitions[skillId];
  const skillItems = items.filter(item => item.skillId === skillId && item.active !== false);
  const mediaComplete = skillItems.filter(item => hasMediaForItem(item, assetExists).complete);
  const existingSignatures = new Set(mediaComplete.map(makeSkillItemSignature));
  const safeCandidates = skillItems.filter(item =>
    hasMediaForItem(item, assetExists).complete &&
    item.active !== false &&
    makeSkillItemSignature(item) &&
    existingSignatures.has(makeSkillItemSignature(item))
  );
  const targets = [...new Set(mediaComplete.map(item => item.target).filter(Boolean))].sort();
  const targetRows = targets.map(target => {
    const targetItems = mediaComplete.filter(item => item.target === target);
    const levels = [...new Set(targetItems.map(item => item.level || 1))].sort((a, b) => Number(a) - Number(b));
    return `| ${target} | ${targetItems.length} | ${levels.join(", ")} | ${[...new Set(targetItems.map(item => item.targetWord).filter(Boolean))].join(", ")} |`;
  }).join("\n");

  const missingTargets = (definition.expectedTargets || []).filter(target => !targets.includes(target));
  if (missingTargets.length) warnings.push(`${definition.label}: cannot expand blocked targets until media exists: ${missingTargets.join(", ")}.`);

  sections.push(`## ${definition.label}

- Skill ID: ${skillId}
- Active items scanned: ${skillItems.length}
- Media-complete items available for safe expansion: ${mediaComplete.length}
- Unique media-complete targets: ${targets.length}
- Missing expected targets: ${missingTargets.join(", ") || "none"}
- Write mode: ${writeMode ? "requested, but no source-bank writer is enabled for this generic command" : "dry run"}

| Target | Media-Complete Items | Levels | Target Words |
|---|---:|---|---|
${targetRows || "| - | 0 | - | - |"}

### Candidate Handling

This generic expansion command does not invent questions or media. It identifies media-complete, non-duplicate material that can be promoted by a skill-specific writer. Source-bank writes are intentionally disabled here until each skill has an explicit content-authoring strategy.`);

  if (safeCandidates.length !== mediaComplete.length) {
    warnings.push(`${definition.label}: ${mediaComplete.length - safeCandidates.length} media-complete items lacked a stable signature.`);
  }
});

write(
  path.join(rootDir, "docs", "validation", "skill_bank_expansion_audit.md"),
  `# Skill Bank Expansion Audit

Date: 2026-05-25

## Summary

- Requested skill: ${requestedSkill}
- Managed skills considered: ${targetSkills.filter(skillId => managedSkillDefinitions[skillId]).length}
- Mode: ${writeMode ? "write requested; generic writer remains gated" : "dry run"}
- Warnings: ${warnings.length}
- Failures: ${failures.length}

## Warnings

${warnings.length ? warnings.map(warning => `- ${warning}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none"}

${sections.join("\n\n")}
`
);

console.log("Wrote docs/validation/skill_bank_expansion_audit.md");
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
