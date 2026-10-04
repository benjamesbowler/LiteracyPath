import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundKeysInstrument } from '../../src/features/soundkeys/instrument.js';

function audioRig() {
  const gains = [], oscillators = [], contexts = [];
  class Context {
    currentTime = 4; destination = {};
    constructor() { contexts.push(this); }
    resume() { return Promise.resolve(); }
    close() { this.closed = true; return Promise.resolve(); }
    createGain() {
      const calls = [], node = { calls, gain: { value: 0,
        setValueAtTime: (...args) => calls.push(['value', ...args]),
        linearRampToValueAtTime: (...args) => calls.push(['linear', ...args]),
        exponentialRampToValueAtTime: (...args) => calls.push(['exponential', ...args]),
        cancelScheduledValues: (...args) => calls.push(['cancel', ...args]),
        setTargetAtTime: (...args) => calls.push(['target', ...args]) },
      connect(to) { this.to = to; }, disconnect() { this.disconnected = true; } };
      gains.push(node); return node;
    }
    createOscillator() {
      const node = { frequency: {}, connect(to) { this.to = to; }, disconnect() { this.disconnected = true; },
        start() {}, stop(at) { this.stopped = at; } };
      oscillators.push(node); return node;
    }
  }
  return { Context, gains, oscillators, contexts };
}

test('optional teaching duck preserves standalone pitch, attack, decay and default gain', () => {
  const rig = audioRig(), instrument = createSoundKeysInstrument(rig.Context);
  instrument.play('held', 69, 'bells');
  const [master, voice] = rig.gains;
  assert.equal(master.gain.value, 1);
  assert.equal(master.to, rig.contexts[0].destination);
  assert.equal(voice.to, master);
  assert.equal(rig.oscillators[0].frequency.value, 440);
  assert.equal(rig.oscillators[0].type, 'sine');
  assert.deepEqual(voice.calls, [['value', 0, 4], ['linear', .15, 4.012], ['exponential', .001, 5.2]]);
  instrument.setDucked(true);
  assert.deepEqual(master.calls.slice(-2), [['cancel', 4], ['target', .28, 4, .035]]);
  instrument.setDucked(false);
  assert.deepEqual(master.calls.slice(-2), [['cancel', 4], ['target', 1, 4, .035]]);
  instrument.dispose();
  assert.equal(master.disconnected, true); assert.equal(rig.contexts[0].closed, true);
  assert.equal(rig.oscillators[0].stopped, 4);
});

test('duck requested before first native tone is retained without opening an audio context', () => {
  const rig = audioRig(), instrument = createSoundKeysInstrument(rig.Context);
  instrument.setDucked(true); assert.equal(rig.contexts.length, 0);
  instrument.play('reed', 60, 'reeds');
  assert.equal(rig.gains[0].gain.value, .28); assert.equal(rig.oscillators[0].type, 'triangle');
  instrument.dispose(); instrument.setDucked(false);
  assert.equal(rig.contexts.length, 1);
});

test('unavailable AudioContext leaves the leaf able to process its spelling action', () => {
  const instrument = createSoundKeysInstrument(class { constructor() { throw new Error('Unavailable audio device'); } });
  assert.doesNotThrow(() => { instrument.play('a', 60); instrument.release('a'); instrument.stop(); instrument.dispose(); });
});
