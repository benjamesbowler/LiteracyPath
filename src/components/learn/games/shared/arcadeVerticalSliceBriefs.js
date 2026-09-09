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
      nonTargetDemands: "Scanning three equivalent leaf positions and following the climber's decorative route.",
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
    audience: "Early readers building written graphemes and ordered sentence parts from a model or a recorded cue.",
    experiencePromise: "A tactile bridge-building journey where every useful placement completes the language construction in view.",
    learning: {
      targetConstruct: "Reconstruct written graphemes or ordered sentence parts with recorded cue and model support kept explicit.",
      childGoal: "Choose a piece, then its numbered bridge space.",
      integratedAction: "Placing a compatible piece in its explicit socket extends the persistent construction.",
      nonTargetDemands: "Focus navigation, scrolling and decorative carry/crossing motion.",
      evidenceEvent: "Only a correctly matched and placed language part advances supported-practice progress; movement and collection do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Pause behind one goal line, the target construction and a visible keyboard/touch control map.",
      perceive: "Keep completed parts, numbered sockets and naturally sized pieces readable; compact construction scrolls within the game.",
      act: "Select a native piece button, then activate its explicit bridge socket.",
      feedback: "Lock a correct tile into the bridge; return a distractor with a specific contrast cue and no lost progress.",
      retry: "Leave the clue and required slot visible, return the tile to play and permit an immediate new choice.",
      complete: "Cross the completed bridge, show constructions built and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "Worked models remain visible; fresh recorded stages conceal the solution until Show model, mute or failed playback.",
      spoken: "The current target is spoken from production audio whenever that exact recording exists.",
      replay: "A 56-pixel replay control repeats the current available production cue without browser speech."
    },
    controls: {
      keyboard: ["Tab or Left/Right moves focus", "Enter or Space selects a piece or socket"],
      touch: ["Release a tap on a piece, then its bridge space", "Scroll compact construction to keep full words readable"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Ten curriculum-led targets per difficulty progress from written graphemes to longer word and sentence constructions; no route deadline grades learning."
    },
    gameFeel: {
      movement: "Carry, snap and crossing presentation follows measured native control anchors; input dispatch retains exact IDs.",
      forgiveness: ["Distractors return to play", "Correct placements persist", "Numbered sockets retain their identity", "No movement error removes learning evidence"],
      camera: "Separate cue, piece bank, construction and arrival regions use responsive layout and contained vertical scrolling.",
      successFeedback: "The tile seats into the bridge, the slot changes shape and a brief chime confirms the completed language part.",
      errorFeedback: "The selected tile is named, the needed contrast remains visible and the tile returns for another attempt."
    },
    world: {
      artDirection: "Authored Meadow, Dino Valley and Moonwood illustrated routes with tactile tiles and layered atmospheric depth.",
      route: "Piece and socket DOM rectangles supply the same anchors used by the helper and crossing pals.",
      character: "The current canonical helper and Pal art remain recognisable at play scale.",
      assetFallback: "Missing decorative images leave native controls, construction and an owned vector recovery helper usable."
    },
    state: {
      pauseResume: "Pause invalidates held input and freezes travel, stopping cue and effect media; resume retains the construction.",
      checkpoint: "The current curriculum level is saved through the existing Arcade checkpoint callback.",
      completion: "Final accepted placement fixes one score/star receipt with immutable first responses and assisted retries; crossing and Finish do not resave."
    },
    accessibility: {
      reducedMotion: "Decorative bobbing, bursts and camera intensity are reduced while tile and slot feedback stays immediate.",
      soundOff: "The complete target, current slot and feedback remain printed when audio is unavailable or disabled.",
      nonColourCue: "Required and completed slots use position, outline, label and shape in addition to colour.",
      semanticFallback: "Native named buttons, polite feedback and Arcade mission help expose the goal and controls directly."
    },
    performance: {
      lowPowerFallback: "Native controls remain usable without an animation surface; reduced motion shortens travel and removes secondary animation.",
      inputSafety: "Stable occurrence/slot IDs dispatch released pointer or keyboard input; cancel, lost capture and pause epochs cannot commit.",
      assetFailure: "Bridge geometry, target tiles and controls remain playable without decorative images."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-construction count", "Existing resumable level checkpoint", "Existing practice record with first responses and assisted retries"],
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
    audience: "Early readers comparing the beginning sounds of taught printed words.",
    experiencePromise: "Drive a Meadow Pals rally through readable road forks; each deliberate sound match opens the next route toward finish bunting.",
    learning: {
      targetConstruct: "Identify which of three taught printed words begins with the current shown grapheme and recorded phoneme.",
      childGoal: "Choose the matching road sign, then press Drive through to open that route.",
      integratedAction: "Lane selection aims the car; only an explicit Drive-through commitment submits the selected word at the held fork.",
      nonTargetDemands: "Optional lane steering, boost, route scenery and companion vehicles provide movement without determining the answer.",
      evidenceEvent: "A seeded round accepts one immutable first response with cue-delivery and support facts; later correct retries are supported recovery. Movement, time, collisions and route animation never create reading evidence.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Show the sound, one recorded example and the select-then-commit controls before an explicit Start button releases the car.",
      perceive: "Approach stops at a held fork with three stable equivalent HTML word signs, the current sound and a visible selected lane.",
      act: "Select a sign by touch, pointer or arrows/A/D, then use the separate Drive-through action to commit.",
      feedback: "A correct committed word opens its route; a wrong commitment names that word's actual onset while retaining the same fork.",
      retry: "Keep the original first response and target, show specific contrast feedback, then allow a supported retry without a deadline.",
      complete: "Settle beneath the finish bunting; distinguish first-response results from supported recovery and provide next track, replay and exit."
    },
    prompt: {
      visible: "The shown target sound, three real-text word signs, selected-lane label and mission progress remain visible in portrait and landscape.",
      spoken: "Replay the exact current approved target cue through one owner-bound audio request; record delivered, interrupted or unavailable separately from task completion.",
      replay: "The 56-pixel Hear sound control retries the current cue. Missing or interrupted audio is visible and permits explicitly supported text-based continuation."
    },
    controls: {
      keyboard: ["Left/Right or A/D selects a lane", "Space or Enter commits when the game surface owns focus", "Focused native buttons retain their normal keyboard behavior"],
      touch: ["Tap a word sign to select its lane", "Tap Drive through to commit the selected word", "Tap Hear sound to replay the current cue"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Preserve ten curriculum-track checkpoints and each buildTrack target count. Taught vocabulary and onset complexity change before decorative route intensity; forks always wait for a deliberate answer."
    },
    gameFeel: {
      movement: "Fixed-step acceleration follows a gently curving analytic route; wheels rotate with distance, front wheels steer and damped body lean settles at the held fork.",
      forgiveness: ["The decision zone waits without a timeout", "Wrong choices retain the same fork", "Supported retries preserve the original response", "Optional boost and companions never grade literacy"],
      camera: "A damped chase camera shares the road's centerline and lane coordinates; its reading plane keeps all three quiet word signs legible.",
      successFeedback: "The chosen route opens visibly, its word and matching onset are named and the car drives through before the next fork.",
      errorFeedback: "Name the chosen word's actual onset, retain the target and choices, and explicitly invite a supported retry."
    },
    world: {
      artDirection: "One warm low-poly Meadow rally with consistent authored kit, navy HUD, cream signs, green verges, slate road, teal vehicle and amber route accents; existing world palettes vary coherently.",
      route: "Road mesh, fork anchors, vehicle and chase camera use one analytic centerline/lane coordinate system through village start, bridge or courtyard waypoint and finish bunting.",
      character: "An owned KayKit rounded hatchback with readable wheels and glass carries a canonical Muddy badge; sedan companions animate the world without blocking answers.",
      assetFallback: "Missing models, WebGL failure or context loss selects a complete semantic DOM rally board with the same mission, choices, feedback and completion; no primitive substitute hero is claimed as final 3D art."
    },
    state: {
      pauseResume: "Pause, hidden state and exit cancel held input and owned audio. Resume resets frame timing; hidden time cannot move the car or submit a word.",
      checkpoint: "Save the current curriculum track through the existing Arcade checkpoint callback; seeded mission, round and token IDs reject stale or duplicate intents.",
      completion: "Preserve immutable first responses and support facts within the mission. Existing score, stars, completed-word count and track checkpoint remain the only persisted progress fields; completion fires once."
    },
    accessibility: {
      reducedMotion: "Reduce travel intensity, camera motion and effects while keeping the held fork, deliberate commitment and feedback unchanged.",
      soundOff: "Label text-supported play explicitly; keep the target grapheme, word signs and feedback visible without claiming independent listening evidence.",
      nonColourCue: "Selection uses outline, position and text; correct and wrong feedback name the word and onset rather than relying on colour.",
      semanticFallback: "A complete DOM rally board runs the identical controller through onboarding, held forks, retry, checkpoint, finish, replay and exit when 3D is unavailable."
    },
    performance: {
      lowPowerFallback: "Shared Three quality tiers and the existing measured frame-budget policy reduce effects and shadows while retaining the authored hero; sustained low-tier stalls enter the same complete semantic rally.",
      inputSafety: "Fixed-step simulation bounds stalls; typed select and commit intents share keyboard/touch rules and every held pointer releases on up, cancel, lost capture, pause and exit.",
      assetFailure: "Bounded asset loading and context-loss recovery retain the current mission and switch to the complete DOM rally board without losing first responses or creating extra commits."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable track checkpoint"],
      network: ["Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/soundRacerTracks.test.js", "tests/unit/soundRacerMission.test.js", "tests/unit/soundRacerRoute.test.js", "tests/unit/soundRacerSimulation.test.js", "tests/unit/soundRacerAudio.test.js", "tests/unit/soundRacerSceneKit.test.js", "tests/unit/soundRacerPerformance.test.js", "tests/unit/premiumGameStandard.test.js"],
      browser: ["tests/release/sound-racer-rally.spec.js", "tests/release/sound-racer-lifecycle.spec.js", "tests/release/sound-racer-render-recovery.spec.js", "tests/release/sound-racer-tutorial.spec.js", "tests/release/arcade-ipad-controls.spec.js", "tests/release/student-activity-viewport.spec.js"],
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
