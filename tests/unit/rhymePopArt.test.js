import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { RHYME_POP_ART } from '../../src/components/learn/games/games/rhymePopArtData.js';
import { rhymeLauncherGeometry } from '../../src/utils/rhymePopMotion.js';
import { rhymeLauncherBarrelTransform, rhymeOperatorPlacement, rhymePopStageLayout } from '../../src/components/learn/games/games/rhymePopWorld.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';

test('all three original launcher casts own measured opaque press contacts and distinct registered recovery/finale bodies', async () => {
  for (const name of ['bouncy', 'chompy', 'pip']) {
    const asset = RHYME_POP_ART[`${name}-launcher-actions-v1`];
    const data = fs.readFileSync(`public${asset.runtime}`);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), asset.runtimeSha256);
    const { data: rgba, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [asset.width, asset.height]);
    assert.equal(asset.frames.length, 16); assert.equal(asset.contactFrame, 6);
    assert.ok(asset.packing.isolatedCells && asset.packing.originalOpaqueBodyPixelsPreserved);
    const contact = asset.frames[6].sockets[asset.anatomy];
    assert.ok(rgba[(contact[1]*info.width+contact[0])*4+3] >= 192);
    assert.notDeepEqual(asset.frames[6].cell, asset.frames[7].cell);
    assert.notDeepEqual(asset.frames[14].cell, asset.frames[15].cell);
    assert.ok(fs.existsSync(`public${RHYME_POP_ART[`${name}-launcher-fallback-v1`].runtime}`));
  }
});

test('every selectable idle, error, recoil and finale pose fits the decoded atlas and retains a valid foot anchor', () => {
  for (const character of ['bouncy', 'chompy', 'pip']) {
    const asset = RHYME_POP_ART[`${character}-launcher-actions-v1`];
    for (const frame of asset.frames) {
      const pose = registeredPalCanvasPose(asset, frame, { x: 120, y: 220, height: 110 });
      assert.ok(pose.source.x+pose.source.width <= asset.width);
      assert.ok(pose.source.y+pose.source.height <= asset.height);
      assert.ok(asset.packing.frames[frame.id].completeFrameInsideTile);
      for (const coordinate of Object.values(pose.sockets)) assert.ok(Number.isFinite(coordinate.x) && Number.isFinite(coordinate.y));
    }
  }
});

test('every authored kit mouth maps to the physical projectile origin after any visible aim rotation', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const [w, h] of [[1366,768], [320,568], [320,340], [568,260]]) for (const x of [24, w/2, w-24]) {
    for (const suffix of ['v1', 'fallback-v1']) {
      const parts = RHYME_POP_ART[`${world}-launcher-kit-${suffix}`].parts;
      const geometry = rhymeLauncherGeometry(w, h, { x, y: h*.3 }), painted = rhymeLauncherBarrelTransform(parts, geometry);
      assert.ok(Math.hypot(painted.mouth.x-geometry.muzzle.x, painted.mouth.y-geometry.muzzle.y) < 1e-9);
    }
  }
});

test('all original bodies, including raised finales, fit the portrait gap between real thumb controls', () => {
  const art = { pose: (id, frame, placement) => registeredPalCanvasPose(RHYME_POP_ART[id], RHYME_POP_ART[id].frames[frame], placement) };
  for (const [width, height] of [[320, 568], [320, 340], [320, 480], [375, 667], [390, 844]]) {
    const layout = rhymePopStageLayout(width, height, 7), geometry = rhymeLauncherGeometry(width, height);
    for (const name of ['bouncy', 'chompy', 'pip']) {
      const id = `${name}-launcher-actions-v1`;
      for (const frame of RHYME_POP_ART[id].frames) {
        const placement = rhymeOperatorPlacement(art, id, frame.id, layout, geometry), pose = art.pose(id, frame.id, placement);
        const bounds = frame.bounds;
        const body = { left: placement.x+pose.destination.x+bounds[0]*pose.pixelScale,
          right: placement.x+pose.destination.x+bounds[2]*pose.pixelScale,
          top: placement.y+pose.destination.y+bounds[1]*pose.pixelScale,
          bottom: placement.y+pose.destination.y+bounds[3]*pose.pixelScale };
        assert.ok(body.left >= 136-1e-8 && body.right <= width-84+1e-8, `${width}x${height} ${name}/${frame.id} ${JSON.stringify(body)}`);
        assert.ok(body.top >= 0 && body.bottom <= height, JSON.stringify(body));
        assert.equal(placement.y, layout.floor);
        if (layout.short) assert.ok(body.top >= layout.circulation.top+layout.circulation.bend*2+layout.radius+3,
          `Short-screen body crossed a moving word face: ${name}/${frame.id} ${JSON.stringify(body)}`);
      }
    }
  }
});

test('wide operator placement stays unchanged while compact barrel clears the last word row', () => {
  const art = { pose: (id, frame, placement) => registeredPalCanvasPose(RHYME_POP_ART[id], RHYME_POP_ART[id].frames[frame], placement) };
  const wide = rhymePopStageLayout(1366, 768, 5), geometry = rhymeLauncherGeometry(1366, 768);
  for (const name of ['bouncy', 'chompy', 'pip']) for (let frame = 0; frame < 16; frame++) {
    assert.deepEqual(rhymeOperatorPlacement(art, `${name}-launcher-actions-v1`, frame, wide, geometry),
      { x: 506.36, y: 750, height: 215.04000000000002 });
  }
  for (const height of [340, 480, 568, 667, 844]) {
    const compact = rhymePopStageLayout(320, height, 7), lastFaceBottom = compact.circulation.top+compact.circulation.bend*2+compact.radius;
    for (const x of [24, 160, 296]) {
      const cannon = rhymeLauncherGeometry(320, height, { x, y: 24 });
      assert.ok(cannon.muzzle.y-cannon.barrelHeight/2 > lastFaceBottom,
        `Portrait painted muzzle overlapped a word face: ${JSON.stringify(cannon)}`);
    }
  }
});
