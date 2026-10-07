import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_TUTORIAL_IDS = Object.freeze({
  multi_select: 'mock.rhyme.cat-hat', match: 'mock.letters.round',
  order: 'mock.sentence.puppy', select_text: 'mock.text.first-clouds', build_word: 'mock.build.cat',
});

export const LITERACY_MOCK_ATLAS = Object.freeze({
  path: '/images/assessment/literacy-mock/object-atlas-v1.webp',
  sha256: '233d2f96521689e59dea0aef90a75a6572c09b08afe5af7b631a8e140f81ee72',
  bytes: 169534,
  originalPngSha256: '2212cc5097c80ae0dd95d6678b4bd7b44bb506f5e36048192a850d81e7b83cfc',
  deliveryTransform: 'WebP quality 90 at original dimensions; no crop, redraw or composition change',
  width: 1536, height: 1024, columns: 6, rows: 4,
  words: Object.freeze(['bed', 'bee', 'boat', 'box', 'bus', 'cake', 'cat', 'coat', 'cup', 'dog', 'duck', 'fan',
    'fish', 'fox', 'hat', 'hen', 'log', 'pen', 'pig', 'snake', 'tree', 'sun', 'ship']),
});
export function literacyMockObjectImage(word) {
  const index = LITERACY_MOCK_ATLAS.words.indexOf(word);
  if (index < 0) throw new Error(`Original mock illustration unavailable: ${word}`);
  return `${LITERACY_MOCK_ATLAS.path}#mock-cell=${index}`;
}

// Original construction/selection tasks use one reviewed original object atlas
// and canonical Leda audio, never NWEA stimuli, artwork, keys or recordings.
export const LITERACY_MOCK_PROMPTS = Object.freeze({
  rhyme: 'Choose the two pictures that rhyme.',
  plural: 'Choose the two words that mean more than one.',
  details: 'Choose the two details that support the main idea.',
  words: 'Put the words in order to make a sentence.',
  sentences: 'Put the sentences in order.',
  letters: 'Match each capital letter to its small letter.',
  synonyms: 'Match the words with the same meaning.',
  antonyms: 'Match each word to its opposite.',
  first: 'Which word starts the sentence?',
  last: 'Which word is last in the sentence?',
  capital: 'Which word needs a capital letter?',
  build: 'Build the word you hear.',
});

