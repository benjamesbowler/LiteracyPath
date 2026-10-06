import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDirectionalSportsArt,validateSportsArtMetadata} from '../../src/components/learn/games/games/sportsDirectionalArt.js';
import {RACER_384_CANDIDATE,RACER_384_CANDIDATES,validateRacer384Candidate,decodeRacer384Candidate,createRacerDriverComparisonArt} from '../../src/components/learn/games/games/racerDriverCandidate.js';

const raw=()=>JSON.parse(fs.readFileSync(new URL('../../public'+RACER_384_CANDIDATE.metadata,import.meta.url),'utf8'));
const old=()=>JSON.parse(fs.readFileSync(new URL('../../public/game-assets/sound-racer/recovery/bouncy/view-0-v1.json',import.meta.url),'utf8'));
const context={kind:'driver',world:'meadow',view:0};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const baseline=closed=>createDirectionalSportsArt({kind:'driver',world:'meadow',decode:async({view})=>{
 if(view!==0)throw new Error('No other direction delivered');
 return{metadata:old(),image:{name:'original256'},close:()=>closed.push('original256')};
}});

test('only the three actual registered BACK384 casts are accepted and legacy256 validation remains strict',()=>{
 const source=raw(),valid=validateRacer384Candidate(source,context);assert.ok(valid);valid.frames[0].groundAnchor[0]=0;
 assert.equal(source.frames[0].groundAnchor[0],192);
 assert.equal(validateSportsArtMetadata(source,context),null);
 for(const changed of [{...context,world:'dino'},{...context,world:'unknown'},{...context,view:1},{...context,kind:'skater'}])assert.equal(validateRacer384Candidate(source,changed),null);
 for(const [world,registered] of Object.entries(RACER_384_CANDIDATES)){
  const retained=JSON.parse(fs.readFileSync(new URL('../../public'+registered.metadata,import.meta.url),'utf8'));
  assert.ok(validateRacer384Candidate(retained,{...context,world}));assert.equal(validateSportsArtMetadata(retained,{...context,world}),null);
  assert.equal(validateRacer384Candidate({...retained,character:world==='meadow'?'pip':'bouncy'},{...context,world}),null);
 }
 for(const mutate of [
  value=>value.frames[0].groundAnchor[0]++,
  value=>value.frames[0].tyreContacts.pop(),
  value=>value.frames[0].opaqueBounds[0]=0,
  value=>value.frames[1]=value.frames[0],
  value=>value.pixelsPerUnit=120,
  value=>value.framing.unionPoseCount=1,
  value=>value.runtimeSha256='0'.repeat(64),
 ]){const value=raw();mutate(value);assert.equal(validateRacer384Candidate(value,context),null);}
});

test('all three actual metadata/image fingerprints bind decoding and isolated bitmap owners close once',async()=>{
 const originals={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap};let allocated=0,closed=0;
 globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
 globalThis.createImageBitmap=async()=>{allocated++;return{width:1536,height:2304,close(){closed++;}};};
 try{
  const controller=new AbortController();
  for(const [world,registered] of Object.entries(RACER_384_CANDIDATES)){
   const sheet=await decodeRacer384Candidate({...context,world,signal:controller.signal});
   assert.equal(sheet.metadata.runtimeSha256,registered.runtimeSha256);assert.equal(sheet.metadata.character,registered.character);sheet.close();sheet.close();
  }
  assert.equal(allocated,3);assert.equal(closed,3);
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify({...raw(),pixelsPerUnit:140})).buffer});
  await assert.rejects(decodeRacer384Candidate({...context,signal:controller.signal}),/registration fingerprint/);assert.equal(allocated,3);
  await assert.rejects(decodeRacer384Candidate({...context,view:1,signal:controller.signal}),/Only registered/);assert.equal(allocated,3);
 }finally{Object.assign(globalThis,originals);}
});

