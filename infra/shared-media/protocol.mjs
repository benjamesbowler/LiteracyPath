// Static assets only: no R2, Worker script, database or metered compute binding.
export const MEDIA_ROOTS = Object.freeze(['audio', 'guided-reading', 'images', 'game-assets', 'media', 'action-songs', 'models']);
export const COHORTS = Object.freeze(['words', 'speech', 'stories', 'art']);
export const MAX_ASSET_BYTES = 25 * 1024 * 1024;
export const MAX_COHORT_FILES = 19_000; // Headroom under the 20,000-file Free limit.
export const MANIFEST_PATH = '/_shared-media/manifest.json';
export const HASH_PATTERN = /^[a-f0-9]{64}$/;
export const STATIC_HEADERS = '/*\n  X-Content-Type-Options: nosniff\n/audio/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=2592000\n/guided-reading/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=2592000\n/images/assessment/*\n  Cache-Control: public, max-age=0, must-revalidate\n/_shared-media/*\n  Cache-Control: public, max-age=31536000, immutable\n';

export function validMediaPath(pathname) {
  return MEDIA_ROOTS.some(root => pathname.startsWith(`/${root}/`))
    && ![...pathname].some(c => c === '\\' || c.codePointAt(0) < 32 || c.codePointAt(0) === 127)
    && !pathname.slice(1).split('/').some(part => part === '.' || part === '..' || part === '');
}

export function mediaCohort(pathname) {
  if (!validMediaPath(pathname)) throw new Error('Invalid public media path');
  if (pathname.startsWith('/audio/production/en-US/isolated_word/')) return 'words';
  if (/^\/audio\/production\/en-US\/(assessment_prompt|assessment_passage|instruction)\//.test(pathname)) return 'speech';
  if (/^\/audio\/production\/en-US\/(guided_page|supplemental|story_page|comprehension)\//.test(pathname)) return 'stories';
  return 'art';
}

export function validateRelease(release) {
  if (!release?.enabled) return false;
  if (release.schemaVersion !== 2 || release.provider !== 'cloudflare-static-free') throw new Error('Invalid free static media release');
  for (const cohort of COHORTS) {
    const entry = release.cohorts?.[cohort];
    if (!entry || !HASH_PATTERN.test(entry.manifestSha256) || !Number.isSafeInteger(entry.files)
      || entry.files < 0 || entry.files > MAX_COHORT_FILES) throw new Error(`Invalid ${cohort} media receipt`);
    const origin = new URL(entry.origin);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/'
      || origin.port || origin.search || origin.hash
      || !new RegExp(`^[a-f0-9]{8}-literacy-media-${cohort}\\.[a-z0-9-]+\\.workers\\.dev$`).test(origin.hostname)) {
      throw new Error('Shared media must pin an immutable Cloudflare version origin');
    }
  }
  return true;
}
