import { loadLiteracyPracticeBank, literacyPracticeAudioCues, LITERACY_PRACTICE_SKILLS } from './literacyPracticeBank.js';
import { loadLiteracyMockItems } from './literacyMockItems.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { buildLiteracyMockDepthItems } from './literacyMockDepthItems.js';
import { buildLiteracyMockComprehensionDepthItems } from './literacyMockComprehensionDepth.js';
import { literacyMockTaskCeiling } from './literacyMockTaskCeilings.js';
import { buildLiteracyMockPhonicsDepthItems, correctLiteracyMockPhonicsDemand } from './literacyMockPhonicsDepth.js';
import { buildLiteracyMockComprehensionCapacityItems } from './literacyMockComprehensionCapacity.js';
import { buildLiteracyMockWritingCapacityItems } from './literacyMockWritingCapacity.js';
import { buildLiteracyMockLanguageCapacityItems } from './literacyMockLanguageCapacity.js';
import { buildLiteracyMockPrintCapacityItems } from './literacyMockPrintCapacity.js';
import { buildLiteracyMockFoundationCapacityItems, correctLiteracyMockFoundationDemand, literacyMockFoundationFinitePolicy } from './literacyMockFoundationCapacity.js';
import { correctLiteracyMockWritingDemand } from './literacyMockWritingDemand.js';
import { buildLiteracyMockV4 } from './literacyMockV4.js';
import { buildLiteracyMockV5 } from './literacyMockV5.js';
import { buildLiteracyMockV6 } from './literacyMockV6.js';
import { buildLiteracyMockV7 } from './literacyMockV7.js';
import { buildLiteracyMockV8 } from './literacyMockV8.js';
import { buildLiteracyMockV9 } from './literacyMockV9.js';
import { buildLiteracyMockV10 } from './literacyMockV10.js';
import { LITERACY_MOCK_FOUNDATION_SKILLS } from '../policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_VERSION, LITERACY_MOCK_VERSIONS } from '../policy/literacyMockVersions.js';
export { LITERACY_MOCK_TUTORIAL_IDS, literacyMockTutorialIdsForVersion, scoreLiteracyMockResponse } from './literacyMockRuntimeContract.js';
export { LITERACY_MOCK_VERSION, LITERACY_MOCK_VERSIONS } from '../policy/literacyMockVersions.js';
export const LITERACY_MOCK_SKILLS = Object.freeze([...LITERACY_PRACTICE_SKILLS,...LITERACY_MOCK_FOUNDATION_SKILLS]);
export const literacyMockSkillsForVersion = version => ['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8','literacy-mock-v9','literacy-mock-v10'].includes(version) ? LITERACY_MOCK_SKILLS : LITERACY_PRACTICE_SKILLS;
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
// Explicit authoring corrections: these printed strings direct the child;
// the response text, rather than the repeated direction, is the evidence.
const INSTRUCTION_PASSAGE_IDS = new Set([
  'literacy.writing_revision.complete-thought', 'literacy.writing_revision.complete-weather',
  'literacy.print_concepts.one-word', 'literacy.print_concepts.letters-words', 'literacy.print_concepts.joined-word',
]);
const DEAR_NAME_SALUTATION_IDS = new Set(['literacy.punctuation.greeting-comma', 'literacy.punctuation.greeting-letter']);
const COMPREHENSION_LABEL_CORRECTIONS = Object.freeze({
  'lp3.inference.l1.C.where_am_i.v3': ['a library', 'a lending library'],
  'lp3.inference.l1.A.where_am_i.v4': ['a stable', 'a horse stable'],
});

function correctLiteracyMockComprehensionLabels(source) {
  const correction = COMPREHENSION_LABEL_CORRECTIONS[source.id.replace(/^listen:/, '')];
  if (!correction) return source;
  const [previous, label] = correction;
  // These precise, passage-supported names remove an inherited shortest-key
  // shortcut. Reading and listening retain the same answer and scene evidence.
  const replace = value => value === previous ? label : value;
  return { ...source,
    choices: source.choices.map(choice => typeof choice === 'string' ? replace(choice)
      : { ...choice, label: replace(choice.label) }),
    answer: replace(source.answer), correctAnswer: replace(source.correctAnswer),
    requiredAudioCues: (source.requiredAudioCues || literacyPracticeAudioCues(source)).map(cue =>
      cue.role === 'choice' && cue.text === previous ? { ...cue, text: label, value: label,
        path: getLedaWordAudioPath(label) || getLedaInstructionAudioPath(label) } : cue),
  };
}

