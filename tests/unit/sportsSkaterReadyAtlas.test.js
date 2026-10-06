import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {SPORTS_SHARP_ART_REGISTRY as registry} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {SPORTS_JUMP_ROWS} from '../../src/components/learn/games/games/sportsJumpRowRegistry.js';
import {readyAtlasPixelDifferences} from '../../artwork/games/spell-skate/derive_ready_jump_atlas.mjs';
import {SPORTS_SKATER_READY_FORMAT,SPORTS_SKATER_READY_BYTES,SPORTS_SKATER_READY_PAIR_BYTES,sportsSkaterReadyFrameRegistration,
 validSportsSkaterReadyEntry,completeSportsSkaterReadyRegistry,validateSportsSkaterReadyMetadata,createSportsSkaterReadyAtlas} from '../../src/components/learn/games/games/sportsSkaterReadyAtlas.js';
import {assertReadyAtlasPixels,assertReadyAtlasBytes,buildSportsSkaterReadyRegistry,sportsSkaterReadyRegistrySource} from '../../tools/generateSportsSkaterReadyRegistry.mjs';

const world='moonwood',sources=registry.skater[world],rows=SPORTS_JUMP_ROWS[world].rows;
const read=file=>JSON.parse(fs.readFileSync(new URL(`../../public${file}`,import.meta.url),'utf8'));
const full=view=>read(sources[view].metadata);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('readback diagnostic distinguishes actual alpha/visible RGB/zero-alpha RGB and registration padding without suppressing channels',()=>{
 const expected=Buffer.alloc(4*2*4),actual=Buffer.from(expected),frame={cell:[0,0,4,2],opaqueBounds:[1,0,3,2],sourceView:5,state:'jump',phase:.5};
 // Invisible padding RGB, visible body RGB, and an alpha difference are three
 // independent causes. The diagnostic must still fail complete equality.
 actual[0]=17;expected[4+3]=actual[4+3]=128;expected[4]=22;actual[4]=23;actual[(1*4+2)*4+3]=1;
 const result=readyAtlasPixelDifferences(expected,actual,{width:4,height:2,frames:[frame]});
 assert.equal(result.changedChannels,3);assert.equal(result.changedPixels,3);assert.equal(result.alphaDifferences,1);
 assert.equal(result.nonzeroAlphaRgbDifferences,1);assert.equal(result.zeroAlphaOnlyRgbDifferences,1);
 assert.equal(result.scope.paddingOutsideRegisteredOpaqueBounds.zeroAlphaOnlyRgbDifferences,1);
 assert.equal(result.scope.insideRegisteredOpaqueBounds.nonzeroAlphaRgbDifferences,1);
 assert.equal(result.scope.insideRegisteredOpaqueBounds.alphaDifferences,1);
 assert.deepEqual(result.firstLocations.alpha[0].pixel,[2,1]);assert.equal(result.perCell[0].sourceView,5);
 assert.equal(result.firstLocations.zeroAlphaOnlyRgb[0].scope,'paddingOutsideRegisteredOpaqueBounds');
});

function registration(selectedWorld=world){
 const world=selectedWorld,sources=registry.skater[world],character=sources[0].character,full=view=>read(sources[view].metadata);
 const frames=[],hashes=[];
 for(let view=0;view<8;view++)for(const state of view===0?['coast','jump']:['jump'])for(const original of full(view).frames.filter(frame=>frame.state===state)){
  frames.push({...structuredClone(original),sourceView:view,fullCell:[...original.cell],cell:[original.cell[0],(state==='coast'?0:view+1)*384,384,384],
   pixelsPerUnit:sources[view].pixelsPerUnit,shadowPixelsPerUnit:sources[view].shadowPixelsPerUnit});
  hashes.push(sha(JSON.stringify(sportsSkaterReadyFrameRegistration(original))));
 }
 const stem=`/game-assets/spell-skate/recovery384-action-atlas-candidate/${character}/coast-jump-v1`,fixed=sha('unit-encoded-image');
 const metadata={format:SPORTS_SKATER_READY_FORMAT,kind:'skater',world,character,runtime:`${stem}.webp`,runtimeBytes:123,
  runtimeSha256:fixed,modelSha256:sources[0].modelSha256,decodedSha256:fixed,decodedBytes:SPORTS_SKATER_READY_BYTES,recipeSha256:fixed,
  cell:[384,384],viewSheet:[1536,3456],phases:[0,.25,.5,.75],states:['coast','jump'],
  lineage:{basis:'decoded-current-runtime-RGBA',changedChannels:0,sources:structuredClone(sources)},frames};
 const bytes=Buffer.from(JSON.stringify(metadata));
 const entry={format:metadata.format,world,character,runtime:metadata.runtime,runtimeBytes:metadata.runtimeBytes,runtimeSha256:fixed,
  metadata:`${stem}.json`,metadataBytes:bytes.length,metadataSha256:sha(bytes),decodedSha256:fixed,decodedBytes:SPORTS_SKATER_READY_BYTES,
  recipeSha256:fixed,viewSheet:metadata.viewSheet,modelSha256:metadata.modelSha256,sources:structuredClone(sources),frameRegistrationSha256:hashes};
 return{entry,metadata};
}

