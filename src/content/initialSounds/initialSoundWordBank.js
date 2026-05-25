export const INITIAL_SOUND_LETTERS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "y", "z"
];

export const INITIAL_SOUND_ROUND_LENGTH = 15;

const levelOneWords = {
  a: ["ant", "apple", "ax", "arrow", "ankle", "acorn", "apron", "anchor", "album", "animal"],
  b: ["ball", "bed", "bag", "bat", "bell", "box", "bus", "bird", "boat", "book"],
  c: ["cat", "cup", "cap", "cake", "car", "cow", "corn", "coat", "candy", "candle"],
  d: ["dog", "duck", "door", "doll", "desk", "dish", "drum", "deer", "donut", "daisy"],
  e: ["egg", "elf", "elbow", "elephant", "engine", "envelope", "exit", "empty", "eagle", "ear"],
  f: ["fish", "fan", "farm", "flag", "frog", "fork", "fox", "feather", "fence", "flower"],
  g: ["goat", "gum", "gate", "gift", "girl", "goose", "grape", "green", "garden", "guitar"],
  h: ["hat", "hand", "ham", "hen", "hill", "house", "horse", "hammer", "heart", "honey"],
  i: ["igloo", "insect", "inch", "ink", "island", "iguana", "inside", "itch", "ivy", "inchworm"],
  j: ["jam", "jet", "jar", "jacket", "jump", "juice", "jelly", "jewel", "jeep", "jungle"],
  k: ["kite", "key", "king", "kid", "kettle", "kitten", "koala", "kangaroo", "kiwi", "keyboard"],
  l: ["log", "lamp", "leaf", "lion", "lock", "leg", "lemon", "ladder", "lake", "lunch"],
  m: ["map", "milk", "mug", "moon", "mat", "mouse", "mitten", "monkey", "muffin", "mirror"],
  n: ["nest", "net", "nut", "nail", "nose", "neck", "napkin", "noodle", "needle", "newt"],
  o: ["octopus", "otter", "ostrich", "olive", "orange", "ox", "ocean", "oven", "oval", "owl"],
  p: ["pan", "pig", "pin", "pot", "pen", "pumpkin", "pencil", "panda", "pizza", "pond"],
  q: ["queen", "quilt", "quail", "quarter", "quill", "quiz", "question", "quiet", "quick", "quokka"],
  r: ["ring", "rat", "rug", "rain", "rope", "rabbit", "rocket", "robot", "ruler", "rose"],
  s: ["sun", "sock", "sand", "seed", "soap", "seal", "star", "snake", "spoon", "shell"],
  t: ["top", "tap", "tent", "tub", "tiger", "turtle", "table", "tooth", "truck", "tree"],
  u: ["umbrella", "up", "under", "uncle", "umpire", "underwear", "utensil", "ukulele", "upstairs", "urchin"],
  v: ["van", "vest", "vase", "vine", "violin", "volcano", "vegetable", "valley", "vulture", "vacuum"],
  w: ["web", "wig", "window", "wagon", "water", "watch", "wheel", "whale", "worm", "wallet"],
  y: ["yak", "yam", "yarn", "yoyo", "yellow", "yogurt", "yolk", "yard", "yacht", "yo-yo"],
  z: ["zebra", "zipper", "zoo", "zero", "zucchini", "zigzag", "zip", "zone", "zinnia", "zookeeper"]
};

