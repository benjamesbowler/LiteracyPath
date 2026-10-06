import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordBridgeAuthoredView } from '../../src/components/learn/games/games/wordBridgeAuthoredView.js';
import { WORD_BRIDGE_ATLASES } from '../../src/components/learn/games/games/wordBridgeArt.generated.js';
import { WORD_BRIDGE_SCENERY, WORD_BRIDGE_HORIZONS } from '../../src/components/learn/games/games/wordBridgeScenery.generated.js';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { wordBridgeRecoveryRepresentation } from '../../src/components/learn/games/games/wordBridgeRecoveryArt.js';

const heroes = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };
const nextTurn = () => new Promise(resolve => setImmediate(resolve));

function installImages(t) {
  const original = globalThis.Image, requests = [];
  const dimensions = new Map([
    ...Object.values({ ...WORD_BRIDGE_ATLASES, ...WORD_BRIDGE_SCENERY }).map(atlas => [atlas.runtime, [atlas.width, atlas.height]]),
    ...Object.values(WORD_BRIDGE_HORIZONS).map(runtime => [runtime, [1672, 941]]),
    ...Object.values(PHYSICAL_PAL_ART).map(pal => pal.actionAtlases.tools).map(atlas => [atlas.runtime, [atlas.width, atlas.height]])
  ]);
  globalThis.Image = class {
    set src(value) {
      this.url = value;
      const size = dimensions.get(value);
      assert.ok(size, 'loader must request an actual registered runtime path: ' + value);
      [this.naturalWidth, this.naturalHeight] = size;
      requests.push(this);
    }
    async decode() { this.decoded = true; }
  };
  t.after(() => { globalThis.Image = original; });
  return requests;
}

function viewFor(world) {
  return createWordBridgeAuthoredView({ characters: WORD_BRIDGE_ATLASES, scenery: WORD_BRIDGE_SCENERY,
    horizons: WORD_BRIDGE_HORIZONS, world });
}

function drawingContext() {
  const calls = [];
  return { calls, ...Object.fromEntries(['save', 'translate', 'scale', 'drawImage', 'restore']
    .map(name => [name, (...args) => calls.push([name, ...args])])) };
}

async function finishOriginals(requests, { failActors = false } = {}) {
  for (const picture of [...requests]) {
    if (failActors && picture.url.includes('/word-bridge/characters/')) picture.onerror();
    else await picture.onload();
  }
  await nextTurn();
}

test('delivered construction actors use their real stride and measured palms without requesting recovery art', async t => {
  const requests = installImages(t);
  for (const world of Object.keys(heroes)) {
    const view = viewFor(world);
    assert.equal(wordBridgeRecoveryRepresentation(view.inspect()), 'procedural-art-loading');
    await finishOriginals(requests.filter(picture => !picture.decoded));
    await view.ready;
    assert.equal(requests.some(picture => picture.url === PHYSICAL_PAL_ART[heroes[world]].actionAtlases.tools.runtime), false);
    assert.equal(view.inspect().recovery.delivery.carry, 'not-requested');
    assert.equal(wordBridgeRecoveryRepresentation(view.inspect()), null);
    const plank = WORD_BRIDGE_SCENERY[world + '-construction-kit'].frames.find(frame => frame.action === 'plank');
    assert.equal(view.propAspect('plank'), (plank.cell[2] - plank.cell[0]) / (plank.cell[3] - plank.cell[1]));
    assert.equal(view.propAspect('unknown'), null);
    const ctx = drawingContext(), carrying = { physicalId: 7, w: 64, h: 58 };
    let drawnSurface;
    assert.equal(view.drawHero(ctx, { x: 180, footY: 220, height: 110, time: .12, moving: true,
      carrying, mirror: true }, surface => { drawnSurface = surface; return { surface, attachedToMeasuredPalms: true }; }), true);
    const current = view.inspect();
    assert.equal(current.contact.action, 'carry-b');
    assert.equal(current.contact.delivery, 'delivered');
    assert.equal(current.contact.feet.y, 220);
    assert.equal(current.contact.physicalId, 7);
    assert.deepEqual(current.contact.handSurface, drawnSurface);
    assert.deepEqual(Object.keys(current.contact.handSurface.grips), ['nearHand', 'farHand']);
    const lastDraw = ctx.calls.filter(([name]) => name === 'drawImage').at(-1);
    assert.ok(lastDraw[1].url.includes('/word-bridge/characters/'));
    current.contact.sockets.nearHand.x = -999;
    current.delivery[Object.keys(current.delivery)[0]] = 'unavailable';
    assert.notEqual(view.inspect().contact.sockets.nearHand.x, -999, 'observer copies cannot move physical hand registration');
    view.dispose();
    assert.equal(view.propAspect('plank'), null, 'retired delivery cannot serve source dimensions as a live prop');
  }
});

