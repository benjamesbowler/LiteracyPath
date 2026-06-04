import path from "node:path";

import {
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import {
  coverageExpectations,
  rhymingLevelTwoPendingMediaItemKeys
} from "../src/data/coverageExpectations.js";

const ROUND_LENGTH = 15;
const skillId = "rhyming";
const config = coverageExpectations[skillId];
const questions = selectableRuntimeQuestionsForSkill(skillId);
const failures = [];

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function questionLevel(question = {}) {
  return Number(question.level || question.assessmentLevel || question.depthLevel || question.difficulty || 1) >= 2 ? 2 : 1;
}

function questionPhase(question = {}) {
  return Number(question.phase || question.assessmentPhase || question.levelPhase || 1) === 2 ? 2 : 1;
}

function questionFamily(question = {}) {
  return normalize(question.itemKey || question.rhymeGroup || question.rime || question.coverageTarget || question.extra?.rimeFamily || "");
}

const rows = [];
for (const [levelValue, phases] of Object.entries(config.phases || {})) {
  const level = Number(levelValue);
  for (const [phaseValue, families] of Object.entries(phases)) {
    const phase = Number(phaseValue);
    const pool = questions.filter(question => questionLevel(question) === level && questionPhase(question) === phase);
    const byFamily = new Map();
    for (const question of pool) {
      const family = questionFamily(question);
      if (!family) continue;
      byFamily.set(family, (byFamily.get(family) || 0) + 1);
    }
    const missingFamilies = families.filter(family => !byFamily.get(family));
    const representedFamilies = families.filter(family => byFamily.get(family));

    if (pool.length < ROUND_LENGTH) {
      failures.push(`Level ${level} Phase ${phase} has ${pool.length}/${ROUND_LENGTH} eligible rhyming questions.`);
    }
    if (missingFamilies.length) {
      failures.push(`Level ${level} Phase ${phase} missing active families: ${missingFamilies.join(", ")}.`);
    }

    rows.push({
      level,
      phase,
      expected: families,
      questionCount: pool.length,
      representedFamilies,
      missingFamilies,
      byFamily
    });
  }
}

const activeLevelTwo = new Set(config.levels?.[2] || []);
rhymingLevelTwoPendingMediaItemKeys.forEach(family => {
  if (activeLevelTwo.has(family)) failures.push(`Pending-media family ${family} is still active in Rhyming Level 2 expectations.`);
});

const report = [
  "# Rhyming Formal Progression Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Runtime-selectable rhyming questions: ${questions.length}`,
  `Held pending for media: ${rhymingLevelTwoPendingMediaItemKeys.join(", ") || "none"}`,
  "",
  "| Step | Eligible Questions | Active Families Covered | Missing Active Families |",
  "| --- | ---: | ---: | --- |",
  ...rows.map(row =>
    `| Level ${row.level} Phase ${row.phase} | ${row.questionCount} | ${row.representedFamilies.length}/${row.expected.length} | ${row.missingFamilies.join(", ") || "none"} |`
  ),
  "",
  "## Per-Family Counts",
  "",
  ...rows.flatMap(row => [
    `### Level ${row.level} Phase ${row.phase}`,
    "",
    ...row.expected.map(family => `- ${family}: ${row.byFamily.get(family) || 0}`),
    ""
  ]),
  "## Failures",
  "",
  failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none",
  ""
];

writeFile(path.join(repoRoot, "docs/validation/rhyming_formal_progression_audit.md"), report.join("\n"));

rows.forEach(row => {
  console.log(`Rhyming L${row.level} P${row.phase}: ${row.questionCount} questions; ${row.representedFamilies.length}/${row.expected.length} families covered`);
});
console.log("Wrote docs/validation/rhyming_formal_progression_audit.md");

if (failures.length) {
  console.error(`Rhyming formal progression failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Rhyming formal progression passed.");
