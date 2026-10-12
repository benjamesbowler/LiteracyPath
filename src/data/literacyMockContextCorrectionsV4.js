import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

const FILE = 'src/data/literacyMockContextCorrectionsV4.js';
const CLAIM = 'meaning_at_named_occurrence';
const clone = value => JSON.parse(JSON.stringify(value));
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

// The senses are familiar nouns at both levels, avoiding a noun/verb or
// adjective/noun shortcut. Five queried uses occur first and five second.
// Both occurrences in L2 support a real sense represented among the options.
const pairs = [
  ['bank',
    'Lea sat on the bank beside the flowing water and watched a duck.',
    'Lea sat on the bank beside the flowing water and watched a duck. Later, Dad went to the bank to put money into his account.',
    ['the edge of a river', 'a place that keeps money', 'a bridge over water'], 1],
  ['bark',
    'Arun touched the rough bark covering the tree’s trunk.',
    'A dog gave a loud bark when Arun opened the gate. Arun then touched the rough bark covering the tree’s trunk.',
    ['a tree’s outer covering', 'a dog’s short loud sound', 'a tree’s leafy branch'], 2],
  ['bat',
    'Inez saw a bat flying above the cave at dusk.',
    'Inez saw a bat flying above the cave at dusk. Earlier, she had used a bat to hit a ball at the field.',
    ['a flying animal', 'a stick for hitting a ball', 'a ball used in a game'], 1],
  ['spring',
    'Jo fixed the toy by replacing its curled metal spring, which pushed the lid open.',
    'Flowers opened in spring as the weather grew warmer. Jo fixed the toy by replacing its curled metal spring, which pushed the lid open.',
    ['a curled piece of metal', 'the season after winter', 'a hinged lid on a toy'], 2],
  ['trunk',
    'Sal held the tree’s thick trunk as she climbed up to a low branch.',
    'Sal held the tree’s thick trunk as she climbed up to a low branch. Her family’s car was nearby, with bags stored in its trunk.',
    ['the main stem of a tree', 'a car’s storage space', 'a tree’s longest root'], 1],
  ['glass',
    'Bea lifted a glass of water to her lips and took a drink.',
    'The window was made from clear glass so Bea could see outside. She lifted a glass of water to her lips and took a drink.',
    ['a container for a drink', 'a clear material for windows', 'a cover for a container'], 2],
  ['wave',
    'Noor gave her friend a wave, moving her hand from side to side.',
    'Noor gave her friend a wave, moving her hand from side to side. At the shore, a wave rolled in and splashed around their feet.',
    ['a greeting made with a hand', 'a rolling rise of water', 'a footprint left in sand'], 1],
  ['seal',
    'Kit broke the seal around the jar’s lid before opening it.',
    'A seal swam past the boat and dived under the water. Back home, Kit broke the seal around the jar’s lid before opening it.',
    ['a closure that keeps a lid shut', 'an animal that swims in the sea', 'a handle for carrying a jar'], 2],
  ['ring',
    'May put a silver ring on her finger as she dressed for the party.',
    'May put a silver ring on her finger as she dressed for the party. Then she heard the ring of the telephone from the hall.',
    ['jewellery worn on a finger', 'the sound of a telephone', 'a necklace worn for a party'], 1],
  ['match',
    'Eli watched a football match as the two teams tried to score.',
    'Dad struck a match to light the candles before they left home. Eli then watched a football match as the two teams tried to score.',
    ['a contest between players', 'a small stick for lighting a fire', 'a point scored in a game'], 2],
];

export const MOCK_V4_CONTEXT_APPROVED_TASKS = Object.freeze([Object.freeze({
  skillId: 'context_clues', domainId: 'vocabulary', constructClaim: CLAIM,
  modality: 'recognition', evidenceModality: 'audio+text', passageAccess: 'audio+text',
  oralLanguageAccess: true, displayPassageDuringResponse: true,
})]);

