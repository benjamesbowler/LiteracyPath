import { allocateIndependentItems, shuffleLiteracyMock } from './literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, canonicalLiteracyIdentity, isEligibleLiteracyResponse } from './literacyEvidence.js';
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';
import { LITERACY_MOCK_AREA_MAX } from '../policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_BUDGETS, LITERACY_MOCK_V9_MAX_ITEMS, LITERACY_MOCK_V9_AREA_VERSION,
  literacyMockBoundaryStateV9, literacyMockBoundaryScheduleV9, literacyMockBoundaryPlaceholderBandV9 } from '../policy/literacyMockBoundaryV9.js';
import { sameLiteracyMockTask } from './literacyMockConditions.js';
import { selectLiteracyMockPrintRetakePool } from './literacyMockRetakePool.js';

const capacityError = message => Object.assign(new Error(message), { code: 'mock_fresh_capacity' });
const band = item => item?.adaptiveAreaBand ?? item?.itemSnapshot?.adaptiveAreaBand;
const mediaPaths = item => [...(item.requiredAudioPaths || []), ...(item.requiredImagePaths || [])].map(path => path.split('#')[0]);
const blocked = failures => {
  const ids = new Set(failures.map(row => row.questionId));
  const paths = new Set(failures.flatMap(row => row.failedMediaPaths || []).map(path => path.split('#')[0]));
  return item => ids.has(item.id) || mediaPaths(item).some(path => paths.has(path));
};
function usable(bank, failures = []) {
  const tutorials = new Set(bank.filter(item => item.tutorialOnly).map(item => item.stimulusKey));
  const failed = blocked(failures);
  return bank.filter(item => item.contentVersion === 'literacy-mock-v9' && item.mediaReady !== false
    && !item.tutorialOnly && !tutorials.has(item.stimulusKey) && isLiteracyItemEligible(item)
    && item.adaptiveMixedEligible === true && item.adaptiveDemand?.operation
    && item.adaptiveAreaVersion === LITERACY_MOCK_V9_AREA_VERSION
    && Number.isInteger(band(item)) && band(item) >= 0 && band(item) <= LITERACY_MOCK_AREA_MAX[item.domainId]
    && !failed(item));
}
function fresh(items, exposures) {
  const history = buildLiteracyExposureIndex({ exposures });
  const stimuli = new Set(exposures.map(item => item.stimulusKey || item.itemSnapshot?.stimulusKey).filter(Boolean));
  return items.filter(item => !stimuli.has(item.stimulusKey) && !getLiteracyExposure(item, history).knownFamiliar);
}
// V9 keeps each foundational lexical target in one area. This is an explicit
// route reservation; it does not make copies in other areas independent.
function entryOwnership(items) {
  const listening = new Set(items.filter(item => item.skillId === 'listen_words_phrases' && band(item) === 1).map(item => item.targetWord));
  const reading = new Set(items.filter(item => item.skillId === 'picture_word_reading' && !listening.has(item.targetWord)).map(item => item.targetWord));
  const vocabulary = new Set(items.filter(item => item.skillId === 'picture_vocabulary' && !listening.has(item.targetWord) && !reading.has(item.targetWord)).map(item => item.targetWord));
  const language = new Set(items.filter(item => item.domainId === 'language' && item.foundationBand !== undefined).map(item => item.targetWord));
  const owners = new Map([...listening].map(word => [word, 'listening']).concat([...reading].map(word => [word, 'reading']),
    [...vocabulary].map(word => [word, 'vocabulary']), [...language].map(word => [word, 'language'])));
  return items.filter(item => {
    const family = canonicalLiteracyIdentity(item).familyId;
    const word = family?.startsWith('mock-foundation-word:') ? family.slice('mock-foundation-word:'.length) : null;
    return !owners.has(word) || owners.get(word) === item.domainId;
  });
}
function offlinePool(candidates, plan, byId) {
  const reserved = plan.itemIds.map(id => byId.get(id));
  reserved.push(...selectLiteracyMockPrintRetakePool(candidates, plan, byId, { boundary: true }).filter(item => !plan.itemIds.includes(item.id)));
  const assets = new Set(reserved.flatMap(mediaPaths));
  for (const [domain, maximum] of Object.entries(LITERACY_MOCK_AREA_MAX)) for (let stage = 0; stage <= maximum; stage++) {
    if (domain === 'print' && stage <= 1) continue;
    // From entry zero, stage k first becomes available after k successes.
    // Include one extra candidate at this demand. Repair still requires an
    // exact task/access/source-level match and safely holds if none remains.
    const total = LITERACY_MOCK_V9_AREA_BUDGETS[domain] - stage + 1;
    const needed = Math.max(0, total - reserved.filter(item => item.domainId === domain && band(item) === stage).length);
    if (!needed) continue;
    const pool = shuffleLiteracyMock(fresh(candidates, reserved).filter(item => item.domainId === domain && band(item) === stage), `${plan.seed}:${domain}:${stage}:offline`);
    pool.sort((left, right) => mediaPaths(left).filter(path => !assets.has(path)).length - mediaPaths(right).filter(path => !assets.has(path)).length);
    const selected = allocateIndependentItems(Array.from({ length: needed }, () => pool));
    if (!selected) throw capacityError(`Not enough fresh ${domain} questions at demand ${stage}.`);
    for (const item of selected) { reserved.push(item); for (const path of mediaPaths(item)) assets.add(path); }
  }
  return reserved.map(item => item.id);
}

