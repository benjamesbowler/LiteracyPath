import {loadLearnGamesProgress,saveLearnGamesProgress} from './learnGamesProgress.js';
import {SOUND_RACER_CONTENT_VERSION} from '../data/arcadeContentVersions.js';
import {SOUND_RACER_CONSTRUCT} from './soundRacerPractice.js';
import {validArcadeChapter} from './arcadeJourneys.js';

export const soundRacerSignature=race=>JSON.stringify([race.target,race.totalLength,race.raceLength,
  race.gates.map(({kind,word,correct,lane,z})=>[kind,word||'',Boolean(correct),lane,z])]);
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const strings=(array,max=30)=>Array.isArray(array)&&array.length<=max&&array.every(s=>typeof s==='string'&&s.length>0&&s.length<=100);

// Mutable driver/history is scoped to this child's existing practiceSession.
// It is never merged into immutable completion evidence or sent as cloud data.
export function saveSoundRacerSession(scope,difficulty,state) {
  try {
    const progress=loadLearnGamesProgress(scope),previous=progress.games['sound-racer']||{};
    saveLearnGamesProgress(scope,{...progress,games:{...progress.games,'sound-racer':{...previous,
      practiceSession:{...(previous.practiceSession||{}),[difficulty]:structuredClone(state)}}}});
    return {localSaved:true};
  } catch(error){return {localSaved:Boolean(error.savedProgress)};}
}

