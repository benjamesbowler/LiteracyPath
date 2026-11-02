import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyCanonicalImageReferenceProof, verifyCurrentCanonicalImageReference,
  CANONICAL_REFERENCE_PATH as uri, CANONICAL_REFERENCE_MANIFEST, CANONICAL_REFERENCE_BUILDER,
  CANONICAL_REFERENCE_METADATA, CANONICAL_REFERENCE_CONSUMERS } from '../../tools/lib/canonicalImageReferences.mjs';
import { isTempOrSourcePath } from '../../tools/checkMediaOverwriteRisk.js';

const hash = text => createHash('sha256').update(text).digest('hex');
function fixture() {
  const covers = Array.from({ length: 10 }, (_, i) => ({ path: `/guided-reading/series/moonwood-tales/book-${String(i + 1).padStart(2, '0')}/cover.webp`, sha256: String(i).repeat(64) }));
  const manifest = { schemaVersion: 1, path: uri, sha256: 'a'.repeat(64), sourceCovers: covers,
    builder: 'node tools/buildGuidedReadingReferenceAssets.mjs --moonwood-cast-only',
    recipe: 'Current10covers numeric order,512x288 attention crop/intermediateWebP86;2columns5rows onRGB28,43,38,finalWebP88.',
    review: { decision: 'accept', fullSavedMontageViewed: true, all10panelsReviewed: true, runtimeNotApplicable: true,
      sourceRole: 'Authoring identity reference only; campaign renderers select actual atlas src, not this reference URI.' } };
  const sources = new Map();
  for (const file of CANONICAL_REFERENCE_METADATA) sources.set(file, JSON.stringify({ pip: { canonicalIdentityReference: uri } }));
  for (const file of CANONICAL_REFERENCE_CONSUMERS) sources.set(file, '// Audited atlas-only renderer fixture');
  const records = [...covers, { path: uri, sha256: manifest.sha256 }].map(r => ({ ...r, status: 'approved' }));
  sources.set('src/content/appVisualAssetReviews.generated.js', `export const appVisualAssetReview = ${JSON.stringify({ assets: records })};\nexport default appVisualAssetReview;`);
  sources.set('src/data/generated/repairedImageRevisions.generated.js', `export const REPAIRED_IMAGE_REVISIONS = Object.freeze(${JSON.stringify({ [uri]: manifest.sha256.slice(0, 12) })});`);
  return { entry: { path: 'public' + uri, status: 'M' }, manifest, sources,
    definition: { kind: 'approved-moonwood-cast-reference', path: uri, manifest: CANONICAL_REFERENCE_MANIFEST,
      manifestSha256: 'b'.repeat(64), builder: CANONICAL_REFERENCE_BUILDER, builderSha256: 'c'.repeat(64),
      metadataUses: CANONICAL_REFERENCE_METADATA.map(path => ({ path, sha256: hash(sources.get(path)), object: 'pip', field: 'canonicalIdentityReference' })),
      consumerPins: CANONICAL_REFERENCE_CONSUMERS.map(path => ({ path, sha256: hash(sources.get(path)) })) },
    manifestSha256: 'b'.repeat(64), builderSha256: 'c'.repeat(64), reproducedSha256: manifest.sha256,
    currentHashes: new Map([...covers, { path: uri, sha256: manifest.sha256 }].map(r => [r.path, r.sha256])),
    dimensions: { format: 'webp', width: 1024, height: 1440, hasAlpha: false } };
}
test('completed exact canonical reference is separately verified; generic source classification stays strict', () => {
  assert.equal(verifyCanonicalImageReferenceProof(fixture()), true);
  assert.equal(isTempOrSourcePath('public' + uri), true);
  assert.equal(isTempOrSourcePath('public/guided-reading/reference/characters/unknown.webp'), true);
});
for (const [label, change] of [
  ['unknown path', p => p.entry.path = 'public/guided-reading/reference/characters/unknown.webp'],
  ['new/unestablished file', p => p.entry.status = 'A'],
  ['unknown kind', p => p.definition.kind = 'any-reference'],
  ['changed manifest bytes', p => p.manifestSha256 = 'd'.repeat(64)],
  ['changed builder bytes', p => p.builderSha256 = 'd'.repeat(64)],
  ['changed source pixels', p => p.currentHashes.set(p.manifest.sourceCovers[0].path, 'd'.repeat(64))],
  ['changed output pixels', p => p.currentHashes.set(uri, 'd'.repeat(64))],
  ['nonreproducing recipe', p => p.reproducedSha256 = 'd'.repeat(64)],
  ['recipe drift', p => p.manifest.recipe += ' alternate crop'],
  ['source order drift', p => p.manifest.sourceCovers.reverse()],
  ['missing source cover', p => p.manifest.sourceCovers.pop()],
  ['unreviewed panels', p => p.manifest.review.all10panelsReviewed = false],
  ['unreviewed complete output', p => p.manifest.review.fullSavedMontageViewed = false],
  ['rejected review', p => p.manifest.review.decision = 'reject'],
  ['runtime reference claim', p => p.manifest.review.runtimeNotApplicable = false],
  ['wrong dimensions', p => p.dimensions.width = 512],
  ['unregistered alpha', p => p.dimensions.hasAlpha = true],
  ['consumer source drift', p => p.sources.set(CANONICAL_REFERENCE_CONSUMERS[0], '// changed')],
  ['extra consumer registration', p => p.definition.consumerPins.push({ path: 'src/New.jsx', sha256: 'd'.repeat(64) })],
  ['missing metadata registration', p => p.definition.metadataUses.pop()],
  ['wrong metadata role', p => p.definition.metadataUses[0].field = 'src'],
  ['new direct displayed reference', p => p.sources.set('src/New.jsx', `<img src="${uri}"/>`)],
  ['new computed reference root', p => p.sources.set('src/New.jsx', 'const src = "/guided-reading/reference/characters/" + name')],
  ['new metadata field reader', p => p.sources.set('src/New.jsx', 'image.src = hero.canonicalIdentityReference')],
  ['new metadata loader', p => p.sources.set('src/New.jsx', 'fetch("/src/features/soundSeekers/v3/content/heroAnimations.json")')],
  ['extra metadata display field', p => { const file = CANONICAL_REFERENCE_METADATA[0]; p.sources.set(file, JSON.stringify({ pip: { canonicalIdentityReference: uri, src: uri } })); p.definition.metadataUses[0].sha256 = hash(p.sources.get(file)); }],
  ['mutable source approval', p => { const file = 'src/content/appVisualAssetReviews.generated.js'; p.sources.set(file, p.sources.get(file).replace('"status":"approved"', '"status":"held-source"')); }],
  ['executable review module', p => { const file = 'src/content/appVisualAssetReviews.generated.js'; p.sources.set(file, 'fetch("/unexpected");\n' + p.sources.get(file)); }],
  ['stale output cache revision', p => { const file = 'src/data/generated/repairedImageRevisions.generated.js'; p.sources.set(file, p.sources.get(file).replace('aaaaaaaaaaaa', 'bbbbbbbbbbbb')); }]
]) test('canonical reference rejects ' + label, () => {
  const p = fixture(); change(p); assert.equal(verifyCanonicalImageReferenceProof(p), false);
});
test('current official recipe reproduces the reviewed complete reference without writing public output', async () => {
  assert.equal(await verifyCurrentCanonicalImageReference(process.cwd(), { path: 'public' + uri, status: 'M' }), true);
  assert.equal(await verifyCurrentCanonicalImageReference(process.cwd(), { path: 'public/guided-reading/reference/characters/unknown.webp', status: 'M' }), false);
});
