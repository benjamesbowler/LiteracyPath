import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  MEDIA_ROOTS, PROTOCOL_VERSION, SNAPSHOT_PATTERN, mediaType,
  objectKey, shardForPath, shardKey, validMediaPath
} from '../../infra/shared-media/protocol.mjs';

export const MAX_BUCKET_BYTES = 8_000_000_000; // Leave headroom below R2's 10 GB free allowance.
const MAX_SINGLE_OBJECT_BYTES = 100_000_000;
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const stableSignature = stat => [stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');

async function fileHashes(file) {
  const sha256 = createHash('sha256');
  const md5 = createHash('md5');
  for await (const chunk of createReadStream(file)) { sha256.update(chunk); md5.update(chunk); }
  return { sha256: sha256.digest('hex'), md5: md5.digest('hex') };
}

async function mediaFiles(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Shared media cannot contain symlinks: ${file}`);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  for (const name of MEDIA_ROOTS) {
    const directory = path.join(root, name);
    const stat = await fs.lstat(directory).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error));
    if (!stat) continue;
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Invalid media directory: ${directory}`);
    await visit(directory);
  }
  return files.sort();
}

export async function planSharedMedia({ distRoot, publicRoot, snapshot }) {
  if (!SNAPSHOT_PATTERN.test(snapshot || '')) throw new Error('Invalid media snapshot');
  const dist = await fs.realpath(distRoot);
  const source = await fs.realpath(publicRoot);
  const nested = (a, b) => a === b || b.startsWith(a + path.sep);
  if (nested(dist, source) || nested(source, dist)) throw new Error('Media output must be separate from source assets');
  const files = [];
  const sourceFiles = [];
  const objects = new Map();
  const shards = new Map();
  for (const file of await mediaFiles(dist)) {
    const pathname = '/' + path.relative(dist, file).split(path.sep).join('/');
    if (!validMediaPath(pathname)) throw new Error(`Unsupported media path: ${pathname}`);
    const stat = await fs.stat(file);
    if (stat.size > MAX_SINGLE_OBJECT_BYTES) throw new Error(`Media exceeds verified single-object upload limit: ${pathname}`);
    const hashes = await fileHashes(file);
    if (stableSignature(await fs.stat(file)) !== stableSignature(stat)) throw new Error(`Media changed during planning: ${pathname}`);
    const entry = { sha256: hashes.sha256, size: stat.size, contentType: mediaType(pathname) };
    const shard = await shardForPath(pathname);
    if (!shards.has(shard)) shards.set(shard, {});
    shards.get(shard)[pathname] = entry;
    const key = objectKey(hashes.sha256);
    objects.set(key, { key, file, size: stat.size, md5: hashes.md5, signature: stableSignature(stat) });
    files.push({ pathname, ...entry });
    sourceFiles.push({ file, signature: stableSignature(stat) });
  }
  if (!files.length) throw new Error('Refusing an empty shared-media snapshot');
  const manifestShards = [...shards].sort(([a], [b]) => a < b ? -1 : 1).map(([shard, entries]) => {
    const body = JSON.stringify({ schemaVersion: PROTOCOL_VERSION, snapshot, entries });
    return { key: shardKey(snapshot, shard), body, sha256: hash('sha256', body), md5: hash('md5', body), size: Buffer.byteLength(body) };
  });
  const release = {
    schemaVersion: PROTOCOL_VERSION, snapshot,
    files: files.length, logicalBytes: files.reduce((total, file) => total + file.size, 0),
    uniqueObjects: objects.size, uniqueBytes: [...objects.values()].reduce((total, object) => total + object.size, 0),
    shards: Object.fromEntries(manifestShards.map(shard => [shard.key.split('/').at(-1), shard.sha256]))
  };
  const body = JSON.stringify(release);
  return { distRoot: dist, snapshot, files, sourceFiles, objects: [...objects.values()], shards: manifestShards,
    release, marker: { key: `snapshots/${snapshot}/release.json`, body, md5: hash('md5', body), size: Buffer.byteLength(body) } };
}