export function validateSoundRacerSession(raw,{sessionSeed,journeyIndex,difficulty,index,races}) {
  const race=races[index];
  try{if(JSON.stringify(raw).length>500000)return null;}catch{return null;}
  if(!raw||!race||raw.version!==SOUND_RACER_CONTENT_VERSION||raw.checkpointSemantics!=='active-track-index'
    ||raw.sessionSeed!==sessionSeed||raw.journeyIndex!==journeyIndex||raw.difficulty!==difficulty||raw.index!==index
    ||raw.signature!==soundRacerSignature(race)||!Number.isSafeInteger(raw.sessionSeed)||raw.sessionSeed<0
    ||!validArcadeChapter(raw.journeyIndex)
    ||!finite(raw.score,0,1000000)||!finite(raw.levelStartScore,0,raw.score)||!finite(raw.timeMs,0,86400000)
    ||!Number.isInteger(raw.shield)||raw.shield<1||raw.shield>3
    ||!strings(raw.supportReasons)||!strings(raw.caughtCorrectWords,40)
    ||new Set(raw.caughtCorrectWords).size!==raw.caughtCorrectWords.length
    ||!Number.isInteger(raw.wordsCorrect)||raw.wordsCorrect!==raw.caughtCorrectWords.length
    ||['wordsWrong','missedCorrect','obstaclesHit'].some(key=>!Number.isInteger(raw[key])||raw[key]<0||raw[key]>10000)
    ||!Array.isArray(raw.gates)||raw.gates.length<race.gates.length||raw.gates.length>1000
    ||!Array.isArray(raw.levelResults)||raw.levelResults.length!==races.length)return null;
  const correctWords=new Set(race.gates.filter(gate=>gate.correct).map(gate=>gate.word));
  if(raw.caughtCorrectWords.some(word=>!correctWords.has(word)))return null;
  const kart=raw.kart;
  if(!kart||['x','y','z','heading','lateral','aimLateral','speed','steering','bank','progress','safeProgress','recoveries'].some(key=>!Number.isFinite(kart[key]))
    ||!finite(kart.x,-600,600)||!finite(kart.z,-600,600)||!finite(kart.y,-3,30)
    ||!finite(kart.progress,0,race.raceLength+30000)||!finite(kart.safeProgress,0,race.raceLength+30000)
    ||!finite(kart.lateral,-8,8)||!finite(kart.aimLateral,-8,8)||!finite(kart.steering,-1,1)||!finite(kart.bank,-Math.PI,Math.PI)
    ||!finite(kart.speed,0,100)||!finite(kart.recoveries,0,10000))return null;
  for(let i=0;i<raw.gates.length;i++){
    const gate=raw.gates[i],original=race.gates[i];
    if(!gate||!['word','obstacle'].includes(gate.kind)||!Number.isInteger(gate.lane)||gate.lane<0||gate.lane>2
      ||!finite(gate.z,0,race.raceLength+30000)||typeof gate.resolved!=='boolean'||typeof gate.hintShown!=='boolean'
      ||!Number.isInteger(gate.tries)||gate.tries<0||gate.tries>10000)return null;
    if(original){
      if(gate.kind!==original.kind||gate.word!==original.word||gate.correct!==original.correct||gate.lane!==original.lane||gate.z!==original.z)return null;
    } else if(gate.kind!=='word'||!gate.correct||!gate.catchup||!correctWords.has(gate.word))return null;
  }
  const evidence=raw.evidence;
  if(!evidence||evidence.contentVersion!==SOUND_RACER_CONTENT_VERSION||evidence.sessionSeed!==sessionSeed
    ||evidence.journeyIndex!==journeyIndex||evidence.difficulty!==difficulty||evidence.construct!==SOUND_RACER_CONSTRUCT||evidence.practiceOnly!==true
    ||!Array.isArray(evidence.firstResponses)||evidence.firstResponses.length>600||!Array.isArray(evidence.assistedRetries)||evidence.assistedRetries.length>1000
    ||!Array.isArray(evidence.completions)||evidence.completions.length>400)return null;
  function validRow(row){
    const match=/^track-(\d+):(.+)$/.exec(row?.roundId||'');
    if(!match)return false;
    const level=Number(match[1]),word=match[2],source=races[level];
    const stimulus=source?.gates.find(gate=>gate.word===word);
    if(level>index||!stimulus||row.word!==word||row.itemId!==word||row.selected!==word||row.expected!==source.target
      ||row.correct!==Boolean(stimulus.correct)||row.practiceOnly!==true||row.wordVisible!==true
      ||row.inputAuthority!=='deliberate-lane-aim'||!strings(row.supportReasons)
      ||!['pending','delivered','unavailable'].includes(row.deliveryAtResponse)||typeof row.independentPractice!=='boolean'
      ||typeof row.soundEnabledAtResponse!=='boolean'||typeof row.motorAssist!=='boolean'
      ||!['primary','gzip-recovery','authored-driving-art'].includes(row.graphicsRecovery)
      ||!['pending','delivered','unavailable'].includes(row.gateAudioDelivery))return false;
    const delivered=row.deliveryAtResponse==='delivered',receipt=row.targetAudioReceipt;
    const construct=delivered&&row.soundEnabledAtResponse?SOUND_RACER_CONSTRUCT:'supported-written-onset-matching';
    const latestReceiptTime=level===index?raw.timeMs:raw.levelResults[level]?.timeMs;
    if(row.construct!==construct||row.stimulusDelivered!==delivered
      ||(delivered&&(!receipt||typeof receipt.source!=='string'||!receipt.source.startsWith('/')
        ||receipt.source.length>500||!Number.isFinite(Date.parse(receipt.deliveredAt))
        ||!finite(receipt.playTimeMs,0,latestReceiptTime??86400000)))||(!delivered&&receipt!==null))return false;
    return !row.independentPractice||(delivered&&row.soundEnabledAtResponse&&row.supportReasons.length===0);
  }
  if(!evidence.firstResponses.every(validRow)||!evidence.assistedRetries.every(row=>validRow(row)&&!row.independentPractice)
    ||new Set(evidence.firstResponses.map(row=>row.roundId)).size!==evidence.firstResponses.length
    ||new Set(evidence.completions).size!==evidence.completions.length
    ||evidence.completions.some(id=>![...evidence.firstResponses,...evidence.assistedRetries].some(row=>row.roundId===id&&row.correct)))return null;
  if(raw.caughtCorrectWords.some(word=>!evidence.completions.includes(`track-${index}:${word}`)))return null;
  for(let level=0;level<raw.levelResults.length;level++){
    const result=raw.levelResults[level];if(result===null)continue;
    if(level>index||!result||!finite(result.correct,0,races[level].needed)||!finite(result.mistakes,0,10000)
      ||!finite(result.timeMs,0,86400000)||!Number.isInteger(result.stars)||result.stars<0||result.stars>3)return null;
  }
  return structuredClone(raw);
}
export function loadSoundRacerSession(scope,context){
  return validateSoundRacerSession(loadLearnGamesProgress(scope).games['sound-racer']?.practiceSession?.[context.difficulty],context);
}
