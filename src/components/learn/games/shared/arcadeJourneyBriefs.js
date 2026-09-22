import { ARCADE_JOURNEYS } from '../../../../utils/arcadeJourneys.js';
import { ARCADE_PREMIUM_PROFILES } from './arcadePremiumProfiles.js';

const routes = {
  'rocket-run':'Ten sectors mix onset targets, planets, meteor gaps and a final comet approach.',
  'letter-leap':'Six jump-room families rotate through each spelling trail with optional upper coin routes.',
  'word-climb':'Twelve saved ascents vary trunk bends, wind, branches and rest ledges; the vocabulary remains at the chosen level.',
  'sound-racer':'Twelve saved three-lap circuits change scenery and reviewed gate layouts; road geometry, gates and steering share one route.',
  'word-bridge':'Ten crossings vary tile banks, distractors and word or sentence reconstruction while preserving part order.',
  'sound-beat':'Ten sets vary words, lane phrases and recorded phoneme sequences; retries widen the timing window.',
  'rhyme-pop':'Twenty-four parades vary target rimes, balloon positions and replacement flight paths.',
  'sound-safari':'Ten habitat stages vary word order, critter positions and drift/orbit/zigzag routes within the chosen level.',
  'reel-read':'Ten fishing grounds vary reviewed clues and fish schools; ordered word parts stay ordered.',
  'star-gallery':'Ten groves contain forty repairs; forest trails, answer clearings and approach routes vary across outings.',
  'sentence-express':'Ten stations each dispatch three different sentences with curriculum-appropriate repair tasks.',
  'grammar-grind':'Three reviewed ten-word banks per difficulty combine with six park approach routes; ramps and islands share the physical skating world.',
  soundkeys:'Twenty-four unique words form three eight-word sets; fresh ordering, two instrument voices and free play support continued music making.'
};
const privacy = {
  dataWritten:['Existing score, stars, completed-word count and practice evidence','A bounded set of completed trail numbers (0–11) per existing game/difficulty record','Current trail number in the existing checkpoint, alongside its content seed'],
  network:['Same-origin retained artwork and existing scoped progress sync'],newIdentifier:false,newExternalService:false
};
const state = {
  pauseResume:'The existing pause, hidden-tab and input-release paths freeze gameplay; decorative clocks follow the host pause and reduced-motion state.',
  checkpoint:'Keep the selected difficulty, trail number, stage and content seed. Continue restores the unfinished outing; Start over creates new content within that same trail.',
  completion:'Commit the literacy result and completed trail number atomically. Replay does not add another trail; Next moves to an unfinished trail at the same difficulty. The child can leave at every completion.'
};
export function buildArcadeJourneyBriefs(existing) {
  return Object.fromEntries(Object.keys(ARCADE_JOURNEYS).map(id=>{
    const p=ARCADE_PREMIUM_PROFILES[id];
    const base=existing[id] || {
      schemaVersion:1,gameId:id,version:p.version,audience:'Early readers practising the selected curriculum band with touch or keyboard.',
      experiencePromise:p.mission,
      learning:{targetConstruct:p.objective,childGoal:p.mission,integratedAction:p.action,nonTargetDemands:'Steering, timing, aiming or arranging the objects using the existing game controls.',evidenceEvent:'Only settled literacy answers feed the existing practice result; motor movement and decoration do not create evidence.',movementCreatesEvidence:false},
      loop:{onboard:p.mission,perceive:'Read or replay the current target while every choice stays visible.',act:p.action,feedback:'The chosen object responds immediately with the existing specific learning feedback.',retry:p.retry,complete:p.completionTitle+'; keep the result and choose the next outing, replay or return.'},
      prompt:{visible:p.mission,spoken:'Existing recorded word, sound and instruction cues remain behind the sound preference.',replay:'The existing Hear or guide control repeats the current learning cue.'},
      controls:{keyboard:p.controls,touch:['Use the existing labelled touch controls or directly select the visible game object.'],minimumTargetCssPixels:56,pointerReleaseEvents:['pointerup','pointercancel','lostpointercapture']},
      difficulty:{curriculumBeforePressure:true,ladder:routes[id]},
      gameFeel:{movement:'Preserve the existing immediate, bounded movement and target response.',forgiveness:[p.retry,'Pausing and losing pointer capture release held movement.','Movement does not lower literacy accuracy.'],camera:'Keep the existing readable playfield and visible target; scenery remains behind choices.',successFeedback:p.completionTitle,errorFeedback:p.retry},
      world:{artDirection:'Retained Blender models and transparent renders give this game grounded planting, props and depth alongside its established Pal artwork.',route:routes[id],character:'Retain the current canonical game hero and its existing animation.',assetFallback:'A decorative asset failure preserves the complete existing learning scene and controls.'},
      accessibility:{reducedMotion:'Freeze decorative sway and prop animation; preserve direct control and feedback.',soundOff:'Keep the printed target, choices and specific feedback; do not claim independent listening evidence.',nonColourCue:'Words, shapes and named controls communicate the goal as well as colour.',semanticFallback:'Existing labelled controls and mission help remain available outside rendered scenery.'},
      performance:{lowPowerFallback:'Canvas scenery uses compact local WebP views; Three scenes reduce decoration and shadows before controls.',inputSafety:'Retain pointer up, cancel, lost capture, keyboard release and blur cleanup.',assetFailure:'Scoped image/model owners detach callbacks and dispose late arrivals; decoration never blocks play.'},
      validation:{unit:['tests/unit/arcadeJourneys.test.js','tests/unit/gameReplay.test.js','tests/unit/arcadeBlenderAssets.test.js'],browser:['tests/release/student-activity-viewport.spec.js'],physicalDevice:{status:'unknown',note:'Desktop/tablet browser evidence is separate from physical iPad observation.'}}
    };
    return [id,{...base,state,privacy,world:{...base.world,route:routes[id]}}];
  }));
}
