import { localStudentPreferenceStorageKey } from "./progressKeys.js";
import { isProgressWriteBlocked } from "./progressSync.js";
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';

// Shared by routing and descriptive reports. Familiarity is an observation,
// never a score; absence from this device's history does not prove freshness.
const text = value => typeof value === "string" ? value.trim() : "";
const normalized = value => text(value).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
export const hasLiteracySupport = response => response?.assistance === 'answer' || response?.assistanceType === 'answer' || response?.supportUsed === true
  || (Array.isArray(response?.supportUsed) && response.supportUsed.length > 0)
  || response?.evidenceType === "supported" || response?.responseStatus === "supported";
export const isKnownLiteracyFamiliar = response => response?.knownFamiliar === true
  || response?.priorPracticeExposure === true || response?.knownPracticeFamiliarity === true
  || response?.priorItemExposure === true || response?.priorPassageExposure === true || response?.priorFamilyExposure === true
  || response?.repeated === true || ["known_familiar", "familiar", "previously_practiced"].includes(response?.familiarity);

export function isEligibleLiteracyResponse(response) {
  return isValidUnsupportedLiteracyResponse(response) && !isKnownLiteracyFamiliar(response);
}

export function isValidUnsupportedLiteracyResponse(response) {
  if (!response || typeof response.isCorrect !== "boolean" || hasLiteracySupport(response)) return false;
  if (!isLiteracyItemEligible(response)) return false;
  if (response.conflicted || response.validity === "invalid" || response.mediaReady === false || response.helpPending === true || response.supportResolutionPending === true || response.supportPending === true) return false;
  if (response.responseStatus && response.responseStatus !== "answered") return false;
  if (response.presentationRole && response.presentationRole !== "first_probe") return false;
  if (response.audioRequired === true && typeof response.audioDelivery === "string" && response.audioDelivery !== "delivered") return false;
  if (response.audioRequired === true && !(response.targetDelivered === true || response.audioDelivery === "delivered" || response.targetDelivery === "completed")) return false;
  return response.evidenceType === "independent" || response.evidenceUse === "independent_practice_response";
}

// These exact immutable item families can also arrive as compact historical
// exposure records, without a snapshot. Never infer letters from arbitrary IDs.
const legacyPrintLetter = id => text(id).match(/^literacy\.letter_knowledge\.(?:name|case)-([a-z])$/)?.[1]
  || text(id).match(/^mock\.capacity\.foundation\.letter-case\.l[12]\.([a-z])$/)?.[1] || null;
const singleLetter = value => /^[a-z]$/i.test(text(value)) ? text(value).toLowerCase() : null;

/** The semantic English-letter target of a single print name/case probe. */
export function literacyPrintLetterTarget(value = {}) {
  const snapshot = value.itemSnapshot || value.questionSnapshot || value;
  const ids = [value.exposureItemId, snapshot.canonicalItemId, snapshot.sourceItemId, value.questionId, snapshot.id,
    text(value.exposureFamilyId || snapshot.exposureFamilyId).replace(/^source-item:/, '')];
  const legacy = ids.map(legacyPrintLetter).find(Boolean);
  if (legacy) return legacy;
  if ((value.domainId || snapshot.domainId) !== 'print' || (value.skillId || snapshot.skillId) !== 'letter_knowledge'
    || !['letter_name', 'letter_case', 'letter_case_correspondence'].includes(snapshot.constructClaim || value.constructClaim)) return null;
  const targets = snapshot.matchTargets || [];
  if (targets.length > 1 || Number(snapshot.responseLength) > 1 || Number(snapshot.sequenceLength) > 1) return null;
  const explicit = [snapshot.targetWord, snapshot.passage, targets[0]?.label].map(singleLetter).find(Boolean);
  if (explicit) return explicit;
  for (const key of [snapshot.exposureFamilyId, snapshot.canonicalPassageId, snapshot.stimulusKey]) {
    const letter = text(key).match(/^letter-case:([a-z])$/)?.[1];
    if (letter) return letter;
  }
  return null;
}

/** Only explicit lexical families and single-word sound anchors describe a
 * shared encountered word. Context passages, answer labels and arbitrary IDs
 * cannot supply this alias. */
