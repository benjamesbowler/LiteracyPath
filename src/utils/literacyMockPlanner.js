import { isEligibleLiteracyResponse, canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure } from "./literacyEvidence.js";
import { literacyMockFocus, literacyMockTaskKey, sameLiteracyMockTask } from './literacyMockConditions.js';
import { LITERACY_MOCK_OPENING_DOMAINS, LITERACY_MOCK_ADDITIONAL_DOMAINS, LITERACY_MOCK_ENTRY_SKILLS } from '../policy/literacyMockBlueprint.js';
const DOMAIN_IDS = ['sound_awareness', 'phonics', 'vocabulary', 'listening', 'reading', 'language', 'print', 'writing'];
const responseId = response => response.questionId || response.itemId || response.id;

function hash(value) {
  let result = 2166136261;
  for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}
function randomFor(seed) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function shuffleLiteracyMock(values, seed) {
  const result = [...values];
  const random = randomFor(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

export function mockChoices(item, seed) {
  if (item.format === 'select_text') return [...item.choices];
  return shuffleLiteracyMock(item.choices, `${seed}:${item.id}:choices`);
}

const stimulus = item => item.stimulusKey || item.id;
const mediaBase = path => String(path || '').split('#')[0];
function mediaFailureFilter(mediaFailures = []) {
  const failedIds = new Set(mediaFailures.map(failure => failure.questionId));
  const failedSources = new Set(mediaFailures.flatMap(failure => failure.failedMediaPaths || []).map(mediaBase).filter(Boolean));
  return item => failedIds.has(item.id) || [...(item.requiredAudioPaths || []), ...(item.requiredImagePaths || [])]
    .some(path => failedSources.has(mediaBase(path)));
}
const usable = (bank, mediaFailures = []) => {
  const tutorialStimuli = new Set(bank.filter(item => item.tutorialOnly).map(stimulus));
  const failed = mediaFailureFilter(mediaFailures);
  return bank.filter(item => item.mediaReady !== false && !item.tutorialOnly
    && !tutorialStimuli.has(stimulus(item)) && !failed(item) && DOMAIN_IDS.includes(item.domainId));
};

function validateHistory(bank, plan, responses) {
  if (!plan?.seed || !Array.isArray(plan.itemIds)) throw new Error('Invalid mock plan.');
  if (responses.length > plan.itemIds.length) throw new Error('Mock responses exceed the plan.');
  const byId = new Map(bank.map(item => [item.id, item]));
  for (const id of plan.itemIds) if (!byId.has(id)) throw new Error(`Unknown planned mock item: ${id}`);
  responses.forEach((response, index) => {
    if (responseId(response) !== plan.itemIds[index]) throw new Error('Mock response history does not match its committed plan.');
  });
  return byId;
}

/** Content chooses skills before mechanics. Pair fresh examples of one actual task. */
export function selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount = 24, seed } = {}) {
  if (!sessionId || !studentId || ![24, 43].includes(itemCount)) throw new Error('Mock plans need a session, learner, and 24 or 43 questions.');
  const candidates = usable(bank);
  const planSeed = seed || `${sessionId}:${studentId}`;
  const blueprintSeed = `${sessionId}:${itemCount}:blueprint`;
  const domains = [...LITERACY_MOCK_OPENING_DOMAINS, ...LITERACY_MOCK_ADDITIONAL_DOMAINS[itemCount]];
  const blueprint = [];
  const selectedSkills = new Set();
  const entryGroups = new Map();
  for (const item of candidates.filter(value => value.level === 1)) {
    const key = literacyMockTaskKey(item);
    if (!entryGroups.has(key)) entryGroups.set(key, []);
    entryGroups.get(key).push(item);
  }
  const groups = [...entryGroups.values()].filter(items => new Set(items.map(stimulus)).size >= 2);
  for (let index = 0; index < domains.length; index += 1) {
    const domainId = domains[index];
    const availableSkills = [...new Set(groups.filter(items => items[0].domainId === domainId).map(items => items[0].skillId))];
    const shuffled = shuffleLiteracyMock(availableSkills.sort(), `${blueprintSeed}:${domainId}:${index}`);
    const eligible = shuffled.filter(skillId => !selectedSkills.has(skillId));
    const starters = index < 2 ? eligible.filter(skillId => LITERACY_MOCK_ENTRY_SKILLS[domainId]?.includes(skillId)) : [];
    const choices = starters.length ? starters : eligible;
    if (!choices.length) throw new Error(`No mock questions cover ${domainId}.`);
    const skillId = choices[0];
    selectedSkills.add(skillId);
    blueprint.push({ skillId, domainId });
  }
  // Reserve each pair together so the first example cannot strand its followup.
  const pairs = [];
  const usedIds = new Set();
  const usedStimuli = new Set();
  const usedFormats = new Set();
  for (let index = 0; index < blueprint.length; index += 1) {
    const slot = blueprint[index];
    const taskGroups = shuffleLiteracyMock(groups.filter(items => items[0].skillId === slot.skillId), `${blueprintSeed}:${index}:tasks`);
    // The content blueprint has already chosen this skill. Among its valid
    // entry tasks, prefer an unused mechanic; keep seeded ordering for ties.
    // Reserve both examples from that one task/access group, never an unrelated
    // followup just to complete an interaction-format quota.
    const offersUnusedFormat = group => group.some(item => !usedIds.has(item.id)
      && !usedStimuli.has(stimulus(item)) && !usedFormats.has(item.format));
    taskGroups.sort((a, b) => Number(offersUnusedFormat(b)) - Number(offersUnusedFormat(a)));
    let pair;
    for (const group of taskGroups) {
      const ordered = shuffleLiteracyMock(group.filter(item => !usedIds.has(item.id) && !usedStimuli.has(stimulus(item))), `${planSeed}:${index}:examples`);
      // Only after task selection, prefer a different mechanic when the exact
      // same construct offers one. A mechanic never chooses the skill.
      ordered.sort((a, b) => Number(usedFormats.has(a.format)) - Number(usedFormats.has(b.format)));
      const first = ordered[0];
      const second = first && ordered.find(item => item.id !== first.id && stimulus(item) !== stimulus(first));
      if (second) { pair = [first, second]; break; }
    }
    if (!pair) throw new Error(`Not enough fresh mock questions for ${slot.skillId}.`);
    pairs.push(pair);
    for (const item of pair) { usedIds.add(item.id); usedStimuli.add(stimulus(item)); usedFormats.add(item.format); }
  }
  // First eight retain broad access. Q9 revisits the opening sound task; fresh
  // skills then alternate with earlier followups instead of a half-test wait.
  const chosen = pairs.slice(0, 8).map(pair => pair[0].id);
  let followup = 0;
  let nextSkill = 8;
  while (chosen.length < itemCount) {
    if (followup < pairs.length) chosen.push(pairs[followup++][1].id);
    if (chosen.length < itemCount && nextSkill < pairs.length) chosen.push(pairs[nextSkill++][0].id);
  }
  return { itemIds: chosen.slice(0, itemCount), seed: planSeed };
}

