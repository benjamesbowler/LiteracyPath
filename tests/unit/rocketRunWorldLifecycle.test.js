import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRocketRunWorld } from '../../src/components/learn/games/games/rocketRunWorld.js';

function environment(t, suffix) {
  const prior = { document: globalThis.document, window: globalThis.window, Image: globalThis.Image };
  const requests = [], drawings = [], worlds = [];
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'fillRect', 'beginPath', 'roundRect', 'fill', 'save',
    'translate', 'scale', 'restore', 'stroke', 'closePath', 'moveTo', 'lineTo', 'fillText'].map(key => [key, () => {}]));
  ctx.drawImage = picture => drawings.push(picture.url);
  ctx.measureText = word => ({ width: word.length * 9.6 });
  class Canvas extends EventTarget { style = {}; setAttribute() {} getContext() { return ctx; } remove() { this.removed = true; } }
  globalThis.document = { createElement: () => new Canvas() };
  globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) };
  globalThis.Image = class {
    set src(url) { this.url = url; if (url) { this.naturalWidth = url.includes('route-kit/') ? 28 : 4; this.naturalHeight = 4; requests.push(this); } }
    decode() { return Promise.resolve(); }
  };
  const asset = (name, count = 42) => ({ runtime: `/game-assets/rocket-run/flight-actions/test-${suffix}-${name}.webp`, width: 4, height: 4,
    pixelsPerUnit: 4, frames: Array.from({length: count}, (_, i) => ({ cell: [0, 0, 4, 4], anchor: [2, 2],
      clip: count === 1 ? 'cruise' : ['cruise','bank_left','bank_right','boost','shield_recover','catch','celebrate'][Math.floor(i/(count/7))],
      phase: count === 1 ? 0 : (i%(count/7))/(count/7-1), sockets: { receiver: [2, 2] } })) });
  const sky = name => ({runtime:`/game-assets/rocket-run/space-venues/test-${suffix}-${name}.webp`,width:4,height:4});
  const pairs = Object.fromEntries(['L','R'].flatMap(side =>
    [['Wrist','forearm','hand'],['Elbow','upperarm','forearm'],['Ankle','shin','foot'],['Knee','thigh','shin']]
      .map(([name,from,to]) => [side.toLowerCase()+name,{fromBone:from+'.'+side,toBone:to+'.'+side,
        fromSourcePoint:[0,0,0],toSourcePoint:[0,0,0]}])));
  const anatomy = { actualSourceSubframes:{threshold:1e-5},jointEndpoints:pairs,
    torsoAttachmentPairs:Object.fromEntries(['L','R'].map(side => [side.toLowerCase()+'Shoulder',
      {fromBone:'upperarm.'+side,toBone:'chest',fromSourcePoint:[0,0,0],toSourcePoint:[0,0,0]}])),
    contacts:Object.fromEntries(['leftGrip','rightGrip','leftSole','rightSole'].map(name => [name,
      {bone:(name.endsWith('Grip')?'hand.':'foot.')+(name.startsWith('left')?'L':'R'),
        sourcePoint:[0,0,0],support:name+'Support'}])),
    release:{clip:'celebrate',contact:'leftGrip',startPhase:.1,endPhase:.9} };
  const route = name => ({runtime:`/game-assets/rocket-run/route-kit/test-${suffix}-${name}.webp`,
    width:28,height:4,trueAlpha:true,roles:Object.fromEntries(
      ['station','portal','courier','planet','asteroid','beacon','comet'].map((role,index) => [role,
        {cell:[index*4,0,index*4+4,4],anchor:[2,2],pixelsPerUnit:4,
          motorCore:role==='courier'||role==='asteroid'?{sourcePoint:[0,0,0],radius:1}:null}]))});
  const records = { meadow: { ...anatomy,capture: { socket: 'wordCaptureSocket' }, flight: {
    primary: asset('primary'), independentIdle: asset('idle',1),
    emergency: {...asset('emergency',21),runtime:'data:image/webp;base64,emergency-'+suffix} }, venue: {
    primary: sky('sky-primary'), independent: sky('sky-independent'),
    embedded: {...sky('sky-embedded'),runtime:'data:image/webp;base64,sky-embedded-'+suffix} },
    route:{primary:route('primary'),embedded:{...route('embedded'),runtime:'data:image/webp;base64,route-kit/test-'+suffix}} } };
  const mount = { prepend() {} };
  const state = { elapsed: 1, distance: 1, flight: { x: 0, immunity: 0 }, carriers: [], intent: null };
  async function images(fail = () => false) {
    for (let index=0;index<requests.length;index++) {
      const picture=requests[index];if (fail(picture.url)) picture.onerror?.(); else await picture.onload?.();
      await Promise.resolve();await Promise.resolve();
    }
    await Promise.resolve(); await Promise.resolve();
  }
  t.after(() => { worlds.forEach(world => world.dispose()); Object.assign(globalThis, prior); });
  return { records, mount, state, requests, drawings, worlds, images, Canvas };
}

