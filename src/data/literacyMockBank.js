import { loadLiteracyPracticeBank, literacyPracticeAudioCues, LITERACY_PRACTICE_SKILLS } from './literacyPracticeBank.js';
import { loadLiteracyMockItems } from './literacyMockItems.js';
export { LITERACY_MOCK_TUTORIAL_IDS } from './literacyMockItems.js';

export const LITERACY_MOCK_VERSION = 'literacy-mock-v1';
export const LITERACY_MOCK_SKILLS = LITERACY_PRACTICE_SKILLS;
export const LITERACY_MOCK_MAP_DOMAINS = Object.freeze({
  sound_awareness: 'foundations', phonics: 'foundations', print: 'foundations',
  language: 'language_writing', writing: 'language_writing',
  listening: 'comprehension', reading: 'comprehension', vocabulary: 'vocabulary',
});
const FORMATS = new Set(['choice', 'multi_select', 'order', 'match', 'select_text', 'build_word']);
const BUILD_FORMATS = new Set(['HFW_LETTER_BUILD', 'HFW_SENTENCE_SPELL_CONTEXT', 'PUT_SOUNDS_IN_ORDER']);
const stringValue = value => String(typeof value === 'object' && value !== null
  ? value.value ?? value.label ?? value.text ?? value.word ?? '' : value ?? '');
const imagePath = value => value?.image || value?.imagePath || value?.imageUrl || value?.targetImagePath || '';
const clone = value => JSON.parse(JSON.stringify(value));

