import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { sharedMediaSettings, sharedMediaVercelConfig } from '../../tools/lib/sharedMediaConfig.mjs';
import { planSharedMedia, publishSharedMedia, MAX_BUCKET_BYTES } from '../../tools/lib/sharedMediaPublisher.mjs';
import { createMediaHandler } from '../../infra/shared-media/worker.mjs';
import { parseRange, shardForPath, validMediaPath, browserCachePolicy } from '../../infra/shared-media/protocol.mjs';

const snapshot = 'a'.repeat(40);
const otherSnapshot = 'b'.repeat(40);
const md5 = body => createHash('md5').update(body).digest('hex');

function memoryStore() {
  const data = new Map();
  return {
    data,
    list: async () => [...data].map(([key, body]) => ({ key, size: body.length, etag: md5(body) })),
    getText: async key => data.has(key) ? data.get(key).toString() : null,
    putIfAbsent: async object => {
      const body = object.file ? await fs.readFile(object.file) : Buffer.from(object.body);
      if (!data.has(object.key)) data.set(object.key, body);
      const stored = data.get(object.key);
      return { size: stored.length, etag: md5(stored) };
    },
    bucket: {
      async get(key, options) {
        const body = data.get(key);
        if (!body) return null;
        const bytes = options?.range ? body.subarray(options.range.offset, options.range.offset + options.range.length) : body;
        return { body: new Blob([bytes]).stream(), json: async () => JSON.parse(body.toString()) };
      }
    }
  };
}

