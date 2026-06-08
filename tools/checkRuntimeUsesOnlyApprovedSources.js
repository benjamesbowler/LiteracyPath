import fs from "node:fs";
import path from "node:path";

import { skillTree } from "../src/skillTree.js";
import { loadAssessmentSkillBank } from "../src/data/loadAssessmentSkillBank.js";
import {
  activeRuntimeSourceFiles,
  getRuntimeSourceIssues,
  legacyCandidateFiles,
  sourceRegistrySummary
} from "../src/data/sourceOfTruthRegistry.js";
import {
  collectImportGraph,
  currentRuntimeEntryFiles,
  markdownTable,
  repoRoot
} from "./dataSourceAuditUtils.js";
import {
  selectableRuntimeQuestionsForSkill
} from "./phonicsRuntimeUtils.js";

const outputJson = path.join(repoRoot, "docs/validation/approved_runtime_sources_audit.json");
const outputMd = path.join(repoRoot, "docs/validation/approved_runtime_sources_audit.md");

const failures = [];
const warnings = [];
const skillRows = [];

function addFailure(type, detail) {
  failures.push({ type, ...detail });
}

function addWarning(type, detail) {
  warnings.push({ type, ...detail });
}

const graph = collectImportGraph([
  ...currentRuntimeEntryFiles(),
  ...Array.from(activeRuntimeSourceFiles),
  ...Array.from(legacyCandidateFiles)
]);

for (const runtimeFile of currentRuntimeEntryFiles()) {
  for (const imported of graph.importsFrom.get(runtimeFile) || []) {
    if (legacyCandidateFiles.has(imported) || /\/(?:archive|legacy)\//i.test(imported)) {
      addFailure("legacy_runtime_import", {
        importer: runtimeFile,
        imported,
        reason: "Runtime entry imports a legacy/archive candidate."
      });
    }
  }
}

for (const skill of skillTree) {
  const loaderQuestions = await loadAssessmentSkillBank(skill.id);
  const selectableQuestions = selectableRuntimeQuestionsForSkill(skill.id);
  const rows = [...loaderQuestions, ...selectableQuestions]
    .map(question => ({
      id: question.id || question.questionId || "(missing id)",
      source: question._source || question.source || "",
      sourceFile: question._sourceFile || "",
      issues: getRuntimeSourceIssues(question)
    }))
    .filter(row => row.issues.length);

  if (rows.length) {
    rows.slice(0, 25).forEach(row => addFailure("runtime_question_source_violation", {
      skillId: skill.id,
      questionId: row.id,
      source: row.source,
      sourceFile: row.sourceFile,
      reason: row.issues.join("; ")
    }));
    if (rows.length > 25) {
      addWarning("truncated_skill_violations", {
        skillId: skill.id,
        reason: `${rows.length - 25} additional source violations hidden from console; see JSON.`
      });
    }
  }

  skillRows.push({
    skillId: skill.id,
    loaderQuestions: loaderQuestions.length,
    selectableQuestions: selectableQuestions.length,
    violations: rows.length
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceRegistrySummary: sourceRegistrySummary(),
  failures,
  warnings,
  skills: skillRows
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);

const md = [
  "# Approved Runtime Sources Audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Status: ${failures.length ? "FAIL" : "PASS"}`,
  "",
  "## Skill Runtime Counts",
  "",
  markdownTable(
    ["Skill", "Loader questions", "Selectable questions", "Violations"],
    skillRows.map(row => [row.skillId, row.loaderQuestions, row.selectableQuestions, row.violations])
  ),
  "",
  "## Failures",
  "",
  failures.length
    ? markdownTable(
      ["Type", "Skill/File", "Question/Import", "Source", "Reason"],
      failures.slice(0, 200).map(row => [
        row.type,
        row.skillId || row.importer || "",
        row.questionId || row.imported || "",
        row.sourceFile || row.source || "",
        row.reason
      ])
    )
    : "None.",
  failures.length > 200 ? `\n\n_Only first 200 failures shown; see JSON for all ${failures.length}._` : "",
  "",
  "## Warnings",
  "",
  warnings.length
    ? markdownTable(["Type", "Skill/File", "Reason"], warnings.map(row => [row.type, row.skillId || row.file || "", row.reason]))
    : "None."
].join("\n");

fs.writeFileSync(outputMd, md);

console.table([{ failures: failures.length, warnings: warnings.length, result: failures.length ? "FAIL" : "PASS" }]);
console.log(`Wrote ${path.relative(repoRoot, outputMd)}`);

if (failures.length) {
  console.error(`Approved runtime source check failed with ${failures.length} failure(s).`);
  process.exitCode = 1;
} else {
  console.log("Approved runtime source check passed.");
}