test('failed owned actors request canonical retained tools and attach only the actually visible forehand', async t => {
  const requests = installImages(t);
  for (const world of Object.keys(heroes)) {
    const initialCount = requests.length, view = viewFor(world), ctx = drawingContext();
    assert.equal(view.drawHero(ctx, { x: 180, footY: 220, height: 110, carrying: { physicalId: 7, w: 64, h: 58 } }, () => {}), false);
    await finishOriginals(requests.slice(initialCount), { failActors: true });
    const retained = requests.at(-1);
    assert.equal(retained.url, PHYSICAL_PAL_ART[heroes[world]].actionAtlases.tools.runtime);
    assert.equal(view.inspect().recovery.delivery.carry, 'pending');
    assert.equal(wordBridgeRecoveryRepresentation(view.inspect()), 'procedural-art-loading');
    await retained.onload(); await view.ready;
    assert.equal(wordBridgeRecoveryRepresentation(view.inspect()), null);
    for (const mirror of [false, true]) {
      const carrying = { physicalId: 7, w: 64, h: 58 };
      assert.equal(view.drawHero(ctx, { x: 180, footY: 220, height: 110, time: .12, moving: true,
        carrying, mirror }, surface => ({ surface, attachedToMeasuredPalms: true })), true);
      const current = view.inspect();
      assert.equal(current.contact.representation, 'retained-canonical-tools-recovery');
      assert.equal(current.contact.action, 'retained-static-carry', 'a retained still must not claim a new walking action');
      assert.equal(current.recovery.delivery.carry, 'delivered');
      assert.deepEqual(Object.keys(current.contact.sockets), ['forehand', 'feet']);
      assert.deepEqual(Object.keys(current.contact.handSurface.grips), ['forehand']);
      assert.ok(Math.abs(current.contact.feet.y - 220) < 1);
      assert.equal(current.contact.attachedToMeasuredPalms, true);
      assert.ok(Object.entries(current.delivery).filter(([id]) => id.startsWith(heroes[world])).every(([, status]) => status === 'unavailable'));
      const lastDraw = ctx.calls.filter(([name]) => name === 'drawImage').at(-1);
      assert.equal(lastDraw[1].url, retained.url);
    }
    view.dispose();
  }
});

test('disposing during original or recovery decode cannot request late recovery or resurrect a drawn actor', async t => {
  const requests = installImages(t);
  for (const stage of ['original', 'recovery']) {
    const start = requests.length, view = viewFor('meadow');
    if (stage === 'recovery') await finishOriginals(requests.slice(start), { failActors: true });
    const count = requests.length, late = requests.slice(start).map(picture => picture.onload).filter(Boolean);
    view.dispose();
    for (const callback of late) await callback();
    await view.ready; await nextTurn();
    assert.equal(requests.length, count, 'a retired game must not acquire recovery residency');
    assert.equal(view.inspect().disposed, true);
    assert.equal(view.inspect().contact, null);
    assert.ok(Object.values(view.inspect().delivery).every(status => status === 'disposed'));
    assert.equal(view.inspect().recovery.delivery.carry, 'disposed');
    assert.equal(wordBridgeRecoveryRepresentation(view.inspect()), null);
    const ctx = drawingContext();
    assert.equal(view.drawHero(ctx, { x: 180, footY: 220, height: 110 }, () => {}), false);
    assert.equal(ctx.calls.length, 0);
  }
});

test('actual failure of both character routes stays unavailable and selects canonical drawn arms without image credit', async t => {
  const requests = installImages(t), view = viewFor('meadow');
  await finishOriginals(requests, { failActors: true });
  const retained = requests.at(-1);
  assert.equal(retained.url, PHYSICAL_PAL_ART.bouncy.actionAtlases.tools.runtime);
  retained.onerror(); await view.ready;
  const art = view.inspect();
  assert.equal(wordBridgeRecoveryRepresentation(art), 'procedural-art-unavailable');
  assert.equal(art.recovery.delivery.carry, 'unavailable');
  assert.ok(Object.entries(art.delivery).filter(([id]) => id.startsWith('bouncy')).every(([, status]) => status === 'unavailable'));
  const ctx = drawingContext();
  assert.equal(view.drawHero(ctx, { x: 180, footY: 220, height: 110 }, () => {}), false);
  assert.equal(view.inspect().contact, null, 'drawn-arm recovery must not become a delivered registered-actor receipt');
  assert.equal(ctx.calls.length, 0);
  view.dispose();
});
