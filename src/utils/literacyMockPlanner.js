import { isEligibleLiteracyResponse } from "./literacyEvidence.js";
const DOMAIN_IDS = ['sound_awareness', 'phonics', 'vocabulary', 'listening', 'reading', 'language', 'print', 'writing'];
const FORMAT_PRIORITY = ['multi_select', 'build_word', 'match', 'select_text', 'order', 'choice'];
const DOMAIN_FORMAT = { sound_awareness: 'multi_select', phonics: 'build_word', vocabulary: 'match', print: 'select_text', writing: 'order' };
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

/** Teacher-session blueprint stays shared; each learner receives fresh, seeded examples. */
export function selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount = 24, seed } = {}) {
  if (!sessionId || !studentId || ![24, 43].includes(itemCount)) throw new Error('Mock plans need a session, learner, and 24 or 43 questions.');
  const candidates = usable(bank);
  const planSeed = seed || `${sessionId}:${studentId}`;
  const blueprintSeed = `${sessionId}:${itemCount}:blueprint`;
  const domains = shuffleLiteracyMock(DOMAIN_IDS, blueprintSeed);
  const skillCount = Math.ceil(itemCount / 2);
  const blueprint = [];
  const selectedSkills = new Set();
  const coveredFormats = new Set();
  for (let index = 0; index < skillCount; index += 1) {
    const domainId = domains[index % domains.length];
    const availableSkills = [...new Set(candidates.filter(item => item.domainId === domainId && item.level === 1).map(item => item.skillId))];
    const shuffled = shuffleLiteracyMock(availableSkills.sort(), `${blueprintSeed}:${domainId}:${index}`);
    const eligible = shuffled.filter(skillId => !selectedSkills.has(skillId)
      && new Set(candidates.filter(item => item.skillId === skillId && item.level === 1).map(stimulus)).size >= 2);
    // Print has two skills. A long form can revisit one with additional fresh stimuli.
    const choices = eligible.length ? eligible : shuffled;
    if (!choices.length) throw new Error(`No mock questions cover ${domainId}.`);
    const preferredFormat = !coveredFormats.has(DOMAIN_FORMAT[domainId]) ? DOMAIN_FORMAT[domainId] : null;
    const priority = skillId => {
      const formats = new Set(candidates.filter(item => item.skillId === skillId && item.level === 1).map(item => item.format));
      if (preferredFormat && formats.has(preferredFormat)) return -2;
      return FORMAT_PRIORITY.findIndex(format => !coveredFormats.has(format) && formats.has(format));
    };
    choices.sort((a, b) => {
      const pa = priority(a); const pb = priority(b);
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    });
    const skillId = choices[0];
    const formats = candidates.filter(item => item.skillId === skillId && item.level === 1).map(item => item.format);
    const format = preferredFormat && formats.includes(preferredFormat) ? preferredFormat
      : FORMAT_PRIORITY.find(value => !coveredFormats.has(value) && formats.includes(value)) || 'choice';
    coveredFormats.add(format);
    selectedSkills.add(skillId);
    blueprint.push({ skillId, domainId, format });
  }
  // First sample every planned skill; then revisit them. The first eight cover
  // all domains even if a classroom window ends before the whole form is done.
  const slots = [...blueprint, ...blueprint].slice(0, itemCount);
  const chosen = [];
  const usedIds = new Set();
  const usedStimuli = new Set();
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const pool = candidates.filter(item => item.skillId === slot.skillId && item.domainId === slot.domainId && item.level === 1
      && !usedIds.has(item.id) && !usedStimuli.has(stimulus(item)));
    const ordered = shuffleLiteracyMock(pool, `${planSeed}:${index}:${slot.skillId}`);
    const item = ordered.find(candidate => candidate.format === slot.format) || ordered[0];
    if (!item) throw new Error(`Not enough fresh mock questions for ${slot.skillId}.`);
    chosen.push(item.id); usedIds.add(item.id); usedStimuli.add(stimulus(item));
  }
  return { itemIds: chosen, seed: planSeed };
}

/** Change only unanswered slots using independent evidence in that same skill. */
export function adaptLiteracyMockPlan(bank, plan, responses = [], mediaFailures = []) {
  const byId = validateHistory(bank, plan, responses);
  const recent = new Map();
  for (const response of responses) if (isEligibleLiteracyResponse(response)) recent.set(response.skillId, response);
  const itemIds = [...plan.itemIds];
  const reservedIds = new Set(itemIds);
  const reservedStimuli = new Set(itemIds.map(id => stimulus(byId.get(id) || { id })));
  const candidates = usable(bank, mediaFailures);
  const failed = mediaFailureFilter(mediaFailures);
  for (let index = responses.length; index < itemIds.length; index += 1) {
    const original = byId.get(itemIds[index]);
    // Media repair preserves a blocked slot's planned difficulty. The repair
    // helper owns its replacement; adaptation must not turn failure into evidence.
    if (failed(original)) continue;
    const previous = recent.get(original.skillId);
    if (!previous) continue;
    const level = previous.isCorrect ? 2 : 1;
    if (original.level === level) continue;
    const eligible = candidates.filter(item => item.skillId === original.skillId && item.domainId === original.domainId && item.level === level
      && !reservedIds.has(item.id) && !reservedStimuli.has(stimulus(item)));
    const shuffled = shuffleLiteracyMock(eligible, `${plan.seed}:${index}:${previous.questionId}:${level}`);
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
    const pool = candidates.filter(item => item.skillId === original.skillId && item.domainId === original.domainId && item.level === original.level);
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
