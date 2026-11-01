import test from 'node:test';
import assert from 'node:assert/strict';
import { createRallyPalsRenderMotion } from '../../src/components/learn/games/games/rallyPalsRenderMotion.js';
import { createBurrowRenderMotion } from '../../src/components/learn/games/games/burrowBuildersRenderMotion.js';
import { createTowerTumbleRenderMotion } from '../../src/components/learn/games/games/towerTumbleRenderMotion.js';

test('Rally samples actors and same-shot ball together without changing motor state; new contact and pause snap',()=>{
  const motion=createRallyPalsRenderMotion(),state={index:0,phase:'rally',mode:'match',court:0};
  const physics={player:{x:0,z:7},opponent:{x:0,z:-7},ball:{x:0,y:1,z:0,time:0},lastContact:{},swing:0,rivalSwing:0};
  motion.capture(physics,state,0);physics.player.x=1;physics.opponent.x=1;physics.ball={x:2,y:2,z:2,time:1};
  let view=motion.sample(physics,state,1,.5);assert.equal(view.physics.player.x,.5);assert.equal(view.physics.ball.x,1);assert.equal(view.time,.5);assert.equal(physics.player.x,1);
  physics.lastContact={};physics.ball.x=10;view=motion.sample(physics,state,1,0);assert.equal(view.physics.ball.x,10);
  view=motion.sample(physics,state,1,0,true);assert.equal(view.physics.player.x,1);
  state.index++;assert.equal(motion.sample(physics,state,1,0).physics.player.x,1);
});
test('Tower samples actor, platform clock and existing barrels, snapping life loss, new barrels and edge drops',()=>{
  const motion=createTowerTumbleRenderMotion(),barrel={x:0,y:3,spin:0,dir:1};
  const state={index:0,lives:3,phase:'playing',actor:{x:0,y:0}};
  const data={state,barrels:[barrel],elapsed:0,smash:0,impactAge:0,rescueProgress:0};
  motion.capture(data);state.actor.x=1;barrel.x=2;barrel.spin=1;data.elapsed=1;
  let view=motion.sample(data,.5);assert.equal(view.state.actor.x,.5);assert.equal(view.barrels[0].x,1);assert.equal(view.lift,3+Math.sin(.5*.7)*3);assert.equal(state.actor.x,1);
  barrel.y=0;assert.equal(motion.sample(data,0).barrels[0].x,2);
  state.lives=2;state.actor.x=5;assert.equal(motion.sample(data,0).state.actor.x,5);
  motion.reset();assert.equal(motion.sample(data,0).state.actor.x,5);
});

test('Burrow shares a detached fractional pose and snaps island/build edits without moving collision data',()=>{
  const motion=createBurrowRenderMotion(),blocks=[],world={islandId:'one',blocks,player:{x:0,z:0}};
  motion.capture({x:0,z:0,height:0},world);const next={...world,player:{x:1,z:1}};
  const result=motion.sample({x:1,z:1,height:0},next,.5,10);assert.equal(result.x,.5);assert.equal(next.player.x,1);
  assert.equal(motion.read({x:1,z:1,height:0},next),result);
  const edited={...next,blocks:[{}]};assert.equal(motion.read({x:1,z:1,height:2},edited).height,2);
  const island={...edited,islandId:'two',player:{x:8,z:8}};assert.equal(motion.read({x:8,z:8,height:0},island).x,8);
});
test('Burrow immediate tap retains its physical displacement but presents the pulse without a jump or backward frame',()=>{
  const motion=createBurrowRenderMotion(),world={islandId:'one',blocks:[],player:{x:.224,z:0}},pose={x:.224,z:0,height:0};
  motion.pulse({x:0,z:0},pose,100);motion.capture(pose,world);
  assert.equal(motion.sample(pose,world,1,100).x,0);
  assert.equal(motion.sample(pose,world,.2,140).x,.112);
  assert.equal(motion.sample(pose,world,.8,180).x,.224);
  assert.equal(world.player.x,.224);motion.reset();assert.equal(motion.sample(pose,world,0,200).x,.224);
});