test('cancelled late actual bitmap decode closes its owner without returning an image or registered sheet',async()=>{
 const originals={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap};let deliver,closed=0;
 globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
 globalThis.createImageBitmap=()=>new Promise(resolve=>{deliver=()=>resolve({width:1536,height:2304,close(){closed++;}});});
 try{
  const controller=new AbortController(),pending=decodeRacer384Candidate({...context,signal:controller.signal});
  for(let attempt=0;attempt<50&&!deliver;attempt++)await turn();
  assert.equal(typeof deliver,'function');controller.abort();deliver();await assert.rejects(pending,/cancelled/);assert.equal(closed,1);
 }finally{Object.assign(globalThis,originals);}
});

for(const [world,registered] of Object.entries(RACER_384_CANDIDATES))test(`${world} comparison owns exactly one original and registered candidate at the same actual phase and releases both last owners`,async()=>{
 const closed=[],original=createDirectionalSportsArt({kind:'driver',world,decode:async({view})=>{
  if(view!==0)throw new Error('No other direction delivered');
  return{metadata:JSON.parse(fs.readFileSync(new URL(`../../public/game-assets/sound-racer/recovery/${registered.character}/view-0-v1.json`,import.meta.url),'utf8')),image:{name:'original256'},close:()=>closed.push('original256')};
 }});await original.ready;original.select(0,'drive');await turn();
 const slot=createRacerDriverComparisonArt({world,baseline:original,decode:async({view})=>{
  if(view!==0)throw new Error('Only finite BACK candidate delivered');return{image:{name:'candidate384'},metadata:JSON.parse(fs.readFileSync(new URL('../../public'+registered.metadata,import.meta.url),'utf8')),close:()=>closed.push('candidate384')};
 }});
 await slot.ready;assert.equal(slot.snapshot().format,'driver-256-v1');assert.equal(await slot.prepareCandidate(),true);
 assert.equal(slot.snapshot().comparisonDecodedViews,2);assert.equal(slot.snapshot().comparisonDecodedBytes,20447232);
 assert.ok(slot.snapshot().comparisonDecodedBytes<=RACER_384_CANDIDATE.maximumPairBytes);
 assert.equal(slot.switchFormat(RACER_384_CANDIDATE.format),true);
 const frame=slot.select(0,'brake',0,{actionPhase:.25});assert.deepEqual(frame.frame.cell,[384,1152,384,384]);assert.equal(frame.frame.phase,.25);assert.equal(frame.metadata.pixelsPerUnit,registered.pixelsPerUnit);assert.deepEqual(frame.frame.groundAnchor,registered.groundAnchor);
 assert.equal(slot.switchFormat('driver-256-v1'),true);assert.equal(slot.select(0,'brake',0,{actionPhase:.25}).frame.phase,.25);
 assert.equal(slot.switchFormat('arbitrary-512'),false);slot.dispose();slot.dispose();
 assert.deepEqual(closed.sort(),['candidate384','original256']);assert.equal(slot.snapshot().comparisonDecodedBytes,0);assert.equal(slot.frame(),null);
});

test('a pending legacy adjacent owner blocks a third sheet and disposal during candidate preparation cannot revive ownership',async()=>{
 const closed=[],original=baseline(closed);await original.ready;original.select(0,'drive');await turn();let deliver;
 const slot=createRacerDriverComparisonArt({world:'meadow',baseline:original,decode:()=>new Promise(resolve=>{deliver=()=>resolve({image:{},metadata:raw(),close:()=>closed.push('late384')});})});
 const pending=slot.prepareCandidate();assert.equal(typeof deliver,'function');slot.dispose();deliver();assert.equal(await pending,false);
 assert.deepEqual(closed.sort(),['late384','original256']);assert.equal(slot.snapshot().comparisonDecodedViews,0);
 let allocations=0;
 const busy={ready:Promise.resolve(true),snapshot:()=>({view:0,wantedView:0,decodedViews:[0],pendingViews:[1],decodedBytes:6291456}),dispose(){},frame(){},select(){}};
 const bounded=createRacerDriverComparisonArt({world:'meadow',baseline:busy,decode:async()=>{allocations++;}});
 assert.equal(await bounded.prepareCandidate(),false);assert.equal(allocations,0);bounded.dispose();
});
