import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegisteredPalArtBank, drawRegisteredPalFrame, registeredPalCanvasPose, registeredPalFrameGeometry } from '../../src/components/learn/games/shared/registeredPalArt.js';

const atlas = { runtime: '/owned-action-sheet.webp', width: 500, height: 800, pixelsPerUnit: 100, frames: [
  { cell: [40, 100, 240, 500], anchor: [100, 390], sockets: { feet: [140, 490] }, leftHandPixel: [80, 240], rightHandPixel: [220, 300] }
] };

test('measured hands and feet match the drawn cell and mirrored Three coordinate frame', () => {
  const frame = atlas.frames[0];
  const geometry = registeredPalFrameGeometry(atlas, frame);
  assert.deepEqual(geometry.sockets, { feet: [0, 0], leftHand: [-.6, 2.5], rightHand: [.8, 1.9] });
  const pose = registeredPalCanvasPose(atlas, frame, { x: 300, y: 600, unitScale: 50 });
  assert.deepEqual(pose.sockets, { feet: { x: 300, y: 600 }, leftHand: { x: 270, y: 475 }, rightHand: { x: 340, y: 505 } });
  assert.deepEqual(pose.destination, { x: -50, y: -195, width: 100, height: 200 });
  const mirror = registeredPalCanvasPose(atlas, frame, { x: 300, y: 600, unitScale: 50, mirror: true });
  assert.deepEqual(mirror.sockets.leftHand, { x: 330, y: 475 });
  assert.deepEqual(mirror.sockets.rightHand, { x: 260, y: 505 });
  assert.equal(mirror.center[0], 1 - geometry.center[0]);
  assert.deepEqual(registeredPalCanvasPose(atlas, frame, { height: 110 }).sockets.feet, { x: 0, y: 0 });
});

test('unmeasured hands stay absent and invalid source sockets cannot attach a tool', () => {
  const frame = { cell: [40, 100, 240, 500], anchor: [100, 390] };
  assert.deepEqual(registeredPalFrameGeometry(atlas, frame).sockets, {});
  assert.throws(() => registeredPalFrameGeometry(atlas, { ...frame, rightHandPixel: [250, 300] }), /outside registered frame/);
  assert.throws(() => registeredPalFrameGeometry(atlas, { ...frame, anchor: [100, 450] }), /foot anchor outside/);
  assert.throws(() => registeredPalCanvasPose(atlas, frame, { unitScale: -1 }), /unit scale/);
});

test('actual Canvas draw uses identical measured source/foot registration and changes mirror only around the foot', () => {
  const calls = [];
  const ctx = Object.fromEntries(['save', 'translate', 'scale', 'drawImage', 'restore'].map(name => [name, (...args) => calls.push([name, ...args])]));
  const image = {};
  assert.equal(drawRegisteredPalFrame(ctx, image, atlas, atlas.frames[0], { x: 300, y: 600, unitScale: 50, mirror: true }), true);
  assert.deepEqual(calls, [['save'], ['translate', 300, 600], ['scale', -1, 1], ['drawImage', image, 40, 100, 200, 400, -50, -195, 100, 200], ['restore']]);
  assert.equal(drawRegisteredPalFrame(ctx, null, atlas, atlas.frames[0], {}), false);
});

test('separate mounted games share one decode while disposing and late loads never resurrect an owner', async t => {
  const original = globalThis.Image, requests = [];
  globalThis.Image = class { set src(value) { this.url = value; this.naturalWidth = 500; this.naturalHeight = 800; requests.push(this); } };
  t.after(() => { globalThis.Image = original; });
  const removed = createRegisteredPalArtBank({ action: atlas }), playing = createRegisteredPalArtBank({ action: atlas });
  const pendingRemoved = removed.preload(), pendingPlaying = playing.preload();
  assert.equal(requests.length, 1);
  assert.deepEqual(playing.delivery(), { action: 'pending' });
  removed.dispose(); requests[0].onload();
  const [removedImages, playingImages] = await Promise.all([pendingRemoved, pendingPlaying]);
  assert.deepEqual(removedImages, [null], 'disposed callers cannot create actors from a late shared decode');
  assert.deepEqual(playingImages, [requests[0]]);
  assert.deepEqual(removed.delivery(), { action: 'disposed' });
  const snapshot = playing.delivery(); snapshot.action = 'unavailable';
  assert.equal(playing.delivery().action, 'delivered');
  const ctx = { save() {}, translate() {}, drawImage() {}, restore() {} };
  assert.equal(removed.draw(ctx, 'action', 0, {}), false);
  assert.equal(playing.draw(ctx, 'action', 0, {}), true);
  playing.dispose(); playing.dispose();
  const next = createRegisteredPalArtBank({ action: atlas }), abandoned = next.preload();
  assert.equal(requests.length, 2, 'last owner releases decoded residency');
  const lateLoad = requests[1].onload;
  next.dispose(); lateLoad(); await abandoned;
  assert.equal(next.delivery().action, 'disposed');
});

test('wrong-size delivery fails closed and a new mount can recover the authored sheet', async t => {
  const original = globalThis.Image, requests = [];
  globalThis.Image = class { set src(value) { this.url = value; this.naturalWidth = 12; this.naturalHeight = 12; requests.push(this); } };
  t.after(() => { globalThis.Image = original; });
  const failed = createRegisteredPalArtBank({ action: atlas });
  const load = failed.preload(); requests[0].onload(); await load;
  assert.equal(failed.delivery().action, 'unavailable'); failed.dispose();
  const recovered = createRegisteredPalArtBank({ action: atlas });
  const retry = recovered.preload(); requests[1].naturalWidth = 500; requests[1].naturalHeight = 800; requests[1].onload(); await retry;
  assert.equal(recovered.delivery().action, 'delivered'); recovered.dispose();
});

test('delivery waits for real decode and a disposed owner stays disposed if decode ends late', async t => {
  const original = globalThis.Image, requests = [];
  globalThis.Image = class {
    set src(value) { this.url = value; this.naturalWidth = 500; this.naturalHeight = 800; requests.push(this); }
    decode() { return new Promise(resolve => { this.finishDecode = resolve; }); }
  };
  t.after(() => { globalThis.Image = original; });
  const bank = createRegisteredPalArtBank({ action: atlas });
  const load = bank.preload();
  const decoded = requests[0].onload();
  assert.equal(bank.delivery().action, 'pending');
  bank.dispose(); requests[0].finishDecode(); await Promise.all([load, decoded]);
  assert.equal(bank.delivery().action, 'disposed');
  const next = createRegisteredPalArtBank({ action: atlas }), nextLoad = next.preload();
  const nextDecoded = requests[1].onload(); requests[1].finishDecode(); await Promise.all([nextLoad, nextDecoded]);
  assert.equal(next.delivery().action, 'delivered'); next.dispose();
});