/** A teacher's fresh check stays at the exact task, level and access conditions. */
export function selectLiteracyMockFreshCheck(bank, {
  sessionId, studentId, reference, focus = reference ? literacyMockFocus(reference) : null,
  itemCount = 6, eligibleItemIds, exposures = [], seed,
} = {}) {
  if (!sessionId || !studentId || !Number.isInteger(itemCount) || itemCount < 1 || itemCount > 6
    || !focus?.skillId || !focus?.domainId || !focus?.construct || !focus?.modality || ![1, 2].includes(Number(focus.level))) {
    throw new Error('Fresh checks need a session, learner, exact task and 1 to 6 questions.');
  }
  const criteria = { ...focus, level: Number(focus.level) };
  const allowed = eligibleItemIds ? new Set(eligibleItemIds) : null;
  const history = buildLiteracyExposureIndex({ exposures: [...exposures, ...(reference ? [reference] : [])] });
  const candidates = usable(bank).filter(item => (!allowed || allowed.has(item.id))
    && sameLiteracyMockTask(item, criteria, { includeLevel: true }) && !getLiteracyExposure(item, history).knownFamiliar);
  const planSeed = seed || `${sessionId}:${studentId}:fresh`;
  const fresh = [];
  for (const item of shuffleLiteracyMock(candidates, planSeed)) {
    if (getLiteracyExposure(item, history).knownFamiliar) continue;
    fresh.push(item);
    const identity = canonicalLiteracyIdentity(item);
    if (identity.itemId) history.items.add(identity.itemId);
    if (identity.passageKey) history.passages.add(identity.passageKey);
    if (identity.familyId) history.families.add(identity.familyId);
  }
  return {
    plan: fresh.length >= itemCount ? { itemIds: fresh.slice(0, itemCount).map(item => item.id), seed: planSeed } : null,
    availableCount: fresh.length, unavailable: fresh.length < itemCount, focus: criteria,
    reason: fresh.length >= itemCount ? null : 'Not enough unseen examples of this exact task at the same level and access conditions.',
  };
}

