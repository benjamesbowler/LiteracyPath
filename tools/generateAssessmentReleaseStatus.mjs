import fs from "node:fs";
import path from "node:path";

import { repoRoot } from "./phonicsRuntimeUtils.js";
import {
  buildAssessmentReleaseStatus,
  renderAssessmentReleaseStatus
} from "./assessmentReleaseStatus.mjs";

const outputPath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseStatus.generated.js"
);

fs.writeFileSync(outputPath, renderAssessmentReleaseStatus(buildAssessmentReleaseStatus()));
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
