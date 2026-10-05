import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as THREE from 'three';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';
import { createWordClimbRegisteredActor } from '../../src/components/learn/games/games/wordClimbRegisteredActor.js';
import { WORD_CLIMB_RECOVERY_PALMS, wordClimbRecoveryAtlases, wordClimbRecoveryFrame, WORD_CLIMB_LEGACY_PIP } from '../../src/components/learn/games/games/wordClimbRecoveryArt.js';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('the last retained Moonwood picture registers its real visible forehand and sole without inventing an action family',async()=>{
  const atlas=WORD_CLIMB_LEGACY_PIP,frame=atlas.frames[0];
  const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-climb/recovery-manifest.json','utf8'));
  const bytes=await fs.readFile(`public${atlas.runtime}`);assert.equal(hash(bytes),manifest.legacyPip.runtimeSha256);
  const image=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual([image.info.width,image.info.height],[atlas.width,atlas.height]);
  for(const name of ['grip','bootLeft','bootRight']){const [x,y]=frame.sockets[name];assert(image.data[(y*atlas.width+x)*4+3]>=200,`${name} is measured within the visible retained hand/boot`);}
  assert.equal(atlas.frames.length,1);assert.equal(frame.action,'static-legacy-pip');
  const pose=registeredPalCanvasPose(atlas,frame,{x:405,y:318,height:112});assert.deepEqual(pose.sockets.feet,{x:405,y:318});
  assert(pose.sockets.grip.y<pose.sockets.feet.y);assert(pose.sockets.grip.y>pose.sockets.feet.y-112*.6,'The existing forehand is not mislabelled a raised climbing palm');
});

test('canonical Climb recovery uses retained exact shared sources and measured opaque raised palms, without replacing normal art', async () => {
  const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-climb/recovery-manifest.json', 'utf8'));
  assert.equal(manifest.assets.length, 6);
  for (const asset of manifest.assets) {
    const source = await fs.readFile(asset.source), runtime = await fs.readFile(`public${asset.runtime}`);
    assert.equal(hash(source), asset.sourceSha256); assert.equal(hash(runtime), asset.runtimeSha256);
    const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const delivered = await sharp(runtime).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([original.info.width, original.info.height], asset.sourceSize);
    assert.deepEqual([delivered.info.width, delivered.info.height], asset.runtimeSize);
    if (asset.family !== 'tools') continue;
    for (const point of WORD_CLIMB_RECOVERY_PALMS[asset.hero]) {
      const [x, y] = point;
      assert(original.data[(y * original.info.width + x) * 4 + 3] >= 160, `${asset.hero} original raised palm is opaque`);
      assert(delivered.data[(y * delivered.info.width + x) * 4 + 3] >= 160, `${asset.hero} delivered raised palm is opaque`);
    }
  }
});

test('recovery preserves each shared crop/common sole and exposes only actually measured action contacts', () => {
  for (const hero of ['bouncy', 'chompy', 'pip']) {
    const atlases = wordClimbRecoveryAtlases(hero), shared = PHYSICAL_PAL_ART[hero];
    assert.equal(atlases.climber.runtime, shared.actionAtlases.tools.runtime);
    assert.equal(atlases.movement.runtime, shared.runtime);
    for (const action of ['rest', 'climb-a', 'climb-b', 'recover-grip', 'jump-rise', 'jump-fall', 'land', 'summit-a', 'summit-b']) {
      const selected = wordClimbRecoveryFrame(atlases, action); assert(selected, `${hero}/${action}`);
      const atlas = atlases[selected.kind], frame = selected.frame;
      const original = (selected.kind === 'movement' ? shared : shared.actionAtlases.tools).frames
        .find(value => value.row === frame.row && value.column === frame.column);
      assert.deepEqual(frame.cell, original.cell); assert.deepEqual(frame.anchor, original.anchor);
      assert.deepEqual(frame.sockets.feet, [frame.cell[0] + frame.anchor[0], frame.cell[1] + frame.anchor[1]]);
      const pose = registeredPalCanvasPose(atlas, frame, { x: 313, y: 420, height: 112 });
      assert.deepEqual(pose.sockets.feet, { x: 313, y: 420 });
      const gripping = ['climb-a', 'climb-b', 'recover-grip'].includes(action);
      assert.equal(Boolean(pose.sockets.grip), gripping);
      assert(!pose.sockets.leftHand && !pose.sockets.rightHand, 'No unmeasured lower hand is invented');
      if (gripping) assert(pose.sockets.grip.y < pose.sockets.feet.y - 70);
    }
  }
  assert.throws(() => wordClimbRecoveryAtlases('unknown'));
});

