import { ARCADE_PREMIUM_PROFILES } from './arcadePremiumProfiles.js';

const mechanics = {
  'tower-tumble': {
    promise: 'Climb and reshape three rescue towers in the selected Pal world with a mallet, ladders, barrels, pulleys and safe landings.',
    construct: 'Picture- and recorded-audio-cued ordered grapheme encoding.',
    motor: 'Running, climbing, jumping, hammer reach and avoiding rolling padded barrels.',
    movement: 'Continuous physical traversal and range-checked hammer strikes change the tower route; unlabelled breakable shortcuts remain available between learning actions.',
    camera: 'Side-on 2.5D framing keeps the current ledges, ladders, bricks and selected Pal readable within one physical coordinate system.',
    route: 'Nine fresh word encounters occupy three towers per outing. Ladders join physical ledges; learned parts power a rescue lift.',
    art: 'Original textured scaffolds, mill masonry, moving cargo and pulleys; meadow workshops with Bouncy, fern/fossil/volcanic towers with Chompy, and mushroom/lantern/star towers with Pip.',
    unit: 'tests/unit/towerTumbleRules.test.js', browser: 'tests/release/tower-tumble-gameplay.spec.js'
  },
  'rally-pals': {
    promise: 'Play tennis with directional serves, continuous returns, lobs and a moving rival in three themed settings, with Match, Co-op and Targets modes.',
    construct: 'Initial or final phoneme/grapheme discrimination and spoken-rime reading from linguistic shot intent.',
    motor: 'Court footwork, racket contact, shot direction and ordinary rally timing.',
    movement: 'Independent movement and aim drive a real ball arc, racket contact and opponent returns. Ordinary rallies continue between fresh untimed learning serves.',
    camera: 'Behind-player view retains the full playable court, net, ball and three equally styled far-court zones.',
    route: 'Six learning serves each start a short ordinary rally. Each world has three selectable courts and Match/Co-op/Targets; target practice preserves the suspended learning cue and creates only sporting evidence.',
    art: 'Original meadow clubs with Bouncy, fossil/fern/clifftop courts with Chompy, and observatory/lantern/starlight courts with Pip; physical net, racket, ball and authored club props.',
    unit: 'tests/unit/rallyPalsRules.test.js', browser: 'tests/release/rally-pals-gameplay.spec.js'
  },
  'burrow-builders': {
    promise: 'Create and revisit an editable island in the selected Pal world, with useful bridges, houses, gardens, channels, dams and freely available ordinary building pieces.',
    construct: 'Easy and Medium use ordered word encoding from blueprint picture/audio; Hard uses literal spatial reading instructions.',
    motor: 'Walking, camera orientation, cell selection, rotating, placing, picking up and reshaping world blocks.',
    movement: 'Continuous island exploration and snapped world placement modify actual bounded terrain. A completed blueprint supplies a functional structure kit; Free Build is available immediately and preserves the unfinished blueprint.',
    camera: 'Comfortable three-quarter construction framing with fixed selectable angles and a semantic overhead cell view.',
    route: 'Three selectable bounded islands retain editable constructions. Bridges affect traversal, channels and dams change water flow, gardens grow, and roofs shelter beds from rain. Creative edits retain undo.',
    art: 'Original stepped voxel islands and construction sites; meadow homes with Bouncy, fern/fossil/thatch settlements with Chompy, and pine/mushroom/lantern villages with Pip.',
    unit: 'tests/unit/burrowBuildersRules.test.js', browser: 'tests/release/burrow-builders.spec.js'
  }
};

