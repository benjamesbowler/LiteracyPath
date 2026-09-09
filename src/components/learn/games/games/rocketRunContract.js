import { GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION, validateGameVerticalSliceBrief } from '../shared/premiumGameStandard.js';

function freeze(value) {
  if (!value || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

// G13's exported integration brief. The coordinator owns shared registration
// and browser/release evidence; structural validation is not a visual approval.
export const ROCKET_RUN_VERTICAL_SLICE_BRIEF = freeze({
  schemaVersion: GAME_VERTICAL_SLICE_BRIEF_SCHEMA_VERSION,
  gameId: 'rocket-run',
  version: '3.0',
  audience: 'Early readers practising taught initial sounds with printed word support.',
  experiencePromise: 'Pilot a gold cargo rocket through word gates, power delivery bays, and reach a receiving station through three authored sectors.',
  learning: {
    targetConstruct: 'Printed-word initial-sound discrimination with recorded and printed support.',
    childGoal: 'Find the word that starts with the target sound and fly through its gate to deliver supplies.',
    integratedAction: 'Steering or selecting nominates a word gate; deliberate Fly through commitment powers that gate when the word matches the target sound.',
    nonTargetDemands: 'Lane steering, bank/settle animation, vehicle flight and scenery are motor or presentation demands.',
    evidenceEvent: 'commitFlight records one immutable first response per learning slot, separate assisted retries, cue delivery and support. All events remain practiceOnly and independent:false.',
    movementCreatesEvidence: false
  },
  loop: {
    onboard: 'One visible instruction and its exact Leda recording precede Launch rocket. Hear instructions replays it on the card; sound failure offers explicit Read and launch support.',
    perceive: 'Read the target and three equally styled word gates during approach; recorded target and all three words complete before a sound-enabled commitment.',
    act: 'Nominate a lane with steering or a released word button, then release Fly through or use Enter/Space.',
    feedback: 'Recorded word/onset feedback names the match or contrasts the wrong onset with the retained target. The gate opens or the rocket returns immediately, and the next choice waits for spoken feedback delivery; text remains available after a playback failure.',
    retry: 'After the 1.15-second return, the same intended word receives a fresh three-choice set and a new cue. First-response evidence is retained and the retry discloses feedback support.',
    complete: 'Each completed round powers a delivery bay. The last correct action fixes and saves the receipt before the docking animation and one result dialog.'
  },
  prompt: {
    visible: 'Choose the word that starts with the sound. Tap its gate, then tap Fly through. During play: Find the [target] word.',
    spoken: 'Choose the word that starts with the sound. Tap its gate, then tap Fly through. Then the reviewed target phoneme followed by all three exact word recordings.',
    replay: 'Hear replays the current target and options. rocketRunWordAudioPath resolves word audio first, then exact-word instruction audio; missing or interrupted delivery exposes Hear again and explicit Read the words support.'
  },
  controls: {
    keyboard: ['Arrow Left/Right or A/D steers', 'Enter/Space commits the nominated gate', 'Native word and action buttons support keyboard activation'],
    touch: ['Released word-button taps nominate', 'Visible held left/right controls steer', 'Released Fly through commits'],
    minimumTargetCssPixels: 56,
    pointerReleaseEvents: ['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'pause', 'unmount']
  },
  difficulty: {
    curriculumBeforePressure: true,
    ladder: 'The existing ten-target curriculum ladder is preserved for easy, medium and hard. Recorded 2–4, 3–5 and 4–6 letter words increase literacy demand; there is no decision deadline or motor penalty. Distinct recorded word coverage is checked before constructing a plan.'
  },
  gameFeel: {
    movement: 'A 1/60-second rules step separates approach, held decision, commit, return, checkpoint and completion. The renderer banks and settles toward shared lane anchors and reaches the chosen gate before replacement.',
    forgiveness: ['No decision deadline', 'Wrong choices retain completed deliveries', 'No score or star penalty from steering, frame timing or missed optional objects', 'Paused controls and cancelled holds cannot commit', 'Audio failure waits for recovery or explicit printed support'],
    camera: 'A stable perspective camera unprojects one screen layout for labels, gates and rocket flight. Short landscape places the hero in a side launch bay clear of the HUD.',
    successFeedback: 'The selected gate opens, the word/onset match is stated, the rocket passes through and each completed target lights a cargo bay.',
    errorFeedback: 'The selected word and its actual onset are contrasted with the retained target. Fresh alternatives follow the return animation without loss of earned progress.'
  },
  world: {
    artDirection: 'Cyan steel cargo hangar, staggered amber canyon cliffs and violet receiving station, with existing KayKit CC0 landmarks, contact shadow and restrained exhaust.',
    route: 'flightLayout owns equal readable gate centres and ship launch anchors. Native labels, rendered apertures, route rails and committed flight use this one spatial definition.',
    character: 'Retain the authored gold/coral lathed rocket, canopy, fins, twin boosters and exhaust; fit its actual projected geometry above the floor and clear of the prompt, labels and feedback.',
    assetFallback: 'Decorative load failures preserve the authored sector geometry and all word decisions; unavailable WebGL uses the parent engine’s native controls and flat rocket scene.'
  },
  state: {
    pauseResume: 'Pause and hidden/context-lost states freeze rules and animation. Parent audio/input lifecycle cancels pending holds and cues and resets the accumulator on resume; restoreContext rebuilds scene render resources.',
    checkpoint: 'Each round boundary uses the existing resumable round checkpoint. Starting at a later round does not invent first responses or deliveries for skipped rounds.',
    completion: 'The final deliberate correct response freezes score, words, stars, first responses, retries and delivery/support evidence. Parent onResultReady persists it immediately; subsequent rendering and exit do not replace it.'
  },
  accessibility: {
    reducedMotion: 'The shared low tier removes costly effects; bank/pitch intensity is suppressed while the essential gate action stays visible.',
    soundOff: 'Printed sound and word support stays available and disclosed as supported practice. Unavailable playback is never marked heard or independently mastered.',
    nonColourCue: 'All three options have equal style; nomination uses a persistent border and pressed state, and feedback names the word and sound.',
    semanticFallback: 'Native named word buttons, steering, Fly through, Hear and recovery actions remain available outside the WebGL scene with the same evidence rules.'
  },
  performance: {
    lowPowerFallback: 'Shared quality tiers cap pixel ratio and remove post-processing before reducing readability. Authored sector geometry and all three labels remain present.',
    inputSafety: 'Invalid steering/timing cannot poison rules; pause prevents scoring or movement, and the parent releases holds on cancel, capture loss, blur, pause and unmount.',
    assetFailure: 'Model failures are exposed in scene diagnostics while flight remains playable. Rails update existing typed buffers; disposal is idempotent, late owned model clones are released, and library-owned textures are retained.'
  },
  privacy: {
    dataWritten: ['Existing game score, stars and word count', 'Existing round checkpoint', 'Existing completion-evidence envelope with practice responses, retries, support and delivery events'],
    network: ['Existing local app audio/model files', 'Existing app progress sync'],
    newIdentifier: false,
    newExternalService: false
  },
  validation: {
    unit: ['tests/unit/rocketRunFlight.test.js', 'tests/unit/rocketRunScene.test.js', 'tests/unit/rocketRunRounds.test.js', 'tests/unit/rocketRunAudio.test.js'],
    browser: ['tests/release/rocket-run-flight.spec.js', 'tests/release/rocket-run-audio-replay.spec.js'],
    physicalDevice: { status: 'unknown', note: 'No physical iPad test, human listening or child observation is claimed by these module checks. Browser and rendered release verification belong to the parent.' }
  }
});

const issues = validateGameVerticalSliceBrief(ROCKET_RUN_VERTICAL_SLICE_BRIEF);
if (issues.length) throw new Error(`Rocket Run vertical-slice brief: ${issues.join('; ')}`);
