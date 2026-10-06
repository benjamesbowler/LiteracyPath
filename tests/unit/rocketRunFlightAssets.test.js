import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketFlightAssets } from '../../src/components/learn/games/games/rocketRunFlightAssets.js';

const clips=['cruise','bank_left','bank_right','boost','shield_recover','catch','celebrate'];
function record() {
  const atlas=(id,count)=>({runtime:id==='emergency'?'data:image/webp;base64,actual-independent-test'
    :'/game-assets/rocket-run/flight-actions/test-'+id+'.webp',width:256,height:256,
    frames:Array.from({length:count},(_,i)=>({clip:count===1?'cruise':clips[Math.floor(i/(count/7))],
      phase:count===1?0:(i%(count/7))/(count/7-1)}))});
  return {primary:atlas('primary',42),emergency:atlas('emergency',21),independentIdle:atlas('idle',1)};
}
function banks(fails=new Set()) {
  const requests=[],owners=[],draws=[];
  const makeBank=packet=>{
    const id=Object.keys(packet)[0]; requests.push(id);
    let disposed=false;
    const owner={async preload(){return fails.has(id)?[null]:[{width:256,height:256}];},
      delivery:()=>({[id]:disposed?'disposed':fails.has(id)?'unavailable':'delivered'}),
      draw(_ctx,selected,index){draws.push({selected,index,clip:packet[id].frames[index].clip});return !disposed&&!fails.has(id);},
      dispose(){disposed=true;},disposed:()=>disposed};owners.push(owner);return owner;
  };
  return {makeBank,requests,owners,draws};
}

test('healthy complete bank decodes primary only and draws every original action without idle or emergency owners',async()=>{
  const f=banks(),assets=createRocketFlightAssets(record(),f);
  assert.equal(await assets.preload(),true);
  assert.deepEqual(f.requests,['flight']);
  for(const clip of clips)assert.equal(assets.draw({}, {clip,phase:.5},{}).complete,true);
  assert.deepEqual(f.draws.map(row=>row.clip),clips);
  assert.equal(assets.inspect().decodedImageOwners,1);
  const seen=assets.inspect();seen.delivery.flight='fabricated';
  assert.equal(assets.delivery().flight,'delivered');
  assets.dispose();assert.equal(f.owners[0].disposed(),true);
});

test('failed primary is released before the complete independent emergency bank; idle cannot certify play',async()=>{
  const f=banks(new Set(['flight'])),assets=createRocketFlightAssets(record(),f);
  assert.equal(await assets.preload(),true);assert.deepEqual(f.requests,['flight','emergency']);
  assert.equal(f.owners[0].disposed(),true);
  for(const clip of clips){const pose=assets.draw({}, {clip,phase:.5},{});assert.equal(pose.complete,true);assert.equal(pose.tier,'embedded-registered-actions');}
  assets.dispose();
  const bad=banks(new Set(['flight','emergency'])),idle=createRocketFlightAssets(record(),bad);
  assert.equal(await idle.preload(),false);
  assert.equal(idle.draw({}, {clip:'catch',phase:1},{}).delivered,true);
  assert.equal(idle.draw({}, {clip:'catch',phase:1},{}).complete,false);
  assert.equal(idle.inspect().complete,false);idle.dispose();
});

test('late old decode cannot replace a retried complete bank or resurrect a disposed caller',async()=>{
  const pending=[];let owners=0,released=0;
  const makeBank=packet=>{const id=Object.keys(packet)[0],index=owners++;let disposed=false;
    return {preload:()=>new Promise(resolve=>pending.push(resolve)),delivery:()=>({[id]:disposed?'disposed':'delivered'}),
      draw:()=>!disposed,dispose(){if(!disposed){disposed=true;released++;}},index};};
  const assets=createRocketFlightAssets(record(),{makeBank});
  const first=assets.preload(),second=assets.preload();
  pending[1]([{width:256,height:256}]);assert.equal(await second,true);
  pending[0]([{width:256,height:256}]);assert.equal(await first,false);
  assert.equal(assets.delivery().flight,'delivered');assert.equal(released,1);
  const last=assets.preload();assets.dispose();pending[2]([{width:256,height:256}]);
  assert.equal(await last,false);assert.equal(assets.inspect().decodedImageOwners,0);assert.equal(released,3);
});