const levelTwoWords = {
  a: ["astronaut", "ambulance", "apartment", "avocado", "accordion", "airport", "apricot", "athlete", "antenna", "asteroid"],
  b: ["banana", "basket", "balloon", "butterfly", "backpack", "bicycle", "broccoli", "building", "baseball", "beaver"],
  c: ["calculator", "camera", "caterpillar", "cucumber", "computer", "castle", "carrot", "calendar", "carousel", "coconut"],
  d: ["dinosaur", "diamond", "dolphin", "doctor", "dragonfly", "dessert", "dictionary", "dandelion", "domino", "delivery"],
  e: ["elevator", "eraser", "exercise", "earmuffs", "earthworm", "eggplant", "electrician", "engineer", "easel", "evergreen"],
  f: ["firefighter", "flamingo", "football", "fountain", "flashlight", "fireworks", "fishing pole", "ferry", "fossil", "furniture"],
  g: ["gorilla", "giraffe", "goggles", "grocery", "garbage truck", "goldfish", "greenhouse", "gingerbread", "goalpost", "globe"],
  h: ["helicopter", "hamburger", "hospital", "hummingbird", "hairbrush", "haystack", "harmonica", "hedgehog", "hotdog", "honeybee"],
  i: ["iceberg", "instrument", "instructor", "invitation", "inspector", "icicle", "illustration", "icebox", "inkwell", "iron"],
  j: ["jellyfish", "jaguar", "jump rope", "jigsaw", "jewelry", "journal", "juggler", "jackhammer", "jellybean", "jetpack"],
  k: ["kayak", "kitchen", "ketchup", "kingdom", "kiwifruit", "kindergarten", "knapsack", "karate", "kazoo", "kiosk"],
  l: ["ladybug", "lollipop", "lemonade", "lighthouse", "lawnmower", "library", "lobster", "luggage", "laboratory", "lantern"],
  m: ["motorcycle", "magnet", "mushroom", "microphone", "mountain", "mailbox", "medicine", "mermaid", "marshmallow", "measuring cup"],
  n: ["newspaper", "notebook", "necklace", "nightlight", "narwhal", "number", "noodles", "nurse", "navigator", "nutcracker"],
  o: ["octagon", "omelet", "orangutan", "overalls", "opera", "orchard", "oatmeal", "observer", "obstacle", "office"],
  p: ["parachute", "pineapple", "penguin", "pajamas", "popsicle", "playground", "pepper", "postcard", "pretzel", "paintbrush"],
  q: ["question mark", "quicksand", "quarterback", "quilted blanket", "quail nest", "quiet room", "queen bee", "quartz", "quiver", "quickstep"],
  r: ["rainbow", "refrigerator", "raccoon", "roller skates", "rectangle", "radio", "restaurant", "robotics", "raindrop", "reindeer"],
  s: ["sandwich", "sailboat", "suitcase", "submarine", "strawberry", "snowman", "spaceship", "scooter", "sunglasses", "scarecrow"],
  t: ["telephone", "tomato", "telescope", "toothbrush", "traffic light", "trampoline", "treasure", "thermometer", "tractor", "tornado"],
  u: ["unicycle", "uniform", "uphill", "utensils", "underground", "unpacking", "upbeat", "uplift", "umpire mask", "urban garden"],
  v: ["volleyball", "veterinarian", "vegetable soup", "vacation", "village", "video camera", "violinist", "velvet", "vineyard", "visitor"],
  w: ["watermelon", "wheelbarrow", "windmill", "waterfall", "woodpecker", "waffle", "weather", "wetsuit", "workshop", "wildflower"],
  y: ["yellow jacket", "yogurt cup", "yardstick", "yo-yo string", "yearbook", "yawning child", "yodeler", "yoga mat", "yarn basket", "yucca plant"],
  z: ["zipline", "zebra crossing", "zigzag road", "zipper pouch", "zinnia flower", "zoo gate", "zebra mask", "zoo train", "zeppelin", "zesty lemon"]
};

const phonemeByLetter = {
  a: "/a/", b: "/b/", c: "/k/", d: "/d/", e: "/e/", f: "/f/", g: "/g/", h: "/h/",
  i: "/i/", j: "/j/", k: "/k/", l: "/l/", m: "/m/", n: "/n/", o: "/o/", p: "/p/",
  q: "/kw/", r: "/r/", s: "/s/", t: "/t/", u: "/u/", v: "/v/", w: "/w/", y: "/y/", z: "/z/"
};

const syllableOverrides = {
  accordion: 4,
  ambulance: 3,
  astronaut: 3,
  calculator: 4,
  caterpillar: 4,
  veterinarian: 5,
  refrigerator: 5,
  "traffic light": 3,
  "question mark": 3,
  "vegetable soup": 4
};

