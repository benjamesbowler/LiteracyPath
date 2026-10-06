import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {SPORTS_JUMP_ROWS} from '../../src/components/learn/games/games/sportsJumpRowRegistry.js';
import {SPORTS_SHARP_ART_REGISTRY as registry} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {validJumpRowPilotTable,validateJumpRowPilotMetadata,createSportsJumpRowPilot,createSportsSkaterArt} from '../../src/components/learn/games/games/sportsJumpRowPilot.js';
import {buildSportsJumpRowsRegistry} from '../../tools/generateSportsJumpRowsRegistry.mjs';

sharp.concurrency(2);
const root=new URL('../../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const raw=(world,view)=>JSON.parse(read(`public${SPORTS_JUMP_ROWS[world].rows[view].metadata}`));
const full=(world,view)=>JSON.parse(read(`public${registry.skater[world][view].metadata}`));

test('all24 selected-world jump rows preserve delivered RGBA, original contact registration and finite source fingerprints',async()=>{
 assert.deepEqual(await buildSportsJumpRowsRegistry(),SPORTS_JUMP_ROWS,'The active registry can regenerate from current art/model inputs after runtime code changes');
 assert.equal(createSportsSkaterArt,createSportsJumpRowPilot,'Normal play uses the proved unified allocator, without a parallel full bank');
 for(const [world,source]of Object.entries(SPORTS_JUMP_ROWS)){
  assert.ok(Object.isFrozen(source)&&Object.isFrozen(source.rows)&&Object.isFrozen(source.rows[0]));
  assert.equal(validJumpRowPilotTable(source.rows,registry,world),true);
  assert.equal(validJumpRowPilotTable(source.rows,registry,world==='dino'?'meadow':'dino'),false);
  assert.equal(source.rows.reduce((n,row)=>n+row.runtimeBytes,0),source.maximumEncodedBytes);
  assert.equal(source.rows.reduce((n,row)=>n+row.metadataBytes,0),source.maximumMetadataEncodedBytes);
  for(const row of source.rows){
   const original=full(world,row.view),registration=registry.skater[world][row.view],metadata=raw(world,row.view);
   assert.ok(validateJumpRowPilotMetadata(metadata,row,registration));
   assert.equal(sha(read(`public${row.metadata}`)),row.metadataSha256);
   assert.equal(sha(read(`public${row.runtime}`)),row.runtimeSha256);
   assert.equal(sha(read(metadata.lineage.originalSourcePng)),metadata.lineage.originalSourcePngSha256);
   const oldPixels=await sharp(read(`public${registration.runtime}`)).extract({left:0,top:1920,width:1536,height:384}).ensureAlpha().raw().toBuffer();
   const newPixels=await sharp(read(`public${row.runtime}`)).ensureAlpha().raw().toBuffer();
   assert.equal(oldPixels.equals(newPixels),true,`${world}/${row.view} must change zero RGBA channels`);
   assert.equal(sha(newPixels),row.decodedCropSha256);
   for(const [index,frame]of metadata.frames.entries()){
    const prior=original.frames.filter(frame=>frame.state==='jump')[index];
    assert.deepEqual(frame.fullCell,prior.cell);
    for(const key of ['phase','groundAnchor','opaqueBounds','tyreContacts','soleContacts','palmAnchors','contactWorld'])assert.deepEqual(frame[key],prior[key]);
   }
   const changed=structuredClone(metadata);changed.world='other';assert.equal(validateJumpRowPilotMetadata(changed,row,registration),null);
  }
 }
});

test('selected-world rows, state/view replacement and missing derivative share only two decoded owners',async()=>{
 for(const world of Object.keys(SPORTS_JUMP_ROWS)){
  const calls=[],closed=[],pending=[],failed=[];
  const cache={ready:Promise.resolve(),get:async view=>{if(view===3){failed.push(view);throw new Error('missing row3');}return{metadata:raw(world,view)};},snapshot:()=>({encodedBytes:0}),dispose(){this.disposed=true;}};
  const allocate=(kind,view,metadata)=>new Promise(resolve=>{calls.push({world,kind,view});pending.push({kind,view,finish(){let count=0;resolve({image:{world,kind,view},metadata,close(){assert.equal(++count,1);closed.push({kind,view});}});}});});
  const art=createSportsJumpRowPilot({world,registry,rows:SPORTS_JUMP_ROWS[world].rows,cache,
   decodeFull:args=>{assert.equal(args.world,world);return allocate('full',args.view,full(world,args.view));},
   decodePilot:record=>allocate('row',record.metadata.view,record.metadata)});
  const finish=async(kind,view)=>{await tick();const index=pending.findIndex(row=>row.kind===kind&&row.view===view);assert.ok(index>=0,`${world}:pending${kind}/${view}`);pending.splice(index,1)[0].finish();await tick();};
  await finish('full',0);await art.ready;
  art.select(0,'coast');await finish('row',1);
  art.select(1,'jump',0,{actionPhase:.75});assert.equal(art.frame().frame.phase,.75);assert.equal(art.frame().metadata.world,world);
  await finish('row',2);assert.equal(art.snapshot().decodedBytes,4_718_592);
  art.select(2,'jump',0,{actionPhase:.25});await finish('full',3);
  art.select(3,'jump',0,{actionPhase:.5});const pose=art.frame();assert.equal(pose.view,3);assert.equal(pose.frame.phase,.5);assert.equal(pose.metadata.format,'skater-384-tight-v2');
  assert.deepEqual(failed,[3]);assert.ok(art.snapshot().decodedOwnerKeys.length<=2);assert.equal(art.snapshot().world,world);
  art.select(3,'land');assert.equal(art.frame().frame.state,'land');
  art.dispose();art.dispose();for(const row of pending.splice(0))row.finish();await tick();
  assert.equal(art.frame(),null);assert.equal(art.snapshot().decodedBytes,0);assert.equal(cache.disposed,true);
  assert.ok(closed.length&&closed.length===new Set(closed.map(row=>`${row.kind}:${row.view}`)).size);
 }
});

test('three-world compressed cache only fetches the selected cast and closes actual decoded row owners',async()=>{
 const originalFetch=globalThis.fetch,originalBitmap=globalThis.createImageBitmap;
 try{
  for(const [world,source]of Object.entries(SPORTS_JUMP_ROWS)){
   const fetches=[],closes=[];let art;
   globalThis.fetch=async url=>{fetches.push(url);const bytes=read(`public${url}`);return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
   globalThis.createImageBitmap=async()=>{const index=closes.length;closes.push(0);return{width:1536,height:384,close(){assert.equal(++closes[index],1);}};};
   try{
    art=createSportsJumpRowPilot({world,registry,rows:source.rows,decodeFull:async({view})=>({image:{width:1536,height:3840},metadata:full(world,view),close(){}})});
    await art.ready;await art.pilotPrefetch;
    assert.equal(art.snapshot().cache.encodedBytes,source.maximumEncodedBytes);assert.equal(art.snapshot().cache.metadataEncodedBytes,source.maximumMetadataEncodedBytes);
    assert.equal(fetches.length,16);assert.ok(fetches.every(url=>url.includes(`/${source.character}/jump/`)));
    art.select(0,'coast');await tick();await tick();art.select(1,'jump');assert.equal(art.frame().view,1);
    art.dispose();await tick();assert.equal(art.snapshot().cache.sourceCount,0);assert.equal(art.snapshot().cache.encodedBytes,0);
    assert.ok(closes.length>0&&closes.every(count=>count===1));
   }finally{art?.dispose();}
  }
 }finally{globalThis.fetch=originalFetch;globalThis.createImageBitmap=originalBitmap;}
});

test('normal early Exit settles cancelled cache workers without reviving rows or releasing an already-cleared resolver',async()=>{
 const originalFetch=globalThis.fetch,requests=[];let closes=0,art;
 globalThis.fetch=(url,{signal})=>new Promise((_resolve,reject)=>{
  requests.push(url);signal.addEventListener('abort',()=>reject(new DOMException('Exit','AbortError')),{once:true});
 });
 try{
  art=createSportsSkaterArt({world:'dino',registry,rows:SPORTS_JUMP_ROWS.dino.rows,
   decodeFull:async()=>({image:{width:1536,height:3840},metadata:full('dino',0),close(){assert.equal(++closes,1);}})});
  assert.equal(await art.ready,true);assert.equal(requests.length,2);
  art.dispose();art.dispose();await art.pilotPrefetch;await tick();
  assert.equal(closes,1);assert.equal(requests.length,2,'Exit cannot start another metadata/image fetch');
  assert.equal(art.frame(),null);assert.equal(art.snapshot().decodedBytes,0);
  assert.equal(art.snapshot().cache.sourceCount,0);assert.equal(art.snapshot().cache.encodedBytes,0);
 }finally{art?.dispose();globalThis.fetch=originalFetch;}
});
