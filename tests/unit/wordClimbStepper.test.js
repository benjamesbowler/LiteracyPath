import test from 'node:test';
import assert from 'node:assert/strict';
import {createWordClimbSession} from '../../src/utils/wordClimbLevels.js';
import {createClimbJourney,advanceClimbJourney,CLIMB_TRAVEL_SPEED} from '../../src/components/learn/games/games/wordClimbJourney.js';
import {jumpToClimbPlatform} from '../../src/components/learn/games/games/wordClimbWorld.js';
import {createWordClimbStepper} from '../../src/components/learn/games/games/wordClimbStepper.js';

const make=()=>createClimbJourney(createWordClimbSession('easy',()=>.4),0,0,()=>.4,{layoutRevision:'short-v2'});
test('Climb held approach and actual word flight preserve identical trajectories/events at30,60,120 rendered frames',()=>{
  const outcomes=[30,60,120].map(fps=>{
    const world=make(),events=[],stepper=createWordClimbStepper(world,advanceClimbJourney,event=>events.push(event.type));
    // The authored first thorn lies on the left of the trunk. An identical
    // half-second rightward grip, followed by held ascent, uses its clear side.
    for(let frame=0;frame<fps*3;frame++)stepper.advance(1/fps,{up:true,right:frame<fps*.5});
    assert.equal(world.journey.phase,'word');assert.equal(world.y,300);assert.equal(CLIMB_TRAVEL_SPEED,108);
    const correct=world.platforms.find(p=>p.kind==='word'&&p.row===1&&p.correct);assert(jumpToClimbPlatform(world,correct.id));
    for(let frame=0;frame<fps*1.2;frame++)stepper.advance(1/fps,{});
    assert.equal(world.step,1);assert.equal(world.y,510);assert.equal(events.filter(event=>event==='correct').length,1);
    return {x:world.x,y:world.y,elapsed:world.elapsed,camera:world.camera,wrong:world.wrong,motorFalls:world.motorFalls,events};
  });
  for(const outcome of outcomes.slice(1)){assert.deepEqual(outcome.events,outcomes[0].events);for(const key of['x','y','elapsed','camera','wrong','motorFalls'])assert(Math.abs(outcome[key]-outcomes[0][key])<1e-8,key);}
});

test('Climb accumulator bounds a stall, releases hidden time and emits actual collision events before another substep',()=>{
  const world=make(),events=[],stepper=createWordClimbStepper(world,advanceClimbJourney,event=>events.push(event.type));
  assert.equal(stepper.advance(5,{up:true}),12);assert(Math.abs(world.y-21.6)<1e-8);
  stepper.advance(.008,{up:true});world.paused=true;assert.equal(stepper.advance(8,{up:true}),0);assert.equal(stepper.inspect().remainder,0);
  const held=world.y;world.paused=false;assert.equal(stepper.advance(.008,{up:true}),0);assert.equal(world.y,held);stepper.reset();
  world.y=world.journey.obstacles[0].y-1;world.x=world.journey.obstacles[0].x;
  stepper.advance(.1,{up:true});assert.equal(world.motorFalls,1);assert.equal(events.filter(event=>event==='fall').length,1);assert.equal(world.wrong,0);
});
