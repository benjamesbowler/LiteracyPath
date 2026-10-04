import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { LETTER_LEAP_ATLASES, LETTER_LEAP_FOE_ATLASES, LETTER_LEAP_SCENE_ART } from '../../src/components/learn/games/games/letterLeapArt.generated.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';
import { letterLeapPose, letterLeapFoePose, LETTER_LEAP_CAST } from '../../src/components/learn/games/games/letterLeapSceneKit.js';
import { letterLeapHeadContact, letterLeapBlockContact, letterLeapPlatformHasClearance } from '../../src/components/learn/games/games/letterLeapContact.js';

test('all three canonical platforming casts have genuinely distinct move/jump/landing source poses', () => {
  assert.deepEqual(LETTER_LEAP_CAST, { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' });
  for (const hero of Object.values(LETTER_LEAP_CAST)) {
    const banks = Object.entries(LETTER_LEAP_ATLASES).filter(([id]) => id.startsWith(hero + '-'));
    const poses = banks.flatMap(([, atlas]) => atlas.frames);
    for (const action of ['idle', 'run-extended-a', 'run-passing', 'brake', 'crouch', 'takeoff', 'rise', 'fall', 'land','bump','recover','correct','summit']) {
      assert.ok(poses.some(frame => frame.action === action), `${hero}: missing ${action}`);
    }
    const owned = banks.find(([id]) => id.endsWith('-platforming'))[1];
    assert.equal(new Set(owned.frames.map(frame => JSON.stringify(frame.cell))).size, 9);
  }
});

test('authored reactions preserve stationary contact and let real walking/jumping take precedence',()=>{
  const player={onGround:true,vx:0,vy:0,squash:0,feedback:'hurt',feedbackTime:1.3};
  assert.equal(letterLeapPose(player),'bump');player.feedbackTime=.7;assert.equal(letterLeapPose(player),'recover');
  player.feedback='correct';assert.equal(letterLeapPose(player),'correct');player.feedback='summit';assert.equal(letterLeapPose(player),'summit');
  player.vx=4;assert.match(letterLeapPose(player),/^run-/);player.onGround=false;player.vy=-12;
  assert.equal(letterLeapPose(player),'takeoff');
});

test('foot sockets remain on the visible platform baseline at any size and mirror without guessed hands', () => {
  for (const atlas of Object.values(LETTER_LEAP_ATLASES)) for (const frame of atlas.frames) {
    assert.deepEqual(Object.keys(frame.sockets), ['feet', 'crown', 'headLeft', 'headRight']);
    assert.equal(frame.sockets.leftHand, undefined);
    assert.equal(frame.sockets.rightHand, undefined);
    for (const height of [56, 76, 110]) for (const mirror of [false, true]) {
      const pose = registeredPalCanvasPose(atlas, frame, { x: 300, y: 420, height, mirror });
      assert.equal(pose.sockets.feet.y, 420);
      const pixelX = frame.sockets.feet[0] - frame.cell[0] - frame.anchor[0];
      assert.ok(Math.abs(pose.sockets.feet.x - (300 + (mirror ? -1 : 1) * pixelX * pose.pixelScale)) < 1e-8);
      assert.ok(pose.source.width > 0 && pose.source.height > 0);
    }
  }
});

test('measured visible crown hits the underside before the obsolete 46-unit controller head', () => {
  const previous = { x: 564.94, y: 388.02, h: 46, w: 32, vy: -13.6, face: 1, onGround: false, anim: 0 };
  const current = { ...previous, y: 375.66, vy: -12.36 };
  const block = { x: 542, y: 286, w: 44, h: 40, broken: false };
  const before = letterLeapHeadContact('meadow', previous, 76);
  const after = letterLeapHeadContact('meadow', current, 76);
  assert.ok(current.y - current.h / 2 > block.y + block.h, 'old controller head has not reached the block');
  assert.ok(after.top <= block.y + block.h, 'actual opaque crown has reached the block');
  const response = letterLeapBlockContact(current, previous, block, after, before);
  assert.equal(response?.kind, 'head');
  assert.ok(Math.abs(after.top + response.y - current.y - (block.y + block.h + 0.5)) < 1e-8);
});

test('solid crate sides and a low ceiling cannot be walked or landed through', () => {
  const block = { x: 542, y: 286, w: 44, h: 40, broken: false };
  const previous = { x: 503, y: 329, h: 46, w: 32, vy: 0, face: 1, onGround: true, vx: 2, anim: 0 };
  const current = { ...previous, x: 516 };
  const before = letterLeapHeadContact('meadow', previous, 76);
  const after = letterLeapHeadContact('meadow', current, 76);
  const response = letterLeapBlockContact(current, previous, block, after, before);
  assert.equal(response?.kind, 'side');
  assert.ok(Math.abs(after.right + response.x - current.x - block.x) < 1e-8);
  assert.equal(letterLeapPlatformHasClearance(current, { y: 352 }, after, [block]), false);
  assert.equal(letterLeapPlatformHasClearance(current, { y: 352 }, after, [{ ...block, broken: true }]), true);
});

test('pose selection follows real movement, reversal, spring/take-off, falling and landing state', () => {
  assert.equal(letterLeapPose({ onGround: true, vx: 0, squash: 0 }), 'idle');
  assert.equal(letterLeapPose({ onGround: true, vx: 4, squash: 0, anim: 0 }), 'run-extended-a');
  assert.equal(letterLeapPose({ onGround: true, vx: 4, squash: 0, anim: 0.9 }), 'run-passing');
  assert.equal(letterLeapPose({ onGround: true, vx: 4, squash: 0 }, { inputAxis: -1 }), 'brake');
  assert.equal(letterLeapPose({ onGround: false, vy: -19 }), 'takeoff');
  assert.equal(letterLeapPose({ onGround: false, vy: -5 }), 'rise');
  assert.equal(letterLeapPose({ onGround: false, vy: 7 }), 'fall');
  assert.equal(letterLeapPose({ onGround: true, vx: 4, squash: 0.3 }), 'land');
});

test('retained original sources and delivered derivatives match independently recorded dimensions and hashes', async () => {
  const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/letter-leap/manifest.json', 'utf8'));
  for (const asset of manifest.assets) {
    const source = await fs.readFile(asset.source), runtime = await fs.readFile('public' + asset.runtime);
    const sourceInfo = await sharp(source).metadata(), runtimeInfo = await sharp(runtime).metadata();
    assert.deepEqual([sourceInfo.width, sourceInfo.height], asset.sourceSize);
    assert.deepEqual([runtimeInfo.width, runtimeInfo.height], asset.runtimeSize);
    assert.equal(crypto.createHash('sha256').update(source).digest('hex'), asset.sourceSha256);
    assert.equal(crypto.createHash('sha256').update(runtime).digest('hex'), asset.runtimeSha256);
    assert.equal(crypto.createHash('sha256').update(await fs.readFile('source-art/arcade/physical-worlds/letter-leap/' + asset.prompt)).digest('hex'), asset.promptSha256);
    if (asset.kind !== 'horizon') assert.equal(runtimeInfo.hasAlpha, true);
    if (asset.kind === 'character') {
      const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (const frame of asset.frames) for (const point of Object.values(frame.measurement.headContactSource)) {
        assert.ok(data[(point[1] * info.width + point[0]) * info.channels + 3] >= 160, `${asset.id}/${frame.id}: contact is an actual opaque source pixel`);
      }
    }
  }
  for (const world of ['meadow', 'dino', 'moonwood']) assert.ok(LETTER_LEAP_SCENE_ART.terrain.frames.some(frame => frame.world === world));
  for (const world of ['meadow', 'dino', 'moonwood']) assert.ok(LETTER_LEAP_SCENE_ART[world + '-horizon']);
  assert.equal(LETTER_LEAP_ATLASES['bouncy-pals-passing'], undefined, 'the defective unused first-source figure is never published as a pose');
});

test('public scene metadata preserves its complete source contract with current branding and relative input references', async () => {
  const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/letter-leap/manifest.json', 'utf8'));
  const root = path.resolve(import.meta.dirname, '../..');
  for (const asset of manifest.assets.filter(asset => asset.kind !== 'character')) {
    const expected = { ...asset, width: asset.runtimeSize[0], height: asset.runtimeSize[1] };
    if (expected.creator) expected.creator = expected.creator.replace(/Literacy(?:\s+)?Path/g, 'Literacy Guide');
    if (expected.referenceSources) expected.referenceSources = expected.referenceSources.map(reference => {
      if (!path.isAbsolute(reference)) return reference;
      const suffix = reference.match(/\/(docs\/[^\0]+)$/)?.[1];
      assert.ok(suffix && !suffix.split('/').includes('..'), 'authoring path has an exact retained repository input');
      return suffix;
    });
    const published = LETTER_LEAP_SCENE_ART[asset.id];
    assert.deepEqual(published, expected, asset.id + ': only public branding and reference representation may change');
    assert.ok(!/Literacy(?:\s+)?Path/.test(published.creator));
    for (const reference of published.referenceSources || []) {
      assert.equal(path.isAbsolute(reference), false);
      assert.equal(reference.startsWith('../'), false);
      await fs.access(path.join(root, reference));
    }
  }
});

test('all twelve themed encounter families have original registered movement and impact poses', () => {
  assert.equal(Object.keys(LETTER_LEAP_FOE_ATLASES).length, 12);
  for (const world of ['meadow','dino','moonwood']) for (const type of ['walker','hopper','spike','flyer']) {
    const atlas = LETTER_LEAP_FOE_ATLASES[world + '-' + type];
    assert.deepEqual(atlas.frames.map(frame => frame.action), ['idle','travel-a','travel-b','impact']);
    assert.equal(new Set(atlas.frames.map(frame => JSON.stringify(frame.cell))).size,4);
    for (const frame of atlas.frames) for (const mirror of [false,true]) {
      const pose = registeredPalCanvasPose(atlas,frame,{x:200,y:400,height:type==='flyer'?40:46,mirror});
      assert.equal(pose.sockets.feet.y,400);
    }
  }
  assert.equal(letterLeapFoePose({type:'hopper',y:320,baseY:360,t:.4}),'travel-b');
  assert.equal(letterLeapFoePose({type:'walker',t:1,impacted:true}),'impact');
  assert.equal(letterLeapFoePose({type:'spike',t:2.3}),'impact');
  assert.equal(letterLeapFoePose({type:'flyer',t:1},{reducedMotion:true}),'idle');
});
