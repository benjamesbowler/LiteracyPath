import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { normalizeSpokenCloze } from '../utils/assessmentSpokenText.js';

const FILE = 'src/data/literacyMockLanguageAccessV4.js';
const clone = value => JSON.parse(JSON.stringify(value));
const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const SPATIAL_TASK = 'oral_spatial_relation_reasoning';
const SPATIAL_PROMPT = 'Which phrase fits?';
const SPATIAL_CHOICES = ['above', 'below', 'level with'];
const PICTURED_SPATIAL_TASKS = new Set(['in', 'on', 'under', 'behind', 'next_to', 'between', 'in_front_of',
  'above', 'below', 'over', 'through', 'near', 'opposite', 'among', 'around', 'inside_outside', 'inverse_spatial_relation']);
const WEAK_PLURAL_IDS = new Set([
  'lp3.plurals.l2.B.plural_in_sentence.v2',
  'lp3.plurals.l2.C.plural_irregular.v9',
  'lp3.plurals.l2.C.plural_in_sentence.v9',
]);
// These targets themselves have an explicit speaker tag. The other three
// harder sources have an untagged target following a previously tagged turn.
const DIRECT_SPEAKER_IDS = new Set([
  'mock.depth.speaker-reply-hard',
  ...['cake-reply', 'missing-page', 'market-turn', 'three-friends', 'watch-repair', 'one-more']
    .map(id => `mock.capacity.literary_craft.speaker-${id}`),
]);
// These contexts require selecting a new grammatical form while a foil has
// the same person/number (and gender where relevant). None supplies its key
// as an earlier explicit model. The other pronoun sources can be solved from
// referent agreement or the directly supplied form alone.
const PRONOUN_FORM_CONTRASTS = new Map([
  ['mock.depth.pronoun-1', ['us', 'we']],
  ['mock.capacity.writing.pronoun-hard-object-pair', ['us', 'we']],
  ['mock.capacity.writing.pronoun-hard-subject-pair', ['We', 'Us']],
  ['mock.capacity.writing.pronoun-hard-boys', ['They', 'Them']],
  ['mock.capacity.writing.pronoun-hard-female-object', ['her', 'she']],
  ['mock.capacity.writing.pronoun-hard-male-object', ['him', 'he']],
  ['mock.capacity.writing.pronoun-hard-possession', ['mine', 'my', 'me']],
]);

function snapshot(item) {
  const result = { ...item, contentVersion: 'literacy-mock-v4' };
  result.requiredAudioPaths = [...new Set(result.requiredAudioCues.map(cue => cue.path).filter(Boolean))];
  result.missingAudioCues = result.requiredAudioCues.filter(cue => !cue.path)
    .map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) }));
  const imagePending = result.requiredImagePaths?.length > 0 && result.mediaDecision?.constructReview === 'pending';
  result.mediaReady = !imagePending && result.requiredAudioCues.length > 0 && result.missingAudioCues.length === 0;
  delete result.itemSnapshot;
  result.itemSnapshot = clone(result);
  return result;
}

function revise(item, fields) {
  return snapshot({ ...item, ...fields, sourceProvenance: {
    ...item.sourceProvenance,
    v4LanguageCorrection: { file: FILE, sourceItemId: item.sourceItemId || item.id },
  } });
}

function fixed(item, reason, next, fields = {}) {
  return revise(item, { ...fields, level: 1, demandCeiling: 1,
    ceilingReason: reason, ceilingNextTask: next, difficultyEvidence: reason });
}

