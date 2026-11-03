import {
  SNAPSHOT_PATTERN, SHA256_PATTERN, browserCachePolicy, objectKey,
  parseRange, shardForPath, shardKey, validMediaPath
} from './protocol.mjs';

const MAX_SHARDS = 64;

export function createMediaHandler() {
  // Only small immutable manifest shards are cached in memory; never media bodies.
  const shards = new Map();
  async function lookup(bucket, snapshot, pathname) {
    const key = shardKey(snapshot, await shardForPath(pathname));
    let shard = shards.get(key);
    if (!shard) {
      const object = await bucket.get(key);
      if (!object) return null;
      shard = await object.json();
      if (shard.schemaVersion !== 1 || shard.snapshot !== snapshot || !shard.entries) {
        throw new Error('Invalid media manifest');
      }
      if (shards.size >= MAX_SHARDS) shards.delete(shards.keys().next().value);
      shards.set(key, shard);
    }
    const entry = Object.hasOwn(shard.entries, pathname) ? shard.entries[pathname] : null;
    if (entry && (!SHA256_PATTERN.test(entry.sha256) || !Number.isSafeInteger(entry.size)
      || entry.size < 0 || typeof entry.contentType !== 'string')) {
      throw new Error('Invalid media entry');
    }
    return entry;
  }

  return async function handleMedia(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
    }
    const match = /^\/v1\/([a-f0-9]{40})(\/.*)$/.exec(url.pathname);
    let pathname;
    try { pathname = match && decodeURIComponent(match[2]); } catch { /* malformed URL */ }
    if (!match || !SNAPSHOT_PATTERN.test(match[1]) || !pathname || !validMediaPath(pathname)) {
      return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    try {
      const entry = await lookup(env.MEDIA, match[1], pathname);
      if (!entry) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
      const etag = `"${entry.sha256}"`;
      const headers = new Headers({
        'Content-Type': entry.contentType,
        'Content-Length': String(entry.size),
        'Cache-Control': browserCachePolicy(pathname),
        'Accept-Ranges': 'bytes',
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400'
      });
      if (request.headers.has('if-match') && !request.headers.get('if-match').split(',').some(value => value.trim() === etag || value.trim() === '*')) {
        headers.delete('Content-Length');
        return new Response(null, { status: 412, headers });
      }
      const noneMatch = request.headers.get('if-none-match');
      if (noneMatch && noneMatch.split(',').some(value => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')) {
        headers.delete('Content-Length');
        return new Response(null, { status: 304, headers });
      }
      if (request.method === 'HEAD') return new Response(null, { headers });
      const ifRange = request.headers.get('if-range');
      // A mismatched/weak/date validator safely requests the whole immutable body.
      const range = parseRange(!ifRange || ifRange === etag ? request.headers.get('range') : null, entry.size);
      if (range === false) {
        headers.set('Content-Range', `bytes */${entry.size}`);
        headers.set('Content-Length', '0');
        return new Response(null, { status: 416, headers });
      }
      const object = await env.MEDIA.get(objectKey(entry.sha256), range ? { range } : undefined);
      if (!object || !object.body) throw new Error('Verified media object is unavailable');
      if (range) {
        headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${entry.size}`);
        headers.set('Content-Length', String(range.length));
      }
      return new Response(object.body, { status: range ? 206 : 200, headers });
    } catch {
      // Do not leak bucket configuration/credentials or cache a transient failure.
      return new Response('Media temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
    }
  };
}

const handleMedia = createMediaHandler();
export default { fetch: handleMedia };
