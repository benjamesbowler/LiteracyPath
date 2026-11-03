import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { COHORTS, MAX_ASSET_BYTES, MAX_COHORT_FILES, MANIFEST_PATH, mediaCohort, validateRelease } from '../../infra/shared-media/protocol.mjs';
import { planSharedMedia, stageSharedMedia, stripPublishedMedia, verifyPublishedMedia, sha256 } from '../../tools/lib/sharedMediaPublisher.mjs';
import { sharedMediaVercelConfig } from '../../tools/lib/sharedMediaConfig.mjs';

const paths = [
  '/audio/production/en-US/isolated_word/cat.mp3',
  '/audio/production/en-US/instruction/cue.mp3',
  '/audio/production/en-US/guided_page/story.mp3',
  '/images/assessment/cat.webp'
];

async function fixture(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'free-media-'));
  const distRoot = path.join(root, 'dist');
  const publicRoot = path.join(root, 'public');
  async function write(relative, body) {
    for (const directory of [distRoot, publicRoot]) {
      const file = path.join(directory, relative);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, body);
    }
  }
  try {
    for (const [index, pathname] of paths.entries()) await write(pathname, `media ${index}`);
    await write('/index.html', '<html>app</html>');
    await run({ root, distRoot, publicRoot, write });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

function publication(plan) {
  const release = { schemaVersion: 2, provider: 'cloudflare-static-free', enabled: true, cohorts: {} };
  for (const cohort of COHORTS) release.cohorts[cohort] = {
    origin: `https://12345678-literacy-media-${cohort}.example.workers.dev`,
    manifestSha256: plan.cohorts[cohort].manifestSha256, files: plan.cohorts[cohort].files.length
  };
  return { release, fetchImpl: async url => {
    const parsed = new URL(url);
    const cohort = COHORTS.find(name => parsed.hostname.startsWith(`12345678-literacy-media-${name}.`));
    if (parsed.pathname === MANIFEST_PATH) return new Response(plan.cohorts[cohort].body);
    const file = plan.files.find(file => file.pathname === decodeURIComponent(parsed.pathname) && file.cohort === cohort);
    return file ? new Response(await fs.readFile(file.file)) : new Response('Not found', { status: 404 });
  } };
}

test('free-only receipts require immutable native asset versions and reject paid/R2 providers', () => {
  assert.equal(validateRelease({ enabled: false }), false);
  assert.throws(() => validateRelease({ enabled: true, schemaVersion: 1, provider: 'r2' }), /free static/);
  const release = { enabled: true, schemaVersion: 2, provider: 'cloudflare-static-free', cohorts: {} };
  for (const cohort of COHORTS) release.cohorts[cohort] = { origin: `https://12345678-literacy-media-${cohort}.example.workers.dev`, manifestSha256: 'a'.repeat(64), files: 1 };
  assert.equal(validateRelease(release), true);
  for (const origin of ['http://12345678-literacy-media-words.example.workers.dev', 'https://literacy-media-words.example.workers.dev', 'https://user:secret@12345678-literacy-media-words.example.workers.dev', 'https://12345678-literacy-media-words.example.workers.dev/path', 'https://media.example.com']) {
    assert.throws(() => validateRelease({ ...release, cohorts: { ...release.cohorts, words: { ...release.cohorts.words, origin } } }), /immutable/);
  }
  release.cohorts.words.files = MAX_COHORT_FILES + 1;
  assert.throws(() => validateRelease(release), /receipt/);
});

test('Vercel checks local media first and retains headers, routes and private-header stripping', async () => fixture(async f => {
  const plan = await planSharedMedia(f);
  const { release } = publication(plan);
  const base = { headers: [{ source: '/(.*)', headers: [{ key: 'CSP', value: "default-src 'self'" }] }], rewrites: [{ source: '/parent', destination: '/parent.html' }] };
  assert.deepEqual(sharedMediaVercelConfig(base, { enabled: false }), base);
  const config = sharedMediaVercelConfig(base, release);
  const filesystem = config.routes.findIndex(route => route.handle === 'filesystem');
  assert.deepEqual(config.routes[0].headers, { CSP: "default-src 'self'" });
  for (const pathname of paths) {
    const route = config.routes.find(route => route.dest?.startsWith('https:') && new RegExp(route.src).test(pathname));
    assert.ok(config.routes.indexOf(route) > filesystem);
    assert.equal(pathname.replace(new RegExp(route.src), route.dest), release.cohorts[mediaCohort(pathname)].origin + pathname);
    for (const key of ['cookie', 'authorization', 'x-vercel-protection-bypass', 'x-forwarded-for', 'x-real-ip', 'forwarded', 'true-client-ip']) {
      assert.ok(route.transforms.some(transform => transform.target.key === key && transform.op === 'delete' && !('args' in transform)));
    }
  }
  assert.equal(config.routes.at(-1).dest, '/parent.html');
  assert.equal(config.headers, undefined);
  assert.equal(config.rewrites, undefined);
}));

test('planner and staging preserve source, use bounded static-only collections and keep large video local', async () => fixture(async f => {
  const video = '/action-songs/hop-and-stop/hop-and-stop.mp4';
  await f.write(video, 'native movie');
  await fs.truncate(path.join(f.distRoot, video), MAX_ASSET_BYTES + 1);
  const plan = await planSharedMedia(f);
  assert.equal(plan.files.length, 4);
  assert.equal(plan.retained[0].pathname, video);
  const staging = path.join(f.root, 'stage');
  await stageSharedMedia(plan, staging);
  for (const file of plan.files) {
    assert.equal(await fs.readFile(path.join(staging, file.cohort, 'assets', file.pathname), 'utf8'), await fs.readFile(path.join(f.publicRoot, file.pathname), 'utf8'));
  }
  assert.equal(await fs.readFile(path.join(f.publicRoot, video), 'utf8'), 'native movie');
  const catalog = await fs.readFile(path.join(staging, 'words/assets', MANIFEST_PATH), 'utf8');
  assert.equal(sha256(catalog), plan.cohorts.words.manifestSha256);
}));

test('build removes only byte-matched published copies and keeps new/changed media usable locally', async () => fixture(async f => {
  const first = await planSharedMedia(f);
  const published = publication(first);
  await f.write(paths[0], 'new version of the word');
  await f.write('/images/new.webp', 'new picture');
  const current = await planSharedMedia(f);
  const result = await stripPublishedMedia(current, published.release, published.fetchImpl);
  assert.equal(result.stripped, 3);
  assert.equal(result.local, 2);
  assert.equal(await fs.readFile(path.join(f.distRoot, paths[0]), 'utf8'), 'new version of the word');
  assert.equal(await fs.readFile(path.join(f.distRoot, 'images/new.webp'), 'utf8'), 'new picture');
  for (const pathname of paths.slice(1)) await assert.rejects(fs.stat(path.join(f.distRoot, pathname)), { code: 'ENOENT' });
  for (const pathname of paths) assert.ok((await fs.stat(path.join(f.publicRoot, pathname))).isFile());
}));

test('missing, tampered or cross-collection catalogs fail before any removal', async () => fixture(async f => {
  const plan = await planSharedMedia(f);
  const { release } = publication(plan);
  await assert.rejects(stripPublishedMedia(plan, release, async () => new Response('offline', { status: 503 })), /unavailable/);
  await assert.rejects(stripPublishedMedia(plan, release, async () => new Response('{}')), /checksum/);
  const wrong = JSON.stringify({ schemaVersion: 2, cohort: 'words', files: { '/images/cat.webp': { sha256: 'a'.repeat(64), size: 1 } } });
  const invalid = structuredClone(release);
  invalid.cohorts.words.manifestSha256 = sha256(wrong);
  await assert.rejects(stripPublishedMedia(plan, invalid, async () => new Response(wrong)), /Invalid public|Invalid pinned/);
  for (const pathname of paths) assert.ok((await fs.stat(path.join(f.distRoot, pathname))).isFile());
}));

test('the recent song pack remains local even when identical verified copies exist in shared hosting', async () => fixture(async f => {
  const song = '/action-songs/hop-and-stop/audio/page-01.mp3';
  await f.write(song, 'recent song page recording');
  const plan = await planSharedMedia(f);
  const { release, fetchImpl } = publication(plan);
  const result = await stripPublishedMedia(plan, release, fetchImpl);
  assert.equal(result.stripped, 4);
  assert.equal(result.local, 1);
  assert.equal(await fs.readFile(path.join(f.distRoot, song), 'utf8'), 'recent song page recording');
}));

test('changed output and source overlap fail safely before deleting media', async () => fixture(async f => {
  await assert.rejects(planSharedMedia({ distRoot: f.publicRoot, publicRoot: f.publicRoot }), /separate/);
  const plan = await planSharedMedia(f);
  const { release, fetchImpl } = publication(plan);
  await fs.writeFile(path.join(f.distRoot, paths[2]), 'changed after hash');
  await assert.rejects(stripPublishedMedia(plan, release, fetchImpl), /changed/);
  await assert.rejects(stageSharedMedia(plan, f.distRoot), /separate/);
  assert.ok((await fs.stat(path.join(f.distRoot, paths[0]))).isFile());
}));

test('symlink media cannot escape source/output boundaries', async () => fixture(async f => {
  await fs.symlink(path.join(f.publicRoot, paths[0]), path.join(f.distRoot, 'audio/link.mp3'));
  await assert.rejects(planSharedMedia(f), /symlinks/);
}));

test('every published asset is independently byte-verified; corrupted cloud content blocks activation', async () => fixture(async f => {
  const plan = await planSharedMedia(f);
  const { release, fetchImpl } = publication(plan);
  assert.equal((await verifyPublishedMedia(plan, release, { fetchImpl })).verified, 4);
  await assert.rejects(verifyPublishedMedia(plan, release, { fetchImpl, concurrency: 0 }), /concurrency/);
  const corrupted = async url => url.endsWith(MANIFEST_PATH) ? fetchImpl(url) : new Response('corrupt');
  await assert.rejects(verifyPublishedMedia(plan, release, { fetchImpl: corrupted }), /differ|size/);
  assert.ok((await fs.stat(path.join(f.distRoot, paths[0]))).isFile());
}));
