import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { REEL_READ_CONTENT_VERSION, REEL_READ_CONSTRUCT, reelReadResponseId, reelReadEvidenceScore } from './reelReadEvidence.js';
import { reelReadTaskDescription } from './reelReadHookDecision.js';
import { reelReadStars } from './reelReadLevels.js';
import { fishingPondForEncounter } from './reelReadFishing.js';

export { REEL_READ_CONTENT_VERSION, REEL_READ_CONSTRUCT };
const integer = (value,max=999999) => Number.isInteger(value)&&value>=0&&value<=max;
const finite = (value,min=0,max=1e12) => Number.isFinite(value)&&value>=min&&value<=max;
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const supported = reasons => Array.isArray(reasons)&&reasons.length<=24&&reasons.every(reason=>typeof reason==='string'&&reason.length>0&&reason.length<=100);
const localAudio = src => typeof src==='string'&&/^\/(audio|media|guided-reading)\//.test(src)&&src.endsWith('.mp3');

/** The sidecar is the existing scoped practiceSession, not a new service or
 * cloud history. Correct-hook decisions remain accepted if the line escapes.
 */
export function validateReelReadSession(value,{seed,stage,journeyIndex,ladder}) {
  const level=ladder?.[stage],foregroundElapsed=value?.foregroundElapsed??value?.elapsed;
  if(!level||!integer(seed,0xffffffff)||!integer(stage,9)||!integer(journeyIndex,99999)
    ||!value||value.version!==REEL_READ_CONTENT_VERSION||value.seed!==seed||value.stage!==stage||value.journeyIndex!==journeyIndex
    ||!integer(value.originStage,stage)||!finite(value.elapsed)||!finite(foregroundElapsed,value.elapsed)||!finite(value.boatPosition,0,1)||!['left','right'].includes(value.facing)
    ||!integer(value.nextId)||!supported(value.supportReasons)||typeof value.celebrating!=='boolean'
    ||!integer(value.motorMisses)||!integer(value.motorEscapes)||!integer(value.motorInterceptions)) return null;
  const validWords=words=>Array.isArray(words)&&new Set(words).size===words.length&&words.length<=level.correctWords.length&&words.every(word=>level.correctWords.includes(word));
  if(!validWords(value.acceptedWords)||!validWords(value.landedWords)||value.landedWords.some(word=>!value.acceptedWords.includes(word))
    ||level.orderMatters&&value.acceptedWords.some((word,index)=>word!==level.correctWords[index])) return null;
  const evidence=value.evidence;
  if(!evidence||!['firstResponses','assistedRetries','acceptedResponses','completions','audioReceipts'].every(key=>Array.isArray(evidence[key]))) return null;
  const validReceipt=r=>r&&integer(r.stage,stage)&&r.stage>=value.originStage&&r.round===r.stage&&r.word===ladder[r.stage]?.target
    &&r.kind==='target'&&localAudio(r.src)&&finite(r.at,0,foregroundElapsed);
  if(!evidence.audioReceipts.every(validReceipt)) return null;
  const validRow=row=>{
    const target=ladder[row?.stage],task=target&&reelReadTaskDescription(target);
    if(!target||!integer(row.stage,stage)||row.stage<value.originStage||row.round!==row.stage||!integer(row.unit,target.correctWords.length-1)
      ||row.responseId!==reelReadResponseId(row.stage,row.unit)||row.word!==target.target||!finite(row.at,0,foregroundElapsed)
      ||!['keyboard','pointer','touch','assistive'].includes(row.source)||!supported(row.supportReasons)
      ||!['word','meaning-context'].includes(row.cueKind)||row.wordVisible!==false||row.choicesVisible!==true||row.selectedWordVisible!==true
      ||row.practiceOnly!==true||row.construct!==REEL_READ_CONSTRUCT||row.taskMode!==task.mode||row.operation!==task.operation||row.partCategory!==task.partCategory
      ||!Array.isArray(row.choices)||!row.choices.length||row.choices.length>target.visibleFish||new Set(row.choices.map(r=>r.id)).size!==row.choices.length
      ||new Set(row.choices.map(r=>r.word)).size!==row.choices.length||row.choices.some(r=>!integer(r.id)||r.id>=value.nextId||![...target.correctWords,...target.distractors].includes(r.word))
      ||!row.choices.some(r=>r.word===row.selected)) return false;
    const expected=target.orderMatters?target.correctWords[row.unit]:target.correctWords;
    const correct=target.orderMatters?row.selected===expected:target.correctWords.includes(row.selected);
    const receipt=row.deliveryReceipt;
    const delivered=validReceipt(receipt)&&receipt.stage===row.stage&&receipt.at<=row.at&&evidence.audioReceipts.some(r=>same(r,receipt));
    return same(row.expected,expected)&&row.correct===correct&&row.points===(correct?120:0)
      &&row.deliveryAtResponse===(delivered?'delivered':'pending')
      &&(row.deliveryAtResponse==='delivered'||receipt==null)
      &&row.independentPartOrMeaningPractice===(correct&&!row.supportReasons.length&&delivered);
  };
  if(![...evidence.firstResponses,...evidence.assistedRetries,...evidence.acceptedResponses].every(validRow)
    ||new Set(evidence.firstResponses.map(r=>r.responseId)).size!==evidence.firstResponses.length
    ||new Set(evidence.acceptedResponses.map(r=>r.responseId)).size!==evidence.acceptedResponses.length
    ||evidence.assistedRetries.some(row=>!row.supportReasons.includes('repeat-response')||!evidence.firstResponses.some(first=>first.responseId===row.responseId))
    ||evidence.acceptedResponses.some(row=>!row.correct||![...evidence.firstResponses,...evidence.assistedRetries].some(r=>same(r,row)))) return null;
  for(let atStage=value.originStage;atStage<=stage;atStage++) {
    let unit=0;
    const rows=[...evidence.firstResponses,...evidence.assistedRetries].filter(r=>r.stage===atStage).sort((a,b)=>a.at-b.at);
    for(const row of rows) { if(row.unit!==unit) return null; if(row.correct) unit++; }
    if(unit!==evidence.acceptedResponses.filter(r=>r.stage===atStage).length) return null;
  }
  const accepted=evidence.acceptedResponses.filter(r=>r.stage===stage).sort((a,b)=>a.unit-b.unit);
  if(!same(accepted.map(r=>r.selected),value.acceptedWords)||accepted.some((row,unit)=>row.unit!==unit)
    ||evidence.acceptedResponses.some(row=>evidence.acceptedResponses.some(other=>other.stage===row.stage&&other.unit!==row.unit&&other.selected===row.selected))
    ||value.score!==reelReadEvidenceScore(evidence)
    ||value.mistakes!==[...evidence.firstResponses,...evidence.assistedRetries].filter(r=>!r.correct).length
    ||value.hintMistakes!==[...evidence.firstResponses,...evidence.assistedRetries].filter(r=>r.stage===stage&&!r.correct).length) return null;
  const validCompletion=row=>{
    const target=ladder[row?.stage],rows=evidence.acceptedResponses.filter(r=>r.stage===row.stage).sort((a,b)=>a.unit-b.unit);
    const task=target&&reelReadTaskDescription(target);
    const misses=[...evidence.firstResponses,...evidence.assistedRetries].filter(r=>r.stage===row.stage&&!r.correct).length;
    const graded=target?.correctWords.length<=3?Math.max(0,misses-1):misses;
    const stars=reelReadStars({correct:rows.length,total:rows.length+graded,mistakes:graded});
    if(!target||!integer(row.stage,stage)||row.stage<value.originStage||row.round!==row.stage||row.id!==`reel-read:${row.stage}`||row.word!==target.target
      ||row.stage===stage&&!value.celebrating||rows.length!==target.correctWords.length||!same(row.acceptedWords,rows.map(r=>r.selected))
      ||!Array.isArray(row.landedWords)||row.landedWords.length!==rows.length||new Set(row.landedWords).size!==rows.length||row.landedWords.some(w=>!row.acceptedWords.includes(w))
      ||row.points!==rows.reduce((sum,r)=>sum+r.points,0)||!finite(row.at,0,foregroundElapsed)||row.stars!==stars||row.bonusPoints!==80+stars*60
      ||row.taskMode!==task.mode||row.operation!==task.operation||row.partCategory!==task.partCategory
      ||!supported(row.supportReasons)||row.practiceOnly!==true) return false;
    return row.supported===(row.supportReasons.length>0||rows.some(r=>!r.independentPartOrMeaningPractice));
  };
  if(!evidence.completions.every(validCompletion)||evidence.completions.length!==stage-value.originStage+Number(value.celebrating)
    ||evidence.completions.some((row,index)=>row.stage!==value.originStage+index)) return null;
  if(!Array.isArray(value.fish)||value.fish.length>level.visibleFish||new Set(value.fish.map(r=>r.id)).size!==value.fish.length
    ||new Set(value.fish.map(r=>r.word)).size!==value.fish.length||new Set(value.fish.map(r=>r.slot)).size!==value.fish.length
    ||value.fish.some(row=>!integer(row.id)||row.id>=value.nextId||![...level.correctWords,...level.distractors].includes(row.word)
      ||value.landedWords.includes(row.word)||!integer(row.slot,level.visibleFish-1)||!finite(row.phase)||![-1,1].includes(row.direction))) return null;
  const unlanded=level.correctWords.filter(word=>!value.landedWords.includes(word));
  const requiredInSchool=value.fish.filter(row=>unlanded.includes(row.word));
  // A resumed school must still contain the next ordered part and every
  // accepted-but-escaped part. Otherwise a valid-looking save could strand
  // the child indefinitely without altering any evidence rows.
  if(requiredInSchool.length!==Math.min(level.correctVisible,unlanded.length)
    ||value.acceptedWords.some(word=>!value.landedWords.includes(word)&&!requiredInSchool.some(row=>row.word===word))
    ||level.orderMatters&&unlanded.length&&!requiredInSchool.some(row=>row.word===unlanded[0])) return null;
  // A saved live fight is motor state. Resume can continue it without issuing
  // another language response or carrying a stale held-key intention.
  if(value.fight!==null&&typeof value.fight!=='object') return null;
  if(value.fight) {
    const fight=value.fight,pond=fishingPondForEncounter(stage);
    if(!same(fight.pond,pond)||!integer(fight.fishId)||!value.fish.some(row=>row.id===fight.fishId&&value.acceptedWords.includes(row.word))
      ||!finite(fight.initialLength,pond.length,pond.length+1.8)||!finite(fight.remaining,.75,fight.initialLength*1.12)
      ||!finite(fight.tension,.04,1)||!finite(fight.strain,0,.72)||!finite(fight.elapsed,0,value.elapsed)||!finite(fight.phase)
      ||!finite(fight.pull,0,1)||!finite(fight.sway,-1,1)||fight.landed!==false||fight.escaped!==false
      ||fight.anchorX!==undefined&&!finite(fight.anchorX)
      ||fight.anchorY!==undefined&&!finite(fight.anchorY)
      ||(fight.anchorXNormalized!==undefined||fight.anchorDepth!==undefined)
        &&(!finite(fight.anchorXNormalized,0,1)||!finite(fight.anchorDepth,0,1))) return null;
  }
  return structuredClone(value);
}

export function loadReelReadSession(scope,difficulty,context) {
  return validateReelReadSession(loadLearnGamesProgress(scope).games['reel-read']?.practiceSession?.[difficulty],context);
}
export function saveReelReadSession(scope,difficulty,state) {
  const current=loadLearnGamesProgress(scope),prior=current.games['reel-read']||{};
  const next={...current,games:{...current.games,'reel-read':{...prior,practiceSession:{...(prior.practiceSession||{}),
    [difficulty]:{...state,version:REEL_READ_CONTENT_VERSION,checkpointSemantics:'active-question-index'}}}}};
  try{saveLearnGamesProgress(scope,next);return{localSaved:true};}
  catch(error){return{localSaved:Boolean(error.savedProgress)};}
}
