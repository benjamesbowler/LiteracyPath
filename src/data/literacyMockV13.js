import { resolveLiteracyMockImagePath } from './literacyMockImageDelivery.js';
import { literacyMockBeginnerVocabularyIssue } from '../policy/literacyMockBeginnerVocabulary.js';

const VERSION = 'literacy-mock-v13';
const SOURCE = 'src/data/literacyMockV13.js';

// Familiar, concrete referents already pictured in the scored bank. Keeping
// incidental foils in different categories preserves the original entry task.
const PICTURE_CATEGORIES = [
  'ant bear bee bird butterfly caterpillar cow dolphin duck elephant fish fox frog goat hen horse kangaroo lion monkey mouse penguin pig rabbit rat shark sheep snail snake spider tiger whale zebra',
  'apple banana bread cake carrot cheese cookie corn egg grapes lemon meat milk orange peach pear pizza potato rice soup tomato watermelon',
  'bag bell blanket book broom brush camera clock comb crayon drum fan fork glass key ladder map mop net pan pen pencil plate pot ruler scissors spoon toothbrush towel watch',
  'ball kite slide swing tent',
  'basket bath bed bench bottle bowl box chair desk door lamp phone pillow sink sofa window',
  'belt boot coat dress ring scarf shirt shoe shorts skirt sock umbrella',
  'bike boat bus car train truck',
  'chin elbow face foot hair hand leg mouth nose tooth',
  'beach cloud leaf log rain snow star sun tree',
].map(category => category.split(' '));

// Some of the existing keyed pictures illustrate a small scene. Do not use
// one as a foil when it visibly contains another possible answer referent.
const PICTURE_DETAILS = new Map(Object.entries({
  bath: 'window bottle towel', beach: 'cloud sun towel tree umbrella', book: 'star cloud', broom: 'book',
  chin: 'shirt', desk: 'book chair crayon pen pencil scissors', fish: 'bowl glass leaf', frog: 'leaf',
  goat: 'cloud', grapes: 'bowl', horse: 'tree', milk: 'glass', pig: 'cloud tree',
  rain: 'leaf tree window', rice: 'bowl', sheep: 'cloud', snow: 'boot coat scarf tree',
  soup: 'bowl', swing: 'cloud tree', tree: 'cloud',
}).map(([word, details]) => [word, new Set(details.split(' '))]));

const CVC_FOILS = {
  bad: 'dad bed bag', bat: 'cat bet bag', beg: 'peg bug bed', bib: 'rib bit big',
  bin: 'pin bun big', bit: 'pit bet big', bun: 'fun bin bud', bus: 'bug bun gas',
  cab: 'cub cap cat', can: 'man pen cap', cot: 'dot cut cat', cub: 'rub cab cup',
  cut: 'hut cat cup', den: 'pen dip bed', dig: 'pig dog dip', dot: 'pot dog dig',
  fin: 'pin fan fit', fun: 'run fan fog', hit: 'sit hot hip', hop: 'mop hip hot',
  hug: 'bug hut hat', hut: 'nut hot hug', kit: 'pit kid cat', net: 'pet nut nap',
  nut: 'hut net sun', pan: 'fan pin pat', pen: 'hen pin pet', pot: 'cot pet pop',
  rod: 'nod rid rob', run: 'fun ran rug', sad: 'dad sun sip', sit: 'hit set sip',
  tap: 'map tip tag', web: 'bed wet bib',
};
const CVC_POSITIONS = ['the first letter', 'the vowel letter', 'the final letter'];

