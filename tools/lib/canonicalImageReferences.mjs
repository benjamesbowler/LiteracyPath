import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { renderMoonwoodCastSheet } from '../buildGuidedReadingReferenceAssets.mjs';

export const CANONICAL_REFERENCE_PATH = '/guided-reading/reference/characters/moonwood-cast-master.webp';
export const CANONICAL_REFERENCE_MANIFEST = 'source-art/app-clean-cartoon/moonwood-cast-reference.json';
export const CANONICAL_REFERENCE_BUILDER = 'tools/buildGuidedReadingReferenceAssets.mjs';
export const CANONICAL_REFERENCE_REGISTRY = 'tools/manifests/canonical-image-references.json';
export const CANONICAL_REFERENCE_METADATA = ['src/features/soundSeekers/v3/content/heroActions.json', 'src/features/soundSeekers/v3/content/heroAnimations.json'];
export const CANONICAL_REFERENCE_CONSUMERS = [
  'src/features/soundSeekers/v3/SoundSeekersCampaign.jsx',
  'src/features/soundSeekers/v3/render/campaignHeroes.js',
  'src/features/soundSeekers/v3/render/campaignWorldScene.js',
  'src/features/soundSeekers/v3/render/explorationLandscape.js',
  'src/features/soundSeekers/v3/render/explorationScene.js',
  'src/features/soundSeekers/v3/render/heroMotion.js',
  'src/features/soundSeekers/v3/render/mazeAdventureScene.js',
  'src/utils/repairedImageVersion.js'
];
const REVIEWS = 'src/content/appVisualAssetReviews.generated.js';
const REVISIONS = 'src/data/generated/repairedImageRevisions.generated.js';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hashPattern = /^[a-f0-9]{64}$/;
const recipe = 'Current10covers numeric order,512x288 attention crop/intermediateWebP86;2columns5rows onRGB28,43,38,finalWebP88.';

function jsonModule(source, marker, suffix, footer = '') {
  const start = source.indexOf(marker);
  if (start < 0 || source.slice(0, start).replace(/\/\/[^\n]*(?:\n|$)/g, '').trim()) throw Error('Not a data-only review/revision module');
  let tail = source.slice(start + marker.length).trim();
  if (footer) {
    if (!tail.endsWith(footer)) throw Error('Invalid data-only module export');
    tail = tail.slice(0, -footer.length).trim();
  }
  if (!tail.endsWith(suffix)) throw Error('Invalid data module suffix');
  return JSON.parse(tail.slice(0, -suffix.length));
}
function occurrences(value, found = [], trail = []) {
  if (value === CANONICAL_REFERENCE_PATH) found.push(trail.join('.'));
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) occurrences(child, found, [...trail, key]);
  return found;
}

