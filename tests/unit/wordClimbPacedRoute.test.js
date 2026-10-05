import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbSession } from '../../src/utils/wordClimbLevels.js';
import { createClimbJourney, advanceClimbJourney, CLIMB_TRAVEL_SPEED } from '../../src/components/learn/games/games/wordClimbJourney.js';
import { jumpToClimbPlatform, reachableClimbPlatforms } from '../../src/components/learn/games/games/wordClimbWorld.js';
import { pacedClimbWaypoint, pacedClimbSection, pacedClimbMinimumSeconds, pacedClimbSurfaces, climbLayoutRevision } from '../../src/components/learn/games/games/wordClimbPacedRoute.js';
import { createWordClimbPracticeState, validateWordClimbPracticeSession } from '../../src/components/learn/games/games/wordClimbPracticeSession.js';
import { commitWordClimbLanding, wordClimbRounds } from '../../src/components/learn/games/games/wordClimbLearning.js';
import { readClimbSession, writeClimbSession } from '../../src/components/learn/games/games/wordClimbSession.js';
const make=(difficulty='easy',stage=0)=>createClimbJourney(createWordClimbSession(difficulty,()=>.32),stage,0,()=>.32);
function drive(world,side=1){const target=pacedClimbWaypoint(world,side),d=target.x-world.x;return{up:true,left:d<-.01,right:d>.01};}
for(const [difficulty,stage]of [['easy',0],['medium',1],['hard',2]])test(`${difficulty} paced route requires sequential real bough crossings and all original word landings`,()=>{
  const world=make(difficulty,stage),session=createWordClimbSession(difficulty,()=>.32);
  const state=createWordClimbPracticeState(session,world,{difficulty,seed:3,journeyIndex:0});
  const original=structuredClone(world.platforms);let ticks=0,crossTicks=0,flights=0;
  while(!world.completed&&ticks<18000){
    if(world.journey.phase==='word'&&['grounded','landed'].includes(world.state)){
      assert.equal(reachableClimbPlatforms(world).length,3);const choice=reachableClimbPlatforms(world).find(p=>p.correct);
      assert.equal(choice.y-world.y,210);assert(jumpToClimbPlatform(world,choice.id));flights++;
    }
    const crossing=world.journey.crossing,y=world.y;
    advanceClimbJourney(world,1/60,world.journey.phase==='climb'?drive(world,world.step%2?-1:1):{});
    if(crossing){assert.equal(world.y,y,'simultaneous Up cannot ascend across the tree gap');crossTicks++;}
    if(['correct','summit'].includes(world.event?.type)){
      const round=wordClimbRounds(world,session,state).find(r=>r.row===world.event.platform.row);
      state.evidence=commitWordClimbLanding(state.evidence,round,world.event.platform.id,{delivery:'unavailable',responseAt:world.step}).evidence;
    }
    ticks++;
  }
  assert(world.completed);assert.equal(flights,world.summit);assert.equal(world.wrong,0);assert.equal(world.motorFalls,0);
  assert.equal(CLIMB_TRAVEL_SPEED,108);assert(ticks/60>=pacedClimbMinimumSeconds(world.journey));
  assert(ticks/60>=150&&ticks/60<240,`actual simultaneous movement route ${ticks/60}s`);
  assert(crossTicks/60>=world.summit*2*(world.journey.crossingSpan-8)/180);
  assert.deepEqual(world.platforms,original,'no earned word moves terrain');assert(validateWordClimbPracticeSession(state,difficulty,3,0));
  assert(new Set(Array.from({length:world.summit},(_,n)=>pacedClimbSection(world.journey,n).place)).size>=6);
});
test('a paused/released branch crossing stays at its real point and reload retains the exact geometry and selected path',()=>{
 const world=make(),session=createWordClimbSession('easy',()=>.32);
 for(let i=0;i<2500&&!world.journey.crossing;i++)advanceClimbJourney(world,1/60,drive(world,-1));
 assert(world.journey.crossing);for(let i=0;i<30;i++)advanceClimbJourney(world,1/60,{up:true,left:true});
 const saved=structuredClone(world);for(let i=0;i<60;i++)advanceClimbJourney(world,1/60,{});assert.equal(world.x,saved.x);assert.equal(world.y,saved.y);
 world.paused=true;const paused=structuredClone(world);advanceClimbJourney(world,.05,{up:true,left:true});assert.deepEqual(world,paused);world.paused=false;
 const state=createWordClimbPracticeState(session,world,{difficulty:'easy',seed:0xffffffff,journeyIndex:0});
 const restored=validateWordClimbPracticeSession(state,'easy',0xffffffff,0);assert(restored);assert.deepEqual(restored.world.platforms,world.platforms);assert.deepEqual(restored.world.journey.crossing,world.journey.crossing);
 for(const mutate of [v=>v.world.journey.layoutRevision='made-up',v=>v.world.journey.crossing.y++,v=>v.world.journey.crossing.side=8,v=>v.world.journey.crossingSpan++,v=>v.world.journey.routeChoices.push(1),v=>v.world.platforms[5].y++]){const changed=structuredClone(state);mutate(changed);assert.equal(validateWordClimbPracticeSession(changed,'easy',0xffffffff,0),null);}
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};writeClimbSession(storage,'paced',session,world);assert.deepEqual(readClimbSession(storage,'paced',0,true).world,{...world,paused:false,event:null});
});
test('rendered fork surfaces have two real trees in the middle band and no deceptive unbroken central shortcut',()=>{
 const world=make(),j=world.journey,r=pacedClimbSection(j,0),middle=(r.first+r.second)/2;
 const surfaces=pacedClimbSurfaces(j,middle-30,middle+30);
 assert.deepEqual(surfaces.map(s=>s.side),[-1,1]);assert(surfaces.every(s=>s.points.every(p=>Math.abs(p.x-500)>j.crossingSpan-30)));
 assert.equal(climbLayoutRevision({...j,layoutRevision:'unknown'}),null);
});
