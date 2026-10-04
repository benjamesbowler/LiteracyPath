export const AUTHORED_SKATE_BRIEF = {
  "schemaVersion": 1,
  "gameId": "grammar-grind",
  "version": "2.0",
  "audience": "Early readers practising the selected ordered-grapheme word bank with independent or supported picture-and-audio cues.",
  "experiencePromise": "Skate a physical park, choose the sounds in order and build each heard word while learning tricks.",
  "learning": {
    "targetConstruct": "picture-audio-ordered-grapheme-encoding",
    "childGoal": "Build the heard word by choosing and reaching its next grapheme.",
    "integratedAction": "A deliberate destination selection or manually steered physical contact selects one grapheme; the accepted prefix stays visible.",
    "nonTargetDemands": "Steering, pushing, braking, balancing, jumping and rail approach. Motor movement and graphics recovery are separate from literacy responses.",
    "evidenceEvent": "Versioned practice keeps immutable first responses, assisted retries and real whole-word Howler-end receipts. The full target stays hidden; unsupported or resumed cues cannot silently become independent evidence.",
    "movementCreatesEvidence": false
  },
  "loop": {
    "onboard": "Choose an outing and hear the first reviewed word; start skating while the picture and equal choices remain visible.",
    "perceive": "Read the accepted prefix and three stable next-grapheme choices, with a picture and replayable recorded word.",
    "act": "Select a destination deliberately or skate manually into the chosen grapheme; use actual park banks, bowl and rails for movement.",
    "feedback": "The chosen grapheme responds immediately and the accepted part joins the word. The completed constructed word may be shown and read back.",
    "retry": "Retain the same three-choice bank and accepted prefix. Teach the chosen contrast, then expose only a partial spelling hint after two wrong linguistic responses.",
    "complete": "Complete ten settled words, save the practice result and outing, then choose Next, Replay or Back to Arcade."
  },
  "prompt": {
    "visible": "A picture, accepted prefix, empty remaining slots and equal grapheme choices. The complete target is hidden while answering.",
    "spoken": "The retained recorded whole word owns the target cue; its actual end produces the delivery receipt.",
    "replay": "Hear repeats the current word. Missing or muted speech remains explicit supported practice and does not block skating."
  },
  "controls": {
    "keyboard": [
      "Arrows or WASD steer, push and brake.",
      "Space or Enter jumps, performs an airborne trick or approaches a rail grind.",
      "Tab and Enter reach equal grapheme destinations and Hear."
    ],
    "touch": [
      "Hold the labelled 56px movement controls; release, cancel or lost capture ends the hold.",
      "Tap Jump / Trick or a visible grapheme destination for motor assistance."
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
    "ladder": "Retained CVC, blend/digraph and more complex ordered-grapheme banks precede motor pressure. Meadow, Dino and Moonwood provide separate canonical skaters and park materials."
  },
  "gameFeel": {
    "movement": "A bounded 1/60-second simulation preserves momentum, turning and board contact across display rates. Banks, bowl surfaces and rails share actual collision geometry.",
    "forgiveness": [
      "A motor fall or missed approach does not create a spelling response.",
      "Deliberate destination selection helps navigation without replacing the word choice.",
      "The original accepted prefix and frozen choices survive retries and local resume."
    ],
    "camera": "Keep the whole skater, board contact, current route and choice cue clear in wide, portrait and short landscape layouts.",
    "successFeedback": "The accepted part joins the constructed word; actual balance and celebration clips follow gameplay state.",
    "errorFeedback": "Teach the chosen sound contrast; repeated wrong choices unlock a partial hint without printing the answer."
  },
  "world": {
    "artDirection": "Original modelled skate parks use authored concrete, timber, coping, trees and world horizons around clear playable banks, bowls and rails.",
    "route": "Physical park surfaces and choice destinations come from the same scene definition used by the board controller.",
    "character": "Canonical Bouncy, Chompy and Pip ride complete authored boards with actual push, balance, turn, jump, grind, recovery and celebration clips.",
    "assetFallback": "Selected primary models and matching exact-byte compressed recovery are separate owners. A complete same-rule Canvas route with measured source-derived action art owns the final failure path."
  },
  "state": {
    "pauseResume": "Pause, Tools, blur and hidden tabs release held input and freeze physical and decorative clocks. Resume resets frame accumulation.",
    "checkpoint": "A bounded learner-scoped local session preserves active word index including zero, original denominator, seeded bank, earned parts, three-choice order and positions, selected intent and board state. Restore validates the actual bank, evidence, receipts and physical bounds; resumed cues retain support.",
    "completion": "grammar-grind-v2 completion preserves the declared picture-audio-ordered-grapheme-encoding construct, seed, outing, first responses, retries and actual word-audio receipt as practice; no formal assessment, mastery or motor-generated evidence."
  },
  "accessibility": {
    "reducedMotion": "Reduce decoration, camera effects and bursts while preserving direct skating controls and readable choices.",
    "soundOff": "Keep the picture and prefix, equal grapheme choices, specific feedback and visible Hear state. Missing delivered audio is recorded honestly as support.",
    "nonColourCue": "Choice graphemes, accepted prefix, shapes, named controls and feedback explain the task without colour-only signals.",
    "semanticFallback": "Named movement, Jump / Trick, Hear and equal destination controls remain reachable outside the rendered scene."
  },
  "performance": {
    "lowPowerFallback": "Reduce decorative density, shadows and pixel ratio first; retain actual park surfaces, word rules and controls.",
    "inputSafety": "Bounded fixed steps, keyboard release and pointer up/cancel/lost capture prevent stale held movement or catch-up on resume.",
    "assetFailure": "Model, image and source-derived atlas owners use bounded lazy ownership and disposal; graphics recovery cannot create or rewrite literacy support."
  },
  "privacy": {
    "dataWritten": [
      "Existing score, stars, completed word count and versioned immutable practice evidence.",
      "Bounded local board, seeded bank, accepted prefix, frozen choices and response/support session."
    ],
    "network": [
      "Same-origin retained art/models/audio.",
      "Existing scoped completion sync; mutable practiceSession stays on the device."
    ],
    "newIdentifier": false,
    "newExternalService": false
  },
  "validation": {
    "unit": [
      "tests/unit/spellSkateWorld.test.js",
      "tests/unit/premiumGameStandard.test.js"
    ],
    "browser": [
      "tests/release/spell-skate-world.spec.js",
      "tests/release/arcade-ipad-controls.spec.js",
      "tests/release/student-activity-viewport.spec.js"
    ],
    "physicalDevice": {
      "status": "unknown",
      "note": "Browser capture does not certify physical iPad play, human listening or authenticated hosted saves."
    }
  }
};