// The original recording or stimulus cannot support a sound replacement item.
// A future authored replacement can retain these families once its exact audio
// or visual evidence is ready. No historical version is modified by this list.
export const LITERACY_MOCK_V13_WITHDRAWN = Object.freeze({
  'lp3.sentence_comprehension.l1.A.literal_who_what.v4': 'All four options name Baby Ren although the question asks who acted.',
  'mock.relations.same-actions': 'Look and see are not interchangeable without context.',
  'mock.capacity.language.same-sets-6': 'House and home are not equivalent without context.',
  'mock.capacity.language.same-sets-7': 'Giggle denotes a particular kind of laugh.',
  'mock.capacity.language.same-sets-9': 'Silent and quiet describe different degrees of sound.',
  'mock.v9.language.scope.practice.v11': 'The keyed restatement drops the exact count of three.',
  'mock.v9.language.scope.seats.v11': 'The keyed restatement drops the exact count of two and the quantifier every.',
  'mock.v9.language.scope.shelves.v11': 'The keyed restatement changes bottom shelf to below the top shelf.',
  'lp3.rhyming.l1.A.og.v1': 'The keyed fog and dog rhyme varies by English pronunciation.',
  'lp3.rhyming.l1.B.og.v2': 'The keyed jog and log rhyme varies by English pronunciation.',
});

export const LITERACY_MOCK_V12_COMPETING_TENSE_IMAGES = Object.freeze({
  'mock.v11.phonics.cvc-capacity.sat': 'The image also depicts the distractor sit.',
  'mock.v11.phonics.cvc-capacity.dug': 'The image also depicts the distractor dig.',
});
const tokens = text => new Set(String(text || '').toLowerCase().match(/[a-z]+/g) || []);
const isBroadPictureChoice = item => item.format === 'choice' && item.adaptiveAreaBand < 2
  && ((item.domainId === 'vocabulary' && item.adaptiveAreaBand === 0) || item.domainId === 'listening');

export function cvcChoiceUsesSingleLetter(choices, answer) {
  const key = choices.find(choice => choice.id === answer)?.label;
  const foils = choices.filter(choice => choice.id !== answer);
  return /^[a-z]{3}$/.test(key) && foils.every(choice => /^[a-z]{3}$/.test(choice.label))
    && [...key].some((letter, index) => foils.every(choice => choice.label[index] !== letter));
}

function replaceChoices(item, choices, reason) {
  const foils = choices.filter(choice => choice.id !== item.answer);
  const distractorRationales = Object.fromEntries(foils.map(choice => [choice.id, reason(choice.label)]));
  const proof = item.taskDemand?.proof;
  return {
    ...item, choices, distractorRationales,
    ...(proof && { taskDemand: { ...item.taskDemand, proof: { ...proof, rejected: foils.map(choice => choice.label) } } }),
  };
}

function pictureDistractors(items) {
  const pictureKeys = new Map();
  for (const item of items) {
    if (!item.adaptiveMixedEligible || !item.mediaReady || item.tutorialOnly || !isBroadPictureChoice(item)) continue;
    const key = item.choices.find(choice => choice.id === item.answer);
    if (key?.image && !pictureKeys.has(key.label)) pictureKeys.set(key.label, key);
  }
  const categories = PICTURE_CATEGORIES.map(category => category.filter(word => pictureKeys.has(word)));
  const categoryFor = new Map(categories.flatMap((category, index) => category.map(word => [word, index])));
  const countsByPool = new Map();
  const published = new Map();
  for (const item of items) {
    if (!item.adaptiveMixedEligible || !item.mediaReady || item.tutorialOnly || !isBroadPictureChoice(item)) continue;
    const answer = item.choices.find(choice => choice.id === item.answer);
    const group = categoryFor.get(answer.label);
    if (group === undefined || !answer.image) throw new Error(`Unaudited V13 picture referent: ${item.id}`);
    const pool = `${item.domainId}:${item.adaptiveAreaBand}`;
    const counts = countsByPool.get(pool) || new Map();
    countsByPool.set(pool, counts);
    const alreadyNamed = tokens(item.passage);
    const usedGroups = new Set([group]);
    const usedWords = [answer.label];
    const usedImages = new Set([resolveLiteracyMockImagePath(answer.image)]);
    const choices = item.choices.map(choice => {
      if (choice.id === item.answer) return choice;
      const candidates = [...categoryFor].filter(([word, category]) => !usedGroups.has(category) && !alreadyNamed.has(word)
        && !alreadyNamed.has(`${word}s`) && !alreadyNamed.has(`${word}es`)
        && !usedImages.has(resolveLiteracyMockImagePath(pictureKeys.get(word).image))
        && usedWords.every(used => !PICTURE_DETAILS.get(used)?.has(word) && !PICTURE_DETAILS.get(word)?.has(used)));
      // Rebalance the complete bank, not just one shifted position on each item.
      const [word, category] = candidates.sort(([a], [b]) => (counts.get(a) || 0) - (counts.get(b) || 0))[0] || [];
      if (!word) throw new Error(`Could not fill distinct V13 referent set: ${item.id}`);
      const picture = pictureKeys.get(word);
      usedGroups.add(category);
      usedWords.push(word);
      usedImages.add(resolveLiteracyMockImagePath(picture.image));
      counts.set(word, (counts.get(word) || 0) + 1);
      return { id: choice.id, label: word, image: picture.image, imageAlt: picture.imageAlt || word };
    });
    const corrected = replaceChoices(item, choices, word => `${word} names a separate concrete referent that is absent from the recording.`);
    const requiredImagePaths = choices.map(choice => choice.image);
    published.set(item.id, {
      ...corrected, requiredImagePaths,
      mediaDecision: { ...item.mediaDecision, paths: requiredImagePaths,
        reason: 'Four reviewed picture referents from distinct familiar categories. Only one is named in the exact recording.' },
    });
  }
  return published;
}

