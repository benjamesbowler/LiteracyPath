import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {SPORTS_JUMP_ROW_PILOT} from '../../src/components/learn/games/games/sportsJumpRowPilotRegistry.js';
import {SPORTS_SHARP_ART_REGISTRY as registry} from '../../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {validJumpRowPilotTable,validateJumpRowPilotMetadata,createSportsJumpRowPilot} from '../../src/components/learn/games/games/sportsJumpRowPilot.js';

sharp.concurrency(2);
const root=new URL('../../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root));
const rows=SPORTS_JUMP_ROW_PILOT;
const metadata=view=>JSON.parse(read(`public${rows[view].metadata}`));
const full=view=>JSON.parse(read(`public${registry.skater.dino[view].metadata}`));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('finite8 lossless jump rows retain every delivered RGBA channel and exact32-phase registration',async()=>{
 assert.equal(validJumpRowPilotTable(rows,registry),true);
 assert.equal(validJumpRowPilotTable(rows.slice(1),registry),false);
 const wrong=structuredClone(rows);wrong[0].runtime='/unknown.webp';assert.equal(validJumpRowPilotTable(wrong,registry),false);
 for(const entry of rows){
  const raw=metadata(entry.view),original=full(entry.view),registration=registry.skater.dino[entry.view];
  assert.ok(validateJumpRowPilotMetadata(raw,entry,registration));
  const oldPixels=await sharp(read(`public${registration.runtime}`)).extract({left:0,top:1920,width:1536,height:384}).ensureAlpha().raw().toBuffer();
  const newPixels=await sharp(read(`public${entry.runtime}`)).ensureAlpha().raw().toBuffer();
  assert.equal(oldPixels.equals(newPixels),true,`view${entry.view} must change zero channels`);assert.equal(sha(newPixels),entry.decodedCropSha256);
  assert.equal(sha(read(`public${entry.metadata}`)),entry.metadataSha256);
  for(const [index,frame]of raw.frames.entries()){
   const source=original.frames.filter(frame=>frame.state==='jump')[index];
   assert.deepEqual(frame.fullCell,source.cell);
   for(const key of ['phase','groundAnchor','opaqueBounds','tyreContacts','soleContacts','palmAnchors','contactWorld'])assert.deepEqual(frame[key],source[key]);
  }
  const changed=structuredClone(raw);changed.frames[0].fullCell[1]=0;assert.equal(validateJumpRowPilotMetadata(changed,entry,registration),null);
 }
});

function harness({failView}={}){
 const pending=[],closed=[],calls=[],failedRequests=[];
 const cache={ready:Promise.resolve(),get:async view=>{if(view===failView){failedRequests.push(view);throw new Error('missing finite row');}return{metadata:metadata(view)};},snapshot:()=>({encodedBytes:0,maximumEncodedBytes:1_536_218}),dispose(){this.disposed=true;}};
 const allocate=(type,view,raw)=>new Promise(resolve=>{calls.push(`${type}:${view}`);pending.push({type,view,finish(){let count=0;resolve({image:{type,view},metadata:raw,close(){count++;assert.equal(count,1);closed.push(`${type}:${view}`);}});}});});
 const art=createSportsJumpRowPilot({registry,rows,cache,decodeFull:({view})=>allocate('full',view,full(view)),decodePilot:record=>allocate('row',record.metadata.view,record.metadata)});
 async function finish(type,view){await tick();const index=pending.findIndex(item=>item.type===type&&item.view===view);assert.ok(index>=0,`pending${type}:${view}`);pending.splice(index,1)[0].finish();await tick();}
 return{art,cache,closed,calls,failedRequests,pending,finish};
}

test('one serialized owner replaces full→row→full and reports actual fallback state without blank or fake phase',async()=>{
 const h=harness();await h.finish('full',0);await h.art.ready;
 h.art.select(0,'coast');await h.finish('row',1);
 h.art.select(0,'jump',0,{actionPhase:.5});assert.equal(h.art.frame().frame.state,'jump');assert.equal(h.art.frame().metadata.format,'skater-384-tight-v2');
 assert.deepEqual(h.calls,['full:0','row:1'],'cold first spin prepares compact1, not another full or row0');
 h.art.select(1,'jump',0,{actionPhase:.75});assert.equal(h.art.frame().frame.phase,.75);assert.deepEqual(h.closed,['full:0']);
 await h.finish('row',2);assert.equal(h.art.snapshot().decodedBytes,4_718_592);
 h.art.select(1,'jump',0,{actionPhase:.25});assert.equal(h.art.frame().view,1);
 h.art.select(1,'land');const retained=h.art.frame();assert.ok(retained);assert.equal(retained.frame.state,'jump');assert.equal(retained.requestedState,'land');assert.equal(retained.fallbackState,true);
 // A queued adjacent row is cancelled before allocating; the full state
 // replacement is in the same queue and holds at most two owner records.
 await h.finish('full',1);assert.equal(h.art.frame().frame.state,'land');assert.equal(h.art.frame().fallbackState,false);
 assert.ok(h.art.snapshot().decodedOwnerKeys.length<=2);h.art.dispose();h.art.dispose();await tick();
 assert.equal(h.art.frame(),null);assert.equal(h.art.snapshot().decodedBytes,0);assert.equal(h.cache.disposed,true);
});

test('changing pending angles closes late bitmaps before new allocation; missing row uses actual full source once',async()=>{
 const h=harness({failView:3});await h.finish('full',0);await h.art.ready;
 h.art.select(0,'coast');await tick();
 // Adjacent1 is already decoding. Moving to2 cancels it; no second decode
 // starts until its late bitmap has returned and closed.
 h.art.select(2,'jump');assert.ok(!h.calls.includes('row:2'));await h.finish('row',1);assert.ok(h.closed.includes('row:1'));
 await h.finish('row',2);h.art.select(3,'jump',0,{actionPhase:.5});await h.finish('full',3);
 const pose=h.art.frame();assert.equal(pose.view,3);assert.equal(pose.wantedView,3);assert.equal(pose.frame.state,'jump');assert.equal(pose.frame.phase,.5);assert.equal(pose.metadata.format,'skater-384-tight-v2');
 assert.deepEqual(h.failedRequests,[3]);assert.deepEqual(h.art.snapshot().failedRows,[3]);assert.ok(h.art.snapshot().decodedBytes<=47_185_920);
 h.art.select(3,'jump');await tick();h.art.dispose();
 // Any already-started adjacent row must close after disposal as well.
 for(const item of h.pending.splice(0))item.finish();await tick();assert.equal(h.art.snapshot().decodedBytes,0);
 assert.equal(new Set(h.closed).size,h.closed.length);assert.equal(h.art.frame(),null);
});

test('real requested decode completion schedules its one adjacent before another render/select call',async()=>{
 const h=harness();await h.finish('full',0);await h.art.ready;
 // Even initial delivery starts the same compact jump1 policy; it never
 // spends this slot on a large, cancellable adjacent coast atlas.
 assert.deepEqual(h.calls,['full:0','row:1']);
 h.art.select(2,'jump',0,{actionPhase:.5});await h.finish('row',1);await h.finish('row',2);
 assert.equal(h.art.frame().view,2);assert.equal(h.art.frame().frame.phase,.5);
 assert.ok(h.calls.includes('row:3'),'Next adjacent must begin on actual delivery, not a subsequent render');
 assert.ok(h.closed.includes('full:0'));assert.ok(h.closed.includes('row:1'));
 assert.ok(h.art.snapshot().decodedOwnerKeys.length<=2);
 // A pending adjacent is still a last-owner responsibility when Exit occurs.
 h.art.dispose();for(const item of h.pending.splice(0))item.finish();await tick();
 assert.equal(h.art.snapshot().decodedBytes,0);assert.equal(h.art.frame(),null);
 assert.equal(new Set(h.closed).size,h.closed.length);
});

test('actual finite row-cache fingerprints/8-blob bound are released while normal full registry remains immutable',async()=>{
 const savedFetch=globalThis.fetch,savedBitmap=globalThis.createImageBitmap,fetches=[],closes=[];let art;
 try{
  globalThis.fetch=async url=>{fetches.push(url);const bytes=read(`public${url}`);return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  globalThis.createImageBitmap=async()=>{const index=closes.length;closes.push(0);return{width:1536,height:384,close(){closes[index]++;}};};
  art=createSportsJumpRowPilot({registry,rows,decodeFull:async({view})=>({image:{width:1536,height:3840},metadata:full(view),close(){}})});
  await art.ready;await art.pilotPrefetch;const snapshot=art.snapshot();
  assert.equal(snapshot.cache.encodedBytes,1_536_218);assert.equal(snapshot.cache.readyViews.length,8);assert.equal(fetches.length,16);
  art.select(0,'jump');await tick();await tick();art.select(1,'jump');assert.equal(art.frame().metadata.format,'skater-384-jump-row-pilot-v1');
  art.dispose();await tick();assert.equal(art.snapshot().cache.encodedBytes,0);assert.equal(art.snapshot().cache.sourceCount,0);assert.ok(closes.length>0&&closes.every(count=>count===1));
  assert.equal(registry.skater.dino[0].format,'skater-384-tight-v2');
 }finally{art?.dispose();globalThis.fetch=savedFetch;globalThis.createImageBitmap=savedBitmap;}
});
