import { GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION } from "./premiumGameStandard.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

/**
 * Machine-readable reference brief for a complete gameplay slice. The
 * canonical rules and field meanings live in docs/design/GAME_DESIGN_BIBLE.md.
 * Add a brief here before substantially changing another flagship game.
 */
export const ARCADE_VERTICAL_SLICE_BRIEFS = deepFreeze({
  "letter-leap": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "letter-leap",
    version: "2.0",
    audience: "Early readers encoding taught words, with later sentence legs for developing readers.",
    experiencePromise: "A forgiving side-scrolling spelling adventure where every useful jump completes the word in view.",
    learning: {
      targetConstruct: "Encode a spoken or printed word by selecting its graphemes in order.",
      childGoal: "Run and jump through the glowing next letter to spell the word.",
      integratedAction: "Colliding with the next required grapheme fills the next persistent word slot.",
      nonTargetDemands: "Horizontal movement, jumping, platforms, hazards and route navigation.",
      evidenceEvent: "Only a completed ordered word advances recorded word progress; movement, coins and survival do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Freeze the world behind one goal line and a visible keyboard/touch control map.",
      perceive: "Keep the full word strip visible and make the next empty slot glow.",
      act: "Move and jump into the next required grapheme.",
      feedback: "Fill the matching slot immediately; wrong collisions retain the goal and give a specific contrast cue.",
      retry: "Respawn missed letters ahead and return a failed stage through the catch-up queue.",
      complete: "Show words spelled, score and earned collectibles, then continue or return through Arcade chrome."
    },
    prompt: {
      visible: "The persistent strip says which word is being spelled and which grapheme comes next.",
      spoken: "A production-recorded target word is available whenever that exact recording exists.",
      replay: "A 56-pixel Hear word control replays the current production recording without browser speech."
    },
    controls: {
      keyboard: ["Left/Right or A/D moves", "Up, W or Space jumps"],
      touch: ["Hold left/right to move", "Tap or hold Jump to leap"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Ten curriculum-led stages move from short taught words to longer word and sentence legs before route pressure increases."
    },
    gameFeel: {
      movement: "Responsive acceleration, variable jump height, moving-platform carry and deterministic collision routes.",
      forgiveness: ["0.12-second coyote window", "0.14-second jump-input buffer", "Missed word targets respawn", "Failed stages re-enter the catch-up queue"],
      camera: "A side-follow camera preserves forward route visibility and resets cleanly at each word or sentence leg.",
      successFeedback: "The slot fills, a chime plays, a short burst appears and word progress advances.",
      errorFeedback: "The next slot remains visible, a specific audio/text cue coaches the contrast, and the target stays recoverable."
    },
    world: {
      artDirection: "Authored Meadow, Dino Valley and Moonwood palettes with restrained PS2-style depth and effects.",
      route: "Walkable ground, raised platforms and signalled ravines share the collision and camera coordinate system.",
      character: "The current world cast is selected deterministically and remains readable at platform scale.",
      assetFallback: "Missing character or scenery images leave a complete canvas-rendered route and fallback hero."
    },
    state: {
      pauseResume: "Pause freezes gameplay; resume resets frame timing so hidden time never becomes a physics jump.",
      checkpoint: "The current curriculum stage is saved through the existing Arcade checkpoint callback.",
      completion: "The existing score, stars, completed-word count and resumable checkpoint are the only progress state."
    },
    accessibility: {
      reducedMotion: "Screen shake and urgent decorative motion are removed while the route, letters and feedback remain.",
      soundOff: "The full target word, current slot and feedback remain printed; unavailable or disabled recordings hide the replay control.",
      nonColourCue: "The next grapheme uses position, border, glow and persistent slot order rather than colour alone.",
      semanticFallback: "Named buttons, focused onboarding and Arcade mission help expose the goal and controls outside the canvas."
    },
    performance: {
      lowPowerFallback: "A single bounded canvas, capped device pixel ratio and reduced decorative motion preserve input response.",
      inputSafety: "Frame delta is capped and every held pointer path has up, cancel and lost-capture release.",
      assetFailure: "The playable route, targets and controls do not depend on a decorative image finishing its load."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable stage checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: [
        "tests/unit/curriculumLadder.test.js",
        "tests/unit/gameCheckpoints.test.js",
        "tests/unit/premiumGameStandard.test.js"
      ],
      browser: [
        "tests/release/student-activity-viewport.spec.js",
        "tests/release/letter-leap-vertical-slice.spec.js"
      ],
      physicalDevice: {
        status: "unknown",
        note: "A real supported iPad playtest is still required; browser emulation is not recorded as a hardware pass."
      }
    }
  }
});

export function verticalSliceBriefForGame(gameId) {
  return ARCADE_VERTICAL_SLICE_BRIEFS[String(gameId || "")] || null;
}
