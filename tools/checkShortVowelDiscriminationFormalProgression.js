import path from "node:path";

import {
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import { coverageExpectations } from "../src/data/coverageExpectations.js";

const ROUND_LENGTH = 15;
const skillId = "short_vowel_discrimination";
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

function questionTarget(question = {}) {
  return normalize(question.itemKey || question.coverageTarget || question.targetShortVowel || "");
}

function questionFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

const rows = [];
for (const [levelValue, phases] of Object.entries(config.phases || {})) {
  const level = Number(levelValue);
  for (const [phaseValue, targets] of Object.entries(phases)) {
    const phase = Number(phaseValue);
    const pool = questions.filter(question => questionLevel(question) === level && questionPhase(question) === phase);
    const byTarget = new Map();
    const byFormat = new Map();

    for (const question of pool) {
      const target = questionTarget(question);
      const format = questionFormat(question);
      if (target) byTarget.set(target, (byTarget.get(target) || 0) + 1);
      byFormat.set(format, (byFormat.get(format) || 0) + 1);
    }

    const missingTargets = targets.filter(target => !byTarget.get(target));
    const representedTargets = targets.filter(target => byTarget.get(target));

    if (pool.length < ROUND_LENGTH) {
      failures.push(`Level ${level} Phase ${phase} has ${pool.length}/${ROUND_LENGTH} eligible short-vowel discrimination questions.`);
    }
    if (missingTargets.length) {
      failures.push(`Level ${level} Phase ${phase} missing active targets: ${missingTargets.join(", ")}.`);
    }

    rows.push({
      level,
      phase,
      expected: targets,
      questionCount: pool.length,
      representedTargets,
      missingTargets,
      byTarget,
      byFormat
    });
  }
}

const report = [
  "# Short Vowel Discrimination Formal Progression Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Runtime-selectable short-vowel discrimination questions: ${questions.length}`,
  "",
  "| Step | Eligible Questions | Active Targets Covered | Missing Active Targets | Formats |",
  "| --- | ---: | ---: | --- | --- |",
  ...rows.map(row =>
    `| Level ${row.level} Phase ${row.phase} | ${row.questionCount} | ${row.representedTargets.length}/${row.expected.length} | ${row.missingTargets.join(", ") || "none"} | ${Array.from(row.byFormat.entries()).map(([format, count]) => `${format}: ${count}`).join("<br>") || "none"} |`
  ),
  "",
  "## Per-Target Counts",
  "",
  ...rows.flatMap(row => [
    `### Level ${row.level} Phase ${row.phase}`,
    "",
    ...row.expected.map(target => `- ${target}: ${row.byTarget.get(target) || 0}`),
    ""
  ]),
  "## Failures",
  "",
  failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none",
  ""
];

writeFile(path.join(repoRoot, "docs/validation/short_vowel_discrimination_formal_progression_audit.md"), report.join("\n"));

rows.forEach(row => {
  console.log(`Short Vowel Discrimination L${row.level} P${row.phase}: ${row.questionCount} questions; ${row.representedTargets.length}/${row.expected.length} targets covered`);
});
console.log("Wrote docs/validation/short_vowel_discrimination_formal_progression_audit.md");

if (failures.length) {
  console.error(`Short vowel discrimination formal progression failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Short vowel discrimination formal progression passed.");