export function verifyCanonicalImageReferenceProof(p) {
  try {
    const { definition: d, manifest: m, sources, currentHashes, dimensions } = p;
    if (p.entry.path !== 'public' + CANONICAL_REFERENCE_PATH || p.entry.status !== 'M'
      || d.kind !== 'approved-moonwood-cast-reference' || d.path !== CANONICAL_REFERENCE_PATH
      || d.manifest !== CANONICAL_REFERENCE_MANIFEST || d.builder !== CANONICAL_REFERENCE_BUILDER
      || !hashPattern.test(d.manifestSha256) || !hashPattern.test(d.builderSha256)
      || p.manifestSha256 !== d.manifestSha256 || p.builderSha256 !== d.builderSha256) return false;
    if (m.schemaVersion !== 1 || m.path !== d.path || !hashPattern.test(m.sha256)
      || m.builder !== 'node tools/buildGuidedReadingReferenceAssets.mjs --moonwood-cast-only'
      || m.recipe !== recipe || m.review?.decision !== 'accept' || m.review.fullSavedMontageViewed !== true
      || m.review.all10panelsReviewed !== true || m.review.runtimeNotApplicable !== true
      || m.review.sourceRole !== 'Authoring identity reference only; campaign renderers select actual atlas src, not this reference URI.') return false;
    const coverPaths = Array.from({ length: 10 }, (_, i) => `/guided-reading/series/moonwood-tales/book-${String(i + 1).padStart(2, '0')}/cover.webp`);
    if (!same(m.sourceCovers?.map(r => r.path), coverPaths) || m.sourceCovers.some(r => !hashPattern.test(r.sha256) || currentHashes.get(r.path) !== r.sha256)) return false;
    if (currentHashes.get(m.path) !== m.sha256 || p.reproducedSha256 !== m.sha256
      || dimensions.format !== 'webp' || dimensions.width !== 1024 || dimensions.height !== 1440 || dimensions.hasAlpha) return false;
    const reviews = jsonModule(sources.get(REVIEWS), 'export const appVisualAssetReview = ', ';', 'export default appVisualAssetReview;');
    for (const row of [...m.sourceCovers, { path: m.path, sha256: m.sha256 }]) {
      const matches = reviews.assets.filter(r => r.path === row.path);
      if (matches.length !== 1 || matches[0].status !== 'approved' || matches[0].sha256 !== row.sha256) return false;
    }
    const revisions = jsonModule(sources.get(REVISIONS), 'export const REPAIRED_IMAGE_REVISIONS = Object.freeze(', ');');
    if (revisions[m.path] !== m.sha256.slice(0, 12)) return false;
    for (const file of [REVIEWS, REVISIONS, ...CANONICAL_REFERENCE_METADATA]) if (sources.get(file).split(CANONICAL_REFERENCE_PATH).length !== 2) return false;
    if (!same(d.metadataUses?.map(r => r.path), CANONICAL_REFERENCE_METADATA)
      || !same(d.consumerPins?.map(r => r.path), CANONICAL_REFERENCE_CONSUMERS)) return false;
    for (const pin of [...d.metadataUses, ...d.consumerPins]) if (!hashPattern.test(pin.sha256) || sha(sources.get(pin.path)) !== pin.sha256) return false;
    for (const use of d.metadataUses) {
      if (use.object !== 'pip' || use.field !== 'canonicalIdentityReference') return false;
      const value = JSON.parse(sources.get(use.path));
      if (!same(occurrences(value), ['pip.canonicalIdentityReference'])) return false;
    }
    const allowed = new Set([REVIEWS, REVISIONS, ...CANONICAL_REFERENCE_METADATA, ...CANONICAL_REFERENCE_CONSUMERS]);
    const markers = /moonwood-cast-master|guided-reading\/reference|canonicalIdentityReference|heroAnimations\.json|heroActions\.json|campaignHeroes|appVisualAssetReview|repaired_?image_?revisions/i;
    for (const [file, source] of sources) if (markers.test(source) && !allowed.has(file)) return false;
    // Pinned metadata consumers render atlas.src and cannot begin reading the
    // authoring URI without changing their sealed bytes. Detect new direct
    // uses too, including bracket access/destructuring and dynamic root URLs.
    for (const file of CANONICAL_REFERENCE_CONSUMERS) if (/canonicalIdentityReference|moonwood-cast-master|guided-reading\/reference/.test(sources.get(file))) return false;
    return true;
  } catch { return false; }
}

export async function verifyCurrentCanonicalImageReference(root, entry) {
  if (entry.path !== 'public' + CANONICAL_REFERENCE_PATH || entry.status !== 'M') return false;
  const registryBytes = fs.readFileSync(path.join(root, CANONICAL_REFERENCE_REGISTRY));
  const registry = JSON.parse(registryBytes);
  if (registry.schemaVersion !== 1 || registry.references?.length !== 1) return false;
  const definition = registry.references[0], manifestBytes = fs.readFileSync(path.join(root, CANONICAL_REFERENCE_MANIFEST)), manifest = JSON.parse(manifestBytes);
  const expectedCovers = Array.from({ length: 10 }, (_, i) => `/guided-reading/series/moonwood-tales/book-${String(i + 1).padStart(2, '0')}/cover.webp`);
  if (manifest.path !== CANONICAL_REFERENCE_PATH || !same(manifest.sourceCovers?.map(r => r.path), expectedCovers)) return false;
  function readSources() {
  const sources = new Map();
  function walk(directory) {
    for (const row of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const file = directory + '/' + row.name;
      if (row.isDirectory()) walk(file);
      else if (/\.(?:[cm]?js|jsx|tsx?|json|html|css|svg)$/.test(row.name)) sources.set(file, fs.readFileSync(path.join(root, file), 'utf8'));
    }
  }
  for (const directory of ['src', 'preview', 'demos']) walk(directory);
  return sources;
  }
  const sources = readSources();
  const currentHashes = new Map([...manifest.sourceCovers, { path: manifest.path }].map(r => [r.path, sha(fs.readFileSync(path.join(root, 'public' + r.path)))]));
  const builderSha256 = sha(fs.readFileSync(path.join(root, CANONICAL_REFERENCE_BUILDER)));
  const reproducedSha256 = sha(await renderMoonwoodCastSheet(path.join(root, 'public')));
  if (!same([...readSources()], [...sources]) || !fs.readFileSync(path.join(root, CANONICAL_REFERENCE_MANIFEST)).equals(manifestBytes)
    || !fs.readFileSync(path.join(root, CANONICAL_REFERENCE_REGISTRY)).equals(registryBytes)
    || sha(fs.readFileSync(path.join(root, CANONICAL_REFERENCE_BUILDER))) !== builderSha256
    || [...currentHashes].some(([p, hash]) => sha(fs.readFileSync(path.join(root, 'public' + p))) !== hash)) return false;
  return verifyCanonicalImageReferenceProof({ entry, definition, manifest, sources, currentHashes,
    manifestSha256: sha(manifestBytes), builderSha256, reproducedSha256,
    dimensions: await sharp(path.join(root, 'public' + manifest.path)).metadata() });
}
