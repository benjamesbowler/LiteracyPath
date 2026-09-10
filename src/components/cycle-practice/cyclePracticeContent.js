import { elSkillsBlockCycles } from '../../data/elSkillsBlockCycles.js';
import { getChildWordAsset } from '../../data/childAssets.js';
import { findAssessmentMediaCandidates } from '../../data/assessmentMediaRegistry.js';
import { assessmentImageStyleBlockedPaths } from '../../data/assessmentImageStyleBlocklist.js';
import { imageQaReviewBlockedPaths } from '../../data/generated/imageQaReviewBlocklist.generated.js';
import { getCyclePracticeWordAudio } from './cyclePracticeAudio.js';
import { getPreferredPhonemeAudioPath } from '../../data/phonemeAudioBank.js';
import { CYCLE_PRACTICE_MINIMUM_SECONDS } from '../../policy/cyclePracticePolicy.js';
import { isKnownBadAudioPath } from '../../data/knownBadWordAudio.js';

// The pictured noun supplies the meaning of each short spoken context. The
// printed high-frequency word remains visible: copying is supported exposure,
// never independent spelling, decoding or a memory test.
export const CYCLE_HFW_CONTEXTS = Object.freeze(Object.fromEntries([
  ['am', 'apple', 'I am holding an apple.'], ['i', 'apple', 'I see an apple.'],
  ['a', 'cat', 'A cat.'], ['the', 'cat', 'The cat.'],
  ['an', 'egg', 'An egg.'], ['and', 'apple', 'An apple and another apple.'],
  ['is', 'dog', 'This is a dog.'], ['of', 'milk', 'A glass of milk.'],
  ['go', 'bus', 'Go on the bus.'], ['no', 'cup', 'No milk in the cup.'], ['so', 'elephant', 'The elephant is so big.'],
  ['do', 'cat', 'Do you see the cat?'], ['my', 'bag', 'This is my bag.'], ['to', 'school', 'Go to school.'],
  ['into', 'box', 'Put it into the box.'], ['said', 'cat', 'I said cat.'],
  ['not', 'dog', 'A dog is not a cat.'], ['that', 'moon', 'Look at that moon.'],
  ['he', 'king', 'He is a king.'], ['me', 'ball', 'Give me the ball.'], ['she', 'queen', 'She is a queen.'],
  ['are', 'apple', 'Are you holding an apple?'], ['as', 'sun', 'As bright as the sun.'], ['you', 'book', 'You can read a book.'],
  ['see', 'rabbit', 'See the rabbit.'], ['was', 'egg', 'There was an egg.'],
  ['for', 'gift', 'A gift for you.'], ['or', 'apple', 'An apple or a banana?'],
  ['her', 'queen', 'Give her a crown.'], ['his', 'king', 'The king has his crown.'],
  ['this', 'map', 'This is a map.'], ['with', 'dog', 'Play with the dog.'], ['your', 'hat', 'Put on your hat.'],
  ['good', 'book', 'A good book.'], ['look', 'fish', 'Look at the fish.'],
  ['all', 'ball', 'Put all the balls away.'], ['says', 'cat', 'The cat says meow.'], ['they', 'bird', 'They can fly like a bird.'],
  ['each', 'apple', 'Take one apple each.'], ['like', 'cake', 'I like cake.'], ['little', 'mouse', 'A little mouse.'],
  ['from', 'cow', 'Milk comes from a cow.'], ['have', 'book', 'I have a book.'], ['more', 'apple', 'One more apple.'],
  ['about', 'dog', 'A story about a dog.'], ['out', 'box', 'Take it out of the box.'], ['put', 'hat', 'Put on a hat.'],
  ['be', 'bee', 'Be quiet near the bee.'], ['get', 'ball', 'Get the ball.'], ['very', 'elephant', 'A very big elephant.'],
  ['what', 'cat', 'What is it? A cat.'], ['when', 'moon', 'When it is dark, look for the moon.'], ['who', 'king', 'Who is he? A king.'],
  ['does', 'cat', 'Does a cat say meow?'], ['goes', 'bus', 'The bus goes to school.'],
  ['only', 'moon', 'Only one moon.'], ['other', 'shoe', 'Where is the other shoe?'],
  ['off', 'hat', 'Take your hat off.'], ['which', 'apple', 'Which fruit is it? An apple.'],
  ['again', 'ball', 'Play with the ball again.'], ['day', 'sun', 'The sun shines in the day.'], ['say', 'apple', 'Say apple.'],
  ['by', 'tree', 'Stand by the tree.'], ['why', 'umbrella', 'Why use an umbrella? It is raining.'], ['try', 'kite', 'Try to fly a kite.'],
  ['first', 'sock', 'Put your sock on first.'], ['friend', 'dog', 'A dog can be your friend.'], ['half', 'apple', 'Cut the apple in half.'],
].map(([word, imageWord, contextText]) => [word, Object.freeze({ word, imageWord, contextText })])));

export const CYCLE_PRACTICE_EXTRA_WORDS = Object.freeze(['fizz', 'anchor', 'eggplant', 'itch', 'inchworm', 'octagon', 'underwear', 'yogurt']);

export const CYCLE_WORD_PARTS = Object.freeze([
  { word: 'rainbow', parts: ['rain', 'bow'] },
  { word: 'cupcake', parts: ['cup', 'cake'] },
  { word: 'snowman', parts: ['snow', 'man'] },
  { word: 'football', parts: ['foot', 'ball'] },
  { word: 'sunflower', parts: ['sun', 'flower'] },
  { word: 'toothbrush', parts: ['tooth', 'brush'] },
  { word: 'mailbox', parts: ['mail', 'box'] },
]);

