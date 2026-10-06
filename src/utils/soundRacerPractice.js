import { SOUND_RACER_CONTENT_VERSION } from '../data/arcadeContentVersions.js';

export const SOUND_RACER_CONSTRUCT='grapheme-phoneme-onset-recognition';
export function newSoundRacerPractice({sessionSeed=0,journeyIndex=0,difficulty='easy'}={}) {
  return {contentVersion:SOUND_RACER_CONTENT_VERSION,sessionSeed,journeyIndex,difficulty,
    construct:SOUND_RACER_CONSTRUCT,practiceOnly:true,firstResponses:[],assistedRetries:[],completions:[]};
}
export function recordRacerWordChoice(evidence,gate,context={}) {
  if(!context.hasLaneIntent||gate.kind!=='word'||!gate.word)return evidence;
  const roundId=`track-${context.levelIndex}:${gate.word}`;
  if(evidence.completions.includes(roundId))return evidence;
  const first=!evidence.firstResponses.some(row=>row.roundId===roundId);
  const receipt=context.targetReceipt;
  const hasReceipt=typeof receipt?.source==='string'&&receipt.source.length>0
    &&Number.isFinite(Date.parse(receipt.deliveredAt))&&Number.isFinite(receipt.playTimeMs)&&receipt.playTimeMs>=0;
  const delivery=context.targetDelivery==='delivered'&&!hasReceipt?'unavailable':context.targetDelivery||'pending';
  const support=new Set(context.supportReasons||[]);
  if(context.soundEnabled===false)support.add('sound-off');
  if(delivery!=='delivered')support.add(delivery==='pending'?'answered-before-target-audio-ended':'target-audio-unavailable');
  if(gate.hintShown)support.add('lane-hint');
  const row={roundId,itemId:gate.word,word:gate.word,expected:context.target,selected:gate.word,
    correct:Boolean(gate.correct),construct:delivery==='delivered'&&context.soundEnabled!==false?SOUND_RACER_CONSTRUCT:'supported-written-onset-matching',
    inputAuthority:'deliberate-lane-aim',wordVisible:true,practiceOnly:true,
    deliveryAtResponse:delivery,stimulusDelivered:delivery==='delivered',
    targetAudioReceipt:delivery==='delivered'?{...receipt}:null,
    gateAudioDelivery:gate.audioDelivery||'pending',soundEnabledAtResponse:context.soundEnabled!==false,supportReasons:[...support],
    motorAssist:Boolean(context.motorAssist),graphicsRecovery:context.graphicsRecovery||'primary',
    independentPractice:first&&delivery==='delivered'&&support.size===0};
  return {...evidence,firstResponses:first?[...evidence.firstResponses,row]:evidence.firstResponses,
    assistedRetries:first?evidence.assistedRetries:[...evidence.assistedRetries,{...row,independentPractice:false}].slice(-1000),
    completions:gate.correct?[...evidence.completions,roundId]:evidence.completions};
}
