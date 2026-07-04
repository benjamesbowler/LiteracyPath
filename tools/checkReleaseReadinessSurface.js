#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const failures = [];

function readProjectFile(path) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function requireText(file, needle, message) {
  const source = readProjectFile(file);
  if (!source.includes(needle)) {
    failures.push(message || `${file} is missing "${needle}"`);
  }
}

const appSource = readProjectFile("src/App.jsx");
const masterySummarySource = appSource.match(/function buildSkillMasterySummary\(\)[\s\S]*?\n {2}async function saveAnswerToSupabase/)?.[0] || "";

if (!masterySummarySource) {
  failures.push("App.jsx is missing buildSkillMasterySummary.");
}

[
  "visibleGroups",
  "groups.slice(0, 12)",
  "+ ${moreCount} more"
].forEach(needle => {
  if (masterySummarySource.includes(needle)) {
    failures.push(`buildSkillMasterySummary still contains truncated report summary logic: ${needle}`);
  }
});

requireText("src/App.jsx", "displayText: groups.length", "Skill mastery summaries should still expose report display text.");
requireText("src/App.jsx", "detail = groups.map", "Skill mastery summaries should list every mastered group.");

[
  "ReleaseReadinessPanel",
  "Release Check",
  "Content QA Workflow",
  "Cleanup Tools",
  "report-readiness-panel",
  "Export Readiness",
  "guidedMediaQa",
  "assessmentAudio"
].forEach(needle => {
  requireText("src/components/AdminDashboardPage.jsx", needle, `Admin dashboard is missing release-readiness surface: ${needle}`);
});

[
  "release-readiness-panel",
  "release-readiness-row",
  "release-status-pill",
  "report-readiness-step"
].forEach(needle => {
  requireText("src/App.css", needle, `Release-readiness styling is missing: ${needle}`);
});

requireText("src/components/FinishedReportPage.jsx", "limit={Infinity}", "Finished student report should not truncate mastered item lists.");
requireText("docs/product-polish-roadmap.md", "Status: complete in this pass.", "Roadmap Section 5 should be marked complete.");
requireText("package.json", "check:release-readiness-surface", "package.json should expose the release-readiness check.");

if (failures.length) {
  console.error("Release-readiness surface check failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release-readiness surface check passed.");
