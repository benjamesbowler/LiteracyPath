import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockOfflineMedia } from '../../src/utils/literacyMockOfflineMedia.js';

function environment() {
  const entries = new Map(), fetched = [], pending = new Map(), revoked = [];
  return { entries, fetched, pending, revoked, options: {
    cacheStorage: { open: async () => ({ match: async key => entries.get(key)?.clone(), put: async (key, response) => entries.set(key, response.clone()) }) },
    fetcher: (path, { signal }) => new Promise((resolve, reject) => {
      fetched.push(path); pending.set(path, { resolve: () => resolve(new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'audio/mpeg' } })), reject });
      signal.addEventListener('abort', () => reject(Error('aborted')), { once: true });
    }),
    createObjectURL: () => 'blob:fixture', revokeObjectURL: url => revoked.push(url),
  } };
}
const drain = async () => { for (let n = 0; n < 30; n++) await new Promise(resolve => setImmediate(resolve)); };

test('the first question becomes durably ready without fetching the rest of its authorized adaptive reserve', async () => {
  const env = environment(), paths = ['/audio/current.mp3', ...Array.from({ length: 600 }, (_, n) => `/audio/future-${n}.mp3`)];
  const media = await createMockOfflineMedia(paths, env.options);
  assert.equal(env.fetched.length, 0);
  const current = media.ensure([paths[0]], { priority: 2 }); await drain();
  env.pending.get(paths[0]).resolve(); await current;
  assert.equal(media.has([paths[0]]), true);
  assert.equal(media.has(paths), false);
  assert.equal(env.entries.size, 1, 'Question readiness requires retained bytes, not merely a successful network response.');
  assert.deepEqual(env.fetched, [paths[0]]);
  media.dispose();
});

for (const priority of [0, 1]) test(`a newly selected harder question overtakes priority-${priority} background media and shares in-flight requests`, async () => {
  const env = environment(), paths = Array.from({ length: 12 }, (_, n) => `/audio/${n}.mp3`);
  const media = await createMockOfflineMedia(paths, env.options);
  const background = media.ensure(paths, { priority }).catch(() => {}); await drain();
  assert.equal(env.fetched.length, 2, 'Background work leaves capacity for the actual question.');
  const urgent = media.ensure([paths[11]], { priority: 2 });
  const duplicate = media.ensure([paths[11]], { priority: 2 }); await drain();
  assert.ok(env.fetched.includes(paths[11]), 'Do not wait behind hundreds of unused alternatives.');
  assert.equal(env.fetched.filter(path => path === paths[11]).length, 1);
  env.pending.get(paths[11]).resolve(); await Promise.all([urgent, duplicate]);
  assert.equal(media.has([paths[11]]), true);
  media.resolve(paths[11]); media.dispose(); await background;
  assert.deepEqual(env.revoked, ['blob:fixture']);
});

test('an offline cache miss stays unready, can retry after reconnection, and survives reload from retained bytes', async () => {
  const env = environment(), path = '/audio/current.mp3';
  const media = await createMockOfflineMedia([path], env.options);
  const failed = media.ensure([path]); await drain();
  env.pending.get(path).reject(Error('offline')); await assert.rejects(failed, /offline/);
  assert.equal(media.has([path]), false);
  const retry = media.ensure([path]); await drain(); env.pending.get(path).resolve(); await retry; media.dispose();
  const reload = await createMockOfflineMedia([path], { ...env.options, fetcher: () => { throw Error('offline'); } });
  await reload.ensure([path]); assert.equal(reload.has([path]), true); reload.dispose();
});

test('only authorized media can be requested and disposal aborts active and queued work', async () => {
  const env = environment(), paths = Array.from({ length: 8 }, (_, n) => `/audio/${n}.mp3`);
  const media = await createMockOfflineMedia(paths, env.options);
  await assert.rejects(() => media.ensure(['/audio/outside-reserve.mp3']), /authorized/);
  const background = media.ensure(paths, { priority: 0 }); await drain(); media.dispose();
  await assert.rejects(background, /cancelled/); assert.equal(media.has(paths), false);
  await assert.rejects(() => media.ensure([paths[0]]), /cancelled/);
});

test('a WebKit same-key cache miss removes its stale record before retaining replacement bytes', async () => {
  const env = environment(), path = '/audio/after-reload.mp3';
  let stale = true, deletions = 0;
  const open = env.options.cacheStorage.open;
  env.options.cacheStorage.open = async () => {
    const cache = await open();
    return { ...cache, match: key => stale ? undefined : cache.match(key),
      put: (key, response) => stale ? Promise.resolve() : cache.put(key, response),
      delete: async key => { assert.equal(key, path); deletions++; stale = false; return true; } };
  };
  const media = await createMockOfflineMedia([path], env.options);
  const ready = media.ensure([path]); await drain(); env.pending.get(path).resolve(); await ready;
  assert.equal(deletions, 1); assert.equal(media.has([path]), true); assert.equal(env.entries.size, 1);
  media.dispose();
});
