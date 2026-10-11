import { applyLiteracyMockFoundationMediaReview } from './literacyMockFoundationMedia.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';
import { getPreferredPhonemeAudioPath } from './phonemeAudioBank.js';
import { MOCK_PATTERN_WORDS } from './literacyMockFoundationWords.js';
import { buildLiteracyMockFoundationSilentECapacity } from './literacyMockFoundationSilentECapacity.js';
import { buildLiteracyMockFoundationBlendCapacity } from './literacyMockFoundationBlendCapacity.js';
import { buildLiteracyMockFoundationWordContrastCapacity } from './literacyMockFoundationWordContrastCapacity.js';
import { buildLiteracyMockFoundationReadingCapacity } from './literacyMockFoundationReadingCapacity.js';

const SOURCE = 'src/data/literacyMockFoundationCapacity.js';
const PLANNED_PICTURE_ROOT = '/images/assessment/literacy-mock/capacity/foundation-';
const plannedPicture = word => `${PLANNED_PICTURE_ROOT}${word}.webp`;
// Exact existing illustrations inspected for this Mock extension; no generated
// placeholder or guessed path substitutes for a missing target picture.
const REVIEWED_FOUNDATION_PICTURES = Object.freeze({
  nose: '/images/assessment/objective-words/nose.webp',
  ball: '/images/assessment/release-support/targets/ball-8bec04.webp',
  straw: '/images/child-mode/vocabulary/straw.webp',
  trip: '/images/child-mode/vocabulary/trip.webp',
  sink: '/images/child-mode/vocabulary/sink.webp',
  lake: '/images/assessment/long-vowels/lake.webp',
  snow: '/images/assessment/long-vowels/snow.webp',
  cow: '/images/assessment/release-support/targets/cow-8bbddb.webp',
  jeep: '/images/assessment/release-support/targets/jeep-877f6f.webp',
  rip: '/images/assessment/release-support/targets/rip-ab8e59.webp',
  cloud: '/images/child-mode/blends/cloud.webp',
  stone: '/images/assessment/release-support/targets/stone-e30bfd.webp',
  sky: '/images/assessment/long-vowels/sky.webp',
  snail: '/images/assessment/release-support/targets/snail-9054cc.webp',
  snack: '/images/assessment/release-support/targets/snack-1ba61a.webp',
  paint: '/images/assessment/release-support/targets/paint-039f7b.webp',
  print: '/images/assessment/release-support/targets/print-6d0d58.webp',
  wink: '/images/assessment/release-support/targets/wink-050522.webp',
  bank: '/images/assessment/release-support/targets/bank-bdd240.webp',
  drink: '/images/assessment/release-media/drink-d876a37b.webp',
  chip: '/images/assessment/objective-words/chip.webp',
  kite: '/images/child-mode/initial-sounds/kite.webp',
  leaf: '/images/child-mode/initial-sounds/leaf.webp',
  car: '/images/child-mode/initial-sounds/car.webp',
  bear: '/images/child-mode/initial-sounds/bear.webp',
  train: '/images/assessment/objective-words/train.webp',
  chair: '/images/assessment/digraphs/chair.webp',
  tap: '/images/assessment/objective-words/tap.webp',
  jet: '/images/assessment/objective-words/jet.webp',
  flute: '/images/assessment/objective-words/flute.webp',
  brown: '/images/assessment/blends/brown.webp',
  broom: '/images/assessment/blends/broom.webp',
  fruit: '/images/assessment/blends/fruit.webp',
  skip: '/images/assessment/generated/concepts/skip.webp',
  spin: '/images/child-mode/initial-sounds/spin.webp',
  plant: '/images/assessment/blends/plant.webp',
  trunk: '/images/assessment/generated/concepts/trunk.webp',
  salt: '/images/assessment/generated/concepts/salt.webp',
  quilt: '/images/assessment/objective-words/quilt.webp',
  raft: '/images/assessment/generated/concepts/raft.webp',
  left: '/images/assessment/generated/concepts/left.webp',
  hand: '/images/assessment/blends/hand.webp',
  clap: '/images/assessment/blends/clap.webp',
  red: '/images/child-mode/initial-sounds/red.webp',
  desk: '/images/assessment/blends/desk.webp',
  bin: '/images/child-mode/initial-sounds/bin.webp',
  list: '/images/assessment/generated/concepts/list.webp',
  hop: '/images/child-mode/initial-sounds/hop.webp',
  top: '/images/child-mode/initial-sounds/top.webp',
  cot: '/images/child-mode/initial-sounds/cot.webp',
  rug: '/images/assessment/objective-words/rug.webp',
  truck: '/images/assessment/digraphs/truck.webp',
  stump: '/images/child-mode/reviewed/letter-leap/stump.webp',
  jump: '/images/assessment/generated/concepts/jump.webp',
  shop: '/images/child-mode/initial-sounds/shop.webp',
  bath: '/images/assessment/digraphs/bath.webp',
  dish: '/images/assessment/digraphs/dish.webp',
  chill: '/images/child-mode/reviewed/chill.webp',
});


// Reviewed word inventories, not random spelling permutations. The extension
// words already belong to the real-word lexicon; the corresponding phonics
// mappings are checked by the focused authoring test. Level 2 preserves the
// medial-vowel operation while adding a consonant cluster to the spoken word.
export const MOCK_SHORT_VOWEL_INVENTORY = Object.freeze({
  short_a: { 1: 'cat hat map pan bag cap rat jam van man nap bat',
    2: 'crab flag hand lamp band clap flap trap sand camp stamp' },
  short_e: { 1: 'bed red hen net pet leg peg ten web wet jet pen vet',
    2: 'belt desk nest sled tent vest bench step melt dress chest' },
  short_i: { 1: 'pig wig pin sip hit lid bin fin kit bit rip dig zip tin sit rim',
    2: 'brick gift swim click lift slip milk list mist trip grin' },
  short_o: { 1: 'pot dog log mop hop top cot rod fog dot pop hog cod',
    2: 'clock fox frog pond spot stomp stop drop plot cross loft' },
  short_u: { 1: 'sun bug cup mud rug tub cub cut hug jug mug nut pup tug dug hut fun',
    2: 'brush drum plug truck clump plum stump lump crust jump bump' },
});

export const MOCK_FOUNDATION_FINITE_INVENTORIES = Object.freeze([
  {
    skillId: 'long_vowels', constructClaim: 'complete_split_vowel_spelling:e_e',
    levels: [1, 2], policy: 'exposure_only',
    reviewedTargets: ['theme', 'scene', 'these', 'complete', 'concrete', 'athlete'],
    reason: 'The phonics blueprint explicitly treats e_e as sparse recognition-only, non-gating exposure. Do not add rare or advanced words to manufacture ten observations at either level.',
    authority: 'docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md',
  },
]);

