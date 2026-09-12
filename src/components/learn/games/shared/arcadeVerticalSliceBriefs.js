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
  "sound-seekers": {
  "schemaVersion": 1,
  "gameId": "sound-seekers",
  "version": "campaign-1",
  "audience": "Beginning readers through sentence readers exploring with the canonical Pals.",
  "experiencePromise": "Explore a living third-person countryside, meet friends and enter connected side-view platform adventures to restore each place.",
  "learning": {
    "targetConstruct": "The mission curriculum defines taught phonemes, decoding, encoding and sentence reading.",
    "childGoal": "Help a friend restore their place.",
    "integratedAction": "Choose, carry, sort and place the requested sound or reading object in a physical scene.",
    "nonTargetDemands": "Walking, looking, jumping, finding a route and operating traversal levers.",
    "evidenceEvent": "Only existing campaign challenge outcomes emit formative attempts with their support context.",
    "movementCreatesEvidence": false
  },
  "loop": {
    "onboard": "Choose a canonical Pal; follow the path toward a friend.",
    "perceive": "Approach a resident and hear or read their problem; the mission keeps its current target visible.",
    "act": "Move through the world, enter an adventure and act on the requested literacy object.",
    "feedback": "The selected object responds immediately; successful learning repairs the task and opens the motor route.",
    "retry": "Specific feedback retains the target. Falls return to the room checkpoint without undoing learning.",
    "complete": "Return to the same place; completed main missions install the authored restoration and unlock onward travel."
  },
  "prompt": {
    "visible": "A short nearby-action cue in the landscape; existing mission target and specific feedback in platform rooms.",
    "spoken": "Existing recorded campaign instruction and target audio.",
    "replay": "Existing Hear control repeats the current cue; sound-off support is explicitly marked."
  },
  "controls": {
    "keyboard": [
      "Arrows or WASD move relative to the camera; Q/C orbit; Space jumps; E/Enter interacts.",
      "Platform rooms use left/right and Space."
    ],
    "touch": [
      "Hold the 56px direction controls; tap Jump or Use.",
      "Drag to orbit or use the camera buttons; select a destination for motor assistance."
    ],
    "minimumTargetCssPixels": 56,
    "pointerReleaseEvents": [
      "pointerup",
      "pointercancel",
      "lostpointercapture"
    ]
  },
  "difficulty": {
    "curriculumBeforePressure": true,
    "ladder": "Thirty places retain the existing curriculum prerequisites and authored missions; motor routes do not increase literacy pressure."
  },
  "gameFeel": {
    "movement": "Acceleration and collision use bounded substeps; camera-relative walking, damped camera and jump arcs share one player state.",
    "forgiveness": [
      "No lives or timed literacy answers",
      "Physical route assistance",
      "Completed learning survives a missed jump",
      "Pause releases held input"
    ],
    "camera": "Third-person orbit and distance control; side-view camera follows the active platform room.",
    "successFeedback": "Physical repair, specific text and existing sound effects.",
    "errorFeedback": "Current task feedback identifies the selected contrast without punishing movement."
  },
  "world": {
    "artDirection": "Textured modeled landscapes, wind-blown grass, cast shadows, atmospheric mountains and canonical illustrated Pal animation form an intentional storybook 2.5D hybrid inspired by Breath of the Wild exploration.",
    "route": "One authored geometry owns paths, tree trunks, water, crossings and navigation for every place; each landmark retains its mission-specific restoration.",
    "character": "Eight canonical Pal walk atlases and original resident art; no substitute stock hero.",
    "assetFallback": "A missing essential image/model or lost WebGL context pauses entry and offers Retry; no primitive hero substitute."
  },
  "state": {
    "pauseResume": "Pause, dialogs and hidden tabs release movement and stop progression; resuming resets the frame clock.",
    "checkpoint": "Existing mission checkpoints and evidence persist; landscape position, opened bridge and discovered nook survive scene transitions in memory only.",
    "completion": "Existing main/optional campaign completion and restoration remain the source of onward travel."
  },
  "accessibility": {
    "reducedMotion": "Disable wind/water drift and camera interpolation while preserving movement and immediate feedback.",
    "soundOff": "Existing text support and supported-practice markers preserve the distinction from independent listening evidence.",
    "nonColourCue": "Named residents, distinct props, action labels and visible bridge geometry.",
    "semanticFallback": "Choose nearby exposes named physical destinations; motor assistance follows the same collision route and does not choose literacy answers."
  },
  "performance": {
    "lowPowerFallback": "Simplified backgrounds cap DPR at 1, disable shadows and reduce grass while keeping all solid objects and learning controls.",
    "inputSafety": "Pointer capture loss, pointer cancel, key release, blur and scene disposal clear movement; navigation is frame-rate independent.",
    "assetFailure": "Retry rebuilds the scene; asynchronous loads and graphics resources are disposed across scene transitions."
  },
  "privacy": {
    "dataWritten": [
      "Existing campaign progress and checkpoints only"
    ],
    "network": [
      "Existing same-origin assets and existing progress sync only"
    ],
    "newIdentifier": false,
    "newExternalService": false
  },
  "validation": {
    "unit": [
      "tests/unit/soundSeekersExploration.test.js",
      "tests/unit/soundSeekersCampaignScene.test.js",
      "tests/unit/soundSeekersCampaignRestoration.test.js"
    ],
    "browser": [
      "tests/release/sound-seekers-route-isolation.spec.js"
    ],
    "physicalDevice": {
      "status": "unknown",
      "note": "Direct desktop/tablet browser play is separate from physical iPad evidence; no physical device claim."
    }
  }
},
  "letter-leap": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "letter-leap",
    version: "2.0",
    audience: "Early readers encoding taught words, with later sentence legs for developing readers.",
    experiencePromise: "A forgiving side-scrolling spelling adventure where every useful jump completes the word in view.",
    learning: {
      targetConstruct: "Encode a spoken or picture-cued word by selecting its graphemes in order.",
      childGoal: "Run and jump through each persistent letter in order to spell the word.",
      integratedAction: "Colliding with the next required grapheme fills the next persistent word slot.",
      nonTargetDemands: "Horizontal movement, jumping, platforms, hazards and route navigation without moving the letters.",
      evidenceEvent: "Only a completed ordered word advances recorded word progress; movement, coins and survival do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Freeze the world behind one goal line and a visible keyboard/touch control map.",
      perceive: "Keep a picture or masked sentence cue, completed graphemes and the next empty slot visible together.",
      act: "Move and jump into the next required grapheme.",
      feedback: "Fill the matching slot immediately; wrong collisions retain the goal and give a specific contrast cue.",
      retry: "Leave missed letters at their authored coordinates so the child can backtrack and try again.",
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
  "word-climb": {
    schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
    gameId: "word-climb",
    version: "2.0",
    audience: "Early readers discriminating the beginning sounds of short printed words.",
    experiencePromise: "A calm beanstalk climb where each deliberate onset match moves the reader visibly toward the canopy.",
    learning: {
      targetConstruct: "Identify which printed word begins with the shown and spoken target phoneme.",
      childGoal: "Read three leaf words and choose the one that starts with the target sound.",
      integratedAction: "Choosing the matching word completes one climb and reveals a fresh equal-position choice set.",
      nonTargetDemands: "Comparing three equal leaf ledges while following the climber's vertical route.",
      evidenceEvent: "Only a deliberate correct word choice advances the recorded climb; route animation and position do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Keep one direct goal, the printed target phoneme and all three word leaves visible before the first choice.",
      perceive: "Read the persistent target and compare the beginning sound of each equally styled word.",
      act: "Tap a leaf or focus it and press Enter or Space.",
      feedback: "A correct word names the matching onset and moves the climb; a wrong word names its actual onset.",
      retry: "Leave the target and all three words in place after an error, then restore every choice for an immediate retry.",
      complete: "Reach the canopy, show words read, score and stars, then continue or return through Arcade chrome."
    },
    prompt: {
      visible: "The target phoneme, exact choose-the-word instruction, three printed words and current climb count remain visible together.",
      spoken: "The current target phoneme and chosen word use the existing local production-audio library when available.",
      replay: "A 56-pixel Hear sound button repeats the target cue and becomes an explicit disabled Sound off label when audio is unavailable."
    },
    controls: {
      keyboard: ["Tab or Shift+Tab moves between word leaves", "Enter or Space chooses the focused word"],
      touch: ["Tap and release a word leaf to choose", "Move away, cancel or lose capture to abort native button activation"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Difficulty changes the reviewed onset and vocabulary set while every round retains three unhurried, equivalent choices."
    },
    gameFeel: {
      movement: "A correct choice raises the climber and refreshes the next three leaves after a short, pausable transition.",
      forgiveness: ["No timer pressure", "Wrong choices do not remove progress", "The actual onset is named", "The target remains visible", "Paused transitions resume with their remaining time"],
      camera: "A fixed, bounded portrait-like beanstalk frame keeps the target and all choice leaves in view at desktop and short landscape sizes.",
      successFeedback: "The chosen leaf confirms the exact word and sound, the climb meter fills and the character rises.",
      errorFeedback: "The selected word and its actual beginning sound are printed while the requested target stays visible."
    },
    world: {
      artDirection: "An authored illustrated beanstalk scene with layered SVG foliage, mist, warm highlights and high-contrast tactile leaves.",
      route: "The six-step root-to-canopy meter and climber share one bounded responsive layout with the three choice ledges.",
      character: "The canonical Meadow Pal remains a decorative climber and never obscures or identifies the correct answer.",
      assetFallback: "CSS and SVG retain the complete target, word leaves, climb route and feedback if the decorative Pal image fails."
    },
    state: {
      pauseResume: "Pause freezes every feedback, speech and climb-transition timer with its remaining delay; resume re-arms only pending work.",
      checkpoint: "Each completed climb is saved through the existing Arcade checkpoint callback and restored as the next unfinished step.",
      completion: "Existing score, stars, completed-word count and resumable climb checkpoint remain the only progress state."
    },
    accessibility: {
      reducedMotion: "Decorative drift and climb movement reduce while the word, onset and progress feedback remain immediate.",
      soundOff: "The target phoneme and every word remain printed; replay is labelled Sound off instead of disappearing.",
      nonColourCue: "Correct and wrong feedback use explicit words, symbols, shape and persistent position in addition to colour.",
      semanticFallback: "A labelled region, headings, status text, native word buttons, focused dialogs and Arcade mission help expose the whole loop without the illustration."
    },
    performance: {
      lowPowerFallback: "A bounded DOM, CSS and SVG scene has no animation frame loop or high-density canvas backing store.",
      inputSafety: "Native button activation commits once on completed keyboard or pointer activation, while pause-safe timers prevent hidden transitions.",
      assetFailure: "The playable target, choice buttons, progress and feedback do not depend on decorative image loading."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable climb checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/wordClimbLevels.test.js", "tests/unit/premiumGameStandard.test.js"],
      browser: ["tests/release/word-climb-premium.spec.js", "tests/release/student-activity-viewport.spec.js"],
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
    experiencePromise: "Play a musical rhythm game by tapping arriving sound notes and blending each completed word.",
    learning: {
      targetConstruct: "Supported sound-sequence rehearsal during a rhythm performance; rhythm score is not independent literacy evidence.",
      childGoal: "Tap the sounds on the beat, then tap GO to blend the word.",
      integratedAction: "Each timed tap plays the next authored sound; completing the sequence models the whole word.",
      nonTargetDemands: "Following musical pulse, watching stage effects and navigating equivalent pad positions.",
      evidenceEvent: "Completed performances and rhythm scores record practice, not independent sound identification or mastery.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Show the tap-on-the-beat instruction over the paused stage.",
      perceive: "Watch the next authored sound note approach the hit line.",
      act: "Tap the stage or press Space as the sound reaches the line.",
      feedback: "Show Perfect, Great or Good timing and play the accepted sound.",
      retry: "Repeat a missed word with slower timing and a wider hit window.",
      complete: "Blend the completed word, celebrate the performance and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "The authored word and arriving sound notes remain visible.",
      spoken: "Approved production recordings model the target phoneme, whole word or current sentence word.",
      replay: "The 56-pixel replay control repeats the current approved cue without browser speech."
    },
    controls: {
      keyboard: ["Space, Enter or Up taps the arriving note"],
      touch: ["Tap the full stage as the note reaches the line"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Words progress to syllables and sentence-word sequences across ten tracks, with forgiving rhythm windows."
    },
    gameFeel: {
      movement: "Notes travel toward the hit line while the band and stage respond to taps.",
      forgiveness: ["Early taps give a Wait cue", "Repeated misses widen the timing window", "Repeated misses retain the current note", "The final GO waits for the learner"],
      camera: "A fixed performance-stage frame keeps the target, choices, ordered slots and performers visible.",
      successFeedback: "A timed tap lights the stage and plays the next sound; GO plays the whole target.",
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
      soundOff: "The printed target and moving sound labels preserve rhythm play with sound off; performance is not independent listening evidence.",
      nonColourCue: "Current and completed sounds use position, outline, labels and icons in addition to stage colour.",
      semanticFallback: "The named action target, focused onboarding and Arcade mission help expose the complete loop outside canvas art."
    },
    performance: {
      lowPowerFallback: "A single bounded Canvas2D surface, capped pixel ratio and reduced stage effects preserve tap response.",
      inputSafety: "A discrete tap or keyboard action strikes the note; a short input lock rejects jittery double taps. No held pointer action can remain stuck.",
      assetFailure: "The sound sequence and playable action remain available when decorative stage artwork fails."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable track checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/soundBeatTracks.test.js", "tests/unit/premiumGameStandard.test.js"],
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
