import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {createSentenceGroveStepper} from '../../src/components/learn/games/games/starGalleryStepper.js';
import {interpolateArcadeMotion} from '../../src/components/learn/games/shared/arcadeMotion.js';
const source=fs.readFileSync(new URL('../../src/components/learn/games/games/StarGalleryArcadeGame.jsx',import.meta.url),'utf8');
const start=source.indexOf('  function updateVehicle(dt)'),end=source.indexOf('  function updateScenery',start);
function fixture(){
 const state={player:{x:0,z:0,yaw:0,speed:12},steerVisual:1,vehicle:new THREE.Group()};
 const visualPlayer={...state.player};
 const context={state,visualPlayer,visualSteer:1,elapsedTime:0,clamp:THREE.MathUtils.clamp,settingsFor:()=>({maxSpeed:20}),groveVehicleYaw:yaw=>yaw+Math.PI};
 return {state,visualPlayer,context,update:vm.runInNewContext(`(${source.slice(start,end)})`,context)};
}
test('native Grove vehicle uses interpolated position and local body tilt through a full heading circle',()=>{
 const {state,visualPlayer,context,update}=fixture();
 for(let yaw=0;yaw<Math.PI*2;yaw+=.1){
  Object.assign(visualPlayer,{x:4.5,z:8,yaw});context.elapsedTime+=1/120;update(1/120);
  assert.equal(state.vehicle.position.x,4.5);assert.equal(state.vehicle.position.z,8);
  assert.equal(state.player.x,0,'render cannot mutate collision position');
  const up=new THREE.Vector3(0,1,0).applyQuaternion(state.vehicle.quaternion);
  assert.ok(up.y>.98);
  const local=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-(yaw+Math.PI)).multiply(state.vehicle.quaternion);
  const expected=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.021,0,-.132,'YXZ'));
  assert.ok(local.angleTo(expected)<1e-6,'pitch and lean follow the heading, not world axes');
 }
});
test('Grove 120Hz rendering advances between fixed driving ticks and resets without changing physics',()=>{
 const {state,visualPlayer,update}=fixture();let previous={...state.player};
 const clock=createSentenceGroveStepper(dt=>{previous={...state.player};state.player.x+=12*dt;});
 const values=[];
 for(let i=0;i<24;i++){
  clock.advance(1/120);const {remainder,fixedStep}=clock.inspect();
  interpolateArcadeMotion(previous,state.player,remainder/fixedStep,visualPlayer,['x','z','yaw','speed'],['yaw']);
  update(1/120);values.push(state.vehicle.position.x);
 }
 for(let i=2;i<values.length;i++)assert.ok(Math.abs(values[i]-values[i-1]-.1)<1e-9);
 clock.reset();previous={...state.player};interpolateArcadeMotion(previous,state.player,0,visualPlayer,['x','z','yaw','speed'],['yaw']);update(0);
 assert.equal(state.vehicle.position.x,state.player.x);
});

test('Grove incomplete or failed GPU preparation enters authored Canvas recovery before play',async()=>{
 const begin=source.indexOf('  async function beginSceneWarmup()');
 const end=source.indexOf('  function finishGame()',begin);
 for(const status of ['partial','failed','timeout','ready']){
  let recoveries=0;
  const context={warmupGeneration:0,renderer:{},graphicsLoading:false,loadingNotice:{hidden:true},
   simulation:{reset(){}},resetMotion(){},frameTimer:{reset(){}},disposed:false,
   gardenWorld:null,blenderLandmarks:null,authoredWorld:null,sceneryDetails:null,canvasSurface:null,
   state:{},updateVehicle(){},updateCamera(){},camera:{},scene:{},motionQuery:null,
   premiumRender:{prepareObject(){},render(){}},warmupReceipt:null,
   warmArcadeScene:async()=>({status}),switchToCanvas(){recoveries++;}};
  await vm.runInNewContext(`(${source.slice(begin,end)})`,context)();
  assert.equal(recoveries,status==='ready'?0:1,status);
  if(status==='ready')assert.equal(context.graphicsLoading,false);
  else assert.equal(context.graphicsLoading,true,'only recovery can release loading after an incomplete GPU result');
 }
});
