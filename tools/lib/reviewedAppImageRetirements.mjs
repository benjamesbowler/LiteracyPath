import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { collectAppVisualSourceGraph } from './appVisualSourceGraph.mjs';
import { hashGitBlobs } from './gitBlobHashes.mjs';

export const REVIEWED_RETIREMENTS_MANIFEST = 'tools/manifests/reviewed-app-image-retirements.json';
export const REVIEWED_RETIREMENT_AUTHORITIES = Object.freeze([
  'tools/lib/reviewedAppImageRetirements.mjs',
  'tools/lib/appVisualSourceGraph.mjs',
  'tools/auditFiniteImageBindings.mjs',
  'src/policy/literacyItemEligibility.js',
  'src/policy/literacyMockVersions.js',
  'src/data/assessmentImageStyleBlocklist.js'
]);
const EVIDENCE = Object.freeze({
  'obsolete-preposition-placeholders': ['tools/manifests/retired-preposition-placeholder-scenes.json', 60],
  'obsolete-assessment-thumbnails': ['tools/manifests/retired-obsolete-assessment-thumbnails.json', 5]
});
const sha = /^[a-f0-9]{64}$/;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const imagePath = p => typeof p === 'string' && /^\/(?:images|guided-reading)\//.test(p)
  && path.posix.normalize(p) === p && !/[\\?#\s]/.test(p);
const exactKeys = (v, keys) => v && same(Object.keys(v).sort(), [...keys].sort());

// Pure evidence validation, shared by the actual gate and adversarial tests.
// A manifest entry never grants approval: every deletion and replacement must
// satisfy fresh consumer, source, historical-byte and current-review checks.
export function validateReviewedRetirementEvidence({ manifest, deletedPaths, previousHashes, historicalHashes,
  existingPaths, replacements, reviews, rejectedHashes, authorities, evidence, finite, graph, literalReferences }) {
  const failures = [], paths = new Set(), rows = [];
  const fail = message => failures.push(message);
  if (!exactKeys(manifest, ['schemaVersion','kind','sourceRevision','authorities','questionDomainKinds','cohorts'])
    || manifest.schemaVersion !== 1 || manifest.kind !== 'reviewed-app-image-retirements'
    || !/^[a-f0-9]{40}$/.test(manifest.sourceRevision) || !Array.isArray(manifest.cohorts) || !manifest.cohorts.length) {
    return { failures: ['Invalid reviewed-image retirement manifest'], paths, rows };
  }
  if (!same(manifest.authorities?.map(r => r.path), REVIEWED_RETIREMENT_AUTHORITIES)
    || manifest.authorities.some(r => !exactKeys(r, ['path','sha256']) || !sha.test(r.sha256) || authorities[r.path] !== r.sha256)) fail('Reviewed retirement authority changed');
  const domains = Array.isArray(finite?.questionSelectionDomains) ? finite.questionSelectionDomains : [];
  const bindings = Array.isArray(finite?.allFiniteImageBindings) ? finite.allFiniteImageBindings : [];
  if (!finite || !Array.isArray(finite.errors) || finite.errors.length || !Array.isArray(finite.allFiniteImageBindings)
    || finite.historicalBranches?.length !== 15 || !Array.isArray(finite.coverage) || finite.coverage.length < 50 || !Array.isArray(finite.questionSelectionDomains)
    || !same(domains.map(d => d.kind).sort(), manifest.questionDomainKinds)
    || domains.some(d => !Array.isArray(d.imagePaths) || !Array.isArray(d.questionIds))) fail('Incomplete current, retention or accepted-history selection proof');
  if (!graph || !Array.isArray(graph.modules) || !graph.modules.length || graph.issues?.length !== 0 || graph.dynamic?.length !== 0) fail('Incomplete current source graph');
  if (!Array.isArray(literalReferences) || literalReferences.length) fail('Retired image has a reachable source literal');
  const seen = new Set(), ids = new Set();
  for (const cohort of manifest.cohorts) {
    if (!cohort || typeof cohort !== 'object') { fail('Malformed retirement cohort'); continue; }
    const obsolete = cohort.kind === 'obsolete-administrative-thumbnails';
    const format = cohort.kind === 'reviewed-format-migration';
    const orphan = cohort.kind === 'orphaned-moonwood-author-reference';
    if (!exactKeys(cohort, ['id','kind','assetCount','assets', ...(obsolete ? ['evidence'] : [])])
      || ids.has(cohort.id) || !Number.isInteger(cohort.assetCount) || cohort.assetCount < 1
      || !Array.isArray(cohort.assets) || cohort.assetCount !== cohort.assets.length
      || !(obsolete || format || orphan)) { fail('Invalid or duplicate reviewed retirement cohort'); continue; }
    ids.add(cohort.id);
    if (obsolete) {
      const spec = EVIDENCE[cohort.id], current = evidence[cohort.evidence?.path];
      if (!spec || !exactKeys(cohort.evidence, ['path','sha256']) || cohort.evidence.path !== spec[0]
        || cohort.assetCount !== spec[1] || !sha.test(cohort.evidence.sha256)
        || current?.sha256 !== cohort.evidence.sha256 || !Array.isArray(current?.assets)
        || !same(current.assets.map(a => ({ oldPath: a.path, sha256: a.sha256 })).sort((a,b)=>a.oldPath.localeCompare(b.oldPath)), cohort.assets)) {
        fail('Obsolete thumbnail cohort differs from exact checked-in retirement evidence');
      }
    } else if (format && cohort.id !== 'reviewed-format-migrations') fail('Unregistered format migration cohort');
    else if (orphan && (cohort.id !== 'orphan-moonwood-expansion-reference' || cohort.assetCount !== 1)) fail('Unregistered orphan source cohort');
    for (const asset of cohort.assets) {
      const keys = ['oldPath','sha256', ...(format ? ['newPath','newSha256','width','height','hasAlpha'] : [])];
      if (!exactKeys(asset, keys) || !imagePath(asset.oldPath) || !sha.test(asset.sha256) || seen.has(asset.oldPath)) { fail('Malformed or duplicate retirement asset'); continue; }
      seen.add(asset.oldPath);
      if (previousHashes[asset.oldPath] !== asset.sha256 || historicalHashes[asset.oldPath] !== asset.sha256) fail(asset.oldPath + ': historical or comparison-base bytes changed');
      if (existingPaths.includes(asset.oldPath) || !deletedPaths.includes('public' + asset.oldPath)) fail(asset.oldPath + ': retirement is not a complete physical deletion');
      if (bindings.some(r => r.path?.split(/[?#]/)[0] === asset.oldPath)
        || domains.some(d => Array.isArray(d.imagePaths) && d.imagePaths.some(p => p.split(/[?#]/)[0] === asset.oldPath))) fail(asset.oldPath + ': selected by a current or retained consumer');
      if (orphan && asset.oldPath !== '/guided-reading/reference/characters/moonwood-expansion-cast-master.png') fail('Outside exact orphan Moonwood reference scope');
      if (format) {
        const replacement = replacements[asset.newPath], review = reviews[asset.newPath];
        if (!/\.(?:png|svg)$/.test(asset.oldPath) || asset.newPath !== asset.oldPath.replace(/\.(?:png|svg)$/, '.webp')
          || !imagePath(asset.newPath) || !sha.test(asset.newSha256) || !Number.isInteger(asset.width) || asset.width < 1
          || !Number.isInteger(asset.height) || asset.height < 1 || typeof asset.hasAlpha !== 'boolean'
          || replacement?.format !== 'webp' || replacement.sha256 !== asset.newSha256
          || replacement.width !== asset.width || replacement.height !== asset.height || replacement.hasAlpha !== asset.hasAlpha
          || review?.status !== 'approved' || review.sha256 !== asset.newSha256 || rejectedHashes.includes(asset.newSha256)) fail(asset.oldPath + ': replacement is not exact current reviewed WebP evidence');
      }
      paths.add('public' + asset.oldPath);
    }
    rows.push({ id: cohort.id, kind: cohort.kind, assets: cohort.assetCount, sourceRevision: manifest.sourceRevision });
  }
  // Reject an asset passed as part of this exact cohort without a registration.
  if (deletedPaths.some(p => !seen.has(p.replace(/^public/, '')))) fail('Unlisted path in reviewed retirement deletion set');
  if (failures.length) { paths.clear(); return { failures, paths, rows: [] }; }
  return { failures, paths, rows };
}

export async function verifyReviewedAppImageRetirements(root, entries, baseline) {
  const empty = { paths: new Set(), rows: [], failures: [] };
  try {
    const manifestBytes = fs.readFileSync(path.join(root, REVIEWED_RETIREMENTS_MANIFEST));
    const manifest = JSON.parse(manifestBytes);
    const assets = manifest.cohorts.flatMap(c => c.assets);
    if (!entries.some(e => e.status === 'D' && assets.some(a => e.path === 'public' + a.oldPath))) return empty;
    const oldPaths = assets.map(a => a.oldPath), graph = collectAppVisualSourceGraph(root);
    const snapshot = () => graph.modules.map(p => ({ path:p, sha256:hash(fs.readFileSync(path.join(root,p))) }));
    const sourcesBefore = snapshot();
    const literalReferences = graph.modules.flatMap(file => {
      const text = fs.readFileSync(path.join(root,file),'utf8');
      return oldPaths.filter(p => text.includes(p)).map(p => ({ file, path:p }));
    });
    const authorities = Object.fromEntries(REVIEWED_RETIREMENT_AUTHORITIES.map(p => [p,hash(fs.readFileSync(path.join(root,p)))]));
    const evidence = Object.fromEntries(Object.values(EVIDENCE).map(([p]) => {
      const bytes = fs.readFileSync(path.join(root,p)); return [p,{sha256:hash(bytes),assets:JSON.parse(bytes).assets}];
    }));
    const temp = fs.mkdtempSync(path.join(os.tmpdir(),'lp-reviewed-retirement-'));
    let finite;
    try {
      const file = path.join(temp,'finite.json');
      execFileSync(process.execPath,['tools/auditFiniteImageBindings.mjs','--output='+file],{cwd:root,stdio:'pipe',maxBuffer:100*1024*1024});
      finite = JSON.parse(fs.readFileSync(file));
    } finally { fs.rmSync(temp,{recursive:true,force:true}); }
    const hashes = await hashGitBlobs(root, oldPaths.flatMap(p => [`${baseline}:public${p}`,`${manifest.sourceRevision}:public${p}`]));
    const previousHashes = {}, historicalHashes = {}, replacements = {};
    for (const a of assets) {
      previousHashes[a.oldPath] = hashes.get(`${baseline}:public${a.oldPath}`);
      historicalHashes[a.oldPath] = hashes.get(`${manifest.sourceRevision}:public${a.oldPath}`);
      if (a.newPath) { const bytes = fs.readFileSync(path.join(root,'public',a.newPath)); replacements[a.newPath] = {sha256:hash(bytes),...await sharp(bytes).metadata()}; }
    }
    const reviewsModule = await import(pathToFileURL(path.join(root,'src/content/appVisualAssetReviews.generated.js')));
    const rejectedModule = await import(pathToFileURL(path.join(root,'src/content/assessments/v3/assessmentMediaAuditRejectedHashes.generated.js')));
    const rejectedPolicy = await import(pathToFileURL(path.join(root,'src/content/assessments/v3/assessmentImageReviewPolicy.js')));
    const reviewedReplacements = reviewsModule.appVisualAssetReview.assets.filter(r=>Object.hasOwn(replacements,r.path));
    if (new Set(reviewedReplacements.map(r=>r.path)).size !== reviewedReplacements.length) throw Error('Duplicate replacement review identity');
    const result = validateReviewedRetirementEvidence({manifest,previousHashes,historicalHashes,replacements,authorities,evidence,finite,graph,literalReferences,
      deletedPaths:entries.filter(e=>e.status==='D'&&oldPaths.includes(e.path.replace(/^public/,''))).map(e=>e.path),
      existingPaths:oldPaths.filter(p=>fs.existsSync(path.join(root,'public',p))),
      reviews:Object.fromEntries(reviewsModule.appVisualAssetReview.assets.map(r=>[r.path,r])),
      rejectedHashes:[...Object.keys(rejectedModule.ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES),...Object.keys(rejectedPolicy.ASSESSMENT_REJECTED_IMAGE_HASHES)]});
    const authoritiesAfter = Object.fromEntries(REVIEWED_RETIREMENT_AUTHORITIES.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]));
    if (!same(sourcesBefore,snapshot()) || !same(graph,collectAppVisualSourceGraph(root))
      || !manifestBytes.equals(fs.readFileSync(path.join(root,REVIEWED_RETIREMENTS_MANIFEST)))
      || !same(authorities,authoritiesAfter)
      || Object.entries(evidence).some(([p,e])=>hash(fs.readFileSync(path.join(root,p)))!==e.sha256)
      || Object.entries(replacements).some(([p,r])=>hash(fs.readFileSync(path.join(root,'public',p)))!==r.sha256)
      || oldPaths.some(p=>fs.existsSync(path.join(root,'public',p)))) return {...empty,failures:['Sources or media changed during reviewed retirement proof; rerun after edits stop']};
    return result;
  } catch (error) { return {...empty,failures:['Reviewed-image retirement proof failed: '+error.message]}; }
}
