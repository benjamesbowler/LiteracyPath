import { PHONICS_PRACTICE_BRIEFS } from "./phonicsPracticeBriefs.js";
import { PHYSICAL_ARCADE_BRIEFS } from "./physicalArcadeBriefs.js";
import { buildArcadeJourneyBriefs } from "./arcadeJourneyBriefs.js";
import { AUTHORED_SKATE_BRIEF } from "./authoredSkateBrief.js";
import { AUTHORED_RHYME_BRIEF } from "./authoredRhymeBrief.js";
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
const ORIGINAL_BRIEFS = deepFreeze({
  "drum-trail": {
    schemaVersion: 1, gameId: "drum-trail", version: "1.1",
    audience: "Young learners exploring familiar spoken words; reading is not required.",
    experiencePromise: "Help canonical Bouncy cross a woodland stream by choosing the right syllable-count crossing.",
    learning: {
      targetConstruct: "Whole-word syllable counting with visible word and picture; no independent oral-only, phoneme blending, deletion, spelling or rhythm-accuracy claim.",
      childGoal: "Open Bouncy’s next stream crossing.",
      integratedAction: "Hear one familiar whole word, derive its count and choose an equally reachable drum-stone crossing.",
      nonTargetDemands: "Selecting a crossing and recognising a count; no timed drumming, microphone or reading demand.",
      evidenceEvent: "Settled count choices retain word visibility, actual picture/audio delivery and model, retry or mission help. Picture-and-word practice never creates independent oral-only evidence.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Start a saved outing; the word replay and all crossing choices are visible.",
      perceive: "See the whole word and its familiar picture; Hear replays the recording. Syllable chunks appear only in a model or settled feedback.",
      act: "Select the crossing with the word’s spoken syllable count, without a deadline.",
      feedback: "The choice responds immediately; a settled correct answer opens the crossing and gives count-specific feedback.",
      retry: "First compare and replay the whole word; an explicit count model changes the response to supported practice.",
      complete: "After the final settled crossing, the existing player saves the result and outing; choose Next, Replay or Back to Arcade."
    },
    prompt: {
      visible: "A prominent unsegmented target word beside its familiar picture, equal count crossings and a labelled whole-word replay.",
      spoken: "Existing retained Leda whole-word recordings; optional existing celebration sounds, never generated speech.",
      replay: "Hear repeats the complete word. A sound-off, missing or blocked clip is explicit supported practice rather than an independent response."
    },
    controls: {
      keyboard: ["Tab between named count crossings; Enter or Space selects.", "The Hear button repeats the word and the shared player provides Pause, Help and Exit."],
      touch: ["Tap any complete crossing; no dragging, held rhythm or fine-motor follow-up is required."],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: { curriculumBeforePressure: true, ladder: "Easy contrasts familiar one/two-part words; medium adds stable three-part words; hard adds reviewed four-part words and close counts. Routes remain untimed." },
    gameFeel: {
      movement: "A count choice changes the crossing itself; Bouncy’s following travel is a celebration and never another answer gate.",
      forgiveness: ["No lives or count deadline", "A wrong crossing leaves the whole-word target in place", "Help and replay keep their actual support context"],
      camera: "The full stream and equally reachable crossings stay in one bounded illustrated playfield.",
      successFeedback: "The stream crossing opens with the derived count and a short Bouncy movement.",
      errorFeedback: "The selected count is compared with the spoken word; further modelling is labelled supported."
    },
    world: {
      artDirection: "Local retained woodland illustration, isolated drum-stone props and canonical Bouncy animation; instructional lettering is rendered by the app.",
      route: "Each settled syllable decision opens the next crossing; the retained seed determines targets and equal route order.",
      character: "Canonical Bouncy, taken from retained approved art rather than a substitute animal.",
      assetFallback: "Native vector drum marks preserve every count if the prop atlas fails; a missing word picture shows Picture unavailable while retaining the printed word and Hear. Failed word delivery is explicit supported practice."
    },
    state: {
      pauseResume: "Shared Pause, Help and hidden-tab suspension freeze feedback and travel; resuming preserves the current answer.",
      checkpoint: "Use the existing scoped level, total, content seed and outing checkpoint.",
      completion: "Submit the existing bounded result to GamePlayer once; outing completion follows the successful save receipt."
    },
    accessibility: {
      reducedMotion: "Quiet Bouncy travel and decorative effects while preserving direct count selection and feedback.",
      soundOff: "The unsegmented printed word and picture remain visible. A child can read the word or ask someone to say it; print availability and actual audio delivery remain separate evidence.",
      nonColourCue: "Count shapes, named crossing controls and text feedback carry meaning without correct-route colours.",
      semanticFallback: "Native named crossing buttons, replay, status feedback and the shared player controls remain keyboard reachable."
    },
    performance: {
      lowPowerFallback: "A bounded DOM playfield and compact local WebP assets avoid a WebGL requirement.",
      inputSafety: "Discrete native button activation needs no held-input state; pause, cancel and unmount stop owned audio and transition clocks.",
      assetFailure: "Native count marks preserve the answer choices without the prop atlas; released word assets are checked by the content source and evidence retains failed audio delivery."
    },
    privacy: {
      dataWritten: ["Existing game score, stars, completed-item count and bounded practice evidence", "Existing scoped level/seed/outing checkpoint and completed outing numbers"],
      network: ["Same-origin retained artwork/audio and existing progress sync only"], newIdentifier: false, newExternalService: false
    },
    validation: {
      unit: ["tests/unit/newArcadeIntegration.test.js", "tests/unit/drumTrailGame.test.js", "tests/unit/gameReplay.test.js", "tests/unit/arcadeJourneys.test.js"],
      browser: ["tests/release/new-arcade-integration.spec.js", "tests/release/student-activity-viewport.spec.js", "tests/release/arcade-ipad-controls.spec.js"],
      physicalDevice: { status: "unknown", note: "Browser and unit review do not establish real-iPad or classroom pacing evidence." }
    }
  },
  "lantern-lagoon": {
    schemaVersion: 1, gameId: "lantern-lagoon", version: "1.0",
    audience: "Beginning sentence readers with confirmed taught-code context, or explicitly supported listeners/read-together learners.",
    experiencePromise: "Light a quiet lagoon by interpreting literal sentences and choosing their matching world scenes.",
    learning: {
      targetConstruct: "Literal sentence comprehension: actor, action and location; independent reading is available only for print compatible with confirmed taught code.",
      childGoal: "Light the correct scene and open the next lagoon route.",
      integratedAction: "Interpret the retained sentence and tap one of equally plausible actor/action/location scenes.",
      nonTargetDemands: "Aiming by direct scene selection; no compulsory precision walking, timer or vocabulary-based placement inference.",
      evidenceEvent: "Settled scene choices retain reading/listening/read-together mode, exact delivered sentence audio and actual help/model use; hearing a full sentence never becomes independent decoding evidence.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Choose a saved outing. Confirmed taught-code context selects eligible print; absent context leads to labelled supported listening or read together.",
      perceive: "Keep the complete sentence and every equally plausible scene visible, with optional exact sentence replay.",
      act: "Tap the scene satisfying the sentence’s actor, action and location.",
      feedback: "The selected actor/scene responds and correct comprehension lights the route automatically.",
      retry: "Compare the chosen scene with the sentence; sentence audio, a model or mission help retain their support context.",
      complete: "After all settled scene decisions, the existing player saves the result and outing; choose Next, Replay or Back to Arcade."
    },
    prompt: {
      visible: "The persistent full sentence and equal scene choices, without pre-answer glow or size cues.",
      spoken: "Exact authored Leda whole-sentence recordings support Listening; retained and newly authored clips share a checked runtime manifest. A missing sentence is never assembled from words.",
      replay: "An available Hear control repeats the exact full sentence; in reading practice its delivery marks the response assisted."
    },
    controls: {
      keyboard: ["Tab between equally named scene buttons; Enter or Space selects.", "Use native Hear and support-mode buttons; shared Pause, Help and Exit remain available."],
      touch: ["Tap the complete scene to aim the lantern; a correct choice opens the route without another motor confirmation."],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: { curriculumBeforePressure: true, ladder: "Eligible print uses the confirmed taught graphemes and high-frequency words. Difficulty varies reviewed literal contrasts inside that eligible bank, without time pressure; richer language is explicit supported practice." },
    gameFeel: {
      movement: "Direct scene selection aims the lantern; a correct interpretation lights the scene and opens the route.",
      forgiveness: ["No lives or response deadline", "The sentence remains in place after a wrong scene", "Audio/model/help are recorded as support rather than inferred from button presence"],
      camera: "A bounded illustrated lagoon keeps the entire sentence and all equal scene choices visible.",
      successFeedback: "The matched scene receives its lantern and a specific sentence confirmation.",
      errorFeedback: "The selected actor, action or location is compared with the sentence; an explicit model remains assisted."
    },
    world: {
      artDirection: "Retained moonlit horizon and isolated duck, rabbit, lantern and location props; printed sentences remain in the canonical teaching font.",
      route: "Seeded literal contrasts and equal scene arrangements form each saved outing; actor/location geometry is rendered from the same scene definition that evaluates the answer.",
      character: "Retained illustrated lagoon animals and approved rabbit poses, without a substitute game mascot.",
      assetFallback: "Semantic vector animals and location props preserve the scene when retained art fails; blocked sentence audio stays an honest supported route and cannot be reported as delivered."
    },
    state: {
      pauseResume: "Shared Pause, Help and hidden tabs freeze feedback and travel; the sentence and unresolved scenes survive resume.",
      checkpoint: "Use the existing scoped level, total, content seed and outing checkpoint; reevaluate print compatibility against the current confirmed context.",
      completion: "GamePlayer receives the settled result once; the successful save receipt owns completion and onward outings."
    },
    accessibility: {
      reducedMotion: "Freeze decorative water and quiet lantern travel without changing scene choices or feedback.",
      soundOff: "Eligible print supports reading practice; absent taught-code context is explicitly read together, never silently independent listening.",
      nonColourCue: "Actor/action/location geometry and specific text communicate correctness; candidate glow, colour or focus labels do not reveal the key.",
      semanticFallback: "Native equal scene buttons, a persistent sentence, labelled replay and status feedback retain keyboard reachability."
    },
    performance: {
      lowPowerFallback: "Compact retained WebP layers and a DOM playfield avoid a WebGL dependency.",
      inputSafety: "Discrete scene activation has no held motor input; shared overlays and hidden tabs stop owned cue and transition clocks.",
      assetFailure: "The scene-definition asset registry is checked for real retained files; vector scene fallbacks preserve literal relationships and sentence playback failures remain explicit."
    },
    privacy: {
      dataWritten: ["Existing score, stars, completed-item count and bounded practice evidence including actual support", "Existing scoped level/seed/outing checkpoint and completed outing numbers"],
      network: ["Same-origin retained artwork/audio and existing progress sync only"], newIdentifier: false, newExternalService: false
    },
    validation: {
      unit: ["tests/unit/newArcadeIntegration.test.js", "tests/unit/lanternLagoonModel.test.js", "tests/unit/gameReplay.test.js", "tests/unit/arcadeJourneys.test.js"],
      browser: ["tests/release/new-arcade-integration.spec.js", "tests/release/student-activity-viewport.spec.js", "tests/release/arcade-ipad-controls.spec.js"],
      physicalDevice: { status: "unknown", note: "Rendered browser checks do not certify real-iPad use, human listening or observed child comprehension." }
    }
  },
  "sound-seekers": {
  "schemaVersion": 1,
  "gameId": "sound-seekers",
  "version": "campaign-1",
  "audience": "Beginning readers through sentence readers exploring with the canonical Pals.",
  "experiencePromise": "Explore a living third-person countryside, meet friends and enter separate side-view platform and 2.5D clue-maze adventures to restore each place.",
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
      "Platform rooms use left/right and Space; mazes use four directions; Shift runs. Standard controllers use left-stick movement, right-stick orbit, bottom-button jump, left-button interaction and right-button sprint."
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
    "camera": "Third-person orbit and distance control; side-view camera follows a bounded activity room; maze cameras keep the Pal clear of the interface.",
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
      "tests/unit/soundSeekersAdventureAreas.test.js",
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
    experiencePromise: "A forgiving side-scrolling spelling adventure where the child runs and jumps through the letters of a pictured and heard word.",
    learning: {
      targetConstruct: "Encode the heard word by selecting its graphemes in order; sentence-context pictures and unavailable audio remain supported practice.",
      childGoal: "Run and jump through each persistent letter in order to spell the word.",
      integratedAction: "Colliding with the next required grapheme fills the next persistent word slot.",
      nonTargetDemands: "Horizontal movement, jumping, platforms, hazards and route navigation without moving the letters.",
      evidenceEvent: "Ordered grapheme contacts retain the immutable first response, supported retries and actual recorded-audio and decoded-picture receipts. A completed word advances practice progress; movement, coins and survival remain motor events.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Show the pictured goal and labelled movement controls; replay and optional help remain available without an instruction-listening gate.",
      perceive: "Keep a picture or masked sentence cue, completed graphemes and the next empty slot visible together.",
      act: "Move and jump into the next required grapheme.",
      feedback: "Fill the matching slot immediately; wrong collisions retain the goal and give a specific contrast cue.",
      retry: "Leave missed letters at their authored coordinates so the child can backtrack and try again.",
      complete: "The final spelling automatically completes the stage after brief feedback; show words spelled, score and earned collectibles."
    },
    prompt: {
      visible: "The picture identifies the target while the strip shows only collected graphemes and empty slots. A partial spelling hint appears after two wrong contacts. Sentence context masks every occurrence of the current target. If both cue channels fail, explain their absence and keep exploration available without exposing a copying model.",
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
      artDirection: "Original illustrated Meadow, Dino Valley and Moonwood horizons, tactile terrain, springs, crates and world-specific foes are anchored to the physical platform route.",
      route: "Walkable ground, raised platforms and signalled ravines share the collision and camera coordinate system.",
      character: "Bouncy, Chompy and Pip have original registered movement and response poses; measured soles and crowns share the collision coordinate system.",
      assetFallback: "Original registered platforming art falls back through shared authored Pal continuity and legacy canonical art, then an explicitly art-unavailable canonical Canvas hero. The same complete route, collision rules and controls remain playable."
    },
    state: {
      pauseResume: "Pause freezes gameplay; resume resets frame timing so hidden time never becomes a physics jump.",
      checkpoint: "A bounded learner- and difficulty-scoped local practice session keeps the seed, actual route, collected prefix, frozen choice bank, stage queue, support and response history. Save failure holds that exact snapshot for Retry save.",
      completion: "A versioned heard-word-grapheme-encoding completion retains first responses, assisted retries and delivered cue receipts as practice evidence. The mutable physical session stays local; completion does not claim formal assessment or mastery."
    },
    accessibility: {
      reducedMotion: "Screen shake and urgent decorative motion are removed while the route, letters and feedback remain.",
      soundOff: "A reviewed picture keeps spelling playable. Disabled, pending or unavailable audio is recorded as support; unavailable replay is hidden. No target word is printed for copying, and a missing picture leaves a clear audio-only cue or exploration message.",
      nonColourCue: "The next empty slot uses position, border, glow and persistent order; every letter choice uses equivalent geometry rather than a colour-coded answer.",
      semanticFallback: "Named buttons, focused onboarding and Arcade mission help expose the goal and controls outside the canvas."
    },
    performance: {
      lowPowerFallback: "A single bounded canvas, capped device pixel ratio and reduced decorative motion preserve input response.",
      inputSafety: "Frame delta is capped and every held pointer path has up, cancel and lost-capture release.",
      assetFailure: "The playable route, targets and controls do not depend on a decorative image finishing its load."
    },
    privacy: {
      dataWritten: ["Score, stars and completed words", "Bounded local route, prefix, queue and support session", "Versioned first-response and retry practice evidence with actual picture and recorded-audio receipts"],
      network: ["Same-origin retained art and recorded audio", "Existing scoped progress sync receives immutable completion evidence; mutable practiceSession remains local"],
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
    experiencePromise: "Climb through Moonwood, steer around branches and leap onto matching word ledges on the way to the canopy.",
    learning: {
      targetConstruct: "Identify which printed word begins with the shown and spoken target phoneme.",
      childGoal: "Read the three word ledges and land on the one that starts with the target sound.",
      integratedAction: "Aim and jump to a matching word ledge; a settled correct landing earns one word and opens the next short climbing section.",
      nonTargetDemands: "Climbing a bending trunk, steering around branches, selecting a ledge and adjusting a jump in flight.",
      evidenceEvent: "Only landing on the current matching word ledge records reading progress; climbing, rest ledges and optional lantern lights do not.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Show the target phoneme, arrow controls and next three words before the first short approach.",
      perceive: "Preview all three equally styled words while climbing, then compare their beginning sounds at the decision ledges.",
      act: "Hold up to climb and left or right to steer; at a station choose a ledge with left or right and jump with up, or activate the ledge directly.",
      feedback: "A correct landing names the matching word and onset; a wrong-word landing names its actual onset before a local recovery.",
      retry: "A safety vine returns the climber to the local safe position with the target and complete three-word set intact; motor falls do not become reading errors.",
      complete: "The final correct word landing automatically completes the ascent and reveals the result, Next ascent and Replay controls without another task."
    },
    prompt: {
      visible: "The target phoneme and word count stay visible; all three upcoming words appear during the approach and on equally styled physical ledges at the station.",
      spoken: "The current target phoneme and chosen word use the existing local production-audio library when available.",
      replay: "A labelled Hear sound button repeats the target cue; when sound is off it is disabled and its accessible label identifies the printed target."
    },
    controls: {
      keyboard: ["Hold ArrowUp or W to climb", "ArrowLeft or A and ArrowRight or D steer; at a station they select a word ledge", "ArrowUp or W jumps to the selected ledge; Space or Enter also acts when focus is on the playfield", "Tab or Shift+Tab reaches active word ledges; Enter or Space launches the focused ledge jump"],
      touch: ["Left thumb steers with the left/right pair; right thumb holds CLIMB or taps JUMP; release, cancel or lose capture to stop", "Tap an active word ledge to launch a jump, or use the up control to jump toward the selected ledge"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Reviewed vocabulary and six, eight or ten word decisions follow the chosen level; successive ascents vary bends, wind, branches and route width while retaining three unhurried choices."
    },
    gameFeel: {
      movement: "Continuous trunk climbing leads into a physical word-platform jump roughly every three seconds of clear upward travel; steering and optional lights add decisions during each short approach.",
      forgiveness: ["No timer pressure", "Wrong words retain earned progress and all three choices", "Slower sideways grip adjustments and an outer-bark edge catch prevent overshoot falls", "Outlined thorn branches retain real collision and local recovery without reducing reading accuracy", "Gentle air steering preserves deliberate ledge choices", "The actual onset is named", "Pausing freezes physics and completion feedback"],
      camera: "A responsive camera follows the physical climber through the forest while the target, upcoming-word preview and movement controls remain fixed and readable.",
      successFeedback: "The climber settles on the matching ledge, the word count increases and the next approach opens immediately.",
      errorFeedback: "The selected word and its actual beginning sound are printed while the requested target stays visible; a safety vine recovers the climber for another jump."
    },
    world: {
      artDirection: "An authored Moonwood forest with warm-lit bark, layered blue-green depth, grounded lookouts, lantern lights and clear cream word plaques on mossy ledges.",
      route: "Short physical trunk approaches alternate with three-way word-platform jumps; bends, branch obstacles, wind and optional lights vary across saved ascents.",
      character: "The authored Pip hero climbs, grips, jumps, lands and recovers in the physical world without identifying the correct word.",
      assetFallback: "CSS and SVG preserve the physical route, word ledges, target, controls and fallback hero when the Three scene or authored model cannot load."
    },
    state: {
      pauseResume: "Pause and hidden-page handling stop physics, clear held movement and preserve the current ascent for resume.",
      checkpoint: "Completed words use the existing Arcade checkpoint; the local sidecar retains the current words, physical position, safe ledge and journey state. Older long approaches resume on the compact route at the last earned word.",
      completion: "The last correct word landing records the existing result automatically; optional lights remain separate from reading evidence."
    },
    accessibility: {
      reducedMotion: "Reduce decorative foliage drift and idle or summit character motion while preserving direct movement, physical jumps and explicit word feedback.",
      soundOff: "The target phoneme, upcoming words, ledge words and specific feedback remain printed without audio.",
      nonColourCue: "Words, a selected-ledge marker, physical position and explicit status feedback communicate decisions in addition to colour.",
      semanticFallback: "A labelled game region, native word-ledge and movement buttons, live status text and focused completion dialog expose the controls outside the rendered scene."
    },
    performance: {
      lowPowerFallback: "The Three scene caps pixel ratio at 1.5; a CSS and SVG fallback preserves play if WebGL or model loading fails.",
      inputSafety: "Real-time movement releases on pointer up, cancel, lost capture, blur and pause; word buttons launch one physical jump and cannot commit reading evidence by activation alone.",
      assetFailure: "The readable target, physical word choices, progress, controls and feedback remain independent of the decorative scene loading."
    },
    privacy: {
      dataWritten: ["Existing score", "Existing stars", "Completed-word count", "Existing resumable climb checkpoint and local physical-session sidecar"],
      network: ["Same-origin retained game artwork and audio", "Existing app progress sync only"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/wordClimbLevels.test.js", "tests/unit/wordClimbJourney.test.js", "tests/unit/wordClimbWorld.test.js", "tests/unit/wordClimbProduction.test.js", "tests/unit/premiumGameStandard.test.js"],
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
      complete: "The final tile automatically begins the crossing; show constructions built and continue or return through Arcade chrome."
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
      artDirection: "Authored Meadow, Dino Valley and Moonwood illustrated routes with tactile tiles and Blender-rendered workshops anchored to the construction banks.",
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
      childGoal: "Tap each sound on the beat; the last sound blends the word automatically.",
      integratedAction: "Each timed tap plays the next authored sound; completing the sequence models the whole word.",
      nonTargetDemands: "Following musical pulse, watching stage effects and navigating equivalent pad positions.",
      evidenceEvent: "Completed performances and rhythm scores record practice, not independent sound identification or mastery.",
      movementCreatesEvidence: false
    },
    loop: {
      onboard: "Show the tap-on-the-beat instruction over the paused stage.",
      perceive: "Watch the next authored sound note approach the hit line.",
      act: "Tap the labelled pad or press D, F, J or K as its sound reaches the line.",
      feedback: "Show Perfect, Great or Good timing and play the accepted sound.",
      retry: "Repeat a missed word with slower timing and a wider hit window.",
      complete: "Blend the completed word, celebrate the performance and continue or return through Arcade chrome."
    },
    prompt: {
      visible: "A picture, labelled arriving sound units and collected slots guide the performance. The spelling target stays hidden while answering; repeated mistakes permit a partial hint and the built phrase appears after completion.",
      spoken: "Approved production recordings model the target phoneme, whole word or current sentence word.",
      replay: "The 56-pixel replay control repeats the current approved cue without browser speech."
    },
    controls: {
      keyboard: ["D, F, J and K strike the four independently labelled pads"],
      touch: ["Tap the corresponding 56-pixel-or-larger pad as its note reaches the line"],
      minimumTargetCssPixels: 56,
      pointerReleaseEvents: ["pointerup", "pointercancel", "lostpointercapture"]
    },
    difficulty: {
      curriculumBeforePressure: true,
      ladder: "Words progress to syllables and sentence-word sequences across ten tracks, with forgiving rhythm windows."
    },
    gameFeel: {
      movement: "Notes travel toward the hit line while the band and stage respond to taps.",
      forgiveness: ["Early taps give a Wait cue", "Repeated misses widen the timing window", "Repeated misses retain the current note", "The last sound completes the word automatically"],
      camera: "A fixed performance-stage frame keeps the target, choices, ordered slots and performers visible.",
      successFeedback: "A timed tap lights the stage and plays the next sound; the final accepted sound plays the whole target.",
      errorFeedback: "A wrong pad names the selected and required units, replays the cue and leaves the complete choice set available."
    },
    world: {
      artDirection: "Three original concert venues and six registered Pal performers use real mallet or forefoot contact with distinct drum heads, tactile scenery and readable moving notes.",
      route: "The stage, sound strip and action zone remain in fixed readable screen regions rather than a spatial route.",
      character: "Bouncy and Woolly, Chompy and Sunny, and Pip and Wren perform in their own worlds. Sunny's real forefeet strike low drums; actual source sockets register every contact.",
      assetFallback: "Missing stage art leaves the complete canvas lighting, sound strip, action prompt and performance loop."
    },
    state: {
      pauseResume: "Pause freezes phrase and animation time; resume resets the frame clock without creating a missed sound.",
      checkpoint: "A bounded learner- and difficulty-scoped local session retains the section, accepted unit prefix, score, mercy timing, first responses, retries and delivered audio receipts. Reload resumes that held work; quota failure pauses with the exact save snapshot.",
      completion: "Versioned recorded-unit-rhythmic-segmentation evidence retains immutable responses and their matched recorded-audio receipts. Motor timing and supported sequence rehearsal are practice; no response claims independent spelling or mastery. Mutable session and audio history remain local."
    },
    accessibility: {
      reducedMotion: "Camera pulse, flashes and particles are reduced while phoneme state and action feedback remain clear.",
      soundOff: "Labelled pads, moving units and collected slots preserve rhythm play with sound off. The target spelling remains hidden; absent recordings are support, and rhythm performance is not independent literacy evidence.",
      nonColourCue: "Current and completed sounds use position, outline, labels and icons in addition to stage colour.",
      semanticFallback: "The named action target, focused onboarding and Arcade mission help expose the complete loop outside canvas art."
    },
    performance: {
      lowPowerFallback: "A single bounded Canvas2D surface, capped pixel ratio and reduced stage effects preserve tap response.",
      inputSafety: "A discrete tap or keyboard action strikes the note; a short input lock rejects jittery double taps. No held pointer action can remain stuck.",
      assetFailure: "The sound sequence and playable action remain available when decorative stage artwork fails."
    },
    privacy: {
      dataWritten: ["Score, stars and completed performance phrases", "Bounded local section, prefix, mercy, support and audio-receipt session", "Versioned first-response and assisted-retry practice evidence with actual recorded-audio receipts"],
      network: ["Same-origin retained art and recorded audio", "Existing scoped progress sync receives immutable completion evidence; mutable practiceSession remains local"],
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
      evidenceEvent: "Only a deliberately aimed word gate records an onset response. First responses, retries and actual target-recording receipts remain separate from automatic road following, missed gates, shields and obstacles.",
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
      movement: "Continuous steering follows a physical circuit, with gentle bend alignment, soft guardrails and slower readable word approaches.",
      forgiveness: ["Missed targets return", "Repeated misses gain a lane callout", "Obstacles do not lower literacy stars", "The target cue remains replayable"],
      camera: "A stable chase camera keeps the physical road, approaching labels and the current route visible.",
      successFeedback: "The caught word and its matching onset appear in a high-contrast banner with chime, speech and a bounded burst.",
      errorFeedback: "A wrong caught word is named with its actual onset while the target stays visible."
    },
    world: {
      artDirection: "Original three-dimensional villages and circuit venues use authored UV materials, varied foliage, joined stands and benches, tactile roads and distant original world horizons outside the physical track.",
      route: "Track mesh, road-side scenery, collision edges, word gates and kart use the same sampled physical circuit.",
      character: "Canonical Bouncy, Chompy and Pip drivers turn their complete karts with actual steering, braking, recovery and celebration clips; animated tyres and pedals share the real circuit geometry.",
      assetFallback: "Each world's complete kart has an independently downloaded, byte-identical compressed recovery asset. Failed scenery preserves the physical road, gates, labels and controls; graphics recovery stays separate from learning support."
    },
    state: {
      pauseResume: "Pause freezes route and animation time; resume resets the frame clock without advancing a gate.",
      checkpoint: "A bounded learner- and difficulty-scoped local session preserves the exact seeded gates, physical kart, score, accepted words, immutable responses and current support. Resume clears old aim intent and conservatively records replay support.",
      completion: "Versioned grapheme-phoneme-onset-recognition completions retain first responses, assisted retries and real target-audio receipts as practice. Automatic road following and motor assistance do not fabricate responses or mastery; mutable route state stays local."
    },
    accessibility: {
      reducedMotion: "Windmill rotors stop in reduced motion; optical flow, shake and bursts are reduced while steering, gate labels and feedback remain immediate.",
      soundOff: "The target grapheme, word labels, match count and specific feedback remain printed.",
      nonColourCue: "Target, shield, correct feedback and wrong feedback use words, symbols, position and shape as well as colour.",
      semanticFallback: "Named steer and replay buttons, focused onboarding and Arcade mission help expose the goal outside WebGL."
    },
    performance: {
      lowPowerFallback: "The shared Three.js quality tier caps pixel ratio and removes nonessential shadows and particle density first.",
      inputSafety: "Touch steering and keyboard share continuous steering input, every pointer path releases safely, and bounded simulation catch-up preserves pace across slower frames.",
      assetFailure: "The selected canonical kart uses its matching compressed recovery while the physical road, gates and labels remain available. Pending image and model owners cannot reattach after disposal."
    },
    privacy: {
      dataWritten: ["Score, stars and accepted onset words", "Bounded local seeded gates, kart, support and response session", "Versioned first-response and assisted-retry practice evidence with actual target-audio receipts"],
      network: ["Same-origin retained models, art and recorded audio", "Existing scoped progress sync receives immutable completion evidence; mutable practiceSession remains local"],
      newIdentifier: false,
      newExternalService: false
    },
    validation: {
      unit: ["tests/unit/soundRacerTracks.test.js", "tests/unit/premiumGameStandard.test.js", "tests/unit/arcadeBlenderAssets.test.js", "tests/unit/soundRacerProduction.test.js"],
      browser: ["tests/release/sound-racer-production.spec.js", "tests/release/sound-racer-circuit.spec.js", "tests/release/sound-racer-tutorial.spec.js", "tests/release/arcade-ipad-controls.spec.js", "tests/release/student-activity-viewport.spec.js"],
      physicalDevice: {
        status: "unknown",
        note: "A real supported iPad playtest is still required; browser emulation is not recorded as a hardware pass."
      }
    }
  }
});

export const ARCADE_VERTICAL_SLICE_BRIEFS = deepFreeze({...ORIGINAL_BRIEFS,...buildArcadeJourneyBriefs({...ORIGINAL_BRIEFS,...PHYSICAL_ARCADE_BRIEFS,"grammar-grind":AUTHORED_SKATE_BRIEF,"rhyme-pop":AUTHORED_RHYME_BRIEF}),...PHONICS_PRACTICE_BRIEFS});

export function verticalSliceBriefForGame(gameId) {
  return ARCADE_VERTICAL_SLICE_BRIEFS[String(gameId || "")] || null;
}