export function literacyMockStimulusKey(item) {
  if (item.stimulusKey) return item.stimulusKey;
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const evidence = (!item.passageIsInstruction && (item.passage || item.sentence)) || item.oralStimulus || item.targetWord
    || item.audioText || item.phonemeSequence?.join(' ');
  if (evidence) return normalize(evidence);
  // A shared direction is not a shared scene. Reusing the same scene still
  // counts as familiar even if the author changes the question or its foils.
  if (imagePath(item)) return `scene:${imagePath(item)}`;
  // In odd-one-out rhyme, the relationship among every spoken word is the
  // stimulus; there is no isolated target independent of that comparison.
  if ((item.sourceFormat || item.formatType) === 'RHYME_ODD_ONE_OUT') {
    return `rhyme-comparison:${JSON.stringify((item.choices || []).map(stringValue).map(normalize).sort())}`;
  }
  const answers = Array.isArray(item.answer ?? item.correctAnswer)
    ? item.answer ?? item.correctAnswer : [item.answer ?? item.correctAnswer];
  const targets = answers.map(answer => {
    const choice = (item.choices || []).find(value => value?.id === answer || stringValue(value) === stringValue(answer));
    return choice === undefined ? '' : imagePath(choice) ? `image:${imagePath(choice)}` : normalize(stringValue(choice));
  }).filter(Boolean);
  // Response evidence is stable under option shuffling and irrelevant foil
  // replacement. Do not manufacture fresh observations of the same target.
  if (targets.length === answers.length && targets.length) {
    if (item.answerMode !== 'sequence') targets.sort();
    return `response-evidence:${JSON.stringify(targets)}`;
  }
  return normalize(item.prompt || item.id);
}