test('unselected finite coast0/32-jump registration preserves every original contact and rejects altered valid-range points',async()=>{
 const {entry,metadata}=registration();assert.equal(validSportsSkaterReadyEntry(entry,registry,world),true);
 assert.ok(await validateSportsSkaterReadyMetadata(metadata,entry,registry,world));
 for(const mutate of [raw=>{raw.frames[8].soleContacts[0][0]+=1;},raw=>{raw.frames[16].sourceView=2;},raw=>{raw.frames[8].cell[1]=0;},raw=>{raw.lineage.changedChannels=1;}]){
  const changed=structuredClone(metadata);mutate(changed);assert.equal(await validateSportsSkaterReadyMetadata(changed,entry,registry,world),null);
 }
 const unknown=structuredClone(entry);unknown.runtime='/arbitrary.png';assert.equal(validSportsSkaterReadyEntry(unknown,registry,world),false);
 assert.equal(SPORTS_SKATER_READY_BYTES,21_233_664);assert.equal(SPORTS_SKATER_READY_PAIR_BYTES,44_826_624);
 assert.ok(SPORTS_SKATER_READY_PAIR_BYTES<47_185_920,'Preserve existing full-pair ceiling rather than widening it');
});

function harness({initialFailure=false}={}){
 const {entry,metadata}=registration(),pending=[],closes=[],calls=[],allocations=[];let initialResolve,initialReject;
 const initial=new Promise((resolve,reject)=>{initialResolve=resolve;initialReject=reject;});
 const image=(name,raw)=>{let closed=false;const allocation={id:allocations.length,name,closeCount:0};allocations.push(allocation);return{image:{name},metadata:raw,close(){assert.equal(closed,false,`${name} allocation${allocation.id} closes exactly once`);closed=true;allocation.closeCount++;closes.push(name);}};};
 const art=createSportsSkaterReadyAtlas({entry,registry,rows,world,decodeAtlas:()=>initial,decodeFull:({view})=>new Promise(resolve=>{
  calls.push(view);pending.push({view,finish(){resolve(image(`full:${view}`,full(view)));}});
 })});
 function deliverInitial(){if(initialFailure)initialReject(new Error('missing initial atlas'));else initialResolve(image('initial',metadata));}
 async function finish(view){await tick();const index=pending.findIndex(row=>row.view===view);assert.ok(index>=0,`pending full${view}`);pending.splice(index,1)[0].finish();await tick();}
 return{art,pending,calls,closes,allocations,deliverInitial,finish,image};
}

test('first essential actor decode gives all eight jump directions synchronously while full-state decode remains pending',async()=>{
 const h=harness();assert.equal(h.art.frame(),null);h.deliverInitial();assert.equal(await h.art.ready,true);
 assert.deepEqual(h.art.snapshot().pendingViews,[0]);
 for(const phase of [0,.25,.5,.75])for(let view=0;view<8;view++){
  const pose=h.art.select(view,'jump',0,{actionPhase:phase});assert.equal(pose.view,view);assert.equal(pose.wantedView,view);
  assert.equal(pose.frame.sourceView,view);assert.equal(pose.frame.state,'jump');assert.equal(pose.frame.phase,phase);
  assert.equal(pose.metadata.pixelsPerUnit,sources[view].pixelsPerUnit);assert.equal(pose.shadowPixelsPerUnit,sources[view].shadowPixelsPerUnit);
  assert.equal(pose.fallbackState,false);assert.equal(pose.image.name,'initial');
 }
 await tick();
 assert.deepEqual(h.calls,[0],'Spin does not request another image, cache wait or state gate');
 await h.finish(0);assert.equal(h.art.snapshot().decodedBytes,44_826_624);assert.equal(h.art.snapshot().decodedOwnerKeys.length,2);
 h.art.dispose();h.art.dispose();assert.deepEqual(h.closes.sort(),['full:0','initial']);assert.equal(h.art.frame(),null);
});

