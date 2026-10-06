import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketSkyAssets } from '../../src/components/learn/games/games/rocketRunSkyAssets.js';

function fixture() {
  const images=[],textures=[];
  class Picture{set src(url){this.url=url;if(url)images.push(this);}
    naturalWidth=8;naturalHeight=4;decode(){return Promise.resolve();}}
  const record=Object.fromEntries(['primary','independent','embedded'].map(id=>[id,{width:8,height:4,
    runtime:id==='embedded'?'data:image/webp;base64,actual-test-sky':'/game-assets/rocket-run/space-venues/test-'+id+'.webp'}]));
  const assets=createRocketSkyAssets(record,{ImageClass:Picture,
    makeTexture:image=>{const texture={image,disposed:false,dispose(){this.disposed=true;}};textures.push(texture);return texture;}});
  const settle=async picture=>{await picture.onload?.();await Promise.resolve();await Promise.resolve();};
  return {assets,images,textures,settle};
}

test('healthy sky owns one decoded image/texture and never requests the unused alternatives',async()=>{
  const f=fixture(),loading=f.assets.preload();
  assert.equal(f.images.length,1);await f.settle(f.images[0]);assert.equal(await loading,true);
  assert.equal(f.images.length,1);assert.equal(f.assets.inspect().selected,'primary');
  assert.equal(f.assets.inspect().decodedBaseBytes,128);assert.equal(f.assets.inspect().textureOwners,1);
  assert.equal(f.assets.delivery().embedded,'not-requested');
  f.assets.dispose();assert.equal(f.textures[0].disposed,true);assert.equal(f.assets.image(),null);
});

test('each genuine network failure alone opens the next alternative and the actual decode settles delivery',async()=>{
  const f=fixture(),loading=f.assets.preload();
  f.images[0].onerror();await Promise.resolve();await Promise.resolve();
  assert.equal(f.images.length,2);f.images[1].onerror();await Promise.resolve();await Promise.resolve();
  assert.equal(f.images.length,3);assert.equal(f.assets.delivery().embedded,'pending');
  await f.settle(f.images[2]);assert.equal(await loading,true);
  assert.equal(f.assets.inspect().selected,'embedded');assert.equal(f.textures.length,1);f.assets.dispose();
});

test('retry during decode releases old ownership and late completion cannot revive the old image/texture',async()=>{
  const f=fixture();let endOld;
  const first=f.assets.preload();f.images[0].decode=()=>new Promise(resolve=>{endOld=resolve;});
  const oldDecode=f.images[0].onload();
  const second=f.assets.preload();await f.settle(f.images[1]);assert.equal(await second,true);
  endOld();await oldDecode;assert.equal(await first,false);
  assert.equal(f.assets.image(),f.images[1]);assert.equal(f.textures.length,1);
  const third=f.assets.preload();assert.equal(f.textures[0].disposed,true);
  const late=f.images[2].onload;f.assets.dispose();await late();assert.equal(await third,false);
  assert.equal(f.assets.inspect().textureOwners,0);assert.equal(f.textures.length,1);
});