/** Preserve the authored response rather than treating a one-answer tile bank as a choice. */
export function normalizeLiteracyMockItem(source, { contentVersion = LITERACY_MOCK_VERSION } = {}) {
  if (!LITERACY_MOCK_VERSIONS.includes(contentVersion)) throw new Error('Unsupported literacy mock content version.');
  if (INSTRUCTION_PASSAGE_IDS.has(source.id)) source = { ...source, passageIsInstruction: true };
  const isNormalized = FORMATS.has(source.format);
  const domainId = source.domainId || source.literacyDomainId;
  const format = isNormalized ? source.format : BUILD_FORMATS.has(source.formatType) ? 'build_word' : 'choice';
  const answerMode = source.answerMode || (['order', 'match'].includes(format) ? 'sequence' : format === 'multi_select' ? 'set' : 'exact');
  const rawChoices = format === 'build_word' && !isNormalized
    ? source.letterTiles || source.letterBank || source.soundTiles || [] : source.choices || [];
  const sourceCues = source.requiredAudioCues || literacyPracticeAudioCues(source);
  const independentReading = source.literacyModality === 'reading' || source.modality === 'reading';
  const requiredAudioCues = sourceCues.filter(cue => (!independentReading || cue.role === 'instruction')
    && !(format === 'build_word' && cue.role === 'choice')).map(cue => {
    // Source Skills items may narrate their story inside spokenPrompt. An
    // instruction role alone does not make that narration reading-neutral.
    if (independentReading && source.passage && cue.role === 'instruction') return {
      ...cue, text: source.prompt,
      path: cue.text === source.prompt ? cue.path : getLedaInstructionAudioPath(source.prompt),
    };
    return { ...cue };
  });
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
  const canonicalItemId = source.canonicalItemId || source.sourceItemId || source.id.replace(/^listen:/, '');
  const item = {
    id: source.id, contentVersion, skillId: source.skillId,
    domainId, mapDomainId: LITERACY_MOCK_MAP_DOMAINS[domainId], level: Number(source.level),
    format, answerMode, prompt: source.prompt, passage, choices, answer,
    // The target is audit/audio data. renderTargetText alone authorizes printing it.
    targetWord: source.targetWord || source.audioText || '', renderTargetText: false,
    image: imagePath(source), imageAlt: source.imageAlt || source.targetWord || '',
    modality: source.modality || source.literacyModality || 'recognition',
    ...(source.evidenceModality ? { evidenceModality: independentReading && source.passage ? 'text' : source.evidenceModality } : {}),
    ...(source.passageAccess ? { passageAccess: source.passageAccess } : {}),
    ...(source.oralLanguageAccess !== undefined ? { oralLanguageAccess: Boolean(source.oralLanguageAccess) } : {}),
    ...(Number.isInteger(source.responseLength) ? { responseLength: source.responseLength } : {}),
    displayPassageDuringResponse: source.displayPassageDuringResponse !== false,
    hideWrittenLabels: Boolean(source.hideWrittenLabels),
    tutorialOnly: Boolean(source.tutorialOnly),
    requiredAudioCues, requiredAudioPaths: [...new Set(requiredAudioCues.map(cue => cue.path).filter(Boolean))],
    stimulusKey: literacyMockStimulusKey(source),
    canonicalItemId,
    ...(source.passageIsInstruction ? { passageIsInstruction: true } : {}),
    ...(passage ? { canonicalPassageId: source.passageIsInstruction
      ? `sentence-options:${literacyMockStimulusKey(source)}`
      : passage.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim() } : {}),
    exposureFamilyId: source.exposureFamilyId || `source-item:${canonicalItemId}`,
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
    ...(source.textFeature ? { textFeature: clone(source.textFeature) } : {}),
    ...(Number.isFinite(source.practiceDemand) ? { practiceDemand: source.practiceDemand } : {}),
    ...(source.difficultyEvidence ? { difficultyEvidence: source.difficultyEvidence } : {}),
    ...(source.taskDemand ? { taskDemand: clone(source.taskDemand) } : {}),
    ...(source.phonemeTiles ? { phonemeTiles: clone(source.phonemeTiles) } : {}),
    ...literacyMockTaskCeiling({ ...source, constructClaim: source.constructClaim || source.itemKey || source.skillId }),
    ...(source.demandCeiling ? { demandCeiling: source.demandCeiling, ceilingReason: source.ceilingReason, ceilingNextTask: source.ceilingNextTask } : {}),
  };
  item.requiredImagePaths = [...new Set([item.image, ...choices.map(choice => choice.image),
    ...(item.matchTargets || []).map(target => target.image)].filter(Boolean))];
  // New authored scenes remain unavailable while their required art is still
  // pending, even when every spoken cue already exists in the audio library.
  const imageReviewPending = item.requiredImagePaths.length > 0 && item.mediaDecision?.constructReview === 'pending';
  item.mediaReady = !imageReviewPending && requiredAudioCues.length > 0 && requiredAudioCues.every(cue => Boolean(cue.path));
  const finiteInventory = literacyMockFoundationFinitePolicy(item);
  if (finiteInventory) item.finiteInventory = finiteInventory;
  if (['cvc_short_vowels', 'vowel_teams', 'long_vowels'].includes(item.skillId)
    && /^identify_read_(?:short_vowel|vowel|split_vowel)_sound:/.test(item.constructClaim)
    && !item.passage && !item.targetWord && item.format === 'choice') {
    const word = item.choices.find(choice => choice.id === item.answer)?.label.toLowerCase();
    if (/^[a-z]+$/.test(word || '')) {
      // A printed lexical target remains the same encountered word across
      // category levels and dictated spelling. Generic instructions and old
      // response-evidence wrappers must not make it appear newly encountered.
      item.stimulusKey = word;
      item.canonicalPassageId = word;
      item.exposureFamilyId = `mock-foundation-word:${word}`;
    }
  }
  const spokenHfwTarget = String(item.targetWord || '').normalize('NFKC').toLowerCase().trim();
  const suppliedHfwTarget = item.skillId.startsWith('hfw_') && spokenHfwTarget
    && item.requiredAudioCues.some(cue => cue.role === 'target_word'
      && String(cue.text || '').normalize('NFKC').toLowerCase().trim() === spokenHfwTarget);
  if (suppliedHfwTarget) {
    const closedTarget = `hfw-word:${spokenHfwTarget}`;
    item.stimulusKey = closedTarget;
    item.canonicalPassageId = closedTarget;
    item.exposureFamilyId = closedTarget;
  }
  if (item.skillId === 'prepositions' && item.image) {
    // Every relation question about this same scene shares the pictured facts.
    const scene = `scene:${item.image}`;
    item.stimulusKey = scene;
    item.canonicalPassageId = scene;
    item.exposureFamilyId = scene;
  }
  if (DEAR_NAME_SALUTATION_IDS.has(source.id)) {
    item.stimulusKey = 'salutation_dear_name';
    item.canonicalPassageId = 'salutation_dear_name';
    item.exposureFamilyId = 'salutation_dear_name';
  }
  if (item.skillId === 'capitalization' && item.constructClaim === 'supply_weekday_capital_form') {
    const weekday = item.choices[0]?.label.toLowerCase();
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(weekday)
      && item.choices.every(choice => choice.label.toLowerCase() === weekday)) {
      // Choosing the supplied case form still tests the same day when the
      // surrounding appointment, sentence length or wrong-case foil changes.
      const target = `weekday-capital-form:${weekday}`;
      item.stimulusKey = target;
      item.canonicalPassageId = target;
      item.exposureFamilyId = target;
    }
  }
  if (!item.id || !item.mapDomainId || ![1, 2].includes(item.level) || !item.prompt || choices.length < 2) {
    throw new Error(`Mock item ${source.id} is incomplete.`);
  }
  item.itemSnapshot = clone(item);
  delete item.itemSnapshot.itemSnapshot;
  return item;
}

