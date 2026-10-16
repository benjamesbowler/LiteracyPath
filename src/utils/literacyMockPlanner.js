import { isEligibleLiteracyResponse, canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure } from "./literacyEvidence.js";
import { literacyMockFocus, literacyMockTaskKey, sameLiteracyMockTask } from './literacyMockConditions.js';
import { LITERACY_MOCK_OPENING_DOMAINS, LITERACY_MOCK_ADDITIONAL_DOMAINS, LITERACY_MOCK_ENTRY_SKILLS } from '../policy/literacyMockBlueprint.js';
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';
import { selectLiteracyMockAreaPlan,adaptLiteracyMockAreaPlan,repairLiteracyMockAreaPlan } from './literacyMockAreaPlanner.js';
import { selectLiteracyMockBoundaryPlan,adaptLiteracyMockBoundaryPlan,repairLiteracyMockBoundaryPlan } from './literacyMockBoundaryPlanner.js';
const DOMAIN_IDS = ['sound_awareness', 'phonics', 'vocabulary', 'listening', 'reading', 'language', 'print', 'writing'];
const responseId = response => response.questionId || response.itemId || response.id;

// Postgres JSONB can return object keys in a different order. Only the seed
// and ordered question identities determine whether a plan changed.
export function sameLiteracyMockPlan(left, right) {
  return left?.seed === right?.seed && Array.isArray(left?.itemIds) && Array.isArray(right?.itemIds)
    && left.itemIds.length === right.itemIds.length && left.itemIds.every((id, index) => id === right.itemIds[index]);
}

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
function remember(index, item) {
  const identity = canonicalLiteracyIdentity(item);
  if (identity.itemId) index.items.add(identity.itemId);
  if (identity.passageKey) index.passages.add(identity.passageKey);
  if (identity.familyId) index.families.add(identity.familyId);
}
// Search exact identity constraints with a fixed work budget. Capacity pruning
// catches impossible families before exploring permutations of earlier slots.
export function allocateIndependentItems(optionLists, groupKeys = optionLists.map(() => 'same-task')) {
  const identities = new Map(optionLists.flat().map(item => [item, { ...canonicalLiteracyIdentity(item), stimulusKey: stimulus(item) }]));
  const keys = ['itemId', 'passageKey', 'familyId', 'stimulusKey'];
  const occupied = Object.fromEntries(keys.map(key => [key, new Set()]));
  const selected = new Map();
  const failed = new Set();
  let work = 0;
  function search(remaining) {
    if (!remaining.length) return true;
    if (++work > 200000) return false;
    const state = `${remaining.join(',')}|${keys.map(key => [...occupied[key]].sort().join('\u001f')).join('\u001e')}`;
    if (failed.has(state)) return false;
    const viable = new Map();
    const groups = new Map();
    for (const slot of remaining) {
      const options = [];
      for (const item of optionLists[slot]) {
        if (++work > 200000) return false;
        const identity = identities.get(item);
        if (keys.every(key => !identity[key] || !occupied[key].has(identity[key]))) options.push(item);
      }
      if (!options.length) return false;
      viable.set(slot, options);
      if (!groups.has(groupKeys[slot])) groups.set(groupKeys[slot], []);
      groups.get(groupKeys[slot]).push(slot);
    }
    for (const slots of [...groups.values(), remaining]) {
      const union = new Set(slots.flatMap(slot => viable.get(slot)));
      if (union.size < slots.length || keys.some(key => {
        const values = new Set();
        for (const item of union) values.add(identities.get(item)[key] || item);
        return values.size < slots.length;
      })) return false;
    }
    const slot = [...remaining].sort((a, b) => viable.get(a).length - viable.get(b).length || a - b)[0];
    for (const item of viable.get(slot)) {
      const identity = identities.get(item);
      for (const key of keys) if (identity[key]) occupied[key].add(identity[key]);
      selected.set(slot, item);
      if (search(remaining.filter(value => value !== slot))) return true;
      selected.delete(slot);
      for (const key of keys) if (identity[key]) occupied[key].delete(identity[key]);
      if (work > 200000) return false;
    }
    failed.add(state);
    return false;
  }
  return search(optionLists.map((_, index) => index)) ? optionLists.map((_, index) => selected.get(index)) : null;
}
export function hasIndependentLiteracyMockLadder(entry, harder) {
  return Boolean(allocateIndependentItems([entry, entry, entry, harder, harder, harder]));
}
function distinctItems(items, count, exposures = []) {
  const index = buildLiteracyExposureIndex({ exposures });
  const priorStimuli = new Set(exposures.map(stimulus));
  const candidates = items.filter(item => !priorStimuli.has(stimulus(item)) && !getLiteracyExposure(item, index).knownFamiliar);
  const selected = [];
  const usedStimuli = new Set(exposures.map(stimulus));
  for (const item of candidates) {
    if (usedStimuli.has(stimulus(item)) || getLiteracyExposure(item, index).knownFamiliar) continue;
    selected.push(item); remember(index, item); usedStimuli.add(stimulus(item));
    if (selected.length === count) return selected;
  }
  return allocateIndependentItems(Array.from({ length: count }, () => candidates)) || selected;
}
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
  return bank.filter(item => isLiteracyItemEligible(item) && item.mediaReady !== false && !item.tutorialOnly
    && (item.contentVersion !== 'literacy-mock-v4' || item.adaptiveMixedEligible === true)
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

/** New v4 forms reserve a real ladder; fixed tasks remain focused evidence. */
export function literacyMockMixedTaskGroups(bank, { exposures = [] } = {}) {
  const history = buildLiteracyExposureIndex({ exposures });
  const candidates = usable(bank).filter(item => (item.contentVersion !== 'literacy-mock-v4' || item.adaptiveMixedEligible === true)
    && !getLiteracyExposure(item, history).knownFamiliar);
  const entryGroups = new Map();
  const harderGroups = new Map();
  for (const item of candidates) {
    const groups = item.level === 1 ? entryGroups : harderGroups;
    const key = literacyMockTaskKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...entryGroups].filter(([key, items]) => {
    if (distinctItems(items, 3).length !== 3) return false;
    if (items[0].contentVersion !== 'literacy-mock-v4') return true;
    if (!items.every(item => item.adaptiveMixedEligible === true && item.demandCeiling !== 1)) return false;
    const harder = harderGroups.get(key) || [];
    // Jointly reserve entry, harder follow-up, confirmation and replacement.
    return hasIndependentLiteracyMockLadder(items, harder);
  }).map(([, items]) => items);
}

/** Reserve entry, follow-up and confirmation for the same actual task. */
export function selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount, seed, exposures = [], onOfflineItems } = {}) {
  if(bank.some(q=>q.contentVersion==='literacy-mock-v9'))return selectLiteracyMockBoundaryPlan(bank,{sessionId,studentId,itemCount,seed,exposures,onOfflineItems});
  if(bank.some(q=>['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8'].includes(q.contentVersion)))return selectLiteracyMockAreaPlan(bank,{sessionId,studentId,itemCount:itemCount??43,seed,exposures,onOfflineItems});
  itemCount??=24;
  if (!sessionId || !studentId || ![24, 43].includes(itemCount)) throw new Error('Mock plans need a session, learner, and 24 or 43 questions.');
  const planSeed = seed || `${sessionId}:${studentId}`;
  const blueprintSeed = `${sessionId}:${itemCount}:blueprint`;
  const domains = [...LITERACY_MOCK_OPENING_DOMAINS, ...LITERACY_MOCK_ADDITIONAL_DOMAINS[itemCount]];
  const blueprint = [];
  const selectedSkills = new Set();
  const groups = literacyMockMixedTaskGroups(bank, { exposures });
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
  // Reserving the complete sequence keeps the final confirmation available
  // after a harder error, without changing the task or adding questions.
  const sequences = [];
  const reservationBlocks = [];
  let ladderReservations = [];
  const unseen = buildLiteracyExposureIndex({ exposures });
  const unseenHarder = usable(bank).filter(item => item.level === 2 && !getLiteracyExposure(item, unseen).knownFamiliar);
  const usedIds = new Set();
  const usedStimuli = new Set();
  const usedFormats = new Set();
  for (let index = 0; index < blueprint.length; index += 1) {
    const slot = blueprint[index];
    const taskGroups = shuffleLiteracyMock(groups.filter(items => items[0].skillId === slot.skillId), `${blueprintSeed}:${index}:tasks`);
    // The content blueprint has already chosen this skill. Among its valid
    // entry tasks, prefer an unused mechanic; keep seeded ordering for ties.
    // Reserve all examples from that one task/access group, never an unrelated
    // followup just to complete an interaction-format quota.
    const offersUnusedFormat = group => group.some(item => !usedIds.has(item.id)
      && !usedStimuli.has(stimulus(item)) && !usedFormats.has(item.format));
    taskGroups.sort((a, b) => Number(offersUnusedFormat(b)) - Number(offersUnusedFormat(a)));
    // If finite families shared across domains make the preferred skill
    // impossible, retain this domain with another unused valid skill. Try the
    // complete preferred task list first; format preferences never choose it.
    const reservedSkills = new Set(blueprint.map(value => value.skillId));
    taskGroups.push(...shuffleLiteracyMock(groups.filter(items => items[0].contentVersion === 'literacy-mock-v4'
      && items[0].domainId === slot.domainId && !reservedSkills.has(items[0].skillId)), `${blueprintSeed}:${index}:capacity-fallback`));
    const count = itemCount === 43 && index === blueprint.length - 1 ? 1 : 3;
    let sequence;
    for (const group of taskGroups) {
      const ordered = shuffleLiteracyMock(group.filter(item => item.contentVersion === 'literacy-mock-v4'
        || (!usedIds.has(item.id) && !usedStimuli.has(stimulus(item)))), `${planSeed}:${index}:examples`);
      // Only after task selection, prefer a different mechanic when the exact
      // same construct offers one. A mechanic never chooses the skill.
      ordered.sort((a, b) => Number(usedFormats.has(a.format)) - Number(usedFormats.has(b.format)));
      let selected;
      if (group[0].contentVersion === 'literacy-mock-v4') {
        const entries = ordered.filter(item => !getLiteracyExposure(item, unseen).knownFamiliar);
        const harder = unseenHarder.filter(item => sameLiteracyMockTask(item, group[0]));
        // Only two later slots can become harder after the initial entry
        // probe. Reserve that actual path, preserving finite cross-domain
        // families shared by reading and listening versions of a passage.
        const block = { count, options: [...Array.from({ length: count }, () => entries),
          ...Array.from({ length: count - 1 }, () => harder)] };
        const blocks = [...reservationBlocks, block];
        const prior = buildLiteracyExposureIndex({ exposures: [...sequences.flat(), ...ladderReservations] });
        const priorStimuli = new Set([...sequences.flat(), ...ladderReservations].map(stimulus));
        const fastWitness = allocateIndependentItems(block.options.map(options => options.filter(item => !priorStimuli.has(stimulus(item))
          && !getLiteracyExposure(item, prior).knownFamiliar)));
        // Allocate the complete form together. Earlier reservations may move
        // within their exact task when reading/listening share finite families;
        // a greedy earlier choice must not make a valid later task unavailable.
        const witness = fastWitness ? null : allocateIndependentItems(blocks.flatMap(value => value.options),
          blocks.flatMap((value, blockIndex) => value.options.map(() => String(blockIndex))));
        selected = [];
        if (fastWitness) {
          selected = fastWitness.slice(0, count);
          ladderReservations.push(...fastWitness.slice(count));
          reservationBlocks.push(block);
        } else if (witness) {
          let offset = 0;
          ladderReservations = [];
          blocks.forEach((value, blockIndex) => {
            const allocation = witness.slice(offset, offset + value.count);
            if (blockIndex < sequences.length) sequences[blockIndex] = allocation;
            else selected = allocation;
            ladderReservations.push(...witness.slice(offset + value.count, offset + value.options.length));
            offset += value.options.length;
          });
          reservationBlocks.push(block);
        }
      } else selected = distinctItems(ordered, count, sequences.flat());
      if (selected.length === count) { sequence = selected; slot.skillId = group[0].skillId; break; }
    }
    if (!sequence) throw new Error(`Not enough unseen comparable mock questions for ${slot.skillId}. Ask your teacher for a focused check.`);
    sequences.push(sequence);
    usedIds.clear(); usedStimuli.clear(); usedFormats.clear();
    for (const item of sequences.flat()) { usedIds.add(item.id); usedStimuli.add(stimulus(item)); usedFormats.add(item.format); }
  }
  // First eight retain broad access. Q9 revisits the opening sound task; fresh
  // skills then alternate with earlier followups instead of a half-test wait.
  const chosen = sequences.slice(0, 8).map(sequence => sequence[0].id);
  let followup = 0;
  let nextSkill = 8;
  while (followup < sequences.length || nextSkill < sequences.length) {
    if (followup < sequences.length) {
      const sequence = sequences[followup++];
      if (sequence[1]) chosen.push(sequence[1].id);
    }
    if (nextSkill < sequences.length) chosen.push(sequences[nextSkill++][0].id);
  }
  chosen.push(...sequences.flatMap(sequence => sequence[2] ? [sequence[2].id] : []));
  // The allocation already reserves mutually fresh harder alternatives. Reuse
  // that witness for device media, without widening the serialized server plan.
  onOfflineItems?.([...new Set([...chosen, ...ladderReservations.map(item => item.id)])]);
  return { itemIds: chosen, seed: planSeed };
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
  const fresh = distinctItems(shuffleLiteracyMock(candidates, planSeed), itemCount);
  return {
    plan: fresh.length >= itemCount ? { itemIds: fresh.slice(0, itemCount).map(item => item.id), seed: planSeed } : null,
    availableCount: fresh.length, unavailable: fresh.length < itemCount, focus: criteria,
    reason: fresh.length >= itemCount ? null : 'Not enough unseen examples of this exact task at the same level and access conditions.',
  };
}

