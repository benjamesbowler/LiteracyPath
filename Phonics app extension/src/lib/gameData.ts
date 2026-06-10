export const CVC_WORDS = {
  easy: [
    'cat', 'dog', 'sun', 'hat', 'bat', 'car', 'pen', 'bed', 'red', 'bus',
    'cup', 'bug', 'run', 'box', 'fox', 'map', 'lip', 'leg', 'pig', 'top',
  ],
  medium: [
    'ship', 'fish', 'frog', 'crab', 'tree', 'star', 'flag', 'sock', 'lamp', 'ring',
  ],
  hard: [
    'brush', 'clock', 'train', 'plant', 'shirt', 'bread', 'dress', 'glass', 'stamp',
  ],
};

export const SIGHT_WORDS = {
  level1: [
    'the', 'and', 'is', 'to', 'of', 'a', 'in', 'you', 'it', 'he',
    'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be',
  ],
  level2: [
    'this', 'have', 'from', 'or', 'one', 'had', 'by', 'words', 'but', 'not',
    'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use',
  ],
  level3: [
    'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other',
    'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would',
  ],
};

export const RHYMING_PAIRS = [
  ['cat', 'hat'], ['dog', 'log'], ['sun', 'fun'], ['bed', 'red'],
  ['car', 'star'], ['pen', 'hen'], ['bus', 'us'], ['map', 'cap'],
  ['pig', 'big'], ['top', 'hop'],
];

export const SENTENCES = {
  level1: [
    { sentence: 'The cat sat on the mat.', question: 'What did the cat sit on?', answer: 'mat' },
    { sentence: 'I can see a big red bus.', question: 'What colour is the bus?', answer: 'red' },
    { sentence: 'The dog ran in the sun.', question: 'Where did the dog run?', answer: 'sun' },
  ],
  level2: [
    { sentence: 'She had a cup of tea on the bed.', question: 'What did she drink?', answer: 'tea' },
    { sentence: 'We can see the stars at night.', question: 'When can we see stars?', answer: 'night' },
    { sentence: 'The frog jumped on the log.', question: 'What did the frog do?', answer: 'jumped' },
  ],
  level3: [
    { sentence: 'The children played with their toys in the garden.', question: 'What did the children play with?', answer: 'toys' },
    { sentence: 'We went to the shop to buy some bread and milk.', question: 'What did we buy?', answer: 'bread' },
  ],
};

export const WORD_FAMILIES: Record<string, string[]> = {
  '-AT': ['cat', 'bat', 'hat', 'mat', 'rat', 'sat'],
  '-AN': ['can', 'fan', 'man', 'pan', 'ran', 'van'],
  '-IG': ['big', 'dig', 'fig', 'pig', 'wig'],
  '-OP': ['hop', 'mop', 'pop', 'top'],
  '-UN': ['sun', 'fun', 'run', 'bun', 'gun', 'nun'],
  '-EN': ['pen', 'hen', 'ten', 'men', 'den'],
};

export interface GameMeta {
  id: string;
  title: string;
  skill: string;
  category: string;
  color: string;
  icon: string;
  description: string;
}

export const GAME_LIST: GameMeta[] = [
  {
    id: 'cvc-word-builder',
    title: 'CVC Word Builder',
    skill: 'CVC Words',
    category: 'CVC Words',
    color: 'bg-blush',
    icon: '/icon-cvc-builder.png',
    description: 'Build 3-letter words one sound at a time!',
  },
  {
    id: 'sight-word-memory',
    title: 'Sight Word Memory',
    skill: 'Sight Words',
    category: 'Sight Words',
    color: 'bg-mint',
    icon: '/icon-sight-memory.png',
    description: 'Match the sight word pairs before time runs out!',
  },
  {
    id: 'sound-slide',
    title: 'Sound Slide',
    skill: 'Blending',
    category: 'Blending',
    color: 'bg-lavender-pale',
    icon: '/icon-sound-slide.png',
    description: 'Slide letter tiles together to hear the sounds blend!',
  },
  {
    id: 'blend-build',
    title: 'Blend & Build',
    skill: 'Blending',
    category: 'Blending',
    color: 'bg-lemon',
    icon: '/icon-blend-build.png',
    description: 'Blend onset and rime to build new words!',
  },
  {
    id: 'rhyme-time',
    title: 'Rhyme Time',
    skill: 'CVC Words',
    category: 'CVC Words',
    color: 'bg-sky-pale',
    icon: '/icon-rhyme-time.png',
    description: 'Find the words that sound the same at the end!',
  },
  {
    id: 'sight-word-fishing',
    title: 'Sight Word Fishing',
    skill: 'Sight Words',
    category: 'Sight Words',
    color: 'bg-peach',
    icon: '/icon-word-fishing.png',
    description: 'Catch the right sight word fish from the pond!',
  },
  {
    id: 'cvc-train',
    title: 'CVC Train',
    skill: 'CVC Words',
    category: 'CVC Words',
    color: 'bg-frost',
    icon: '/icon-word-train.png',
    description: 'Load letter carriages onto the train to make words!',
  },
  {
    id: 'pop-the-word',
    title: 'Pop the Word',
    skill: 'Sight Words',
    category: 'Sight Words',
    color: 'bg-sage',
    icon: '/icon-pop-word.png',
    description: 'Pop the balloons with the matching sight words!',
  },
  {
    id: 'word-hopscotch',
    title: 'Word Hopscotch',
    skill: 'CVC Words',
    category: 'CVC Words',
    color: 'bg-sands',
    icon: '/icon-word-hopscotch.png',
    description: 'Hop from word to word in the correct order!',
  },
  {
    id: 'reading-race',
    title: 'Reading Race',
    skill: 'Reading',
    category: 'Reading',
    color: 'bg-petal',
    icon: '/icon-reading-race.png',
    description: 'Read the sentences and race to the finish line!',
  },
];
