import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { playRacerTarget, prewarmRacerTarget, playRacerExample, playRacerInstruction, SOUND_RACER_INSTRUCTION } from '../../src/features/soundRacer/audio.js';
import { playCueAudio, stopCueAudio } from '../../src/utils/audio/cuePlayer.js';
import { getLetterSoundCue } from '../../src/components/learn/phonics/cvc/cvcHelpers.js';

const instances = [];
class FakeAudio {
  constructor() { this.src = ''; this.readyState = 4; this.listeners = new Map(); this.paused = true; instances.push(this); }
  addEventListener(type, listener) { const list = this.listeners.get(type) || new Set(); list.add(listener); this.listeners.set(type, list); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type) { for (const listener of [...(this.listeners.get(type) || [])]) listener(); }
  load() {}
  play() { this.paused = false; return this.rejectPlay ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
  pause() { this.paused = true; }
  removeAttribute() { this.src = ''; }
}
const currentAudio = () => instances.findLast(audio => !audio.paused);

test('racer cue ownership, delivery and exact warmed element lifecycle', async t => {
  const previous = { Audio: globalThis.Audio, window: globalThis.window };
  globalThis.Audio = FakeAudio;
  globalThis.window = { speechSynthesis: { cancel() {} } };
  try {
    await t.test('pure target recording is pending until ended; warming reuses exact element', async () => {
      const events = [];
      const release = prewarmRacerTarget('a');
      const warmed = instances.at(-1);
      const cancel = playRacerTarget('a', { cueId: 'mission:round:1', isCurrent: () => true, onDelivery: e => events.push(e) });
      await Promise.resolve();
      assert.equal(currentAudio(), warmed);
      assert.equal(warmed.src, getLetterSoundCue('a', { vowel: 'a' }).src);
      assert.ok(existsSync(resolve('public', `.${warmed.src}`)));
      assert.ok(events.every(e => e.audioDelivery === 'pending'));
      warmed.emit('ended');
      assert.equal(events.at(-1).audioDelivery, 'delivered');
      assert.equal(events.at(-1).purpose, 'target');
      const count = events.length;
      warmed.emit('ended'); cancel(); release(); release();
      assert.equal(events.length, count);
    });
    await t.test('cancel reports interruption and never later delivers the old round', () => {
      const events = [];
      const cancel = playRacerTarget('s', { cueId: 'cancel', isCurrent: () => true, onDelivery: e => events.push(e) });
      const audio = currentAudio();
      cancel(); cancel(); audio.emit('ended');
      assert.equal(events.at(-1).audioDelivery, 'interrupted');
      assert.equal(events.filter(e => e.audioDelivery === 'interrupted').length, 1);
      assert.equal(events.some(e => e.audioDelivery === 'delivered'), false);
    });
    await t.test('stale cancel does not stop a replacement global voice', () => {
      let live = true;
      const events = [];
      const cancel = playRacerTarget('t', { cueId: 'old', isCurrent: () => live, onDelivery: e => events.push(e) });
      live = false;
      playCueAudio('/replacement.mp3', { cueId: 'replacement' });
      const replacement = currentAudio();
      cancel();
      assert.equal(replacement.paused, false);
      assert.equal(events.some(e => e.audioDelivery !== 'pending'), false);
      stopCueAudio();
    });
    await t.test('media error and rejected play are unavailable, never delivered', async () => {
      const events = [];
      playRacerTarget('m', { cueId: 'error', isCurrent: () => true, onDelivery: e => events.push(e) });
      currentAudio().emit('error');
      assert.equal(events.at(-1).audioDelivery, 'unavailable');
      const release = prewarmRacerTarget('b');
      const audio = instances.at(-1); audio.rejectPlay = true;
      playRacerTarget('b', { cueId: 'reject', isCurrent: () => true, onDelivery: e => events.push(e) });
      await Promise.resolve(); await Promise.resolve();
      assert.equal(events.at(-1).audioDelivery, 'unavailable');
      assert.equal(events.some(e => e.audioDelivery === 'delivered'), false);
      release();
    });
    await t.test('noncurrent request cannot replace audio; example purpose stays separate', () => {
      playCueAudio('/keep.mp3', { cueId: 'keep' });
      const keep = currentAudio();
      playRacerTarget('a', { cueId: 'stale', isCurrent: () => false });
      assert.equal(keep.paused, false);
      const events = [];
      playRacerExample('cat', { cueId: 'tutorial', isCurrent: () => true, onDelivery: e => events.push(e) });
      currentAudio().emit('ended');
      assert.equal(events.at(-1).purpose, 'example');
      assert.equal(events.at(-1).audioDelivery, 'delivered');
    });
    await t.test('missing target stays unavailable without stopping unrelated playback', () => {
      playCueAudio('/keep.mp3', { cueId: 'keep' });
      const keep = currentAudio(); const events = [];
      playRacerTarget('', { cueId: 'missing', isCurrent: () => true, onDelivery: e => events.push(e) });
      assert.equal(events.at(-1).audioDelivery, 'unavailable');
      assert.equal(keep.paused, false);
    });
    await t.test('recorded instruction has exact text/provenance and independent playback purpose', () => {
      const record = SOUND_RACER_INSTRUCTION;
      assert.equal(record.text, 'Choose a word on a road sign. Then press Drive through to open the road.');
      assert.equal(record.voice, 'en-US-Chirp3-HD-Leda');
      assert.equal(record.normalization.sampleRateHertz, 24000);
      assert.equal(record.normalization.channels, 1);
      assert.equal(record.humanListening, 'UNKNOWN');
      const bytes = readFileSync(resolve('public', `.${record.src}`));
      assert.equal(bytes.length, record.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
      assert.match(record.sourceHash, /^[a-f0-9]{64}$/);
      const events = [];
      const cancel = playRacerInstruction({ cueId: 'instruction', isCurrent: () => true, onDelivery: e => events.push(e) });
      assert.equal(currentAudio().src, record.src);
      currentAudio().emit('ended');
      assert.equal(events.at(-1).purpose, 'instruction');
      assert.equal(events.at(-1).audioDelivery, 'delivered');
      cancel();
    });
  } finally {
    stopCueAudio(); globalThis.Audio = previous.Audio; globalThis.window = previous.window;
  }
});
