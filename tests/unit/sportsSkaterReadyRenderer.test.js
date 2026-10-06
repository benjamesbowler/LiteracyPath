import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSkateCanvasArt} from '../../src/components/learn/games/games/sportsCanvasRenderer.js';
import {createSportsSkaterReadyAtlas} from '../../src/components/learn/games/games/sportsSkaterReadyAtlas.js';
import {SPORTS_SKATER_READY_REGISTRY} from '../../src/components/learn/games/games/sportsSkaterReadyRegistry.js';
import {SPORTS_SHARP_ART_REGISTRY} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {SPORTS_JUMP_ROWS} from '../../src/components/learn/games/games/sportsJumpRowRegistry.js';

test('all three normal factories select their exact ready atlas and original fault rows without a query or development override',()=>{
 for(const world of ['meadow','dino','moonwood'])for(const options of [
  {world},{world,development:false,search:''},{world,development:true,search:'?sportsReadyJumpAtlas=moonwood'},
 ]){
  const calls=[],actor={dispose(){}};
  const selected=createSkateCanvasArt(options,{makeReady:args=>{calls.push(args);return actor;}});
  assert.equal(selected,actor);assert.equal(calls.length,1);
  assert.equal(calls[0].registry,SPORTS_SHARP_ART_REGISTRY);assert.equal(calls[0].world,world);
  assert.equal(calls[0].rows,SPORTS_JUMP_ROWS[world].rows);assert.equal(calls[0].entry,SPORTS_SKATER_READY_REGISTRY[world]);
 }
});

test('normal factory cannot use an unregistered world or substitute another cast',()=>{
 assert.throws(()=>createSkateCanvasArt({world:'unregistered'}));
 for(const world of ['meadow','dino','moonwood']){
  const other=world==='meadow'?'dino':'meadow';
  assert.throws(()=>createSkateCanvasArt({world},{makeReady:options=>createSportsSkaterReadyAtlas({...options,entry:SPORTS_SKATER_READY_REGISTRY[other]})}),/registration required/);
 }
});

test('every normal renderer factory keeps immediate all-direction jump frames and closes actual initial and late background allocations',async()=>{
 const read=file=>JSON.parse(fs.readFileSync(new URL(`../../public${file}`,import.meta.url),'utf8'));
 for(const world of ['meadow','dino','moonwood']){
 const metadata=read(SPORTS_SKATER_READY_REGISTRY[world].metadata),closes=[];
 let finishFull;
 const selected=createSkateCanvasArt({world},
  {makeReady:options=>createSportsSkaterReadyAtlas({...options,
   decodeAtlas:async()=>({image:{name:'actual-initial-owner'},metadata,close(){closes.push('initial');}}),
   decodeFull:({view})=>new Promise(resolve=>{finishFull=()=>resolve({image:{name:'late-full-owner'},metadata:read(SPORTS_SHARP_ART_REGISTRY.skater[world][view].metadata),close(){closes.push('late-full');}});}),
  })});
 assert.equal(await selected.ready,true);
 for(let view=0;view<8;view++)for(const phase of [0,.25,.5,.75]){
  const frame=selected.select(view,'jump',0,{actionPhase:phase});assert.equal(frame.view,view);assert.equal(frame.frame.phase,phase);
 }
 await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof finishFull,'function');
 selected.dispose();selected.dispose();finishFull();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(closes.sort(),['initial','late-full']);assert.equal(selected.frame(),null);
 assert.equal(selected.snapshot().decodedBytes,0);assert.deepEqual(selected.snapshot().decodedOwnerKeys,[]);
 }
});

test('each normal factory starts only the existing original pool after a genuine initial fault and disposes it once',async()=>{
 for(const world of ['meadow','dino','moonwood']){
  let rejectInitial,created=0,closed=0;
  const fallback={ready:Promise.resolve(true),frame:()=>({view:3,frame:{state:'jump'}}),select:()=>({view:3,frame:{state:'jump'}}),snapshot:()=>({decodedOwnerKeys:['actual-original-full3'],decodedBytes:1536*3840*4,failedRows:[3]}),dispose(){closed++;}};
  const selected=createSkateCanvasArt({world},{makeReady:options=>createSportsSkaterReadyAtlas({...options,decodeAtlas:()=>new Promise((resolve,reject)=>{rejectInitial=reject;}),decodeFull:()=>{throw new Error('No parallel ready/full allocation on initial failure');},createFallback:()=>{created++;return fallback;}})});
  assert.equal(created,0);rejectInitial(new Error('Actual essential image failed'));assert.equal(await selected.ready,true);assert.equal(created,1);
  assert.equal(selected.select(3,'jump',0,{actionPhase:.5}).view,3);assert.equal(selected.snapshot().strategy,'existing-full/compact-row-fallback');assert.deepEqual(selected.snapshot().failedRows,[3]);
  selected.dispose();selected.dispose();assert.equal(closed,1);assert.equal(selected.frame(),null);
 }
});
