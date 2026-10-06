import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSkateRouteRecovery, planSkateRoute, skateSteering, skateMotion, sampleSkateSurface, skateSurfaceTilt, resolveSkateObstacleContact, skateSurfaceEdgesClear} from '../../src/components/learn/games/games/spellSkatePark.js';

const source=fs.readFileSync(new URL('../../src/components/learn/games/games/GrammarGrindGame.jsx',import.meta.url),'utf8');
function declaration(name,next) {
  return source.slice(source.indexOf(`  function ${name}(`),source.indexOf(`  function ${next}(`));
}
// Execute the live integration, including its actual height-step rejection,
// braking, turn radius, stun, landing and object separation. Only graphics and
// scoring callbacks are inert; this does not substitute straight-line travel.
function motionRun({position,yaw,route,target,ramps,obstacles=[],recovery=true,difficulty='easy',seconds=45}) {
  const body=declaration('destinationExclusions','choiceButton')+declaration('nearestRail','updatePickups');
  const live=recovery?body:body.replaceAll('recoverSelectedRouteAfterContact("raised-surface");','').replaceAll('recoverSelectedRouteAfterContact("park-object");','');
  const make=new Function('deps','fixture',`
    const {THREE,createSkateRouteRecovery,planSkateRoute,skateSteering,skateMotion,sampleSkateSurface,skateSurfaceTilt,resolveSkateObstacleContact}=deps;
    const {ramps:rampZones,obstacles:parkObstacles,difficulty,target}=fixture;
    const platformZones=[],railZones=[],MAX_SPEED={easy:9,medium:29,hard:33},PLAYER_RADIUS=2.15,ARENA_LIMIT=82;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const keys={left:false,right:false,push:false,brake:false,jump:false,jumpPressed:false};
    const player={pos:new THREE.Vector3(fixture.position.x,0,fixture.position.z),yaw:fixture.yaw,speed:0,air:sampleSkateSurface(fixture.position.x,fixture.position.z,rampZones,[]).height,vy:0,onGround:true,stun:fixture.stun||0,grind:0,airTime:0,airTricks:0,spinAngle:0,spinTarget:0,railIntent:0,railLock:0,rampLock:0,landTime:0,recoverTime:0,surfacePitch:0,surfaceRoll:0,motorRecoveries:0,landingRecoveries:0};
    let assistRoute=structuredClone(fixture.route),phase='playing',boostFlash=0,styleWindow=0,styleScore=0,message='',messageTimer=0;
    const selectedIntent={levelIndex:6,step:0,label:'d',responseCounted:true};
    const levelIndex=6,lineStep=0,lineNodes=[{label:'d',button:{},destination:target,group:{position:target},radius:4.2}];
    const assistRouteRecovery=createSkateRouteRecovery(),assistContactRecoveries=[];
    const addScore=()=>{},sfx=()=>{},awardStyle=()=>{},playTapSound=()=>{},playPopSound=()=>{},playWhoosh=()=>{};
    const recordChoice=()=>{throw new Error('Navigation must not register another literacy response');};
    ${live}
    return {step:updatePlayer,player,selectedIntent,assistContactRecoveries,get route(){return structuredClone(assistRoute)}};
  `);
  const runtime=make({THREE,createSkateRouteRecovery,planSkateRoute,skateSteering,skateMotion,sampleSkateSurface,skateSurfaceTilt,resolveSkateObstacleContact},{position,yaw,route,target,ramps,obstacles,difficulty});
  let ticks=0;
  while(ticks<seconds*60&&Math.hypot(runtime.player.pos.x-target.x,runtime.player.pos.z-target.z)>=4.2){runtime.step(1/60);ticks++;}
  return {...runtime,seconds:ticks/60,arrived:Math.hypot(runtime.player.pos.x-target.x,runtime.player.pos.z-target.z)<4.2};
}

const bank={x:24,z:-22,rot:0,width:14,depth:16,height:2.8};
const retained=JSON.parse(fs.readFileSync(new URL('../fixtures/spell-skate-east-bank-contact.json',import.meta.url),'utf8'));

test('the retained east-bank loop is reproduced by actual turning/contact and reroutes to the same selected part',()=>{
  const original=motionRun({...retained,recovery:false,seconds:12});
  assert.equal(original.arrived,false);
  assert.ok(original.player.motorRecoveries>30,'the regression must reproduce repeated real contact');
  const repaired=motionRun(retained);
  assert.equal(repaired.arrived,true,JSON.stringify({position:repaired.player.pos,route:repaired.route,recoveries:repaired.assistContactRecoveries}));
  assert.ok(repaired.player.motorRecoveries<5,'recovery must end the wall loop');
  assert.deepEqual(repaired.selectedIntent,{levelIndex:6,step:0,label:'d',responseCounted:true});
  assert.equal(repaired.assistContactRecoveries[0].kind,'raised-surface');
  assert.deepEqual(repaired.assistContactRecoveries[0].target,retained.target);
});

