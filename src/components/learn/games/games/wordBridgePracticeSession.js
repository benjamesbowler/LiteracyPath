import { WORD_BRIDGE_CONTENT_VERSION, WORD_BRIDGE_LEGACY_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { validWordBridgeContentVersion } from '../../../../utils/gameCheckpoints.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { validWordBridgeEvidence } from './wordBridgeLearning.js';

const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const finite=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const phases=['PLAYING','PALS_CROSSING','LEVEL_COMPLETE','FINISHED'];

// Save actual carried/loose physical pieces separately from literacy responses.
// On restore the live layout supplies size/geometry; this record cannot invent
// a filled slot, accepted placement or a second copy of a repeated glyph.
export function validateWordBridgePracticeSession(value,difficulty,seed,journeyIndex,rounds,contentVersion=WORD_BRIDGE_CONTENT_VERSION) {
  if(!validWordBridgeContentVersion(contentVersion)||!value||value.version!==contentVersion||value.difficulty!==difficulty||value.seed!==seed||value.journeyIndex!==journeyIndex
    ||!rounds.every(round=>round.roundId.startsWith(`${contentVersion}:${difficulty}:${seed}:${journeyIndex}:`))
    ||!integer(seed,0,contentVersion===WORD_BRIDGE_LEGACY_CONTENT_VERSION?Number.MAX_SAFE_INTEGER:0xffffffff)||!integer(journeyIndex,0,11)
    ||!integer(value.originStage,0,9)||!integer(value.stage, value.originStage,9)||!phases.includes(value.phase)
    ||!integer(value.score,0,1e7)||!integer(value.wordsDone,value.originStage,10)||!integer(value.levelMistakes,0,100000)
    ||!finite(value.phaseTimer,-1,30)||!finite(value.sceneTime,0,1e8)||!finite(value.patienceLeft,0,10000)
    ||!Array.isArray(value.stageStars)||value.stageStars.length>10||value.stageStars.some(stars=>stars!==null&&!integer(stars,0,3))
    ||!validWordBridgeEvidence(value.evidence,rounds)||!value.supportReasons||Array.isArray(value.supportReasons)
    ||Object.entries(value.supportReasons).some(([id,reasons])=>!rounds.some(r=>r.roundId===id)||!Array.isArray(reasons)||reasons.length>24||reasons.some(reason=>typeof reason!=='string'||!reason||reason.length>80)))return null;
  const round=rounds[value.stage],w=value.world,accepted=value.evidence.acceptedResponses.filter(row=>row.roundId===round.roundId);
  if(!w||!finite(w.width,1000,20000)||!finite(w.ground,100,4000)||!finite(w.camera,0,w.width)
    ||!w.builder||!finite(w.builder.x,0,w.width)||![-1,1].includes(w.builder.facing)||!finite(w.builder.anim,0,1e8)
    ||!Array.isArray(w.tiles)||w.tiles.length!==round.tiles.length||new Set(w.tiles.map(t=>t.physicalId)).size!==round.tiles.length
    ||!Array.isArray(w.slots)||w.slots.length!==round.units.length||!Array.isArray(w.pals)||w.pals.length!==round.pals||w.pals.length>20)return null;
  const carried=w.builder.carryingId;
  if(carried!==null&&(!integer(carried,0,round.tiles.length-1)||accepted.some(row=>row.tileId===carried)))return null;
  for(const tile of w.tiles){
    const source=round.tiles.find(t=>t.id===tile.physicalId),placed=accepted.some(row=>row.tileId===tile.physicalId);
    if(!source||tile.glyph!==source.glyph||typeof tile.placed!=='boolean'||typeof tile.lost!=='boolean'
      ||tile.placed!==(placed||carried===tile.physicalId)||tile.lost&&tile.placed
      ||!finite(tile.x,0,w.width)||!finite(tile.y-w.ground,-500,500)||!finite(tile.returnT,0,5)
      ||(tile.localReturn!==undefined&&typeof tile.localReturn!=='boolean'))return null;
  }
  for(let slot=0;slot<w.slots.length;slot++){
    const item=w.slots[slot],response=accepted.find(row=>row.slot===slot);
    if(typeof item.filled!=='boolean'||item.filled!==Boolean(response)||item.placedGlyph!==(response?.selected||'')||!finite(item.snap,0,5))return null;
  }
  if(w.pals.some(p=>!['waiting','walking','crossed'].includes(p.state)||!finite(p.x,0,w.width+500)||!finite(p.t,0,1e8)||!finite(p.speed,0,20000)))return null;
  const finished=value.stageStars.map((stars,index)=>stars===null?null:index).filter(index=>index!==null);
  if(finished.some((stage,index)=>stage!==value.originStage+index)||value.wordsDone!==value.originStage+finished.length
    ||finished.some(stage=>!value.evidence.completions.includes(rounds[stage].roundId))
    ||value.evidence.firstResponses.some(row=>row.stage<value.originStage||row.stage>value.stage)
    ||value.evidence.assistedRetries.some(row=>row.stage<value.originStage||row.stage>value.stage)
    ||(value.phase==='PLAYING'&&w.slots.every(slot=>slot.filled))
    ||(value.phase==='PALS_CROSSING'&&!w.slots.every(slot=>slot.filled))
    ||(value.phase==='LEVEL_COMPLETE'&&!finished.includes(value.stage))
    ||(value.phase==='FINISHED'&&value.wordsDone!==10))return null;
  return structuredClone(value);
}

export function readWordBridgePracticeSession(scope,difficulty){
  return loadLearnGamesProgress(scope).games['word-bridge']?.practiceSession?.[difficulty] ?? null;
}

export function loadWordBridgePracticeSession(scope,difficulty,seed,journeyIndex,rounds,contentVersion=WORD_BRIDGE_CONTENT_VERSION){
  return validateWordBridgePracticeSession(readWordBridgePracticeSession(scope,difficulty),difficulty,seed,journeyIndex,rounds,contentVersion);
}

export function saveWordBridgePracticeSession(scope,difficulty,state,contentVersion=WORD_BRIDGE_CONTENT_VERSION){
  if(!validWordBridgeContentVersion(contentVersion))throw new Error('Unsupported Word Bridge save revision');
  const snapshot=structuredClone({...state,version:contentVersion,difficulty});
  const current=loadLearnGamesProgress(scope),game=current.games['word-bridge']||{};
  const next={...current,games:{...current.games,'word-bridge':{...game,practiceSession:{...(game.practiceSession||{}),[difficulty]:snapshot}}}};
  try{saveLearnGamesProgress(scope,next);return{localSaved:true,syncPending:false,snapshot};}
  catch(error){return{localSaved:Boolean(error.savedProgress),syncPending:Boolean(error.savedProgress),snapshot};}
}