async function fixture(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'shared-media-'));
  const distRoot = path.join(root, 'dist');
  const publicRoot = path.join(root, 'public');
  async function write(relative, body) {
    for (const base of [distRoot, publicRoot]) {
      const file = path.join(base, relative);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, body);
    }
  }
  try {
    await write('audio/cue.mp3', '0123456789');
    await write('action-songs/hop-and-stop/hop-and-stop.mp4', '0123456789');
    await write('images/assessment/cue.webp', 'image bytes');
    await write('index.html', '<html>local app</html>');
    await run({ root, distRoot, publicRoot, write, store: memoryStore() });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

test('media config preserves same-origin browser URLs and pins each deployment snapshot', () => {
  const base = { rewrites: [{ source: '/parent', destination: '/parent.html' }], headers: [{ source: '/(.*)', headers: [{ key: 'CSP', value: "default-src 'self'" }] }] };
  assert.deepEqual(sharedMediaVercelConfig(base, {}), base);
  const config = sharedMediaVercelConfig(base, { SHARED_MEDIA_ORIGIN: 'https://media.example.com', VERCEL_GIT_COMMIT_SHA: snapshot });
  const audio = config.routes.find(rule => rule.dest?.includes('/audio/'));
  assert.equal(audio.dest, `https://media.example.com/v1/${snapshot}/audio/$1`);
  assert.ok(config.routes.some(rule => rule.src && new RegExp(rule.src).test('/action-songs/hop-and-stop/hop-and-stop.mp4')));
  assert.ok(audio.transforms.some(rule => rule.type === 'request.headers' && rule.target.key === 'authorization' && rule.args === ''));
  assert.ok(audio.transforms.some(rule => rule.type === 'request.headers' && rule.target.key === 'cookie' && rule.args === ''));
  assert.deepEqual(config.routes[0].headers, { CSP: "default-src 'self'" });
  assert.ok(config.routes[0].continue);
  assert.ok(config.routes.indexOf(audio) < config.routes.findIndex(rule => rule.handle === 'filesystem'));
  assert.equal(config.routes.at(-1).dest, '/parent.html');
  assert.equal(config.headers, undefined);
  assert.equal(config.rewrites, undefined);
  for (const origin of ['http://media.example.com', 'https://user:password@media.example.com', 'https://media.example.com/path', 'https://127.0.0.1', 'https://media.example.com?token=x']) {
    assert.throws(() => sharedMediaSettings({ SHARED_MEDIA_ORIGIN: origin, SHARED_MEDIA_SNAPSHOT: snapshot }));
  }
  assert.throws(() => sharedMediaSettings({ SHARED_MEDIA_ORIGIN: 'https://media.example.com' }), /exact 40-character/);
  assert.equal(sharedMediaSettings({ SHARED_MEDIA_ORIGIN: 'https://media.example.com', VERCEL_GIT_COMMIT_SHA: snapshot, SHARED_MEDIA_SNAPSHOT: otherSnapshot }).snapshot, snapshot);
});

test('verified publication deduplicates content, preserves sources and strips only generated media', async () => fixture(async f => {
  const plan = await planSharedMedia({ ...f, snapshot });
  assert.equal(plan.release.files, 3);
  assert.equal(plan.release.uniqueObjects, 2);
  const result = await publishSharedMedia(plan, f.store, { stripOutput: true });
  assert.equal(result.uploaded, 2);
  assert.equal(await fs.readFile(path.join(f.publicRoot, 'audio/cue.mp3'), 'utf8'), '0123456789');
  assert.equal(await fs.readFile(path.join(f.distRoot, 'index.html'), 'utf8'), '<html>local app</html>');
  await assert.rejects(fs.stat(path.join(f.distRoot, 'audio')), { code: 'ENOENT' });
  assert.equal(JSON.parse(await fs.readFile(path.join(f.distRoot, 'shared-media-release.json'), 'utf8')).snapshot, snapshot);
}));

test('new releases reuse old media without overwriting rollback snapshots', async () => fixture(async f => {
  const first = await planSharedMedia({ ...f, snapshot });
  await publishSharedMedia(first, f.store);
  const oldMarker = f.store.data.get(first.marker.key).toString();
  await f.write('images/assessment/cue.webp', 'a replacement image');
  const changed = await planSharedMedia({ ...f, snapshot });
  await assert.rejects(publishSharedMedia(changed, f.store), /immutable snapshot/);
  const second = await planSharedMedia({ ...f, snapshot: otherSnapshot });
  const result = await publishSharedMedia(second, f.store);
  assert.equal(result.uploaded, 1);
  assert.equal(result.reused, 1);
  assert.equal(f.store.data.get(first.marker.key).toString(), oldMarker);
  const handler = createMediaHandler();
  const oldResponse = await handler(new Request(`https://worker.example/v1/${snapshot}/images/assessment/cue.webp`), { MEDIA: f.store.bucket });
  assert.equal(await oldResponse.text(), 'image bytes');
}));

test('quota, transfer failure and checksum mismatch fail before deployment media removal', async () => fixture(async f => {
  const plan = await planSharedMedia({ ...f, snapshot });
  await assert.rejects(publishSharedMedia(plan, { ...f.store, list: async () => [{ key: 'existing', size: MAX_BUCKET_BYTES, etag: 'unused' }] }, { stripOutput: true }), /safety budget/);
  assert.equal(f.store.data.size, 0);
  await assert.rejects(publishSharedMedia(plan, { ...f.store, putIfAbsent: async () => { throw new Error('network down'); } }, { stripOutput: true }), /network down/);
  await assert.rejects(publishSharedMedia(plan, { ...f.store, putIfAbsent: async object => ({ size: object.size, etag: 'wrong' }) }, { stripOutput: true }), /checksum mismatch/);
  assert.equal(await fs.readFile(path.join(f.distRoot, 'audio/cue.mp3'), 'utf8'), '0123456789');
  assert.equal(f.store.data.has(plan.marker.key), false);
}));

test('manifest readback corruption and changed output keep generated media intact', async () => fixture(async f => {
  const plan = await planSharedMedia({ ...f, snapshot });
  const corrupt = { ...f.store, getText: async key => key.endsWith('/release.json') ? null : 'wrong contents' };
  await assert.rejects(publishSharedMedia(plan, corrupt, { stripOutput: true }), /readback mismatch/);
  assert.equal(f.store.data.has(plan.marker.key), false);
  const plan2 = await planSharedMedia({ ...f, snapshot: otherSnapshot });
  await fs.writeFile(path.join(f.distRoot, 'action-songs/hop-and-stop/hop-and-stop.mp4'), 'changed duplicate');
  await assert.rejects(publishSharedMedia(plan2, f.store, { stripOutput: true }), /changed/);
  assert.equal(await fs.readFile(path.join(f.distRoot, 'audio/cue.mp3'), 'utf8'), '0123456789');
}));

test('source overlap and media symlinks are rejected', async () => fixture(async f => {
  await assert.rejects(planSharedMedia({ distRoot: f.publicRoot, publicRoot: f.publicRoot, snapshot }), /separate/);
  await fs.symlink(path.join(f.publicRoot, 'audio/cue.mp3'), path.join(f.distRoot, 'audio/link.mp3'));
  await assert.rejects(planSharedMedia({ ...f, snapshot }), /symlinks/);
}));

test('Worker serves full audio, HEAD and precise video ranges with immutable validators', async () => fixture(async f => {
  const plan = await planSharedMedia({ ...f, snapshot });
  await publishSharedMedia(plan, f.store);
  const handler = createMediaHandler();
  const base = `https://worker.example/v1/${snapshot}/action-songs/hop-and-stop/hop-and-stop.mp4`;
  const get = headers => handler(new Request(base, { headers }), { MEDIA: f.store.bucket });
  const full = await get();
  const etag = full.headers.get('etag');
  assert.equal(full.headers.get('content-type'), 'video/mp4');
  assert.equal(full.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  assert.equal(await full.text(), '0123456789');
  const head = await handler(new Request(base, { method: 'HEAD', headers: { range: 'bytes=0-1' } }), { MEDIA: f.store.bucket });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), '10');
  assert.equal(await head.text(), '');
  for (const [range, expected, contentRange] of [['bytes=0-1', '01', 'bytes 0-1/10'], ['bytes=7-', '789', 'bytes 7-9/10'], ['bytes=-3', '789', 'bytes 7-9/10'], ['bytes=7-999', '789', 'bytes 7-9/10']]) {
    const response = await get({ range });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), contentRange);
    assert.equal(await response.text(), expected);
  }
  const invalid = await get({ range: 'bytes=99-' });
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get('content-range'), 'bytes */10');
  const conditional = await get({ 'if-none-match': etag });
  assert.equal(conditional.status, 304);
  assert.equal(await conditional.text(), '');
  assert.equal((await get({ 'if-match': '"different"', 'if-none-match': etag })).status, 412);
  assert.equal((await get({ range: 'bytes=0-1', 'if-range': '"old"' })).status, 200);
  assert.equal((await get({ range: 'bytes=0-1', 'if-range': etag })).status, 206);
}));

