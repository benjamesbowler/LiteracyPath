import assert from "node:assert/strict";
import test from "node:test";
import { createWordClimbSession } from "../../src/utils/wordClimbLevels.js";
import { advanceClimbJourney,climbRouteCenter,CLIMB_STAGE_TRAVEL,CLIMB_TRAVEL_SPEED,createClimbJourney } from "../../src/components/learn/games/games/wordClimbJourney.js";
import { jumpToClimbPlatform,reachableClimbPlatforms } from "../../src/components/learn/games/games/wordClimbWorld.js";

function steer(world){
  const next=world.journey.obstacles.find(o=>o.section===world.step&&o.y>world.y-35&&o.y-world.y<185);
  const center=climbRouteCenter(world.journey,world.y,world.journey.branchStartX);
  const target=center+(next?-next.side*82:0),difference=target-world.x;
  return{up:true,left:difference< -6,right:difference>6};
}
for(const [difficulty,stage] of [["easy",0],["medium",1],["hard",2],["easy",3],["medium",4],["hard",5],["hard",8]])test(`${difficulty} ${stage}: fastest legal full ascent has substantial travel and distinct word jumps`,()=>{
  const world=createClimbJourney(createWordClimbSession(difficulty),stage);let ticks=0,wordJumps=0;
  const originalWords=world.platforms.filter(p=>p.kind==="word").map(p=>[p.id,p.word,p.x,p.y]);
  assert.equal(reachableClimbPlatforms(world).length,0,"distant word stations cannot skip traversal");
  while(!world.completed&&ticks<25000){
    if(world.journey.phase==="word"&&["grounded","landed"].includes(world.state)){
      const target=reachableClimbPlatforms(world).find(p=>p.correct);const step=world.step;
      assert.ok(Math.abs(target.y-world.y-210)<1e-8);assert.ok(jumpToClimbPlatform(world,target.id));assert.equal(world.step,step);wordJumps++;
    }
    advanceClimbJourney(world,1/60,world.journey.phase==="climb"?steer(world):{});ticks++;
  }
  assert.equal(world.completed,true);assert.equal(wordJumps,world.summit);assert.equal(world.wrong,0);
  assert.ok(ticks/60>=CLIMB_STAGE_TRAVEL/CLIMB_TRAVEL_SPEED);
  assert.ok(ticks/60<210,`competent continuous route should remain a few minutes, got ${ticks/60}s`);
  assert.deepEqual(world.platforms.filter(p=>p.kind==="word").map(p=>[p.id,p.word,p.x,p.y]),originalWords);
  assert.ok(world.journey.obstacles.length>=18);assert.ok(world.journey.lights.length>=18);
});
test("release pauses active climbing immediately; edge slips are local motor events",()=>{
  const world=createClimbJourney(createWordClimbSession("easy"));
  for(let i=0;i<240;i++)advanceClimbJourney(world,1/60,steer(world));
  const y=world.y;for(let i=0;i<60;i++)advanceClimbJourney(world,1/60,{});assert.equal(world.y,y);
  for(let i=0;i<180&&!world.motorFalls;i++)advanceClimbJourney(world,1/60,{up:true,right:true});
  assert.equal(world.motorFalls,1);assert.equal(world.wrong,0);assert.equal(world.step,0);
  world.event=null;const frozen=JSON.stringify(world);world.paused=true;const paused=JSON.stringify(world);advanceClimbJourney(world,1,{});assert.equal(JSON.stringify(world),paused);world.paused=false;
  for(let i=0;i<60;i++)advanceClimbJourney(world,1/60,{});
  assert.equal(world.y,world.journey.safeRest.y);assert.ok(world.y>0);assert.notEqual(JSON.stringify(world),frozen);
});

test("a branch contact recovers to a physically touched hold without awarding reading progress",()=>{
 const world=createClimbJourney(createWordClimbSession("easy"));let caught=false;
 for(let i=0;i<1800&&!caught;i++){
  const branch=world.journey.obstacles[0],difference=branch.x-world.x;
  advanceClimbJourney(world,1/60,{up:true,left:difference< -5,right:difference>5});
  caught=world.event?.type==="fall"&&world.event.reason==="branch";
 }
 assert.equal(caught,true);assert.equal(world.step,0);assert.equal(world.wrong,0);
 const safe={...world.journey.safeRest};for(let i=0;i<60;i++)advanceClimbJourney(world,1/60,{});
 assert.equal(world.y,safe.y);assert.equal(world.x,safe.x);assert.equal(world.motorFalls,1);
});
test("optional lanterns require physical contact and cannot be collected twice",()=>{
 const world=createClimbJourney(createWordClimbSession("easy"));const light=world.journey.lights[0];
 for(let i=0;i<900&&world.y<light.y+45;i++){
  const target=climbRouteCenter(world.journey,world.y,world.journey.branchStartX)+(light.x-climbRouteCenter(world.journey,light.y))*Math.min(1,world.y/light.y);
  const difference=target-world.x;advanceClimbJourney(world,1/60,{up:true,left:difference< -5,right:difference>5});
 }
 assert.deepEqual(world.journey.collected,[light.id]);assert.equal(world.step,0);
 for(let i=0;i<120;i++)advanceClimbJourney(world,1/60,{});
 assert.deepEqual(world.journey.collected,[light.id]);assert.equal(world.wrong,0);
});

test("held climb control never answers a word station automatically",()=>{
 const world=createClimbJourney(createWordClimbSession("easy"));
 for(let i=0;i<4000&&world.journey.phase==='climb';i++)advanceClimbJourney(world,1/60,steer(world));
 assert.equal(world.journey.phase,'word');const y=world.y;
 for(let i=0;i<600;i++)advanceClimbJourney(world,1/60,{up:true});
 assert.equal(world.step,0);assert.equal(world.y,y);assert.equal(reachableClimbPlatforms(world).length,3);
});

test("the route remains traversable with discrete steering decisions",()=>{
 for(const cadence of [2,6]){
  const world=createClimbJourney(createWordClimbSession("easy"));let input={},ticks=0;
  while(world.journey.phase==='climb'&&ticks<4000){if(ticks%cadence===0)input=steer(world);advanceClimbJourney(world,1/60,input);ticks++;}
  assert.equal(world.journey.phase,'word',`steering every ${cadence}/60 seconds reaches the first station`);
 }
});