const REVIEWED_WORD_RECORDINGS = Object.freeze({
  serve: {
    path:'/audio/production/en-US/isolated_word/serve-70969b02b3.mp3',
    recordedText:'Serve',
    sha256:'77e7c52a219604326913d4dbc011f72533fe2c94482a47a1a52819dbbe986689',
    sourceCommit:'c2fbfa043b80811f803a7ddeba08ad9db3f7653f',
    deliveryCommit:'d078e2abb085e9938e17c1b52da4af4adf7c12be',
    reason:'Whole existing Leda recording preserves the authored word; no splice or new synthesis.',
  },
});
const wordCue = word => {
  const recording = REVIEWED_WORD_RECORDINGS[word];
  return { role:'target_word',text:word,path:recording?.path || getLedaWordAudioPath(word),
    ...(recording ? {recordingProvenance:recording} : {}) };
};
const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text) });
const labels = values => values.map((label, index) => ({ id: `c${index}`, label }));
const normalized = text => String(text || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const slug = text => text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/** A final-word location and a sentence count are separate print operations. */
export function correctLiteracyMockFoundationDemand(item) {
  if (item.id === 'literacy.print_concepts.sentence-end') return { ...item, constructClaim: 'sentence_end_location' };
  if (item.id === 'literacy.print_concepts.two-sentences') return { ...item, constructClaim: 'sentence_count' };
  if (['mock.letters.round', 'mock.letters.lines', 'mock.letters.curves', 'mock.letters.upright',
    'mock.letters.similar', 'mock.letters.tails', 'mock.letters.angles'].includes(item.id)) {
    return { ...item, tutorialOnly: true };
  }
  return item;
}

/** Exact reviewed limits; a finite content domain never lowers an evidence threshold. */
export function literacyMockFoundationFinitePolicy(item) {
  if (item.skillId === 'capitalization' && item.constructClaim === 'supply_weekday_capital_form') return {
    policyId: 'capitalization:seven-weekdays', taskKey: literacyMockTaskKey(item), level: item.level,
    controlledTargets: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    maximumIndependentTargets: 7, kind: 'closed_lexical_inventory',
    reason: 'The exact operation supplies one weekday and asks for its capitalized form. English has seven weekday names; a different sentence wrapper for Tuesday does not add an independent lexical target. Locating an unmarked capitalization error is a different task.',
    authority: ['docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md#2-originality-rules-the-anti-slop-core'],
    followUpGuidance: 'Use unpractised weekday targets in this inventory, then collect comparable independent writing evidence outside the practice bank. The shared evidence threshold remains unchanged.',
  };
  if (item.skillId === 'long_vowels' && item.constructClaim === 'identify_read_split_vowel_sound:u_e' && item.level === 2) return {
    policyId: 'silent-e:reviewed-short-long-u-pairs', taskKey: literacyMockTaskKey(item), level: item.level,
    controlledTargets: ['cub/cube', 'cut/cute', 'tub/tube'], maximumIndependentTargets: 3,
    kind: 'reviewed_sparse_inventory',
    reason: 'The reviewed common u_e short-to-long pairs keep the other consonant phonemes unchanged. Us/use and hug/huge change consonants; rare words are not introduced to manufacture ten examples.',
    authority: ['docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md#12-long-vowels--silent-e-long_vowels_silent_e--withdraw--rebuild-p0'],
    followUpGuidance: 'Use the remaining reviewed short-to-long pair, then gather comparable independent evidence outside this finite bank. Do not lower the shared threshold or treat new distractor orders as fresh targets.',
  };
  if (item.skillId === 'letter_knowledge' && item.constructClaim === 'letter_case_correspondence') return {
    policyId: 'letter-case:english-alphabet', taskKey: literacyMockTaskKey(item), level: item.level,
    controlledTargets: [...'abcdefghijklmnopqrstuvwxyz'], maximumIndependentTargets: 26,
    kind: 'closed_letter_inventory',
    reason: 'The English alphabet has 26 letter targets. Each scored probe matches one capital to its corresponding lowercase form; repeating that target at another level or in another grouping is familiar evidence. A new learner has more than ten available targets.',
    authority: ['docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md#2-originality-rules-the-anti-slop-core'],
    followUpGuidance: 'Use remaining unpractised letter targets. Once this learner has seen the inventory, collect comparable independent evidence outside this bank; reshuffling the same letters is familiar practice.',
  };
  const target = normalized(item.targetWord || item.audioText);
  const suppliedHfwTarget = item.skillId?.startsWith('hfw_') && target
    && normalized(item.constructClaim) === target && ['build_word', 'choice'].includes(item.format)
    && (item.requiredAudioCues || []).some(cue => cue.role === 'target_word' && normalized(cue.text) === target);
  const dictatedHfw = suppliedHfwTarget && item.format === 'build_word';
  const sparseSplitE = item.skillId === 'long_vowels' && item.constructClaim === 'complete_split_vowel_spelling:e_e';
  const dearGreeting = item.skillId === 'punctuation' && item.constructClaim === 'greeting'
    && item.choices?.some(choice => /^Dear [^,?.!]+,$/.test(choice.label));
  if (!suppliedHfwTarget && !sparseSplitE && !dearGreeting) return null;
  if (dearGreeting) return {
    policyId: 'friendly-letter:dear-name-comma', taskKey: literacyMockTaskKey(item), level: item.level,
    controlledTargets: ['Dear recipient,'], maximumIndependentTargets: 1, kind: 'closed_salutation_pattern',
    reason: 'These items test the same Dear recipient comma pattern. Changing only the recipient name does not create independent punctuation evidence; vocatives or whole-letter organization are different tasks.',
    authority: ['docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md#2-originality-rules-the-anti-slop-core'],
    followUpGuidance: 'Use the available salutation example for this narrow check. Collect comparable independent writing evidence outside this finite practice bank; repeating the same greeting pattern does not provide ten fresh examples.',
  };
  const controlledTargets = suppliedHfwTarget ? [target] : item.level === 1
    ? ['theme', 'scene', 'these'] : ['complete', 'concrete', 'athlete'];
  return {
    policyId: suppliedHfwTarget ? `fixed-hfw:${item.skillId}:${target}` : `reviewed-split-e:l${item.level}`,
    taskKey: literacyMockTaskKey(item), level: item.level, controlledTargets,
    maximumIndependentTargets: controlledTargets.length,
    kind: suppliedHfwTarget ? 'closed_lexical_target' : 'reviewed_sparse_inventory',
    reason: dictatedHfw
      ? 'This exact task dictates one fixed word and asks for its spelling. A new sentence wrapper or tile order does not create a new independent spelling target.'
      : suppliedHfwTarget ? 'This exact task supplies one fixed spoken word and asks the learner to recognize its printed form. A new sentence wrapper or distractor order does not create a new independent lexical target.'
        : 'The phonics blueprint limits e_e to sparse recognition-only exposure. These are the reviewed words at this level; rare or advanced words are not added to fill an evidence quota.',
    authority: suppliedHfwTarget ? ['docs/skills-assessment-rebuild/BLUEPRINTS_HFW.md', 'docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md#2-originality-rules-the-anti-slop-core']
      : ['docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md'],
    followUpGuidance: 'Use any remaining fresh example to check this task. When the reviewed inventory is exhausted, collect comparable independent evidence outside this finite practice bank. Repetition remains useful practice but does not add a fresh target.',
  };
}

export function buildLiteracyMockFoundationCapacityPolicy(bank) {
  const policies = new Map();
  for (const item of bank) {
    const policy = literacyMockFoundationFinitePolicy(item);
    if (policy) policies.set(JSON.stringify([policy.taskKey, policy.level, policy.policyId]), policy);
  }
  return [...policies.values()];
}

const FIRST_SENTENCES = [
  'Rabbits hide underground.', 'Morning light filled my room.', 'Watch that rolling ball!',
  'After lunch, we planted seeds.', 'Our bus stopped beside the pond.', 'Two red kites touched the clouds.',
  'Please pass the empty bowl.', 'Under this stone lives a beetle.', 'Every shelf holds three boxes.',
  'Wind shook the tall grass.', 'Some shells have tiny holes.', 'Before bed, I feed my fish.',
  'Nobody opened the blue gate.', 'Can your little dog jump?', 'Today feels warm and sunny.',
  'Across the yard rolled a tyre.', 'That ladder reaches the roof.', 'Inside my boot was a pebble.',
  'Five children shared one umbrella.', 'Listen to the owl outside.',
];
const LAST_SENTENCES = [
  'A moth flew past me.', 'Put the dry leaves here.', 'The youngest duck swam first.',
  'Which box holds the string?', 'We heard thunder during breakfast.', 'This path ends at a bridge.',
  'My sandwich fell upside down.', 'The paint is almost dry.', 'She folded the paper twice.',
  'One mitten was still missing.', 'A bell rang above us.', 'Carry the bucket with both hands.',
  'The puppy ran through the sprinkler.', 'I can see a distant island.', 'Do these socks belong together?',
  'We found a footprint in clay.', 'Grandad left his glasses upstairs.', 'That branch bends without breaking.',
  'Please keep the receipt safe.', 'Her bicycle stood against the wall.',
];
const WORD_COUNTS = {
  1: ['Birds gather.', 'Turn the handle.', 'We chose this seat.', 'My socks are still wet.',
    'A red leaf landed beside me.', 'You may borrow our big blue umbrella.',
    'Did the small boat reach the island?', 'Seven ducks slept under a tree.',
    'Close both doors.', 'A tiny ant climbed up my sleeve.'],
  2: ['Don’t touch Ben’s paint.', '“Who’s there?” asked Meg.', 'I can’t find Dad’s left shoe.',
    '“It’s mine!” cried the small boy.', 'Sam’s kitten wouldn’t come inside.',
    '“We’ll wait,” said Mrs Bell.', 'The twins’ tent wasn’t empty.',
    '“That’s enough,” Mum told us.', 'You’ve left Jo’s coat behind.', '“I’m ready!” called Mr Green.'],
};
const BOUNDARY_WORDS = { first_letter: 'sun dog pet van fox jug kit bed log map', last_letter: 'bus hen cup red wax zip tag jam wet fin' };
const UNIT_CHOICES = {
  1: [ ['frog','f','frog hops'], ['kite','k','a kite'], ['ship','s','big ship'], ['tent','t','the tent'],
    ['clock','c','that clock'], ['brush','b','my brush'], ['rain','r','cold rain'], ['lamp','l','a lamp'],
    ['sock','s','one sock'], ['nest','n','bird nest'] ],
  2: [ ['green leaf','sunlight','we went home'], ['small boat','raincoat','birds fly away'],
    ['my lunch','cupboard','pick it up'], ['two hands','notebook','a red bag'],
    ['warm soup','bedroom','she can hop'], ['your turn','seashell','put it here'],
    ['after school','firefly','an old tree'], ['under water','snowball','they are ready'],
    ['three eggs','doorbell','can you swim'], ['open slowly','toothbrush','a little mouse'] ],
};

// Whole-word anchors provide the replacement sound without pronouncing an
// isolated phoneme through TTS or naming the completed answer. Every foil is
// either the unchanged source word or a different one-sound operation.
const ORAL_CHANGES = {
  substitute_initial: [
    ['dog','leaf','log','dog','dig'], ['pig','water','wig','pig','pin'],
    ['hen','table','ten','hen','pen'], ['map','sock','sap','map','mat'],
    ['bag','rabbit','rag','bag','big'], ['net','sun','set','net','nut'],
    ['bed','rabbit','red','bed','bet'], ['cat','moon','mat','cat','cut'],
  ],
  substitute_final: [
    ['cat','cup','cap','cat','can'], ['cup','hat','cut','cup','cap'],
    ['pin','cat','pit','pin','pan'], ['bed','hat','bet','bed','bid'],
    ['bag','sun','ban','bag','bug'], ['fan','cat','fat','fan','fin'],
    ['tap','sun','tan','tap','tip'], ['net','duck','neck','net','nest'],
  ],
  delete_phoneme: [
    ['clap','','lap','clap','cap'], ['slip','','lip','slip','sip'],
    ['smile','','mile','smile','slim'], ['train','','rain','train','tray'],
    ['glow','','low','glow','go'], ['stop','','top','stop','step'],
    ['spot','','pot','spot','spit'], ['stack','','tack','stack','sack'],
  ],
  add_phoneme: [
    ['lip','cat','clip','lip','clap'], ['lock','cat','clock','lock','cluck'],
    ['rain','tiger','train','rain','tray'], ['pot','sun','spot','pot','stop'],
    ['tar','sun','star','tar','sat'], ['lap','cat','clap','lap','cap'],
    ['mile','sun','smile','mile','slim'], ['low','goat','glow','low','go'],
  ],
};
const COMPOUND_CHANGES = [ ['bedroom','bed','room','bed','broom'],
  ['raincoat','coat','rain','coat','ray'], ['sunset','sun','set','sun','sit'],
  ['seashell','sea','shell','sea','sell'], ['backpack','pack','back','pack','black'] ];
const BLEND_CHANGES = [ ['frog',['f','r','o','g'],'fog','from'],
  ['drum',['d','r','u','m'],'dream','drip'], ['nest',['n','e','s','t'],'net','vest'],
  ['flag',['f','l','a','g'],'lag','flap'], ['crab',['k','r','a','b'],'cab','crib'],
  ['tent',['t','e','n','t'],'ten','tint'], ['lamp',['l','a','m','p'],'lap','limp'],
  ['milk',['m','i','l','k'],'mill','silk'] ];
const FINAL_COMPARISONS = [
  [1,'fish','sh','brush','fox','fan'], [1,'sock','k','duck','sun','hat'],
  [2,'hand','d','bed','hen','hat'], [2,'tent','t','cat','pen','dog'],
  [2,'milk','k','duck','bell','mug'], [2,'desk','k','duck','bus','dog'],
  [2,'belt','t','cat','bell','bed'], [2,'jump','p','cup','jam','jug'],
  [2,'sand','d','bed','sun','sock'], [2,'mask','k','duck','bus','mug'],
];
const RHYME_PAIRS = {
  1: [ ['pig','wig','pen','dog'], ['fan','van','fish','bed'], ['mug','jug','hat','pen'],
    ['map','cap','mop','sun'], ['tin','pin','cat','bus'], ['bun','sun','bus','bed'],
    ['leg','peg','lid','fan'] ],
  2: [ ['coat','boat','cat','cake'], ['wheel','seal','sheep','shell'],
    ['phone','bone','rose','pen'], ['meat','feet','mat','net'],
    ['moon','spoon','mop','sun'], ['spring','ring','splash','ship'],
    ['rock','clock','fox','log'], ['shell','bell','bed','ship'] ],
};

function addPictureSoundItems(bank, pictures, output) {
  const asPictures = values => labels(values).map(choice => {
    const image = pictures.get(choice.label);
    if (!image) throw new Error(`Missing reviewed foundation picture: ${choice.label}`);
    return { ...choice, image, imageAlt: choice.label };
  });
  const choiceCues = choices => choices.map(choice => ({ role: 'choice', choiceId: choice.id,
    value: choice.label, text: choice.label, path: getLedaWordAudioPath(choice.label) }));
  for (const [level, word, sound, correct, d1, d2] of FINAL_COMPARISONS) {
    const template = bank.find(item => item.skillId === 'final_sounds' && item.level === level
      && item.constructClaim === 'final_sound_discrimination' && item.evidenceModality === 'audio+image');
    const alternatives = [correct, d1, d2], shift = output.length % 3;
    const choices = asPictures([...alternatives.slice(shift), ...alternatives.slice(0, shift)]);
    const answer = choices.find(choice => choice.label === correct).id;
    output.push(authoredItem(template, `final.l${level}.${word}`, { choices, answer,
      targetWord: word, stimulusKey: word, exposureFamilyId: `mock-foundation-final:${word}`,
      requiredAudioCues: [instruction(template.prompt), wordCue(word), ...choiceCues(choices)],
      explanation: `${word} and ${correct} both finish with /${sound}/. Neither other spoken choice has that final phoneme.`,
      distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== answer).map(choice => [choice.id,
        `${choice.label} does not finish with the target phoneme /${sound}/.`])),
      difficultyEvidence: level === 2 ? 'Isolate the last phoneme within a final consonant cluster instead of selecting another sound inside the word.'
        : 'Compare the final consonant phoneme of two familiar spoken words.',
      mediaDecision: { role: 'answer-cards', paths: choices.map(choice => choice.image), constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Existing reviewed pictures identify exact spoken alternatives. Printed word labels remain hidden.' },
    }));
  }
  for (const [levelText, rows] of Object.entries(RHYME_PAIRS)) {
    const level = Number(levelText);
    const template = bank.find(item => item.skillId === 'rhyming' && item.level === level && item.format === 'multi_select' && !item.tutorialOnly);
    for (const [correct, partner, d1, d2] of rows) {
      const alternatives = [correct, d1, partner, d2];
      const shift = output.length % 4;
      const choices = asPictures([...alternatives.slice(shift), ...alternatives.slice(0, shift)]);
      const answer = choices.filter(choice => [correct, partner].includes(choice.label)).map(choice => choice.id);
      const pair = [correct, partner].sort().join('-');
      output.push(authoredItem(template, `rhyme-pair.l${level}.${pair}`, { choices, answer, selectCount: 2,
        stimulusKey: `rhyme-pair:${pair}`, exposureFamilyId: `mock-rhyme-pair:${pair}`, hideWrittenLabels: true,
        requiredAudioCues: [instruction(template.prompt), ...choiceCues(choices)],
        explanation: `${correct} and ${partner} share the complete spoken ending. The other words do not make another rhyming pair.`,
        distractorRationales: Object.fromEntries(choices.filter(choice => !answer.includes(choice.id)).map(choice => [choice.id,
          `${choice.label} does not share the complete vowel-and-ending sequence of the rhyming pair.`])),
        difficultyEvidence: level === 2 ? 'Compare long-vowel or consonant-cluster rimes, or reject a near rime that keeps the vowel but changes the final phoneme.'
          : 'Find a complete shared short-vowel rime across different initial sounds.',
        mediaDecision: { role: 'answer-cards', paths: choices.map(choice => choice.image), constructReview: 'approved', answerNeutral: 'approved',
          reason: 'Four existing reviewed illustrations identify separately replayable spoken words; their spellings are hidden.' },
      }));
    }
  }
}