// Explicit speech-sound membership. Do not derive sounds from first letters:
// elephant is short e, eagle is not; x is /ks/ at the end of fox; who is /h/.
// These are curriculum examples, not an alternate image or audio catalogue.
export const CYCLE_SOUND_WORDS = Object.freeze({
  a: ['apple', 'ant', 'alligator', 'astronaut', 'ambulance', 'ax', 'anchor'],
  b: ['ball', 'bat', 'bag', 'book', 'bear', 'bell', 'banana', 'basket', 'butterfly', 'bicycle', 'beaver'],
  c: ['cat', 'cap', 'cup', 'can', 'cow', 'cake', 'car', 'carrot', 'caterpillar', 'camera'],
  d: ['dog', 'duck', 'desk', 'doll', 'door', 'dinosaur', 'dolphin', 'donkey', 'drum'],
  e: ['egg', 'elephant', 'elbow', 'envelope', 'engine', 'eggplant', 'exit'],
  f: ['fan', 'fish', 'fox', 'fig', 'frog', 'flower', 'feather', 'foot', 'flag', 'flamingo'],
  g: ['goat', 'gum', 'gift', 'gate', 'gorilla', 'goose', 'girl', 'guitar', 'grapes', 'glove'],
  h: ['hat', 'hen', 'house', 'horse', 'hand', 'hippo', 'helicopter', 'hedgehog', 'hamburger'],
  i: ['igloo', 'insect', 'ink', 'itch', 'inchworm', 'instrument'],
  j: ['jam', 'jet', 'jug', 'jacket', 'jellyfish', 'jaguar', 'juice', 'jellybean'],
  k: ['kite', 'kangaroo', 'key', 'king', 'kitten', 'koala', 'kettle', 'kiwi', 'kayak'],
  l: ['log', 'leaf', 'lamp', 'lion', 'lemon', 'ladybug', 'ladder', 'lobster', 'lollipop', 'lantern'],
  m: ['moon', 'mouse', 'map', 'mat', 'milk', 'monkey', 'mushroom', 'magnet', 'mountain', 'muffin', 'motorcycle'],
  n: ['net', 'nest', 'nose', 'nail', 'necklace', 'notebook', 'newspaper', 'noodle', 'nurse', 'narwhal'],
  o: ['ox', 'octopus', 'otter', 'ostrich', 'octagon'],
  p: ['pig', 'pan', 'pot', 'pen', 'pencil', 'penguin', 'pear', 'peach', 'parrot', 'pumpkin', 'panda'],
  qu: ['queen', 'quilt', 'quail', 'quicksand', 'quiver'],
  r: ['rabbit', 'rug', 'rain', 'ring', 'rat', 'raccoon', 'robot', 'rocket', 'rainbow', 'reindeer'],
  s: ['sun', 'sock', 'seal', 'sand', 'soup', 'snake', 'spoon', 'spider', 'strawberry', 'sandwich'],
  t: ['top', 'tent', 'turtle', 'tiger', 'table', 'tooth', 'tree', 'truck', 'tub', 'tomato'],
  u: ['umbrella', 'uncle', 'umpire', 'underwear', 'urchin'],
  v: ['van', 'vest', 'vase', 'vine', 'violin', 'volcano', 'vulture', 'vacuum', 'vegetable'],
  w: ['web', 'wig', 'watch', 'window', 'wagon', 'watermelon', 'wolf', 'worm', 'walrus', 'waffle'],
  x: ['box', 'fox', 'six', 'wax', 'ax'],
  y: ['yak', 'yarn', 'yo-yo', 'yogurt', 'yolk', 'yacht'],
  z: ['zebra', 'zipper', 'zucchini', 'zoo', 'zero', 'zip'],
  sh: ['ship', 'sheep', 'shark', 'shell', 'shoe', 'shovel', 'shirt', 'shrimp'],
  ch: ['chip', 'chair', 'cheese', 'chin', 'chicken', 'cherry', 'chick', 'chest'],
  th: ['thumb', 'thimble', 'thorn', 'three'],
  wh: ['whale', 'wheel', 'whisk', 'whistle'],
  all: ['ball', 'wall', 'fall', 'hall'], nk: ['sink', 'bank', 'tank', 'trunk', 'skunk'],
  ng: ['ring', 'king', 'wing', 'gong', 'spring', 'string'],
  ang: ['bang', 'rang'], ing: ['ring', 'king', 'wing', 'spring', 'string'],
  ong: ['gong', 'song', 'long'], ung: ['rung'],
  ff: ['cliff', 'puff'], ss: ['grass', 'dress', 'glass', 'moss'], zz: ['fizz'], ll: ['bell', 'hill', 'shell', 'doll'],
});
const ENDINGS = new Set(['x', 'all', 'nk', 'ng', 'ang', 'ing', 'ong', 'ung', 'ff', 'ss', 'zz', 'll']);
const ENDING_PARTS = new Set(['all', 'nk', 'ang', 'ing', 'ong', 'ung']);
const EQUIVALENT = [['c', 'k'], ['w', 'wh'], ['f', 'ff'], ['s', 'ss'], ['z', 'zz'], ['l', 'll']];
const REVIEW_PATTERNS = ['sh', 'ch', 'th', 'wh', 'all', 'nk', 'ng', 'ff', 'ss', 'zz', 'll'];
const RHYME_FAMILIES = [
  ['cat', 'hat', 'bat', 'rat', 'mat'], ['map', 'cap', 'tap'], ['dog', 'log', 'frog'],
  ['sun', 'bun', 'run'], ['pig', 'wig', 'fig'], ['fox', 'box'], ['moon', 'spoon'],
  ['boat', 'goat', 'coat'], ['bell', 'shell'], ['ring', 'king', 'wing'], ['duck', 'truck'],
  ['fish', 'dish'], ['chair', 'bear', 'pear'], ['bed', 'red'], ['cake', 'snake', 'lake'],
];
export const CYCLE_WORD_CHANGES = Object.freeze([['cat', 'hat'], ['map', 'cap'], ['pig', 'wig'], ['dog', 'log'], ['fan', 'pan'], ['cap', 'cup'], ['pig', 'peg'], ['cot', 'cat'], ['hat', 'hot'], ['pan', 'pen'], ['ship', 'chip'], ['shop', 'chop'], ['ring', 'king'], ['sing', 'ring'], ['bank', 'tank'], ['bell', 'shell']]);
// Spoken syllable counts are authored, not inferred from vowel letters.
// Accent-variable camera, jaguar, strawberry, umpire and vacuum stay out.
export const CYCLE_SYLLABLE_COUNTS = Object.freeze(Object.fromEntries([
  [1, 'ant ax ball bat bag book bear bell cat cap cup can cow cake car dog duck desk doll door drum egg fan fish fox fig frog foot flag goat gum gift gate goose girl grapes glove hat hen house horse hand ink itch jam jet jug juice kite key king log leaf lamp moon mouse map mat milk net nest nose nail nurse ox pig pan pot pen pear peach queen quilt quail rug rain ring rat sun sock seal sand soup snake spoon top tent tooth tree truck tub van vest vase vine web wig watch wolf worm box six wax yak yarn zoo zip ship sheep shark shell shoe shirt shrimp chip chair cheese chin chick chest thumb thorn three whale wheel whisk wall fall hall sink bank tank trunk skunk wing gong spring string bang rang song long rung cliff puff grass dress glass moss fizz hill'],
  [2, 'lion yo-yo apple anchor basket beaver carrot dolphin donkey elbow eggplant exit feather guitar hippo hedgehog igloo insect inchworm jacket kitten kettle kiwi kayak lemon ladder lobster lantern monkey mushroom magnet mountain muffin necklace notebook noodle narwhal pencil penguin parrot pumpkin panda rabbit raccoon robot rocket rainbow reindeer spider sandwich turtle tiger table uncle yogurt zebra zipper zero shovel chicken cherry thimble whistle walrus waffle window wagon vulture'],
  [3, 'astronaut banana butterfly bicycle dinosaur elephant envelope flamingo gorilla hamburger kangaroo koala ladybug lollipop newspaper octopus octagon tomato umbrella underwear violin volcano zucchini jellyfish'],
  [4, 'alligator caterpillar helicopter motorcycle watermelon'],
].flatMap(([beats, words]) => words.split(' ').map(word => [word, beats]))));
// Spoken beat work is oral vocabulary, not decoding. These familiar pictured
// nouns can be heard in an early cycle without introducing their spellings.
export const CYCLE_ORAL_BEAT_WORDS = Object.freeze('cat dog pig hat sun fish cup book ball moon duck fox egg goat horse house ship sheep shoe chair tree box car foot hand map mat net pen rat ring whale wolf king apple rabbit turtle monkey kitten pencil window tiger lion lemon carrot spider rocket zebra elephant banana butterfly kangaroo octopus tomato umbrella alligator helicopter watermelon motorcycle'.split(' '));
const BUILD_WORDS = ['mat', 'sat', 'ant', 'tin', 'sit', 'fan', 'fin', 'man', 'mad', 'fat', 'sad', 'dad', 'dot', 'log', 'lot', 'rod', 'rat', 'hat', 'hot', 'ham', 'ram', 'bat', 'bag', 'wig', 'web', 'bud', 'bun', 'sun', 'mud', 'mug', 'cat', 'cap', 'cup', 'can', 'cot', 'dog', 'dig', 'gap', 'gum', 'pig', 'pan', 'pot', 'pin', 'pen', 'pet', 'pup', 'box', 'fox', 'six', 'egg', 'bed', 'net', 'vet', 'van', 'vest', 'jam', 'jet', 'jug', 'zip', 'ship', 'shop', 'chip', 'chin', 'chop', 'thin', 'shut', 'shed', 'shell', 'fish', 'dish', 'bath', 'ball', 'wall', 'hill', 'bell', 'doll', 'whip', 'whisk', 'sink', 'bank', 'tank', 'ring', 'king', 'wing', 'gong', 'bang', 'rung', 'cliff', 'puff', 'grass', 'dress', 'glass', 'moss', 'fizz'];