test('full-state handoff uses the genuine original frame and closes cancelled late allocation before another can start',async()=>{
 const h=harness();h.deliverInitial();await h.art.ready;await tick();
 const held=h.art.select(3,'land',0,{actionPhase:.5});assert.equal(held.frame.state,'coast');assert.equal(held.view,0);assert.equal(held.requestedState,'land');assert.equal(held.fallbackState,true);
 assert.deepEqual(h.calls,[0]);await h.finish(0);assert.ok(h.closes.includes('full:0'));assert.deepEqual(h.calls,[0,3]);
 await h.finish(3);const actual=h.art.frame();assert.equal(actual.frame.state,'land');assert.equal(actual.frame.phase,.5);assert.equal(actual.view,3);assert.equal(actual.fallbackState,false);
 assert.equal(h.art.snapshot().decodedBytes,44_826_624);h.art.select(0,'coast');await tick();assert.ok(h.closes.includes('full:3'));
 h.art.dispose();for(const item of h.pending.splice(0))item.finish();await tick();
 assert.equal(h.art.snapshot().decodedBytes,0);assert.equal(new Set(h.allocations.map(item=>item.id)).size,h.allocations.length);
 assert.ok(h.allocations.every(item=>item.closeCount===1),'Every actual allocation closes once, including a new allocation of the same view');
 assert.equal(h.closes.length,h.allocations.length);assert.equal(h.art.frame(),null);
});

test('rapid full direction changes and Exit retain one real initial image and close every late full bitmap once',async()=>{
 const h=harness();h.deliverInitial();await h.art.ready;await tick();h.art.select(2,'push');h.art.select(5,'recover');
 await h.finish(0);assert.deepEqual(h.calls,[0,5]);
 h.art.dispose();await h.finish(5);assert.deepEqual(h.closes.sort(),['full:0','full:5','initial']);
 assert.equal(h.art.snapshot().decodedOwnerKeys.length,0);assert.equal(h.art.snapshot().decodedBytes,0);assert.equal(h.art.frame(),null);
});

test('a missing initial atlas starts the existing finite fallback only after initial failure and cannot create a third owner',async()=>{
 const {entry}=registration();let attempts=0,fallbacks=0,releases=0,selections=0;
 const existing={ready:Promise.resolve(true),frame:()=>({view:3,frame:{state:'jump'}}),select(){selections++;return this.frame();},snapshot:()=>({decodedOwnerKeys:['full:2','jump:3'],decodedBytes:25_952_256}),dispose(){releases++;}};
 const art=createSportsSkaterReadyAtlas({entry,registry,rows,world,decodeAtlas:async()=>{attempts++;throw new Error('actual asset fault');},createFallback:()=>{fallbacks++;return existing;}});
 assert.equal(await art.ready,true);art.select(3,'jump');art.select(4,'jump');assert.equal(attempts,1);assert.equal(fallbacks,1);assert.equal(selections,2);
 assert.equal(art.snapshot().strategy,'existing-full/compact-row-fallback');assert.match(art.snapshot().atlasFailure,/actual asset fault/);
 art.dispose();art.dispose();assert.equal(releases,1);assert.equal(art.frame(),null);
});

test('Exit during initial graphics decode closes late real image and never starts fallback or full-state decode',async()=>{
 const {entry,metadata}=registration();let finish,closes=0,otherDecode=0;
 const pending=new Promise(resolve=>{finish=resolve;});
 const art=createSportsSkaterReadyAtlas({entry,registry,rows,world,decodeAtlas:()=>pending,decodeFull:async()=>{otherDecode++;},createFallback:()=>{otherDecode++;}});
 art.dispose();finish({image:{},metadata,close(){closes++;}});assert.equal(await art.ready,false);assert.equal(closes,1);assert.equal(otherDecode,0);
 assert.equal(art.snapshot().decodedBytes,0);assert.equal(art.frame(),null);
});