function revised(item, changes) {
  const result = { ...item, ...changes,
    sourceProvenance: { ...item.sourceProvenance, v4ContextReview: { file: FILE, originalLevel: item.sourceProvenance?.v4ContextReview?.originalLevel ?? item.level } } };
  result.itemSnapshot = clone(result);
  delete result.itemSnapshot.itemSnapshot;
  return result;
}

function fixed(item, reason) {
  return revised(item, { level: 1, demandCeiling: 1, adaptiveMixedEligible: false,
    ceilingReason: reason,
    ceilingNextTask: 'Use a reviewed paired task within the same broad skill.',
    difficultyEvidence: reason,
    taskDemand: { fixedOnly: true, reviewed: false, operation: item.constructClaim, reason } });
}

/** Correct only v4 copies. The frozen v3 sources and identities stay intact. */
export function correctLiteracyMockContextV4(item) {
  if (item.id.startsWith('mock.v4.context.')) return item;
  if (item.skillId === 'context_clues') return fixed(item,
    'Direct definitions, category lists and single-action paraphrases do not establish a consistent higher contextual-meaning demand. These sources remain fixed entry evidence.');
  if (item.skillId === 'print_concepts' && ['title', 'author', 'illustrator'].includes(item.constructClaim)) return fixed(item,
    'The predecessor pool locates an explicit credit or assumes first-line title placement. Extra names and lines do not establish a consistent higher book-role relation; unlabelled series lines also leave their role uncertain.');
  if (item.skillId === 'informational_features' && item.constructClaim === 'heading') return fixed(item,
    'The predecessor heading pool supplies its summary in an opening or concluding sentence, or selects a topic against unrelated topics. Longer lists do not establish a consistent higher whole-account demand.');
  if (item.id === 'mock.capacity.language.action-door') return revised(item, { level: 1,
    difficultyEvidence: 'The single method is explicitly stated as using her elbow. The added hands-full condition is unnecessary to retrieve that method, just as entry retrieves carrying plates on one arm.' });
  if (['mock.capacity.writing.locate-detail-4', 'mock.capacity.writing.locate-detail-6'].includes(item.id)) return revised(item, { level: 1,
    difficultyEvidence: 'This repeats the entry missing-I or missing-person-name convention. More words and an already correct capital do not add a necessary capitalization distinction.' });
  if (item.skillId !== 'literary_craft') return item;
  if (item.id === 'literacy.literary_craft.viewpoint-first') return fixed({ ...item, constructClaim: 'identify_narrator_evidence' },
    'This selects evidence that the narrator is a character, rather than selecting the narrator’s identity. It is retained as a separate fixed operation, outside the narrator-identity ladder.');
  if (item.constructClaim === 'fiction') return fixed(item,
    'Each item identifies one overt impossible event against possible events. More realistic background does not change that discrimination operation.');
  if (item.constructClaim === 'sensory_language') return fixed(item,
    'Each item identifies the sound expression against expressions from other senses. More sensory description does not require an additional relation to choose the key.');
  if (item.constructClaim === 'sound_words') {
    const choices = item.choices.map(choice => ({ ...choice, label: choice.label.toLowerCase() }));
    const changes = { choices };
    if (item.id === 'mock.depth.metal') Object.assign(changes, { level: 1,
      difficultyEvidence: 'Only the key is a sound expression; the other options name movement and manner. Genuine harder siblings require distinguishing competing sound expressions.' });
    return revised(item, changes);
  }
  if (item.id === 'mock.capacity.literary_craft.words-lonely-lunch') {
    const passage = item.passage.replace('There was an empty chair beside her.', 'A blue cup stood beside her sandwich.');
    const choices = item.choices.map(choice => choice.id === 'c2' ? { ...choice, label: 'a blue cup' } : { ...choice });
    return revised(item, { choices, passage, stimulusKey: normalize(passage),
      explanation: 'Watching the laughing group and lowering her eyes provides behavioral evidence of feeling excluded.',
      distractorRationales: { c1: 'The lunch table names the setting without showing her feeling.', c2: 'A blue cup names an object without showing her feeling.' } });
  }
  return item;
}

