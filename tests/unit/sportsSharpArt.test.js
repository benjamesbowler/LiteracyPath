import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {completeSportsSharpRegistry,validateSportsSharpMetadata,createSportsSharpDecoder,createSportsSharpArt} from '../../src/components/learn/games/games/sportsSharpArt.js';
import {validateSportsArtMetadata} from '../../src/components/learn/games/games/sportsDirectionalArt.js';

const root=new URL('../../',import.meta.url),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(new URL(file,root));
const worlds={meadow:'bouncy',dino:'chompy',moonwood:'pip'};
const metadataBytes=kind=>read(`public/game-assets/${kind==='driver'?'sound-racer':'spell-skate'}/recovery384/bouncy/view-0-v2.json`);
const actual=kind=>JSON.parse(metadataBytes(kind));
// This complete-shaped synthetic table isolates loader/owner behavior. The
// separate48-sheet bank test verifies every actual delivery/source/contact.
function registry(){
 const table={driver:{},skater:{}};
 for(const kind of ['driver','skater'])for(const [world,character]of Object.entries(worlds)){
  const raw=actual(kind),game=kind==='driver'?'sound-racer':'spell-skate';
  table[kind][world]=Array.from({length:8},(_,view)=>({kind,world,character,view,format:raw.format,
   metadata:`/game-assets/${game}/recovery384/${character}/view-${view}-v2.json`,metadataBytes:metadataBytes(kind).length,metadataSha256:sha(metadataBytes(kind)),
   runtime:`/game-assets/${game}/recovery384/${character}/view-${view}-v2.webp`,runtimeBytes:raw.runtimeBytes,runtimeSha256:raw.runtimeSha256,modelSha256:raw.modelSha256,
   decodedBytes:raw.decodedBytes,pixelsPerUnit:raw.pixelsPerUnit,groundAnchor:raw.frames[0].groundAnchor,
   ...(kind==='skater'?{shadowPixelsPerUnit:256/raw.framing.originalOrthoScale}:{})}));
 }
 return table;
}

test('sharp admission requires48 finite directions and leaves retained256 validation strict',()=>{
 const table=registry();assert.equal(completeSportsSharpRegistry(table),true);
 const partial=structuredClone(table);partial.skater.moonwood.pop();assert.equal(completeSportsSharpRegistry(partial),false);
 assert.throws(()=>createSportsSharpArt({kind:'driver',world:'meadow',registry:partial}),/All48/);
 const external=structuredClone(table);external.driver.dino[4].runtime='https://example.invalid/driver.webp';assert.equal(completeSportsSharpRegistry(external),false);
 const wrongBytes=structuredClone(table);wrongBytes.skater.meadow[1].decodedBytes=1;assert.equal(completeSportsSharpRegistry(wrongBytes),false);
 for(const kind of ['driver','skater']){
  const raw=actual(kind),context={kind,world:'meadow',view:0,registered:table[kind].meadow[0]};
  assert.ok(validateSportsSharpMetadata(raw,context));assert.equal(validateSportsArtMetadata(raw,context),null);
  for(const patch of [{modelSha256:'a'.repeat(64)},{frames:raw.frames.slice(1)},{cell:[256,256]},{view:8},{runtimeBytes:1}])assert.equal(validateSportsSharpMetadata({...raw,...patch},context),null);
  const cropped=structuredClone(raw);cropped.frames[0].opaqueBounds[0]=0;assert.equal(validateSportsSharpMetadata(cropped,context),null);
  const contact=structuredClone(raw);contact.frames[0].tyreContacts.pop();assert.equal(validateSportsSharpMetadata(contact,context),null);
  if(kind==='skater'){
   const palm=structuredClone(raw);palm.frames[0].palmAnchors[0][0]=NaN;assert.equal(validateSportsSharpMetadata(palm,context),null);
   const shadow=structuredClone(raw);shadow.framing.originalOrthoScale*=2;assert.equal(validateSportsSharpMetadata(shadow,context),null);
  }
 }
});

test('sharp owner uses current plus one adjacent and preserves physical Skate shadow without a legacy decode',async()=>{
 const table=registry(),pending=new Map(),closed=[];
 const decode=({kind,world,view})=>new Promise(resolve=>pending.set(view,()=>{
  const metadata=actual(kind);metadata.world=world;metadata.view=view;
  resolve({image:{width:1536,height:3840},metadata,close:()=>closed.push(view)});
 }));
 const art=createSportsSharpArt({kind:'skater',world:'meadow',registry:table,decode});pending.get(0)();await art.ready;
 const pose=art.select(0,'jump',0,{actionPhase:.5});assert.equal(pose.shadowPixelsPerUnit,table.skater.meadow[0].shadowPixelsPerUnit);
 assert.equal(pose.frame.state,'jump');assert.equal(pose.frame.phase,.5);
 pending.get(1)();await Promise.resolve();assert.equal(art.snapshot().decodedBytes,47_185_920);assert.equal(art.snapshot().maximumPairBytes,47_185_920);
 art.select(3,'land');assert.deepEqual(closed,[1]);pending.get(3)();await Promise.resolve();assert.equal(art.snapshot().view,3);assert.ok(closed.includes(0));
 art.select(3,'recover');art.dispose();pending.get(4)();await Promise.resolve();assert.equal(art.snapshot().decodedBytes,0);assert.equal(art.frame(),null);
 assert.deepEqual(closed.sort(),[0,1,3,4]);art.dispose();assert.equal(closed.length,4);
});

test('sharp decoder verifies actual source bytes and closes an aborted late bitmap exactly once',async()=>{
 const table=registry(),entry=table.driver.meadow[0],metadata=metadataBytes('driver'),image=read(`public${entry.runtime}`);
 const beforeFetch=globalThis.fetch,beforeBitmap=globalThis.createImageBitmap;let finishDecode,entered;
 const decoded=new Promise(resolve=>{entered=resolve;});let closes=0;
 try{
  globalThis.fetch=async url=>{const data=url===entry.metadata?metadata:image;return{ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};};
  globalThis.createImageBitmap=async()=>{entered();return new Promise(resolve=>{finishDecode=()=>resolve({width:1536,height:2304,close:()=>closes++});});};
  const controller=new AbortController(),pending=createSportsSharpDecoder(table)({kind:'driver',world:'meadow',view:0,signal:controller.signal});
  await decoded;controller.abort();finishDecode();await assert.rejects(pending,/cancelled/);assert.equal(closes,1);
  let allocations=0;globalThis.createImageBitmap=async()=>{allocations++;return{width:1,height:1,close:()=>closes++};};
  const tampered=structuredClone(table);tampered.driver.meadow[0].metadataSha256='a'.repeat(64);
  await assert.rejects(createSportsSharpDecoder(tampered)({kind:'driver',world:'meadow',view:0,signal:new AbortController().signal}),/registration fingerprint/);assert.equal(allocations,0);
  await assert.rejects(createSportsSharpDecoder(table)({kind:'driver',world:'meadow',view:0,signal:new AbortController().signal}),/unregistered/);assert.equal(closes,2);
 }finally{globalThis.fetch=beforeFetch;globalThis.createImageBitmap=beforeBitmap;}
});
