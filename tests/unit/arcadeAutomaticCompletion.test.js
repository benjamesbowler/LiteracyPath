import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { soundBeatResponse, newSoundBeatEvidence, soundBeatPhraseId } from '../../src/utils/soundBeatSession.js';
import { newSpellSkatePractice, recordSpellSkateChoice, completeSpellSkateWord } from '../../src/utils/spellSkatePractice.js';
import { createLearningDwell, LEARNING_PACE } from '../../src/utils/learningPace.js';

function readFunction(source,name) {
  const start=source.indexOf(`  function ${name}(`);
  const end=source.indexOf('\n  }\n',start);
  assert.ok(start>=0 && end>start);
  return source.slice(start,end+5);
}
test('Spell & Skate awards a fully spelled word once and never awards a partial word',async()=>{
  const source=await readFile(new URL('../../src/components/learn/games/games/GrammarGrindGame.jsx',import.meta.url),'utf8');
  const complete=readFunction(source,'completeSpelledWord');
  const simulate=Function('step','createLearningDwell','LEARNING_PACE','completeSpellSkateWord','recordSpellSkateChoice','newSpellSkatePractice',`${complete}
    let resultDwell=null; const resultReadback=()=>Promise.resolve('cat');
    let phase='playing',phaseTimer=0,lineStep=step,assistRoute=[],correct=0,combo=1,comboTimer=0,styleWindow=0,styleScore=0,boostFlash=0,message='',coachText='',messageTimer=0,score=0;
    const level={segments:['c','a','t'],audioWord:'cat'},rampAccents=[],theme={correct:'#fff'},player={speed:0,pos:{}};
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),addScore=n=>score+=n,spawnBurst=()=>{},sfx=()=>{},playCorrectChime=()=>{},playStarChime=()=>{};
    const levelIndex=0; let evidence=newSpellSkatePractice();
    for(let index=0; index<step; index++) evidence=recordSpellSkateChoice(evidence,{levelIndex,word:level.audioWord,segments:level.segments,step:index,selected:level.segments[index],choices:level.segments},{deliberate:true,soundEnabled:false});
    completeSpelledWord();completeSpelledWord();
    const result={correct,score,phase,phaseTimer,message,completions:evidence.completions}; resultDwell?.cancel(); return result;
  `);
  assert.deepEqual(simulate(2,createLearningDwell,LEARNING_PACE,completeSpellSkateWord,recordSpellSkateChoice,newSpellSkatePractice),{correct:0,score:0,phase:'playing',phaseTimer:0,message:'',completions:[]});
  assert.deepEqual(simulate(3,createLearningDwell,LEARNING_PACE,completeSpellSkateWord,recordSpellSkateChoice,newSpellSkatePractice),{correct:1,score:880,phase:'word-complete',phaseTimer:1.6,message:'cat complete!',completions:['word-0:cat']});
  assert.doesNotMatch(source,/function (?:handleGate|createGate)|Choose the built word/);
});

test('Sound Beat finishes on the final authored sound, ignores further taps and preserves uncredited retries',async()=>{
  const source=await readFile(new URL('../../src/components/learn/games/games/Ps1ArcadeGame.jsx',import.meta.url),'utf8');
  const simulate=Function('clean','LEARNING_PACE','soundBeatResponse','newSoundBeatEvidence','soundBeatPhraseId',`${['tapBeat','tickFrame','endCurrentWord'].map(name=>readFunction(source,name)).join('\n')}
    let now=0,blends=0;
    const state={stage:0,taskIndex:0,combo:0,evidence:newSoundBeatEvidence(),supportReasons:[],currentTask:{item:{word:'cat',beats:['c','a','t'],lanes:[0,1,2]},attempts:0},beatIndex:0,wordCompleteAt:null,countdown:0,padPress:[0,0,0,0],inputLockedUntil:0,roundBpm:60,roundWindow:400,level:{bpm:60},noteStart:1,hitBursts:[],time:0,currentWordClean:clean,correct:0,score:0,wordsEnded:0,paused:false,ended:false,resultAt:null};
    const rhythmClock={now:()=>now},soundBeatMercyPolicy=()=>({windowScale:1}),ensureMusic=()=>{},beatLanePoint=()=>({x:0,y:0}),w=100,h=100,config={accent:'gold',accent2:'green'},sfx=()=>{},playTapSound=()=>{},speakActiveNote=arg=>{if(arg?.blendAction)blends++},missCurrent=()=>{throw Error('unexpected miss')};
    const cueQueue={queued:()=>false,cancel:()=>{},pump:()=>{}},replayButton={},recovery={},artRetry={},saveRetry={},musicalWorld=null,persist=()=>{},deliveryAtResponse=()=> 'pending',currentDeliveryReceipt=()=>null,markSupported=reason=>{if(!state.supportReasons.includes(reason))state.supportReasons.push(reason)};
    const canvas={dataset:{}},soundAllowed=()=>false,musicAllowed=()=>false,reduceMotion=true,draw=()=>{},options={};
    let voiceController=null,voiceUntil=0,pendingNoteCue=false,voicePending=false,voiceEndedAt=-Infinity;
    const nextTask=()=>{state.currentTask=null;state.ended=true;},finishTask=points=>{state.correct++;state.score+=points;nextTask()};
    now=1;tapBeat(0);now=2;tapBeat(1);
    const partial={index:state.beatIndex,words:state.wordsEnded,correct:state.correct};
    now=3;tapBeat(2);tapBeat(2);
    const completed={index:state.beatIndex,at:state.wordCompleteAt,blends};
    now=4.59;tickFrame(now,1.59);
    const beforeFeedback=state.wordsEnded;
    state.paused=true;now=4.6;tickFrame(now,.01);
    const paused=state.wordsEnded;
    state.paused=false;tickFrame(now,0);tickFrame(now,0);
    return {partial,completed,beforeFeedback,paused,words:state.wordsEnded,correct:state.correct,score:state.score};
  `);
  const success=simulate(true,LEARNING_PACE,soundBeatResponse,newSoundBeatEvidence,soundBeatPhraseId);
  assert.deepEqual(success.partial,{index:2,words:0,correct:0});
  assert.deepEqual(success.completed,{index:3,at:4.6,blends:1});
  assert.equal(success.beforeFeedback,0);
  assert.equal(success.paused,0);
  assert.equal(success.words,1);
  assert.equal(success.correct,1);
  assert.equal(success.score,180);
  const retry=simulate(false,LEARNING_PACE,soundBeatResponse,newSoundBeatEvidence,soundBeatPhraseId);
  assert.equal(retry.words,1);
  assert.equal(retry.correct,0);
  assert.equal(retry.score,0);
  assert.doesNotMatch(source,/"GO"|\.\.\.item.beats, "blend"/);
});