export function literacyMockStimulusKey(item) {
  if (item.stimulusKey) return item.stimulusKey;
  const evidence = item.passage || item.sentence || item.oralStimulus || item.targetWord
    || item.audioText || item.phonemeSequence?.join(' ') || item.prompt;
  return String(evidence || item.id).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Preserve the authored response rather than treating a one-answer tile bank as a choice. */
export function normalizeLiteracyMockItem(source) {
  const isNormalized = FORMATS.has(source.format);
  const domainId = source.domainId || source.literacyDomainId;
  const format = isNormalized ? source.format : BUILD_FORMATS.has(source.formatType) ? 'build_word' : 'choice';
  const answerMode = source.answerMode || (['order', 'match'].includes(format) ? 'sequence' : format === 'multi_select' ? 'set' : 'exact');
  const rawChoices = format === 'build_word' && !isNormalized
    ? source.letterTiles || source.letterBank || source.soundTiles || [] : source.choices || [];
  const sourceCues = source.requiredAudioCues || literacyPracticeAudioCues(source);
  const independentReading = source.literacyModality === 'reading' || source.modality === 'reading';
  const requiredAudioCues = sourceCues.filter(cue => (!independentReading || cue.role === 'instruction')
    && !(format === 'build_word' && cue.role === 'choice')).map(cue => ({ ...cue }));
  const choices = rawChoices.map((value, index) => {
    const label = stringValue(value);
    const authored = (source.answerOptions || []).find(option => stringValue(option) === label)
      || (source.imageCards || []).find(option => stringValue(option) === label) || {};
    const cue = requiredAudioCues.find(candidate => candidate.role === 'choice' && (candidate.value ?? candidate.text) === label);
    const image = imagePath(value) || imagePath(authored);
    return {
      id: isNormalized && value?.id ? value.id : `c${index}`, label,
      ...(image ? { image, imageAlt: value?.imageAlt || authored.imageAlt || authored.alt || label } : {}),
      ...(cue?.path ? { audioPath: cue.path } : {}),
      ...(value?.tokenIndex !== undefined ? { tokenIndex: value.tokenIndex } : {}),
    };
  });
  for (const cue of requiredAudioCues) {
    if (cue.role === 'choice' && !cue.choiceId) cue.choiceId = choices.find(choice => choice.label === (cue.value ?? cue.text))?.id;
  }
  let answer = source.answer ?? source.correctAnswer;
  if (!isNormalized && format !== 'build_word') {
    const choice = choices.find(candidate => candidate.label === stringValue(answer));
    if (!choice) throw new Error(`Mock item ${source.id} has no literal answer choice.`);
    answer = choice.id;
  }
  const passage = source.passage || source.sentence || '';
  const item = {
    id: source.id, contentVersion: LITERACY_MOCK_VERSION, skillId: source.skillId,
    domainId, mapDomainId: LITERACY_MOCK_MAP_DOMAINS[domainId], level: Number(source.level),
    format, answerMode, prompt: source.prompt, passage, choices, answer,
    // The target is audit/audio data. renderTargetText alone authorizes printing it.
    targetWord: source.targetWord || source.audioText || '', renderTargetText: false,
    image: imagePath(source), imageAlt: source.imageAlt || source.targetWord || '',
    modality: source.modality || source.literacyModality || 'recognition',
    displayPassageDuringResponse: source.displayPassageDuringResponse !== false,
    hideWrittenLabels: Boolean(source.hideWrittenLabels),
    tutorialOnly: Boolean(source.tutorialOnly),
    requiredAudioCues, requiredAudioPaths: [...new Set(requiredAudioCues.map(cue => cue.path).filter(Boolean))],
    stimulusKey: literacyMockStimulusKey(source),
    constructClaim: source.constructClaim || source.itemKey || source.skillId,
    sourceItemId: source.sourceItemId || source.id,
    sourceFormat: source.formatType || format,
    sourceProvenance: clone(source.sourceProvenance || source.provenance || { kind: 'approved_public_practice', sourceId: source.id }),
    ...(source.mediaDecision || source.assessmentMediaDecision ? { mediaDecision: clone(source.mediaDecision || source.assessmentMediaDecision) } : {}),
    ...(source.matchTargets ? { matchTargets: clone(source.matchTargets) } : {}),
    ...(source.selectCount ? { selectCount: source.selectCount } : {}),
    ...(source.sequenceLength ? { sequenceLength: source.sequenceLength } : {}),
    ...(source.distractorRationales ? { distractorRationales: clone(source.distractorRationales) } : {}),
    ...(source.explanation ? { explanation: source.explanation } : {}),
  };
  item.requiredImagePaths = [...new Set([item.image, ...choices.map(choice => choice.image),
    ...(item.matchTargets || []).map(target => target.image)].filter(Boolean))];
  item.mediaReady = requiredAudioCues.length > 0 && requiredAudioCues.every(cue => Boolean(cue.path));
  if (!item.id || !item.mapDomainId || ![1, 2].includes(item.level) || !item.prompt || choices.length < 2) {
    throw new Error(`Mock item ${source.id} is incomplete.`);
  }
  item.itemSnapshot = clone(item);
  delete item.itemSnapshot.itemSnapshot;
  return item;
}

let pending;
export async function loadLiteracyMockBank({ includeUnavailable = false } = {}) {
  if (!pending) pending = (async () => {
    const { LITERACY_MOCK_V1_COMPREHENSION } = await import('./generated/literacyMockV1Comprehension.generated.js');
    const published = new Map(LITERACY_MOCK_V1_COMPREHENSION.map(item => [item.id, item]));
    const sources = [...await loadLiteracyPracticeBank({ includeReference: false }), ...await loadLiteracyMockItems()];
    const bank = sources.filter(item => !item.retentionOnly && item.active !== false).map(source => {
      const snapshot = published.get(source.id);
      return snapshot ? { ...clone(snapshot), itemSnapshot: clone(snapshot) } : normalizeLiteracyMockItem(source);
    });
    if (new Set(bank.map(item => item.id)).size !== bank.length) throw new Error('Mock question IDs must be unique.');
    return bank;
  })().catch(error => { pending = null; throw error; });
  const bank = await pending;
  return includeUnavailable ? bank : bank.filter(item => item.mediaReady);
}

/** Only used for local previews/tests. Hosted sessions derive correctness on the server. */
export function scoreLiteracyMockResponse(item, selected) {
  if (item.answerMode === 'set') return Array.isArray(selected)
    && new Set(selected).size === selected.length
    && [...selected].sort().join('\u0000') === [...item.answer].sort().join('\u0000');
  if (item.answerMode === 'sequence') return Array.isArray(selected)
    && JSON.stringify(selected) === JSON.stringify(item.answer);
  return typeof selected === 'string' && selected === item.answer;
}