function cue(role, text, choiceId) {
  return { role, text, path: role === 'choice'
    ? getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text)
    : getLedaInstructionAudioPath(text), required: true, ...(choiceId ? { choiceId } : {}) };
}

export function buildLiteracyMockContextLaddersV4(bank) {
  const template = bank.find(item => item.skillId === 'context_clues' && item.format === 'choice');
  if (!template) throw new Error('A context-clue choice template is required for v4 authoring.');
  return pairs.flatMap(([word, entry, harder, labels, queriedOccurrence]) => [1, 2].map(level => {
    const id = `mock.v4.context.${word}.l${level}`;
    const prompt = level === 1 ? `What did "${word}" mean in the sentence?`
      : `What did "${word}" mean the ${queriedOccurrence === 1 ? 'first' : 'second'} time it was used?`;
    const passage = level === 1 ? entry : harder;
    const choices = labels.map((label, index) => ({ id: `c${index}`, label }));
    const requiredAudioCues = [cue('instruction', prompt), cue('passage', passage), ...choices.map(choice => cue('choice', choice.label, choice.id))];
    const exposureFamilyId = `v4-context-word-senses:${word}`;
    const result = { ...template, id, sourceItemId: id, canonicalItemId: id,
      contentVersion: 'literacy-mock-v4', level, constructClaim: CLAIM,
      format: 'choice', sourceFormat: 'CONTEXT_SENSE_PAIRED_V4', answerMode: 'exact', prompt, passage,
      choices, answer: 'c0', targetWord: word, renderTargetText: false, image: '', imageAlt: '',
      modality: 'recognition', evidenceModality: 'audio+text', passageAccess: 'audio+text', oralLanguageAccess: true,
      displayPassageDuringResponse: true, hideWrittenLabels: false, tutorialOnly: false,
      requiredAudioCues, requiredImagePaths: [], stimulusKey: normalize(passage),
      canonicalPassageId: normalize(passage), exposureFamilyId,
      explanation: `At the queried occurrence, "${word}" means ${labels[0]}.`,
      distractorRationales: { c1: level === 2
        ? `"${labels[1]}" is true at the other occurrence of "${word}", but not at the queried occurrence.`
        : `The single occurrence describes ${labels[0]}, not ${labels[1]}.`,
      c2: `"${labels[2]}" names a related object or event, not the contextual meaning of "${word}".` },
      difficultyEvidence: level === 1
        ? 'Resolve one familiar word sense from one explicit event.'
        : 'Bind the queried occurrence of a repeated word to its contextual sense and reject a different meaning that is true elsewhere in the same passage.',
      taskDemand: { reviewed: true, operation: CLAIM, level, choiceCount: 3,
        lower: 'One occurrence supplies one contextual sense.', higher: 'Two occurrences support competing true senses; use the queried occurrence to choose its sense.',
        features: { targetOccurrences: level, trueSenseFoils: level === 2 ? 1 : 0, queriedOccurrence: level === 1 ? 1 : queriedOccurrence },
        proof: { queriedSense: labels[0], otherSense: labels[1], queriedOccurrence: level === 1 ? 1 : queriedOccurrence } },
      sourceProvenance: { kind: 'original_mock_v4_paired_context', file: FILE, pairedFamily: exposureFamilyId,
        demand: { operation: CLAIM, entryOccurrences: 1, harderOccurrences: 2, competingTrueSenses: 1 } },
      mediaDecision: { role: 'text-and-audio', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Exact recorded question, passage and options provide the same oral and printed access at both levels; missing cues fail closed.' },
    };
    for (const field of ['itemSnapshot', 'demandCeiling', 'ceilingReason', 'ceilingNextTask', 'adaptiveMixedEligible']) delete result[field];
    result.requiredAudioPaths = [...new Set(requiredAudioCues.map(audio => audio.path).filter(Boolean))];
    result.missingAudioCues = requiredAudioCues.filter(audio => !audio.path).map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) }));
    result.mediaReady = !result.missingAudioCues.length;
    return result;
  }));
}