test('Worker refuses writes, unknown snapshots and unpublished paths without exposing bucket details', async () => fixture(async f => {
  const plan = await planSharedMedia({ ...f, snapshot });
  await publishSharedMedia(plan, f.store);
  const handler = createMediaHandler();
  for (const pathname of ['/private/secret', '/images/assessment/missing.webp']) {
    const result = await handler(new Request(`https://worker.example/v1/${snapshot}${pathname}`), { MEDIA: f.store.bucket });
    assert.equal(result.status, 404);
  }
  assert.equal((await handler(new Request(`https://worker.example/v1/${snapshot}/audio/cue.mp3`, { method: 'PUT', body: 'bad' }), { MEDIA: f.store.bucket })).status, 405);
  const response = await handler(new Request(`https://worker.example/v1/${snapshot}/audio/cue.mp3`), { MEDIA: { get: async () => { throw new Error('secret account details'); } } });
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret/);
}));

test('path and byte-range edge cases are bounded', async () => {
  assert.equal(validMediaPath('/audio/a.mp3'), true);
  for (const value of ['/audio//a', '/audio/../secret', '/private/file', '/audio/a\\b', '/audio/']) assert.equal(validMediaPath(value), false);
  assert.equal(parseRange('bytes=0-0,2-2', 10), false);
  assert.equal(parseRange('bytes=-0', 10), false);
  assert.equal(parseRange('bytes=0-', 0), false);
  assert.equal((await shardForPath('/audio/a.mp3')).length, 2);
  assert.equal(browserCachePolicy('/images/assessment/a.webp'), 'public, max-age=0, must-revalidate');
});
