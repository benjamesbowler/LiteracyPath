import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentSessionId, isPresentSessionMessage, manifestMedia, checkPresentMedia, observationRecommendation } from '../../src/utils/present/presentWorkspace.js';

test('identical lessons in independent workspaces reject the other session', () => {
  const first = createPresentSessionId(), second = createPresentSessionId();
  assert.notEqual(first, second);
  const message = { type: 'lp-present-slide', sessionId: first, deckKey: 'cycle-3:monday:core', index: 2 };
  assert.equal(isPresentSessionMessage(message, first, message.deckKey), true);
  assert.equal(isPresentSessionMessage(message, second, message.deckKey), false);
  assert.equal(isPresentSessionMessage(message, first, 'different'), false);
  assert.equal(isPresentSessionMessage({ ...message, sessionId: undefined }, first, message.deckKey), false);
});
test('manifest readiness deduplicates only exact asset paths', () => {
  assert.deepEqual(manifestMedia({ slides: [{ media: [{ src: '/one.mp3', type: 'audio' }, { src: '/one.mp3', type: 'audio' }, { src: '/picture.webp', type: 'image' }] }] }).map(item => item.src), ['/one.mp3', '/picture.webp']);
});
test('media checks bound concurrency and retain failed delivery separately', async () => {
  let running = 0, maximum = 0;
  const results = await checkPresentMedia(Array.from({ length: 9 }, (_, index) => ({ src: String(index) })), { concurrency: 3, check: async entry => {
    running++; maximum = Math.max(maximum, running);
    await new Promise(resolve => setTimeout(resolve, 2)); running--;
    if (entry.src === '4') throw new Error('decode failure');
  } });
  assert.equal(maximum, 3);
  assert.equal(results.filter(entry => entry.status === 'decoded').length, 8);
  assert.equal(results[4].status, 'unavailable');
  assert.equal(results[4].error, 'decode failure');
});
test('media interruption never becomes a learner-error or mastery recommendation', () => {
  assert.match(observationRecommendation('media interrupted'), /Restore the media/);
  assert.match(observationRecommendation('with support'), /without that support/);
  assert.match(observationRecommendation('not sampled'), /before drawing/);
});

test('required missing roles remain visible and cannot be decoded or fetched as the app page', async () => {
  const entries = manifestMedia({ slides: [{ id: 'sentence', media: [{ src: '', required: true, role: 'sentence', transcript: 'A cat can sit.' }, { src: '', required: true, role: 'direction', transcript: 'Listen.' }, { src: '', required: false, role: 'optional' }] }] });
  assert.equal(entries.length, 2);
  let calls = 0;
  const results = await checkPresentMedia(entries, { check: async () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(results.every(result => result.status === 'unavailable'), true);
  assert.match(results[0].error, /cannot decode/);
});
