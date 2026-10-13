import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { fetchCampaignAsset } from '../../src/features/soundSeekers/rounded/campaignAssetFetch.js';

const assetUrl = '/assets/bouncy-canonical.glb';
const flush = () => new Promise(resolve => setImmediate(resolve));

test('canonical asset fetch returns the original response and forwards its exact URL and owner signal', async () => {
  const controller = new AbortController(), response = new Response('canonical bytes');
  const calls = [];
  const result = await fetchCampaignAsset(assetUrl, { signal: controller.signal, fetcher: async (...args) => {
    calls.push(args);
    return response;
  } });
  assert.equal(result, response);
  assert.deepEqual(calls, [[assetUrl, { signal: controller.signal }]]);
  assert.equal(response.bodyUsed, false);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('a transient network failure retries once after a short delay and recovers', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const response = new Response('canonical bytes');
  const pending = fetchCampaignAsset(assetUrl, { fetcher: async () => {
    if (++calls === 1) throw new TypeError('Failed to fetch');
    return response;
  } });
  await flush();
  assert.equal(calls, 1, 'the retry must not immediately hammer the failed resource');
  t.mock.timers.tick(199);
  await flush();
  assert.equal(calls, 1);
  t.mock.timers.tick(1);
  assert.equal(await pending, response);
  assert.equal(calls, 2);
});

for (const status of [408, 429, 500, 503, 599]) {
  test(`HTTP ${status} retries the same asset once and releases the failed response body`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const failed = new Response('temporary failure', { status });
    const recovered = new Response('canonical bytes'), calls = [];
    const pending = fetchCampaignAsset(assetUrl, { fetcher: async url => {
      calls.push(url);
      return calls.length === 1 ? failed : recovered;
    } });
    await flush();
    assert.equal(failed.bodyUsed, true);
    t.mock.timers.tick(200);
    assert.equal(await pending, recovered);
    assert.deepEqual(calls, [assetUrl, assetUrl]);
  });
}

test('persistent network failure stops after the second request and preserves its error', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const failure = new TypeError('Still offline');
  let calls = 0;
  const pending = fetchCampaignAsset(assetUrl, { fetcher: async () => { calls++; throw failure; } });
  const rejected = assert.rejects(pending, error => error === failure);
  await flush();
  t.mock.timers.tick(200);
  await rejected;
  t.mock.timers.runAll();
  await flush();
  assert.equal(calls, 2);
});

test('persistent service failure returns the second response for the existing supported fallback', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const last = new Response('still unavailable', { status: 503 });
  const pending = fetchCampaignAsset(assetUrl, { fetcher: async () => ++calls === 1
    ? new Response('temporary failure', { status: 503 }) : last });
  await flush();
  t.mock.timers.tick(200);
  assert.equal(await pending, last);
  assert.equal(last.bodyUsed, false);
  t.mock.timers.runAll();
  await flush();
  assert.equal(calls, 2);
});

for (const status of [400, 401, 403, 404]) {
  test(`permanent HTTP ${status} is returned without a retry`, async () => {
    let calls = 0;
    const response = new Response('missing or disallowed', { status });
    assert.equal(await fetchCampaignAsset(assetUrl, { fetcher: async () => { calls++; return response; } }), response);
    assert.equal(calls, 1);
    assert.equal(response.bodyUsed, false);
  });
}

test('a successful response stays outside parsing ownership and corrupt content never refetches', async () => {
  let calls = 0;
  const response = await fetchCampaignAsset(assetUrl, { fetcher: async () => {
    calls++;
    return new Response('invalid model content');
  } });
  await assert.rejects(response.json(), SyntaxError);
  assert.equal(calls, 1);
});

test('unexpected application errors and explicit fetch cancellation are never retried', async () => {
  for (const failure of [new Error('Unexpected failure'), new RangeError('Invalid option'), new DOMException('Stopped', 'AbortError')]) {
    let calls = 0;
    await assert.rejects(fetchCampaignAsset(assetUrl, { fetcher: async () => { calls++; throw failure; } }), error => error === failure);
    assert.equal(calls, 1);
  }
});

test('an already closed owner prevents even the first request', async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(fetchCampaignAsset(assetUrl, { signal: controller.signal, fetcher: async () => { calls++; } }), { name: 'AbortError' });
  assert.equal(calls, 0);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('closing the owner during retry delay clears pending work and preserves its reason', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const controller = new AbortController(), reason = new Error('Place closed');
  let calls = 0;
  const pending = fetchCampaignAsset(assetUrl, { signal: controller.signal, fetcher: async () => {
    calls++;
    return new Response('temporary failure', { status: 503 });
  } });
  const rejected = assert.rejects(pending, error => error === reason);
  await flush();
  assert.equal(getEventListeners(controller.signal, 'abort').length, 1);
  controller.abort(reason);
  await rejected;
  t.mock.timers.runAll();
  await flush();
  assert.equal(calls, 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('closing the owner interrupts an in-flight request without waiting for its transport', async () => {
  const controller = new AbortController();
  let finish, calls = 0;
  const pending = fetchCampaignAsset(assetUrl, { signal: controller.signal, fetcher: (url, { signal }) => {
    calls++;
    assert.equal(signal, controller.signal);
    return new Promise(resolve => { finish = resolve; });
  } });
  const rejected = assert.rejects(pending, { name: 'AbortError' });
  controller.abort();
  await rejected;
  finish(new Response('late bytes'));
  await flush();
  assert.equal(calls, 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('closing the owner during the second request cannot return a late success or start a third request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const controller = new AbortController();
  let finish, calls = 0;
  const pending = fetchCampaignAsset(assetUrl, { signal: controller.signal, fetcher: async () => {
    if (++calls === 1) throw new TypeError('Failed to fetch');
    return new Promise(resolve => { finish = resolve; });
  } });
  const rejected = assert.rejects(pending, { name: 'AbortError' });
  await flush();
  t.mock.timers.tick(200);
  await flush();
  assert.equal(calls, 2);
  controller.abort();
  await rejected;
  finish(new Response('late bytes'));
  t.mock.timers.runAll();
  await flush();
  assert.equal(calls, 2);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});