test('identical blocked contact is bounded, and an explicit new choice can replan afresh',()=>{
  let calls=0;
  const recover=createSkateRouteRecovery({plan:()=>{calls++;return [{x:8,z:0}]}});
  const args=[{x:0,z:0},{x:8,z:0},[],[],[],[{x:4,z:0},{x:8,z:0}]];
  assert.equal(recover.recover(...args).reason,'contact-reroute');
  assert.equal(recover.recover(...args.slice(0,-1),[{x:8,z:0}]).reason,'repeated-contact');assert.equal(calls,1);
  recover.reset();assert.equal(recover.recover(...args).reason,'contact-reroute');assert.equal(calls,2);
});

test('rotated bank-side contacts preserve the real destination and arrive without repeated collision churn',()=>{
  for(const rot of [.7,Math.PI/2,Math.PI,-.45]){
    const rotate=point=>({x:bank.x+Math.cos(rot)*(point.x-bank.x)+Math.sin(rot)*(point.z-bank.z),z:bank.z-Math.sin(rot)*(point.x-bank.x)+Math.cos(rot)*(point.z-bank.z)});
    const run=motionRun({...retained,position:rotate(retained.position),yaw:retained.yaw+rot,target:rotate(retained.target),route:retained.route.map(rotate),ramps:retained.ramps.map(zone=>({...zone,...rotate(zone),rot:zone.rot+rot})),obstacles:retained.obstacles.map(zone=>({...zone,...rotate(zone)}))});
    assert.equal(run.arrived,true,JSON.stringify({rot,position:run.player.pos,route:run.route,recoveries:run.assistContactRecoveries}));
    assert.ok(run.player.motorRecoveries<5,`rotation ${rot} must not churn`);
    assert.ok(run.assistContactRecoveries.every(row=>Math.hypot(row.target.x-rotate(retained.target).x,row.target.z-rotate(retained.target).z)<1e-9));
  }
});

test('low front entries and near-side approaches use actual bank surfaces without relaxing physical contact',()=>{
  const targets=[{x:24,z:-24},{x:8,z:-27}];
  for(const [position,yaw,target] of [[{x:24,z:-36},0,targets[0]],[{x:35,z:-26},-Math.PI/2,targets[1]],[{x:18,z:-32},.5,targets[0]]]){
    const route=planSkateRoute(position,target,[bank],[],[]);
    assert.ok(route.length);
    const run=motionRun({position,yaw,target,route,ramps:[bank]});
    assert.equal(run.arrived,true,JSON.stringify({position,target,final:run.player.pos,route:run.route,recoveries:run.assistContactRecoveries}));
    assert.ok(run.player.motorRecoveries<5);
  }
});

test('recovery distinguishes exact raised wall entries, low riding fronts, downhill exits and bowl rims',()=>{
  assert.equal(skateSurfaceEdgesClear(retained.position,retained.route[0],[bank],[]),false,'metre samples must not miss the actual first raised side entry');
  assert.equal(skateSurfaceEdgesClear({x:31.003,z:-25},{x:31,z:-25},[bank],[]),false,'an endpoint on the wall is still a physical entry');
  assert.equal(skateSurfaceEdgesClear({x:31,z:-25},{x:34,z:-25},[bank],[]),true,'leaving the raised side is downhill');
  assert.equal(skateSurfaceEdgesClear({x:24,z:-36},{x:24,z:-28},[bank],[]),true,'the low front remains a usable riding surface');
  const quarter={x:0,z:0,rot:0,width:10,depth:8,height:3,kind:'quarter'};
  assert.equal(skateSurfaceEdgesClear({x:6,z:-1},{x:4,z:-1},[quarter],[]),false);
  assert.equal(skateSurfaceEdgesClear({x:0,z:-10},{x:0,z:-6},[quarter],[]),true);
  const bowl={x:0,z:0,rot:0,radius:16,height:3.6,kind:'bowl'};
  assert.equal(skateSurfaceEdgesClear({x:18,z:0},{x:14,z:0},[bowl],[]),false);
  assert.equal(skateSurfaceEdgesClear({x:14,z:0},{x:18,z:0},[bowl],[]),true);
});

test('an impossible or unchanged route stops assisted propulsion without moving its input pose or target',()=>{
  for(const planned of [[],[{x:4,z:0}]]){
    const recover=createSkateRouteRecovery({plan:()=>structuredClone(planned)});
    const position={x:0,z:0},target={x:4,z:0},route=[{x:4,z:0}];
    const before=structuredClone({position,target,route});
    assert.deepEqual(recover.recover(position,target,[],[],[],route).route,[]);
    assert.deepEqual({position,target,route},before);
  }
});