const RHYMES = [
  ['cat-hat', 1, ['cat', 'cup', 'hat', 'dog'], [0, 2]],
  ['dog-log', 1, ['duck', 'dog', 'pig', 'log'], [1, 3]],
  ['hen-pen', 1, ['hen', 'bed', 'cat', 'pen'], [0, 3]],
  ['bee-tree', 2, ['bus', 'bee', 'tree', 'boat'], [1, 2]],
  ['cake-snake', 2, ['cake', 'coat', 'cup', 'snake'], [0, 3]],
  ['fox-box', 2, ['fan', 'fox', 'box', 'fish'], [1, 2]],
];
const PLURALS = [
  ['animals', 1, ['cats', 'rabbit', 'dogs', 'horse'], [0, 2]],
  ['things', 1, ['cup', 'books', 'bags', 'hat'], [1, 2]],
  ['endings', 2, ['boxes', 'dish', 'brushes', 'class'], [0, 2]],
  ['changes', 2, ['baby', 'ponies', 'story', 'cities'], [1, 3]],
];
const WORD_ORDERS = [
  ['puppy', 1, ['The', 'puppy', 'sleeps.']],
  ['birds', 1, ['Two', 'birds', 'sing.']],
  ['boat', 1, ['My', 'boat', 'floats.']],
  ['rain', 1, ['The', 'rain', 'stopped.']],
  ['under', 2, ['The', 'rabbit', 'hid', 'under', 'the', 'bench.']],
  ['because', 2, ['We', 'went', 'inside', 'because', 'it', 'rained.']],
  ['although', 2, ['Although', 'it', 'rained,', 'we', 'played', 'inside.']],
  ['before', 2, ['Before', 'lunch,', 'we', 'washed', 'our', 'hands.']],
];
const SENTENCE_ORDERS = [
  ['parcel', 1, ['A parcel arrived for Noor.', 'Noor opened the parcel.', 'Inside was a red kite.']],
  ['painting', 1, ['I put clean paper on the table.', 'I painted a blue boat on it.', 'I hung the finished painting to dry.']],
  ['bean', 1, ['We put a bean in damp soil.', 'A small shoot grew from the bean.', 'The shoot grew its first leaves.']],
  ['library', 1, ['Mina chose a library book.', 'She read the book at home.', 'She returned it to the library.']],
  ['shelter', 2, ['Dark clouds gathered over our picnic.', 'We carried our food into a shelter.', 'Rain fell, but the food stayed dry.']],
  ['repair', 2, ['The toy car stopped because a wheel fell off.', 'Tariq found the wheel under a chair.', 'He fitted it back on, and the car rolled again.']],
  ['lost', 2, ['Ari could not find his yellow glove.', 'He looked beside the gate where he had dropped it.', 'He found the glove and put it on.']],
  ['harvest', 2, ['Our bean pods grew long and green.', 'We picked the ripe pods into a bowl.', 'After washing them, we cooked them for lunch.']],
];
const LETTER_MATCHES = [
  ['round', 1, ['A', 'M', 'T']], ['lines', 1, ['E', 'F', 'L']], ['curves', 1, ['C', 'O', 'S']],
  ['similar', 2, ['B', 'D', 'P']], ['tails', 2, ['G', 'J', 'Q']], ['angles', 2, ['N', 'V', 'W']],
];
const RELATION_MATCHES = [
  ['same-everyday', 1, 'synonyms', ['small', 'fast', 'glad'], ['little', 'quick', 'happy']],
  ['same-actions', 1, 'synonyms', ['start', 'shut', 'look'], ['begin', 'close', 'see']],
  ['same-precise', 2, 'synonyms', ['silent', 'enormous', 'difficult'], ['quiet', 'huge', 'hard']],
  ['opposite-size', 1, 'antonyms', ['big', 'hot', 'wet'], ['small', 'cold', 'dry']],
  ['opposite-space', 1, 'antonyms', ['up', 'inside', 'near'], ['down', 'outside', 'far']],
  ['opposite-quality', 2, 'antonyms', ['heavy', 'rough', 'empty'], ['light', 'smooth', 'full']],
];
const TEXT_SELECTIONS = [
  ['first-clouds', 'print_concepts', 1, 'first', 'Clouds cover the moon.', 0],
  ['first-please', 'print_concepts', 1, 'first', 'Please leave your shoes here.', 0],
  ['last-pond', 'print_concepts', 1, 'last', 'The ducks swim in the pond.', 5],
  ['last-question', 'print_concepts', 1, 'last', 'Who has the green bag?', 4],
  ['first-after', 'print_concepts', 2, 'first', 'After lunch, we visit the garden.', 0],
  ['last-tomorrow', 'print_concepts', 2, 'last', 'We will finish the model tomorrow.', 5],
  ['capital-i', 'capitalization', 1, 'capital', 'Sam and i fed the rabbit.', 2],
  ['capital-start', 'capitalization', 1, 'capital', 'we found a smooth stone.', 0],
  ['capital-name', 'capitalization', 1, 'capital', 'My friend maya has a drum.', 2],
  ['capital-day', 'capitalization', 2, 'capital', 'We will swim on tuesday.', 4],
  ['capital-month', 'capitalization', 2, 'capital', 'The class trip is in june.', 5],
  ['capital-place', 'capitalization', 2, 'capital', 'Our cousin lives in london.', 4],
];
const DETAILS = [
  ['paper', 'Our classroom saves paper. We use both sides of each sheet. Scrap paper goes in a reuse box. The door is blue.',
    ['We use both sides of each sheet.', 'Our door is blue.', 'We put scrap paper in a reuse box.', 'Our classroom has a door.'], [0, 2]],
  ['shade', 'Trees help keep the playground cool. Their leaves block sunlight. Their shade covers the benches. Birds sometimes sit on the branches.',
    ['Birds sit on branches.', 'Leaves block sunlight.', 'Trees have branches.', 'Shade covers the benches.'], [1, 3]],
  ['safety', 'A helmet helps protect a cyclist. Its hard shell covers the head. Its soft lining cushions a bump. Some helmets have blue stripes.',
    ['Some helmets have blue stripes.', 'A hard shell covers the head.', 'A soft lining cushions a bump.', 'Helmets can have stripes.'], [1, 2]],
  ['garden', 'Our class cares for the garden. We water dry plants. We remove weeds around the vegetables. A red gate stands beside the garden.',
    ['We water dry plants.', 'The gate is red.', 'The garden has a gate.', 'We remove weeds around vegetables.'], [0, 3]],
];
const WORD_BUILDS = [
  ['cat', 'cvc_short_vowels', ['c', 'a', 't', 'o']],
  ['dog', 'cvc_short_vowels', ['d', 'o', 'g', 'i']],
  ['hen', 'cvc_short_vowels', ['h', 'e', 'n', 'a']],
  ['sun', 'cvc_short_vowels', ['s', 'u', 'n', 'e']],
  ['ship', 'digraphs', ['sh', 'i', 'p', 'ch']],
  ['duck', 'digraphs', ['d', 'u', 'ck', 'ch']],
];

