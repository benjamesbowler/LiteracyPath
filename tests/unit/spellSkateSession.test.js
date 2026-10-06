import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSpellSkateSession,spellSkateSignature} from '../../src/utils/spellSkateSession.js';
import {newSpellSkatePractice,recordSpellSkateChoice} from '../../src/utils/spellSkatePractice.js';
import {grammarGrindLadder,grammarGrindSegmentChoices} from '../../src/utils/grammarGrindLevels.js';
import {SPELL_SKATE_CONTENT_VERSION} from '../../src/data/arcadeContentVersions.js';
const sessionSeed=42,journeyIndex=3,difficulty='easy',index=0;
const ladder=grammarGrindLadder(difficulty,sessionSeed,journeyIndex),level=ladder[index];
const context={sessionSeed,journeyIndex,difficulty,index,ladder,railCount:3,pickupCount:0};
function fixture(forSeed=sessionSeed){
  const ladder=forSeed===sessionSeed?context.ladder:grammarGrindLadder(difficulty,forSeed,journeyIndex),level=ladder[index];
  const choices=grammarGrindSegmentChoices(level,ladder,0,forSeed);
  const evidence=recordSpellSkateChoice(newSpellSkatePractice({sessionSeed:forSeed,journeyIndex,difficulty}),{
    levelIndex:0,word:level.audioWord,segments:level.segments,step:0,selected:level.segments[0],choices
  },{deliberate:true,inputAuthority:'selected-skate-destination',motorAssist:true,wordDelivery:'delivered',soundEnabled:true,
    wordReceipt:{source:'/audio/words/'+level.audioWord+'.mp3',deliveredAt:'2026-10-04T05:00:00Z',playTimeMs:1200}});
  return {version:SPELL_SKATE_CONTENT_VERSION,checkpointSemantics:'active-word-index',sessionSeed:forSeed,journeyIndex,difficulty,index,
    sessionStartIndex:0,signature:spellSkateSignature(ladder),score:50,correct:0,mistakes:0,wordMistakes:0,activeSeconds:6.5,
    phase:'playing',phaseTimer:0,lineStep:1,lineReady:false,lineChoiceCooldown:.6,combo:1,comboTimer:0,styleWindow:5,styleScore:26,
    supportReasons:['mission-help'],evidence,player:{pos:{x:5,y:0,z:12},yaw:Math.PI,speed:7,vy:0,air:0,airTime:0,onGround:true,
      stun:0,grind:0,grindRailIndex:-1,grindT:0,airTricks:0,spinAngle:0,spinTarget:0,railIntent:0,grindDirection:1,
      railLock:0,rampLock:0,landTime:.05,recoverTime:0,surfacePitch:0,surfaceRoll:0,motorRecoveries:1,landingRecoveries:0},
    pickups:[],choices:grammarGrindSegmentChoices(level,ladder,1,forSeed).map((label,i)=>({label,x:-15+i*15,z:-20,contactLock:false})),
    selectedIntent:null,assistRoute:[]};
}
test('genuine uint32 seed boundaries preserve the generated hidden-target word, accepted parts and stable destinations through local JSON recovery',()=>{
  for(const seed of [0,0x7fffffff,0x80000000,0xffffffff]){
    const ladder=grammarGrindLadder(difficulty,seed,journeyIndex),raw=JSON.parse(JSON.stringify(fixture(seed)));
    const restored=validateSpellSkateSession(raw,{...context,sessionSeed:seed,ladder});
    assert.ok(restored,`Generated uint32 seed ${seed} must survive local recovery`);assert.equal(restored.sessionSeed,seed);assert.equal(restored.index,0);assert.equal(restored.signature,spellSkateSignature(ladder));assert.deepEqual(restored.choices,raw.choices);assert.deepEqual(restored.evidence,raw.evidence);
  }
});
test('index-zero saved board recovery keeps accepted spelling, stable destinations and exact end receipts without sharing mutable references',()=>{
  const raw=fixture(),copy=validateSpellSkateSession(raw,context);assert.ok(copy);
  assert.equal(copy.lineStep,1);assert.equal(copy.player.speed,7);assert.deepEqual(copy.choices,raw.choices);
  assert.deepEqual(copy.evidence.firstResponses[0].wordAudioReceipt,raw.evidence.firstResponses[0].wordAudioReceipt);
  copy.choices[0].x=77;copy.evidence.firstResponses[0].supportReasons.push('changed');
  assert.notEqual(copy.choices[0].x,raw.choices[0].x);assert.deepEqual(raw.evidence.firstResponses[0].supportReasons,[]);
});
test('wrong learner context, bank, forged spelling credit, unsafe routes and receipts cannot restore',()=>{
  for(const change of [s=>s.sessionSeed++,s=>s.journeyIndex++,s=>s.index++,s=>s.signature+='x',s=>s.lineStep++,
    s=>s.choices.reverse(),s=>s.choices[0].x=Infinity,s=>s.player.speed=1000,s=>s.player.grindRailIndex=3,
    s=>s.evidence.completions.push('word-0:invented'),s=>s.correct++,s=>s.evidence.firstResponses[0].wordVisible=true,
    s=>s.evidence.firstResponses[0].wordAudioReceipt=null,s=>s.evidence.firstResponses[0].wordAudioReceipt.playTimeMs=999999,
    s=>s.evidence.firstResponses[0].expected='invented',s=>s.assistRoute.push({x:0,z:0}),s=>s.unbounded='x'.repeat(500001)]) {
    const raw=fixture();change(raw);assert.equal(validateSpellSkateSession(raw,context),null);
  }
});
test('an in-flight deliberately chosen route retains its recorded intent but cannot invent a different destination response',()=>{
  const raw=fixture(),choices=raw.choices.map(choice=>choice.label),selected=level.segments[1];
  raw.evidence=recordSpellSkateChoice(raw.evidence,{levelIndex:0,word:level.audioWord,segments:level.segments,step:1,selected,choices},
    {deliberate:true,inputAuthority:'selected-skate-destination',motorAssist:true,wordDelivery:'unavailable',soundEnabled:false});
  raw.selectedIntent={levelIndex:0,step:1,label:selected,responseCounted:true};raw.assistRoute=[{x:3,z:4},{x:15,z:-20}];
  assert.ok(validateSpellSkateSession(raw,context));
  raw.selectedIntent.label=choices.find(choice=>choice!==selected);assert.equal(validateSpellSkateSession(raw,context),null);
});
