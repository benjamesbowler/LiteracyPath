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
      targetConstruct: "Encode a spoken or picture-cued word by selecting its graphemes in order.",
      childGoal: "Run and jump through the correct next letter in each three-choice cluster to spell the word.",
      integratedAction: "Colliding with the next required grapheme fills the next persistent word slot.",
      nonTargetDemands: "Horizontal movement, jumping, platforms, hazards and route navigation.",
      evidenceEvent: "Only a completed ordered word advances recorded word progress; movement, coins and survival do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Freeze the world behind one goal line and a visible keyboard/touch control map.",
      perceive: "Keep a picture or masked sentence cue, completed graphemes and the next empty slot visible together.",
      act: "Move and jump into the next required grapheme.",
      feedback: "Fill the matching slot immediately; wrong collisions retain the goal and give a specific contrast cue.",
      retry: "Respawn missed letters ahead and return a failed stage through the catch-up queue.",
      complete: "Show words spelled, score and earned collectibles, then continue or return through Arcade chrome."
    },
    prompt: {
      visible: "A picture or recorded cue identifies the target while the strip shows completed graphemes and the next empty slot. If neither exists, a labelled model-supported target replaces an ambiguous masked context.",
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
      forgiveness: ["0.12-second coyote window", "0.14-second jump-input buffer", "Completed word evidence survives catch-up replays", "Failed stages re-enter the catch-up queue"],
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
      soundOff: "A reviewed picture keeps independent encoding playable where available. If no picture identifies the target, a labelled model-supported spelling target replaces the ambiguous prompt; unavailable or disabled recordings hide replay.",
      nonColourCue: "The next empty slot uses position, border, glow and persistent order; every letter choice uses equivalent geometry rather than a colour-coded answer.",
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
        "tests/unit/letterLeapEvidence.test.js",
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
  },
  "word-bridge": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "word-bridge",
    version: "2.0",
    audience: "Early readers practising supported grapheme matching, with ordered sentence-part bridges for developing readers.",
    experiencePromise: "A tactile bridge-building journey where every useful placement completes the language construction in view.",
    learning: {
      targetConstruct: "Match visible graphemes or words and reconstruct a modelled target in sequence.",
      childGoal: "Carry the next matching tile to the glowing bridge slot.",
      integratedAction: "Placing the required tile fills the next persistent bridge slot and extends the route.",
      nonTargetDemands: "Horizontal movement, carrying, dropping and route navigation.",
      evidenceEvent: "Only a correctly matched and placed language part advances supported-practice progress; movement and collection do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Pause behind one goal line, the target construction and a visible keyboard/touch control map.",
      perceive: "Keep completed parts, the next empty slot and every available tile readable together.",
      act: "Move to a tile, pick it up and place it in the next bridge slot.",
      feedback: "Lock a correct tile into the bridge; return a distractor with a specific contrast cue and no lost progress.",
      retry: "Leave the clue and required slot visible, return the tile to play and permit an immediate new choice.",
      complete: "Cross the completed bridge, show constructions built and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "The full word or sentence goal and ordered bridge slots remain visible during play.",
      spoken: "The current target is spoken from production audio whenever that exact recording exists.",
      replay: "A 56-pixel replay control repeats the current available production cue without browser speech."
    },
    controls: {
      keyboard: ["Left/Right or A/D moves", "Space, Enter, E or Up picks up and places"],
      touch: ["Hold left/right to move", "Tap the named action control to pick up or place"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Ten curriculum-led levels move from ordered graphemes to longer word and sentence constructions before route pressure changes."
    },
    gameFeel: {
      movement: "Responsive side movement, readable pickup range and immediate bridge-slot response.",
      forgiveness: ["Distractors return to play", "Correct placements persist", "The next slot remains highlighted", "No movement error removes learning evidence"],
      camera: "A bounded side camera keeps the builder, tile bank and next bridge slot in view.",
      successFeedback: "The tile seats into the bridge, the slot changes shape and a brief chime confirms the completed language part.",
      errorFeedback: "The selected tile is named, the needed contrast remains visible and the tile returns for another attempt."
    },
    world: {
      artDirection: "Authored Meadow, Dino Valley and Moonwood illustrated routes with tactile tiles and layered atmospheric depth.",
      route: "The walkable bank, tile positions, bridge slots and crossing route share one canvas coordinate system.",
      character: "The current canonical helper and Pal art remain recognisable at play scale.",
      assetFallback: "Missing decorative images leave a complete canvas-rendered bank, bridge, tile set and fallback helper."
    },
    state: {
      pauseResume: "Pause freezes movement and feedback; resume resets frame timing before play continues.",
      checkpoint: "The current curriculum level is saved through the existing Arcade checkpoint callback.",
      completion: "Existing score, stars, completed-construction count and resumable level checkpoint remain the only progress state."
    },
    accessibility: {
      reducedMotion: "Decorative bobbing, bursts and camera intensity are reduced while tile and slot feedback stays immediate.",
      soundOff: "The complete target, current slot and feedback remain printed when audio is unavailable or disabled.",
      nonColourCue: "Required and completed slots use position, outline, label and shape in addition to colour.",
      semanticFallback: "Named buttons, focused onboarding and Arcade mission help expose the goal and controls outside the canvas."
    },
    performance: {
      lowPowerFallback: "A single bounded Canvas2D surface, capped device pixel ratio and limited particles preserve input response.",
      inputSafety: "Frame delta is capped and every held movement pointer releases on up, cancel and lost capture.",
      assetFailure: "Bridge geometry, target tiles and controls remain playable without decorative images."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-construction count", "Existing resumable level checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/wordBridgeLevels.test.js", "tests/unit/wordBridgeGameFeedback.test.js", "tests/unit/premiumGameStandard.test.js"],
      browser: ["tests/release/arcade-ipad-controls.spec.js", "tests/release/student-activity-viewport.spec.js"],
      physicalDevice: {
        status: "unknown",
        note: "A real supported iPad playtest is still required; browser emulation is not recorded as a hardware pass."
      }
    }
  },
  "sound-beat": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "sound-beat",
    version: "2.0",
    audience: "Early readers identifying and ordering taught phoneme, syllable and word units.",
    experiencePromise: "A welcoming band performance where each deliberate literacy choice builds the target and the beat adds expression, not pressure.",
    learning: {
      targetConstruct: "Identify and order taught phoneme, syllable or word units to reconstruct a word or sentence.",
      childGoal: "Choose the next matching pad, then choose GO to blend or read the completed target.",
      integratedAction: "Selecting the correct unit from fresh sound-distinct choices fills the next ordered slot; equivalent taught spellings never compete as right and wrong, and GO models the complete target.",
      nonTargetDemands: "Following musical pulse, watching stage effects and navigating equivalent pad positions.",
      evidenceEvent: "Only a correct unit choice advances the ordered literacy sequence; beat timing never creates or removes evidence.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Freeze the stage behind one goal line, the printed target, ordered slots and selectable pad controls.",
      perceive: "With sound on, keep the masked target, completed sequence, unknown next slot and fresh choice pads visible; with sound off, label and show a model-supported target.",
      act: "Tap a pad or navigate to it and press the primary action, then activate GO after the ordered sequence.",
      feedback: "Fill a correct unit immediately; name a wrong choice and required contrast without changing the timing rules.",
      retry: "Keep the same fresh choice set available after an error and replay the current production cue.",
      complete: "Blend the completed word, celebrate the performance and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "With sound on, completed units are unmasked and each unreached unit uses one fixed marker so label length cannot leak the choice. Sound off is explicitly labelled Match the model and prints the target for supported reconstruction.",
      spoken: "Approved production recordings model the target phoneme, whole word or current sentence word.",
      replay: "The 56-pixel replay control repeats the current approved cue without browser speech."
    },
    controls: {
      keyboard: ["Left/Right selects a pad", "Space, Enter or Up activates it", "Number keys 1-4 choose directly"],
      touch: ["Tap and release on the chosen pad", "Drag away or cancel to abort the choice"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Tracks move from phoneme choices to syllable and sentence-word ordering before musical density changes; timing never changes correctness."
    },
    gameFeel: {
      movement: "Four equivalent pads support direct touch plus bounded keyboard selection while the stage responds to confirmed choices.",
      forgiveness: ["Late correct choices remain valid", "Wrong choices stay available", "The ordered strip never clears on timing", "GO waits for the completed sequence"],
      camera: "A fixed performance-stage frame keeps the target, choices, ordered slots and performers visible.",
      successFeedback: "The selected unit locks into the sequence, the band responds and an on-beat choice adds optional flourish.",
      errorFeedback: "A wrong pad names the selected and required units, replays the cue and leaves the complete choice set available."
    },
    world: {
      artDirection: "A colourful authored music stage with crisp silhouettes, restrained concert light and readable foreground type.",
      route: "The stage, sound strip and action zone remain in fixed readable screen regions rather than a spatial route.",
      character: "Canonical band characters and instruments remain readable beneath bounded effects.",
      assetFallback: "Missing stage art leaves the complete canvas lighting, sound strip, action prompt and performance loop."
    },
    state: {
      pauseResume: "Pause freezes phrase and animation time; resume resets the frame clock without creating a missed sound.",
      checkpoint: "The current curriculum track is saved through the existing Arcade checkpoint callback.",
      completion: "Existing score, stars, completed-word count and resumable track checkpoint remain the only progress state."
    },
    accessibility: {
      reducedMotion: "Camera pulse, flashes and particles are reduced while phoneme state and action feedback remain clear.",
      soundOff: "A clearly labelled Match the model mode prints the complete target, choices and blend action. It preserves playability as supported reconstruction and is not described as independent listening evidence.",
      nonColourCue: "Current and completed sounds use position, outline, labels and icons in addition to stage colour.",
      semanticFallback: "The named action target, focused onboarding and Arcade mission help expose the complete loop outside canvas art."
    },
    performance: {
      lowPowerFallback: "A single bounded Canvas2D surface, capped pixel ratio and reduced stage effects preserve tap response.",
      inputSafety: "Keyboard commits one selected pad; pointer commits on release and clears on cancel or lost capture; frame timing never determines correctness.",
      assetFailure: "The sound sequence and playable action remain available when decorative stage artwork fails."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable track checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/soundBeatTracks.test.js", "tests/unit/soundBeatLiteracyTiming.test.js", "tests/unit/premiumGameStandard.test.js"],
      browser: ["tests/release/sound-beat-replay.spec.js", "tests/release/arcade-ipad-controls.spec.js", "tests/release/student-activity-viewport.spec.js"],
      physicalDevice: {
        status: "unknown",
        note: "A real supported iPad playtest is still required; browser emulation is not recorded as a hardware pass."
      }
    }
  },
  "sound-racer": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "sound-racer",
    version: "2.0",
    audience: "Early readers discriminating whether printed and spoken words begin with the current target sound.",
    experiencePromise: "A forgiving three-lane sound race where every deliberate word choice teaches and missed targets return.",
    learning: {
      targetConstruct: "Decide whether a word begins with the shown target grapheme and phoneme.",
      childGoal: "Steer through words that start with the target sound and avoid other gates.",
      integratedAction: "Crossing a word gate is the onset decision; correctly matched words advance the target count.",
      nonTargetDemands: "Lane steering, route scanning, scenery obstacles and vehicle control.",
      evidenceEvent: "Only caught correct and incorrect word gates affect literacy evidence; missed targets and obstacles remain race events.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Freeze the race behind the current target, one recorded example and the complete steer map.",
      perceive: "Keep the target card visible while spaced word gates approach in readable lanes.",
      act: "Steer through a matching word gate or avoid a non-matching gate.",
      feedback: "Name why a caught word matches or does not match the current onset.",
      retry: "Queue every missed correct word later in the track with increased lane support and no evidence penalty.",
      complete: "Clear the required sound matches, show literacy and race results separately and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "The target grapheme, match instruction and correct-word count remain visible throughout the race.",
      spoken: "The countdown plays the approved production target phoneme, including current digraph targets.",
      replay: "A 56-pixel Hear sound control repeats the current production target cue during play."
    },
    controls: {
      keyboard: ["Left/Right or A/D steers", "Tab and Enter reach the Hear sound control"],
      touch: ["Tap a side or swipe to steer", "Tap Hear sound to replay the target"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Ten tracks change onset complexity and vocabulary before speed or route pressure increases."
    },
    gameFeel: {
      movement: "Immediate three-lane steering, bounded boost feedback and spaced gates preserve readable decisions.",
      forgiveness: ["Missed targets return", "Repeated misses gain a lane callout", "Obstacles do not lower literacy stars", "The target cue remains replayable"],
      camera: "A stable chase camera keeps all three lanes, approaching labels and the current route visible.",
      successFeedback: "The caught word and its matching onset appear in a high-contrast banner with chime, speech and a bounded burst.",
      errorFeedback: "A wrong caught word is named with its actual onset while the target stays visible."
    },
    world: {
      artDirection: "Authored Meadow, Dino Valley and Moonwood racing circuits with coherent low-poly scenery, lighting and atmosphere.",
      route: "Track, collision lanes, gate centres, ship route and camera use the same three-lane coordinate system.",
      character: "The current player vehicle remains distinctive and readable against every world palette.",
      assetFallback: "Procedural geometry, labels, track and complete low-tier scenery remain playable without decorative assets."
    },
    state: {
      pauseResume: "Pause freezes route and animation time; resume resets the frame clock without advancing a gate.",
      checkpoint: "The current curriculum track is saved through the existing Arcade checkpoint callback.",
      completion: "Existing score, stars, completed-word count and resumable track checkpoint remain the only progress state."
    },
    accessibility: {
      reducedMotion: "Optical flow, shake and bursts are reduced while steering, gate labels and feedback remain immediate.",
      soundOff: "The target grapheme, word labels, match count and specific feedback remain printed.",
      nonColourCue: "Target, shield, correct feedback and wrong feedback use words, symbols, position and shape as well as colour.",
      semanticFallback: "Named steer and replay buttons, focused onboarding and Arcade mission help expose the goal outside WebGL."
    },
    performance: {
      lowPowerFallback: "The shared Three.js quality tier caps pixel ratio and removes nonessential shadows and particle density first.",
      inputSafety: "Steer zones, swipes and keyboard share one lane action and every pointer path has up, cancel and lost-capture handling.",
      assetFailure: "The procedural ship, track, gates and labels remain a complete playable race if decorative assets fail."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable track checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/soundRacerTracks.test.js", "tests/unit/premiumGameStandard.test.js"],
      browser: ["tests/release/sound-racer-tutorial.spec.js", "tests/release/arcade-ipad-controls.spec.js", "tests/release/student-activity-viewport.spec.js"],
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