test('Three recovery changes measured hands with real climb phases and preserves paused grip without extra meshes', async () => {
  const OriginalImage = globalThis.Image;
  class Image {
    set src(value) {
      if (!value) return;
      const source = Object.values(PHYSICAL_PAL_ART).flatMap(item => [item, item.actionAtlases.tools]).find(item => item.runtime === value);
      this.naturalWidth = source.width; this.naturalHeight = source.height;
      queueMicrotask(() => this.onload?.());
    }
    async decode() {}
  }
  globalThis.Image = Image;
  try {
    for (const hero of ['bouncy', 'chompy', 'pip']) {
      const atlases = wordClimbRecoveryAtlases(hero);
      const actor = createWordClimbRegisteredActor(THREE, atlases.climber, { movementAtlas: atlases.movement,
        representation: 'canonical-retained-pal-recovery' });
      try {
        assert.equal(await actor.ready, true);
        const mesh = actor.root.children[0];
        assert(actor.update({ state: 'climbing', elapsed: .1 }));
        const first = actor.contactWorld('grip', new THREE.Vector3()).toArray();
        actor.update({ state: 'climbing', elapsed: .4 });
        const second = actor.contactWorld('grip', new THREE.Vector3()).toArray(); assert.notDeepEqual(first, second);
        actor.update({ state: 'gripping', elapsed: 400 }); assert.deepEqual(actor.contactWorld('grip', new THREE.Vector3()).toArray(), second);
        actor.update({ state: 'airborne', vy: 20, elapsed: 401 }); assert.equal(actor.action, 'jump-rise');
        assert.equal(actor.contactWorld('grip', new THREE.Vector3()), null);
        actor.update({ state: 'recovering', elapsed: 402 }); assert.equal(actor.action, 'recover-grip');
        assert.deepEqual(actor.contactWorld('grip', new THREE.Vector3()).toArray(), first);
        assert.equal(actor.root.children.filter(item => item.isMesh).length, 1); assert.equal(actor.root.children[0], mesh);
        assert.equal(actor.inspect().representation, 'canonical-retained-pal-recovery');
      } finally { actor.dispose(); }
    }
  } finally { globalThis.Image = OriginalImage; }
});

test('missing retained sources cannot produce a ready recovery actor or a fabricated grip', async () => {
  const OriginalImage = globalThis.Image;
  class MissingImage { set src(value) { if (value) queueMicrotask(() => this.onerror?.()); } }
  globalThis.Image = MissingImage;
  try {
    const atlases = wordClimbRecoveryAtlases('chompy');
    const actor = createWordClimbRegisteredActor(THREE, atlases.climber, { movementAtlas: atlases.movement,
      representation: 'canonical-retained-pal-recovery' });
    try {
      assert.equal(await actor.ready, false); assert.equal(actor.delivery(), 'unavailable');
      assert.equal(actor.update({ state: 'climbing', elapsed: .1 }), false);
      assert.equal(actor.contactWorld('grip', new THREE.Vector3()), null); assert.equal(actor.root.visible, false);
    } finally { actor.dispose(); }
  } finally { globalThis.Image = OriginalImage; }
});
