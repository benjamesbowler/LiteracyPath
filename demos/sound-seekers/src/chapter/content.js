import { AUDIO as DEMO_AUDIO } from '../audio.js';
import { shuffle } from '../rules.js';

export const CHAPTER_WORDS = Object.freeze([
  'mat','sit','tin','bat','sun','bun','log','mug','cat','can','bag','bug','dog',
  'cup','map','cap','pan','pig','pin','pot','pup','van','net','bed','pen',
  'sock','moon','soap',
]);
export const CVC_WORDS = Object.freeze(CHAPTER_WORDS.filter(w => w.length === 3));
// Do not pit two reasonable names for the same pictured object against each
// other in a first-sound question. Spoken-word activities disambiguate labels.
const ONSET_WORDS = CHAPTER_WORDS.filter(w => w !== 'sit');
const NAMING_NEIGHBOURS = [['tin','can'],['dog','pup'],['cup','mug']];
export const PHONEMES = Object.freeze([...'abcdegilmnopstuv']);
export const RELATIONS = Object.freeze([
  { id: 'mat', phrase: 'on the mat', name: 'the mat', icon: 'leaf' },
  { id: 'basket', phrase: 'in the basket', name: 'the basket', icon: 'basket' },
  { id: 'table', phrase: 'under the table', name: 'under the table', icon: 'home' },
]);
export const PLACE_WORDS = Object.freeze(['cup','mug','cap','bag','tin','can','pan','map','pen','net','bun','pot']);
const EXT = { pig: 'png', sit: 'png', pin: 'png' };
export const pictureFor = word => '/assets/pictures/' + word + '.' + (EXT[word] || 'webp');

const project = (id, title, friend, icon, needs, acts, reward, light) => ({
  id, title, friend, icon, needs, acts, reward, light,
});
const act = (id, title, kind, x, z, story, done, options = {}) =>
  ({ id, title, kind, x, z, story, done, ...options });
export const PROJECTS = Object.freeze([
  project('picnic', "Woolly's picnic", 'Woolly', 'basket', [], [
    act('picnic-find','The Sound Basket','onset',-12,7,
      'Woolly has picture tokens for the picnic games. Find the ones with the sound you hear.',
      'The first basket is packed. Woolly needs help sorting the parcels beside the mushrooms.'),
    act('picnic-sort','The Mushroom Parcels','sort',-18,10,
      'These picture parcels are muddled. Listen, then send each parcel to its sound basket.',
      'The parcels are sorted. Follow the little path to set out the picnic things.', { pair: ['m','s'] }),
    act('picnic-place','A Place for Everything','place',-17,14,
      'The picnic needs a tidy corner. Listen to where each thing belongs.',
      'A lovely picnic corner! Woolly has found the first little light.'),
  ], "Woolly's picnic is ready.", true),
  project('brook','The brook crossing','Splashy','bridge',[],[
    act('brook-stones','The Sound Stones','gap',10,0,
      'Splashy cannot cross the brook. Find the first letters to uncover the missing stones.',
      'The first stones are ready. There are more bridge pieces by the tool mat.', { gap: 0 }),
    act('brook-build','The Bridge Workshop','build',17,3,
      'Build each word, one sound at a time. Every word makes another piece of the crossing.',
      'The pieces fit! Bring the picture parcels to the right side of the bridge.'),
    act('brook-sort','Across the Brook','sort',10,0,
      'Sort the last bridge parcels by their first sound. Then Splashy can finish the crossing.',
      'The bridge is mended! Cross the brook to find the garden and the parcel clearing.', { pair: ['c','p'] }),
  ], 'A way across, and a second little light.', true),
  project('garden',"Clucky's garden",'Clucky','flower',['brook'],[
    act('garden-grow','The Lantern Garden','build',-11,-20,
      'Clucky has found sleepy lantern flowers. Plant the sounds in order to wake them.',
      'The flowers are waking. Clucky needs her tools at the potting corner.'),
    act('garden-place','The Potting Corner','place',-18,-24,
      'Help Clucky put her garden things where she needs them. Listen to each little job.',
      'The tools are ready. The last seed parcels are beside the flower bed.'),
    act('garden-sort','The Seed Baskets','sort',-7,-27,
      'Sort the picture seeds into their sound baskets. The whole garden will glow.',
      'Look at the garden glow! Clucky has found the third little light.', { pair: ['p','b'] }),
  ], 'The lantern garden is glowing.', true),
  project('parcels','The parcel clearing','Woolly','home',['brook'],[
    act('parcels-label','The Missing Labels','gap',15,-22,
      'The picnic parcels have lost their middle letters. Listen to each word and finish its label.',
      'The labels are fixed. The parcels need sorting beside the old stone.', { gap: 1 }),
    act('parcels-sort','The Woodland Post','sort',20,-27,
      'Send each picture parcel to the basket with its first sound.',
      'The parcels are in their groups. Set them down in the little store.', { pair: ['b','c'] }),
    act('parcels-place','The Little Store','place',15,-29,
      'Listen and put each delivery in its place. Everything will be ready for the gathering.',
      'Every delivery is ready. The new path leads back to the great lantern tree.'),
  ], 'The deliveries are ready for the gathering.', false),
  project('tree','The woodland homecoming','The Pals','lantern',['picnic','brook','garden','parcels'],[
    act('tree-signs','The Tree Trail','onset',1,-31,
      'The Pals are coming to the tree. Choose sound pictures to mark the gathering trail.',
      'The trail is marked. Finish the last sign labels at the little clearing.'),
    act('tree-labels','The Last Little Letters','gap',8,-27,
      'Some sign labels are missing their last letter. Listen to the whole word and finish it.',
      'Every sign is ready. Bring the sounds back to the great lantern tree.', { gap: 2 }),
    act('tree-light','Bring Back the Light','build',1,-31,
      'Build the last words. The three little lights will shine together in the lantern tree.',
      'You did it! The lights are home, the paths are open, and the woodland picnic can begin.'),
  ], 'You brought the woodland together.', false),
]);

