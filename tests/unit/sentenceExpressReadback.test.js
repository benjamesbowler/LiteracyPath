import test from 'node:test';
import assert from 'node:assert/strict';
import { createSentenceExpressReadback } from '../../src/components/learn/games/games/sentenceExpressReadback.js';
const round = { readback: [{ slot: 0, word: 'The', source: '/the.mp3' }, { slot: 1, word: 'cat', source: '/cat.mp3' }] };
const turn = () => new Promise(resolve => setImmediate(resolve));

test('Express validated in-flight readback continues after its exact settled prefix without replaying or changing prior ends', async () => {
  const prefix = [{ ...round.readback[0], status: 'delivered', endedAt: 10 }], calls = [];
  const owner = createSentenceExpressReadback({ now: () => 30, speakWord: async (word, options) => {
    calls.push(word); options.onEnd('/cat.mp3');
  } });
  const result = await owner.play(round, { readback: prefix });
  assert.deepEqual(calls, ['cat']); assert.deepEqual(result.readback[0], prefix[0]); assert.deepEqual(prefix[0], { ...round.readback[0], status: 'delivered', endedAt: 10 });
  assert.equal(result.readback[1].endedAt, 30); assert.equal(result.completed, true);
  result.readback[0].endedAt = 999; assert.equal(owner.inspect().readback[0].endedAt, 10);
  assert.equal(await owner.play(round, { readback: [{ ...prefix[0], source: '/wrong.mp3' }] }), null);
  assert.equal(await owner.play(round, { readback: [{ ...prefix[0], endedAt: 31 }] }), null);
  owner.dispose();
});

test('Express sequential readback records only matching actual ends; resolution, wrong files and errors settle honestly unavailable', async () => {
  const order = [], owner = createSentenceExpressReadback({ now: () => 20, speakWord: async (word, options) => {
    order.push(word); options.onEnd(word === 'The' ? '/the.mp3' : '/wrong.mp3');
  } });
  const result = await owner.play(round);
  assert.deepEqual(order, ['The', 'cat']); assert.equal(result.completed, true);
  assert.deepEqual(result.readback.map(row => [row.status, row.endedAt]), [['delivered', 20], ['unavailable', null]]);
  result.readback[0].endedAt = 200;
  assert.equal(owner.inspect().readback[0].endedAt, 20);
  const missing = createSentenceExpressReadback({ speakWord: async () => { throw new Error('load failed'); } });
  assert.ok((await missing.play(round)).readback.every(row => row.status === 'unavailable' && row.endedAt === null));
});

test('Express pause aborts the current word and rejects its late end; resume genuinely replays that word once before the next', async () => {
  const calls = [];
  const owner = createSentenceExpressReadback({ now: () => 40, speakWord: (word, options) => new Promise(resolve => {
    calls.push({ word, options, resolve }); options.signal.addEventListener('abort', resolve, { once: true });
  }) });
  const pending = owner.play(round); await turn();
  owner.pause(); calls[0].options.onEnd('/the.mp3'); await turn();
  assert.equal(owner.inspect().index, 0); assert.deepEqual(owner.inspect().readback, []);
  owner.resume(); await turn();
  assert.deepEqual(calls.map(row => row.word), ['The', 'The']);
  calls[1].options.onEnd('/the.mp3'); calls[1].resolve(); await turn();
  calls[2].options.onEnd('/cat.mp3'); calls[2].resolve();
  assert.deepEqual((await pending).readback.map(row => row.status), ['delivered', 'delivered']);
});

test('Express sound-off and disposal settle without fabricated readback or late callbacks', async () => {
  let sound = true, first;
  const owner = createSentenceExpressReadback({ getSound: () => sound, speakWord: (word, options) => new Promise(resolve => {
    first = { options, resolve }; options.signal.addEventListener('abort', resolve, { once: true });
  }) });
  const pending = owner.play(round); await turn(); sound = false; owner.soundChanged();
  assert.ok((await pending).readback.every(row => row.status === 'sound-off' && row.endedAt === null));
  sound = true; const disposed = owner.play(round); await turn(); owner.dispose(); first.options.onEnd('/the.mp3');
  assert.equal(await disposed, null); assert.deepEqual(owner.inspect().readback, []);
});

