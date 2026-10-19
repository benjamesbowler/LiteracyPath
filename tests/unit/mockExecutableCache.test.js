import test from 'node:test';
import assert from 'node:assert/strict';
import { retainMockExecutableAssets } from '../../src/utils/mockExecutableCache.js';

test('warm code is verified without rewriting it and only missing stores receive bytes',async()=>{
 const entries=new Map([['/assets/a.js',new Response('code')]]);let writes=0,fetches=0;
 const cache={match:async key=>entries.get(key)?.clone(),put:async(key,value)=>{writes++;entries.set(key,value.clone());}};
 const nextEntries=new Map();
 const empty={match:async key=>nextEntries.get(key)?.clone(),put:async(key,value)=>{writes++;nextEntries.set(key,value.clone());}};
 const result=await retainMockExecutableAssets(['/assets/a.js'],[cache,empty],{fetcher:async()=>{fetches++;throw Error('offline');}});
 assert.equal(result.requested,1);assert.equal(fetches,0);assert.equal(writes,1);
});

test('response bodies that freeze after headers are bounded and cannot claim code readiness',async()=>{
 const cache={match:async()=>null,put:async()=>{throw Error('must not write');}};
 await assert.rejects(()=>retainMockExecutableAssets(['/assets/a.js'],[cache],{timeoutMs:20,
  fetcher:async()=>({ok:true,redirected:false,blob:()=>new Promise(()=>{})})}),/timed out/);
});