export const PHYSICAL_ARCADE_BRIEFS = Object.freeze(Object.fromEntries(Object.entries(mechanics).map(([id, game]) => {
  const profile = ARCADE_PREMIUM_PROFILES[id];
  return [id, {
    schemaVersion: 1, gameId: id, version: '1.0', audience: 'Early readers using independent touch or keyboard play at their selected literacy band.',
    experiencePromise: game.promise,
    learning: { targetConstruct: game.construct, childGoal: profile.mission, integratedAction: profile.action,
      nonTargetDemands: game.motor, evidenceEvent: 'Immutable linguistic first responses, delivered stimulus and actual support are captured at the response; motor events never become learning responses.', movementCreatesEvidence: false },
    loop: { onboard: profile.mission, perceive: id === 'burrow-builders' ? 'Easy and Medium use an unlabelled picture and production recording. Hard asks the child to read a literal spatial plan. Choices stay equally styled and fixed through retry.' : 'An unlabelled picture and replayable production recording present the spelling cue. Choices stay equally styled and fixed through retry.',
      act: profile.action, feedback: 'The actual chosen object responds immediately; a successful learning action changes a useful physical world object.',
      retry: profile.retry, complete: 'The final settled literacy action completes automatically. The shared receipt saves learning evidence and the outing before a fresh session.' },
    prompt: { visible: id === 'burrow-builders' ? 'Easy/Medium show an unlabelled picture, empty or child-completed sound slots and separate replay. The spelling target is never printed before response. Hard prints a literal spatial plan as its reading stimulus.' : 'Unlabelled picture, empty or child-completed sound slots and separate replay. The spelling target is never printed before response.',
      spoken: id === 'burrow-builders' ? 'Easy/Medium use existing production recordings and capture actual delivery. Hard is a reading task and makes no auditory-comprehension claim.' : 'Existing same-origin production word and instruction recordings; actual delivery is captured at answer time.', replay: 'Hear repeats an available auditory cue without choosing an answer or disabling game input.' },
    controls: { keyboard: [...profile.controls], touch: ['Use labelled movement and action controls; direct broad world targets share the same physical action.', 'Optional motor assistance changes reach or contact without selecting a linguistic choice.'],
      minimumTargetCssPixels: 56, pointerReleaseEvents: ['pointerup', 'pointercancel', 'lostpointercapture'] },
    difficulty: { curriculumBeforePressure: true, ladder: 'Easy is Meadow Pals/Bouncy, Medium is Dino Pals/Chompy, and Hard is Moonwood/Pip, using the product world authority. The literacy band changes word structure or sound contrasts; movement pressure and assistance are separate. New learning choices are untimed.' },
    gameFeel: { movement: game.movement, forgiveness: ['Motor misses retain accepted learning pieces and do not count as wrong answers.', 'Two wrong literacy attempts permit a partial spelling hint.', 'Choice order remains fixed during repair and resume.'], camera: game.camera,
      successFeedback: 'Brief clear feedback accompanies the useful world change; there is no duplicate answer confirmation.', errorFeedback: 'Name the selected grapheme or object, teach the relevant contrast, retain the cue and permit repair without losing a life.' },
    world: { artDirection: game.art, route: game.route, character: 'Canonical Bouncy (golden curly lamb, red scarf and spring legs), Chompy (orange dinosaur with cream bandana), or Pip (brown-haired elf in green tunic and boots) follows difficulty. Authored directional/action art remains attached to the live physical actor and tools; each theme has its own scenery and props.',
      assetFallback: 'Missing decoration retains controls and choices. Failed stimulus delivery is explicit supported practice without exposing the complete spelling target. WebGL failure retains a usable semantic physical-action alternative.' },
    accessibility: { reducedMotion: 'Remove decorative shake, idle sway and rapid camera effects; preserve direct movement, placement and feedback.',
      soundOff: 'Keep the picture and mark unavailable auditory evidence truthfully. Any visual-model mode is labelled supported matching, not independent encoding or listening.',
      nonColourCue: 'Readable graphemes, object shape, location and named actions communicate meaning; color never singles out the answer.',
      semanticFallback: 'Named reachable bricks, court zones and construction cells share the same response rules; motor assistance never supplies the correct choice.' },
    performance: { lowPowerFallback: 'Capped renderer pixel ratio and bounded textured geometry; retain authored characters and scenery while reducing decorative density and shadows before controls or learning legibility.',
      inputSafety: 'Pointer cancellation, key release, blur, shared pause and hidden tabs release held controls and freeze owned clocks.', assetFailure: 'Renderer/geometry/texture, observer, cue and input owners clean up on unmount; context loss cannot award or duplicate a result.' },
    validation: { unit: [game.unit, 'tests/unit/physicalArcadeIntegration.test.js'], browser: [game.browser, 'tests/release/phonics-free-choice.spec.js'],
      physicalDevice: { status: 'unknown', note: 'Browser/emulated tablet checks do not establish physical iPad behavior.' } }
  }];
})));