export function literacyLexicalWordTarget(value = {}) {
  const snapshot = value.itemSnapshot || value.questionSnapshot || value;
  const family = normalized(value.exposureFamilyId || snapshot.exposureFamilyId || snapshot.itemFamilyId);
  const trusted = family.match(/^(?:hfw-word|v6-phonics-team|mock-foundation-word|v4-context-word-senses|v8-context-word-senses):([a-z]+)$/)?.[1];
  if (trusted) return trusted;
  if ((value.domainId || snapshot.domainId) !== 'sound_awareness' || text(snapshot.passage)
    || !['initial_sound_discrimination', 'initial_sound_grapheme_mapping',
      'spoken_medial_vowel_discrimination', 'spoken_rhyme_discrimination'].includes(snapshot.constructClaim || value.constructClaim)) return null;
  const word = normalized(snapshot.targetWord);
  return /^[a-z]+$/.test(word) ? word : null;
}

export function canonicalLiteracyIdentity(value = {}) {
  const snapshot = value.itemSnapshot || value.questionSnapshot || value;
  const printLetter = literacyPrintLetterTarget(value);
  const lexicalWord = printLetter ? null : literacyLexicalWordTarget(value);
  return {
    itemId: text(value.exposureItemId || snapshot.canonicalItemId || snapshot.sourceItemId || value.questionId || snapshot.id),
    passageKey: normalized(value.exposurePassageKey || snapshot.canonicalPassageId || snapshot.passage || snapshot.stimulusKey),
    familyId: printLetter ? `letter-case:${printLetter}` : lexicalWord ? `mock-foundation-word:${lexicalWord}`
      : text(value.exposureFamilyId || snapshot.exposureFamilyId || snapshot.itemFamilyId)
  };
}

// Frozen triples can also survive as compact identity-only local records.
// Their published targets never change; do not infer letters from arbitrary ids.
const LEGACY_CASE_TRIPLES = Object.freeze({
  'mock.letters.round': 'amt', 'mock.letters.lines': 'efl', 'mock.letters.curves': 'cos',
  'mock.letters.upright': 'hin', 'mock.letters.similar': 'bdp',
  'mock.letters.tails': 'gjq', 'mock.letters.angles': 'nvw',
});

// These immutable published category items can survive as identity-only local
// records. Their actual lexical targets are known; arbitrary response-evidence
// strings, foil words and sentence-context answers must never be decoded here.
const LEGACY_VOWEL_CATEGORY_WORDS = Object.freeze({
  'lp3.cvc_short_vowels.l1.B.short_a.v5': 'cat',
  'lp3.cvc_short_vowels.l1.C.short_a.v6': 'pan',
  'lp3.cvc_short_vowels.l1.B.short_e.v5': 'bed',
  'lp3.cvc_short_vowels.l1.C.short_e.v6': 'ten',
  'lp3.cvc_short_vowels.l1.B.short_i.v5': 'pin',
  'lp3.cvc_short_vowels.l1.C.short_i.v6': 'big',
  'lp3.cvc_short_vowels.l1.B.short_o.v5': 'dog',
  'lp3.cvc_short_vowels.l1.C.short_o.v6': 'pot',
  'lp3.cvc_short_vowels.l1.B.short_u.v5': 'bug',
  'lp3.cvc_short_vowels.l1.C.short_u.v6': 'mud',
  'lp3.cvc_short_vowels.l1.A.short_a.v10': 'ram',
  'lp3.cvc_short_vowels.l1.A.short_e.v10': 'hen',
  'lp3.cvc_short_vowels.l1.A.short_i.v10': 'sit',
  'lp3.cvc_short_vowels.l1.A.short_o.v10': 'cot',
  'lp3.cvc_short_vowels.l1.A.short_u.v10': 'hut',
  'lp3.long_vowels_silent_e.l2.A.a_e.v1': 'gate',
  'lp3.long_vowels_silent_e.l2.B.a_e.v2': 'cane',
  'lp3.long_vowels_silent_e.l2.A.i_e.v1': 'slide',
  'lp3.long_vowels_silent_e.l2.B.i_e.v2': 'shine',
  'lp3.long_vowels_silent_e.l2.A.o_e.v1': 'home',
  'lp3.long_vowels_silent_e.l2.B.o_e.v2': 'stone',
  'lp3.long_vowels_silent_e.l2.A.u_e.v1': 'cube',
  'lp3.long_vowels_silent_e.l2.B.u_e.v2': 'mule',
  'lp3.vowel_teams.l1.C.ai.v3': 'rain',
  'lp3.vowel_teams.l1.A.ai.v4': 'chain',
  'lp3.vowel_teams.l1.C.ay.v3': 'play',
  'lp3.vowel_teams.l1.A.ay.v4': 'day',
  'lp3.vowel_teams.l1.C.ee.v3': 'feet',
  'lp3.vowel_teams.l1.A.ee.v4': 'tree',
  'lp3.vowel_teams.l1.C.ea.v3': 'leaf',
  'lp3.vowel_teams.l1.A.ea.v4': 'bread',
  'lp3.vowel_teams.l1.B.ea.v5': 'dead',
  'lp3.vowel_teams.l1.C.oa.v3': 'goat',
  'lp3.vowel_teams.l1.A.oa.v4': 'road',
  'lp3.vowel_teams.l1.C.igh.v3': 'night',
  'lp3.vowel_teams.l1.A.igh.v4': 'light',
});