export function selectLiteracyMockBoundaryPlan(bank, { sessionId, studentId, itemCount = LITERACY_MOCK_V9_MAX_ITEMS, seed, exposures = [], onOfflineItems } = {}) {
  if (!sessionId || !studentId || itemCount !== LITERACY_MOCK_V9_MAX_ITEMS) throw new Error('A V9 boundary plan needs a session, learner and the bounded 67-question maximum.');
  const schedule = literacyMockBoundaryScheduleV9(), planSeed = seed || `${sessionId}:${studentId}:${LITERACY_MOCK_V9_AREA_VERSION}`;
  const candidates = fresh(entryOwnership(usable(bank)), exposures), ordinals = {};
  const options = schedule.map((domain, index) => {
    const demand = literacyMockBoundaryPlaceholderBandV9(domain, ordinals[domain] = (ordinals[domain] || 0) + 1);
    return shuffleLiteracyMock(candidates.filter(item => item.domainId === domain && band(item) === demand), `${planSeed}:${index}:entry`);
  });
  const selected = allocateIndependentItems(options, schedule);
  if (!selected) throw capacityError('Not enough fresh questions for the bounded boundary test.');
  const plan = { itemIds: selected.map(item => item.id), seed: planSeed };
  if (onOfflineItems) onOfflineItems(offlinePool(candidates, plan, new Map(bank.map(item => [item.id, item]))));
  return plan;
}

export function adaptLiteracyMockBoundaryPlan(bank, plan, responses = [], failures = [], presentations = [], { exposures = [] } = {}) {
  const byId = new Map(bank.map(item => [item.id, item]));
  if (responses.length > plan.itemIds.length || responses.some((row, index) => row.questionId !== plan.itemIds[index])
    || plan.itemIds.some(id => !byId.has(id)) || plan.itemIds.length > LITERACY_MOCK_V9_MAX_ITEMS) throw new Error('Invalid adaptive boundary history.');
  const shown = new Set(presentations.map(row => row.questionId)), failed = blocked(failures);
  if (plan.itemIds.some((id, index) => index > responses.length && shown.has(id))) throw new Error('Invalid adaptive boundary presentation history.');
  const current = byId.get(plan.itemIds[responses.length]);
  const frozenCurrent = current && (shown.has(current.id) || failed(current));
  // A previously shown current question survives late assistance. Treat it as
  // a reserved unscored slot only while building future placeholders; its real
  // answer will recompute the state and can restore unused bounded slots.
  const reservedRows = frozenCurrent ? [...responses, { questionId: current.id, responseStatus: 'skipped', evidenceType: 'unscored', isCorrect: null }] : responses;
  const schedule = literacyMockBoundaryScheduleV9(reservedRows, { bank: byId });
  const states = literacyMockBoundaryStateV9(responses, { bank: byId });
  const prefix = plan.itemIds.slice(0, responses.length + (frozenCurrent ? 1 : 0));
  const frozen = prefix.map(id => byId.get(id));
  const candidates = fresh(entryOwnership(usable(bank, failures)), [...exposures, ...frozen]);
  const firstByArea = new Map(), counts = new Map();
  for (let index = 0; index < schedule.length; index++) {
    const domain = schedule[index];
    if (index >= responses.length && !firstByArea.has(domain)) firstByArea.set(domain, index);
  }
  for (const row of responses) if (isEligibleLiteracyResponse(row)) counts.set(row.skillId, (counts.get(row.skillId) || 0) + 1);
  const domainOrdinals = {};
  const options = [];
  const editable = [];
  for (let index = 0; index < schedule.length; index++) {
    const domain = schedule[index], ordinal = domainOrdinals[domain] = (domainOrdinals[domain] || 0) + 1;
    if (index < prefix.length) continue;
    const demand = firstByArea.get(domain) === index ? states[domain].nextBand : literacyMockBoundaryPlaceholderBandV9(domain, ordinal);
    const original = byId.get(plan.itemIds[index]);
    const pool = shuffleLiteracyMock(candidates.filter(item => item.domainId === domain && band(item) === demand), `${plan.seed}:${index}:${responses.length}:${demand}`);
    pool.sort((left, right) => (counts.get(left.skillId) || 0) - (counts.get(right.skillId) || 0) || Number(right.id === original?.id) - Number(left.id === original?.id));
    editable.push(index); options.push(pool);
  }
  const selected = allocateIndependentItems(options, editable.map(index => schedule[index]));
  if (!selected) throw capacityError('A fresh question at the appropriate demand is unavailable. Saved answers are safe.');
  return { ...plan, itemIds: [...prefix, ...selected.map(item => item.id)] };
}

/** Repair preserves the actual task, access, source level and authored demand. */
export function repairLiteracyMockBoundaryPlan(bank, plan, responses = [], failures = [], _presentations = [], { exposures = [], content = false } = {}) {
  void _presentations;
  const byId = new Map(bank.map(item => [item.id, item])), failed = blocked(failures);
  const affected = plan.itemIds.flatMap((id, index) => index >= responses.length && (content ? !isLiteracyItemEligible(byId.get(id)) : failed(byId.get(id))) ? [index] : []);
  if (!affected.length) return { plan, unavailable: false };
  const slots = new Set(affected), frozen = plan.itemIds.filter((_, index) => !slots.has(index)).map(id => byId.get(id));
  const candidates = fresh(entryOwnership(usable(bank, failures)), [...exposures, ...frozen]);
  const options = affected.map(index => {
    const original = byId.get(plan.itemIds[index]);
    return shuffleLiteracyMock(candidates.filter(item => band(item) === band(original) && sameLiteracyMockTask(item, original, { includeLevel: true })), `${plan.seed}:${index}:repair`);
  });
  const selected = allocateIndependentItems(options);
  if (!selected) return { plan, unavailable: true };
  const itemIds = [...plan.itemIds]; affected.forEach((index, selectedIndex) => { itemIds[index] = selected[selectedIndex].id; });
  return { plan: { ...plan, itemIds }, unavailable: false };
}
