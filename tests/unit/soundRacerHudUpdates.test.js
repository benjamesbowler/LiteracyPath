import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const runtime=fs.readFileSync(new URL('../../src/components/learn/games/games/SoundRacerGame.jsx',import.meta.url),'utf8');
const start=runtime.indexOf('  function updateHud() {'),end=runtime.indexOf('\n  function addBurst(',start);
assert.ok(start>=0&&end>start);
const update=runtime.slice(start,end);
function fixture(){
  const writes=[],nodes={};
  for(const key of ['timer','words','checkpoint','shield','speed','hear-target']){
    const state={textContent:'',disabled:false,innerHTML:'',style:{},attributes:{}};
    nodes[key]=new Proxy(state,{set(object,property,value){writes.push([key,property,value]);object[property]=value;return true;}});
    state.style=new Proxy({}, {set(object,property,value){writes.push([key,'style.'+property,value]);object[property]=value;return true;}});
    state.getAttribute=name=>state.attributes[name];state.setAttribute=(name,value)=>{writes.push([key,name,value]);state.attributes[name]=value;};
  }
  const dataset=new Proxy({}, {set(object,property,value){writes.push(['hud',property,value]);object[property]=value;return true;}});
  const context={el:key=>nodes[key],opts:{isSoundEnabled:true},track:{target:'b',needed:12,laps:3,totalLength:500,raceLength:1500},
    timeMs:0,wordsCorrect:0,playerZ:0,checkpointIndex:0,shield:3,speed:0,difficulty:'easy',hud:{dataset},
    formatTime:value=>String(value),racerDriveSpeed:()=>20};
  const fn=vm.runInNewContext(`(${update})`,context);return{fn,context,nodes,writes};
}

test('unchanged Racer HUD state does not manufacture repeated layout, HTML parsing or accessibility mutations',()=>{
  const {fn,writes,nodes,context}=fixture();fn();assert.ok(writes.length>0);writes.length=0;fn();assert.deepEqual(writes,[]);
  context.timeMs=50;context.speed=10;fn();assert.equal(nodes.timer.textContent,'50');assert.equal(nodes.speed.style.width,'50%');
  assert.deepEqual(writes.map(row=>row.slice(0,2)),[['timer','textContent'],['speed','style.width']]);
});

test('sound preference and current teaching target update replay availability and its accessible name once, without changing status rules',()=>{
  const {fn,writes,nodes,context}=fixture();fn();writes.length=0;context.opts.isSoundEnabled=false;fn();
  assert.equal(nodes['hear-target'].disabled,true);assert.equal(nodes['hear-target'].innerHTML,'Sound<br>off');assert.match(nodes['hear-target'].getAttribute('aria-label'),/^Sound is off/);
  writes.length=0;fn();assert.deepEqual(writes,[]);
  context.opts.isSoundEnabled=true;context.track.target='wh';context.playerZ=600;context.checkpointIndex=4;context.wordsCorrect=3;fn();
  assert.equal(nodes['hear-target'].disabled,false);assert.equal(nodes['hear-target'].getAttribute('aria-label'),'Hear WH sound again');
  assert.equal(nodes.words.textContent,'3 / 12 words');assert.equal(nodes.checkpoint.textContent,'Sector 2 / 3 · Lap 2 / 3');
});