function contingentLiteracyMockOptions(slots, pending, candidates, seed) {
  const groups = new Map();
  for (const slot of slots) {
    const key = literacyMockTaskKey(slot.item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }
  const options = [];
  const keys = [];
  for (const [key, group] of groups) {
    const opposite = group[0].level === 1 ? 2 : 1;
    // The first unoffered probe can switch every later slot. A shown probe
    // awaiting an answer can already switch every unoffered slot in this task.
    const count = group.length - (pending.some(item => literacyMockTaskKey(item) === key) ? 0 : 1);
    const pool = shuffleLiteracyMock(candidates.filter(item => item.level === opposite && sameLiteracyMockTask(item, group[0].item)),
      `${seed}:${key}:contingent:${opposite}`);
    for (let index = 0; index < count; index += 1) { options.push(pool); keys.push(key); }
  }
  return { options, keys };
}

/** Change only unoffered slots using independent evidence in that same task. */
export function adaptLiteracyMockPlan(bank, plan, responses = [], mediaFailures = [], presentations = [], { resetUnsupported = false, exposures = [] } = {}) {
  if(bank.some(q=>q.contentVersion==='literacy-mock-v9'))return adaptLiteracyMockBoundaryPlan(bank,plan,responses,mediaFailures,presentations,{exposures});
  if(bank.some(q=>['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8'].includes(q.contentVersion)))return adaptLiteracyMockAreaPlan(bank,plan,responses,mediaFailures,presentations,{exposures});
  const byId = validateHistory(bank, plan, responses);
  const recent = new Map();
  for (const response of responses) if (isEligibleLiteracyResponse(response)) recent.set(literacyMockTaskKey(byId.get(responseId(response))), response);
  const itemIds = [...plan.itemIds];
  const reservedIds = new Set(itemIds);
  const reservedStimuli = new Set(itemIds.map(id => stimulus(byId.get(id) || { id })));
  const history = buildLiteracyExposureIndex({ exposures });
  const candidates = usable(bank, mediaFailures).filter(item => !getLiteracyExposure(item, history).knownFamiliar);
  const failed = mediaFailureFilter(mediaFailures);
  const presentedIds = new Set(presentations.map(presentation => presentation.questionId));
  if (itemIds.every(id => byId.get(id).contentVersion === 'literacy-mock-v4')) {
    const editable = itemIds.flatMap((id, index) => index >= responses.length && !presentedIds.has(id) && !failed(byId.get(id)) ? [index] : []);
    const editableSet = new Set(editable);
    const frozen = itemIds.filter((_, index) => !editableSet.has(index)).map(id => byId.get(id));
    const frozenStimuli = new Set(frozen.map(stimulus));
    const frozenHistory = buildLiteracyExposureIndex({ exposures: [...exposures, ...frozen] });
    const available = candidates.filter(item => !frozenStimuli.has(stimulus(item)) && !getLiteracyExposure(item, frozenHistory).knownFamiliar);
    const slots = editable.map(index => {
      const original = byId.get(itemIds[index]);
      const previous = recent.get(literacyMockTaskKey(original));
      const level = previous ? previous.isCorrect ? 2 : 1 : resetUnsupported ? 1 : original.level;
      return { item: original, level, index, previous };
    });
    const options = slots.map(({ item: original, level, index, previous }) => {
      const shuffled = shuffleLiteracyMock(available.filter(item => sameLiteracyMockTask(item, original) && item.level === level),
        `${plan.seed}:${index}:${previous?.questionId || 'entry'}:${level}`);
      // Retain an already suitable item where possible. Joint allocation may
      // move an unoffered example so another task can use its only safe family.
      return [...shuffled.filter(item => item.id === original.id),
        ...shuffled.filter(item => item.id !== original.id && item.format === original.format),
        ...shuffled.filter(item => item.id !== original.id && item.format !== original.format)];
    });
    const pending = itemIds.flatMap((id, index) => index >= responses.length && !editableSet.has(index) ? [byId.get(id)] : []);
    const contingent = contingentLiteracyMockOptions(slots, pending, available, plan.seed);
    const allocated = allocateIndependentItems([...options, ...contingent.options],
      [...slots.map(slot => literacyMockTaskKey(slot.item)), ...contingent.keys]);
    if (allocated) {
      for (let offset = 0; offset < editable.length; offset += 1) itemIds[editable[offset]] = allocated[offset].id;
      return { itemIds, seed: plan.seed };
    }
    // If a complete desired suffix cannot be established, retain the existing
    // best-effort substitutions below rather than claim unavailable demand.
  }
  for (let index = responses.length; index < itemIds.length; index += 1) {
    const original = byId.get(itemIds[index]);
    // Media repair preserves a blocked slot's planned difficulty. The repair
    // helper owns its replacement; adaptation must not turn failure into evidence.
    if (failed(original) || presentedIds.has(original.id)) continue;
    const previous = recent.get(literacyMockTaskKey(original));
    if (!previous && !resetUnsupported) continue;
    const level = previous?.isCorrect ? 2 : 1;
    if (original.level === level) continue;
    const reserved = buildLiteracyExposureIndex({ exposures: itemIds.filter(id => id !== original.id).map(id => byId.get(id)) });
    const eligible = candidates.filter(item => sameLiteracyMockTask(item, original) && item.level === level
      && !reservedIds.has(item.id) && !reservedStimuli.has(stimulus(item)) && !getLiteracyExposure(item, reserved).knownFamiliar);
    const shuffled = shuffleLiteracyMock(eligible, `${plan.seed}:${index}:${previous?.questionId || 'entry'}:${level}`);
    const replacement = shuffled.find(item => item.format === original.format) || shuffled[0];
    if (!replacement) continue;
    reservedIds.delete(original.id); reservedStimuli.delete(stimulus(original));
    itemIds[index] = replacement.id; reservedIds.add(replacement.id); reservedStimuli.add(stimulus(replacement));
  }
  return { itemIds, seed: plan.seed };
}

/** Replace failed evidence without consuming a response or changing the skill blueprint. */
export function replaceFailedLiteracyMockMedia(bank, plan, responses = [], mediaFailures = [], presentations = [], { exposures = [] } = {}) {
  if(bank.some(q=>q.contentVersion==='literacy-mock-v9'))return repairLiteracyMockBoundaryPlan(bank,plan,responses,mediaFailures,presentations,{exposures});
  if(bank.some(q=>['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8'].includes(q.contentVersion)))return repairLiteracyMockAreaPlan(bank,plan,responses,mediaFailures,presentations,{exposures});
  const failed = mediaFailureFilter(mediaFailures);
  return replaceLiteracyMockSlots(bank, plan, responses, mediaFailures, presentations, { exposures, failed, reason: 'media' });
}

/** Withdraw a defective unanswered item without inventing an answer or media failure. */
export function replaceInvalidLiteracyMockContent(bank, plan, responses = [], mediaFailures = [], presentations = [], { exposures = [] } = {}) {
  if(bank.some(q=>q.contentVersion==='literacy-mock-v9'))return repairLiteracyMockBoundaryPlan(bank,plan,responses,mediaFailures,presentations,{exposures,content:true});
  if(bank.some(q=>['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8'].includes(q.contentVersion)))return repairLiteracyMockAreaPlan(bank,plan,responses,mediaFailures,presentations,{exposures,content:true});
  return replaceLiteracyMockSlots(bank, plan, responses, mediaFailures, presentations,
    { exposures, failed: item => !isLiteracyItemEligible(item), reason: 'content' });
}

function replaceLiteracyMockSlots(bank, plan, responses, mediaFailures, presentations, { exposures, failed, reason }) {
  const byId = validateHistory(bank, plan, responses);
  const affected = plan.itemIds.flatMap((id, index) => index >= responses.length && failed(byId.get(id)) ? [index] : []);
  if (!affected.length) return { plan, unavailable: false };
  const affectedSet = new Set(affected);
  const kept = plan.itemIds.filter((_, index) => !affectedSet.has(index)).map(id => byId.get(id));
  const reservedIds = new Set(kept.map(item => item.id));
  const reservedStimuli = new Set(kept.map(stimulus));
  const history = buildLiteracyExposureIndex({ exposures: [...exposures, ...kept, ...presentations.filter(value => !failed(byId.get(value.questionId) || {}))] });
  const candidates = usable(bank, mediaFailures).filter(item => !reservedIds.has(item.id) && !reservedStimuli.has(stimulus(item))
    && !getLiteracyExposure(item, history).knownFamiliar);
  const options = new Map(affected.map(index => {
    const original = byId.get(plan.itemIds[index]);
    const pool = candidates.filter(item => sameLiteracyMockTask(item, original, { includeLevel: true }));
    const shuffled = shuffleLiteracyMock(pool, `${plan.seed}:${index}:${reason}:${original.id}`);
    const ordered = [...shuffled.filter(item => item.format === original.format), ...shuffled.filter(item => item.format !== original.format)];
    // Keep crossing passage/family alternatives; deduplicating by only one
    // identity can discard the sole complete allocation.
    return [index, ordered];
  }));
  if (affected.some(index => !options.get(index).length)) return { plan, unavailable: true };
  const actualOptions = affected.map(index => options.get(index));
  const actualKeys = affected.map(index => literacyMockTaskKey(byId.get(plan.itemIds[index]), { includeLevel: true }));
  let contingent = { options: [], keys: [] };
  if (plan.itemIds.every(id => byId.get(id).contentVersion === 'literacy-mock-v4')) {
    const shown = new Set(presentations.map(presentation => presentation.questionId));
    const remaining = plan.itemIds.flatMap((id, index) => index >= responses.length ? [{ item: byId.get(id), level: byId.get(id).level, index }] : []);
    const editable = remaining.filter(slot => affectedSet.has(slot.index) || !shown.has(slot.item.id));
    const pending = remaining.filter(slot => !affectedSet.has(slot.index) && shown.has(slot.item.id)).map(slot => slot.item);
    contingent = contingentLiteracyMockOptions(editable, pending, candidates, `${plan.seed}:${reason}`);
  }
  const allocation = allocateIndependentItems([...actualOptions, ...contingent.options], [...actualKeys, ...contingent.keys]);
  const replacements = allocation?.slice(0, affected.length);
  if (!replacements) return { plan, unavailable: true };
  const replacementsBySlot = new Map(affected.map((slot, index) => [slot, replacements[index].id]));
  return { plan: { itemIds: plan.itemIds.map((id, index) => replacementsBySlot.get(index) || id), seed: plan.seed }, unavailable: false };
}
