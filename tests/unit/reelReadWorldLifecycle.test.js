import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelReadWorld } from '../../src/components/learn/games/games/reelReadWorld.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
import { REEL_READ_ART } from '../../src/components/learn/games/games/reelReadArtData.js';
import { reelReadStageLayout, stepReelReadFish } from '../../src/utils/reelReadMotion.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';

test('double kit failure keeps actual swimming words and source rod geometry, without claiming authored delivery or late decode', async t => {
  const previous = { Image: globalThis.Image, window: globalThis.window };
  const requests = [], drawings = [], labels = [], strokes = [], reports = [];
  const worlds = [];
  t.after(() => {
    for (const world of worlds) world.dispose();
    Object.assign(globalThis, previous);
  });
  globalThis.Image = class {
    set src(url) {
      this.url = url;
      const asset = Object.values(REEL_READ_ART).find(row => withRepairedImageVersion(row.runtime) === url);
      assert.ok(asset, 'only declared owned art is requested');
      this.naturalWidth = asset.width; this.naturalHeight = asset.height;
      requests.push(this);
    }
    decode() { return Promise.resolve(); }
  };
  globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) };
  const ctx = Object.fromEntries(['setTransform', 'fillRect', 'beginPath', 'roundRect', 'fill', 'save', 'translate',
    'rotate', 'scale', 'restore', 'ellipse', 'stroke', 'transform', 'closePath', 'quadraticCurveTo'].map(key => [key, () => {}]));
  ctx.createLinearGradient = () => ({ addColorStop() {} });
  ctx.drawImage = image => drawings.push(image.url);
  ctx.fillText = text => labels.push(text);
  ctx.moveTo = (x, y) => strokes.push({ kind: 'move', x, y });
  ctx.lineTo = (x, y) => strokes.push({ kind: 'line', x, y });
  const canvas = { style: {}, getContext: () => ctx };
  const world = createReelReadWorld(canvas, { difficulty: 'easy', onDelivery: row => reports.push(row) });
  worlds.push(world);
  // Independent primary/derivative kit failures and a failed action bank still
  // leave the decoded source idle actor and venue available.
  for (let index = 0; index < requests.length; index++) {
    const image = requests[index];
    if (image.url.includes('fishing-kit') || image.url.includes('fishing-actions')) image.onerror();
    else await image.onload();
  }
  await Promise.resolve();
  world.resize(1366, 768);
  const layout = reelReadStageLayout(1366, 768), level = reelReadV2Ladder('easy', 19)[0];
  const state = { elapsed: 4, boatPosition: .4, facing: 'right', steering: 0,
    castAt: 3.85, landedAt: -Infinity, errorAt: -Infinity, escapeAt: -Infinity,
    fish: Array.from({ length: level.visibleFish }, (_, slot) => {
      const fish = { id: slot + 1, slot, phase: slot * 37, word: ['rain', 'bow', 'cup', 'cat', 'sun', 'dog'][slot] };
      return { ...fish, ...stepReelReadFish(fish, layout, level, 4) };
    }), fight: null, hook: null };
  const original = structuredClone(state);
  const geometry = world.geometry(state);
  world.draw(state, 100);
  const observed = world.inspect();
  assert.deepEqual(state, original, 'drawing cannot change the physical school or evidence inputs');
  assert.deepEqual(labels, state.fish.filter(fish => fish.visible).map(fish => fish.word));
  assert.ok(labels.length >= 2, 'real moving reading faces remain painted during the combined fault');
  assert.ok(drawings.some(url => url.includes('fishing-fallback')));
  assert.ok(drawings.every(url => !url.includes('fishing-kit') && !url.includes('fishing-actions')));
  assert.equal(observed.emergencyKitDrawing, true);
  assert.equal(observed.delivered, false);
  assert.equal(observed.playableFallback, false, 'emergency drawing is separate from the authored derivative tier');
  assert.equal(observed.actor.delivered, false);
  assert.equal(observed.actor.frame, 0, 'the actually drawn idle derivative must not claim the requested action');
  assert.equal(observed.actor.requestedFrame, 6);
  assert.equal(observed.assets['meadow-fishing-kit-v1'], 'unavailable');
  assert.equal(observed.assets['meadow-fishing-kit-fallback-v1'], 'unavailable');
  assert.deepEqual(observed.rod.tip, geometry.rod.tip);
  assert.ok(strokes.some((row, index) => row.kind === 'move' && row.x === geometry.rod.origin.x
    && row.y === geometry.rod.origin.y && strokes[index + 1]?.kind === 'line'
    && strokes[index + 1].x === geometry.rod.tip.x && strokes[index + 1].y === geometry.rod.tip.y));
  observed.actor.sockets.rodGrip.x = -999;
  assert.notEqual(world.inspect().actor.sockets.rodGrip.x, -999, 'QA snapshots cannot move live sockets');
  world.dispose();

  const lateReports = [];
  const lateWorld = createReelReadWorld(canvas, { difficulty: 'hard', onDelivery: row => lateReports.push(row) });
  worlds.push(lateWorld);
  const venue = requests.findLast(image => image.url.includes('moonwood-fishing-venue'));
  let releaseDecode;
  venue.decode = () => new Promise(resolve => { releaseDecode = resolve; });
  const pending = venue.onload();
  lateWorld.dispose();
  const countAtDisposal = lateReports.length;
  releaseDecode(); await pending; await Promise.resolve();
  assert.equal(lateReports.length, countAtDisposal, 'a canceled asynchronous decode cannot resurrect delivery');
});