function addOralChanges(bank, output) {
  for (const [claim, rows] of Object.entries(ORAL_CHANGES)) {
    const template = bank.find(item => item.skillId === 'sound_manipulation' && item.constructClaim === claim && item.level === 2);
    for (const [word, anchor, correct, d1, d2] of rows) {
      const first = claim !== 'substitute_final';
      const speech = claim === 'delete_phoneme' ? `Say ${word}. Take away its first sound. What word remains?`
        : claim === 'add_phoneme' ? `Say ${word}. Add the first sound in ${anchor} at the beginning.`
          : `Say ${word}. Change its ${first ? 'first' : 'last'} sound to the ${first ? 'first' : 'last'} sound in ${anchor}.`;
      add(template, `${claim}.${word}.${anchor || 'first'}`, speech, correct, d1, d2,
        claim === 'delete_phoneme' ? `Removing only the initial phoneme from ${word} leaves ${correct}.`
          : claim === 'add_phoneme' ? `Adding the first sound of ${anchor} before ${word} makes ${correct}.`
            : `Replacing only the ${first ? 'initial' : 'final'} phoneme of ${word} with the ${first ? 'first' : 'last'} sound of ${anchor} makes ${correct}.`,
        `Retain the other phonemes while performing exactly one ${claim.replaceAll('_', ' ')} operation.`,
        `oral-operation:${claim}:${word}:${anchor || 'first'}`);
    }
  }
  const compoundTemplate = bank.find(item => item.skillId === 'sound_manipulation' && item.constructClaim === 'delete_word_part');
  for (const [word, removed, correct, d1, d2] of COMPOUND_CHANGES) {
    add(compoundTemplate, `compound.${word}`, `Listen. ${word}. Take away ${removed}. Tap what is left.`, correct, d1, d2,
      `Removing the whole word part ${removed} from ${word} leaves ${correct}.`,
      'Remove a named whole word from a familiar compound, preserving the other part.', `oral-compound:${word}`);
  }
  const blendTemplate = bank.find(item => item.skillId === 'sound_manipulation' && item.constructClaim === 'blend_phonemes' && item.level === 2);
  for (const [word, sounds, d1, d2] of BLEND_CHANGES) {
    add(blendTemplate, `blend.${word}`, 'Listen to the sounds. Which word do they make?', word, d1, d2,
      `Joining all four phonemes in order makes ${word}.`,
      'Retain four phonemes, including both consonants of an initial or final cluster, while blending.', `oral-blend:${word}`, sounds);
  }
  function add(template, key, speech, correct, d1, d2, explanation, demand, family, sounds = []) {
    if (!template) throw new Error(`Missing foundation sound template: ${key}`);
    if (bank.some(item => item.exposureFamilyId === family)) return;
    const alternatives = [correct, d1, d2];
    const shift = output.length % alternatives.length;
    const choices = labels([...alternatives.slice(shift), ...alternatives.slice(0, shift)]);
    const answer = choices.find(choice => choice.label === correct).id;
    output.push(authoredItem(template, `oral.${key}`, { choices, answer,
      prompt: speech, targetWord: '', hideWrittenLabels: true, stimulusKey: sounds.length ? sounds.join(' | ') : normalized(speech),
      exposureFamilyId: family,
      requiredAudioCues: [instruction(speech),
        ...sounds.map(sound => ({ role: 'phoneme', text: sound, path: getPreferredPhonemeAudioPath(sound) })),
        ...choices.map(choice => ({ role: 'choice', choiceId: choice.id, value: choice.label,
          text: choice.label, path: getLedaWordAudioPath(choice.label) }))],
      explanation, difficultyEvidence: demand,
      distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== answer)
        .map(choice => [choice.id, `${choice.label} does not preserve exactly the sounds left by the requested operation. ${explanation}`])),
      mediaDecision: { role: 'audio-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'This existing oral task uses replayable spoken alternatives with hidden spellings. Exact atomic phoneme clips are used for blending; whole-word sound anchors are used for changes.' },
    }));
  }
}

