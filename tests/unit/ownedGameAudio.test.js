import test from 'node:test';
import assert from 'node:assert/strict';
import { playOwnedClip } from '../../src/utils/audio/playOwnedClip.js';
import { rocketWordSpeed, rocketCueLead, rocketWordSpacing } from '../../src/components/learn/games/shared/rocketApproach.js';

function recording(state = "loaded") {
  const listeners = new Map();
  return {
    stopped: [],
    state: () => state,
    play: () => 7,
    once(event, fn) { listeners.set(event, fn); },
    off(event, fn) { if (listeners.get(event) === fn) listeners.delete(event); },
    stop(id) { this.stopped.push(id); listeners.get('stop')?.(); },
    emit(event) { listeners.get(event)?.(); },
    get listenerCount() { return listeners.size; }
  };
}

test('aborting a playing word stops only its owned sound and cannot start a stale cue', async () => {
  const howl = recording();
  const controller = new AbortController();
  let starts = 0;
  const pending = playOwnedClip(howl, 'cat.mp3', { signal: controller.signal, onStart: () => starts++ });
  controller.abort();
  howl.emit('play');
  assert.equal(await pending, null);
  assert.deepEqual(howl.stopped, [7]);
  assert.equal(starts, 0);
  assert.equal(howl.listenerCount, 0);
});

test('highlight follows actual playback and releases the carrier after completion', async () => {
  const howl = recording();
  let starts = 0;
  const pending = playOwnedClip(howl, 'cat.mp3', { onStart: () => starts++ });
  assert.equal(starts, 0);
  howl.emit('play');
  assert.equal(starts, 1);
  howl.emit('end');
  assert.equal(await pending, 'cat.mp3');
  assert.equal(howl.listenerCount, 0);
});

test('pre-aborted cues never enqueue playback', async () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(await playOwnedClip({ play() { assert.fail('queued stale cue'); } }, 'cat', { signal: controller.signal }), null);
});

test('boost speed cannot consume the word reading and approach speech window', () => {
  for (const duration of [0.4, 0.8, 1.2, 2]) {
    for (const requested of [8, 20, 45, 80]) {
      const speed = rocketWordSpeed(requested, duration);
      const lead = rocketCueLead(duration);
      assert.ok(40 / speed > lead + 1);
      assert.ok(lead >= duration);
      assert.ok(rocketWordSpacing(duration, 'hard') > lead);
    }
  }
});

test('aborting before load never enqueues a sound in Howler', async () => {
  const howl = recording('loading');
  howl.play = () => assert.fail('stale sound was enqueued');
  const controller = new AbortController();
  const pending = playOwnedClip(howl, 'cat.mp3', { signal: controller.signal });
  controller.abort();
  howl.emit('load');
  assert.equal(await pending, null);
  assert.deepEqual(howl.stopped, []);
  assert.equal(howl.listenerCount, 0);
});

test('a long recorded result ends naturally instead of using a fixed short timeout', async () => {
  const howl = recording(); howl.duration = () => 12;
  const tasks = new Map(); let serial = 0;
  const pending = playOwnedClip(howl, 'long-sentence.mp3', { schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, ms }); return id; }, clear: id => tasks.delete(id) });
  assert.deepEqual([...tasks.values()].map(task => task.ms), [14000]);
  howl.emit('end'); assert.equal(await pending, 'long-sentence.mp3'); assert.equal(tasks.size, 0);
});

test('missing end or load events report unavailable and release the owned voice', async () => {
  for (const state of ['loaded', 'loading']) {
    const howl = recording(state); howl.duration = () => 1;
    const tasks = new Map(); let serial = 0;
    const pending = playOwnedClip(howl, 'broken.mp3', { schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, ms }); return id; }, clear: id => tasks.delete(id) });
    const rejected = assert.rejects(pending, /Unable to play/);
    assert.equal([...tasks.values()][0].ms, state === 'loaded' ? 5000 : 15000);
    [...tasks.values()][0].fn(); await rejected; assert.equal(howl.listenerCount, 0); assert.equal(tasks.size, 0);
  }
});
