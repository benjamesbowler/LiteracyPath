import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getManagedSkillIds,
  getSkillBankItems,
  managedSkillDefinitions
} from "../src/content/skillMedia/skillAssetRegistry.js";
import { hasMediaForItem } from "../src/content/skillMedia/skillCoverageUtils.js";
import { buildSkillRoundPlan, emptySkillProgress } from "../src/content/skillMedia/skillProgressionRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const ROUND_LENGTH = 15;

const assetExists = assetPath => {
  if (!assetPath) return false;
  if (!String(assetPath).startsWith("/")) return true;
  return fs.existsSync(path.join(rootDir, "public", String(assetPath).replace(/^\//, "")));
};

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function duplicates(values) {
  return unique(values.filter((value, index) => values.indexOf(value) !== index));
}

function recordRound(progress, skillId, level, roundItems) {
  const key = `level${level}`;
  if (!progress.levels[key]) {
    progress.levels[key] = {
      coveredTargets: [],
      masteredTargets: [],
      weakTargets: [],
      usedTargetWordsByTarget: {}
    };
  }

  const levelProgress = progress.levels[key];
  roundItems.forEach(item => {
    if (item.target && !levelProgress.coveredTargets.includes(item.target)) levelProgress.coveredTargets.push(item.target);
    if (item.target && !levelProgress.masteredTargets.includes(item.target)) levelProgress.masteredTargets.push(item.target);
    if (item.target && item.targetWord) {
      levelProgress.usedTargetWordsByTarget[item.target] = unique([
        ...(levelProgress.usedTargetWordsByTarget[item.target] || []),
        item.targetWord
      ]);
    }
  });

  return progress;
}

const allItems = getSkillBankItems();
const failures = [];
const warnings = [];
const sections = [];

for (const skillId of getManagedSkillIds()) {
  const definition = managedSkillDefinitions[skillId];
  const mediaCompleteItems = allItems.filter(item =>
    item.skillId === skillId &&
    item.active !== false &&
    hasMediaForItem(item, assetExists).complete
  );
  const levels = unique(mediaCompleteItems.map(item => item.level || 1)).sort((a, b) => Number(a) - Number(b));
  const expectedTargets = definition.expectedTargets || unique(mediaCompleteItems.map(item => item.target)).sort();
  const blockedTargets = expectedTargets.filter(target => !mediaCompleteItems.some(item => item.target === target));
  const roundRows = [];

  if (!mediaCompleteItems.length) {
    warnings.push(`${definition.label}: no media-complete items available for progression simulation.`);
  }

  for (const level of levels.length ? levels : [1]) {
    const levelItems = mediaCompleteItems.filter(item => Number(item.level || 1) === Number(level));
    if (!levelItems.length) continue;

    let progress = emptySkillProgress();
    let previousRoundIds = new Set();
    let previousRoundWords = new Set();
    const availableTargets = unique(levelItems.map(item => item.target)).sort();
    const selectedAcrossLevel = new Set();

    for (let roundIndex = 1; roundIndex <= 3; roundIndex += 1) {
      const plan = buildSkillRoundPlan({
        skillId,
        items: mediaCompleteItems,
        progress,
        level,
        roundLength: ROUND_LENGTH,
        seed: 5100 + (Number(level) * 100) + roundIndex
      });
      const ids = plan.items.map(item => item.id);
      const words = plan.items.map(item => item.targetWord);
      const targets = plan.items.map(item => item.target);
      const duplicateIds = duplicates(ids);
      const duplicateWords = duplicates(words);
      const immediateIdRepeats = ids.filter(id => previousRoundIds.has(id));
      const immediateWordRepeats = words.filter(word => word && previousRoundWords.has(word));
      const possibleUniqueTargets = Math.min(ROUND_LENGTH, availableTargets.length);

      if (duplicateIds.length) failures.push(`${definition.label} L${level} round ${roundIndex}: duplicate question IDs ${duplicateIds.join(", ")}.`);
      if (availableTargets.length >= ROUND_LENGTH && duplicates(targets).length) {
        failures.push(`${definition.label} L${level} round ${roundIndex}: repeated targets despite enough alternatives.`);
      }
      if (levelItems.length >= ROUND_LENGTH && duplicateWords.length) {
        failures.push(`${definition.label} L${level} round ${roundIndex}: repeated target words ${duplicateWords.join(", ")}.`);
      }
      if (roundIndex > 1 && immediateIdRepeats.length && levelItems.length > ROUND_LENGTH) {
        warnings.push(`${definition.label} L${level} round ${roundIndex}: reused recent IDs ${unique(immediateIdRepeats).join(", ")}.`);
      }
      if (roundIndex > 1 && immediateWordRepeats.length && levelItems.length > ROUND_LENGTH) {
        warnings.push(`${definition.label} L${level} round ${roundIndex}: reused recent words ${unique(immediateWordRepeats).join(", ")}.`);
      }
      if (plan.items.length < Math.min(ROUND_LENGTH, levelItems.length)) {
        warnings.push(`${definition.label} L${level} round ${roundIndex}: selected ${plan.items.length}, fewer than available unique target cap ${Math.min(ROUND_LENGTH, levelItems.length)}.`);
      }

      targets.forEach(target => selectedAcrossLevel.add(target));
      roundRows.push(`| L${level} R${roundIndex} | ${plan.meta.phase} | ${plan.items.length} | ${unique(targets).length}/${possibleUniqueTargets} | ${targets.join(", ") || "none"} | ${words.join(", ") || "none"} |`);
      progress = recordRound(progress, skillId, level, plan.items);
      previousRoundIds = new Set(ids);
      previousRoundWords = new Set(words.filter(Boolean));
    }

    const missedAvailableTargets = availableTargets.filter(target => !selectedAcrossLevel.has(target));
    if (availableTargets.length <= ROUND_LENGTH * 2 && missedAvailableTargets.length) {
      warnings.push(`${definition.label} L${level}: simulation did not reach available targets ${missedAvailableTargets.join(", ")}.`);
    }
  }

  sections.push(`## ${definition.label}

- Skill ID: ${skillId}
- Media-complete items: ${mediaCompleteItems.length}
- Media-complete targets: ${unique(mediaCompleteItems.map(item => item.target)).length}
- Blocked expected targets: ${blockedTargets.join(", ") || "none"}

| Round | Phase | Selected Items | Unique Targets | Targets | Target Words |
|---|---:|---:|---:|---|---|
${roundRows.join("\n") || "| - | - | 0 | 0 | none | none |"}`);
}

write(
  path.join(rootDir, "docs", "validation", "skill_progression_audit.md"),
  `# Skill Progression Audit

Date: 2026-05-25

## Summary

- Managed skills simulated: ${getManagedSkillIds().length}
- Fatal progression failures: ${failures.length}
- Progression warnings: ${warnings.length}

## Warnings

${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}

${sections.join("\n\n")}
`
);

console.log(`Managed skills simulated: ${getManagedSkillIds().length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log("Wrote docs/validation/skill_progression_audit.md");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Skill progression simulation passed.");
