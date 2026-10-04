import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import * as THREE from 'three';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { createPalFigure, animatePalFigure } from '../../src/components/learn/games/shared/physicalArcadeWorld.js';
import { physicalPalFrame, physicalPalArtDelivery } from '../../src/components/learn/games/shared/physicalPalArt.js';
import { disposeObject } from '../../src/components/learn/games/shared/threeShell.js';
import { arcadeGuideForGame } from '../../src/components/learn/games/shared/arcadeGuideExamples.js';

test('authored character sources and delivery atlases decode with actual alpha and registered complete body frames', async () => {
  execFileSync(process.execPath, ['tools/buildPhysicalPalArtData.mjs', '--check']);
  const manifest = JSON.parse(readFileSync('source-art/arcade/physical-worlds/pals/manifest.json', 'utf8'));
  for (const [name, data] of Object.entries(manifest.characters)) {
    assert.equal(PHYSICAL_PAL_ART[name].character, name);
    for (const atlas of [data, ...Object.values(data.actionAtlases)]) {
      const source = readFileSync(atlas.source), runtime = readFileSync(`public${atlas.runtime}`);
      assert.equal(createHash('sha256').update(source).digest('hex'), atlas.sourceSha256);
      assert.equal(createHash('sha256').update(runtime).digest('hex'), atlas.runtimeSha256);
      const metadata = await sharp(runtime).metadata();
      assert.equal(metadata.width, atlas.width); assert.equal(metadata.height, atlas.height); assert.equal(metadata.hasAlpha, true);
      const { data: pixels, info } = await sharp(runtime).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let transparent = 0, opaque = 0;
      for (let index = 3; index < pixels.length; index += info.channels) {
        if (pixels[index] < 32) transparent += 1;
        if (pixels[index] > 200) opaque += 1;
      }
      assert.ok(transparent > atlas.width * atlas.height * .3, 'atlas has genuinely empty surroundings');
      assert.ok(opaque > atlas.width * atlas.height * .1, 'figures retain opaque bodies');
      assert.equal(atlas.frames.length, atlas.rows * atlas.columns);
      for (const frame of atlas.frames) {
        const [x, y, right, bottom] = frame.cell, [leftBody, topBody, rightBody, bottomBody] = frame.bounds;
        assert.ok(x >= 0 && y >= 0 && right <= atlas.width && bottom <= atlas.height);
        assert.ok(leftBody >= 1 && topBody >= 1 && rightBody < right - x && bottomBody <= bottom - y);
        assert.equal(frame.anchor[1], bottomBody, 'runtime feet are registered to the observed source feet');
        assert.ok(frame.anchor[0] >= leftBody && frame.anchor[0] <= rightBody);
        if (frame.rightHandPixel) {
          const [handX, handY] = frame.rightHandPixel;
          assert.ok(handX >= x && handX < right && handY >= y && handY < bottom);
          assert.ok(pixels[(handY * info.width + handX) * info.channels + 3] > 200, 'registered grip belongs to the painted hand');
        }
      }
    }
  }
});