function addPrintBoundaryItems(bank, output) {
  const usedPassages = new Set(bank.map(item => normalized(item.passage)).filter(Boolean));
  const groups = new Map();
  for (const item of bank.filter(item => item.skillId === 'print_concepts' && !item.tutorialOnly)) {
    const key = JSON.stringify([literacyMockTaskKey(item), item.level]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const rows of groups.values()) {
    const template = rows[0], claim = template.constructClaim;
    const boundary = ['first_word', 'last_word', 'first_letter', 'last_letter'].includes(claim);
    if (!boundary && claim !== 'word_spaces' && claim !== 'word_vs_letter') continue;
    const candidates = claim === 'first_word' ? FIRST_SENTENCES : claim === 'last_word' ? LAST_SENTENCES
      : BOUNDARY_WORDS[claim]?.split(' ') || (claim === 'word_spaces' ? WORD_COUNTS[template.level] : UNIT_CHOICES[template.level]);
    const seen = new Set(rows.map(item => normalized(item.stimulusKey)));
    let capacity = seen.size;
    for (const candidate of candidates) {
      if (capacity >= 10) break;
      const passage = Array.isArray(candidate) ? '' : candidate;
      if (passage && usedPassages.has(normalized(passage))) continue;
      const units = boundary && claim.endsWith('word') ? passage.split(/\s+/) : boundary ? [...passage] : [];
      const first = claim.startsWith('first');
      let correct, alternatives;
      if (boundary) {
        const clean = value => value.replace(/^[“"']+|[.,!?;:”"']+$/g, '');
        const answerIndex = first ? 0 : units.length - 1;
        correct = clean(units[answerIndex]);
        const otherUnits = [...new Set(units.filter((_, index) => index !== answerIndex).map(clean))].filter(unit => unit !== correct);
        if (otherUnits.length < 2) continue;
        alternatives = [correct, ...otherUnits.slice(0, 2)];
      } else if (claim === 'word_spaces') {
        correct = String(passage.trim().split(/\s+/).length);
        alternatives = [correct, String(Number(correct) - 1), String(Number(correct) + 1)];
      } else {
        alternatives = candidate; correct = alternatives[0];
      }
      const key = `print.${claim}.l${template.level}.${slug(passage || correct)}`;
      const prompt = template.prompt;
      let choices;
      if (template.format === 'select_text') {
        choices = units.map((label, tokenIndex) => ({ id: `c${tokenIndex}`, label, tokenIndex }));
      } else {
        const shift = output.length % alternatives.length;
        choices = labels([...alternatives.slice(shift), ...alternatives.slice(0, shift)]);
      }
      const clean = value => value.replace(/^[“"']+|[.,!?;:”"']+$/g, '');
      const answer = choices.find(choice => clean(choice.label) === correct).id;
      const explanation = boundary ? `${correct} is the ${first ? 'first' : 'last'} printed ${claim.endsWith('word') ? 'word' : 'letter'}.`
        : claim === 'word_spaces' ? `The spaces separate ${correct} words. Punctuation attached to a word does not add another word.`
          : `${correct} contains ${template.level === 1 ? 'one whole word' : 'two space-separated words'}; the alternatives contain different numbers of printed units.`;
      const stimulusKey = passage ? normalized(passage) : `printed-units:${JSON.stringify(alternatives)}`;
      output.push(authoredItem(template, key, { passage, passageIsInstruction: false, prompt, choices, answer,
        stimulusKey, exposureFamilyId: `mock-foundation-print:${stimulusKey}`,
        requiredAudioCues: [instruction(prompt)], explanation,
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== answer).map(choice => [choice.id,
          boundary ? 'Selects a printed unit at another position.' : claim === 'word_spaces'
            ? 'Counts a different number of units from the spaces shown.' : 'Confuses a letter, a whole word or a group of words.'])),
        difficultyEvidence: template.level === 2 ? claim === 'word_spaces'
          ? 'Keep apostrophes and quotation marks attached to words while using spaces to count word boundaries.'
          : 'Distinguish word boundaries from word length and from a compound printed as one word.'
          : 'Use the position or spacing of the exact printed units without requiring a meaning inference.',
        mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The original printed units are the assessment evidence. Audio gives only the task direction.' },
      }));
      if (passage) usedPassages.add(normalized(passage));
      seen.add(stimulusKey); capacity++;
    }
  }
}

function authoredItem(template, key, extras) {
  const id = `mock.capacity.foundation.${key}`;
  return applyLiteracyMockFoundationMediaReview({ ...template, id, canonicalItemId: id, sourceItemId: id,
    itemSnapshot: undefined, targetWord: '', passage: '', canonicalPassageId: undefined,
    image: '', imageAlt: '', textFeature: undefined, choices: [],
    requiredAudioCues: [], requiredAudioPaths: [], requiredImagePaths: [],
    tutorialOnly: false, renderTargetText: false,
    sourceProvenance: { kind: 'original_mock_foundation_capacity', file: SOURCE,
      sourceId: key, taskTemplate: template.id },
    ...extras });
}

function addPatternCompletions(bank, groups, output) {
  const rivals = { ai: 'ay', ay: 'ai', ee: 'ea', ea: 'ee', oa: 'o_e', igh: 'i_e',
    oo: 'ue', ow: 'ou', ou: 'ow', oi: 'oy', oy: 'oi', ew: 'oo', aw: 'au' };
  for (const rows of groups.values()) {
    const template = rows[0];
    const inventory = MOCK_PATTERN_WORDS[template.constructClaim]?.[template.level]?.split(' ');
    if (!inventory || template.image) continue;
    const pattern = template.constructClaim.split(':')[1];
    const split = pattern.includes('_');
    const rControlled = template.skillId === 'r_controlled';
    const seen = new Set(rows.map(item => normalized(item.targetWord || item.stimulusKey)));
    for (const word of inventory) {
      if (seen.size >= 10) break;
      if (seen.has(word)) continue;
      const masked = split ? word.replace(pattern[0], '_').replace(/e$/, '_')
        : word.replace(pattern, '_'.repeat(pattern.length));
      const values = split ? [pattern, ...['a_e', 'i_e', 'o_e', 'u_e'].filter(value => value !== pattern).slice(0, 2)]
        : rControlled ? [pattern, ...['er', 'ir', 'ur', 'ar', 'or'].filter(value => value !== pattern).slice(0, 3)]
          : [pattern, rivals[pattern], pattern === 'ee' || pattern === 'ea' ? 'oa' : 'ee'];
      const shift = output.length % values.length;
      const choices = labels([...values.slice(shift), ...values.slice(0, shift)]);
      const answer = choices.find(choice => choice.label === pattern).id;
      const prompt = split ? `Which vowel pattern completes ${masked}?` : `Which letters complete ${masked}?`;
      const direction = split ? 'Which vowel pattern completes the word?' : 'Which letters complete the word?';
      const key = `pattern.${slug(template.constructClaim)}.l${template.level}.${template.evidenceModality ? 'heard-print' : 'legacy-heard'}.${word}`;
      output.push(authoredItem(template, key, { prompt, choices, answer, targetWord: word,
        stimulusKey: word, exposureFamilyId: `mock-foundation-word:${word}`,
        requiredAudioCues: [instruction(direction), wordCue(word)],
        explanation: `The conventional spelling of the exact spoken word ${word} uses ${pattern} in the blank.`,
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== answer).map(choice => [choice.id,
          `${choice.label} changes the conventional spelling of ${word}; hearing a similar vowel does not make that spelling correct.`])),
        difficultyEvidence: template.level === 1 ? 'Supply the conventional vowel spelling in an exact familiar spoken word.'
          : rControlled ? ['er', 'ir', 'ur'].includes(pattern)
            ? 'Discriminate the conventional er, ir and ur spellings of the supplied word despite their shared vowel sound.'
            : 'Distinguish ar from or and the er, ir or ur family in the supplied word.'
            : ['ai', 'ay', 'ee', 'ea', 'oa', 'igh'].includes(pattern)
              ? 'Retain a consonant cluster or transfer the team to a longer word while rejecting a competing vowel spelling.'
              : 'Choose the conventional team while rejecting a same-sound spelling rival or a different pronunciation of the same letters.',
        mediaDecision: { role: 'audio-and-print', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The complete target is supplied as required audio. Only the missing vowel spelling is scored, and the printed alternatives are never narrated.' },
      }));
      seen.add(word);
    }
  }
}

function addDictatedBuilds(bank, pictures, output) {
  const inventories = [
    ['cvc_short_vowels', 1, ['bed', 'pig', 'cup', 'map', 'hat', 'pen', 'jug'].map(word => [word, [...word]])],
    ['digraphs', 1, [['shop',['sh','o','p']], ['chip',['ch','i','p']], ['chin',['ch','i','n']],
      ['bath',['b','a','th']], ['moth',['m','o','th']], ['dish',['d','i','sh']], ['shed',['sh','e','d']]]],
    ['digraphs', 2, [['chess',['ch','e','ss']], ['chill',['ch','i','ll']], ['shock',['sh','o','ck']],
      ['shack',['sh','a','ck']], ['check',['ch','e','ck']], ['thick',['th','i','ck']], ['shuck',['sh','u','ck']], ['chuck',['ch','u','ck']]]],
  ];
  for (const [skill, level, rows] of inventories) {
    const template = bank.find(item => item.skillId === skill && item.level === level
      && item.constructClaim === 'construct_dictated_word' && !item.tutorialOnly);
    if (!template) throw new Error(`Missing dictated build template ${skill}/${level}`);
    for (const [word, graphemes] of rows) {
      if (bank.some(item => item.skillId === skill && item.level === level && item.targetWord === word
        && item.constructClaim === template.constructClaim)) continue;
      const multi = graphemes.find(value => value.length > 1);
      const foilCandidates = multi ? [multi[0], ...['ch', 'sh', 'th'], ...'aeiou'] : [...'aeiou'];
      const foils = [...new Set(foilCandidates)].filter(value => !graphemes.includes(value)).slice(0, 3);
      const choices = labels([...graphemes, ...foils]);
      const image = pictures.get(word) || plannedPicture(word);
      output.push(authoredItem(template, `build.${skill}.l${level}.${word}`, {
        choices, answer: word, responseLength: graphemes.length, targetWord: word,
        stimulusKey: word, exposureFamilyId: `mock-foundation-word:${word}`, image, imageAlt: word,
        requiredAudioCues: [instruction(template.prompt), wordCue(word)],
        explanation: `${graphemes.join(' + ')} makes the complete dictated spelling ${word}.`,
        distractorRationales: Object.fromEntries(choices.filter(choice => foils.includes(choice.label))
          .map(choice => [choice.id, `${choice.label} replaces a grapheme with a different sound or spelling in ${word}.`])),
        difficultyEvidence: level === 2 ? 'Order two multiletter graphemes around the vowel, rejecting both single-letter and competing digraph alternatives.'
          : skill === 'digraphs' ? 'Retain one multiletter grapheme as a unit while building the complete dictated word.'
            : 'Order the three graphemes of a familiar dictated CVC word.',
        mediaDecision: { role: 'target', paths: [image], constructReview: image.startsWith(PLANNED_PICTURE_ROOT) ? 'pending' : 'approved',
          answerNeutral: 'approved', reason: 'The exact spoken target is required. A directly relevant picture supports access without displaying the spelling.' },
      }));
    }
  }
}

function addPrintTrackingItems(bank, output) {
  const sets = [
    ['reading_direction', 1, [
      ['A duck swims quietly.', 'duck'], ['We put boots here.', 'put'], ['My red kite fell.', 'red'],
      ['Please carry this bowl.', 'carry'], ['Two birds sat outside.', 'birds'],
      ['Our class visits today.', 'class'], ['Small ants find crumbs.', 'find'],
    ]],
    ['reading_direction', 2, [
      ['Beneath the table\na puppy slept.', 'table'], ['Bring your coat\nwhen you leave.', 'coat'],
      ['The last bus\narrived after dark.', 'bus'], ['Three yellow leaves\nlanded near me.', 'leaves'],
      ['We heard thunder\nduring our lunch.', 'thunder'], ['The lost mitten\nlay beside a puddle.', 'mitten'],
      ['Dad opened the jar\nand passed it over.', 'jar'], ['Beside the old bridge\nthe water moved slowly.', 'bridge'],
    ]],
    ['return_sweep', 2, [
      ['One tiny beetle\nclimbed the stem.', 'beetle'], ['Before the bell rang\nwe packed our books.', 'rang'],
      ['A very tall giraffe\nbent toward a branch.', 'giraffe'], ['The fallen apple\nrolled down the hill.', 'apple'],
      ['Please close the window\nbefore rain comes in.', 'window'], ['After the clouds cleared\nsunlight warmed the sand.', 'cleared'],
      ['The empty flowerpot\nstood near the gate.', 'flowerpot'], ['Under a pile of coats\nMum found the ticket.', 'coats'],
    ]],
  ];
  for (const [claim, level, rows] of sets) {
    const template = bank.find(item => item.skillId === 'print_concepts' && item.constructClaim === claim && item.level === level);
    for (const [passage, anchor] of rows) {
      const clean = value => value.replace(/[.,!?]$/, '');
      const words = passage.split(/\s+/).map(clean);
      const anchorIndex = words.indexOf(anchor);
      const correct = words[anchorIndex + 1];
      const foils = [words[anchorIndex], words.at(-1) === correct ? words[0] : words.at(-1)];
      const values = [correct, ...foils];
      const shift = output.length % values.length;
      const choices = labels([...values.slice(shift), ...values.slice(0, shift)]);
      const prompt = claim === 'return_sweep' ? 'Which word starts the second line?' : `Which word do you read after ${anchor}?`;
      output.push(authoredItem(template, `tracking.${claim}.l${level}.${slug(passage)}`, {
        prompt, passage, choices, answer: choices.find(choice => choice.label === correct).id,
        stimulusKey: normalized(passage), exposureFamilyId: `mock-foundation-print:${normalized(passage)}`,
        requiredAudioCues: [instruction(prompt)],
        explanation: level === 2 ? `The line ends at ${anchor}. Reading continues at the left of the next line with ${correct}.`
          : `${correct} is immediately after ${anchor} when reading from left to right.`,
        difficultyEvidence: level === 2 ? 'Track print from the end of one line back to the left edge of the following line.'
          : 'Track adjacent printed words in left-to-right order within one line.',
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.label !== correct)
          .map(choice => [choice.id, 'Selects the preceding word or jumps to a boundary instead of the next printed position.'])),
        mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The exact printed order and authored line break supply the evidence; the instruction never narrates the answer.' },
      }));
    }
  }
}

