import fs from "node:fs";
import path from "node:path";

import {
  assessmentMediaWaivers,
  getAssessmentMediaSourceMetadata
} from "../src/content/assessments/assessmentMediaReleaseManifest.js";
import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import { getAssessmentReleaseOwner } from "../src/content/releaseStandard.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  loadCoreQuestionPool,
  repoRoot
} from "./phonicsRuntimeUtils.js";
import { getDepthSkillId } from "./skillLevelDepthShared.js";

export const mediaBoardPath = path.join(repoRoot, "docs", "release", "MEDIA_BOARD.md");
export const strictAuditArtifactPath = path.join(
  repoRoot,
  "docs",
  "release",
  "artifacts",
  "audits",
  "auditAllSkillsStrictProductionReadiness",
  "repo",
  "docs",
  "validation",
  "all_skills_strict_production_audit.json"
);

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}
function safeCell(value = "") {
  return String(value || "—").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

export function readStrictMediaSummary(filePath = strictAuditArtifactPath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Strict audit artifact is missing: ${path.relative(repoRoot, filePath)}`);
  }
  const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    wiringRemaining: Number(report.summary?.totalMediaWiringFixes ?? -1),
    missingAudioRemaining: Number(report.summary?.totalExactMissingAudio ?? -1),
    missingImagesRemaining: Number(report.summary?.totalExactMissingImages ?? -1)
  };
}

export function buildMediaBoardModel({ strictSummary = readStrictMediaSummary() } = {}) {
  const questions = loadCoreQuestionPool();
  const rows = managedAssessmentSkillDepthConfig.map(config => {
    const skillQuestions = questions.filter(question => getDepthSkillId(question) === config.skillId);
    const audioPaths = unique(skillQuestions.flatMap(getQuestionAudioPaths));
    const imagePaths = unique(skillQuestions.flatMap(getQuestionImagePaths));
    const allPaths = [...audioPaths, ...imagePaths];
    const metadata = allPaths.map(filePath =>
      getAssessmentMediaSourceMetadata(filePath, audioPaths.includes(filePath) ? "audio" : "image")
    );
    const waivers = assessmentMediaWaivers.filter(entry => entry.skillId === config.skillId);
    return {
      skillId: config.skillId,
      skillName: config.skillName,
      owner: getAssessmentReleaseOwner(config.skillId),
      runtimeQuestionCount: skillQuestions.length,
      audioCount: audioPaths.length,
      imageCount: imagePaths.length,
      source: unique(metadata.map(item => item.source)).join("; ") || "No required runtime media",
      license: unique(metadata.map(item => item.license)).join("; ") || "n/a",
      reviewStatus: unique(metadata.map(item => item.reviewStatus)).join("; ") || "Text-only skill; media review not applicable",
      pronunciationVariant: unique(metadata.map(item => item.pronunciationVariant).filter(item => item !== "n/a")).join("; ") || "n/a",
      waivedQuestionCount: waivers.reduce((sum, entry) => sum + entry.questionIds.length, 0),
      waiverReviewBy: unique(waivers.map(entry => entry.reviewBy)).join(", ") || "n/a"
    };
  });
  return {
    baseline: {
      wiring: 384,
      missingAudio: 28,
      missingImages: 22
    },
    current: strictSummary,
    rows,
    waiverCount: assessmentMediaWaivers.reduce((sum, entry) => sum + entry.questionIds.length, 0)
  };
}

export function renderMediaBoard(model = buildMediaBoardModel()) {
  const status = model.current.wiringRemaining === 0 &&
    model.current.missingAudioRemaining === 0 &&
    model.current.missingImagesRemaining === 0
    ? "CLEAR"
    : "BLOCKED";
  const tableRows = model.rows.map(row => [
    row.skillName,
    row.owner,
    `${row.runtimeQuestionCount} questions · ${row.audioCount} audio · ${row.imageCount} image`,
    row.source,
    row.license,
    row.reviewStatus,
    row.pronunciationVariant,
    row.waivedQuestionCount ? `${row.waivedQuestionCount} excluded · review ${row.waiverReviewBy}` : "0"
  ].map(safeCell).join(" | "));

  const waiverRows = assessmentMediaWaivers.flatMap(entry =>
    entry.questionIds.map(questionId => [
      entry.skillId,
      questionId,
      entry.mediaTypes.join(", "),
      entry.owner,
      entry.reviewBy,
      entry.reason
    ].map(safeCell).join(" | "))
  );

  return `# Assessment media completion board

This board is generated from the release-managed assessment question pool, the canonical wiring/waiver manifest, and the latest strict-audit artifact. Do not edit it by hand.

## Release status: ${status}

| Measure | Original baseline | Current unresolved |
| --- | ---: | ---: |
| Existing-asset wiring defects | ${model.baseline.wiring} | ${model.current.wiringRemaining} |
| Missing required audio | ${model.baseline.missingAudio} | ${model.current.missingAudioRemaining} |
| Missing required images | ${model.baseline.missingImages} | ${model.current.missingImagesRemaining} |
| Explicitly release-excluded questions | 0 | ${model.waiverCount} |

An exclusion is not a hidden fallback: the affected question is absent from the student-selectable pool until its complete, exact media set is reviewed. The remaining media-complete questions stay available for the skill.

## Per-skill inventory

| Skill | Owner | Runtime inventory | Source | Source/licence record | Review status | Pronunciation variant | Explicit exclusions |
| --- | --- | --- | --- | --- | --- | --- | --- |
${tableRows.map(row => `| ${row} |`).join("\n")}

## Explicit release exclusions

| Skill ID | Question ID | Missing media | Owner | Review by | Reason |
| --- | --- | --- | --- | --- | --- |
${waiverRows.length ? waiverRows.map(row => `| ${row} |`).join("\n") : "| — | — | — | — | — | None |"}

## Runtime proof

\`check:media-runtime-resolution\` rebuilds the production app, reruns the strict media audit, serves the built output over HTTP, and requests every unique media URL referenced by the release-managed pool and wiring manifest. A URL passes only with HTTP 200 and a nonzero response body.
`;
}
