import test from 'node:test';
import assert from 'node:assert/strict';
import { createRhymePopCueQueue } from '../../src/utils/audio/rhymePopCueQueue.js';

const turn = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const calls = [];
  const queue = createRhymePopCueQueue({ play: (request, { signal }) => new Promise(resolve => calls.push({ request, signal, resolve })) });
  return { queue, calls };
}

test('rapid accepted physical pops each retain a complete spoken name until actual playback ends', async () => {
  const { queue, calls } = fixture();
  for (const word of ['cat', 'hat', 'bat', 'mat']) queue.request({ word, kind: 'candidate' });
  let idle = false; queue.whenIdle().then(() => { idle = true; });
  for (let index = 0; index < 4; index++) {
    assert.equal(calls[index].request.word, ['cat', 'hat', 'bat', 'mat'][index]);
    assert.equal(idle, false); calls[index].resolve(true); await turn();
  }
  assert.equal(calls.length, 4); assert.equal(idle, true); queue.dispose();
});

test('a pending wrong contrast is replaced as a pair without dropping accepted names or an active word', async () => {
  const { queue, calls } = fixture(); queue.request({ word: 'hat' });
  queue.request([{ word: 'cat' }, { word: 'top' }], { replaceKey: 'wrong' });
  queue.request({ word: 'hop' });
  queue.request([{ word: 'ship' }, { word: 'top' }], { replaceKey: 'wrong' });
  calls[0].resolve(); await turn(); assert.equal(calls[1].request.word, 'hop');
  calls[1].resolve(); await turn(); assert.equal(calls[2].request.word, 'ship');
  calls[2].resolve(); await turn(); assert.equal(calls[3].request.word, 'top');
  calls[3].resolve(); await queue.whenIdle(); assert.equal(calls.length, 4); queue.dispose();
});

test('manual replay and pause abort their own active packet; late ends cannot restart cancelled tails', async () => {
  const { queue, calls } = fixture(); queue.request([{ word: 'cat' }, { word: 'top' }]);
  queue.request({ word: 'hop' }); queue.request({ word: 'top' }, { manual: true });
  assert.equal(calls[0].signal.aborted, true); assert.equal(calls[1].request.word, 'top');
  calls[0].resolve(); await turn(); assert.equal(calls.length, 2);
  const pending = queue.whenIdle(); queue.cancel(); await pending; assert.equal(calls[1].signal.aborted, true);
  calls[1].resolve(); await turn(); assert.equal(calls.length, 2); assert.equal(queue.pending(), false);
  queue.dispose(); queue.request({ word: 'old' }); assert.equal(calls.length, 2);
});

test('optional accepted names do not extend automatic completion; required real clue playback still owns its lifetime', async () => {
  const { queue, calls } = fixture(); queue.request({ word: 'top' }, { required: true });
  queue.request({ word: 'hop' }); queue.request({ word: 'mop' });
  let ready = false; queue.whenRequiredIdle().then(() => { ready = true; });
  assert.equal(ready, false); calls[0].resolve(); await turn();
  assert.equal(ready, true); assert.equal(calls[1].request.word, 'hop'); assert.equal(queue.pending(), true);
  const clue = queue.request({ word: 'top' }, { manual: true, required: true }); assert.equal(clue, true);
  assert.equal(calls[1].signal.aborted, true); let replayEnded = false;
  queue.whenRequiredIdle().then(() => { replayEnded = true; });
  calls[1].resolve(); await turn(); assert.equal(replayEnded, false);
  calls[2].resolve(); await turn(); assert.equal(replayEnded, true); queue.dispose();
});

test('the pending packet ceiling is explicit and observations cannot mutate live cue ownership', () => {
  const { queue, calls } = fixture(); queue.request({ word: 'active' });
  for (let i = 0; i < 8; i++) assert.equal(queue.request({ word: String(i) }), true);
  assert.equal(queue.request({ word: 'overflow' }), false); assert.equal(queue.inspect().pending.length, 8);
  const snapshot = queue.inspect(); snapshot.pending.length = 0;
  assert.equal(queue.inspect().pending.length, 8); queue.dispose(); assert.equal(calls[0].signal.aborted, true);
});