test('Express muted word highlighting keeps the existing 560ms interval and preserves its actual remainder across pause', async () => {
  let elapsed = 0, sequence = 0;
  const tasks = new Map(), words = [];
  const owner = createSentenceExpressReadback({ getSound: () => false, speakWord: async () => assert.fail('Muted play cannot start speech'),
    onWord: row => words.push(row), taskOptions: { now: () => elapsed,
      schedule: (fn, ms) => { const id = ++sequence; tasks.set(id, { fn, due: elapsed + ms }); return id; },
      clear: id => tasks.delete(id) } });
  async function advance(ms) {
    elapsed += ms;
    for (const [id, row] of [...tasks]) if (row.due <= elapsed) { tasks.delete(id); row.fn(); }
    await turn();
  }
  const result = owner.play(round); await turn();
  await advance(240); owner.pause(); await advance(10000);
  assert.equal(owner.inspect().index, 0); assert.deepEqual(owner.inspect().readback, []);
  assert.deepEqual(words.map(row => [row.index, row.active]), [[0, true]]);
  owner.resume(); await advance(319); assert.equal(owner.inspect().index, 0);
  await advance(1); assert.equal(owner.inspect().index, 1);
  assert.deepEqual(words.map(row => [row.index, row.active]), [[0, true], [0, false], [1, true]]);
  await advance(560);
  assert.deepEqual((await result).readback.map(row => [row.status, row.endedAt]), [['sound-off', null], ['sound-off', null]]);
  owner.dispose(); assert.equal(tasks.size, 0);
});

test('Express readback ducks only its actual current speech and releases its mix on pause, failure and disposal', async () => {
  const calls = [], events = [];
  const owner = createSentenceExpressReadback({ now: () => 40,
    duckMusic: token => events.push(['duck', token]), restoreMusic: token => events.push(['restore', token]),
    speakWord: (word, options) => new Promise(resolve => {
      calls.push({ word, options, resolve }); options.signal.addEventListener('abort', resolve, { once: true });
    }) });
  const pending = owner.play(round); await turn();
  assert.deepEqual(events, [], 'loading and a promise do not imply actual playing speech');
  calls[0].options.onStart(); assert.equal(events.length, 1);
  owner.pause(); assert.equal(events.length, 2);
  calls[0].options.onStart(); calls[0].options.onEnd('/the.mp3'); await turn();
  assert.equal(events.length, 2); assert.deepEqual(owner.inspect().readback, []);
  owner.resume(); await turn(); calls[1].options.onStart(); calls[1].options.onEnd('/the.mp3'); calls[1].resolve(); await turn();
  assert.deepEqual(events.map(row => row[0]), ['duck', 'restore', 'duck', 'restore']);
  calls[2].options.onStart(); owner.dispose(); calls[2].options.onStart(); calls[2].options.onEnd('/cat.mp3');
  assert.equal(await pending, null);
  assert.deepEqual(events.map(row => row[0]), ['duck', 'restore', 'duck', 'restore', 'duck', 'restore']);
  assert(events.every(row => row[1] === events[0][1]), 'the engine releases only its own mix owner');
  assert.deepEqual(owner.inspect().readback.map(row => row.status), ['delivered']);
  const failed = createSentenceExpressReadback({
    duckMusic: token => events.push(['duck', token]), restoreMusic: token => events.push(['restore', token]),
    speakWord: async (_word, options) => { options.onStart(); throw new Error('actual playback failed'); }
  });
  assert((await failed.play(round)).readback.every(row => row.status === 'unavailable' && row.endedAt === null));
  assert.deepEqual(events.slice(-4).map(row => row[0]), ['duck', 'restore', 'duck', 'restore']);
  failed.dispose();
});
