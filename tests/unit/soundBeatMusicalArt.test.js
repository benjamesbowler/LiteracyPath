import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOUND_BEAT_POSES, soundBeatHandForLane, soundBeatMusicalPose } from '../../src/components/learn/games/games/soundBeatPerformanceArt.js';
import { SOUND_BEAT_ART } from '../../src/components/learn/games/games/soundBeatArtData.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';

test('native pad input enters genuine measured contact immediately without waiting for an artist clock', () => {
  for (const [character, actorIndex] of [['bouncy', 0], ['woolly', 1], ['chompy', 0], ['sunny', 1], ['pip', 0], ['wren', 1]]) {
    for (const lane of [actorIndex * 2, actorIndex * 2 + 1]) {
      const pose = soundBeatMusicalPose({ character, actorIndex, lane, targetTime: 10, now: 10, input: { lane, at: 10 } });
      assert.equal(pose.action, 'strike');
      assert.equal(pose.contact, true);
      assert.equal(pose.phase, 0);
      const frame = SOUND_BEAT_ART[pose.atlas].frames[pose.frame];
      assert.ok(character === 'sunny' ? frame.sockets.leftForefoot && frame.sockets.rightForefoot : frame.leftHandPixel && frame.rightHandPixel);
      assert.equal(frame.excluded, undefined);
      const placement = registeredPalCanvasPose(SOUND_BEAT_ART[pose.atlas], frame, { x: 180, y: 460, height: 220, mirror: actorIndex === 1 });
      assert.ok(Number.isFinite(placement.sockets[pose.limb].x));
      assert.ok(Number.isFinite(placement.sockets[pose.limb].y));
      if (character === 'sunny') { assert.equal(pose.hand, null); assert.equal(frame.leftHandPixel, undefined); assert.equal(frame.rightHandPixel, undefined); }
    }
  }
});

test('all selected preparation/recovery/finale/contacts are separate registered original musical drawings', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../source-art/arcade/physical-worlds/sound-beat/scene-kit-v1.json', import.meta.url)));
  for (const [character, poses] of Object.entries(SOUND_BEAT_POSES)) {
    const atlas = SOUND_BEAT_ART[`${character}-music-performance-v1`];
    assert.equal(manifest.assets[`${character}-music-performance-v1`].sourceSha256, atlas.sourceSha256);
    assert.match(atlas.runtime, /sound-beat\/.*-music-performance-v1\.webp$/);
    assert.ok(atlas.alphaPixels > 0);
    const indices = [poses.ready, ...Object.values(poses.contact), ...Object.values(poses.preparation).flat(), ...poses.recovery, ...poses.finale];
    assert.ok(new Set(indices).size >= 10);
    for (const index of indices) {
      const frame = atlas.frames[index];
      assert.equal(frame.excluded, undefined);
      assert.ok(character === 'sunny' ? frame.sockets.leftForefoot && frame.sockets.rightForefoot : frame.leftHandPixel && frame.rightHandPixel);
      assert.ok(frame.anchor[1] > 0);
    }
  }
});

test('miss/recovery, phrase flourish and accompaniment remain visual states with no answer/credit commands', () => {
  const base = { character: 'bouncy', actorIndex: 0, lane: 2, targetTime: 20, now: 10 };
  assert.equal(soundBeatMusicalPose({ ...base, missAt: 9.8 }).action, 'recovery');
  assert.equal(soundBeatMusicalPose({ ...base, phraseAt: 9.8 }).action, 'phrase-finale');
  assert.equal(soundBeatMusicalPose({ ...base, now: 10.03, roundStartAt: 0, spacing: 1, section: 2, musicEnabled: true }).action, 'accompaniment');
  assert.equal(soundBeatMusicalPose({ ...base, now: 10.03, section: 2, musicEnabled: true, reducedMotion: true }).action, 'ready');
  const wrongPad = soundBeatMusicalPose({ ...base, lane: 0, input: { lane: 1, at: 10 } });
  assert.equal(wrongPad.action, 'strike');
  assert.equal(wrongPad.hand, 'leftHand');
  assert.equal('score' in wrongPad, false);
  assert.equal('correct' in wrongPad, false);
  assert.equal('advance' in wrongPad, false);
});

test('mirrored partner pairs anatomical hands with the correct visible lane', () => {
  assert.equal(soundBeatHandForLane(0, 0), 'rightHand');
  assert.equal(soundBeatHandForLane(0, 1), 'leftHand');
  assert.equal(soundBeatHandForLane(1, 2), 'leftHand');
  assert.equal(soundBeatHandForLane(1, 3), 'rightHand');
});