test('real action progress selects distinct complete poses and preserves directional walking', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const swing = [0, .4, .9].map(phase => physicalPalFrame(world, 0, false, { direction: 'back', action: 'forehand', phase }));
    assert.deepEqual(swing.map(frame => frame.index), [0, 1, 2]);
    assert.equal(swing[1].kind, 'tennis'); assert.notDeepEqual(swing[0].rightHand, swing[1].rightHand);
    for (const direction of ['front', 'back']) {
      const ready = physicalPalFrame(world, 0, false, { action: 'ready', direction });
      const anticipation = physicalPalFrame(world, 0, false, { action: 'forehand', direction, phase: 0 });
      assert.equal(ready.kind, 'tennis'); assert.equal(ready.index, anticipation.index);
      assert.deepEqual(ready.rightHand, anticipation.rightHand);
    }
    assert.equal(physicalPalFrame(world, 0, false, { action: 'lob', direction: 'front' }).index, 7);
    const lob = physicalPalFrame(world, 0, false, { action: 'lob', direction: 'front' });
    const [pixelX, pixelY] = lob.frame.rightHandPixel;
    assert.equal(lob.rightHand[0], (pixelX - lob.frame.cell[0] - lob.frame.anchor[0]) / lob.atlas.pixelsPerUnit);
    assert.equal(lob.rightHand[1], (lob.frame.cell[1] + lob.frame.anchor[1] - pixelY) / lob.atlas.pixelsPerUnit);
    assert.equal(physicalPalFrame(world, 0, false, { action: 'smash', phase: .8 }).index, 3);
    assert.equal(physicalPalFrame(world, 0, false, { action: 'smash', direction: 'left' }).mirror, true);
    assert.notEqual(physicalPalFrame(world, 0, true, { action: 'climb' }).index, physicalPalFrame(world, .2, true, { action: 'climb' }).index);
    assert.notDeepEqual(physicalPalFrame(world, .1, true, { direction: 'left' }).frame.cell, physicalPalFrame(world, .2, true, { direction: 'left' }).frame.cell);
  }
});

test('actor UV ownership and late-load teardown release every active and inactive texture once', async t => {
  const previousImage = globalThis.Image, requested = [];
  globalThis.Image = class {
    set src(value) { this.url = value; this.naturalWidth = 1254; requested.push(this); }
  };
  t.after(() => { globalThis.Image = previousImage; });
  assert.equal(physicalPalArtDelivery('meadow').tools, 'not-requested');
  const removed = createPalFigure(THREE, { world: 'meadow' });
  const actor = createPalFigure(THREE, { world: 'meadow' });
  assert.equal(physicalPalArtDelivery('meadow').tools, 'pending');
  disposeObject(removed);
  assert.equal(requested.length, 3, 'decoded images are shared across mounted actors');
  for (const image of requested) image.onload();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(physicalPalArtDelivery('meadow').tools, 'delivered');
  const reported = physicalPalArtDelivery('meadow'); reported.tools = 'unavailable';
  assert.equal(physicalPalArtDelivery('meadow').tools, 'delivered', 'read-only snapshots cannot alter image delivery');
  assert.equal(removed.userData.authoredPal.delivery, 'disposed'); assert.equal(removed.userData.authoredPal.maps.size, 0);
  assert.equal(actor.userData.authoredPal.maps.size, 3);
  const other = createPalFigure(THREE, { world: 'meadow' });
  await new Promise(resolve => setImmediate(resolve));
  const otherMap = other.userData.authoredPal.material.map;
  animatePalFigure(actor, .3, false, { action: 'forehand', phase: .5, direction: 'back' });
  assert.notEqual(actor.userData.authoredPal.material.map, otherMap);
  assert.equal(other.userData.authoredPal.atlas, 'locomotion');
  const disposals = new Map();
  for (const texture of actor.userData.authoredPal.maps.values()) texture.addEventListener('dispose', () => disposals.set(texture, (disposals.get(texture) || 0) + 1));
  disposeObject(actor);
  assert.equal(disposals.size, 3); assert.deepEqual([...disposals.values()], [1, 1, 1]);
  assert.equal(other.userData.authoredPal.delivery, 'delivered'); disposeObject(other);
});

test('Hard Builders teaches its actual read-and-place task while earlier bands retain picture/audio encoding', () => {
  const game = { id: 'burrow-builders', title: 'Burrow Builders' };
  const easy = arcadeGuideForGame(game, { difficulty: 'easy' }), hard = arcadeGuideForGame(game, { difficulty: 'hard' });
  assert.match(easy.instruction, /letters.*word/); assert.equal(hard.kind, 'place');
  assert.match(hard.instruction, /Read the plan/);
  assert.ok(hard.steps.every(step => !/hear|picture/i.test(step)));
});
