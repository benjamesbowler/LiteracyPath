import test from 'node:test';import assert from 'node:assert/strict';
import {sportsArtView,sportsArtSource,validateSportsArtMetadata,createDirectionalSportsArt} from '../../src/components/learn/games/games/sportsDirectionalArt.js';
const metadata=(view=0)=>({kind:'driver',world:'meadow',character:'bouncy',view,runtime:`${sportsArtSource('driver','meadow',view)}.webp`,runtimeSha256:'a'.repeat(64),modelSha256:'b'.repeat(64),cell:[256,256],viewSheet:[1024,1536],decodedBytes:1024*1536*4,pixelsPerUnit:256/3.28,states:['drive','turn_left','turn_right','brake','recover','celebrate'],phases:[0,.25,.5,.75],frames:['drive','turn_left','turn_right','brake','recover','celebrate'].flatMap((state,row)=>[0,.25,.5,.75].map((phase,col)=>({state,phase,cell:[col*256,row*256,256,256],groundAnchor:[128,208],opaqueBounds:[20,30,230,240]})))});
test('registered athlete art matches the actual driver/skater front convention and rejects forged/cropped metadata',()=>{
 const common={actorX:0,actorZ:0,yaw:0,cameraX:0};assert.equal(sportsArtView('driver',{...common,cameraZ:5}),0);assert.equal(sportsArtView('skater',{...common,cameraZ:-5}),0);assert.equal(sportsArtView('skater',{...common,yaw:Math.PI,cameraZ:5}),0);
 const raw=metadata();assert.ok(validateSportsArtMetadata(raw,{kind:'driver',world:'meadow',view:0}));for(const patch of [{world:'moonwood'},{runtime:'https://external.example/actor.webp'},{decodedBytes:1},{frames:raw.frames.slice(1)}])assert.equal(validateSportsArtMetadata({...raw,...patch},{kind:'driver',world:'meadow',view:0}),null);
});
test('only the current and one adjacent camera sheet are decoded; stale and final owners release actual images',async()=>{
 const pending=new Map(),closed=[];const decode=({view})=>new Promise(resolve=>pending.set(view,()=>resolve({image:{width:1024,height:1536},metadata:metadata(view),close:()=>closed.push(view)})));
 const art=createDirectionalSportsArt({kind:'driver',world:'meadow',decode});pending.get(0)();await art.ready;assert.equal(art.frame().view,0);art.select(0,'turn_left',.1);pending.get(1)();await Promise.resolve();assert.deepEqual(art.snapshot().decodedViews,[0,1]);
 art.select(3,'brake',.1);assert.deepEqual(closed,[1]);pending.get(3)();await Promise.resolve();assert.deepEqual(art.snapshot().decodedViews,[3]);assert.ok(closed.includes(0));art.select(3,'recover',.1);assert.equal(art.frame().frame.state,'recover');art.dispose();pending.get(4)();await Promise.resolve();assert.equal(art.snapshot().decodedBytes,0);assert.deepEqual(closed.sort(),[0,1,3,4]);art.dispose();assert.equal(closed.length,4);
});
test('a failed adjacent view remains unavailable rather than pretending to be a pending decode',async()=>{
 const closed=[];const art=createDirectionalSportsArt({kind:'driver',world:'meadow',decode:async({view})=>{
  if(view===1)throw new Error('offline');return{image:{width:1024,height:1536},metadata:metadata(view),close:()=>closed.push(view)};
 }});
 await art.ready;art.select(0,'drive');await new Promise(resolve=>setImmediate(resolve));
 const state=art.snapshot();assert.deepEqual(state.decodedViews,[0]);assert.deepEqual(state.pendingViews,[]);
 assert.deepEqual(state.unavailableViews,[1]);assert.equal(state.failedViews,1);assert.equal(art.frame().view,0);
 art.dispose();assert.deepEqual(closed,[0]);assert.equal(art.snapshot().decodedBytes,0);
});
