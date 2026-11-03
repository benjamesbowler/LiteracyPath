// The build publisher and read-only Worker share one versioned media protocol.
// These roots are already public application assets, never learner uploads.
export const MEDIA_ROOTS = Object.freeze([
  'audio', 'guided-reading', 'images', 'game-assets', 'media', 'action-songs', 'models'
]);
export const PROTOCOL_VERSION = 1;
export const SNAPSHOT_PATTERN = /^[a-f0-9]{40}$/;
export const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export function isMediaPath(pathname) {
  return MEDIA_ROOTS.some(root => pathname.startsWith(`/${root}/`));
}

export function validMediaPath(pathname) {
  return isMediaPath(pathname) && ![...pathname].some(character => character === '\\' || character.codePointAt(0) < 32 || character.codePointAt(0) === 127)
    && !pathname.slice(1).split('/').some(part => part === '.' || part === '..' || part === '');
}

export async function shardForPath(pathname) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pathname));
  return new Uint8Array(digest)[0].toString(16).padStart(2, '0');
}

export function objectKey(sha256) {
  if (!SHA256_PATTERN.test(sha256)) throw new Error('Invalid media content hash');
  return `objects/${sha256}`;
}

export function shardKey(snapshot, shard) {
  if (!SNAPSHOT_PATTERN.test(snapshot) || !/^[a-f0-9]{2}$/.test(shard)) {
    throw new Error('Invalid media snapshot/shard');
  }
  return `snapshots/${snapshot}/${shard}.json`;
}

export function mediaType(pathname) {
  const extension = pathname.split('.').at(-1).toLowerCase();
  return ({
    png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif', ico: 'image/x-icon',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg',
    wav: 'audio/wav', flac: 'audio/flac', mp4: 'video/mp4', webm: 'video/webm',
    mov: 'video/quicktime', json: 'application/json; charset=utf-8',
    glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream',
    pdf: 'application/pdf', txt: 'text/plain; charset=utf-8', md: 'text/plain; charset=utf-8',
    js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8', html: 'text/html; charset=utf-8', wasm: 'application/wasm',
    vtt: 'text/vtt; charset=utf-8', zip: 'application/zip',
    webmanifest: 'application/manifest+json; charset=utf-8',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf'
  })[extension] || 'application/octet-stream';
}

export function parseRange(value, size) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return false;
  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
      || start >= size || end < start) return false;
    end = Math.min(end, size - 1);
  }
  return { offset: start, length: end - start + 1 };
}

export function browserCachePolicy(pathname) {
  // Keep the assessment's existing revalidation rule, including through a proxy.
  if (pathname.startsWith('/images/assessment/')) return 'public, max-age=0, must-revalidate';
  return pathname.startsWith('/audio/') || pathname.startsWith('/guided-reading/')
    || /\.(webp|png|jpg|jpeg|gif|svg|mp3|m4a|ogg|wav|woff|woff2)$/.test(pathname)
    ? 'public, max-age=86400, stale-while-revalidate=2592000'
    : 'public, max-age=0, must-revalidate';
}
