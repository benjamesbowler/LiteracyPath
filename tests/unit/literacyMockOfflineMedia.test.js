import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareMockOfflineMedia,mockOfflineMediaPaths } from '../../src/utils/literacyMockOfflineMedia.js';
function environment({failPut=false}={}) {
 const entries=new Map(), fetched=[], revoked=[];let created=0;
 return {fetched,revoked,entries,options:{
  cacheStorage:{open:async()=>({match:async key=>entries.get(key)?.clone(),put:async(key,value)=>{if(failPut)throw Error('quota');entries.set(key,value.clone());}})},
  fetcher:async(path,options)=>{fetched.push({path,options});return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':path.includes('/audio/')?'audio/mpeg':'image/png'}});},
  createObjectURL:()=>`blob:fixture-${++created}`,revokeObjectURL:url=>revoked.push(url)
 }};
}
test('the exact public media pack reads back before readiness, reuses retained bytes offline and keeps atlas/audio identities original',async()=>{
 const env=environment(), paths=mockOfflineMediaPaths([{requiredAudioPaths:['/audio/a.mp3'],requiredImagePaths:['/images/atlas.png#sprite=4']}]);
 assert.deepEqual(paths,['/audio/a.mp3','/images/atlas.png']);
 const first=await prepareMockOfflineMedia(paths,env.options);assert.equal(first.assets,2);assert.equal(first.bytes,6);
 assert.match(first.resolve('/images/atlas.png#sprite=4'),/^blob:fixture-\d+#%2Fimages%2Fatlas.png$/);
 assert.ok(env.fetched.every(row=>row.options.credentials==='omit'));first.dispose();assert.equal(env.revoked.length,2);
 const again=await prepareMockOfflineMedia(paths,{...env.options,fetcher:()=>{throw Error('offline');}});assert.equal(again.assets,2);again.dispose();
});
test('storage failure, missing media and private URLs never authorize an offline question',async()=>{
 const denied=environment({failPut:true});await assert.rejects(()=>prepareMockOfflineMedia(['/audio/a.mp3'],denied.options),/quota/);
 const missing=environment();await assert.rejects(()=>prepareMockOfflineMedia(['/audio/a.mp3'],{...missing.options,fetcher:async()=>new Response('missing',{status:404})}),/unavailable/);
 for(const path of ['/api/student','https://elsewhere/audio/a.mp3','/images/../private']) await assert.rejects(()=>prepareMockOfflineMedia([path],missing.options),/unavailable/);
 assert.equal(missing.fetched.length,0);
});
test('an aborted media warmup disposes all created object URLs and cannot produce readiness',async()=>{
 const env=environment(), controller=new AbortController();controller.abort();
 await assert.rejects(()=>prepareMockOfflineMedia(['/audio/a.mp3'],{...env.options,signal:controller.signal}),/cancelled/);
 assert.equal(env.fetched.length,0);
});
test('reviewed legacy picture directories can be retained for the new material, while other media routes stay private',async()=>{
 const env=environment(),paths=['/media/vocabulary/images/towel.webp','/media/initial-sounds/images/t/table.webp','/media/rhyming/images/tag.webp'];
 const pack=await prepareMockOfflineMedia(paths,env.options);assert.equal(pack.assets,3);pack.dispose();
 for(const path of ['/media/student/profile','/media/vocabulary/private/towel.webp','/media/vocabulary/images/../private'])
  await assert.rejects(()=>prepareMockOfflineMedia([path],env.options),/unavailable/);
});