function addSentenceBoundaryItems(bank, output) {
  const sets = [
    ['sentence_end_location', [
      ['A snail moved slowly. Its shell shone.', 'slowly'], ['Where is my glove? Look beside the gate.', 'glove'],
      ['Watch that puddle! The path is wet.', 'puddle'], ['Someone knocked twice. Dad opened the door.', 'twice'],
      ['Our new kite broke. We fixed its tail.', 'broke'], ['Who closed the window? It is warm here.', 'window'],
      ['The lights went out. We found a torch.', 'out'], ['Please wait here. I will fetch the key.', 'here'],
      ['What a tall tower! It almost touches the ceiling.', 'tower'],
    ]],
    ['sentence_count', [
      ['A little crab hid beneath the rock.', '1'], ['Can you hear that? A bell is ringing.', '2'],
      ['The lid was stuck. I pulled hard. At last it opened.', '3'],
      ['Stop! A duck is crossing the path.', '2'],
      ['A seed fell. Rain came. Roots grew. A leaf appeared.', '4'],
      ['My striped umbrella kept both of us completely dry.', '1'],
      ['Where is the puppy? Is it under the bed? I can hear it breathing.', '3'],
      ['The bus arrived. We climbed aboard. Dad waved. Away we went!', '4'],
      ['Please bring the empty basket from the kitchen.', '1'],
    ]],
  ];
  for (const [claim, rows] of sets) {
    const template = bank.find(item => item.skillId === 'print_concepts' && item.constructClaim === claim);
    if (!template) throw new Error(`Missing corrected print operation: ${claim}`);
    for (const [passage, correct] of rows) {
      const words = passage.split(/\s+/).map(word => word.replace(/[.,!?]$/, ''));
      const values = claim === 'sentence_count' ? [correct, String(Number(correct) === 1 ? 3 : Number(correct) - 1), String(Number(correct) + 1)]
        : [correct, words[0], words.at(-1)];
      const shift = output.length % values.length;
      const choices = labels([...values.slice(shift), ...values.slice(0, shift)]);
      output.push(authoredItem(template, `sentences.${claim}.${slug(passage)}`, {
        passage, choices, answer: choices.find(choice => choice.label === correct).id,
        stimulusKey: normalized(passage), exposureFamilyId: `mock-foundation-print:${normalized(passage)}`,
        requiredAudioCues: [instruction(template.prompt)],
        explanation: claim === 'sentence_count' ? `There are ${correct} complete sentences, separated by their ending punctuation.`
          : `The first sentence-ending mark follows ${correct}; later words belong to the next sentence.`,
        difficultyEvidence: claim === 'sentence_count' ? 'Separate complete sentences using full stops, question marks and exclamation marks.'
          : 'Locate the last printed word of the first sentence while ignoring later sentence endings.',
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.label !== correct)
          .map(choice => [choice.id, 'Does not follow the displayed sentence-ending boundaries.'])),
        mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The printed punctuation and word boundaries are the evidence. Only the question is narrated.' },
      }));
    }
  }
}