export const NARRATION = Object.freeze({
  'chapter-welcome': 'The little lights are missing, and the Pals are getting ready for a woodland picnic. Explore the paths. Help Woolly or Splashy first.',
  'chapter-finish': 'The woodland is glowing again! The picnic is ready, the bridge is mended, and every parcel is home. You helped all the Pals. What a lovely place to come back to!',
  'chapter-onset': 'Listen to the first sound. Choose a picture that starts with it.',
  'chapter-gap': 'Listen to the word. Tap its missing letter.',
  'chapter-build': 'Listen to the word. Plant its sounds in order.',
  'chapter-sort': 'Listen to the word. Choose its first sound basket.',
  'chapter-next': 'Listen for the next sound.',
  'chapter-different': 'That is a different sound. Listen again.',
  'chapter-map': 'Choose a place to help. A leaf means the path is open. A tick means you have finished.',
  'chapter-visit': 'This part is finished. Follow the path to the next little job.',
  ...Object.fromEntries(PROJECTS.flatMap(p => p.acts.flatMap(a => [
    ['story-' + a.id, a.story], ['done-' + a.id, a.done],
  ]))),
  ...Object.fromEntries(RELATIONS.map(r => ['place-name-' + r.id, r.phrase + '.'])),
  ...Object.fromEntries(RELATIONS.map(r => ['place-retry-' + r.id, "That's " + r.phrase + '. Listen to where it belongs.'])),
  ...Object.fromEntries(PLACE_WORDS.flatMap(w => RELATIONS.flatMap(r => [
    ['put-' + w + '-' + r.id, 'Put the ' + w + ' ' + r.phrase + '.'],
    ['placed-' + w + '-' + r.id, 'The ' + w + ' is ' + r.phrase + '.'],
  ]))),
});
export const CHAPTER_AUDIO = Object.freeze({
  ...DEMO_AUDIO,
  ...Object.fromEntries(CHAPTER_WORDS.map(w => ['word:' + w, '/assets/audio/word-' + w + '.mp3'])),
  ...Object.fromEntries(Object.keys(NARRATION).map(id => [id, '/assets/audio/chapter/' + id + '.mp3'])),
});
export const ACTS = Object.freeze(PROJECTS.flatMap((p, projectIndex) =>
  p.acts.map((a, actIndex) => ({ ...a, projectIndex, actIndex, projectId: p.id, icon: p.icon, name: a.title, action: a.kind === 'place' ? 'Put things in place' : a.kind === 'sort' ? 'Sort the parcels' : a.kind === 'build' ? 'Build the words' : a.kind === 'gap' ? 'Finish the words' : 'Find the sounds' }))));

