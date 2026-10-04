import test from 'node:test';
import assert from 'node:assert/strict';
import { soundBeatMusicArrangement } from '../../src/utils/audio/soundBeatMusicScore.js';

test('ten original arrangements change orchestration and each concert world has a distinct musical identity', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const scores = Array.from({ length: 10 }, (_, index) => soundBeatMusicArrangement(index, world));
    assert.equal(new Set(scores.map(score => score.lead.join(','))).size, 10);
    for (const score of scores) {
      assert.equal(score.bass.length, 16); assert.equal(score.lead.length, 16);
      assert.ok(score.bass.every(value => Number.isFinite(value) && value > 0));
      assert.ok(score.lead.every(value => Number.isFinite(value) && value >= 0));
      assert.ok(score.kick.includes(0));
    }
    assert.ok(scores[8].hat.length > scores[0].hat.length);
    assert.ok(scores[4].clap.length > scores[0].clap.length);
  }
  assert.equal(new Set(['meadow', 'dino', 'moonwood'].map(world => soundBeatMusicArrangement(2, world).lead.join(','))).size, 3);
});

test('live arrangement changes and voice ducking preserve the one musical scheduler and skip elapsed steps', async () => {
  const originalWindow = globalThis.window;
  const timers = new Map(), events = [], gains = []; let timerId = 0;
  const parameter = name => ({ value: 0, setValueAtTime(value, at) { this.value = value; events.push({ name, value, at, kind: 'set' }); },
    exponentialRampToValueAtTime(value, at) { this.value = value; events.push({ name, value, at, kind: 'ramp' }); }, cancelScheduledValues() {} });
  const node = name => ({ gain: parameter(name), frequency: parameter(name), connect() {}, disconnect() {}, start(at) { events.push({ kind: 'start', name, at }); }, stop() {} });
  let context;
  class FakeContext {
    state = 'running'; currentTime = 0; sampleRate = 44100; destination = {};
    constructor() { context = this; }
    createGain() { const gain = node('gain-' + gains.length); gains.push(gain); return gain; }
    createOscillator() { return node('oscillator'); }
    createBufferSource() { return node('noise'); }
    createBiquadFilter() { return node('filter'); }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  }
  globalThis.window = { AudioContext: FakeContext, setInterval(callback) { timers.set(++timerId, callback); return timerId; }, clearInterval(id) { timers.delete(id); }, setTimeout() { return 1; } };
  try {
    const { startSoundBeatMusic } = await import('../../src/utils/audio/gameSfx.js');
    const legacy = startSoundBeatMusic({ bpm: 96, beatAt: performance.now() / 1000 });
    context.currentTime = 0.25; [...timers.values()][0]();
    assert.ok(events.some(event => event.name === 'oscillator' && event.value === 98), 'old default bass remains unchanged');
    legacy.stop(); legacy.stop(); assert.equal(timers.size, 0);
    const music = startSoundBeatMusic({ bpm: 96, beatAt: performance.now() / 1000, arrangement: 0, world: 'meadow' });
    const master = gains.at(-1); const activeTimer = [...timers.values()][0];
    assert.equal(timers.size, 1);
    music.setArrangement(9, 'moonwood'); assert.equal(timers.size, 1);
    music.setDucked(true); const low = master.gain.value;
    music.setDucked(false); const high = master.gain.value;
    assert.ok(Math.abs(low / high - 0.28) < 0.000001);
    const before = events.filter(event => event.kind === 'start').length;
    context.currentTime = 100; activeTimer();
    const starts = events.filter(event => event.kind === 'start').slice(before);
    assert.ok(starts.length <= 5, 'delayed scheduling does not dump hundreds of catch-up notes');
    assert.ok(starts.every(event => event.at >= 100 && event.at < 100.14));
    music.stop(); const stopped = events.length; context.currentTime = 101; activeTimer();
    assert.equal(events.length, stopped); assert.equal(timers.size, 0);
  } finally { globalThis.window = originalWindow; }
});
