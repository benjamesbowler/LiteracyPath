import fs from "node:fs";
import path from "node:path";

import { repoRoot } from "./phonicsRuntimeUtils.js";
import {
  buildRuntimeAlignedAssessmentReleaseStatus,
  renderAssessmentReleaseExposure,
  renderAssessmentReleaseStatus
} from "./assessmentReleaseStatus.mjs";

const outputPath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseStatus.generated.js"
);
const exposureOutputPath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseExposure.generated.js"
);

const statuses = await buildRuntimeAlignedAssessmentReleaseStatus();
fs.writeFileSync(outputPath, renderAssessmentReleaseStatus(statuses));
fs.writeFileSync(exposureOutputPath, renderAssessmentReleaseExposure(statuses));
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(`Wrote ${path.relative(repoRoot, exposureOutputPath)}`);

const {
  buildLiveCurriculumBoard,
  curriculumBoardDocumentPath,
  curriculumBoardModulePath,
  writeCurriculumBoard
} = await import("./curriculumBoard.mjs");
const curriculumBoard = await writeCurriculumBoard(
  await buildLiveCurriculumBoard(statuses)
);
console.log(
  `Wrote ${path.relative(repoRoot, curriculumBoardModulePath)} and `
  + `${path.relative(repoRoot, curriculumBoardDocumentPath)} `
  + `(${curriculumBoard.readySkills}/${curriculumBoard.rows.length} skills ready)`
);
