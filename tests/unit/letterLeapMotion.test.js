import test from 'node:test';
import assert from 'node:assert/strict';
import { createLetterLeapMotion } from '../../src/components/learn/games/games/letterLeapMotion.js';
const step=1/60;
function run(cadence) {
  const motion=createLetterLeapMotion(), player={x:0,y:77,h:46}, support={x:0,y:100}, level={};
  const state={level,player,cam:0,camY:0,clock:0};
  let accumulator=0, elapsed=0;
  const frames=[];
  for(const milliseconds of cadence){
    elapsed+=milliseconds/1000;accumulator+=milliseconds/1000;
    while(accumulator>=step){
      motion.capture(state,[player,support]);
      player.x+=4.8; support.x+=4.8; state.cam+=2.4;
      player.y+=.25; support.y+=.25;state.clock+=1000/60;
      accumulator-=step;
    }
    const alpha=accumulator/step;
    const view=motion.frame(state,alpha), actor=motion.actor(player,alpha), platform=motion.actor(support,alpha);
    frames.push({elapsed,x:actor.x,relative:actor.x-view.cam,contact:actor.y+23-platform.y,raw:player.x});
  }
  return frames;
}
for(const [name,cadence] of [ ['60Hz',Array(120).fill(1000/60)],['120Hz',Array(240).fill(1000/120)],['irregular and short stalls',Array.from({length:40},()=>[8,24,12,40,16]).flat()] ]) {
  test(`${name}: camera, rider and support share smooth display phase without modifying physics`,()=>{
    const frames=run(cadence).filter(frame=>frame.elapsed>.1);
    for(const frame of frames){
      assert.ok(Math.abs(frame.x-(frame.elapsed-step)*288)<1e-8);
      assert.ok(Math.abs(frame.relative-frame.x/2)<1e-8);
      assert.ok(Math.abs(frame.contact)<1e-8,'visible soles remain registered to moving support');
      assert.ok(frame.raw>=frame.x && frame.raw-frame.x<=4.800001);
    }
    if(name==='120Hz'){
      assert.ok(frames.some((frame,index)=>index && frame.raw===frames[index-1].raw),'reproduces raw fixed-state duplicate frames');
      for(let i=1;i<frames.length;i++)assert.ok(Math.abs(frames[i].x-frames[i-1].x-2.4)<1e-8);
    }
  });
}
test('pause/resume, resize and respawn reset render history; fresh actors never inherit old coordinates',()=>{
  const motion=createLetterLeapMotion(),player={x:10,y:20},state={level:{},player,cam:5,camY:0,clock:0};
  motion.capture(state,[player]);player.x=20;state.cam=10;
  assert.equal(motion.actor(player,1).x,20,'paused frame paints current state');
  motion.reset();player.x=70;state.cam=0;
  assert.equal(motion.actor(player,0).x,70);assert.equal(motion.frame(state,0).cam,0);
  motion.capture(state,[player]);player.x=80;
  const replacement={x:900,y:500};
  assert.equal(motion.actor(replacement,.5).x,900);
  assert.equal(motion.frame({...state,level:{},cam:850},.5).cam,850);
  assert.deepEqual(player,{x:80,y:20},'painting does not write back into save/collision state');
});