async function parallel(items, count, run) {
  let next = 0;
  let failed;
  const results = await Promise.allSettled(Array.from({ length: Math.min(count, items.length) }, async () => {
    while (!failed && next < items.length) {
      const item = items[next++];
      try { await run(item); } catch (error) { failed = error; throw error; }
    }
  }));
  const rejected = results.find(result => result.status === 'rejected');
  if (rejected) throw rejected.reason;
}

function matches(remote, local) {
  return remote && remote.size === local.size && remote.etag.replaceAll('"', '') === local.md5;
}

export async function publishSharedMedia(plan, store, { stripOutput = false, onProgress = () => {} } = {}) {
  // List the entire dedicated bucket, including old snapshots, before any write.
  const existing = await store.list();
  const entries = new Map(existing.map(object => [object.key, object]));
  const writes = [...plan.objects, ...plan.shards, plan.marker];
  const projectedBytes = existing.reduce((total, object) => total + object.size, 0)
    + writes.filter(object => !entries.has(object.key)).reduce((total, object) => total + object.size, 0);
  if (projectedBytes > MAX_BUCKET_BYTES) throw new Error('Shared media would exceed the 8 GB free-tier safety budget; no objects uploaded');
  const prior = await store.getText(plan.marker.key);
  if (prior !== null && prior !== plan.marker.body) throw new Error('An immutable snapshot already exists with different media; use a new source commit');

  let uploaded = 0;
  let reused = 0;
  await parallel(plan.objects, 12, async object => {
    if (stableSignature(await fs.stat(object.file)) !== object.signature) throw new Error(`Media changed after planning: ${object.file}`);
    const remote = entries.get(object.key);
    if (remote) {
      if (!matches(remote, object)) throw new Error(`Stored content hash has inconsistent bytes: ${object.key}`);
      reused += 1;
    } else {
      const response = await store.putIfAbsent(object);
      if (!matches(response, object)) throw new Error(`Storage checksum mismatch: ${object.key}`);
      uploaded += 1;
    }
    if ((uploaded + reused) % 1000 === 0) onProgress({ uploaded, reused, total: plan.objects.length });
  });
  for (const shard of plan.shards) {
    const remote = entries.get(shard.key);
    if (remote && !matches(remote, shard)) throw new Error(`Immutable manifest shard differs: ${shard.key}`);
    if (!remote && !matches(await store.putIfAbsent(shard), shard)) throw new Error('Manifest shard checksum mismatch');
    if (await store.getText(shard.key) !== shard.body) throw new Error('Manifest shard readback mismatch');
  }
  // A fresh strongly consistent listing verifies the checksum/size of every
  // object and shard before publishing the release marker or stripping output.
  const confirmed = new Map((await store.list()).map(object => [object.key, object]));
  for (const object of [...plan.objects, ...plan.shards]) {
    if (!matches(confirmed.get(object.key), object)) throw new Error(`Media verification failed: ${object.key}`);
  }
  if (prior === null && !matches(await store.putIfAbsent(plan.marker), plan.marker)) throw new Error('Release marker checksum mismatch');
  if (await store.getText(plan.marker.key) !== plan.marker.body) throw new Error('Release marker readback mismatch');
  // Source assets are untouched. Only generated deployment copies are removed,
  // and only after the entire snapshot has been published and verified.
  if (stripOutput) {
    for (const object of plan.sourceFiles) {
      if (stableSignature(await fs.stat(object.file)) !== object.signature) throw new Error('Media changed before output pruning');
    }
    for (const root of MEDIA_ROOTS) await fs.rm(path.join(plan.distRoot, root), { recursive: true, force: true });
    await fs.writeFile(path.join(plan.distRoot, 'shared-media-release.json'), JSON.stringify(plan.release));
  }
  return { ...plan.release, uploaded, reused, projectedBucketBytes: projectedBytes, outputStripped: stripOutput };
}
