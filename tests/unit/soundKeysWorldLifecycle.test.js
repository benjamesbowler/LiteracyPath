import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundKeysWorld, SOUNDKEYS_CAST } from '../../src/components/learn/games/games/soundKeysWorld.js';
import { SOUNDKEYS_ART } from '../../src/components/learn/games/games/soundKeysArtData.js';

test('band transitions release old residency, ignore late decode and repaint paused resize without advancing play', async t => {
  const previous = Object.fromEntries(['Image', 'document', 'window', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'].map(key => [key, globalThis[key]]));
  t.after(() => { world?.dispose(); for (const [key, value] of Object.entries(previous)) globalThis[key] = value; });
  const requests = [], drawCalls = [], queued = new Map(); let nextFrame = 0, onResize;
  let bounds = { width: 1366, height: 768 };
  globalThis.Image = class {
    set src(value) {
      this.url = value; const asset = Object.values(SOUNDKEYS_ART).find(row => row.runtime === value);
      this.naturalWidth = this.width = asset.width; this.naturalHeight = this.height = asset.height; requests.push(this);
    }
    decode() { return Promise.resolve(); }
  };
  const ctx = Object.fromEntries(['setTransform', 'fillRect', 'beginPath', 'roundRect', 'fill', 'save', 'translate', 'scale', 'restore', 'ellipse', 'stroke'].map(key => [key, () => {}]));
  ctx.drawImage = image => drawCalls.push(image.url);
  const canvas = { style: {}, setAttribute() {}, getContext: () => ctx, remove() {} };
  globalThis.document = { createElement: () => canvas }; globalThis.window = { devicePixelRatio: 1 };
  globalThis.ResizeObserver = class { constructor(callback) { onResize = callback; } observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = fn => { queued.set(++nextFrame, fn); return nextFrame; };
  globalThis.cancelAnimationFrame = id => queued.delete(id);
  const state = { band: 0, round: 0, elapsed: 0, pressed: [], visibleKeys: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'], lastPress: null, hoverIndex: null, errorAt: -Infinity, paused: false };
  const mount = { prepend() {}, getBoundingClientRect: () => bounds, closest: () => null, style: { removeProperty() {} } };
  const world = createSoundKeysWorld(mount, { getState: () => state, getKeys: () => Array.from({ length: 8 }, (_, index) => ({ x: 258 + index * 106, y: 598, width: 98, height: 72 })) });
  const step = at => { const [id, fn] = queued.entries().next().value; queued.delete(id); fn(at); };
  const expected = band => new Set([['meadow', 'dino', 'moonwood'][band] + '-keyboard-venue-v1', band ? ['','dino','moonwood'][band] + '-instrument-kit-v1' : 'instrument-kit-v1', ...SOUNDKEYS_CAST[band].flatMap(name => [name + '-keyboard-actions-v1', name + '-keyboard-fallback-v1'])].map(id => SOUNDKEYS_ART[id].runtime));
  assert.deepEqual(new Set(requests.map(image => image.url)), expected(0));
  const oldVenueEnd = requests[0].onload;
  state.band = 1; state.round = 8; step(16);
  assert.equal(requests.length, expected(0).size + expected(1).size);
  await oldVenueEnd();
  assert.equal(world.inspect().venue, 'pending', 'old Meadow decode cannot mark Dino delivered');
  for (const image of requests.slice(expected(0).size)) await image.onload?.();
  await Promise.resolve(); step(32);
  assert.equal(world.inspect().delivered, true);
  assert.ok(world.inspect().actors.every(actor => actor.delivered));
  assert.ok(world.inspect().actionDelivery['speedy-keyboard-actions-v1'] === 'not-requested');
  assert.ok(drawCalls.every(url => expected(1).has(url)), 'transition draws only current-band residency');
  const observed = world.inspect(); observed.actors[0].character = 'mutated';
  assert.equal(world.inspect().actors[0].character, 'chompy');
  state.paused = true;
  const frozen = structuredClone(state), priorDraws = drawCalls.length;
  step(48); assert.equal(drawCalls.length, priorDraws);
  bounds = { width: 320, height: 340 }; onResize(); step(64);
  assert.equal(canvas.width, 320); assert.equal(canvas.height, 340);
  assert.ok(drawCalls.length > priorDraws, 'a cleared paused backing canvas is repainted');
  assert.equal(world.inspect().frameAt, 64); assert.deepEqual(state, frozen);
  const repaintDraws = drawCalls.length; step(80);
  assert.equal(drawCalls.length, repaintDraws, 'paused resize repaints only once');
  state.paused = false; state.band = 0; state.round = 0; step(96);
  assert.equal(requests.length, expected(0).size * 2 + expected(1).size, 'released Meadow actions decode again on re-entry');
  const late = requests.at(-1).onload; world.dispose(); await late?.();
  assert.equal(queued.size, 0);
});