export function activityDeck(act, seed) {
  const ordinal = ACTS.findIndex(a => a.id === act.id);
  const salt = (seed + (ordinal + 1) * 104729) >>> 0;
  let words;
  if (act.kind === 'sort') {
    words = shuffle(act.pair.flatMap((s, i) => shuffle(CHAPTER_WORDS.filter(w => w[0] === s), salt + i * 31).slice(0, 4)), salt + 173);
  } else words = shuffle(act.kind === 'place' ? PLACE_WORDS : act.kind === 'onset' ? ONSET_WORDS : CVC_WORDS, salt).slice(0, 8);
  return words.map((word, i) => {
    const roundSeed = salt + i * 997;
    const base = { id: act.id + ':' + word, kind: act.kind, word, picture: pictureFor(word), phonemes: [...word] };
    if (act.kind === 'onset') {
      const others = shuffle(ONSET_WORDS.filter(w => w[0] !== word[0] && !NAMING_NEIGHBOURS.some(pair => pair.includes(word) && pair.includes(w))), roundSeed).slice(0, 2);
      return { ...base, target: word[0], answer: word, instruction: 'Find a picture with this first sound.',
        promptAudio: ['chapter-onset', 'phoneme:' + word[0]],
        correctAudio: ['word:' + word, 'starts-with', 'phoneme:' + word[0]],
        choices: shuffle([word, ...others], roundSeed + 77).map(w => ({ id: w, label: w, picture: pictureFor(w), audio: 'word:' + w })) };
    }
    if (act.kind === 'gap') {
      const target = word[act.gap];
      const pool = ('aeiou'.includes(target) ? [...'aeiou'] : [...'bcdglmnpstv']).filter(l => l !== target);
      return { ...base, gap: act.gap, target, answer: target, instruction: 'Tap the missing letter.',
        promptAudio: ['chapter-gap', 'word:' + word],
        correctAudio: ['phoneme:' + target, 'word:' + word],
        choices: shuffle([target, ...shuffle(pool, roundSeed).slice(0, 2)], roundSeed + 77).map(l => ({ id: l, label: l, audio: 'phoneme:' + l })) };
    }
    if (act.kind === 'build') return { ...base, answer: word, instruction: 'Plant the sounds in order.',
      promptAudio: ['chapter-build', 'word:' + word], correctAudio: ['you-built', 'word:' + word],
      choices: shuffle([...word].map((l, index) => ({ id: l + '-' + index, label: l, audio: 'phoneme:' + l })), roundSeed) };
    if (act.kind === 'sort') return { ...base, answer: word[0], target: word[0], instruction: 'Choose its first sound basket.',
      promptAudio: ['chapter-sort', 'word:' + word], correctAudio: ['word:' + word, 'starts-with', 'phoneme:' + word[0]],
      choices: shuffle(act.pair, roundSeed).map(l => ({ id: l, label: l, audio: 'phoneme:' + l })) };
    const relation = RELATIONS[(i + salt % 3) % 3];
    return { ...base, answer: relation.id, target: relation.id, relation, instruction: 'Put the ' + word + ' ' + relation.phrase + '.',
      promptAudio: ['put-' + word + '-' + relation.id], correctAudio: ['placed-' + word + '-' + relation.id],
      choices: RELATIONS.map(r => ({ ...r, label: r.phrase, audio: 'place-name-' + r.id })) };
  });
}

export function retryFor(round, choice, nextIndex) {
  if (round.kind === 'place') return { text: "That's " + choice.label + '. Listen again.', audio: ['place-retry-' + choice.id, ...round.promptAudio] };
  if (round.kind === 'onset') return { text: choice.label + ' has a different first sound. Listen again.', audio: [choice.audio, 'starts-with', 'phoneme:' + choice.label[0], 'chapter-onset', 'phoneme:' + round.target] };
  if (round.kind === 'build') return { text: 'Listen for the next sound.', audio: [choice.audio, 'chapter-next', 'phoneme:' + round.word[nextIndex]] };
  return { text: 'Listen to the word and try again.', audio: [choice.audio, 'chapter-different', ...round.promptAudio] };
}