const pendingBanks = new Map();
export async function loadLiteracyMockBank({ includeUnavailable = false, contentVersion = LITERACY_MOCK_VERSION } = {}) {
  if (!LITERACY_MOCK_VERSIONS.includes(contentVersion)) throw new Error('Unsupported literacy mock content version.');
  if (!pendingBanks.has(contentVersion)) pendingBanks.set(contentVersion, (async () => {
    if (contentVersion === 'literacy-mock-v8') return buildLiteracyMockV8(await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v7'}), source => normalizeLiteracyMockItem(source,{contentVersion}));
    if (contentVersion === 'literacy-mock-v9') return buildLiteracyMockV9(await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v8'}), source => normalizeLiteracyMockItem(source,{contentVersion}));
    if (contentVersion === 'literacy-mock-v10') return buildLiteracyMockV10(await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v9'}), source => normalizeLiteracyMockItem(source,{contentVersion}));
    if (contentVersion === 'literacy-mock-v7') return buildLiteracyMockV7(await loadLiteracyMockBank({includeUnavailable:true,contentVersion:'literacy-mock-v6'}));
    if (contentVersion === 'literacy-mock-v6') {
      const base = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v5' });
      return buildLiteracyMockV6(base, source => normalizeLiteracyMockItem(source, { contentVersion }));
    }
    if (contentVersion === 'literacy-mock-v5') {
      const base = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v4' });
      return buildLiteracyMockV5(base, source => normalizeLiteracyMockItem(source, { contentVersion }));
    }
    // Every v1 field is frozen, not just comprehension. New authoring must never
    // change an older session's labels, keys, media or evidence claims.
    if (contentVersion === 'literacy-mock-v1') {
      const { LITERACY_MOCK_V1 } = await import('./generated/literacyMockV1.generated.js');
      return LITERACY_MOCK_V1.map(snapshot => ({ ...clone(snapshot), itemSnapshot: clone(snapshot) }));
    }
    if (contentVersion === 'literacy-mock-v2') {
      const { LITERACY_MOCK_V2 } = await import('./generated/literacyMockV2.generated.js');
      return LITERACY_MOCK_V2.map(snapshot => ({ ...clone(snapshot), itemSnapshot: clone(snapshot) }));
    }
    if (contentVersion === 'literacy-mock-v3') {
      const { LITERACY_MOCK_V3 } = await import('./generated/literacyMockV3.generated.js');
      return LITERACY_MOCK_V3.map(snapshot => ({ ...clone(snapshot), itemSnapshot: clone(snapshot) }));
    }
    const sources = [...await loadLiteracyPracticeBank({ includeReference: false }), ...await loadLiteracyMockItems()];
    const normalizeActive = source => normalizeLiteracyMockItem(correctLiteracyMockFoundationDemand(correctLiteracyMockWritingDemand(correctLiteracyMockPhonicsDemand(correctLiteracyMockComprehensionLabels(source)))), { contentVersion });
    const bank = sources.filter(item => !item.retentionOnly && item.active !== false)
      .map(normalizeActive);
    bank.push(...buildLiteracyMockDepthItems(bank).map(normalizeActive));
    bank.push(...buildLiteracyMockComprehensionDepthItems(bank).map(normalizeActive));
    bank.push(...buildLiteracyMockPhonicsDepthItems(bank).map(normalizeActive));
    const capacityTemplates = [...bank];
    bank.push(...buildLiteracyMockComprehensionCapacityItems(capacityTemplates).map(normalizeActive));
    bank.push(...buildLiteracyMockWritingCapacityItems(capacityTemplates).map(normalizeActive));
    bank.push(...buildLiteracyMockLanguageCapacityItems(capacityTemplates).map(normalizeActive));
    bank.push(...buildLiteracyMockFoundationCapacityItems(capacityTemplates).map(normalizeActive));
    bank.push(...buildLiteracyMockPrintCapacityItems(capacityTemplates).map(normalizeActive));
    if (new Set(bank.map(item => item.id)).size !== bank.length) throw new Error('Mock question IDs must be unique.');
    return buildLiteracyMockV4(bank, source => normalizeLiteracyMockItem(source, { contentVersion }));
  })().catch(error => { pendingBanks.delete(contentVersion); throw error; }));
  const bank = await pendingBanks.get(contentVersion);
  return includeUnavailable ? bank : bank.filter(item => item.mediaReady);
}
