import test from 'node:test';
import { createWordClimbInputLatch } from '../../src/components/learn/games/games/wordClimbInput.js';
import assert from 'node:assert/strict';
import { createWordBridgeMotion } from '../../src/components/learn/games/games/wordBridgeMotion.js';
import { createWordClimbMotion } from '../../src/components/learn/games/games/wordClimbMotion.js';
import { createWordClimbStepper } from '../../src/components/learn/games/games/wordClimbStepper.js';

for(const fps of [60,120])test(`Word Bridge ${fps}Hz builder/carry anchor and crossing pals share camera phase`,()=>{
  const motion=createWordBridgeMotion(),builder={x:0,anim:0,carrying:{physicalId:'a'}},pal={x:100};
  let camera=0,time=0,remainder=0;
  for(let frame=0;frame<fps;frame++){
    remainder+=1/fps;
    while(remainder>=1/60){motion.capture(camera,time,[builder,pal]);builder.x+=4;pal.x+=4;camera+=2;time+=1/60;remainder-=1/60;}
    const alpha=remainder*60,view=motion.view(camera,time,alpha),actor=motion.actor(builder,alpha),friend=motion.actor(pal,alpha);
    if(frame>3)assert.ok(Math.abs(actor.x-((frame+1)/fps-1/60)*240)<1e-8);
    assert.equal(friend.x-actor.x,100);assert.equal(actor.x-view.cameraX,actor.x/2);
    assert.equal(actor.carrying,builder.carrying,'held physical piece identity remains unchanged');
  }
  motion.reset();builder.x=900;assert.equal(motion.actor(builder,0).x,900);
  assert.equal(motion.view(500,2,0).cameraX,500,'resume/resize never blends an obsolete bank');
});
for(const fps of [60,120])test(`Word Climb ${fps}Hz shares one sampled world for semantic ledges and both renderers`,()=>{
  const world={x:500,y:0,vx:0,vy:108,camera:0,elapsed:0,paused:false,platforms:[{y:300}],step:0};
  const motion=createWordClimbMotion(world);
  const stepper=createWordClimbStepper(world,(w,dt)=>{w.y+=108*dt;w.camera+=54*dt;w.elapsed+=dt;},undefined,undefined,motion.capture);
  const identity=motion.pose;
  for(let frame=0;frame<fps;frame++){
    stepper.advance(1/fps,{});const state=stepper.inspect();const pose=motion.sample(state.remainder/state.step);
    assert.equal(pose,identity);assert.equal(pose.platforms,world.platforms);
    if(frame>3)assert.ok(Math.abs(pose.y-((frame+1)/fps-1/60)*108)<1e-8);
    assert.ok(Math.abs(pose.y-pose.camera-pose.y/2)<1e-8);
  }
  const physicalY=world.y;motion.sample(.2);assert.equal(world.y,physicalY);
  world.paused=true;assert.equal(motion.sample(0).y,world.y);
  motion.reset();stepper.reset();world.paused=false;stepper.advance(1/120,{});assert.equal(motion.sample(.5).y,world.y);
  motion.capture();world.x=900;world.y=800;assert.equal(motion.sample(.5).y,800,'recovery snap is not a flight through scenery');
});

test('Climb short taps reach one physics step; held input and cancellation keep their ownership',()=>{
  const input=createWordClimbInputLatch();input.press('up');
  assert.equal(input.consume({up:false}).up,true);assert.equal(input.consume({up:false}).up,false);
  input.press('right');assert.equal(input.consume({right:true}).right,true);assert.equal(input.consume({right:true}).right,true);
  input.press('left');input.clear('left');assert.equal(input.consume({left:false}).left,false);
  input.press('up');input.clear();assert.deepEqual(input.consume({}),{});
});