function reviseItem(item, pictures) {
  if (!item.adaptiveMixedEligible || item.tutorialOnly) return item;
  if (Object.hasOwn(LITERACY_MOCK_V13_WITHDRAWN, item.id)) return { ...item, adaptiveMixedEligible: false };
  if (pictures.has(item.id)) return pictures.get(item.id);
  let revised = item;
  if (item.adaptiveAreaBand === 1 && ['reading', 'phonics'].includes(item.domainId)
    && item.format === 'choice' && cvcChoiceUsesSingleLetter(item.choices, item.answer)) {
    const key = item.choices.find(choice => choice.id === item.answer).label;
    const alternatives = CVC_FOILS[key]?.split(' ');
    if (!alternatives) throw new Error(`No reviewed V13 CVC contrasts: ${item.id}`);
    const choices = item.choices.map(choice => choice.id === item.answer ? choice : { id: choice.id, label: alternatives.shift() });
    if (cvcChoiceUsesSingleLetter(choices, item.answer)) throw new Error(`V13 CVC contrast still has a single-letter shortcut: ${item.id}`);
    revised = replaceChoices(item, choices, word => {
      const positions = CVC_POSITIONS.filter((_, index) => word[index] !== key[index]);
      return `${word} differs from ${key} at ${positions.join(' and ')}.`;
    });
  }
  if (Object.hasOwn(LITERACY_MOCK_V12_COMPETING_TENSE_IMAGES, item.id)) {
    revised = { ...revised, image: '', imageAlt: '', requiredImagePaths: [], evidenceModality: 'audio+print',
      taskDemand: { ...revised.taskDemand, proof: { ...revised.taskDemand.proof, targetImage: '' } },
      mediaDecision: { ...revised.mediaDecision, alt: '', role: 'audio-and-print', paths: [],
        reason: 'The recording specifies the exact tense form. A photograph or drawing of the action cannot supply that contrast.' },
      explanation: `${item.targetWord} is the complete printed word that matches the recording.`,
    };
  }
  return revised;
}

/** The complete corrected bank before its scored and teacher-practice split. */
export function buildLiteracyMockV13(base) {
  const pictures = pictureDistractors(base);
  return base.map(item => {
    const revised = reviseItem(item, pictures);
    const snapshot = { ...revised, contentVersion: VERSION };
    if (snapshot.adaptiveMixedEligible && literacyMockBeginnerVocabularyIssue(snapshot)) {
      throw new Error(`V13 entry contrast uses unreviewed vocabulary: ${item.id}`);
    }
    if (revised !== item) snapshot.sourceProvenance = { ...item.sourceProvenance,
      v13Review: { file: SOURCE, priorId: item.id, priorPublication: item.contentVersion } };
    delete snapshot.itemSnapshot;
    return { ...snapshot, itemSnapshot: snapshot };
  });
}