export function literacyExposureIdentities(value = {}) {
  const identity = canonicalLiteracyIdentity(value);
  const snapshot = value.itemSnapshot || value.questionSnapshot || value;
  const targets = Array.isArray(snapshot.matchTargets) ? snapshot.matchTargets : [];
  const choices = Array.isArray(snapshot.choices) ? snapshot.choices : [];
  const legacy = LEGACY_CASE_TRIPLES[identity.itemId] || '';
  const multiTargetCase = snapshot.constructClaim === 'letter_case_correspondence' && snapshot.format === 'match'
    && (targets.length > 1 || /^([2-9]|[1-9][0-9]+)$/.test(String(snapshot.responseLength))
      || /^([2-9]|[1-9][0-9]+)$/.test(String(snapshot.sequenceLength)));
  const identities = [identity];
  const publishedFamily = text(value.exposureFamilyId || snapshot.exposureFamilyId || snapshot.itemFamilyId);
  if (publishedFamily && publishedFamily !== identity.familyId) identities.push({ ...identity, familyId: publishedFamily });
  if (legacy || multiTargetCase) {
    const letters = new Set([...legacy, ...[...targets, ...choices]
      .map(choice => text(typeof choice === 'string' ? choice : choice?.label))
      .filter(label => /^[a-z]$/i.test(label)).map(label => label.toLowerCase())]);
    identities.push(...[...letters].map(letter => ({ itemId: '', passageKey: `letter-case:${letter}`, familyId: `letter-case:${letter}` })));
  }
  if (!text(snapshot.passage) && !text(snapshot.targetWord)) {
    const explicitCategory = ['cvc_short_vowels', 'vowel_teams', 'long_vowels'].includes(snapshot.skillId)
      && snapshot.format === 'choice'
      && /^identify_read_(?:short_vowel|vowel|split_vowel)_sound:/.test(snapshot.constructClaim || '');
    const word = LEGACY_VOWEL_CATEGORY_WORDS[identity.itemId]
      || (explicitCategory ? normalized(choices.find(choice => choice?.id === snapshot.answer)?.label) : '');
    if (/^[a-z]+$/.test(word) && identity.passageKey !== word) {
      identities.push({ itemId: '', passageKey: word, familyId: `mock-foundation-word:${word}` });
    }
  }
  // These published sound-category probes expose both the heard anchor and
  // the keyed printed word. Keep both identities when a later form changes
  // the operation to whole-word decoding.
  if (!text(snapshot.passage) && snapshot.skillId === 'r_controlled' && snapshot.format === 'choice'
    && /^match_read_r_controlled_sound:/.test(snapshot.constructClaim || '')) {
    const word = normalized(choices.find(choice => choice?.id === snapshot.answer)?.label);
    if (/^[a-z]+$/.test(word) && identity.passageKey !== word) {
      identities.push({ itemId: '', passageKey: word, familyId: `mock-foundation-word:${word}` });
    }
  }
  return identities;
}

export function buildLiteracyExposureIndex({ practiceRecord, mockRuns = [], responses = [], exposures = [] } = {}) {
  const index = { items: new Set(), passages: new Set(), families: new Set() };
  const recorded = [...exposures, ...responses, ...mockRuns.flatMap(run => [...(run?.responses || []), ...(run?.mediaFailures || []), ...(run?.presentations || [])]),
    ...(practiceRecord?.completions || []).flatMap(event => event.steps || [])];
  for (const identity of recorded.flatMap(literacyExposureIdentities)) {
    if (identity.itemId) index.items.add(identity.itemId);
    if (identity.passageKey) index.passages.add(identity.passageKey);
    if (identity.familyId) index.families.add(identity.familyId);
  }
  return index;
}

export function getLiteracyExposure(item, index) {
  const identity = canonicalLiteracyIdentity(item);
  const priorItemExposure = Boolean(identity.itemId && index?.items?.has(identity.itemId));
  const priorPassageExposure = Boolean(identity.passageKey && index?.passages?.has(identity.passageKey));
  const priorFamilyExposure = Boolean(identity.familyId && index?.families?.has(identity.familyId));
  const familiarityReasons = [priorItemExposure && "item", priorPassageExposure && "passage", priorFamilyExposure && "family"].filter(Boolean);
  return { knownFamiliar: familiarityReasons.length ? true : null, familiarityReasons,
    priorItemExposure, priorPassageExposure, priorFamilyExposure,
    exposureItemId: identity.itemId, exposurePassageKey: identity.passageKey, exposureFamilyId: identity.familyId };
}

