import assert from 'node:assert/strict';
import test from 'node:test';
import { createSoundKeysCueQueue } from '../../src/utils/audio/soundKeysCueQueue.js';
const flush = async () => { for (let index = 0; index < 5; index += 1) await Promise.resolve(); };
function rig() {
  const played = [], pending = [], releases = [];
  const queue = createSoundKeysCueQueue({ onPending: value => pending.push(value), play: (request, options) => {
    played.push({ request, signal: options.signal });
    return new Promise(resolve => releases.push(resolve));
  } });
  return { queue, played, pending, releases };
}
test('rapid key input keeps target intact and delivers the latest unit before the final blend', async () => {
  const { queue, played, releases } = rig();
  queue.request({ kind: 'target', word: 'cat' }); await flush();
  queue.request({ kind: 'unit', token: 'c' }); queue.request({ kind: 'unit', token: 'a' });
  queue.request({ kind: 'unit', token: 't' }); queue.request({ kind: 'blend', word: 'cat' });
  assert.equal(played.length, 1); assert.equal(played[0].signal.aborted, false);
  let idle = false; queue.whenIdle().then(() => { idle = true; });
  releases[0](); await flush(); assert.equal(played[1].request.token, 't'); assert.equal(idle, false);
  releases[1](); await flush(); assert.equal(played[2].request.kind, 'blend'); assert.equal(idle, false);
  releases[2](); await flush(); assert.equal(idle, true);
});
test('explicit replay aborts former cue and never lets its late settlement replace the replay', async () => {
  const { queue, played, releases } = rig();
  queue.request({ kind: 'target', word: 'cat' }); await flush();
  queue.request({ kind: 'unit', token: 'c' });
  queue.request({ kind: 'target', word: 'cat' }, { manual: true }); await flush();
  assert.equal(played[0].signal.aborted, true); assert.equal(played[1].signal.aborted, false);
  releases[0](); await flush(); assert.equal(queue.inspect().active.kind, 'target');
  releases[1](); await flush(); assert.equal(played.length, 2); assert.equal(queue.pending(), false);
});
test('pause/unmount cancellation releases waiters without resurrecting any queued key or word', async () => {
  const { queue, played, releases } = rig();
  queue.request({ kind: 'target', word: 'cat' }); await flush();
  queue.request({ kind: 'unit', token: 't' }); queue.request({ kind: 'blend', word: 'cat' });
  let idle = false; queue.whenIdle().then(() => { idle = true; });
  queue.dispose(); await flush(); releases[0](); await flush();
  queue.request({ kind: 'unit', token: 'a' }); await flush();
  assert.equal(idle, true); assert.equal(played.length, 1); assert.equal(played[0].signal.aborted, true);
});
