// Current assessment image-style authority.
//
// The historical generated decision file remains the reviewed source for the
// existing assessment library. The objective-word recorder owns the new,
// stricter nameability/crop/objectivity decisions. Consumers import this
// composite so a newly approved objective image cannot be confused with an
// unreviewed file that merely exists on disk.

import { ASSESSMENT_IMAGE_STYLE_DECISIONS as RAW_BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS }
  from "./assessmentImageStyleDecisions.generated.js";
import { ASSESSMENT_REJECTED_IMAGE_HASHES } from "./assessmentImageReviewPolicy.js";
import { OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS }
  from "./objectiveAssessmentImageStyleDecisions.generated.js";

const BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS = Object.freeze(
  Object.fromEntries(Object.entries(RAW_BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS)
    .filter(([, decision]) => !ASSESSMENT_REJECTED_IMAGE_HASHES[decision.sha256]))
);

const collisions = Object.keys(OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS)
  .filter(assetPath => BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath]);

if (collisions.length) {
  throw new Error(`Assessment image style decision collision: ${collisions.join(", ")}`);
}

export const ASSESSMENT_IMAGE_STYLE_DECISIONS = Object.freeze({
  ...BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS,
  ...OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS
});

export {
  BASE_ASSESSMENT_IMAGE_STYLE_DECISIONS,
  OBJECTIVE_ASSESSMENT_IMAGE_STYLE_DECISIONS
};