// Only exact owned semantic images absent from the shared word registry live
// here. Shared choices continue to use the current asset selection authorities.
const EXTRA_IMAGES = Object.freeze({
  sunflower: '/images/assessment/generated/initial-sounds-l2/sunflower.webp',
  rung: '/images/cycle-practice/rung.webp',
  fizz: '/images/cycle-practice/fizz.webp',
});
function allowedImage(path) {
  if (!path) return false;
  const stem = path.replace(/\.(png|webp|jpe?g)$/i, '');
  return ![...assessmentImageStyleBlockedPaths, ...imageQaReviewBlockedPaths].some(blocked => blocked.replace(/\.(png|webp|jpe?g)$/i, '') === stem);
}
const imageCache = new Map();
export function cycleWordImage(word) {
  if (imageCache.has(word)) return imageCache.get(word);
  const candidates = [getChildWordAsset(word)?.image, EXTRA_IMAGES[word], ...findAssessmentMediaCandidates({ word, mediaType: 'image', role: 'target_object' }).map(item => item.path)];
  const path = candidates.find(allowedImage) || '';
  imageCache.set(word, path);
  return path;
}
export function cycleWordAudio(word) {
  const path = getCyclePracticeWordAudio(word);
  return path && !isKnownBadAudioPath(path) ? path : '';
}
function picture(word) {
  const image = cycleWordImage(word), audio = cycleWordAudio(word);
  return image && audio ? { id: word, label: word, value: word, image, audio } : null;
}
export function cycleSoundsEquivalent(a, b) { return a === b || EQUIVALENT.some(group => group.includes(a) && group.includes(b)); }
export function cycleSoundPosition(grapheme) { return ENDINGS.has(grapheme) ? 'ending' : 'first'; }
const INITIAL_SOUND_SETS = new Map(Object.entries(CYCLE_SOUND_WORDS).filter(([key]) => !ENDINGS.has(key)).map(([key, words]) => [key, new Set(words)]));
const FINAL_SOUND_OVERRIDES = Object.freeze({
  apple: 'l', bicycle: 'l', turtle: 'l', table: 'l', noodle: 'l', whale: 'l', eagle: 'l',
  mouse: 's', house: 's', juice: 's', necklace: 's', grapes: 's', goose: 's', horse: 's',
  cheese: 'z', nose: 'z', vase: 'z', giraffe: 'f',
  six: 'x', fox: 'x', box: 'x', wax: 'x', ax: 'x',
});
export function cycleSoundMatches(word, grapheme, position = cycleSoundPosition(grapheme)) {
  if (position === 'first') {
    if (INITIAL_SOUND_SETS.get(grapheme)?.has(word)) return true;
    return EQUIVALENT.some(group => group.includes(grapheme) && group.some(key => INITIAL_SOUND_SETS.get(key)?.has(word)));
  }
  if (['all', 'nk', 'ng', 'ang', 'ing', 'ong', 'ung'].includes(grapheme)) return word.endsWith(grapheme);
  const phoneme = FINAL_SOUND_OVERRIDES[word] || (word.endsWith('ng') ? 'ng' : word.endsWith('sh') ? 'sh' : word.endsWith('ch') ? 'ch' : word.endsWith('th') ? 'th' : word.at(-1));
  return cycleSoundsEquivalent(phoneme, grapheme);
}
function randomFor(seed) {
  let hash = 2166136261;
  for (const c of String(seed)) hash = Math.imul(hash ^ c.codePointAt(0), 16777619);
  return () => { hash += 0x6d2b79f5; let x = Math.imul(hash ^ hash >>> 15, 1 | hash); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
function shuffled(items, seed) {
  const result = [...items], random = randomFor(seed);
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
const unique = values => [...new Set(values)];
function cardSpellings(card) {
  if (/^([A-Z])\1$/i.test(card.grapheme || '') && /^[A-Z][a-z]$/.test(card.grapheme)) return [card.grapheme[0].toLowerCase() === 'q' ? 'qu' : card.grapheme[0].toLowerCase()];
  return String(card.spelling || card.grapheme || '').toLowerCase().split(/[\s/,+]+/).filter(g => Object.hasOwn(CYCLE_SOUND_WORDS, g));
}
export function cycleTaughtGraphemes(cycle) {
  const through = cycle?.cycleNumber || 1;
  return unique(elSkillsBlockCycles.filter(c => c.cycleNumber && c.cycleNumber <= through).flatMap(c => c.focusLetters.flatMap(cardSpellings)));
}
export function cyclePracticeGraphemes(cycle) {
  const focus = cycleFocusGraphemes(cycle);
  const review = cycleTaughtGraphemes(cycle).filter(g => !focus.includes(g));
  return [...focus, ...review];
}
export function cycleFocusGraphemes(cycle) {
  const own = unique((cycle?.focusLetters?.length ? cycle.focusLetters : cycle?.reviewLetters || []).flatMap(cardSpellings));
  return own.length ? own : REVIEW_PATTERNS.filter(g => cycleTaughtGraphemes(cycle).includes(g));
}
function tokensFor(word, taught) {
  const tokens = [], ordered = [...taught].sort((a, b) => b.length - a.length);
  let rest = word;
  while (rest) { const token = ordered.find(g => rest.startsWith(g)); if (!token) return []; tokens.push(token); rest = rest.slice(token.length); }
  // Letter availability alone does not author an untaught sound spelling.
  if (['sh', 'ch', 'th', 'wh', 'ng', 'nk', 'ff', 'ss', 'zz', 'll'].some(g => word.includes(g) && !taught.includes(g) && !tokens.some(token => token.includes(g)))) return [];
  return tokens;
}
export function cyclePictureCoverage() {
  return Object.fromEntries(Object.entries(CYCLE_SOUND_WORDS).map(([g, words]) => [g, words.filter(word => picture(word))]));
}
const STATIONS = {
  pictureSound: ['picture-sounds', 'Sound Safari', 'sound_picture_identification'],
  letterMatch: ['letter-match', 'Letter Friends', 'grapheme_phoneme_matching'],
  rhymeMatch: ['rhyme-match', 'Rhyme Picnic', 'rhyme_recognition'],
  wordBuild: ['word-build', 'Word Workshop', 'grapheme_word_building'],
  soundSort: ['sound-sort', 'Sound Delivery', 'sound_classification'],
  letterTrace: ['letter-trace', 'Rainbow Writing', 'supported_formation_practice'],
};
function roundBase(cycle, mechanicId, targetWord, extra = {}) {
  const [stationId, stationTitle, construct] = STATIONS[mechanicId];
  const media = picture(targetWord);
  return { id: `${cycle.id}:${mechanicId}:${targetWord}:${extra.targetGrapheme || extra.variant || ''}`, mechanicId, construct, stationId, stationTitle, instructionKey: mechanicId, targetWord, image: media?.image || cycleWordImage(targetWord), audio: media?.audio || cycleWordAudio(targetWord), checkEligible: mechanicId !== 'letterTrace', audioRequired: true, ...extra };
}
function soundChoices(grapheme, taught, seed, count = 3) {
  const others = shuffled(taught.filter(g => !cycleSoundsEquivalent(g, grapheme) && getPreferredPhonemeAudioPath(g)), seed);
  const selected = [grapheme];
  for (const g of others) { if (selected.every(s => !cycleSoundsEquivalent(g, s))) selected.push(g); if (selected.length >= count) break; }
  return selected.map(value => ({ id: value, label: value, value, audio: getPreferredPhonemeAudioPath(value), soundAudio: getPreferredPhonemeAudioPath(value) }));
}
export function buildCyclePracticePools(cycle, seed, check = false) {
  const taught = cycleTaughtGraphemes(cycle), focus = cycleFocusGraphemes(cycle), coverage = cyclePictureCoverage();
  // Assessment keeps its assigned-target sampling contract. Practice reviews
  // every taught mapping, rather than dropping all but the six most recent.
  const practiceGraphemes = check ? [...focus, ...taught.filter(g => !focus.includes(g)).slice(-6)] : cyclePracticeGraphemes(cycle);
  const pools = Object.fromEntries(Object.keys(STATIONS).map(key => [key, []]));
  const picturePool = unique(Object.values(coverage).flat());
  for (const grapheme of practiceGraphemes) {
    const soundAudio = getPreferredPhonemeAudioPath(grapheme), position = cycleSoundPosition(grapheme);
    if (!soundAudio) continue;
    for (const word of (check ? coverage[grapheme] || [] : shuffled(coverage[grapheme] || [], `${cycle.id}:word-examples:${grapheme}`))) {
      const common = { targetGrapheme: grapheme, soundAudio, soundPosition: position };
      const endingPart = ENDING_PARTS.has(grapheme);
      const distractors = shuffled(picturePool.filter(w => !cycleSoundMatches(w, grapheme)), `${seed}:pictures:${word}`).slice(0, 2);
      if (distractors.length === 2) pools.pictureSound.push(roundBase(cycle, 'pictureSound', word, { ...common, instructionKey: endingPart ? 'endingPart' : position === 'ending' ? 'endingSound' : 'firstSound', choices: [word, ...distractors].map(picture), answer: word, construct: endingPart ? 'ending_pattern_picture_identification' : position === 'ending' ? 'ending_sound_picture_identification' : 'initial_sound_picture_identification' }));
      const choices = soundChoices(grapheme, taught, `${seed}:letters:${word}`);
      if (choices.length > 1) {
        pools.letterMatch.push(roundBase(cycle, 'letterMatch', word, { ...common, instructionKey: endingPart ? 'letterEndingPart' : position === 'ending' ? 'endingLetterSound' : 'letterSound', choices, answer: grapheme, construct: endingPart ? 'grapheme_pattern_matching' : 'grapheme_phoneme_matching' }));
        const binCandidates = taught.filter(g => g === grapheme || (
          !cycleSoundMatches(word, g, position)
          && (position !== 'first' || !ENDINGS.has(g))
          && picturePool.some(w => cycleSoundMatches(w, g, position) && !cycleSoundMatches(w, grapheme, position))
        ));
        const bins = soundChoices(grapheme, binCandidates, `${cycle.id}:bins:${word}`, 2);
        if (bins.length < 2) continue;
        const other = bins[1].value;
        const sameWords = shuffled(picturePool.filter(w => w !== word && cycleSoundMatches(w, grapheme, position) && !cycleSoundMatches(w, other, position)), `${cycle.id}:same:${word}`);
        const contrastWords = shuffled(picturePool.filter(w => cycleSoundMatches(w, other, position) && !cycleSoundMatches(w, grapheme, position)), `${cycle.id}:contrast:${word}`);
        const sortedWords = sameWords.length ? [word, sameWords[0], contrastWords[0]] : [word, ...contrastWords.slice(0, 2)];
        if (sortedWords.length !== 3 || sortedWords.some(w => !w)) continue;
        const objects = sortedWords.map(w => ({ word: w, image: cycleWordImage(w), audio: cycleWordAudio(w), answer: cycleSoundMatches(w, grapheme, position) ? grapheme : other }));
        pools.soundSort.push(roundBase(cycle, 'soundSort', word, { ...common, instructionKey: endingPart ? 'sortEndingPart' : position === 'ending' ? 'sortEndingSound' : 'sortFirstSound', choices: bins, objects, answer: grapheme, construct: endingPart ? 'ending_pattern_classification' : position === 'ending' ? 'ending_sound_classification' : 'initial_sound_classification' }));
      }
      pools.letterTrace.push(roundBase(cycle, 'letterTrace', word, { ...common, instructionKey: 'letterTrace', grapheme, model: grapheme, answer: grapheme, checkEligible: false }));
    }
  }
  const families = RHYME_FAMILIES.map(words => words.filter(w => picture(w))).filter(words => words.length > 1);
  for (const family of families) for (const targetWord of family) for (const rhyme of family.filter(word => word !== targetWord)) {
    const distractors = shuffled(families.filter(other => other !== family).flat().filter(w => w !== targetWord), `${seed}:rhyme-choices:${targetWord}:${rhyme}`).slice(0, 2);
    pools.rhymeMatch.push(roundBase(cycle, 'rhymeMatch', targetWord, { instructionKey: 'rhymeMatch', choices: [rhyme, ...distractors].map(picture), answer: rhyme, rhymeFamily: family }));
  }
  for (const word of unique([...practiceGraphemes.flatMap(g => coverage[g] || []), ...CYCLE_ORAL_BEAT_WORDS]).filter(word => picture(word))) {
    const beats = CYCLE_SYLLABLE_COUNTS[word];
    if (!beats) continue;
    pools.soundSort.push(roundBase(cycle, 'soundSort', word, { variant: 'syllableSort', instructionKey: 'syllableSort', construct: 'spoken_syllable_counting', beats, answer: String(beats), choices: [1, 2, 3, 4].map(count => ({ id: String(count), value: String(count), label: String(count), beats: count, audio: cycleWordAudio(['', 'one', 'two', 'three', 'four'][count]) })) }));
  }
  for (const grapheme of practiceGraphemes.filter(g => g.length === 1)) {
    const words = coverage[grapheme] || [];
    const word = check ? words[0] : shuffled(words, `${cycle.id}:case-example:${grapheme}`)[0];
    if (!word) continue;
    for (const upperModel of [true, false]) {
      const model = upperModel ? grapheme.toUpperCase() : grapheme;
      const answer = upperModel ? grapheme : grapheme.toUpperCase();
      const alternatives = taught.filter(g => g.length === 1 && g !== grapheme).slice(0, 2);
      pools.letterMatch.push(roundBase(cycle, 'letterMatch', word, { variant: 'letterCase', instructionKey: 'letterCase', targetGrapheme: grapheme, model, answer, construct: 'visual_letter_identity', choices: [grapheme, ...alternatives].map(g => { const value = upperModel ? g : g.toUpperCase(); return { id: value, label: value, value }; }) }));
    }
    pools.letterTrace.push(roundBase(cycle, 'letterTrace', word, { targetGrapheme: grapheme.toUpperCase(), focusGrapheme: grapheme, instructionKey: 'letterTrace', grapheme: grapheme.toUpperCase(), model: grapheme.toUpperCase(), answer: grapheme.toUpperCase(), checkEligible: false }));
  }
  for (const word of BUILD_WORDS) {
    const letters = tokensFor(word, taught);
    if (letters.length < 2 || !picture(word)) continue;
    if (check && cycle.cycleNumber >= 15 && !focus.some(g => letters.includes(g))) continue;
    const spare = shuffled(taught.filter(g => !letters.includes(g) && getPreferredPhonemeAudioPath(g)), `${seed}:build:${word}`).slice(0, 2);
    const choices = unique([...letters, ...spare]).map(value => ({ id: value, label: value, value, audio: getPreferredPhonemeAudioPath(value) }));
    pools.wordBuild.push(roundBase(cycle, 'wordBuild', word, { instructionKey: 'wordBuild', letters, graphemes: letters, choices, answer: letters }));
  }
  if (cycle.cycleNumber >= 15) for (const [beforeWord, word] of CYCLE_WORD_CHANGES) {
    const beforeLetters = tokensFor(beforeWord, taught), letters = tokensFor(word, taught);
    if (!picture(beforeWord) || !picture(word) || !letters.length || beforeLetters.length !== letters.length) continue;
    const changed = letters.flatMap((letter, index) => letter === beforeLetters[index] ? [] : [index]);
    if (changed.length !== 1 || (check && !focus.some(g => letters.includes(g) || beforeLetters.includes(g)))) continue;
    const changeIndex = changed[0];
    const choices = soundChoices(letters[changeIndex], taught, `${seed}:change:${beforeWord}:${word}`);
    pools.wordBuild.push(roundBase(cycle, 'wordBuild', word, { variant: 'wordChange', instructionKey: 'wordChange', beforeWord, beforeImage: cycleWordImage(beforeWord), beforeAudio: cycleWordAudio(beforeWord), beforeLetters, letters, graphemes: letters, changeIndex, choices, answer: letters, construct: changeIndex === 0 ? 'initial_phoneme_substitution' : 'medial_phoneme_substitution' }));
  }
  for (const originalWord of cycle.highFrequencyWords || []) {
    const word = originalWord.toLowerCase(), context = CYCLE_HFW_CONTEXTS[word];
    if (!context || !cycleWordImage(context.imageWord) || !cycleWordAudio(word)) continue;
    const letters = [...(word === 'i' ? 'I' : word)];
    pools.wordBuild.push(roundBase(cycle, 'wordBuild', word, { variant: 'highFrequency', instructionKey: 'copyWord', construct: 'supported_high_frequency_word_building', modelWord: originalWord, contextText: context.contextText, image: cycleWordImage(context.imageWord), imageWord: context.imageWord, letters, graphemes: letters, choices: unique(letters).map(value => ({ id: value, label: value, value, audio: cycleWordAudio(value) })), answer: letters, checkEligible: false }));
    const heardWords = unique(elSkillsBlockCycles.filter(item => item.cycleNumber && item.cycleNumber <= cycle.cycleNumber).flatMap(item => item.highFrequencyWords.map(value => value.toLowerCase())));
    const distractors = shuffled(heardWords.filter(value => value !== word && cycleWordAudio(value)), `${seed}:heard-word:${word}`).slice(0, 2);
    if (distractors.length) pools.letterMatch.push(roundBase(cycle, 'letterMatch', word, { variant: 'wordListen', instructionKey: 'listenWord', construct: 'auditory_word_recognition', contextText: context.contextText, image: cycleWordImage(context.imageWord), imageWord: context.imageWord, answer: word, choices: [word, ...distractors].map(value => ({ id: value, value, label: value === 'i' ? 'I' : value })), checkEligible: true }));
  }
  for (const item of CYCLE_WORD_PARTS) {
    if (!picture(item.word) || item.parts.some(word => !picture(word))) continue;
    const removeFirst = cycle.cycleNumber <= 2 || [5, 6, 18, 19, 20, 26, 27].includes(cycle.cycleNumber);
    const removedWord = item.parts[removeFirst ? 0 : 1], answer = item.parts[removeFirst ? 1 : 0];
    const choices = unique([answer, removedWord, ...shuffled(['cat', 'fish', 'sun', 'hat'].filter(w => w !== answer && w !== removedWord), `${seed}:parts:${item.word}`)]).slice(0, 3).map(picture);
    pools.wordBuild.push(roundBase(cycle, 'wordBuild', item.word, { variant: 'wordParts', instructionKey: 'wordPart', instructionText: `Listen. ${item.word}. Take away ${removedWord}. Tap what is left.`, construct: 'compound_word_deletion', removedWord, beforeParts: item.parts, choices, answer }));
  }
  const seen = new Set();
  for (const [mechanic, rows] of Object.entries(pools)) pools[mechanic] = rows.map(round => {
    const semanticKey = cyclePracticeSemanticKey(round);
    const focusGrapheme = round.focusGrapheme || round.targetGrapheme;
    const coverageTags = [`activity:${mechanic}`, `construct:${round.construct}`,
      ...(focus.includes(focusGrapheme) ? [`focus:${focusGrapheme}`] : []),
      ...(['highFrequency', 'wordListen'].includes(round.variant) ? [`hfw:${round.targetWord}`] : []),
      ...(round.variant === 'highFrequency' ? [`hfwCopy:${round.targetWord}`] : []),
      ...(round.variant === 'wordListen' ? [`hfwListen:${round.targetWord}`] : []),
      ...(round.variant === 'wordChange' ? ['activity:wordChange'] : []),
    ];
    return { ...round, id: `${cycle.id}:${semanticKey}`, semanticKey, coverageTags, isCurrentFocus: focus.includes(focusGrapheme) };
  }).filter(round => { if (seen.has(round.semanticKey)) return false; seen.add(round.semanticKey); return true; });
  // Keep rhyme as one balanced part of the lesson, not a long filler tail.
  // Select across families and both cue/response directions before returning
  // to another pair in the same family. The selection is content-stable.
  const rhymeBudget = Math.min(pools.rhymeMatch.length, Math.floor(Object.entries(pools).filter(([mechanic]) => mechanic !== 'rhymeMatch').reduce((count, [, rows]) => count + rows.length, 0) / 2));
  const rhymeFamilies = new Map();
  for (const round of pools.rhymeMatch) {
    const familyKey = [...round.rhymeFamily].sort().join('|');
    if (!rhymeFamilies.has(familyKey)) rhymeFamilies.set(familyKey, new Map());
    const pairKey = [round.targetWord, round.answer].sort().join('|');
    const pairs = rhymeFamilies.get(familyKey);
    if (!pairs.has(pairKey)) pairs.set(pairKey, []);
    pairs.get(pairKey).push(round);
  }
  const familyQueues = shuffled([...rhymeFamilies.entries()], `${cycle.id}:family-balance`).map(([family, pairs]) => shuffled([...pairs.values()], `${cycle.id}:rhyme-pairs:${family}`).flat());
  const balancedRhymes = [];
  for (let index = 0; balancedRhymes.length < rhymeBudget; index++) {
    for (const queue of familyQueues) {
      if (queue[index]) balancedRhymes.push(queue[index]);
      if (balancedRhymes.length >= rhymeBudget) break;
    }
  }
  pools.rhymeMatch = balancedRhymes;
  return pools;
}

export function cyclePracticeSemanticKey(round) {
  if (round.objects) return `soundSort:${round.soundPosition}:${round.objects.map(object => `${object.word}=${object.answer}`).sort().join('|')}`;
  if (round.mechanicId === 'letterTrace') return `letterTrace:${round.targetGrapheme}`;
  if (round.variant === 'letterCase') return `letterCase:${round.model}:${round.answer}`;
  if (round.variant === 'wordListen') return `wordListen:${round.targetWord}`;
  if (round.variant === 'highFrequency') return `highFrequency:${round.targetWord}`;
  if (round.variant === 'wordParts') return `wordParts:${round.targetWord}:without:${round.removedWord}`;
  if (round.variant === 'wordChange') return `wordChange:${round.beforeWord}:${round.targetWord}:${round.changeIndex}`;
  return [round.mechanicId, round.variant || '', round.targetWord, round.targetGrapheme || '', Array.isArray(round.answer) ? round.answer.join('|') : round.answer].join(':');
}

export function buildCyclePracticePlan(cycle, seed, pass = 0, check = false) {
  if (!cycle?.cycleNumber) return { rounds: [], unavailable: ['Cycle content'] };
  const stableSeed = `${seed}:${cycle.id}`;
  const pools = buildCyclePracticePools(cycle, `${stableSeed}:pass:${pass}`, check);
  const authored = Object.values(pools).flat();
  const required = check ? [] : requiredCoverage(cycle, authored);
  const core = new Set(), coveredCoreTags = new Set(), coreWords = new Set();
  for (const tag of required) {
    if (coveredCoreTags.has(tag)) continue;
    const matches = authored.filter(round => round.coverageTags.includes(tag) && !core.has(round.semanticKey));
    const candidate = matches.find(round => !coreWords.has(round.imageWord || round.targetWord)) || matches[0];
    if (candidate) { core.add(candidate.semanticKey); coreWords.add(candidate.imageWord || candidate.targetWord); candidate.coverageTags.forEach(value => coveredCoreTags.add(value)); }
  }
  const ordered = Object.entries(pools).map(([mechanicId, rows]) => {
    const pool = shuffled(rows.filter(r => !check || r.checkEligible), `${stableSeed}:order:${mechanicId}:${pass}`);
    return pool.sort((a, b) => Number(core.has(b.semanticKey)) - Number(core.has(a.semanticKey)) || (check ? Number(b.isCurrentFocus || b.variant === 'highFrequency') - Number(a.isCurrentFocus || a.variant === 'highFrequency') : 0));
  });
  // Core breadth comes first; every genuine authored task is retained. Empty
  // activity queues are skipped rather than replaying a short station loop.
  let rounds = [], previousMechanic = '';
  const modeledWords = new Set(), recentPictures = [], soundUse = new Map(), activityUse = new Map();
  while (ordered.some(pool => pool.length)) {
    // Nonreaders meet each visible word model before choosing its printed
    // form independently. Assessment follows completed practice, so it can
    // use recognition without retaining the supported copy activities.
    if (!check) for (const pool of ordered) {
      if (!pool.length) continue;
      const needsCore = core.has(pool[0].semanticKey);
      const eligible = pool.filter(round => core.has(round.semanticKey) === needsCore && (round.variant !== 'wordListen' || modeledWords.has(round.targetWord)));
      // Balance genuine sound targets across current and earlier learning.
      // Different activity labels must not produce net/net/net/net in a row.
      const useCount = round => soundUse.get(round.focusGrapheme || round.targetGrapheme?.toLowerCase() || round.construct) || 0;
      const best = eligible.reduce((best, round) => {
        if (!best) return round;
        const repeated = Number(recentPictures.includes(round.imageWord || round.targetWord));
        const previousRepeated = Number(recentPictures.includes(best.imageWord || best.targetWord));
        return repeated < previousRepeated || (repeated === previousRepeated && useCount(round) < useCount(best)) ? round : best;
      }, null);
      if (best) { const index = pool.indexOf(best); pool.unshift(...pool.splice(index, 1)); }
    }
    const available = ordered.filter(pool => pool.length && (check || pool[0].variant !== 'wordListen' || modeledWords.has(pool[0].targetWord)));
    const different = available.filter(pool => pool[0].mechanicId !== previousMechanic);
    const candidates = different.length ? different : available;
    const selected = candidates.find(pool => core.has(pool[0].semanticKey))
      || candidates.reduce((best, pool) => check ? (pool.length > best.length ? pool : best) : ((activityUse.get(pool[0].mechanicId) || 0) < (activityUse.get(best[0].mechanicId) || 0) ? pool : best));
    const next = selected.shift();
    if (next.variant === 'highFrequency') modeledWords.add(next.targetWord);
    rounds.push(next); previousMechanic = next.mechanicId;
    recentPictures.push(next.imageWord || next.targetWord);
    if (recentPictures.length > 4) recentPictures.shift();
    const mapping = next.focusGrapheme || next.targetGrapheme?.toLowerCase() || next.construct;
    soundUse.set(mapping, (soundUse.get(mapping) || 0) + 1);
    activityUse.set(next.mechanicId, (activityUse.get(next.mechanicId) || 0) + 1);
  }
  if (check) {
    const representatives = new Map();
    for (const round of rounds) if (!representatives.has(round.construct)) representatives.set(round.construct, round);
    const first = [...representatives.values()];
    // Review cycles can name more than ten mappings. Retain every current
    // focus rather than claiming a short mixed score covered an omitted sound.
    for (const grapheme of cycleFocusGraphemes(cycle)) {
      if (!first.some(r => r.targetGrapheme === grapheme)) {
        const candidate = rounds.find(r => r.targetGrapheme === grapheme);
        if (candidate) first.push(candidate);
      }
    }
    for (const word of cycle.highFrequencyWords || []) {
      if (!first.some(round => round.variant === 'wordListen' && round.targetWord === word.toLowerCase())) {
        const candidate = rounds.find(round => round.variant === 'wordListen' && round.targetWord === word.toLowerCase());
        if (candidate) first.push(candidate);
      }
    }
    const selectedIds = new Set(first.map(r => r.id));
    rounds = [...first, ...rounds.filter(r => !selectedIds.has(r.id))].slice(0, Math.max(10, first.length));
  }
  let previousAnswerPosition = -1;
  rounds = rounds.map((round, index) => {
    let choices = round.choices ? shuffled(round.choices, `${stableSeed}:${pass}:${check}:${index}:choices`) : undefined;
    if (choices?.length > 1 && typeof round.answer === 'string') {
      let correctIndex = choices.findIndex(choice => choice.value === round.answer);
      if (correctIndex === previousAnswerPosition) { choices = [...choices.slice(1), choices[0]]; correctIndex = choices.findIndex(choice => choice.value === round.answer); }
      previousAnswerPosition = correctIndex;
    }
    return { ...round, ...(choices ? { choices } : {}), ...(check ? { stationId: 'check', stationTitle: 'Cycle Check' } : {}) };
  });
  return { rounds, unavailable: rounds.length ? [] : ['Cycle content'], ...(!check ? { blueprint: cyclePracticeSessionBlueprint(cycle, rounds) } : {}) };
}

const PLANNING_SECONDS = Object.freeze({
  pictureSound: [12, 22], letterMatch: [10, 20], rhymeMatch: [15, 25],
  wordBuild: [20, 40], soundSort: [25, 45], letterTrace: [30, 60],
});
function requiredCoverage(cycle, rounds) {
  const tags = [
    ...Object.keys(STATIONS).map(id => `activity:${id}`),
    ...cycleFocusGraphemes(cycle).map(grapheme => `focus:${grapheme}`),
    ...(cycle.highFrequencyWords || []).flatMap(word => [`hfwCopy:${word.toLowerCase()}`, `hfwListen:${word.toLowerCase()}`]),
    'construct:rhyme_recognition', 'construct:compound_word_deletion', 'construct:spoken_syllable_counting',
    'construct:auditory_word_recognition', 'construct:supported_high_frequency_word_building',
  ];
  if (rounds.some(round => round.variant === 'wordChange')) tags.push('activity:wordChange');
  if (rounds.some(round => round.variant === 'letterCase')) tags.push('construct:visual_letter_identity');
  return tags;
}

const SESSION_BLUEPRINT_CACHE = new Map();
const SESSION_TASK_COVERAGE = new Map();
export function cyclePracticeSessionBlueprint(cycle, suppliedRounds) {
  if (!suppliedRounds && SESSION_BLUEPRINT_CACHE.has(cycle.id)) return SESSION_BLUEPRINT_CACHE.get(cycle.id);
  const rounds = suppliedRounds || Object.values(buildCyclePracticePools(cycle, 'session-blueprint')).flat();
  const seconds = rounds.reduce(([minimum, maximum], round) => {
    const allowance = round.variant === 'syllableSort' ? [15, 25] : PLANNING_SECONDS[round.mechanicId];
    return [minimum + allowance[0], maximum + allowance[1]];
  }, [0, 0]);
  const blueprint = {
    version: 1,
    cycleId: cycle.id,
    distinctTasks: new Set(rounds.map(round => round.semanticKey)).size,
    byActivity: Object.fromEntries(Object.keys(STATIONS).map(id => [id, rounds.filter(round => round.mechanicId === id).length])),
    byConstruct: Object.fromEntries(unique(rounds.map(round => round.construct)).map(construct => [construct, rounds.filter(round => round.construct === construct).length])),
    responseActions: rounds.reduce((count, round) => count + (round.objects?.length || (Array.isArray(round.answer) ? round.variant === 'wordChange' ? 2 : round.answer.length : 1)), 0),
    practisedConstructs: unique(rounds.map(round => round.construct)),
    assessedConstructs: unique(Object.values(buildCyclePracticePools(cycle, 'assessment-blueprint', true)).flat().filter(round => round.checkEligible).map(round => round.construct)),
    curriculumPhonemicAwareness: [...(cycle.phonemicAwareness || [])],
    curriculumCoverageBoundary: 'The source phonemic-awareness notes provide curriculum context. This original programme practises and checks the declared constructs; it does not assess every source lesson subroutine or oral production. Supported copying and letter formation are practice, not independent handwriting or spelling proficiency.',
    focusGraphemes: cycleFocusGraphemes(cycle),
    reviewGraphemes: cyclePracticeGraphemes(cycle).filter(g => !cycleFocusGraphemes(cycle).includes(g)),
    highFrequencyWords: (cycle.highFrequencyWords || []).map(word => word.toLowerCase()),
    requiredCoverageTags: requiredCoverage(cycle, rounds),
    minimumCompletedTasks: 36,
    minimumActiveSeconds: CYCLE_PRACTICE_MINIMUM_SECONDS,
    plannedMinutes: [Math.floor(seconds[0] / 60), Math.ceil(seconds[1] / 60)],
    planningBasis: 'Pacing allowances include the recorded instruction, naming pictures, thinking, the learning action and feedback. These are planning estimates, not measured child timings or enforced waits. A full distinct deck is available; earlier taught content is spaced review. Replays begin only after the complete deck.',
  };
  SESSION_BLUEPRINT_CACHE.set(cycle.id, blueprint);
  SESSION_TASK_COVERAGE.set(cycle.id, new Map(rounds.map(round => [round.semanticKey, round.coverageTags])));
  return blueprint;
}

export function cyclePracticeReadiness(cycle, records = [], activeSeconds = 0) {
  const blueprint = cyclePracticeSessionBlueprint(cycle);
  const completed = records.filter(record => record.activityCompleted === true || record.evidence?.activityCompleted === true);
  const authoredCoverage = SESSION_TASK_COVERAGE.get(cycle.id);
  const semanticKeys = new Set(completed.map(record => record.semanticKey || record.evidence?.semanticKey).filter(key => authoredCoverage.has(key)));
  // Recovered evidence cannot invent a completed category by supplying tags.
  // The current authored task is the authority for what the action practised.
  const covered = new Set([...semanticKeys].flatMap(key => authoredCoverage.get(key)));
  const missingCategories = blueprint.requiredCoverageTags.filter(tag => !covered.has(tag));
  const timeReady = Number.isFinite(Number(activeSeconds)) && Number(activeSeconds) >= blueprint.minimumActiveSeconds;
  const coverageReady = semanticKeys.size >= blueprint.minimumCompletedTasks && !missingCategories.length;
  return {
    ready: timeReady && coverageReady, timeReady, coverageReady,
    completedTasks: semanticKeys.size, totalTasks: blueprint.distinctTasks,
    minimumCompletedTasks: blueprint.minimumCompletedTasks,
    missingCategories,
    missingFocus: missingCategories.filter(tag => tag.startsWith('focus:')).map(tag => tag.slice(6)),
    missingHighFrequencyWords: unique(missingCategories.filter(tag => /^hfw(?:Copy|Listen):/.test(tag)).map(tag => tag.split(':')[1])),
  };
}