function addLetterCaseItems(bank, output) {
  const confusions = { a: 'od', b: 'dp', c: 'eo', d: 'bq', e: 'co', f: 'tl', g: 'qy', h: 'nb',
    i: 'lj', j: 'iy', k: 'hx', l: 'it', m: 'nh', n: 'mh', o: 'ac', p: 'qb', q: 'pg',
    r: 'nm', s: 'zc', t: 'fl', u: 'vn', v: 'uy', w: 'vm', x: 'ky', y: 'vg', z: 'se' };
  for (const level of [1, 2]) {
    const template = bank.find(item => item.skillId === 'letter_knowledge'
      && item.constructClaim === 'letter_case_correspondence' && item.level === level);
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      const foils = level === 2 ? [...confusions[letter]] : [...'mos'].filter(value => value !== letter).slice(0, 2);
      const values = [letter, ...foils];
      const shift = output.length % 3;
      const choices = labels([...values.slice(shift), ...values.slice(0, shift)]);
      const identity = `letter-case:${letter}`;
      const prompt = 'Match the capital letter to its small letter.';
      output.push(authoredItem(template, `letter-case.l${level}.${letter}`, {
        prompt, choices, answer: [choices.find(choice => choice.label === letter).id],
        matchTargets: [{ id: 'm0', label: letter.toUpperCase() }],
        stimulusKey: identity, canonicalPassageId: identity, exposureFamilyId: identity,
        requiredAudioCues: [instruction(prompt)],
        explanation: `${letter.toUpperCase()} and ${letter} are the capital and lowercase forms of the same letter.`,
        difficultyEvidence: level === 2 ? 'Distinguish the matching lowercase form from two specifically confusable glyphs.'
          : 'Match one capital with its lowercase form among clearly different letter alternatives.',
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.label !== letter)
          .map(choice => [choice.id, `${choice.label} is the lowercase form of ${choice.label.toUpperCase()}, a different letter.`])),
        mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The actual letter glyphs are the evidence. The instruction never supplies the letter name or answer.' },
      }));
    }
  }
}

