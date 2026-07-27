import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  assessmentHfwAudioWiring,
  assessmentMediaWaivers,
  assessmentMediaWiring
} from "../src/content/assessments/assessmentMediaReleaseManifest.js";
import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  loadCoreQuestionPool,
  repoRoot,
  writeFile
} from "./phonicsRuntimeUtils.js";
import {
  buildMediaBoardModel,
  mediaBoardPath,
  readStrictMediaSummary,
  renderMediaBoard
} from "./mediaBoard.mjs";

const distRoot = path.join(repoRoot, "dist");
const outputJson = path.join(repoRoot, "docs", "validation", "media_runtime_resolution.json");
const outputMd = path.join(repoRoot, "docs", "validation", "media_runtime_resolution.md");

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function fetchBuiltMedia(assetPaths) {
  const child = spawnSync(
    process.execPath,
    [path.join(repoRoot, "tools", "fetchBuiltMediaOverHttp.mjs")],
    {
      cwd: repoRoot,
      input: JSON.stringify(assetPaths),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_OPTIONS: ""
      },
      maxBuffer: 64 * 1024 * 1024
    }
  );
  if (child.error) throw child.error;
  if (child.status !== 0) {
    throw new Error(`Built-app HTTP child failed (${child.status}): ${String(child.stderr || "").trim()}`);
  }
  return JSON.parse(child.stdout);
}

function validateManifest(pool) {
  const failures = [];
  const poolIds = new Set(pool.map(question => question.id));
  const wiringKeys = new Set();
  for (const entry of assessmentMediaWiring) {
    if (!entry.mediaType || !entry.target || !entry.filePath || !entry.questionIds.length) {
      failures.push("A wiring entry is missing mediaType, target, filePath, or questionIds.");
    }
    for (const questionId of entry.questionIds) {
      const key = `${questionId}:${entry.mediaType}`;
      if (wiringKeys.has(key)) failures.push(`Duplicate wiring entry: ${key}`);
      wiringKeys.add(key);
    }
  }
  for (const waiver of assessmentMediaWaivers) {
    if (!waiver.skillId || !waiver.questionIds.length || !waiver.mediaTypes.length || !waiver.owner || !waiver.reviewBy || !waiver.reason) {
      failures.push(`Incomplete media waiver for ${waiver.skillId || "(missing skill)"}.`);
    }
    if (!waiver.excludeFromRuntime) failures.push(`Waiver does not exclude its questions from runtime: ${waiver.skillId}`);
    if (Date.parse(waiver.reviewBy) < Date.now()) failures.push(`Expired media waiver review date: ${waiver.skillId} ${waiver.reviewBy}`);
    for (const questionId of waiver.questionIds) {
      if (poolIds.has(questionId)) failures.push(`Waived question remains runtime-selectable: ${questionId}`);
    }
  }
  return failures;
}

export async function checkMediaRuntimeResolution() {
  if (!fs.existsSync(path.join(distRoot, "index.html"))) {
    throw new Error("The production build is missing. Run npm run build before the media runtime gate.");
  }

  const strictSummary = readStrictMediaSummary();
  const pool = loadCoreQuestionPool();
  const model = buildMediaBoardModel({ strictSummary });
  const expectedBoard = renderMediaBoard(model);
  const manifestFailures = validateManifest(pool);
  if (model.rows.length !== managedAssessmentSkillDepthConfig.length) {
    manifestFailures.push(`Media board covers ${model.rows.length}/${managedAssessmentSkillDepthConfig.length} skills.`);
  }
  if (!fs.existsSync(mediaBoardPath) || fs.readFileSync(mediaBoardPath, "utf8") !== expectedBoard) {
    manifestFailures.push("docs/release/MEDIA_BOARD.md is stale; run npm run generate:media-board.");
  }
  if (strictSummary.wiringRemaining !== 0) {
    manifestFailures.push(`Strict audit still has ${strictSummary.wiringRemaining} media wiring defects.`);
  }
  if (strictSummary.missingAudioRemaining !== 0) {
    manifestFailures.push(`Strict audit still has ${strictSummary.missingAudioRemaining} unresolved required-audio gaps.`);
  }
  if (strictSummary.missingImagesRemaining !== 0) {
    manifestFailures.push(`Strict audit still has ${strictSummary.missingImagesRemaining} unresolved required-image gaps.`);
  }

  const assetPaths = unique([
    ...pool.flatMap(question => [
      ...getQuestionAudioPaths(question),
      ...getQuestionImagePaths(question)
    ]),
    ...assessmentMediaWiring.map(entry => entry.filePath),
    ...Object.values(assessmentHfwAudioWiring)
  ]).filter(assetPath => String(assetPath).startsWith("/") && !String(assetPath).startsWith("//"));

  const results = fetchBuiltMedia(assetPaths);
  const assetFailures = results.filter(result => !result.pass);
  const failures = [...manifestFailures, ...assetFailures.map(result =>
    `${result.path}: HTTP ${result.status}, ${result.bytes} bytes${result.error ? ` (${result.error})` : ""}`
  )];
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      skills: model.rows.length,
      runtimeQuestions: pool.length,
      uniqueAssetUrls: assetPaths.length,
      passedAssetUrls: results.length - assetFailures.length,
      failedAssetUrls: assetFailures.length,
      wiringRemaining: strictSummary.wiringRemaining,
      missingAudioRemaining: strictSummary.missingAudioRemaining,
      missingImagesRemaining: strictSummary.missingImagesRemaining,
      explicitReleaseExclusions: model.waiverCount,
      failures: failures.length
    },
    failures,
    assets: results
  };
  writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  writeFile(
    outputMd,
    `# Built-app media runtime resolution

- Skills: ${report.summary.skills}
- Runtime questions: ${report.summary.runtimeQuestions}
- Unique asset URLs requested: ${report.summary.uniqueAssetUrls}
- HTTP 200 + nonzero body: ${report.summary.passedAssetUrls}
- Failed asset URLs: ${report.summary.failedAssetUrls}
- Wiring defects remaining: ${report.summary.wiringRemaining}
- Required-audio gaps remaining: ${report.summary.missingAudioRemaining}
- Required-image gaps remaining: ${report.summary.missingImagesRemaining}
- Explicit release exclusions: ${report.summary.explicitReleaseExclusions}
- Gate failures: ${report.summary.failures}

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "All referenced media resolved from the production build."}
`
  );
  console.log(`Built-app media URLs: ${results.length - assetFailures.length}/${results.length} passed`);
  console.log(`Strict media: ${strictSummary.wiringRemaining} wiring, ${strictSummary.missingAudioRemaining} audio, ${strictSummary.missingImagesRemaining} image unresolved`);
  console.log(`Release exclusions: ${model.waiverCount}`);
  return failures.length === 0 ? 0 : 1;
}

process.exitCode = await checkMediaRuntimeResolution();
