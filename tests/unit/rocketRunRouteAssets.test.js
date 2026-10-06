import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRocketRouteAssets } from '../../src/components/learn/games/games/rocketRunRouteAssets.js';

const roles = ['station','portal','courier','planet','asteroid','beacon','comet'];
const metadata = () => ({ runtime:'/game-assets/rocket-run/route-kit/meadow-route-kit-v1.webp', width:64, height:32,
  trueAlpha:true, roles:Object.fromEntries(roles.map((role,i) => [role,
    {cell:[(i%4)*16, Math.floor(i/4)*16, (i%4+1)*16, (Math.floor(i/4)+1)*16], anchor:[8,12],pixelsPerUnit:10+i,
      motorCore:role==='courier'||role==='asteroid'?{sourcePoint:[0,0,0],radius:role==='courier'?.42:.64}:null}])) });
function images() {
  const all=[];
  class Picture {
    constructor() { all.push(this); this.naturalWidth=64; this.naturalHeight=32; }
    decode() { return Promise.resolve(); }
  }
  return { all, Picture };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('seven exact route roles share one texture while clone transforms remain independent and final disposal is once',async()=>{
  const {all,Picture}=images();let disposals=0;
  const atlas=createRocketRouteAssets({primary:metadata()},{ImageClass:Picture,makeTexture:image=>{
    const texture=new THREE.Texture(image);texture.addEventListener('dispose',()=>disposals++);return texture;
  }});
  const pending=atlas.preload(); assert.equal(all.length,1);assert.equal(atlas.inspect().selected,null);
  all[0].onload();assert.equal(await pending,true);
  assert.equal(atlas.coreRadius('courier'),.42);assert.equal(atlas.coreRadius('asteroid'),.64);
  const a=atlas.createMesh('courier'),b=atlas.createMesh('courier');
  assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);assert.equal(a.material.map,b.material.map);
  a.position.x=5;assert.equal(b.position.x,0);assert.equal(atlas.inspect().textureOwners,1);
  const scene=new THREE.Scene();scene.add(a,b);atlas.releaseMesh(a);assert.equal(a.parent,null);assert.equal(b.parent,scene);
  atlas.dispose();atlas.dispose();assert.equal(b.parent,null);assert.equal(disposals,1);
  assert.equal(atlas.inspect().decodedBaseBytes,0);assert.equal(atlas.inspect().activeMeshes,0);
  assert.equal(atlas.coreRadius('courier'),null);
});

test('a genuine primary fault requests the complete original embedded bank and never marks the failed URL delivered',async()=>{
  const {all,Picture}=images();const primary=metadata(), embedded={...metadata(),runtime:'data:image/webp;base64,original-test-blob'};
  const bank=createRocketRouteAssets({primary,embedded},{ImageClass:Picture});
  const pending=bank.preload();all[0].onerror();await settle();assert.equal(all.length,2);
  assert.equal(bank.inspect().primary,'unavailable');assert.equal(bank.inspect().embedded,'pending');
  all[1].onload();assert.equal(await pending,true);assert.equal(bank.inspect().selected,'embedded');
  for(const role of roles) assert.ok(bank.createMesh(role),'fallback must retain '+role);
  bank.dispose();
});

test('dispose during real decode cannot resurrect a texture or return delivery to a disposed owner',async()=>{
  const {all,Picture}=images();let finishDecode, textures=0;
  Picture.prototype.decode=()=>new Promise(resolve=>{finishDecode=resolve;});
  const bank=createRocketRouteAssets({primary:metadata()},{ImageClass:Picture,makeTexture:image=>{textures++;return new THREE.Texture(image);}});
  const pending=bank.preload();all[0].onload();bank.dispose();assert.equal(await pending,false);
  finishDecode();await settle();assert.equal(textures,0);assert.equal(bank.createMesh('courier'),null);
  assert.equal(bank.inspect().selected,null);assert.equal(await bank.preload(),false);
});

test('synchronous owner exit on pending delivery cannot start a later unowned image request',async()=>{
  const {all,Picture}=images();let bank;
  bank=createRocketRouteAssets({primary:metadata()},{ImageClass:Picture,onDelivery:status=>{
    if(status.primary==='pending')bank.dispose();
  }});
  assert.equal(await bank.preload(),false);assert.equal(all.length,0);
  assert.equal(bank.inspect().disposed,true);assert.equal(bank.inspect().textureOwners,0);
});

test('missing role, clipped anchor, mismatched decode and observer errors cannot fabricate an original route delivery',async()=>{
  const invalid=metadata();delete invalid.roles.comet;
  const {all,Picture}=images();const absent=createRocketRouteAssets({primary:invalid},{ImageClass:Picture});
  assert.equal(await absent.preload(),false);assert.equal(all.length,0);absent.dispose();
  const wrong=metadata();wrong.roles.courier.anchor=[20,12];
  const invalidAnchor=createRocketRouteAssets({primary:wrong},{ImageClass:Picture});
  assert.equal(await invalidAnchor.preload(),false);assert.equal(all.length,0);invalidAnchor.dispose();
  const overlapping=metadata();overlapping.roles.comet.cell=[...overlapping.roles.station.cell];
  const repeatedCell=createRocketRouteAssets({primary:overlapping},{ImageClass:Picture});
  assert.equal(await repeatedCell.preload(),false);assert.equal(all.length,0);repeatedCell.dispose();
  const fractional=metadata();fractional.roles.courier.cell[0]+=.5;
  const changedCell=createRocketRouteAssets({primary:fractional},{ImageClass:Picture});
  assert.equal(await changedCell.preload(),false);assert.equal(all.length,0);changedCell.dispose();
  const failed=createRocketRouteAssets({primary:metadata()},{ImageClass:Picture});
  const pending=failed.preload();all[0].naturalWidth=63;all[0].onload();assert.equal(await pending,false);
  assert.equal(failed.inspect().decodedBaseBytes,0);failed.dispose();
  const observed=createRocketRouteAssets({primary:metadata()},{ImageClass:Picture,onDelivery:()=>{throw new Error('read-only observer');}});
  const delivered=observed.preload();all[1].onload();assert.equal(await delivered,true);observed.dispose();
});
