export const AUTHORED_RHYME_BRIEF = {
  schemaVersion: 1, gameId: 'rhyme-pop', version: '2.0',
  audience: 'Early readers recognising a spoken ending sound through visible reading choices.',
  experiencePromise: 'Aim an original Pal launcher and pop six rhymes in an authored festival.',
  learning: {
    targetConstruct: 'Cued-word rhyme recognition during supported reading practice.',
    childGoal: 'Hear the clue and pop every word that rhymes with it.',
    integratedAction: 'A deliberate aimed projectile must physically hit the intended word balloon.',
    nonTargetDemands: 'Aim, moving balloons, intervening balloons and wall banks.',
    evidenceEvent: 'An intended first collision retains an immutable first answer or assisted retry with the active recorded-target end receipt. Motor misses and interceptions create no literacy answer; practice never claims mastery.',
    movementCreatesEvidence: false
  },
  loop: {
    onboard: 'Hear the picture clue, aim with pointer or the visible keyboard focus ring, then Fire.',
    perceive: 'A text-free picture and recorded word cue accompany printed reading choices.',
    act: 'Aim and fire through genuine wind, flight and first-collision paths.',
    feedback: 'The popped word is named; accepted rhymes refill the same family and score.',
    retry: 'Wrong choices and identities stay fixed. Two deliberate errors add an oral ending-sound hint.',
    complete: 'Six accepted rhymes celebrate and advance automatically; all families finish the outing and expose Next, Replay or Back.'
  },
  prompt: {
    visible: 'The target spelling is never printed before the family is complete; picture, Hear and printed balloon choices remain visible.',
    spoken: 'Real existing Leda whole-word files supply the target and popped-word names through an owned bounded queue.',
    replay: 'Hear cancels superseded cues and repeats the current target; actual end delivery and replay support remain distinct.'
  },
  controls: {
    keyboard: ['Left/Right or A/D cycles the non-answer-revealing aim ring.', 'Space, Enter or Up fires from the measured launcher mouth.'],
    touch: ['Aim at a balloon or tap its complete native target; Fire launches the physical projectile.'],
    minimumTargetCssPixels: 56, pointerReleaseEvents: ['pointerup', 'pointercancel', 'lostpointercapture']
  },
  difficulty: { curriculumBeforePressure: true, ladder: '24 Easy or 30 Medium/Hard families, six accepted rhymes each, three wind acts and closer vocabulary contrasts.' },
  gameFeel: {
    movement: 'Measured pressure contact releases a swept projectile; banks and interception retain their real motor effects.',
    forgiveness: ['Motor misses preserve the learning task.', 'Wrong words keep the exact choice bank.', 'Portrait circulation keeps every initial identity reachable.'],
    camera: 'A fixed complete stadium leaves the full original performer, cue and split thumb controls visible.',
    successFeedback: 'The original performer celebrates each completed family with the actual six accepted words.',
    errorFeedback: 'A named spoken contrast and explicit retry preserve the target and immutable first answer.'
  },
  world: {
    artDirection: 'Registered original alpha action poses, independent launcher kits and authored festival venues; live instructional text stays outside painted art.',
    route: 'Three wind acts vary flight paths through the actual family ladder.',
    character: 'Meadow Bouncy, Dino Chompy and Moonwood Pip have sixteen original contact, recovery and finale poses each.',
    assetFallback: 'Independently decoded original idle performer, launcher and venue fallbacks preserve the exact task; Reload art stays clear of all balloon word faces.'
  },
  state: {
    pauseResume: 'Pause, Tools, hidden pages and exit stop owned cues, pressure, projectiles and completion clocks; paused resize only repaints the frozen scene.',
    checkpoint: 'Validate seed, journey, origin family, accepted prefix, immutable answers, support and exact balloon identities in local practiceSession.',
    completion: 'Submit the validated versioned practice result once; quota retry preserves the exact queued history and local mutable state is excluded from cloud sync.'
  },
  accessibility: {
    reducedMotion: 'Reduce decorative effects while retaining the physical flight and complete aim/fire loop.',
    soundOff: 'Printed reading choices and the picture remain available; unavailable recorded-target delivery is supported practice.',
    nonColourCue: 'Readable words, an aim ring, named buttons and explicit feedback carry the task.',
    semanticFallback: 'Native named balloon targets, Hear, Fire and shared Tools remain accessible beside the Canvas scene.'
  },
  performance: {
    lowPowerFallback: 'One bounded Canvas loads only the selected world and independent original-art fallbacks.',
    inputSafety: 'Native pointer, keyboard and assistive inputs share the same physical projectile; no QA answer or stage-advance controller is published.',
    assetFailure: 'Independent image owners detach callbacks and release decoded resources; late arrivals cannot revive a disposed world.'
  },
  privacy: { dataWritten: ['Existing scoped practice result and immutable supported answers; mutable world state stays local.'], network: ['Same-origin original art and recordings; existing scoped progress sync.'], newIdentifier: false, newExternalService: false },
  validation: {
    unit: ['tests/unit/rhymePopArt.test.js', 'tests/unit/rhymePopMotion.test.js', 'tests/unit/rhymePopSession.test.js', 'tests/unit/rhymePopCueQueue.test.js', 'tests/unit/authoredArcadeProgress.test.js'],
    browser: ['tests/release/rhyme-pop-complete-outings.spec.js', 'tests/release/rhyme-pop-input-lifecycle.spec.js', 'tests/release/student-activity-viewport.spec.js'],
    physicalDevice: { status: 'unknown', note: 'Browser native-input and ordinary-clock evidence is separate from human listening, physical iPad and classroom observation.' }
  }
};
