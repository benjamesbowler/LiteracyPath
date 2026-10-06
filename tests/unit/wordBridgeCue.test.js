import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordBridgeCue } from '../../src/components/learn/games/games/wordBridgeCue.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
const round = word => ({ target: word, audio: getLedaWordAudioPath(word), isSentence: false });
function playback() {
  const calls = [], owners = new Set(), releases = [];
  const speaker = (value, options) => new Promise((resolve, reject) => calls.push({ value, options, resolve, reject }));
  let enabled = true;
  const cue = createWordBridgeCue({ speakWord: speaker, speakSentence: speaker, getSound: () => enabled, now: () => 80,
    duckMusic: owner => owners.add(owner), restoreMusic: owner => { owners.delete(owner); releases.push(owner); } });
  return { cue, calls, owners, releases, mute() { enabled = false; cue.stop(); } };
}
test('Bridge target mix starts only on actual playback, exact ended source delivers before settlement and copied receipts cannot mutate it', async () => {
  const { cue, calls, owners, releases } = playback(), target = round('cat'), promise = cue.play(target), clip = calls[0];
  assert.equal(owners.size, 0); clip.options.onStart(); clip.options.onStart(); assert.equal(owners.size, 1);
  assert.equal(cue.mixSnapshot().ducked, true); clip.options.onEnd(target.audio); assert.equal(owners.size, 0);
  assert.deepEqual(cue.snapshot(), { delivery: 'delivered', deliveryReceipt: { source: target.audio, endedAt: 80 } });
  const copy = cue.snapshot(); copy.deliveryReceipt.source = '/other.mp3'; assert.equal(cue.snapshot().deliveryReceipt.source, target.audio);
  clip.options.onStart(); assert.equal(owners.size, 0); clip.resolve(); await promise; assert.equal(releases.length, 1); cue.dispose();
});
test('Bridge target replacement aborts and releases the old owner; its late start/end/finally cannot unduck or credit the new target', async () => {
  const { cue, calls, owners } = playback(), first = cue.play(round('cat')), old = calls[0]; old.options.onStart();
  const next = cue.play(round('dog')), current = calls[1]; assert.equal(old.options.signal.aborted, true); assert.equal(owners.size, 0);
  current.options.onStart(); const owner = [...owners][0]; old.options.onStart(); old.options.onEnd(round('cat').audio); old.resolve(); await first;
  assert(owners.has(owner)); assert.equal(cue.snapshot().delivery, 'pending'); assert.equal(cue.snapshot().deliveryReceipt, null);
  current.options.onEnd(round('dog').audio); current.resolve(); await next; assert.equal(owners.size, 0); cue.dispose();
});
test('Bridge pause, mute, save abort, stage preparation and dispose release only the current voice and reject its late ends', async () => {
  for (const stop of [owner => owner.cue.stop(), owner => owner.mute(), owner => owner.cue.prepare(round('dog')), owner => owner.cue.dispose()]) {
    const owner = playback(), pending = owner.cue.play(round('cat')), clip = owner.calls[0]; clip.options.onStart(); stop(owner);
    assert.equal(clip.options.signal.aborted, true); assert.equal(owner.owners.size, 0); assert.equal(owner.releases.length, 1);
    clip.options.onEnd(round('cat').audio); clip.options.onStart(); clip.resolve(); await pending;
    assert.equal(owner.cue.snapshot().deliveryReceipt, null); assert.equal(owner.owners.size, 0); owner.cue.dispose();
  }
});
test('Bridge error, silent settlement and unrelated ends never invent delivered target audio or retain a music owner', async () => {
  for (const finish of [clip => clip.reject(Error('playback error')), clip => clip.resolve(), clip => { clip.options.onEnd('/unrelated.mp3'); clip.resolve(); }]) {
    const { cue, calls, owners, releases } = playback(), playing = cue.play(round('cat')), clip = calls[0]; clip.options.onStart(); finish(clip); await playing;
    assert.equal(owners.size, 0); assert.equal(releases.length, 1); assert.deepEqual(cue.snapshot(), { delivery: 'unavailable', deliveryReceipt: null }); cue.dispose();
  }
});
test('Bridge unavailable whole-sentence instruction cannot be aliased to individual word clips; muted targets never request speech', async () => {
  const cue = createWordBridgeCue({ speakWord: () => assert.fail('No isolated alias'), speakSentence: () => assert.fail('Missing whole sentence remains unavailable') });
  await cue.play({ target: 'The cat sat', isSentence: true, audio: '' }); assert.deepEqual(cue.snapshot(), { delivery: 'unavailable', deliveryReceipt: null }); cue.dispose();
  const muted = createWordBridgeCue({ speakWord: () => assert.fail('Sound off'), getSound: () => false });
  await muted.play(round('cat')); assert.equal(muted.snapshot().delivery, 'unavailable'); muted.dispose();
});
