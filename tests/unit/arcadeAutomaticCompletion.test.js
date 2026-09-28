import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function readFunction(source,name) {
  const start=source.indexOf(`  function ${name}(`);
  const end=source.indexOf('\n  }\n',start);
  assert.ok(start>=0 && end>start);
  return source.slice(start,end+5);
}
test('Spell & Skate awards a fully spelled word once and never awards a partial word',async()=>{
  const source=await readFile(new URL('../../src/components/learn/games/games/GrammarGrindGame.jsx',import.meta.url),'utf8');
  const complete=readFunction(source,'completeSpelledWord');
  const simulate=Function('step',`${complete}
    let phase='playing',phaseTimer=0,lineStep=step,assistRoute=[],correct=0,combo=1,comboTimer=0,styleWindow=0,styleScore=0,boostFlash=0,message='',coachText='',messageTimer=0,score=0;
    const level={segments:['c','a','t'],audioWord:'cat'},rampAccents=[],theme={correct:'#fff'},player={speed:0,pos:{}};
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),addScore=n=>score+=n,spawnBurst=()=>{},sfx=()=>{},playCorrectChime=()=>{},playStarChime=()=>{};
    completeSpelledWord();completeSpelledWord();
    return {correct,score,phase,phaseTimer,message};
  `);
  assert.deepEqual(simulate(2),{correct:0,score:0,phase:'playing',phaseTimer:0,message:''});
  assert.deepEqual(simulate(3),{correct:1,score:880,phase:'word-complete',phaseTimer:.85,message:'cat complete!'});
  assert.doesNotMatch(source,/function (?:handleGate|createGate)|Choose the built word/);
});

test('Sound Beat finishes on the final authored sound, ignores further taps and preserves uncredited retries',async()=>{
  const source=await readFile(new URL('../../src/components/learn/games/games/Ps1ArcadeGame.jsx',import.meta.url),'utf8');
  const simulate=Function('clean',`${['tapBeat','tickFrame','endCurrentWord'].map(name=>readFunction(source,name)).join('\n')}
    let now=0,blends=0;
    const state={currentTask:{item:{beats:['c','a','t'],lanes:[0,1,2]},attempts:0},beatIndex:0,wordCompleteAt:null,countdown:0,padPress:[0,0,0,0],inputLockedUntil:0,roundBpm:60,roundWindow:400,level:{bpm:60},noteStart:1,hitBursts:[],time:0,currentWordClean:clean,correct:0,score:0,wordsEnded:0,paused:false,ended:false,resultAt:null};
    const rhythmClock={now:()=>now},soundBeatMercyPolicy=()=>({windowScale:1}),ensureMusic=()=>{},beatLanePoint=()=>({x:0,y:0}),w=100,h=100,config={accent:'gold',accent2:'green'},sfx=()=>{},playTapSound=()=>{},speakActiveNote=arg=>{if(arg?.blendAction)blends++},missCurrent=()=>{throw Error('unexpected miss')};
    const canvas={dataset:{}},soundAllowed=()=>false,musicAllowed=()=>false,reduceMotion=true,draw=()=>{},options={};
    let voiceController=null,voiceUntil=0,pendingNoteCue=false;
    const nextTask=()=>{state.currentTask=null;state.ended=true;},finishTask=points=>{state.correct++;state.score+=points;nextTask()};
    now=1;tapBeat(0);now=2;tapBeat(1);
    const partial={index:state.beatIndex,words:state.wordsEnded,correct:state.correct};
    now=3;tapBeat(2);tapBeat(2);
    const completed={index:state.beatIndex,at:state.wordCompleteAt,blends};
    now=3.2;tickFrame(now,.2);
    const beforeFeedback=state.wordsEnded;
    state.paused=true;now=3.7;tickFrame(now,.5);
    const paused=state.wordsEnded;
    state.paused=false;tickFrame(now,0);tickFrame(now,0);
    return {partial,completed,beforeFeedback,paused,words:state.wordsEnded,correct:state.correct,score:state.score};
  `);
  const success=simulate(true);
  assert.deepEqual(success.partial,{index:2,words:0,correct:0});
  assert.deepEqual(success.completed,{index:3,at:3.45,blends:1});
  assert.equal(success.beforeFeedback,0);
  assert.equal(success.paused,0);
  assert.equal(success.words,1);
  assert.equal(success.correct,1);
  assert.equal(success.score,180);
  const retry=simulate(false);
  assert.equal(retry.words,1);
  assert.equal(retry.correct,0);
  assert.equal(retry.score,0);
  assert.doesNotMatch(source,/"GO"|\.\.\.item.beats, "blend"/);
});