export function buildLiteracyMockFoundationArtworkManifest(items) {
  const entries = new Map();
  for (const item of items) for (const path of item.requiredImagePaths || []) {
    if (!path.startsWith(PLANNED_PICTURE_ROOT)) continue;
    const word = item.choices?.find(choice => choice.image === path)?.label || item.targetWord;
    const entry = entries.get(path) || { path, word,
      source: SOURCE, purpose: 'Exact picture support for a supplied spoken phonics target; no printed word or letter.', itemIds: [] };
    entry.itemIds.push(item.id);
    entries.set(path, entry);
  }
  return [...entries.values()];
}

/** Original controlled-word probes. Required missing media stays unavailable. */
export function buildLiteracyMockFoundationCapacityItems(bank) {
  const output = [];
  const pictures = new Map(Object.entries(REVIEWED_FOUNDATION_PICTURES));
  for (const item of bank) {
    if (item.targetWord && item.image) pictures.set(normalized(item.targetWord), item.image);
    for (const choice of item.choices) if (choice.image) pictures.set(normalized(choice.label), choice.image);
  }
  const groups = new Map();
  for (const item of bank.filter(item => !item.tutorialOnly)) {
    const key = JSON.stringify([literacyMockTaskKey(item), item.level]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const rows of groups.values()) {
    const template = rows[0];
    const isCompletion = template.skillId === 'cvc_short_vowels'
      && template.constructClaim.startsWith('complete_short_vowel_spelling:');
    const isHeardVowel = template.skillId === 'short_vowel_discrimination'
      && template.sourceFormat === 'LISTEN_CHOOSE_VOWEL' && /^short_[aeiou]$/.test(template.constructClaim);
    if (!isCompletion && !isHeardVowel) continue;
    const pattern = isCompletion ? template.constructClaim.split(':')[1] : template.constructClaim;
    const inventory = MOCK_SHORT_VOWEL_INVENTORY[pattern]?.[template.level]?.split(' ') || [];
    const vowel = pattern.at(-1);
    const seen = new Set(rows.map(item => normalized(item.stimulusKey)));
    let capacity = seen.size;
    for (const word of inventory) {
      if (capacity >= 10) break;
      if (seen.has(word)) continue;
      // Preserve the picture-supported access condition. Explicitly planned
      // illustrations fail the release file-existence gate until delivered.
      const image = template.image ? pictures.get(word) || plannedPicture(word) : '';
      const mode = template.image ? 'picture' : template.evidenceModality ? 'heard-print' : 'legacy-heard';
      const key = `${isCompletion ? 'vowel-completion' : 'heard-vowel'}.${pattern}.l${template.level}.${mode}.${word}`;
      const prompt = isCompletion ? `Which vowel completes ${word.replace(vowel, '_')}?`
        : 'Which letter spells the middle vowel sound?';
      const choiceValues = [vowel, ...'aeiou'.split('').filter(value => value !== vowel).slice(0, 2)];
      // Letter alternatives are a closed inventory. Rotate the literal key;
      // letters name competing vowel spellings, never spoken answer cues.
      const shift = output.length % choiceValues.length;
      const rotated = [...choiceValues.slice(shift), ...choiceValues.slice(0, shift)];
      const choices = labels(rotated);
      const answer = choices.find(choice => choice.label === vowel).id;
      output.push(authoredItem(template, key, { prompt, choices, answer, targetWord: word,
        stimulusKey: word, exposureFamilyId: `mock-foundation-word:${word}`, image, imageAlt: image ? word : '',
        requiredAudioCues: [instruction(isCompletion ? 'Which vowel completes the word?' : prompt), wordCue(word)],
        explanation: `The spoken word ${word} has the short ${vowel} vowel, conventionally spelled ${vowel} here.`,
        distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== answer)
          .map(choice => [choice.id, `Substitutes ${choice.label} for the medial short ${vowel} spelling in ${word}.`])),
        difficultyEvidence: template.level === 2
          ? 'Identify the medial vowel while retaining the additional phonemes of an initial or final consonant cluster.'
          : 'Identify the medial vowel of a familiar three-phoneme word.',
        mediaDecision: { role: image ? 'target' : 'audio-and-print', paths: image ? [image] : [],
          constructReview: image.startsWith(PLANNED_PICTURE_ROOT) ? 'pending' : 'approved', answerNeutral: 'approved',
          reason: image ? 'The existing reviewed picture accompanies an exact spoken target; the required spelling remains hidden.'
            : 'The exact spoken target supplies the word, while the response measures its printed medial vowel.' },
      }));
      seen.add(word); capacity++;
    }
  }
  addPrintBoundaryItems(bank, output);
  addPrintTrackingItems(bank, output);
  addSentenceBoundaryItems(bank, output);
  addLetterCaseItems(bank, output);
  addPatternCompletions(bank, groups, output);
  addOralChanges(bank, output);
  addPictureSoundItems(bank, pictures, output);
  addDictatedBuilds(bank, pictures, output);
  addClusterBuilds(bank,pictures,output);
  addSpokenPictureComparisons(bank,pictures,output);
  output.push(...buildLiteracyMockFoundationReadingCapacity([...bank, ...output], authoredItem));
  output.push(...buildLiteracyMockFoundationWordContrastCapacity([...bank, ...output], authoredItem, pictures));
  output.push(...buildLiteracyMockFoundationBlendCapacity([...bank, ...output], authoredItem, pictures));
  output.push(...buildLiteracyMockFoundationSilentECapacity([...bank, ...output], authoredItem));
  return output;
}

