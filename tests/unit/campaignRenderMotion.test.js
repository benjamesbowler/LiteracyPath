import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignFrameSteps } from '../../src/features/soundSeekers/rounded/campaignWorld.js';
import { createCampaignRenderMotion } from '../../src/features/soundSeekers/rounded/campaignRenderMotion.js';

test('rounded campaign renders every 120 Hz frame while preserving 60 Hz movement and state', () => {
  const motion=createCampaignRenderMotion(),player={x:0,z:0,vx:4.6,vz:0};
  let remainder=0;
  const poses=[];
  for(let i=0;i<120;i++){
    const clock=campaignFrameSteps(1/120,remainder);remainder=clock.remainder;
    for(let step=0;step<clock.steps;step++){motion.capture(player);player.x+=player.vx/60;}
    const actualX=player.x;
    poses.push(motion.sample(player,remainder).x);
    assert.equal(player.x,actualX);
  }
  for(let i=2;i<poses.length;i++)assert.ok(Math.abs(poses[i]-poses[i-1]-4.6/120)<1e-10);
  assert.ok(Math.abs(player.x-4.6)<1e-10);
});

test('restore and pause snap to current coordinates without drawing from an earlier place', () => {
  const motion=createCampaignRenderMotion();
  motion.capture({x:1,z:2,vx:4,vz:0});
  const player={x:25,z:-18,vx:0,vz:0};
  motion.reset();
  assert.deepEqual(motion.sample(player,0),player);
  motion.capture({x:24,z:-18,vx:4,vz:0});
  assert.deepEqual(motion.sample(player,0,true),player);
});