/** Apply only v4 changes to a normalized historical item, without mutation. */
export function correctLiteracyMockLanguageAccessV4(item, bank = [item]) {
  const claim = item.constructClaim;
  if (item.skillId === 'prepositions' && item.image && PICTURED_SPATIAL_TASKS.has(claim)) {
    return fixed(item,
      'This supplied picture asks for one visible spatial relation. Reversing its phrasing or changing the relation vocabulary does not add a second relation to reason from.',
      'Use the separately authored oral spatial-relation task: one supplied relation at entry and two linked relations at extension.');
  }
  if (item.skillId === 'plurals' && claim === 'plural_add_es') {
    return fixed(item,
      'Each item applies the same es ending to one stated noun. Wishes, dishes and watches do not establish different demands merely through the noun or extra foils.',
      'Use contextual selection that contrasts a changed plural form with its singular, as a separate task.');
  }
  if (item.skillId === 'plurals' && WEAK_PLURAL_IDS.has(item.id)) {
    return revise(item, { level: 1,
      difficultyEvidence: 'The number cue selects a singular, regular-s plural or unchanged noun. This item does not require the changed morphology used by the genuine harder contextual siblings.' });
  }
  if (item.skillId === 'prefix_suffix' && claim === 'apply_affix_meaning_in_context') {
    const cues = item.requiredAudioCues.map(cue => ({ ...cue }));
    if (item.passage && !cues.some(cue => ['instruction', 'passage'].includes(cue.role)
      && normalize(cue.text).includes(normalize(normalizeSpokenCloze(item.passage))))) {
      const text = normalizeSpokenCloze(item.passage);
      const exact = bank.flatMap(source => source.requiredAudioCues || [])
        .find(cue => cue.text === text && cue.path);
      cues.unshift({ role: 'passage', text,
        path: exact?.path || getLedaInstructionAudioPath(text), required: true });
    }
    return revise(item, { oralLanguageAccess: true, evidenceModality: 'audio+text', passageAccess: 'audio+text',
      requiredAudioCues: cues,
      mediaDecision: { ...item.mediaDecision, role: 'text-and-audio', paths: [],
        construct: claim, constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Affix meaning is interpreted from the complete orally accessible scenario and choices; independent passage reading is not a difficulty condition.' } });
  }
  if (item.skillId === 'literary_craft' && claim === 'poetry') {
    const rhyme = /Which two words rhyme/i.test(item.prompt);
    return fixed(item, rhyme
      ? 'Selecting the two rhyming words in a supplied poem is a different operation from classifying poetry by its features.'
      : 'Selecting a stated poetry feature is a fixed classification operation; it is not a harder rhyme-word response.',
    'Use an independently authored ladder within the same literary response operation.',
    { constructClaim: rhyme ? 'identify_rhyme_words_in_poem' : 'identify_poetry_features' });
  }
  if (item.skillId === 'literary_craft' && claim === 'speaker' && DIRECT_SPEAKER_IDS.has(item.id)) {
    return revise(item, { level: 1,
      difficultyEvidence: 'The target quote itself is explicitly attributed. Other turns do not add the untagged-target speaker dependency present in genuine harder siblings.' });
  }
  if (item.skillId === 'writing_revision' && claim === 'verb_tense') {
    return fixed(item,
      'An explicit time word selects the verb form in one clause. An unrelated habitual clause does not add evidence needed to choose that form.',
      'Use a separate revision task requiring a meaning or grammatical relation across clauses.');
  }
  if (item.id === 'mock.capacity.writing.complete-hard-subject' && claim === 'complete_sentence') {
    return revise(item, { level: 1,
      difficultyEvidence: 'Only the key contains a finite verb; both alternatives are noun or prepositional fragments. A longer noun phrase does not add the dependent-clause distinction used by genuine harder siblings.' });
  }
  if (item.id === 'mock.capacity.writing.agreement-hard-both' && claim === 'agreement') {
    return revise(item, { level: 1,
      difficultyEvidence: 'Both and the nearby noun doors are plural, so nearest-noun agreement gives the correct form. Genuine harder siblings put a differently numbered noun between the subject head and verb.' });
  }
  if (item.skillId === 'writing_revision' && claim === 'pronoun') {
    const contrasts = PRONOUN_FORM_CONTRASTS.get(item.id);
    return revise(item, { level: contrasts ? 2 : 1,
      difficultyEvidence: contrasts
        ? 'The context does not supply the answer form. A competing form agrees with the same referent, so person, number and gender alone cannot choose the key; the grammatical role is needed.'
        : 'Referent agreement or an explicitly supplied answer-form model selects the pronoun. Extra clauses or reflexive labels do not establish higher grammatical-form demand.',
      taskDemand: { operation: 'select_contextually_appropriate_pronoun',
        contrast: contrasts ? 'Reject a same-referent form using its grammatical role.' : 'Match the referent or a directly supplied form.',
        ...(contrasts ? { sameReferentForms: contrasts } : {}) } });
  }
  if (item.skillId === 'writing_organization' && claim === 'connecting_word') {
    return fixed(item,
      'Each item supplies one connection to express: addition, choice, contrast, cause, time or result. A named relation such as As a result, or another same-meaning sentence, does not create a harder connection operation.',
      'Use a separate organization task requiring competing connections or a relation across clauses.');
  }
  if (item.skillId === 'writing_organization' && claim === 'coherent_event_order') {
    return fixed(item,
      'Each item orders the same three supplied prerequisite events along one causal chain. Extra description does not change that ordering operation.',
      'Use a separate organization task with a genuine competing order or a relation across events.');
  }
  return item;
}

// Twenty different authored arrangements, not ID-only variants. Both levels
// of each arrangement share one exposure family. The entry fact is retained
// in extension; the added third object and linked fact must both be used to
// establish the queried endpoint relation. "Beside" is never treated as a
// transitive relation, and opposed above/below chains are never guessed.
const spatialPairs = [
  ['kitchen-shelves', 'In the kitchen cupboard.', 'The bowl is above the cup.', 'The cup is above the plate.', 'The cup is ___ the bowl.', 'The plate is ___ the bowl.', 'below', 'below'],
  ['garden-nest', 'At the garden gate.', 'The nest is above the gate.', 'The branch is above the nest.', 'The gate is ___ the nest.', 'The branch is ___ the gate.', 'below', 'above'],
  ['toy-garage', 'Cars are parked on the toy garage ramps.', 'The red car is below the blue car.', 'The green car is below the red car.', 'The blue car is ___ the red car.', 'The green car is ___ the blue car.', 'above', 'below'],
  ['trophy-display', 'At the school prize display.', 'The small trophy is level with the medal.', 'The big trophy is above the small trophy.', 'The medal is ___ the small trophy.', 'The big trophy is ___ the medal.', 'level with', 'above'],
  ['painting-ladder', 'At the painting area.', 'The painter is above the child.', 'The child is level with the bucket.', 'The child is ___ the painter.', 'The bucket is ___ the painter.', 'below', 'below'],
  ['bakery-window', 'In the bakery window.', 'The price card is below the bread.', 'The bread is level with the cake.', 'The bread is ___ the price card.', 'The cake is ___ the price card.', 'above', 'above'],
  ['aquarium', 'Inside the aquarium.', 'The fish is above the crab.', 'The snail is level with the crab.', 'The crab is ___ the fish.', 'The fish is ___ the snail.', 'below', 'above'],
  ['winter-hooks', 'Winter clothes hang on the wall hooks.', 'The scarf is level with the hat.', 'The gloves are below the scarf.', 'The hat is ___ the scarf.', 'The gloves are ___ the hat.', 'level with', 'below'],
  ['stage-equipment', 'On the school stage.', 'The light is above the drum.', 'The drum is level with the chair.', 'The drum is ___ the light.', 'The chair is ___ the light.', 'below', 'below'],
  ['camp-signals', 'Outside the camping tent.', 'The flag is above the rope.', 'The rope is level with the lantern.', 'The rope is ___ the flag.', 'The flag is ___ the lantern.', 'below', 'above'],
  ['fridge-food', 'Food is on the fridge shelves.', 'The cheese is below the milk.', 'The milk is below the eggs.', 'The milk is ___ the cheese.', 'The cheese is ___ the eggs.', 'above', 'below'],
  ['art-rack', 'Tools are on the art rack.', 'The brush is below the paint pot.', 'The paint pot is level with the pencil.', 'The paint pot is ___ the brush.', 'The pencil is ___ the brush.', 'above', 'above'],
  ['window-pet', 'A cat rests by the window.', 'The flower is above the cat.', 'The cat is above the mat.', 'The cat is ___ the flower.', 'The flower is ___ the mat.', 'below', 'above'],
  ['roof-sky', 'Think about a kite, a balloon and a roof.', 'The kite is above the balloon.', 'The balloon is above the roof.', 'The balloon is ___ the kite.', 'The roof is ___ the kite.', 'below', 'below'],
  ['cave-camp', 'Inside the cave entrance.', 'The bat is above the lantern.', 'The lantern is above the bag.', 'The lantern is ___ the bat.', 'The bag is ___ the bat.', 'below', 'below'],
  ['block-tower', 'Blocks make a tower.', 'The square block is below the round block.', 'The triangle block is below the square block.', 'The round block is ___ the square block.', 'The round block is ___ the triangle block.', 'above', 'above'],
  ['concert-cases', 'In the music room.', 'The flute is level with the violin.', 'The violin is level with the drum.', 'The violin is ___ the flute.', 'The flute is ___ the drum.', 'level with', 'level with'],
  ['washing-line', 'Clothes hang from their pegs.', 'The sock is level with the shirt.', 'The shirt is level with the towel.', 'The shirt is ___ the sock.', 'The towel is ___ the sock.', 'level with', 'level with'],
  ['river-bridge', 'At the river.', 'The gull is above the bridge.', 'The bridge is above the boat.', 'The bridge is ___ the gull.', 'The gull is ___ the boat.', 'below', 'above'],
  ['market-fruit', 'Fruit is arranged for sale.', 'The pear is level with the apple.', 'The melon is level with the pear.', 'The apple is ___ the pear.', 'The melon is ___ the apple.', 'level with', 'level with'],
];

function audioCue(role, text, choiceId) {
  return { role, text, path: role === 'choice'
    ? getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text)
    : getLedaInstructionAudioPath(text), required: true, ...(choiceId ? { choiceId } : {}) };
}

/** New deliberately oral spatial-language reasoning, never a missing-picture substitute. */
export function buildLiteracyMockLanguageAccessV4(bank) {
  const template = bank.find(item => item.skillId === 'prepositions' && item.format === 'choice');
  if (!template) throw new Error('A normalized prepositions template is required for v4 language authoring.');
  return spatialPairs.flatMap(([family, context, first, second, entryQuery, hardQuery, entryKey, hardKey]) => [1, 2].map(level => {
    const id = `mock.v4.prepositions.${family}.l${level}`;
    const premises = level === 1 ? [first] : [first, second];
    const query = level === 1 ? entryQuery : hardQuery;
    const passage = `${context} ${premises.join(' ')} ${query}`;
    const key = level === 1 ? entryKey : hardKey;
    const choices = SPATIAL_CHOICES.map((label, index) => ({ id: `c${index}`, label }));
    const requiredAudioCues = [audioCue('instruction', SPATIAL_PROMPT),
      audioCue('passage', normalizeSpokenCloze(passage)), ...choices.map(choice => audioCue('choice', choice.label, choice.id))];
    const item = { ...template, id, sourceItemId: id, canonicalItemId: id, level,
      constructClaim: SPATIAL_TASK, format: 'choice', answerMode: 'exact', sourceFormat: 'ORAL_SPATIAL_RELATION_REASONING',
      prompt: SPATIAL_PROMPT, passage, targetWord: '', image: '', imageAlt: '', requiredImagePaths: [],
      modality: 'recognition', evidenceModality: 'audio+text', oralLanguageAccess: true, passageAccess: 'audio+text',
      displayPassageDuringResponse: true, hideWrittenLabels: false, tutorialOnly: false,
      choices, answer: choices.find(choice => choice.label === key).id, requiredAudioCues,
      stimulusKey: normalize(passage), canonicalPassageId: normalize(passage),
      exposureFamilyId: `mock-v4-spatial-arrangement:${family}`,
      sourceProvenance: { kind: 'mock_v4_native', sourceFile: FILE, standardVersion: 'v4', authoredFamily: family },
      mediaDecision: { role: 'text-and-audio', paths: [], construct: SPATIAL_TASK,
        constructReview: 'approved', answerNeutral: 'approved',
        reason: 'This oral language task supplies every spatial premise and the incomplete response sentence in replayable audio and text. It asks for a deduced relation; no unseen picture or visual search is required.' },
      explanation: level === 1 ? `Reverse the stated relation: ${query.replace('___', key)}`
        : `Use both linked relations: ${query.replace('___', key)}`,
      distractorRationales: Object.fromEntries(choices.filter(choice => choice.label !== key).map(choice => [choice.id,
        level === 1 ? 'Does not preserve the stated relation when its two objects are reversed.'
          : 'Does not satisfy both supplied relations for the two queried objects.'])),
      difficultyEvidence: level === 1
        ? 'Infer the reverse relation between the two objects from one stated height relation.'
        : 'Join two stated height relations through a shared object to infer the unspoken relation between the endpoints.',
      taskDemand: { operation: SPATIAL_TASK, context, premises, query, relationCount: premises.length,
        contrast: level === 1 ? 'One relation, two objects, one final relation response.' : 'Two linked relations, three objects, the same final relation response.' },
    };
    delete item.demandCeiling;
    delete item.ceilingReason;
    delete item.ceilingNextTask;
    delete item.finiteInventory;
    delete item.passageIsInstruction;
    return snapshot(item);
  }));
}

/** Exact recording worklist, shared texts deduplicated without creating audio. */
export function literacyMockLanguageAccessV4MissingAudio(bank) {
  const cues = new Map();
  for (const item of bank) {
    for (const cue of item.requiredAudioCues || []) {
      if (cue.path) continue;
      const key = `${cue.role}:${cue.text}`;
      if (!cues.has(key)) cues.set(key, { role: cue.role, text: cue.text, itemIds: [] });
      cues.get(key).itemIds.push(item.id);
    }
  }
  return [...cues.values()];
}
