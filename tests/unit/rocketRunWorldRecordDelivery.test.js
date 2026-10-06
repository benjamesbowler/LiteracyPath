import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRocketWorldRecordDelivery } from '../../src/components/learn/games/games/rocketRunWorldRecordDelivery.js';
import { loadRocketRunCraft } from '../../src/components/learn/games/games/rocketRunCraftData.js';

const packet = record => {
  const text = JSON.stringify(record) + '\n';
  return { text, bytes: new TextEncoder().encode(text).byteLength };
};

test('healthy selected import never fetches recovery data or a sibling world', async () => {
  const calls = [], record = { character: 'chompy' };
  const load = createRocketWorldRecordDelivery({ dino: async () => { calls.push('dino'); return { ROCKET_RUN_CRAFT_WORLD: record }; },
    meadow: async () => { throw new Error('must not import sibling'); } },
  { dino: {}, meadow: {} }, () => { throw new Error('healthy import must not fetch'); });
  assert.deepEqual(await load('dino'), { dino: record });
  assert.deepEqual(calls, ['dino']);
  await assert.rejects(load('moonwood'), /Unknown Rocket world/);
});

test('a cached import failure exposes the first error, then each explicit retry fetches the identical selected packet', async () => {
  let imports = 0, fetches = 0;
  const original = { character: 'chompy', flight: { frames: ['cruise', 'celebrate'] } }, encoded = packet(original);
  const load = createRocketWorldRecordDelivery({ dino: async () => { imports++; throw new Error('actual cached module failure'); } },
    { dino: { runtime: '/game-assets/rocket-run/world-records/dino-v2.json', bytes: encoded.bytes } },
    async (url, options) => {
      assert.equal(url, '/game-assets/rocket-run/world-records/dino-v2.json');
      assert.equal(options.cache, 'reload');
      fetches++;
      return { ok: fetches > 1, text: async () => encoded.text };
    });
  await assert.rejects(load('dino'), /actual cached module failure/);
  assert.equal(fetches, 0, 'a failed opening remains visible until the child requests Reload');
  await assert.rejects(load('dino'), /recovery packet could not load/);
  assert.deepEqual(await load('dino'), { dino: original });
  assert.equal(imports, 1);
  assert.equal(fetches, 2, 'failed HTTP recovery is retried rather than cached as a promise');
});

test('incomplete or cancelled recovery cannot return a delivered world', async () => {
  let response, pending;
  const encoded = packet({ character: 'pip' });
  const load = createRocketWorldRecordDelivery({ moonwood: async () => { throw new Error('failed module'); } },
    { moonwood: { runtime: '/game-assets/rocket-run/world-records/moonwood-v2.json', bytes: encoded.bytes } },
    async (url, { signal }) => { assert.ok(signal); return { ok: true, text: () => pending }; });
  await assert.rejects(load('moonwood'), /failed module/);
  pending = Promise.resolve(encoded.text.slice(0, -1));
  await assert.rejects(load('moonwood', { signal: new AbortController().signal }), /incomplete/);
  pending = new Promise(resolve => { response = resolve; });
  const controller = new AbortController(), start = load('moonwood', { signal: controller.signal });
  controller.abort(); response(encoded.text);
  await assert.rejects(start, { name: 'AbortError' });
});

test('every shipped recovery packet equals its actual selected lazy module including all poses, anatomy and source URLs', async () => {
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const selected = await loadRocketRunCraft(world);
    const text = await readFile(new URL(`../../public/game-assets/rocket-run/world-records/${world}-v2.json`, import.meta.url), 'utf8');
    assert.deepEqual(JSON.parse(text), selected[world]);
    assert.equal(selected[world].flight.primary.frames.length, 42);
    assert.equal(selected[world].flight.emergency.frames.length, 21);
    assert.equal(Object.keys(selected[world].route.primary.roles).length, 7);
  }
});
