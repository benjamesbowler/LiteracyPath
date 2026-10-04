import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundBeatCueQueue } from '../../src/utils/audio/soundBeatCueQueue.js';

const flush = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };
function fixture() {
  let time = 10; const calls = [];
  const queue = createSoundBeatCueQueue({ now: () => time, settleSeconds: 0.2,
    play: (cue, options) => new Promise(resolve => calls.push({ cue, signal: options.signal, end: resolve })) });
  return { queue, calls, advance: seconds => { time += seconds; } };
}

test('pending unit playback is never aborted by fast input and the real final unit ends before its blend', async () => {
  const { queue, calls, advance } = fixture();
  queue.request({ kind: 'unit', note: 'h' }); await flush();
  queue.request({ kind: 'unit', note: 'o' }); queue.request({ kind: 'unit', note: 't' }); queue.request({ kind: 'blend', note: 'hot' });
  assert.equal(calls.length, 1); assert.equal(calls[0].signal.aborted, false);
  calls[0].end(); await flush(); queue.pump(); assert.equal(calls.length, 1, 'quiet settling period is preserved');
  advance(0.21); queue.pump(); await flush(); assert.equal(calls[1].cue.note, 't');
  assert.equal(queue.inspect().blend.note, 'hot'); calls[1].end(); await flush();
  advance(0.21); queue.pump(); await flush(); assert.equal(calls[2].cue.note, 'hot');
  assert.ok(calls.every(call => !call.signal.aborted)); calls[2].end(); await flush();
  assert.equal(queue.pending(), false); assert.equal(queue.queued(), false);
});

test('manual replay intentionally cancels old speech; pause/dispose never resurrect late pending speech', async () => {
  const { queue, calls, advance } = fixture();
  queue.request({ kind: 'unit', note: 'h' }); await flush();
  queue.request({ kind: 'unit', note: 'o' }, { manual: true }); await flush();
  assert.equal(calls[0].signal.aborted, true); assert.equal(calls[1].signal.aborted, false);
  calls[0].end(); await flush(); assert.equal(queue.pending(), true, 'old completion cannot clear the new cue');
  queue.request({ kind: 'blend', note: 'hot' }); queue.cancel();
  assert.equal(calls[1].signal.aborted, true); calls[1].end(); await flush(); advance(30); queue.pump(); await flush();
  assert.equal(calls.length, 2); assert.equal(queue.pending(), false); assert.equal(queue.queued(), false);
  queue.dispose(); queue.request({ kind: 'unit', note: 't' }); await flush(); assert.equal(calls.length, 2);
});