const choicesFor = labels => labels.map((label, index) => ({ id: `c${index}`, label }));
const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text) });
function base(id, skillId, domainId, level, format, prompt, choices, answer, extras = {}) {
  return { id: `mock.${id}`, skillId, domainId, level, format, prompt, choices, answer,
    answerMode: format === 'multi_select' ? 'set' : ['order', 'match'].includes(format) ? 'sequence' : 'exact',
    requiredAudioCues: [instruction(prompt)], modality: 'reading',
    sourceProvenance: { kind: 'original_mock_practice', file: 'src/data/literacyMockItems.js', sourceId: id },
    ...extras };
}

export async function loadLiteracyMockItems() {
  const items = [];
  for (const [id, level, words, indices] of RHYMES) {
    const choices = choicesFor(words).map(choice => ({ ...choice, image: literacyMockObjectImage(choice.label), imageAlt: choice.label }));
    items.push(base(`rhyme.${id}`, 'rhyming', 'sound_awareness', level, 'multi_select', LITERACY_MOCK_PROMPTS.rhyme,
      choices, indices.map(index => `c${index}`), { modality: 'listening', hideWrittenLabels: true, selectCount: 2,
        constructClaim: 'spoken_rhyme_pair', requiredAudioCues: [instruction(LITERACY_MOCK_PROMPTS.rhyme),
          ...choices.map(choice => ({ role: 'choice', choiceId: choice.id, value: choice.label, text: choice.label, path: getLedaWordAudioPath(choice.label) }))],
        stimulusKey: `spoken-rhyme:${[...words].sort().join('|')}` }));
  }
  for (const [id, level, words, indices] of PLURALS) items.push(base(`plurals.${id}`, 'plurals', 'language', level,
    'multi_select', LITERACY_MOCK_PROMPTS.plural, choicesFor(words), indices.map(index => `c${index}`),
    { selectCount: 2, constructClaim: 'recognize_plural_word_forms', stimulusKey: words.join('|') }));
  for (const [id, level, words] of WORD_ORDERS) items.push(base(`sentence.${id}`, 'writing_organization', 'writing', level,
    'order', LITERACY_MOCK_PROMPTS.words, choicesFor(words), words.map((_, index) => `c${index}`),
    { sequenceLength: words.length, constructClaim: 'sentence_word_order', stimulusKey: words.join(' ') }));
  for (const [id, level, sentences] of SENTENCE_ORDERS) items.push(base(`sequence.${id}`, 'writing_organization', 'writing', level,
    'order', LITERACY_MOCK_PROMPTS.sentences, choicesFor(sentences), sentences.map((_, index) => `c${index}`),
    { sequenceLength: sentences.length, constructClaim: 'coherent_event_order', stimulusKey: sentences.join(' ') }));
  for (const [id, level, letters] of LETTER_MATCHES) items.push(base(`letters.${id}`, 'letter_knowledge', 'print', level,
    'match', LITERACY_MOCK_PROMPTS.letters, choicesFor(letters.map(letter => letter.toLowerCase())), letters.map((_, index) => `c${index}`),
    { matchTargets: letters.map((label, index) => ({ id: `m${index}`, label })), constructClaim: 'letter_case_correspondence', stimulusKey: `letter-pairs:${letters.join('')}` }));
  for (const [id, level, relation, targets, answers] of RELATION_MATCHES) items.push(base(`relations.${id}`, 'antonyms_synonyms', 'vocabulary', level,
    'match', LITERACY_MOCK_PROMPTS[relation], choicesFor(answers), answers.map((_, index) => `c${index}`),
    { matchTargets: targets.map((label, index) => ({ id: `m${index}`, label })), constructClaim: relation, stimulusKey: targets.join('|') }));
  for (const [id, skillId, level, promptKey, passage, answerIndex] of TEXT_SELECTIONS) items.push(base(`text.${id}`, skillId,
    skillId === 'capitalization' ? 'writing' : 'print', level, 'select_text', LITERACY_MOCK_PROMPTS[promptKey],
    choicesFor(passage.split(' ')).map((choice, tokenIndex) => ({ ...choice, tokenIndex })), `c${answerIndex}`,
    { passage, constructClaim: promptKey === 'capital' ? 'locate_missing_capital' : `${promptKey}_word` }));
  for (const [id, passage, choices, indices] of DETAILS) items.push(base(`evidence.${id}`, 'informational_features', 'reading', 2,
    'multi_select', LITERACY_MOCK_PROMPTS.details, choicesFor(choices), indices.map(index => `c${index}`),
    { passage, selectCount: 2, constructClaim: 'select_supporting_evidence' }));
  for (const [word, skillId, tiles] of WORD_BUILDS) items.push(base(`build.${word}`, skillId, 'phonics', 1,
    'build_word', LITERACY_MOCK_PROMPTS.build, choicesFor(tiles), word,
    { modality: 'recognition', targetWord: word, image: literacyMockObjectImage(word),
      imageAlt: word, constructClaim: 'construct_dictated_word', stimulusKey: word,
      requiredAudioCues: [instruction(LITERACY_MOCK_PROMPTS.build), { role: 'target_word', text: word, path: getLedaWordAudioPath(word) }] }));
  for (const item of items) {
    item.tutorialOnly = Object.values(LITERACY_MOCK_TUTORIAL_IDS).includes(item.id);
    const keys = Array.isArray(item.answer) ? item.answer : [item.answer];
    const labels = keys.map(key => item.choices.find(choice => choice.id === key)?.label || key);
    if (item.format === 'order') item.explanation = `The complete ordered response is: ${labels.join(' ')}`;
    else if (item.format === 'match') item.explanation = item.matchTargets.map((target, index) => `${target.label} matches ${labels[index]}.`).join(' ');
    else if (item.format === 'build_word') item.explanation = `The sounds and letters form ${item.answer}. The extra tile does not belong in this word.`;
    else if (item.constructClaim === 'spoken_rhyme_pair') item.explanation = `${labels.join(' and ')} share an ending sound. The other pictured words have different endings.`;
    else if (item.constructClaim === 'recognize_plural_word_forms') item.explanation = `${labels.join(' and ')} name more than one. The other words are singular.`;
    else if (item.constructClaim === 'select_supporting_evidence') item.explanation = `These details explain the main idea: ${labels.join(' ')} The other details do not explain that idea.`;
    else if (item.constructClaim === 'locate_missing_capital') item.explanation = `${labels[0]} needs its first letter changed to a capital in this sentence.`;
    else item.explanation = `${labels[0]} is the ${item.constructClaim === 'first_word' ? 'first' : 'last'} word in the printed sentence.`;
    item.distractorRationales = Object.fromEntries(item.choices.filter(choice => !keys.includes(choice.id)).map(choice => [choice.id,
      item.constructClaim === 'spoken_rhyme_pair' ? `${choice.label} does not share the ending sound of the rhyming pair.`
        : item.constructClaim === 'recognize_plural_word_forms' ? `${choice.label} names one, so it does not belong in the plural set.`
          : item.constructClaim === 'select_supporting_evidence' ? `${choice.label} is a detail, but it does not explain the stated main idea.`
            : item.format === 'select_text' ? `${choice.label} is not the word at the requested position or the word with the missing capital.`
              : 'All response pieces must be used in the required arrangement.']));
    if (item.format === 'build_word') item.distractorRationales = {
      [item.choices.at(-1).id]: `${item.choices.at(-1).label} is an extra tile. It does not belong in the dictated word.`,
    };
    const paths = [item.image, ...item.choices.map(choice => choice.image)].filter(Boolean);
    if (paths.length) item.sourceProvenance.assets = [{
      kind: 'original_generated_object_atlas', provider: 'OpenAI image_gen', generatedOn: '2026-10-07',
      ...LITERACY_MOCK_ATLAS, display: 'Whole reviewed 256px cell; delivery encoding only; no NWEA artwork reused',
    }];
    item.mediaDecision = { role: paths.length ? 'target-or-answer-cards' : 'text-only', paths,
      constructReview: 'approved', answerNeutral: paths.length ? 'approved' : 'not-applicable: printed evidence',
      reason: paths.length ? 'Reviewed original flat object illustrations use one consistent style across all choices and identify spoken objects without displaying spellings.'
        : 'The complete printed words, sentences, or reference material supply the evidence.' };
  }
  return items;
}

export async function listLiteracyMockAudioGaps() {
  const items = await loadLiteracyMockItems();
  const gaps = new Map();
  for (const item of items) for (const cue of item.requiredAudioCues.filter(value => !value.path)) {
    const gap = gaps.get(cue.text) || { role: cue.role === 'choice' ? 'isolated_word' : 'assessment_prompt', text: cue.text, itemIds: [] };
    gap.itemIds.push(item.id);
    gaps.set(cue.text, gap);
  }
  return [...gaps.values()];
}
