import fs from "node:fs";

import { curriculumReleaseBoard } from "../src/content/assessments/curriculumReleaseBoard.generated.js";
import {
  buildRuntimeAlignedAssessmentReleaseStatus
} from "./assessmentReleaseStatus.mjs";
import {
  buildLiveCurriculumBoard,
  curriculumBoardDocumentPath,
  curriculumBoardModulePath,
  renderCurriculumBoardDocument,
  renderCurriculumBoardModule
} from "./curriculumBoard.mjs";

const statuses = await buildRuntimeAlignedAssessmentReleaseStatus();
const expected = await buildLiveCurriculumBoard(statuses);
const failures = [];

if (fs.readFileSync(curriculumBoardModulePath, "utf8") !== renderCurriculumBoardModule(expected)) {
  failures.push("Generated admin curriculum-board module is stale.");
}
if (fs.readFileSync(curriculumBoardDocumentPath, "utf8") !== renderCurriculumBoardDocument(expected)) {
  failures.push("Generated Loop D CURRICULUM_BOARD.md is stale.");
}
if (JSON.stringify(curriculumReleaseBoard) !== JSON.stringify(expected)) {
  failures.push("Admin curriculum-board data differs from the generated Loop D board source.");
}
if (expected.rows.length !== 30) {
  failures.push(`Curriculum board contains ${expected.rows.length}/30 managed skills.`);
}
for (const row of expected.rows) {
  if (!row.owner || !row.gateStatus || !row.studentExposure.fingerprint) {
    failures.push(`${row.skillId}: owner, status, or exact exposure identity is missing.`);
  }
  if (row.releaseReady && row.studentExposure.count !== row.releaseEligibleQuestions) {
    failures.push(
      `${row.skillId}: child exposure ${row.studentExposure.count} differs from `
      + `${row.releaseEligibleQuestions} canonically eligible questions.`
    );
  }
  if (!row.releaseReady && row.studentExposure.count !== 0) {
    failures.push(`${row.skillId}: blocked skill still exposes child questions.`);
  }
  if (!row.releaseReady && row.reasons.length === 0) {
    failures.push(`${row.skillId}: blocked skill has no visible reason.`);
  }
  if (row.waiver.excludedQuestionCount && row.waiver.reviewBy.length === 0) {
    failures.push(`${row.skillId}: release exclusion has no review date.`);
  }
}

if (failures.length) {
  console.error("Curriculum release board failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Curriculum release board passes: ${expected.readySkills}/30 READY, `
    + `${expected.blockedSkills}/30 BLOCKED; admin and Loop D use one exact source.`
  );
}