test('combined model/action network failure uses the independently decoded registered emergency action, with honest delivery', async t => {
  const f = environment(t, 'fault'), reports = [];
  const assets = { load: async () => null, inspect: () => ({ delivery: [{ status: 'failed' }] }), dispose() {} };
  const world = createRocketRunWorld(f.mount, { records: f.records, onDelivery: value => reports.push(value) }, {
    createCraftAssets: () => assets, createRenderer: () => { throw new Error('actual unavailable WebGL'); } });
  f.worlds.push(world); await f.images(url => !url.startsWith('data:') && !url.includes('route-kit/'));
  world.resize(320, 568); world.draw(f.state, { clip: 'cruise', phase: .5 }, 0);
  const observed = world.inspect();
  assert.equal(observed.mode, 'canvas'); assert.equal(observed.actorTier, 'embedded-registered-actions');
  assert.equal(observed.playable, true); assert.equal(observed.delivered, true);
  assert.ok(f.drawings.some(url => url.includes('emergency')));
  assert.ok(!f.drawings.some(url => url.includes('/flight-actions/') && /-(primary|idle)\.webp$/.test(url)),
    'failed primary flight pixels and unrequested idle must never paint the actor');
  assert.equal(observed.delivery.model.delivery[0].status, 'failed');
  assert.equal(observed.delivery.actionResources.decodedImageOwners, 1);
  assert.equal(observed.delivery.actions.idle, 'not-requested');
  assert.equal(observed.delivery.skyResources.decodedImageOwners, 1);
  observed.receiver.world.x = 999; observed.delivery.sky.embedded = 'fabricated';
  assert.equal(world.inspect().receiver.world.x, 0);
  assert.equal(world.inspect().delivery.sky.embedded, 'delivered');
  world.dispose(); const count = reports.length;
  f.requests.forEach(picture => picture.onload?.()); await Promise.resolve();
  assert.equal(reports.length, count, 'disposed async completion must not resurrect scene delivery');
});

test('healthy selected world requests no unused action or sky alternatives and owns one decoded image per layer', async t => {
  const f = environment(t, 'selected');
  const world = createRocketRunWorld(f.mount, {records:f.records}, {
    createCraftAssets:() => ({load:async()=>null,inspect:()=>({delivery:[]}),dispose(){}}),
    createRenderer:()=>{throw new Error('Canvas requested for source ownership test');}});
  f.worlds.push(world); await f.images();
  world.resize(568,320); world.draw(f.state,{clip:'boost',phase:.5},0);
  const view = world.inspect();
  assert.equal(view.playable,true);
  assert.equal(view.delivery.actions.flight,'delivered');
  assert.equal(view.delivery.actions.emergency,'not-requested');
  assert.equal(view.delivery.actions.idle,'not-requested');
  assert.equal(view.delivery.sky.independent,'not-requested');
  assert.equal(view.delivery.sky.embedded,'not-requested');
  assert.equal(view.delivery.actionResources.decodedImageOwners,1);
  assert.equal(view.delivery.skyResources.textureOwners,1);
  assert.equal(f.requests.length,3,'only selected primary action, sky and route are requested');
});

test('actual renderer context events notify pause/recovery and late model leases are released after unmount', async t => {
  const f = environment(t, 'context'); let resolveLoad, lost = 0, restored = 0, disposedModels = 0, rendered = 0;
  const renderer = { domElement: new f.Canvas(), info: { render: { calls: 0, triangles: 0 }, memory: { textures: 0 } },
    render() {}, setSize() {}, setPixelRatio() {}, dispose() {}, forceContextLoss() {} };
  const root = new THREE.Group();
  const names=new Set(['chest','wordCaptureSocket',...Object.values(f.records.meadow.jointEndpoints)
    .flatMap(pair=>[pair.fromBone,pair.toBone]),...Object.values(f.records.meadow.contacts)
    .flatMap(contact=>[contact.bone,contact.support])]);
  for(const name of names){const bone=new THREE.Bone();bone.name=name;root.add(bone);}
  root.getObjectByName('wordCaptureSocket').position.set(0,.54,-1.8);root.updateMatrixWorld(true);
  const lease = { root, dispose() { disposedModels++; }, sample: () => true,
    socket: name => root.getObjectByName(name)?.getWorldPosition(new THREE.Vector3()), markRendered() { rendered++; }, inspect: () => ({ rendered: rendered > 0 }) };
  const assets = { load: () => new Promise(resolve => { resolveLoad = resolve; }), inspect: () => ({ delivery: [] }), dispose() {} };
  const world = createRocketRunWorld(f.mount, { records: f.records,
    onContextLoss: () => lost++, onContextRestored: () => restored++ }, { createCraftAssets: () => assets, createRenderer: () => renderer });
  f.worlds.push(world); await f.images(); resolveLoad(lease); await Promise.resolve(); await Promise.resolve();
  world.resize(1366, 768); world.draw(f.state, { clip: 'cruise', phase: 0 }, 0);
  assert.equal(rendered, 1, 'rendered delivery occurs after the real renderer call');
  renderer.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  assert.equal(lost, 1); assert.equal(disposedModels, 1);
  world.draw(f.state, { clip: 'cruise', phase: 0 }, 0);
  assert.equal(world.inspect().mode, 'canvas'); assert.equal(world.inspect().contextUnavailable, true);
  renderer.domElement.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(restored, 1);
  world.dispose(); resolveLoad({ ...lease, root: new THREE.Group() }); await Promise.resolve(); await Promise.resolve();
  assert.equal(disposedModels, 2, 'a late restored-context lease is released rather than reattached');
  renderer.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  assert.equal(lost, 1, 'balanced event teardown prevents a removed renderer from pausing a new game');
});