const tagsByWord = word => {
  const text = String(word);
  const tags = [];
  if (/\b(cat|dog|duck|fish|frog|goat|horse|lion|mouse|zebra|penguin|kangaroo|dolphin|gorilla|jaguar|otter|quail|rabbit|turtle|yak|panda|monkey|beaver|flamingo|hedgehog|narwhal|orangutan|woodpecker)\b/.test(text)) tags.push("animal");
  if (/\b(apple|banana|carrot|corn|donut|egg|grape|ham|jam|lemon|milk|noodle|orange|pan|pizza|pumpkin|sandwich|tomato|watermelon|yogurt|zucchini|avocado|apricot|cucumber|coconut|oatmeal|pepper|pretzel|waffle)\b/.test(text)) tags.push("food");
  if (/\b(ball|bed|bag|book|cup|desk|door|fan|hat|key|lamp|map|net|pen|pencil|quilt|ring|sock|table|umbrella|van|web|window)\b/.test(text)) tags.push("concrete");
  return tags.length ? tags : ["imageable", "concrete"];
};

const countSyllables = word => {
  const normalized = String(word).toLowerCase();
  if (syllableOverrides[normalized]) return syllableOverrides[normalized];
  return Math.max(1, normalized
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(/\s+/)
    .reduce((total, part) => total + Math.max(1, (part.match(/[aeiouy]+/g) || []).length), 0));
};

