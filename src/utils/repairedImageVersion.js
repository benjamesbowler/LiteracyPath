import { REPAIRED_IMAGE_REVISIONS } from '../data/generated/repairedImageRevisions.generated.js';

// Delivery identity only. Catalogue paths and shared QA IDs remain canonical.
export function withRepairedImageVersion(src = '') {
  if (!src.startsWith('/') || src.startsWith('//')) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const revision = REPAIRED_IMAGE_REVISIONS[pathname];
  if (!revision) return src;
  const url = new URL(src, 'https://literacy.guide');
  url.searchParams.set('v', revision);
  return url.pathname + url.search + url.hash;
}