test('notification failure cannot misclassify a delivered atlas as an asset fault or allocate an overlapping fallback',async()=>{
 const {entry,metadata}=registration();let initialCloses=0,fullCloses=0,fallbackCalls=0;
 const art=createSportsSkaterReadyAtlas({entry,registry,rows,world,onChange:()=>{throw new Error('consumer notification failed');},
  decodeAtlas:async()=>({image:{},metadata,close(){initialCloses++;}}),
  decodeFull:async({view})=>({image:{},metadata:full(view),close(){fullCloses++;}}),createFallback:()=>{fallbackCalls++;}});
 assert.equal(await art.ready,true);await tick();assert.equal(fallbackCalls,0);assert.equal(art.snapshot().atlasFailure,null);
 assert.equal(art.snapshot().decodedOwnerKeys.length,2);assert.equal(art.select(7,'jump').view,7);assert.match(art.snapshot().notificationErrors[0],/consumer notification failed/);
 art.dispose();art.dispose();assert.equal(initialCloses,1);assert.equal(fullCloses,1);
});

test('complete unused registry requires exactly the three current original worlds with their own source identities',()=>{
 const table=Object.fromEntries(['meadow','dino','moonwood'].map(world=>[world,registration(world).entry]));
 assert.equal(completeSportsSkaterReadyRegistry(table,registry),true);
 for(const mutate of [value=>{delete value.dino;},value=>{value.unknown=value.meadow;},value=>{value.dino=value.meadow;},
  value=>{value.moonwood.sources[5].modelSha256=sha('another model');}]){
  const changed=structuredClone(table);mutate(changed);assert.equal(completeSportsSkaterReadyRegistry(changed,registry),false);
  assert.throws(()=>sportsSkaterReadyRegistrySource(changed),/partial or unknown-world/);
 }
 const text=sportsSkaterReadyRegistrySource(table);assert.match(text,/never hand edit/);assert.match(text,/SPORTS_SKATER_READY_REGISTRY/);
});

test('sole registry author fails without returning a partial table when any world is missing or stale',async()=>{
 const requested=[];
 await assert.rejects(buildSportsSkaterReadyRegistry('/unit-input',{loadWorld:async({world})=>{
  requested.push(world);if(world==='dino')throw new Error('missing exact Dino delivery');return registration(world).entry;
 }}),/missing exact Dino delivery/);
 assert.deepEqual(requested,['meadow','dino']);
 await assert.rejects(buildSportsSkaterReadyRegistry('/unit-input',{loadWorld:async({world})=>{
  const entry=registration(world).entry;if(world==='moonwood')entry.metadata='/wrong-table.json';return entry;
 }}),/moonwood: finite source entry/);
 const complete=await buildSportsSkaterReadyRegistry('/unit-input',{loadWorld:async({world})=>registration(world).entry});
 assert.deepEqual(Object.keys(complete),['meadow','dino','moonwood']);assert.equal(completeSportsSkaterReadyRegistry(complete,registry),true);
});

test('every cast candidate binds all original contact registrations rather than accepting changed in-range contact points',async()=>{
 for(const world of ['meadow','dino','moonwood']){
  const {entry,metadata}=registration(world);assert.ok(await validateSportsSkaterReadyMetadata(metadata,entry,registry,world));
  const changed=structuredClone(metadata);changed.frames[23].palmAnchors[0][0]+=1;
  assert.equal(await validateSportsSkaterReadyMetadata(changed,entry,registry,world),null);
  const alteredOrigin=structuredClone(metadata);alteredOrigin.frames[18].contactWorld.tyres[0][1]+=.01;
  assert.equal(await validateSportsSkaterReadyMetadata(alteredOrigin,entry,registry,world),null);
 }
});

test('authoring rejects same-length encoded hash changes and truncated delivery rather than trusting declared filenames',()=>{
 const actual=Buffer.from('registered bytes'),binding={length:actual.length,sha256:sha(actual)};
 assert.doesNotThrow(()=>assertReadyAtlasBytes(actual,binding,'delivery'));
 const changed=Buffer.from(actual);changed[3]^=1;assert.throws(()=>assertReadyAtlasBytes(changed,binding,'delivery'),/fingerprint/);
 assert.throws(()=>assertReadyAtlasBytes(actual.subarray(1),binding,'delivery'),/encoded length/);
});

test('source table readbacks require identical visible and invisible RGBA channels',()=>{
 const expected=Buffer.from([21,22,23,0,70,80,90,128]);assert.equal(assertReadyAtlasPixels(Buffer.from(expected),expected,'pose'),sha(expected));
 for(const offset of [0,5,7]){const changed=Buffer.from(expected);changed[offset]^=1;assert.throws(()=>assertReadyAtlasPixels(changed,expected,'pose'),/zero changed RGBA channels/);}
 assert.throws(()=>assertReadyAtlasPixels(expected.subarray(1),expected,'pose'),/decoded length/);
});
