// Small, reusable implementation rules for visually intensive games. The
// canonical product standard lives in docs/design/GAME_DESIGN_BIBLE.md; this
// module only contains behaviour that runtime games need to share.

const TIER_BUDGETS = Object.freeze({
  low: Object.freeze({ setpieceKinds: 0, setpieceCopies: 0 }),
  medium: Object.freeze({ setpieceKinds: 4, setpieceCopies: 14 }),
  high: Object.freeze({ setpieceKinds: 6, setpieceCopies: 22 })
});

export function premiumSetpieceBudget(tier) {
  return TIER_BUDGETS[tier] || TIER_BUDGETS.medium;
}

export function hasCompletePremiumSetpieceSet(loadedCount, budget) {
  const required = Number(budget?.setpieceCopies) || 0;
  return required > 0 && Number(loadedCount) === required;
}

export function laneDirectionForKey(key) {
  if (key === "ArrowLeft" || String(key).toLowerCase() === "a") return -1;
  if (key === "ArrowRight" || String(key).toLowerCase() === "d") return 1;
  return 0;
}

export function verticalDirectionForKey(key) {
  if (key === "ArrowUp" || String(key).toLowerCase() === "w") return -1;
  if (key === "ArrowDown" || String(key).toLowerCase() === "s") return 1;
  return 0;
}

export function isPrimaryActionKey(key) {
  const normalized = String(key || "").toLowerCase();
  return key === " " || key === "Enter" || key === "ArrowUp" || normalized === "e";
}

export const GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION = 1;

function valueAtPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

/**
 * Checks that a vertical-slice brief is specific enough to build and review.
 * It validates the Game Design Bible contract, not whether prose sounds
 * impressive. Runtime, browser and child-play evidence remain separate gates.
 */
export function validateGameVerticalSliceBrief(brief = {}) {
  const issues = [];
  const requireText = path => {
    if (!String(valueAtPath(brief, path) || "").trim()) issues.push(`${path} is required`);
  };
  const requireList = path => {
    const value = valueAtPath(brief, path);
    if (!Array.isArray(value) || !value.length || value.some(item => !String(item || "").trim())) {
      issues.push(`${path} needs at least one named item`);
    }
  };

  [
    "gameId",
    "version",
    "audience",
    "experiencePromise",
    "learning.targetConstruct",
    "learning.childGoal",
    "learning.integratedAction",
    "learning.nonTargetDemands",
    "learning.evidenceEvent",
    "loop.onboard",
    "loop.perceive",
    "loop.act",
    "loop.feedback",
    "loop.retry",
    "loop.complete",
    "prompt.visible",
    "prompt.spoken",
    "prompt.replay",
    "difficulty.ladder",
    "gameFeel.movement",
    "gameFeel.camera",
    "gameFeel.successFeedback",
    "gameFeel.errorFeedback",
    "world.artDirection",
    "world.route",
    "world.character",
    "world.assetFallback",
    "state.pauseResume",
    "state.checkpoint",
    "state.completion",
    "accessibility.reducedMotion",
    "accessibility.soundOff",
    "accessibility.nonColourCue",
    "accessibility.semanticFallback",
    "performance.lowPowerFallback",
    "performance.inputSafety",
    "performance.assetFailure",
    "validation.physicalDevice.status",
    "validation.physicalDevice.note"
  ].forEach(requireText);
  [
    "controls.keyboard",
    "controls.touch",
    "controls.pointerReleaseEvents",
    "gameFeel.forgiveness",
    "privacy.dataWritten",
    "privacy.network",
    "validation.unit",
    "validation.browser"
  ].forEach(requireList);

  if (brief.schemaVersion !== GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION}`);
  }
  if (brief.learning?.movementCreatesEvidence !== false) {
    issues.push("learning.movementCreatesEvidence must be false");
  }
  if (brief.difficulty?.curriculumBeforePressure !== true) {
    issues.push("difficulty.curriculumBeforePressure must be true");
  }
  if (Number(brief.controls?.minimumTargetCssPixels) < 56) {
    issues.push("controls.minimumTargetCssPixels must be at least 56");
  }
  for (const releaseEvent of ["pointerup", "pointercancel", "lostpointercapture"]) {
    if (!brief.controls?.pointerReleaseEvents?.includes(releaseEvent)) {
      issues.push(`controls.pointerReleaseEvents must include ${releaseEvent}`);
    }
  }
  if (brief.privacy?.newIdentifier !== false) {
    issues.push("privacy.newIdentifier must be false or receive a separate privacy review");
  }
  if (brief.privacy?.newExternalService !== false) {
    issues.push("privacy.newExternalService must be false or receive a separate privacy review");
  }
  if (!["pass", "fail", "unknown"].includes(brief.validation?.physicalDevice?.status)) {
    issues.push("validation.physicalDevice.status must be pass, fail or unknown");
  }
  return Object.freeze(issues);
}
