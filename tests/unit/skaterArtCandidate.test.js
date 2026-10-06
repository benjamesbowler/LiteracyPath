import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDirectionalSportsArt,validateSportsArtMetadata} from '../../src/components/learn/games/games/sportsDirectionalArt.js';
import {SKATER_384_CANDIDATE,validateSkater384Candidate,decodeSkater384Candidate,createSkaterComparisonArt} from '../../src/components/learn/games/games/skaterArtCandidate.js';
const context={kind:'skater',world:'meadow',view:0};
const raw=()=>JSON.parse(fs.readFileSync(new URL('../../public'+SKATER_384_CANDIDATE.metadata,import.meta.url),'utf8'));
const old=()=>JSON.parse(fs.readFileSync(new URL('../../public/game-assets/spell-skate/recovery/bouncy/view-0-v1.json',import.meta.url),'utf8'));
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const baseline=closed=>createDirectionalSportsArt({kind:'skater',world:'meadow',decode:async({view})=>{
 if(view!==0)throw new Error('Only retained BACK view available');return{metadata:old(),image:{name:'original256'},close:()=>closed.push('original256')};
}});

test('finite original Bouncy38440pose registration rejects changed contacts, framing and casts while legacy256 remains strict',()=>{
 const source=raw(),valid=validateSkater384Candidate(source,context);assert.ok(valid);valid.frames[0].groundAnchor[0]=0;assert.equal(source.frames[0].groundAnchor[0],192);
 assert.equal(validateSportsArtMetadata(source,context),null);assert.ok(validateSportsArtMetadata(old(),context));
 for(const changed of [{...context,world:'dino'},{...context,world:'moonwood'},{...context,view:1},{...context,kind:'driver'}])assert.equal(validateSkater384Candidate(source,changed),null);
 for(const mutate of [
  value=>value.frames[0].groundAnchor[0]++,value=>value.frames[0].tyreContacts.pop(),value=>value.frames[0].soleContacts.pop(),
  value=>value.frames[0].palmAnchors.pop(),value=>value.frames[0].palmAnchors[0][0]=NaN,value=>value.frames[0].opaqueBounds[0]=0,
  value=>value.frames[1]=value.frames[0],value=>value.pixelsPerUnit=80,value=>value.framing.unionPoseCount=1,value=>value.runtimeSha256='0'.repeat(64),
 ]){const value=raw();mutate(value);assert.equal(validateSkater384Candidate(value,context),null);}
});

test('actual retained metadata and encoded-image fingerprints bind decode, and bitmap disposal is idempotent',async()=>{
 const originals={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap};let allocated=0,closed=0;
 globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
 globalThis.createImageBitmap=async()=>{allocated++;return{width:1536,height:3840,close(){closed++;}};};
 try{
  const controller=new AbortController(),sheet=await decodeSkater384Candidate({...context,signal:controller.signal});assert.equal(sheet.metadata.runtimeSha256,SKATER_384_CANDIDATE.runtimeSha256);sheet.close();sheet.close();assert.equal(allocated,1);assert.equal(closed,1);
  const fetchOriginal=globalThis.fetch;globalThis.fetch=async url=>url.endsWith('.webp')?{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}:fetchOriginal(url);
  await assert.rejects(decodeSkater384Candidate({...context,signal:controller.signal}),/sheet fingerprint/);assert.equal(allocated,1);
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify({...raw(),pixelsPerUnit:80})).buffer});
  await assert.rejects(decodeSkater384Candidate({...context,signal:controller.signal}),/registration fingerprint/);assert.equal(allocated,1);
  await assert.rejects(decodeSkater384Candidate({...context,view:2,signal:controller.signal}),/Only registered/);assert.equal(allocated,1);
 }finally{Object.assign(globalThis,originals);}
});

