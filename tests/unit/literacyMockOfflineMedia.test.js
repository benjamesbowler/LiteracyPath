import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareMockOfflineMedia,mockOfflineMediaPaths,MOCK_OFFLINE_MEDIA_MAX_ASSETS } from '../../src/utils/literacyMockOfflineMedia.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
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
 first.resolve('/audio/a.mp3');
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

test('a retained pack does not rewrite cached bytes or allocate hundreds of idle media URLs',async()=>{
 const env=environment();let writes=0,created=0;
 const open=env.options.cacheStorage.open;
 env.options.cacheStorage.open=async()=>{const cache=await open();return {...cache,put:async(...args)=>{writes++;await cache.put(...args);}};};
 env.options.createObjectURL=()=>`blob:lazy-${++created}`;
 const paths=['/audio/a.mp3','/audio/b.mp3','/images/picture.png'];
 const first=await prepareMockOfflineMedia(paths,env.options);
 assert.equal(created,0,'Preparing a large offline pool must not create a live URL for every possible question');
 const source=first.resolve(paths[0]);assert.equal(created,1);assert.equal(first.resolve(paths[0]),source);first.dispose();
 assert.equal(writes,3);
 const cached=await prepareMockOfflineMedia(paths,{...env.options,fetcher:()=>{throw Error('offline');}});
 assert.equal(writes,3,'Verified cache hits must not write every asset again');cached.dispose();
});

test('a stalled download times out, aborts its request and never declares the device ready',async()=>{
 const env=environment();let aborted=false;
 await assert.rejects(()=>prepareMockOfflineMedia(['/audio/stalled.mp3'],{...env.options,timeoutMs:20,
  fetcher:(_path,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'));},{once:true}))}),/timed out/);
 assert.equal(aborted,true);
});

test('an exhausted object-URL allocator falls back to the exact source without crashing question rendering',async()=>{
 const env=environment(),path='/audio/a.mp3';
 const pack=await prepareMockOfflineMedia([path],{...env.options,createObjectURL:()=>{throw Error('Device URL allocation failed');}});
 assert.equal(pack.resolve(path),path);pack.dispose();
});

test('a slow download that keeps receiving bytes does not time out as a frozen request',async()=>{
 const env=environment();let sent=0;
 const pack=await prepareMockOfflineMedia(['/audio/slow.mp3'],{...env.options,timeoutMs:30,
  fetcher:async()=>new Response(new ReadableStream({async pull(controller){await new Promise(resolve=>setTimeout(resolve,10));controller.enqueue(new Uint8Array([++sent]));if(sent===8)controller.close();}}),{headers:{'content-type':'audio/mpeg'}})});
 assert.equal(pack.bytes,8);pack.dispose();
});
test('reviewed legacy picture directories can be retained for the new material, while other media routes stay private',async()=>{
 const env=environment(),paths=['/media/vocabulary/images/towel.webp','/media/initial-sounds/images/t/table.webp','/media/final-sounds/images/b/cob.webp','/media/rhyming/images/tag.webp'];
 const pack=await prepareMockOfflineMedia(paths,env.options);assert.equal(pack.assets,4);pack.dispose();
 for(const path of ['/media/student/profile','/media/vocabulary/private/towel.webp','/media/vocabulary/images/../private'])
  await assert.rejects(()=>prepareMockOfflineMedia([path],env.options),/unavailable/);
});

test('every current V9 deliverable media path crosses the actual offline cache boundary',async()=>{
 const bank=(await loadLiteracyMockBank({contentVersion:'literacy-mock-v9'})).filter(item=>item.adaptiveMixedEligible || item.tutorialOnly);
 const paths=mockOfflineMediaPaths(bank);
 assert.ok(paths.includes('/media/final-sounds/images/b/cob.webp'),'The approved reading picture that blocked live preparation is covered.');
 for(let offset=0;offset<paths.length;offset+=MOCK_OFFLINE_MEDIA_MAX_ASSETS){
  const batch=paths.slice(offset,offset+MOCK_OFFLINE_MEDIA_MAX_ASSETS),env=environment();
  const pack=await prepareMockOfflineMedia(batch,env.options);
  assert.equal(pack.assets,batch.length);assert.equal(env.fetched.length,batch.length);
  for(const path of batch)pack.resolve(path);
  pack.dispose();assert.equal(env.revoked.length,batch.length);
 }
});
