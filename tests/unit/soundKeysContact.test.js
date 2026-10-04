import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUNDKEYS_ART } from '../../src/components/learn/games/games/soundKeysArtData.js';
import { soundKeysKeyContactPose, soundKeysRestingPose } from '../../src/components/learn/games/games/soundKeysWorld.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const bank = { pose(id, index, placement) { const atlas = SOUNDKEYS_ART[id]; return registeredPalCanvasPose(atlas, atlas.frames[index], placement); } };
test('authored paw and wing contacts solve against the same live key geometry in either direction', () => {
  for (const character of ['speedy', 'clucky']) {
    for (let frame = 4; frame <= 11; frame += 1) {
      for (const mirror of [false, true]) {
        const key = { x: 21 + (frame - 4) * 36, y: 266 }, pose = soundKeysKeyContactPose(bank, character, frame, key, 112, mirror);
        assert.ok(pose.separation < 1e-10);
        assert.deepEqual(pose.target, key);
        assert.match(pose.limb, character === 'speedy' ? /Forepaw$/ : /Wingtip$/);
        const actual = bank.pose(pose.atlas, frame, pose.placement);
        assert.deepEqual(actual.sockets[pose.limb], pose.socket);
        const copy = structuredClone(pose); copy.socket.x += 20;
        assert.ok(soundKeysKeyContactPose(bank, character, frame, key, 112, mirror).separation < 1e-10);
      }
    }
  }
});
test('only explicitly measured anatomy can produce a registered key contact', () => {
  assert.equal(soundKeysKeyContactPose(bank, 'speedy', 0, { x: 100, y: 250 }, 112), null);
});

test('wide finale poses retain complete bodies in separate phone and short stage regions', () => {
  for (const [left, width, top, height] of [[8, 148, 216, 180], [220, 44, 74, 64], [8, 268, 150, 66]]) {
    for (const [index, character] of ['speedy', 'clucky'].entries()) {
      for (const frame of [0, 13, 14, 15]) {
        const region = { x: left + index * (width + 8), y: top, width, height };
        const pose = soundKeysRestingPose(bank, character, frame, region, 148, index === 0);
        assert.ok(pose.bounds.x >= region.x - 1e-8);
        assert.ok(pose.bounds.y >= region.y - 1e-8);
        assert.ok(pose.bounds.x + pose.bounds.width <= region.x + region.width + 1e-8);
        assert.ok(pose.bounds.y + pose.bounds.height <= region.y + region.height + 1e-8);
        const measured = bank.pose(`${character}-keyboard-actions-v1`, frame, pose.placement);
        assert.equal(measured.destination.width, pose.bounds.width);
        assert.ok(Math.abs(pose.placement.y + measured.destination.y + measured.destination.height - region.y - region.height) < 1e-8);
      }
    }
  }
});

test('individually registered bodies retain their actual feet and exclude the adjacent pose', async () => {
  const registration = JSON.parse(await readFile(new URL('../../source-art/arcade/physical-worlds/soundkeys/key-registration-v1.json', import.meta.url), 'utf8'));
  for (const character of ['speedy', 'clucky']) {
    const atlas = SOUNDKEYS_ART[`${character}-keyboard-actions-v1`];
    const { data, info } = await sharp(new URL('../../' + atlas.source, import.meta.url).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alpha = (x, y) => data[(y * info.width + x) * info.channels + 3];
    for (const frame of atlas.frames) {
      assert.deepEqual(frame.cell, registration[character].frameWindows[String(frame.id)]);
      const [left, top, right, bottom] = frame.cell;
      const floor = top + frame.bounds[3] - 1;
      assert.ok(floor < bottom && floor >= top);
      assert.ok(Array.from({ length: right - left }, (_, x) => alpha(left + x, floor)).some(a => a >= 192), `${character} frame ${frame.id} keeps its own foot baseline`);
      assert.equal(frame.anchor[1], frame.bounds[3]);
      for (const other of atlas.frames) {
        if (other.id === frame.id) continue;
        const body = [other.cell[0] + other.bounds[0], other.cell[1] + other.bounds[1], other.cell[0] + other.bounds[2], other.cell[1] + other.bounds[3]];
        const intersection = Math.max(0, Math.min(right, body[2]) - Math.max(left, body[0])) * Math.max(0, Math.min(bottom, body[3]) - Math.max(top, body[1]));
        assert.equal(intersection, 0, `${character} frame ${frame.id} excludes body ${other.id}`);
      }
    }
  }
});