const localKey = studentId => localStudentPreferenceStorageKey("literacy_exposure", studentId);
export function readLiteracyExposures(studentId, storage = globalThis.localStorage) {
  if (!studentId) return [];
  try { const value = JSON.parse(storage?.getItem(localKey(studentId)) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function recordLiteracyExposures(studentId, values, storage = globalThis.localStorage) {
  if (!studentId || isProgressWriteBlocked(studentId, "literacy_exposure")) return;
  const identities = new Map(readLiteracyExposures(studentId, storage).map(value => [JSON.stringify(canonicalLiteracyIdentity(value)), value]));
  for (const id of (values || []).flatMap(literacyExposureIdentities)) {
    if (!id.itemId && !id.passageKey && !id.familyId) continue;
    identities.set(JSON.stringify(id), { exposureItemId: id.itemId, exposurePassageKey: id.passageKey, exposureFamilyId: id.familyId });
  }
  try { storage?.setItem(localKey(studentId), JSON.stringify([...identities.values()])); } catch { /* Remote snapshots still preserve confirmed exposure; local history may be incomplete. */ }
}

function choiceNarrationCondition(snapshot, response) {
  // Saved requirements describe the administration; only exact playback
  // receipts establish delivery. A replay button alone is not proof of use.
  const required = (snapshot.requiredAudioCues || []).filter(cue => cue.role === 'choice');
  const requiredPaths = new Set(snapshot.requiredAudioPaths || []);
  const declaredPaths = new Set(required.map(cue => cue.path).filter(Boolean));
  const optional = [];
  for (const choice of snapshot.choices || []) {
    if (!choice.audioPath || declaredPaths.has(choice.audioPath)) continue;
    declaredPaths.add(choice.audioPath);
    (requiredPaths.has(choice.audioPath) ? required : optional).push({ path: choice.audioPath });
  }
  const delivery = response.audioDelivery && typeof response.audioDelivery === 'object' && !Array.isArray(response.audioDelivery)
    ? response.audioDelivery : {};
  const complete = cue => Boolean(cue.path) && delivery[cue.path] === 'completed';
  const failed = cue => Boolean(cue.path) && delivery[cue.path] === 'failed';
  if (required.length) {
    if (required.every(complete)) return 'Required choice narration completed';
    if (required.some(failed)) return 'Choice narration required; playback failure recorded';
    if (required.some(complete)) return 'Choice narration required; only some playback completed';
    return 'Choice narration required; playback not recorded';
  }
  if (optional.length) {
    if (optional.every(complete)) return 'Optional choice narration completed';
    if (optional.some(complete)) return 'Some choices read aloud (optional)';
    if (optional.some(failed)) return 'Optional choice playback failed';
    return 'Choice audio available; use not recorded';
  }
  return '';
}

export function literacyEvidenceConditions(response = {}) {
  const snapshot = response.itemSnapshot || response.questionSnapshot || response;
  const access = snapshot.passageAccess || response.passageAccess;
  const mode = snapshot.modality || snapshot.literacyModality || snapshot.evidenceModality;
  const audio = mode === "listening" || mode === "audio" || access === "audio_only";
  const textAndAudio = access === "text_and_audio" || snapshot.evidenceModality === 'audio+text' || snapshot.oralLanguageAccess === true || snapshot.passageAudioUsed === true
    || (Boolean(snapshot.passage) && snapshot.displayPassageDuringResponse === true && audio);
  const modality = textAndAudio ? "Text and audio" : audio ? "Audio" : snapshot.passage ? "Printed text" : mode || "Access mode not recorded";
  const choiceNarration = choiceNarrationCondition(snapshot, response);
  return {
    construct: snapshot.constructClaim || response.constructClaim || response.skillId || "Construct not recorded",
    modality: choiceNarration ? `${modality} · ${choiceNarration}` : modality,
    support: hasLiteracySupport(response) ? "Answer assistance recorded" : response.helpPending || response.supportResolutionPending || response.supportPending ? "Help request awaiting teacher review" : response.assistance === 'access' || response.assistanceType === 'access' ? "Access assistance only" : "No answer assistance recorded",
    administration: response.administration || snapshot.administration || "Administration not recorded"
  };
}
