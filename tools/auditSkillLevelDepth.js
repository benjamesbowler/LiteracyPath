import fs from "node:fs";
import path from "node:path";

import {
  auditSkillLevelDepth,
  docsValidationDir,
  ensureDir,
  markdownTable
} from "./skillLevelDepthShared.js";

const audits = auditSkillLevelDepth();
ensureDir(docsValidationDir);

const jsonPath = path.join(docsValidationDir, "skill_level_depth_audit.json");
fs.writeFileSync(jsonPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  target: {
    level1: "30 runtime-safe questions split into 15+15 phases",
    level2: "30 runtime-safe questions split into 15+15 phases"
  },
  skills: audits
}, null, 2));

const rows = audits.map(audit => [
  audit.skillName,
  audit.hasLevel1 ? "yes" : "no",
  audit.levels[1].runtimeSafeQuestionCount,
  audit.levels[1].uniqueTargetWordCount || audit.levels[1].uniqueItemKeyCount,
  audit.levels[1].phase1Ready ? "yes" : "no",
  audit.levels[1].phase2Ready ? "yes" : "no",
  audit.hasLevel2 ? "yes" : "not yet designed",
  audit.hasLevel2 ? audit.levels[2].runtimeSafeQuestionCount : "n/a",
  audit.hasLevel2 ? (audit.levels[2].phase1Ready ? "yes" : "no") : "n/a",
  audit.hasLevel2 ? (audit.levels[2].phase2Ready ? "yes" : "no") : "n/a",
  audit.passes ? "pass" : "gap"
]);

const gapSections = audits
  .filter(audit => !audit.passes)
  .map(audit => [
    `### ${audit.skillName}`,
    "",
    `- Level 1: ${audit.levels[1].runtimeSafeQuestionCount}/30; phase 1 ${audit.levels[1].phase1Ready ? "ready" : "not ready"}; phase 2 ${audit.levels[1].phase2Ready ? "ready" : "not ready"}.`,
    audit.hasLevel2
      ? `- Level 2: ${audit.levels[2].runtimeSafeQuestionCount}/30; phase 1 ${audit.levels[2].phase1Ready ? "ready" : "not ready"}; phase 2 ${audit.levels[2].phase2Ready ? "ready" : "not ready"}.`
      : `- Level 2 not yet designed: ${audit.levels[2].proposedMeaning}`,
    `- Missing Level 1 questions: ${audit.levels[1].missingCount}`,
    `- Missing Level 2 questions: ${audit.levels[2].missingCount}`,
    audit.contentMediaGaps.length ? `- Rejected/runtime gap examples: ${audit.contentMediaGaps.join("; ")}` : "- Rejected/runtime gap examples: none",
    ""
  ].join("\n"));

const md = [
  "# Skill Level Depth Audit",
  "",
  "This audit checks whether managed assessment skills can support Level 1 Phase 1, Level 1 Phase 2, Level 2 Phase 1, and Level 2 Phase 2 as 15-question runtime-safe rounds. A level does not pass on count alone; it also needs target/item diversity so one word or pattern is not repeated into artificial depth.",
  "",
  markdownTable([
    "Skill",
    "L1 designed",
    "L1 count",
    "L1 diversity",
    "L1 P1",
    "L1 P2",
    "L2 designed",
    "L2 count",
    "L2 P1",
    "L2 P2",
    "Status"
  ], rows),
  "",
  "## Gaps",
  "",
  gapSections.length ? gapSections.join("\n") : "_All designed levels pass the 15+15 depth contract._"
].join("\n");

fs.writeFileSync(path.join(docsValidationDir, "skill_level_depth_audit.md"), md);

console.log(`Skill level depth audit complete. Passing skills: ${audits.filter(audit => audit.passes).length}/${audits.length}`);