export const normalizeInitialSoundWord = word =>
  String(word || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const distractorLettersFor = (letter, difficulty) => {
  const index = INITIAL_SOUND_LETTERS.indexOf(letter);
  const offsets = difficulty === "easy" ? [5, 11, 17] : [1, 6, 13];
  return [letter, ...offsets.map(offset => INITIAL_SOUND_LETTERS[(index + offset) % INITIAL_SOUND_LETTERS.length])];
};

const blockedInitialSoundTargets = {
  acorn: {
    status: "needs_image_replacement",
    reason: "Current image is overly stylized/rainbow-colored for an ordinary acorn and is blocked from active assessment use."
  },
  nut: {
    status: "needs_image_replacement",
    reason: "Current image is overly stylized/rainbow-colored and too confusable with acorn-style imagery for a generic nut."
  },
  zinnia: {
    status: "excluded_unsuitable_word",
    reason: "Zinnia is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word."
  },
  "zinnia-flower": {
    status: "excluded_unsuitable_word",
    reason: "Zinnia flower is too unusual for this K-2 Initial Sounds assessment bank and should be replaced with a simpler /z/ word."
  },
  zannia: {
    status: "excluded_unsuitable_word",
    reason: "Zannia appears to be a misspelled/unusual target and is not suitable for active assessment use."
  },
  zone: {
    status: "excluded_unsuitable_word",
    reason: "Zone is abstract and hard to image clearly for early Initial Sounds assessment."
  },
  observer: {
    status: "excluded_unsuitable_word",
    reason: "Observer is abstract/role-based and hard to image clearly for early Initial Sounds assessment."
  },
  opera: {
    status: "excluded_unsuitable_word",
    reason: "Opera is culturally specific and too hard to image clearly for early Initial Sounds assessment."
  },
  quartz: {
    status: "excluded_unsuitable_word",
    reason: "Quartz is obscure for K-2 Initial Sounds assessment and should not be active without explicit vocabulary teaching."
  },
  quiver: {
    status: "excluded_unsuitable_word",
    reason: "Quiver is potentially ambiguous and not a strong K-2 Initial Sounds assessment target."
  },
  quickstep: {
    status: "excluded_unsuitable_word",
    reason: "Quickstep is obscure/culturally specific and not a strong K-2 Initial Sounds assessment target."
  },
  upbeat: {
    status: "excluded_unsuitable_word",
    reason: "Upbeat is abstract and hard to image clearly for early Initial Sounds assessment."
  },
  uplift: {
    status: "excluded_unsuitable_word",
    reason: "Uplift is abstract and hard to image clearly for early Initial Sounds assessment."
  },
  "urban-garden": {
    status: "excluded_unsuitable_word",
    reason: "Urban garden is a phrase with a less clear single target object for early Initial Sounds assessment."
  },
  utensils: {
    status: "needs_media_asset",
    reason: "Required image and audio are missing, so this item is blocked from active assessment until media exists."
  },
  underground: {
    status: "needs_media_asset",
    reason: "Required image is missing, so this item is blocked from active assessment until media exists."
  },
  vacation: {
    status: "needs_media_asset",
    reason: "Required image is missing, so this item is blocked from active assessment until media exists."
  },
  velvet: {
    status: "excluded_unsuitable_word",
    reason: "Velvet is texture-based and hard to image unambiguously for early Initial Sounds assessment."
  },
  village: {
    status: "needs_media_asset",
    reason: "Required image is missing, so this item is blocked from active assessment until media exists."
  },
  yodeler: {
    status: "excluded_unsuitable_word",
    reason: "Yodeler is culturally specific and not a strong K-2 Initial Sounds assessment target."
  },
  "yucca-plant": {
    status: "excluded_unsuitable_word",
    reason: "Yucca plant is less familiar and not a strong early Initial Sounds target."
  },
  zigzag: {
    status: "needs_media_asset",
    reason: "Required image is missing, so this item is blocked from active assessment until media exists."
  },
  zeppelin: {
    status: "excluded_unsuitable_word",
    reason: "Zeppelin is obscure for K-2 Initial Sounds assessment and is blocked from active use."
  },
  "zesty-lemon": {
    status: "needs_media_asset",
    reason: "Required image and audio are missing, so this item is blocked from active assessment until media exists."
  }
};

function makeInitialSoundItem(letter, targetWord, level, index) {
  const wordKey = normalizeInitialSoundWord(targetWord);
  const difficulty = level === 1 ? "easy" : "challenge";
  const syllables = countSyllables(targetWord);
  const blockedTarget = blockedInitialSoundTargets[wordKey];

  return {
    id: `fs_${letter}_${wordKey}_l${level}`,
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    skill: "Initial Sounds",
    level,
    letter,
    targetWord,
    difficulty,
    syllables,
    phoneme: phonemeByLetter[letter],
    imageKey: `${letter}/${wordKey}`,
    imageUrl: `/media/initial-sounds/images/${letter}/${wordKey}.webp`,
    imagePath: `/media/initial-sounds/images/${letter}/${wordKey}.webp`,
    audioKey: `${letter}/${wordKey}`,
    audioUrl: `/media/initial-sounds/audio/${letter}/${wordKey}.mp3`,
    audioPath: `/media/initial-sounds/audio/${letter}/${wordKey}.mp3`,
    audioText: targetWord,
    correctAnswer: letter,
    answer: letter,
    answerOptions: distractorLettersFor(letter, difficulty),
    choices: distractorLettersFor(letter, difficulty),
    distractorType: level === 1 ? "easy" : "near-letter-review",
    tags: [...new Set([difficulty, level === 1 ? "level-1" : "level-2", ...tagsByWord(targetWord)])],
    active: !blockedTarget,
    qaStatus: blockedTarget?.status || "approved",
    qaNotes: blockedTarget?.reason || "",
    question: "Listen to the word. What sound does it start with?",
    prompt: "Listen to the word. What sound does it start with?",
    spokenPrompt: "Listen to the word.",
    questionType: "ixl_template",
    templateType: "FIRST_SOUND",
    formatType: "FIRST_SOUND",
    itemType: "initial_sound",
    itemKey: letter,
    bankIndex: index
  };
}

export const initialSoundRawWordBank = {
  1: levelOneWords,
  2: levelTwoWords
};

export const initialSoundWordBank = INITIAL_SOUND_LETTERS.flatMap(letter => [
  ...levelOneWords[letter].map((word, index) => makeInitialSoundItem(letter, word, 1, index)),
  ...levelTwoWords[letter].map((word, index) => makeInitialSoundItem(letter, word, 2, index))
]);

export const getInitialSoundItemsByLevel = level =>
  initialSoundWordBank.filter(item => item.level === Number(level));

export const getInitialSoundItemsByLetter = (letter, level) =>
  initialSoundWordBank.filter(item =>
    item.letter === letter && (!level || item.level === Number(level))
  );

export const initialSoundBankSummary = INITIAL_SOUND_LETTERS.map(letter => ({
  letter,
  level1: levelOneWords[letter].length,
  level2: levelTwoWords[letter].length,
  total: levelOneWords[letter].length + levelTwoWords[letter].length
}));
