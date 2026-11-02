import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const HISTORICAL_REVIEW_SOURCE_COHORT = 'tools/manifests/app-visual-historical-review-sources.json';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const HISTORICAL_REVIEW_SOURCES = JSON.parse(fs.readFileSync(path.join(root, HISTORICAL_REVIEW_SOURCE_COHORT), 'utf8'));
export const HISTORICAL_REVIEW_KINDS = ['historical-assessment-review-source', 'unselected-reviewed-assessment-source'];
const hash = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const normalizedRows = rows => rows.map(row => ({ reviewId: row.reviewId, questionId: row.questionId,
  skillId: row.skillId, area: row.area, status: row.status, targetWord: row.targetWord }))
  .sort((a, b) => a.reviewId.localeCompare(b.reviewId));

export async function collectHistoricalReviewSourceState(projectRoot, finite) {
  const errors = [], domains = finite.questionSelectionDomains;
  const expected = HISTORICAL_REVIEW_SOURCES.expectedQuestionDomainKinds;
  if (!Array.isArray(domains) || !same(domains.map(d => d.kind).sort(), expected)
      || domains.some(d => !Array.isArray(d.questionIds) || !Array.isArray(d.imagePaths)
        || d.questionIds.some(id => typeof id !== 'string' || !id)
        || d.imagePaths.some(p => typeof p !== 'string' || !p.startsWith('/')))) errors.push('historical source requires every exact current question-selection domain');
  for (const pin of HISTORICAL_REVIEW_SOURCES.sourcePins) {
    if (hash(fs.readFileSync(path.join(projectRoot, pin.path))) !== pin.sha256) errors.push('historical review source authority changed: ' + pin.path);
  }
  const qa = await import(pathToFileURL(path.join(projectRoot, 'src/data/generated/mediaQaReviewItems.generated.js')));
  const status = await import(pathToFileURL(path.join(projectRoot, 'src/data/mediaQaReviewStatus.js')));
  const raw = await import(pathToFileURL(path.join(projectRoot, 'src/content/assessments/v3/assessmentImageStyleDecisions.generated.js')));
  const composite = await import(pathToFileURL(path.join(projectRoot, 'src/content/assessments/v3/assessmentImageStyleDecisions.js')));
  const byPath = new Map();
  // Administrative device-local decisions never replace the checked-in source
  // pairing in this proof. The actual merge with no local overrides is sealed.
  for (const row of status.mergeMediaQaReviewItems(qa.mediaQaReviewItems, {})) {
    const rows = byPath.get(row.imagePath) || []; rows.push(row); byPath.set(row.imagePath, rows);
  }
  const safeDomains = Array.isArray(domains) ? domains : [];
  return { errors, qaRowsByPath: byPath,
    questionIds: new Set(safeDomains.flatMap(d => d.questionIds || [])),
    imagePaths: new Set(safeDomains.flatMap(d => d.imagePaths || []).map(p => p.split(/[?#]/)[0])),
    rawDecisions: raw.ASSESSMENT_IMAGE_STYLE_DECISIONS,
    compositeDecisions: composite.ASSESSMENT_IMAGE_STYLE_DECISIONS,
    summary: { cohort: HISTORICAL_REVIEW_SOURCE_COHORT,
      cohortSha256: hash(fs.readFileSync(path.join(projectRoot, HISTORICAL_REVIEW_SOURCE_COHORT))),
      sourcePins: HISTORICAL_REVIEW_SOURCES.sourcePins,
      questionDomains: { count: safeDomains.length, sha256: hash(JSON.stringify(safeDomains)) },
      mergedQaRows: qa.mediaQaReviewItems.length, errors } };
}

export function checkHistoricalReviewSourceRole({ asset, state, finitePaths, runtimePaths }) {
  const fail = reason => ({ valid: false, reason });
  const definition = HISTORICAL_REVIEW_SOURCES.assets.find(row => row.path === asset.path);
  if (!definition || definition.kind !== asset.kind || definition.sha256 !== asset.sha256) return fail('outside exact historical review source cohort/bytes');
  if (!state || state.errors.length) return fail('missing or changed historical source authorities/current question domains');
  if (finitePaths.has(asset.path) || runtimePaths.has(asset.path) || state.imagePaths.has(asset.path)) return fail('historical source is selected/bound by a learner or accepted history domain');
  const rows = state.qaRowsByPath.get(asset.path) || [];
  if (asset.kind === 'historical-assessment-review-source') {
    if (!same(normalizedRows(rows), normalizedRows(definition.qaRows)) || !rows.length) return fail('historical QA row identity/status/path changed');
    if (rows.some(row => !row.questionId || state.questionIds.has(row.questionId))) return fail('historical QA question is selected by a current or accepted history domain');
    return { valid: true, allowed: definition.sourceLiterals,
      role: { sourceRole: 'historical-administrative-assessment-thumbnail', learnerSelected: false,
        reviewRows: { count: rows.length, sha256: hash(JSON.stringify(normalizedRows(rows))) }, newPixelApproval: false } };
  }
  if (rows.length) return fail('source-only reviewed variant acquired a QA pairing');
  const raw = state.rawDecisions[asset.path], current = state.compositeDecisions[asset.path];
  if (raw?.sha256 !== asset.sha256 || current?.sha256 !== asset.sha256 || raw.visualReview !== 'approved' || current.visualReview !== 'approved') return fail('exact retained raw/composite reviewed-source identity changed');
  return { valid: true, allowed: definition.sourceLiterals,
    role: { sourceRole: 'unselected-existing-reviewed-assessment-source', learnerSelected: false, newPixelApproval: false } };
}

// Administrative thumbnails and source-decision records are real consumers,
// so they must prevent deletion. They are not child picture selections. Only
// these exact pinned purposes may be separated for an already registered hold.
export function heldAdministrativeBindingRole(binding, { assetPaths, state }) {
  if (!state || state.errors.length || !assetPaths.has(binding.path)) return null;
  if (binding.surface === 'Admin Media QA actual all-row thumbnail selector'
      && binding.kind === 'positive-current-output'
      && (state.qaRowsByPath.get(binding.path) || []).some(row => row.reviewId === binding.word)) return 'retained-administrative-thumbnail';
  const definition = HISTORICAL_REVIEW_SOURCES.assets.find(row => row.path === binding.path && row.kind === 'unselected-reviewed-assessment-source');
  if (definition && binding.surface === 'Current assessment approved source decision authority'
      && binding.kind === 'approved-source-authority' && binding.word === definition.sha256
      && state.rawDecisions[binding.path]?.sha256 === definition.sha256
      && state.compositeDecisions[binding.path]?.sha256 === definition.sha256) return 'retained-existing-source-decision';
  return null;
}