/** Change only unoffered slots using independent evidence in that same task. */
export function adaptLiteracyMockPlan(bank, plan, responses = [], mediaFailures = [], presentations = [], { resetUnsupported = false } = {}) {
  const byId = validateHistory(bank, plan, responses);
  const recent = new Map();
  for (const response of responses) if (isEligibleLiteracyResponse(response)) recent.set(literacyMockTaskKey(byId.get(responseId(response))), response);
  const itemIds = [...plan.itemIds];
  const reservedIds = new Set(itemIds);
  const reservedStimuli = new Set(itemIds.map(id => stimulus(byId.get(id) || { id })));
  const candidates = usable(bank, mediaFailures);
  const failed = mediaFailureFilter(mediaFailures);
  const presentedIds = new Set(presentations.map(presentation => presentation.questionId));
  for (let index = responses.length; index < itemIds.length; index += 1) {
    const original = byId.get(itemIds[index]);
    // Media repair preserves a blocked slot's planned difficulty. The repair
    // helper owns its replacement; adaptation must not turn failure into evidence.
    if (failed(original) || presentedIds.has(original.id)) continue;
    const previous = recent.get(literacyMockTaskKey(original));
    if (!previous && !resetUnsupported) continue;
    const level = previous?.isCorrect ? 2 : 1;
    if (original.level === level) continue;
    const eligible = candidates.filter(item => sameLiteracyMockTask(item, original) && item.level === level
      && !reservedIds.has(item.id) && !reservedStimuli.has(stimulus(item)));
    const shuffled = shuffleLiteracyMock(eligible, `${plan.seed}:${index}:${previous?.questionId || 'entry'}:${level}`);
    const replacement = shuffled.find(item => item.format === original.format) || shuffled[0];
    if (!replacement) continue;
    reservedIds.delete(original.id); reservedStimuli.delete(stimulus(original));
    itemIds[index] = replacement.id; reservedIds.add(replacement.id); reservedStimuli.add(stimulus(replacement));
  }
  return { itemIds, seed: plan.seed };
}

/** Replace failed evidence without consuming a response or changing the skill blueprint. */
export function replaceFailedLiteracyMockMedia(bank, plan, responses = [], mediaFailures = []) {
  const byId = validateHistory(bank, plan, responses);
  const failed = mediaFailureFilter(mediaFailures);
  const affected = plan.itemIds.flatMap((id, index) => index >= responses.length && failed(byId.get(id)) ? [index] : []);
  if (!affected.length) return { plan, unavailable: false };
  const affectedSet = new Set(affected);
  const kept = plan.itemIds.filter((_, index) => !affectedSet.has(index)).map(id => byId.get(id));
  const reservedIds = new Set(kept.map(item => item.id));
  const reservedStimuli = new Set(kept.map(stimulus));
  const candidates = usable(bank, mediaFailures).filter(item => !reservedIds.has(item.id) && !reservedStimuli.has(stimulus(item)));
  const options = new Map(affected.map(index => {
    const original = byId.get(plan.itemIds[index]);
    const pool = candidates.filter(item => sameLiteracyMockTask(item, original, { includeLevel: true }));
    const shuffled = shuffleLiteracyMock(pool, `${plan.seed}:${index}:media:${original.id}`);
    const ordered = [...shuffled.filter(item => item.format === original.format), ...shuffled.filter(item => item.format !== original.format)];
    // One fresh stimulus can occupy only one slot, even if several item IDs use it.
    const unique = new Map();
    for (const item of ordered) if (!unique.has(stimulus(item))) unique.set(stimulus(item), item);
    return [index, [...unique.values()]];
  }));
  if (affected.some(index => !options.get(index).length)) return { plan, unavailable: true };
  const ownerByStimulus = new Map();
  const replacements = new Map();
  // Augmenting paths avoid a false availability stop when one skill has an
  // alternative stimulus and another can only use the initially chosen one.
  function assign(index, seen) {
    for (const item of options.get(index)) {
      const key = stimulus(item);
      if (seen.has(key)) continue;
      seen.add(key);
      const previous = ownerByStimulus.get(key);
      if (previous === undefined || assign(previous, seen)) {
        ownerByStimulus.set(key, index); replacements.set(index, item.id); return true;
      }
    }
    return false;
  }
  for (const index of [...affected].sort((a, b) => options.get(a).length - options.get(b).length || a - b)) {
    if (!assign(index, new Set())) return { plan, unavailable: true };
  }
  return { plan: { itemIds: plan.itemIds.map((id, index) => replacements.get(index) || id), seed: plan.seed }, unavailable: false };
}