function addClusterBuilds(bank, pictures, output) {
  const groups=Map.groupBy(bank.filter(i=>i.constructClaim.startsWith('construct_short_vowel_phoneme_sequence:')&&!i.tutorialOnly),i=>JSON.stringify([literacyMockTaskKey(i),i.level]));
  for(const rows of groups.values()) {
    const template=rows[0],pattern=template.constructClaim.split(':')[1],seen=new Set(rows.map(i=>i.targetWord));
    for(const word of MOCK_SHORT_VOWEL_INVENTORY[pattern][2].split(' ')) {
      if(seen.size>=10)break;if(seen.has(word)||word.includes('x'))continue;
      const graphemes=word.match(/ck|sh|th|ch|ss|ll|ff|zz|./g);
      const foils=[...'aeiou'].filter(v=>v!==pattern.at(-1)).slice(0,2);
      const choices=labels([...graphemes,...foils]);
      const image=template.image?pictures.get(word)||plannedPicture(word):'';
      const prompt='Put the sounds in order to make the word you hear.';
      output.push(authoredItem(template,`cluster-build.${pattern}.${template.evidenceModality?'audio-print':'picture'}.${word}`,{
        prompt,choices,answer:word,responseLength:graphemes.length,targetWord:word,image,imageAlt:image?word:'',
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
        requiredAudioCues:[instruction(prompt),wordCue(word)],
        explanation:`${graphemes.join(' + ')} preserves every sound in ${word}.`,
        difficultyEvidence:'Order the complete sequence of a short-vowel word containing an initial or final consonant cluster; reject two competing vowel graphemes.',
        distractorRationales:Object.fromEntries(choices.filter(c=>foils.includes(c.label)).map(c=>[c.id,'D-VOWEL: changes the medial vowel of the dictated word.'])),
        mediaDecision:{role:image?'target':'audio-and-print',paths:image?[image]:[],constructReview:image.startsWith(PLANNED_PICTURE_ROOT)?'pending':'approved',answerNeutral:'approved',reason:'The exact word is supplied in audio while the full target spelling remains hidden. The original pictured or audio-only access condition is retained.'},
      }));seen.add(word);
    }
  }
}

function addSpokenPictureComparisons(bank,pictures,output) {
  const sets=[
    ['rhyming','spoken_rhyme_discrimination',[
      ['light','kite','cat','bike'],['spoon','moon','man','boot'],['crow','snow','cow','nose'],
      ['sheep','jeep','ship','leaf'],['bell','shell','ball','bed'],['star','car','door','farm'],
      ['chair','bear','deer','bed'],['house','mouse','horse','cow'],
    ]],
    ['blends','spoken_blend_discrimination',[
      ['street','straw','spring','tree'],['strong','stripe','sprout','train'],['string','stream','spring','ring'],
      ['sprout','spring','split','pram'],['sprain','spray','stray','plane'],['splash','split','spring','plane'],
      ['scrub','screen','spring','rug'],['square','squeeze','screen','chair'],
    ]],
  ];
  for(const [skill,claim,rows]of sets) {
    const template=bank.find(i=>i.skillId===skill&&i.constructClaim===claim&&i.level===2&&i.evidenceModality==='audio+image');
    for(const [word,correct,...foils]of rows) {
      const values=[correct,...foils],shift=output.length%3;
      const choices=labels([...values.slice(shift),...values.slice(0,shift)]).map(c=>({...c,image:pictures.get(c.label)||plannedPicture(c.label),imageAlt:c.label,audioPath:getLedaWordAudioPath(c.label)}));
      const paths=choices.map(c=>c.image);
      output.push(authoredItem(template,`spoken-comparison.${claim}.${word}`,{
        choices,answer:choices.find(c=>c.label===correct).id,targetWord:word,hideWrittenLabels:true,
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-spoken-comparison:${claim}:${word}`,
        requiredAudioCues:[instruction(template.prompt),wordCue(word),...choices.map(c=>({role:'choice',choiceId:c.id,value:c.label,text:c.label,path:c.audioPath}))],
        explanation:skill==='rhyming'?`${word} and ${correct} share the whole spoken vowel-and-ending sequence.`:`${word} and ${correct} begin with the same three consonant phonemes.`,
        difficultyEvidence:skill==='rhyming'?'Compare a complete rime across different onsets, rejecting a similar beginning or a partial ending.':'Retain all three consonants in the onset against a changed or omitted cluster member.',
        distractorRationales:Object.fromEntries(choices.filter(c=>c.label!==correct).map(c=>[c.id,skill==='rhyming'?`${c.label} does not share the complete rime of ${word}.`:`${c.label} changes or omits part of the three-phoneme onset of ${word}.`])),
        mediaDecision:{role:'answer-cards',paths,constructReview:paths.some(p=>p.startsWith(PLANNED_PICTURE_ROOT))?'pending':'approved',answerNeutral:'approved',reason:'Required whole-word recordings identify the alternatives. Their spellings remain hidden; concrete illustrations support independent replay.'},
      }));
    }
  }
}
