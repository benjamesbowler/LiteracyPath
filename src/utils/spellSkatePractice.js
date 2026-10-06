import {SPELL_SKATE_CONTENT_VERSION} from '../data/arcadeContentVersions.js';

export const SPELL_SKATE_CONSTRUCT='picture-audio-ordered-grapheme-encoding';
export function newSpellSkatePractice({sessionSeed=0,journeyIndex=0,difficulty='easy'}={}) {
  return {contentVersion:SPELL_SKATE_CONTENT_VERSION,sessionSeed,journeyIndex,difficulty,
    construct:SPELL_SKATE_CONSTRUCT,practiceOnly:true,firstResponses:[],assistedRetries:[],completions:[]};
}
export function spellSkatePartId(levelIndex,word,step) { return `word-${levelIndex}:${word}:part-${step}`; }
export function spellSkateWrongCounts(counts,{selected,expected,responseCounted=false}) {
  if(selected===expected||responseCounted)return counts;
  return {mistakes:counts.mistakes+1,wordMistakes:counts.wordMistakes+1};
}
export function recordSpellSkateChoice(evidence,item,context={}) {
  if(!context.deliberate||!item.choices.includes(item.selected)||!item.segments[item.step])return evidence;
  const roundId=spellSkatePartId(item.levelIndex,item.word,item.step);
  const first=!evidence.firstResponses.some(row=>row.roundId===roundId);
  const receipt=context.wordReceipt;
  const hasReceipt=typeof receipt?.source==='string'&&receipt.source.startsWith('/')&&Number.isFinite(Date.parse(receipt.deliveredAt))
    &&Number.isFinite(receipt.playTimeMs)&&receipt.playTimeMs>=0;
  const delivered=context.wordDelivery==='delivered'&&hasReceipt;
  const delivery=delivered?'delivered':context.wordDelivery==='pending'?'pending':'unavailable';
  const support=new Set(context.supportReasons||[]);
  if(context.soundEnabled===false)support.add('sound-off');
  if(!delivered)support.add(delivery==='pending'?'answered-before-word-audio-ended':'word-audio-unavailable');
  if(context.partialHint)support.add('partial-spelling-hint');
  const row={roundId,itemId:item.word,word:item.word,levelIndex:item.levelIndex,step:item.step,
    choices:[...item.choices],expected:item.segments[item.step],selected:item.selected,correct:item.selected===item.segments[item.step],
    construct:SPELL_SKATE_CONSTRUCT,practiceOnly:true,wordVisible:false,inputAuthority:context.inputAuthority,
    deliveryAtResponse:delivery,stimulusDelivered:delivered,wordAudioReceipt:delivered?{...receipt}:null,
    soundEnabledAtResponse:context.soundEnabled!==false,supportReasons:[...support],motorAssist:Boolean(context.motorAssist),
    graphicsRecovery:context.graphicsRecovery||'primary',independentPractice:first&&delivered&&support.size===0};
  return {...evidence,firstResponses:first?[...evidence.firstResponses,row]:evidence.firstResponses,
    assistedRetries:first?evidence.assistedRetries:[...evidence.assistedRetries,{...row,independentPractice:false}].slice(-500)};
}
export function completeSpellSkateWord(evidence,levelIndex,word,segments) {
  const id=`word-${levelIndex}:${word}`;
  if(evidence.completions.includes(id))return evidence;
  if(!segments.every((_,step)=>[...evidence.firstResponses,...evidence.assistedRetries].some(row=>row.roundId===spellSkatePartId(levelIndex,word,step)&&row.correct)))return evidence;
  return {...evidence,completions:[...evidence.completions,id]};
}
