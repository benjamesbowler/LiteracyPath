// Explicit speech-sound membership. Do not derive sounds from first letters:
// elephant is short e, eagle is not; x is /ks/ at the end of fox; who is /h/.
// These are curriculum examples, not an alternate image or audio catalogue.
// Keep the programme's rejected basic picture labels out of both play areas.
// Sound membership alone cannot make a relationship such as "uncle" visible.
export const CYCLE_PICTURE_WORD_HOLDOUTS = Object.freeze(['olive', 'otter', 'quiz', 'uncle', 'vet', 'yak', 'yarn']);
export const isCyclePictureWordEligible = word => !CYCLE_PICTURE_WORD_HOLDOUTS.includes(word);

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
  y: ['yak', 'yarn', 'yo-yo', 'yawn', 'yogurt', 'yolk', 'yacht'],
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
const EQUIVALENT = [['c', 'k'], ['w', 'wh'], ['f', 'ff'], ['s', 'ss'], ['z', 'zz'], ['l', 'll']];

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