test('cancelled real late bitmap decode releases without returning a revived source owner',async()=>{
 const originals={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap};let deliver,closed=0;
 globalThis.fetch=async url=>{const bytes=fs.readFileSync(new URL('../../public'+url,import.meta.url));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
 globalThis.createImageBitmap=()=>new Promise(resolve=>{deliver=()=>resolve({width:1536,height:3840,close(){closed++;}});});
 try{
  const controller=new AbortController(),pending=decodeSkater384Candidate({...context,signal:controller.signal});
  for(let attempt=0;attempt<50&&!deliver;attempt++)await turn();assert.equal(typeof deliver,'function');controller.abort();deliver();await assert.rejects(pending,/cancelled/);assert.equal(closed,1);
 }finally{Object.assign(globalThis,originals);}
});

test('same actual40state-phase registration and retained-shadow density use at most two independent owners, both last-closed',async()=>{
 const closed=[],original=baseline(closed);await original.ready;original.select(0,'coast');await turn();
 const slot=createSkaterComparisonArt({world:'meadow',baseline:original,decode:async({view})=>{
  if(view!==0)throw new Error('Only finite BACK384 available');return{image:{name:'candidate384'},metadata:raw(),close:()=>closed.push('candidate384')};
 }});await slot.ready;assert.equal(slot.snapshot().format,'skater-256-v1');assert.equal(await slot.prepareCandidate(),true);
 assert.equal(slot.snapshot().comparisonDecodedViews,2);assert.equal(slot.snapshot().comparisonDecodedBytes,34078720);assert.equal(slot.snapshot().maximumPairBytes,34078720);
 for(const state of raw().states)for(const phase of raw().phases){
  assert.equal(slot.switchFormat(SKATER_384_CANDIDATE.format),true);const next=slot.select(0,state,0,{actionPhase:phase});
  assert.equal(next.frame.state,state);assert.equal(next.frame.phase,phase);assert.deepEqual(next.frame.groundAnchor,SKATER_384_CANDIDATE.groundAnchor);assert.equal(next.shadowPixelsPerUnit,old().pixelsPerUnit);
  assert.equal(slot.switchFormat('skater-256-v1'),true);const retained=slot.select(0,state,0,{actionPhase:phase});assert.equal(retained.frame.state,next.frame.state);assert.equal(retained.frame.phase,next.frame.phase);
 }await turn();assert.equal(slot.snapshot().comparisonDecodedBytes,34078720);assert.equal(slot.switchFormat('arbitrary-512'),false);
 slot.dispose();slot.dispose();assert.deepEqual(closed.sort(),['candidate384','original256']);assert.equal(slot.snapshot().comparisonDecodedBytes,0);assert.equal(slot.frame(),null);
});

test('live or pending adjacent legacy sheets refuse a third owner and preparation disposal cannot resurrect candidates',async()=>{
 let allocated=0;for(const snapshot of [{view:0,wantedView:0,decodedViews:[0,1],pendingViews:[]},{view:0,wantedView:0,decodedViews:[0],pendingViews:[1]}]){
  const busy={ready:Promise.resolve(true),snapshot:()=>({...snapshot,decodedBytes:20971520}),dispose(){},frame(){},select(){}};
  const bounded=createSkaterComparisonArt({world:'meadow',baseline:busy,decode:async()=>{allocated++;}});assert.equal(await bounded.prepareCandidate(),false);bounded.dispose();
 }assert.equal(allocated,0);
 const closed=[],original=baseline(closed);await original.ready;original.select(0,'coast');await turn();let deliver;
 const slot=createSkaterComparisonArt({world:'meadow',baseline:original,decode:()=>new Promise(resolve=>{deliver=()=>resolve({image:{},metadata:raw(),close:()=>closed.push('late384')});})});
 const pending=slot.prepareCandidate();assert.equal(typeof deliver,'function');slot.dispose();deliver();assert.equal(await pending,false);assert.deepEqual(closed.sort(),['late384','original256']);assert.equal(slot.snapshot().comparisonDecodedViews,0);
});