test('independent reduced kits preserve the complete rendered fish body size in every world', async t => {
  const previous = { Image: globalThis.Image, window: globalThis.window };
  t.after(() => Object.assign(globalThis, previous));
  globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) };
  for (const [difficulty, name] of [['easy', 'meadow'], ['medium', 'dino'], ['hard', 'moonwood']]) {
    const sizes = [];
    for (const failed of [false, true]) {
      const calls = [];
      globalThis.Image = class {
        set src(url) {
          this.url = url;
          const asset = Object.values(REEL_READ_ART).find(row => withRepairedImageVersion(row.runtime) === url);
          assert.ok(asset);
          this.naturalWidth = asset.width; this.naturalHeight = asset.height;
          queueMicrotask(() => failed && url === withRepairedImageVersion(REEL_READ_ART[`${name}-fishing-kit-v1`].runtime) ? this.onerror() : this.onload());
        }
        decode() { return Promise.resolve(); }
      };
      const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), drawImage: (...args) => calls.push(args) },
        { get: (target, key) => target[key] ?? (() => {}) });
      let delivery;
      const world = createReelReadWorld({ style: {}, getContext: () => ctx }, { difficulty, onDelivery: value => { delivery = value; } });
      for (let turn = 0; turn < 12; turn++) await Promise.resolve();
      assert.ok(!Object.values(delivery.assets).includes('pending'));
      world.resize(390, 650);
      world.draw({ elapsed: 4, boatPosition: .4, facing: 'right', steering: 0, castAt: -99,
        landedAt: -99, errorAt: -99, escapeAt: -99, fight: null, hook: null,
        fish: [{ id: 1, slot: 0, visible: true, labelX: 170, labelY: 420, word: 'cat' }] }, 0);
      const asset = REEL_READ_ART[`${name}-fishing-kit${failed ? '-fallback' : ''}-v1`], rect = asset.parts.fish[0];
      const body = calls.find(args => args.length === 9 && args[0].url === withRepairedImageVersion(asset.runtime)
        && args.slice(1, 5).every((value, index) => Math.abs(value - [rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]][index]) < 1e-6));
      assert.ok(body, `${name} actual selected fish body was painted`);
      sizes.push(body.slice(7, 9)); world.dispose();
    }
    assert.ok(sizes[0].every((size, index) => Math.abs(size - sizes[1][index]) < .01), `${name} reduced fish retains its world dimensions`);
  }
});
