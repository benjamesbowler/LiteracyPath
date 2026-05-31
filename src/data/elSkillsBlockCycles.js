export const EL_LEARN_SECTION_IDS = [
  "overview",
  "letterLearning",
  "poemAndChant",
  "phonemicAwareness",
  "rhyming",
  "highFrequencyWords",
  "decoding",
  "writing",
  "worksheets",
  "teacherNotes"
];

export const EL_LEARN_SECTION_LABELS = {
  overview: "Cycle Overview",
  letterLearning: "Letter & Sound Learning",
  poemAndChant: "Poem / Chant / Oral Language",
  phonemicAwareness: "Phonemic Awareness",
  rhyming: "Rhyming / Word Play",
  highFrequencyWords: "High-Frequency Words",
  decoding: "Decoding / Chaining",
  writing: "Writing / Encoding Practice",
  worksheets: "Worksheet Generator",
  teacherNotes: "Teacher Notes / Small Group Ideas"
};

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const LETTER_EXAMPLES = {
  a: ["apple", "ant", "alligator", "ax"],
  m: ["moon", "mouse", "map", "mat"],
  t: ["top", "tap", "tent", "turtle"],
  s: ["sun", "sit", "sock", "seal"],
  n: ["net", "nap", "nest", "nose"],
  i: ["igloo", "insect", "ink", "itch"],
  f: ["fan", "fish", "fig", "fox"],
  d: ["dog", "dig", "desk", "duck"],
  o: ["octopus", "on", "ox", "otter"],
  l: ["log", "lap", "leaf", "lamp"],
  r: ["run", "red", "rug", "rabbit"],
  h: ["hat", "hop", "hen", "house"],
  b: ["bear", "ball", "bat", "book", "bag", "bell"],
  w: ["wolf", "watch", "watermelon", "wave", "web", "wig"],
  qu: ["queen", "quick", "quack", "quiz"],
  u: ["up", "umbrella", "under", "mud"],
  c: ["cat", "cap", "cup", "can"],
  g: ["gum", "goat", "gap", "gift"],
  p: ["pan", "pig", "pot", "pup"],
  y: ["yes", "yak", "yarn", "yellow"],
  x: ["box", "fox", "mix", "six"],
  e: ["egg", "end", "elephant", "exit"],
  v: ["van", "vet", "vest", "vine"],
  k: ["kit", "kid", "kite", "kangaroo"],
  j: ["jam", "jet", "jug", "jump"],
  z: ["zip", "zap", "zoo", "zero"],
  sh: ["ship", "sheep", "shop", "shark", "shell", "shut"],
  ch: ["chip", "chair", "cheese", "chin", "chop", "chat"],
  th: ["thumb", "three", "teeth", "thin", "think", "that"],
  all: ["all", "ball", "fall", "call"],
  wh: ["what", "when", "who", "whisk"],
  nk: ["sink", "bank", "pink", "wink"],
  ng: ["ring", "sing", "king", "song", "long", "hung"],
  fszl: ["puff", "miss", "buzz", "will"],
  pattern: ["by", "my", "try", "why"]
};

const FORMATION = {
  a: {
    upper: "Use the Aa stroke model image.",
    lower: "Write Aa after watching the model."
  },
  m: {
    upper: "Use the Mm stroke model image.",
    lower: "Write Mm after watching the model."
  },
  default: {
    upper: "Use the stroke model image.",
    lower: "Write after watching the model."
  }
};

const GUIDED_READING_FICTION_SEQUENCE = [
  { bookId: "bob-and-nan-01", title: "Bob and Nan", level: "A" },
  { bookId: "bob-and-nan-03-fluff", title: "Bob, Nan and Fluff", level: "A" },
  { bookId: "bob-and-nan-02-park", title: "Bob and Nan go to the Park", level: "A" },
  { bookId: "bob-and-nan-06-zoo", title: "Nan and Bob go to the Zoo", level: "A" },
  { bookId: "james-and-anna-02-chips", title: "James and Anna and Chips", level: "B" },
  { bookId: "james-and-anna-05-tree-house", title: "James and Anna build a Tree House", level: "B" },
  { bookId: "ja-b-06", title: "James and Anna visit Grandma's Farm", level: "B" },
  { bookId: "ja-b-09", title: "James and Anna's New Bikes", level: "B" },
  { bookId: "dino-pals-15-sneezy-and-the-waterfall", title: "Sneezy and the Waterfall", level: "B" },
  { bookId: "moonwood-tales-c-01", title: "Moonwood Tales 1", level: "C" },
  { bookId: "ab-c-01", title: "Aiden and Betty Start Grade 1", level: "C" },
  { bookId: "moonwood-tales-c-05", title: "Moonwood Tales 5", level: "C" }
];

const GUIDED_READING_NONFICTION_SEQUENCE = [
  { bookId: "first-facts-level-a-13-fruit", title: "Fruit", level: "A" },
  { bookId: "first-facts-level-a-08-my-pet", title: "My Pet", level: "A" },
  { bookId: "first-facts-level-a-11-at-the-farm", title: "At the Farm", level: "A" },
  { bookId: "first-facts-level-a-07-bugs", title: "Bugs", level: "A" },
  { bookId: "first-facts-level-a-05-the-sky", title: "The Sky", level: "A" },
  { bookId: "first-facts-level-a-01-colors", title: "Colors", level: "A" },
  { bookId: "first-facts-level-a-06-animals-can", title: "Animals Can!", level: "A" },
  { bookId: "first-facts-level-a-17-a-seed-grows", title: "A Seed Grows", level: "A" },
  { bookId: "gr-a-27", title: "Day and Night", level: "B" },
  { bookId: "gr-a-26", title: "What Is a Map?", level: "B" },
  { bookId: "gr-b-31", title: "Animal Homes", level: "B" },
  { bookId: "gr-c-37", title: "How Seeds Travel", level: "C" }
];

function selectGuidedReadingBook(sequence, cycleNumber) {
  if (!cycleNumber) return sequence[0] || null;
  const index = Math.min(sequence.length - 1, Math.max(0, Math.floor((cycleNumber - 1) / 3)));
  return sequence[index] || null;
}

function makeGuidedReadingRecommendation(book, type, seed, focusLetters) {
  if (!book) return null;
  const skillConnections = focusLetters
    .map(card => `${card.grapheme} ${card.sound || ""}`.trim())
    .filter(Boolean);
  const hfwConnections = seed.highFrequencyWords || [];
  const patternConnections = focusLetters.map(card => card.spelling).filter(Boolean);
  const focusLabel = skillConnections.length ? skillConnections.slice(0, 3).join(", ") : "review routines";
  return {
    bookId: book.bookId,
    title: book.title,
    level: book.level,
    type,
    reason: type === "fiction"
      ? `A ${book.level}-level fiction read that gives students story language while listening for ${focusLabel}.`
      : `A ${book.level}-level non-fiction read that builds knowledge and gives students a real-world reason to listen for ${focusLabel}.`,
    skillConnections,
    hfwConnections,
    patternConnections,
    imageQaStatus: "not_flagged"
  };
}

function makeGuidedReadingRecommendations(seed, focusLetters) {
  const fiction = selectGuidedReadingBook(GUIDED_READING_FICTION_SEQUENCE, seed.cycleNumber);
  const nonfiction = selectGuidedReadingBook(GUIDED_READING_NONFICTION_SEQUENCE, seed.cycleNumber);
  return {
    fiction: makeGuidedReadingRecommendation(fiction, "fiction", seed, focusLetters),
    nonfiction: makeGuidedReadingRecommendation(nonfiction, "nonfiction", seed, focusLetters),
    note: fiction && nonfiction ? "" : "No strong match yet. Needs future guided-reading book."
  };
}

const CYCLE_SEEDS = [
  { id: "boy-assessment", title: "BOY Assessment", type: "assessment", phase: "baseline", focusLetters: [], highFrequencyWords: [], phonemicAwareness: ["Letter Identification", "Phonological and Phonemic Awareness"], routines: ["NWEA MAP BOY", "Use results to assign small group and individual work cycles"], friday: "Benchmark planning" },
  { cycleNumber: 1, phase: "early-letter-sound", focusLetters: [["Aa", "/ă/", "a", "Monday"], ["Mm", "/m/", "m", "Tuesday"]], highFrequencyWords: ["am", "I"], phonemicAwareness: ["Delete the first part of compound words", "Rhyming recognition"], friday: "Cycle Practice" },
  { cycleNumber: 2, phase: "early-letter-sound", focusLetters: [["Tt", "/t/", "t", "Monday"], ["Ss", "/s/", "s", "Tuesday"]], highFrequencyWords: ["a", "the"], phonemicAwareness: ["Delete the first part of compound words", "Rhyming recognition"], friday: "Cycle Practice" },
  { cycleNumber: 3, phase: "early-letter-sound", focusLetters: [["Nn", "/n/", "n", "Monday"], ["Ii", "/ĭ/", "i", "Tuesday"]], highFrequencyWords: ["an", "and"], phonemicAwareness: ["Delete the last part of compound words", "Rhyming recognition"], friday: "Cycle Check" },
  { cycleNumber: 4, phase: "early-letter-sound", focusLetters: [["Ff", "/f/", "f", "Monday"], ["Dd", "/d/", "d", "Tuesday"]], highFrequencyWords: ["is", "of"], phonemicAwareness: ["Delete the last part of compound words", "Rhyming recognition"], friday: "Cycle Practice" },
  { id: "review-cycles-1-4", title: "Review / Extension Cycles 1-4", type: "review", phase: "review-extension", reviewLetters: ["a", "m", "t", "s", "n", "i", "f", "d"], highFrequencyWords: ["am", "I", "a", "the", "an", "and", "is", "of"], phonemicAwareness: ["Delete first and last parts of compound words", "Rhyming recognition"], friday: "Review and extension" },
  { cycleNumber: 5, phase: "letter-sound-expansion", focusLetters: [["Oo", "/ŏ/", "o", "Monday"], ["Ll", "/l/", "l", "Tuesday"]], highFrequencyWords: ["go", "no", "so"], phonemicAwareness: ["Delete the first part of two-syllable words", "Rhyming identification"], friday: "Cycle Check" },
  { cycleNumber: 6, phase: "letter-sound-expansion", focusLetters: [["Rr", "/r/", "r", "Monday"], ["Hh", "/h/", "h", "Tuesday"]], highFrequencyWords: ["do", "my", "to"], phonemicAwareness: ["Delete the first part of two-syllable words", "Rhyming identification"], friday: "Cycle Practice" },
  { cycleNumber: 7, phase: "microphase-wrap-up", reviewLetters: ["Aa", "Mm", "Tt", "Ss", "Nn", "Ii", "Ff", "Dd", "Oo", "Ll", "Rr", "Hh"], highFrequencyWords: ["into", "said"], phonemicAwareness: ["Delete part of two-syllable words", "Rhyming identification"], friday: "Microphase Assessment and Wrap-up" },
  { cycleNumber: 8, phase: "cvc-onset", focusLetters: [["Bb", "/b/", "b", "Monday"], ["Ww", "/w/", "w", "Tuesday"]], highFrequencyWords: ["not", "that"], phonemicAwareness: ["Delete onset of CVC words", "Rhyming identification"], friday: "Cycle Practice" },
  { cycleNumber: 9, phase: "cvc-onset", focusLetters: [["Qu/qu", "/kw/", "qu", "Monday"], ["Uu", "/ŭ/", "u", "Tuesday"]], highFrequencyWords: ["he", "me", "she"], phonemicAwareness: ["Delete onset of CVC words", "Rhyme production"], friday: "Cycle Practice" },
  { cycleNumber: 10, phase: "cvc-onset", focusLetters: [["Cc", "/k/", "c", "Monday"], ["Gg", "/g/", "g", "Tuesday"]], highFrequencyWords: ["are", "as", "you"], phonemicAwareness: ["Delete onset of CVC words", "Rhyming identification"], friday: "Cycle Practice" },
  { id: "review-cycles-8-10", title: "Review / Extension Cycles 8-10", type: "review", phase: "review-extension", reviewLetters: ["b", "w", "qu", "u", "c", "g"], highFrequencyWords: ["not", "that", "he", "me", "she", "are", "as", "you"], phonemicAwareness: ["Delete part of two-syllable words", "Rhyming identification", "Rhyme production"], friday: "Review and extension" },
  { cycleNumber: 11, phase: "cvc-rime", focusLetters: [["Pp", "/p/", "p", "Monday"], ["Yy", "/y/", "y", "Tuesday"], ["Xx", "/ks/", "x", "Wednesday"]], highFrequencyWords: ["see", "was"], phonemicAwareness: ["Delete rime of CVC words", "Rhyme production"], friday: "Cycle Practice" },
  { cycleNumber: 12, phase: "cvc-rime", focusLetters: [["Ee", "/ĕ/", "e", "Monday"], ["Vv", "/v/", "v", "Tuesday"]], highFrequencyWords: ["for", "or"], phonemicAwareness: ["Delete rime of CVC words", "Rhyme production"], friday: "Cycle Check" },
  { id: "review-cycles-11-12", title: "Review / Extension Cycles 11-12", type: "review", phase: "review-extension", reviewLetters: ["p", "y", "x", "e", "v"], highFrequencyWords: ["see", "was", "for", "or"], phonemicAwareness: ["Delete rime of CVC words", "Rhyme production"], friday: "Review and extension" },
  { id: "moy-assessment", title: "MOY Assessment", type: "assessment", phase: "benchmark", focusLetters: [], highFrequencyWords: [], phonemicAwareness: ["Letter Identification", "Phonological and Phonemic Awareness"], routines: ["NWEA MAP MOY", "Kindergarten Writing Benchmarks", "Use benchmark data to regroup"], friday: "Benchmark regrouping" },
  { cycleNumber: 13, phase: "letter-sound-completion", focusLetters: [["Kk", "/k/", "k", "Monday"], ["Jj", "/j/", "j", "Tuesday"], ["Zz", "/z/", "z", "Wednesday"]], highFrequencyWords: ["her", "his"], phonemicAwareness: ["Delete rime of CVC words", "Review rhyme identification and production"], friday: "Cycle Practice" },
  { cycleNumber: 14, phase: "microphase-wrap-up", reviewLetters: ["Bb", "Ww", "Qq", "Uu", "Cc", "Gg", "Pp", "Yy", "Xx", "Ee", "Vv", "Kk", "Jj", "Zz"], highFrequencyWords: ["this", "with", "your"], phonemicAwareness: ["Combine deletion skills with onset and rime", "Review rhyme identification and production"], friday: "Microphase Assessment and Wrap-up" },
  { cycleNumber: 15, phase: "digraphs", focusLetters: [["sh", "/sh/", "sh", "Monday"], ["ch", "/ch/", "ch", "Tuesday"], ["th", "/th/ and /TH/", "th", "Wednesday"]], highFrequencyWords: ["good", "look"], phonemicAwareness: ["Delete the first part of two-syllable words", "Substitute initial sound in CVC words"], friday: "Cycle Check" },
  { cycleNumber: 16, phase: "patterns", focusLetters: [["Aa", "/ă/", "a", "Monday"], ["all", "/all/", "all", "Tuesday"]], highFrequencyWords: ["all", "says", "they"], phonemicAwareness: ["Delete the last part of two-syllable words", "Substitute initial sound in CVC words"], friday: "Cycle Practice" },
  { cycleNumber: 17, phase: "patterns", focusLetters: [["Ii", "/ĭ/", "i", "Monday"]], highFrequencyWords: ["each", "like", "little"], phonemicAwareness: ["Delete the last part of two-syllable words", "Substitute initial sound in CVC words"], friday: "Cycle Practice" },
  { cycleNumber: 18, phase: "patterns", focusLetters: [["Oo", "/ŏ/", "o", "Monday"]], highFrequencyWords: ["from", "have", "more"], phonemicAwareness: ["Delete first syllable in three-syllable compound words", "Substitute initial sound of CVC words"], friday: "Cycle Check" },
  { cycleNumber: 19, phase: "patterns", focusLetters: [["Uu", "/ŭ/", "u", "Monday"]], highFrequencyWords: ["about", "out", "put"], phonemicAwareness: ["Delete first syllable in three-syllable compound words", "Substitute rime in CVC words"], friday: "Cycle Practice" },
  { cycleNumber: 20, phase: "patterns", focusLetters: [["Ee", "/ĕ/", "e", "Monday"]], highFrequencyWords: ["be", "get", "very"], phonemicAwareness: ["Delete first syllable in three-syllable words", "Substitute rime in CVC words"], friday: "Cycle Practice" },
  { cycleNumber: 21, phase: "patterns", focusLetters: [["wh", "/w/", "wh", "Monday"]], highFrequencyWords: ["what", "when", "who"], phonemicAwareness: ["Delete last syllable in three-syllable compound words", "Substitute rime of CVC words"], friday: "Microphase Assessment and Wrap-up" },
  { cycleNumber: 22, phase: "patterns", focusLetters: [["nk sounds", "/nk/", "nk", "Monday"]], highFrequencyWords: ["does", "goes"], phonemicAwareness: ["Delete last syllable in three-syllable compound words", "Substitute rime in three-sound words"], friday: "Cycle Check" },
  { cycleNumber: 23, phase: "patterns", focusLetters: [["ng sounds", "/ng/", "ng", "Monday"], ["/ang/", "/ang/", "ang", "Tuesday"], ["/ing/", "/ing/", "ing", "Tuesday"], ["/ong/", "/ong/", "ong", "Wednesday"], ["/ung/", "/ung/", "ung", "Wednesday"]], highFrequencyWords: ["only", "other"], phonemicAwareness: ["Delete last syllable in two-syllable words", "Substitute initial sound in CVC words"], friday: "Cycle Practice" },
  { cycleNumber: 24, phase: "patterns", focusLetters: [["FSZL / fizzle letters", "/f/ /s/ /z/ /l/", "ff ss zz ll", "Monday"]], highFrequencyWords: ["off", "which"], phonemicAwareness: ["Review deletion skills with multisyllabic words", "Review substitution skills in CVC words with onset and rime"], friday: "Cycle Check" },
  { cycleNumber: 25, phase: "microphase-wrap-up", focusLetters: [], highFrequencyWords: ["again", "day", "say"], phonemicAwareness: ["Review deletion skills with multisyllabic words", "Substitute rime in CVC words"], friday: "Microphase Assessment and Wrap-up" },
  { cycleNumber: 26, phase: "pattern-power", focusLetters: [["Pattern Power", "read patterns", "pattern", "Monday"]], highFrequencyWords: ["by", "my", "why", "try"], phonemicAwareness: ["Delete the first part of compound words"], routines: ["Pattern Power", "Fluency and Chaining", "What Says and Spelling to Complement Reading", "Interactive Writing"], friday: "Cycle 26 Check" },
  { cycleNumber: 27, phase: "pattern-power", focusLetters: [["Poem Launch", "oral fluency", "pattern", "Monday"]], highFrequencyWords: ["first", "friend", "half"], phonemicAwareness: ["Delete the first part of compound words"], routines: ["Poem Launch and Pattern Power", "Fluency and Chaining", "Spelling to Complement Reading", "Interactive Editing"], friday: "Cycle Practice" },
  { id: "eoy-assessment", title: "EOY Assessment", type: "assessment", phase: "benchmark", focusLetters: [], highFrequencyWords: [], phonemicAwareness: ["Letter Identification", "Benchmark Assessment EOY"], routines: ["NWEA MAP EOY", "Kindergarten Writing Benchmarks", "Goal: students reach Cycle 25 or above"], friday: "End-of-year benchmark" },
  { id: "celebrate-learning", title: "Celebrate Learning", type: "celebration", phase: "celebration", focusLetters: [], highFrequencyWords: [], phonemicAwareness: ["Review favorite sounds, words, poems, and reading routines"], routines: ["Share reading growth", "Celebrate learning routines"], friday: "Celebration and review" }
];

const PRIORITY_CYCLE_CONTENT = {
  1: {
    title: "Cycle 1: Meet A and M",
    childFriendlyGoal: "I can hear /ă/ and /m/.",
    teacherGoal: "Students identify Aa /ă/ and Mm /m/ separately, then practise HFW am and I as whole words.",
    cardDetails: {
      a: {
        examples: ["apple", "ant", "alligator"],
        articulation: "Open your mouth wide for the short /ă/ sound.",
        teacherScript: "A can say /ă/. Say /ă/ like apple. Show the Aa card, then match it to apple and ant.",
        formation: ["Use the Aa stroke model image.", "Write Aa on the practice line after the model."]
      },
      m: {
        examples: ["moon", "mouse", "map"],
        articulation: "Put your lips together and hum for /m/.",
        teacherScript: "M says /m/. Say /m/ like moon. Show the Mm card, then match it to mouse and map.",
        formation: ["Use the Mm stroke model image.", "Write Mm on the practice line after the model."]
      }
    },
    poem: {
      title: "Ant and Mouse",
      rhythm: "Clap on A lines. March softly on M lines.",
      teacherTip: "Keep Aa and Mm separate. Teach am and I as high-frequency words after the sound cards.",
      lines: [
        "A, a, apple,",
        "A, a, ant.",
        "M, m, mouse,",
        "M, m, moon.",
        "I am me.",
        "I am here.",
        "A and M,",
        "we can hear."
      ],
      callAndResponse: [
        { teacher: "What sound does A make?", students: "/ă/ /ă/ /ă/!" },
        { teacher: "What sound does M make?", students: "/m/ /m/ /m/!" },
        { teacher: "Read this word: am.", students: "am!" },
        { teacher: "Read this word: I.", students: "I!" }
      ]
    },
    hfwSentences: { am: "I am here.", I: "I am me." },
    games: [
      {
        id: "sound-safari",
        title: "Sound Safari",
        prompt: "First find /ă/. Then find /m/.",
        teacherInstruction: "Show four cards. Say one target sound. Children choose before you reveal.",
        studentAction: "Choose the card, say the word, then repeat the first sound.",
        baskets: ["/ă/", "/m/"],
        cards: ["apple", "ant", "mouse", "map"],
        targetItems: ["apple", "ant", "mouse", "map"],
        answer: "/ă/: apple, ant. /m/: mouse, map.",
        supportPrompt: "Give only two cards first: apple and mouse.",
        challengePrompt: "Ask children to name one more /ă/ or /m/ word from the room."
      },
      {
        id: "letter-sort",
        title: "Letter Sort",
        prompt: "Say the picture. Sort it under A/a or M/m.",
        teacherInstruction: "Place two basket labels on the board: A/a and M/m.",
        studentAction: "Say the picture word and place it under the matching first sound.",
        baskets: ["A/a", "M/m"],
        cards: ["apple", "ant", "alligator", "moon", "mouse", "map"],
        targetItems: ["apple", "ant", "alligator", "moon", "mouse", "map"],
        answer: "A/a: apple, ant, alligator. M/m: moon, mouse, map.",
        supportPrompt: "Stretch only the first sound: /ăăă/ apple, /mmm/ moon.",
        challengePrompt: "Students explain how they knew where to sort each card."
      },
      {
        id: "hfw-flash",
        title: "HFW Flash",
        prompt: "Read am. Read I. These are quick words.",
        teacherInstruction: "Flash one word. Children read, spell, skywrite, then read again.",
        studentAction: "Read the word, spell it with finger taps, and use it in the frame.",
        cards: ["am", "I", "I am"],
        targetItems: ["am", "I"],
        answer: "am and I are high-frequency words. They are not the main phonics focus.",
        supportPrompt: "Use the frame I am __ with a name card.",
        challengePrompt: "Children write I am on a whiteboard and read it to a partner."
      },
      {
        id: "beat-builder",
        title: "Beat Builder",
        prompt: "Say the big word. Take away the first part.",
        teacherInstruction: "Tap both word parts on two hands. Hide the first hand and ask what is left.",
        studentAction: "Say the whole word, tap two parts, then say the part left.",
        cards: ["sunshine -> shine", "rainbow -> bow", "cupcake -> cake"],
        targetItems: ["sunshine", "rainbow", "cupcake"],
        answer: "sunshine without sun is shine. rainbow without rain is bow. cupcake without cup is cake.",
        supportPrompt: "Use pictures or hand motions for the two word parts.",
        challengePrompt: "Try playground without play: ground."
      },
      {
        id: "writing-mission",
        title: "Writing Mission",
        prompt: "Watch the stroke model for A/a and M/m. Then write am and I.",
        teacherInstruction: "Show the stroke model before pencil work.",
        studentAction: "Say the sound while writing each letter. Read each HFW after writing.",
        cards: ["A", "a", "M", "m", "am", "I"],
        targetItems: ["Aa", "Mm", "am", "I"],
        answer: "Letter writing supports Aa /ă/ and Mm /m/. Word writing supports HFW am and I.",
        supportPrompt: "Use finger tracing on the table before pencil tracing.",
        challengePrompt: "Draw one A picture and one M picture and label the first letter."
      }
    ],
    phonemicAwarenessItems: [
      { prompt: "Say sunshine. Say it without sun. What is left?", answer: "shine" },
      { prompt: "Say rainbow. Say it without rain. What is left?", answer: "bow" },
      { prompt: "Say cupcake. Say it without cup. What is left?", answer: "cake" }
    ],
    rhymingItems: [["cat", "hat"], ["sun", "sit"], ["map", "tap"], ["moon", "spoon"]],
    decoding: {
      note: "No independent decoding is required in Cycle 1. Children identify Aa /ă/ and Mm /m/ and read am and I as high-frequency words.",
      chains: [
        { start: "Aa /ă/", steps: ["hear /ă/", "say apple", "say ant", "match A/a"] },
        { start: "Mm /m/", steps: ["hear /m/", "say moon", "say mouse", "match M/m"] },
        { start: "HFW", steps: ["look: am", "spell: a m", "read: am", "write: am"] }
      ]
    },
    writing: {
      formationPractice: ["Use the Aa stroke model, then write A and a.", "Use the Mm stroke model, then write M and m."],
      wordWriting: ["Read am. Write am. Read am.", "Read I. Write I. Read I."],
      sentenceFrame: "I am __.",
      dictation: ["A", "a", "M", "m", "am", "I"],
      interactiveWritingPrompt: "Write: I am. Add a child name orally."
    },
    worksheetTasks: [
      "Use the Aa stroke model. Write A/a. Say /ă/.",
      "Use the Mm stroke model. Write M/m. Say /m/.",
      "Circle pictures that start with /ă/: apple, ant, alligator.",
      "Circle pictures that start with /m/: moon, mouse, map.",
      "Read and write am.",
      "Read and write I.",
      "Draw something that starts with A.",
      "Draw something that starts with M."
    ],
    clayMat: {
      title: "Cycle 1 Clay Mat: Aa and Mm",
      directions: "Roll clay snakes. Build the big letter. Follow the model with your finger. Say the sound.",
      sections: [
        { label: "Aa /ă/", outline: "A a", picturePrompts: ["apple", "ant", "alligator"], handwriting: ["A", "a"] },
        { label: "Mm /m/", outline: "M m", picturePrompts: ["moon", "mouse", "map"], handwriting: ["M", "m"] }
      ]
    },
    vocabularyMat: {
      title: "Cycle 1 Vocabulary Mat",
      groups: [
        { label: "Aa /ă/ Words", words: ["apple", "ant", "alligator"] },
        { label: "Mm /m/ Words", words: ["moon", "mouse", "map"] },
        { label: "High-Frequency Words", words: ["am", "I"] }
      ]
    }
  },
  8: {
    title: "Cycle 8: B and W",
    childFriendlyGoal: "I can hear /b/ and /w/.",
    teacherGoal: "Students identify Bb /b/ and Ww /w/, practise HFW not and that, and listen for changes in teacher-led word chains.",
    cardDetails: {
      b: {
        examples: ["bear", "ball", "bat", "book"],
        articulation: "Put your lips together, then bounce them open for /b/.",
        teacherScript: "B says /b/. Bounce your lips open: /b/. Say bear, ball, bat, book."
      },
      w: {
        examples: ["wolf", "watch", "watermelon", "wave"],
        articulation: "Round your lips like a tiny circle for /w/.",
        teacherScript: "W says /w/. Make your lips round: /w/. Say wolf, watch, watermelon, wave."
      }
    },
    poem: {
      title: "Bear and Wave",
      rhythm: "Clap twice on B lines. Swoop hands on W lines.",
      teacherTip: "Keep the B/W sound sort oral and visual. The word chain is teacher-led because it uses review letters.",
      lines: [
        "B, b, bear,",
        "B, b, ball.",
        "W, w, wolf,",
        "Watch it walk.",
        "Bear has a book.",
        "Wolf has a watch.",
        "I can read not.",
        "I can read that."
      ],
      callAndResponse: [
        { teacher: "What sound does B make?", students: "/b/ /b/ /b/!" },
        { teacher: "What sound does W make?", students: "/w/ /w/ /w/!" },
        { teacher: "Read this word: not.", students: "not!" },
        { teacher: "Read this word: that.", students: "that!" }
      ]
    },
    hfwSentences: { not: "That is not a ball.", that: "That is a book." },
    games: [
      {
        id: "sound-safari",
        title: "Sound Safari",
        prompt: "Listen for /b/ and /w/ at the start of each word.",
        teacherInstruction: "Say a target sound. Students choose picture cards and justify with the first sound.",
        studentAction: "Point, say the word, and repeat the beginning sound.",
        baskets: ["/b/", "/w/"],
        cards: ["bear", "ball", "bat", "book", "wolf", "watch", "watermelon", "wave"],
        targetItems: ["bear", "ball", "bat", "book", "wolf", "watch", "watermelon", "wave"],
        answer: "/b/: bear, ball, bat, book. /w/: wolf, watch, watermelon, wave.",
        supportPrompt: "Start with bear and wave only.",
        challengePrompt: "Add web, wig, bag, and bell."
      },
      {
        id: "letter-sort",
        title: "Letter Sort",
        prompt: "Sort picture cards under Bb or Ww.",
        teacherInstruction: "Place Bb and Ww mats. Read each word aloud before children sort.",
        studentAction: "Say the word and place it on the matching mat.",
        baskets: ["Bb", "Ww"],
        cards: ["bear", "ball", "bat", "book", "wolf", "watch", "watermelon", "wave"],
        targetItems: ["bear", "ball", "bat", "book", "wolf", "watch", "watermelon", "wave"],
        answer: "Bb: bear, ball, bat, book. Ww: wolf, watch, watermelon, wave.",
        supportPrompt: "Use mouth cues: lips bounce for /b/, lips round for /w/.",
        challengePrompt: "Children add a new B or W oral word."
      },
      {
        id: "hfw-flash",
        title: "HFW Flash",
        prompt: "Read not and that quickly and accurately.",
        teacherInstruction: "Flash the word, spell it, trace it in the air, and use it in a sentence.",
        studentAction: "Read, spell, skywrite, and read the sentence frame.",
        cards: ["not", "that", "not that"],
        targetItems: ["not", "that"],
        answer: "Students read not and that as high-frequency words.",
        supportPrompt: "Point under each letter while spelling.",
        challengePrompt: "Use both words in one oral sentence."
      },
      {
        id: "beat-builder",
        title: "Beat Builder",
        prompt: "Say the word. Take away the first sound.",
        teacherInstruction: "This is oral onset deletion. Stretch the word, remove the first sound, and say the sound chunk left.",
        studentAction: "Repeat the word, move the first sound away, and say what is left.",
        cards: ["bat -> at", "wig -> ig", "wag -> ag"],
        targetItems: ["bat", "wig", "wag"],
        answer: "bat without /b/ is at. wig without /w/ is ig. wag without /w/ is ag.",
        supportPrompt: "Use sound boxes and counters.",
        challengePrompt: "Try web without /w/: eb."
      },
      {
        id: "word-chain",
        title: "Teacher-Led Word Chain",
        prompt: "Listen for what changed: bat -> bit -> wit -> wig.",
        teacherInstruction: "Build one word at a time with letter cards. Ask: What changed?",
        studentAction: "Read with the teacher and name the changed sound or letter.",
        cards: ["bat", "bit", "wit", "wig"],
        targetItems: ["bat", "bit", "wit", "wig"],
        answer: "a changed to i, b changed to w, and t changed to g.",
        supportPrompt: "Only compare two words at a time.",
        challengePrompt: "Students build the next teacher-given word with cards."
      },
      {
        id: "writing-mission",
        title: "Writing Mission",
        prompt: "Build and write B/b, W/w, not, and that.",
        teacherInstruction: "Model clay formation first, then pencil formation.",
        studentAction: "Trace, write, read, and check the first sound.",
        cards: ["B", "b", "W", "w", "not", "that"],
        targetItems: ["Bb", "Ww", "not", "that"],
        answer: "Students practise formation and HFW writing separately.",
        supportPrompt: "Use dotted outlines for B/b and W/w.",
        challengePrompt: "Write: That is not __."
      }
    ],
    phonemicAwarenessItems: [
      { prompt: "Say bat. Take away /b/. What is left?", answer: "at" },
      { prompt: "Say wig. Take away /w/. What is left?", answer: "ig" },
      { prompt: "Say wag. Take away /w/. What is left?", answer: "ag" }
    ],
    rhymingItems: [["bat", "hat"], ["ball", "fall"], ["wig", "big"], ["book", "look"]],
    decoding: {
      note: "Use this chain as teacher-led review. Children listen for what changed and read with support.",
      chains: [
        { start: "bat", steps: ["bat", "bit", "wit", "wig"] },
        { start: "book", steps: ["read book", "find /b/", "read wolf", "find /w/"] },
        { start: "not", steps: ["read not", "spell n o t", "read that", "use both words"] }
      ]
    },
    writing: {
      formationPractice: ["Use the Bb stroke model, then write B and b.", "Use the Ww stroke model, then write W and w."],
      wordWriting: ["Read and write not.", "Read and write that."],
      sentenceFrame: "That is not __.",
      dictation: ["B", "b", "W", "w", "not", "that"],
      interactiveWritingPrompt: "Write a class sentence: That is not a ball."
    },
    worksheetTasks: [
      "Use the Bb stroke model. Write B/b and circle the best B/b.",
      "Use the Ww stroke model. Write W/w and circle the best W/w.",
      "Sort bear, ball, bat, book, wolf, watch, watermelon, wave.",
      "Read and write not.",
      "Read and write that.",
      "Teacher-led chain: bat -> bit -> wit -> wig. Circle what changed.",
      "Draw one B word and one W word.",
      "Complete the frame: That is not __."
    ],
    clayMat: {
      title: "Cycle 8 Clay Mat: Bb and Ww",
      directions: "Build each outline with clay. Add picture-word cards below. Write the letters on the lines.",
      sections: [
        { label: "Bb /b/", outline: "B b", picturePrompts: ["ball", "bat", "book"], handwriting: ["B", "b"] },
        { label: "Ww /w/", outline: "W w", picturePrompts: ["wolf", "watch", "watermelon"], handwriting: ["W", "w"] }
      ]
    },
    vocabularyMat: {
      title: "Cycle 8 Vocabulary Mat",
      groups: [
        { label: "Bb /b/ Words", words: ["bear", "ball", "bat", "book", "bag", "bell"] },
        { label: "Ww /w/ Words", words: ["wolf", "watch", "watermelon", "wave", "web", "wig"] },
        { label: "High-Frequency Words", words: ["not", "that"] },
        { label: "Teacher-Led Chain", words: ["bat", "bit", "wit", "wig"] }
      ]
    }
  },
  15: {
    title: "Cycle 15: sh, ch, th",
    childFriendlyGoal: "I can read and sort sh, ch, and th.",
    teacherGoal: "Students distinguish sh, ch, and th, practise HFW good and look, and sort pattern words orally and visually.",
    cardDetails: {
      sh: {
        examples: ["ship", "sheep", "shop", "shark"],
        articulation: "Put one finger by your lips and say the quiet /sh/ sound.",
        teacherScript: "sh is two letters that work together. Say /sh/. Read ship, sheep, shop, shark."
      },
      ch: {
        examples: ["chip", "chair", "cheese", "chin"],
        articulation: "Make a quick /ch/ sound like the start of chip.",
        teacherScript: "ch is two letters that work together. Say /ch/. Read chip, chair, cheese, chin."
      },
      th: {
        examples: ["thumb", "three", "teeth", "thin"],
        articulation: "Put your tongue gently between your teeth for /th/.",
        teacherScript: "th is two letters that work together. Say /th/. Read thumb, three, teeth, thin."
      }
    },
    poem: {
      title: "Three Sound Friends",
      rhythm: "Whisper sh, crunch ch with one clap, and give thumbs up for th.",
      teacherTip: "Keep pattern sorting visual. Treat good and look as HFW practice after the pattern cards.",
      lines: [
        "Sh, sh, sheep,",
        "quiet in the shop.",
        "Ch, ch, chip,",
        "crunch, crunch, stop.",
        "Th, th, three,",
        "thumbs up, look!",
        "Good sounds today,",
        "in our reading book."
      ],
      callAndResponse: [
        { teacher: "When you see sh, what do you say?", students: "/sh/!" },
        { teacher: "When you see ch, what do you say?", students: "/ch/!" },
        { teacher: "When you see th, what do you say?", students: "/th/!" },
        { teacher: "Read our words: good, look.", students: "good, look!" }
      ]
    },
    hfwSentences: { good: "This is a good book.", look: "Look at the ship." },
    games: [
      {
        id: "sound-safari",
        title: "Digraph Safari",
        prompt: "Find words with sh, ch, and th.",
        teacherInstruction: "Say a word and ask which digraph children hear at the beginning.",
        studentAction: "Point to sh, ch, or th, then say the word.",
        baskets: ["sh", "ch", "th"],
        cards: ["ship", "sheep", "shop", "chip", "chair", "cheese", "thumb", "three", "teeth"],
        targetItems: ["ship", "sheep", "shop", "chip", "chair", "cheese", "thumb", "three", "teeth"],
        answer: "sh: ship, sheep, shop. ch: chip, chair, cheese. th: thumb, three, teeth.",
        supportPrompt: "Use mouth cues before sorting.",
        challengePrompt: "Add shark, chin, and thin."
      },
      {
        id: "pattern-sort",
        title: "Pattern Sort",
        prompt: "Sort each word by its first digraph.",
        teacherInstruction: "Place sh, ch, and th headers. Children sort one card at a time.",
        studentAction: "Read with the teacher, tap the first pattern, and sort.",
        baskets: ["sh", "ch", "th"],
        cards: ["ship", "sheep", "shop", "chip", "chair", "cheese", "thumb", "three", "teeth"],
        targetItems: ["ship", "sheep", "shop", "chip", "chair", "cheese", "thumb", "three", "teeth"],
        answer: "sh: ship, sheep, shop. ch: chip, chair, cheese. th: thumb, three, teeth.",
        supportPrompt: "Highlight the first two letters before reading.",
        challengePrompt: "Students explain why th is different from t."
      },
      {
        id: "hfw-flash",
        title: "HFW Flash",
        prompt: "Read good and look as whole words.",
        teacherInstruction: "Flash, spell, skywrite, and place the word in a sentence.",
        studentAction: "Read, spell, write in the air, and read the sentence.",
        cards: ["good", "look", "Look good"],
        targetItems: ["good", "look"],
        answer: "good and look are practised as high-frequency words.",
        supportPrompt: "Underline the double o in both words as a visual memory cue.",
        challengePrompt: "Use good and look in one oral sentence."
      },
      {
        id: "beat-builder",
        title: "Beat Builder",
        prompt: "Say a two-syllable word. Take away the first part.",
        teacherInstruction: "Tap two syllables and remove the first syllable orally.",
        studentAction: "Tap, remove, and say what remains.",
        cards: ["cupcake -> cake", "pancake -> cake", "rainbow -> bow"],
        targetItems: ["cupcake", "pancake", "rainbow"],
        answer: "cupcake without cup is cake. pancake without pan is cake. rainbow without rain is bow.",
        supportPrompt: "Use two counters for two spoken parts.",
        challengePrompt: "Try toothbrush without tooth: brush."
      },
      {
        id: "word-chain",
        title: "Digraph Build",
        prompt: "Build the first sound and finish the word.",
        teacherInstruction: "Place the digraph tile first, then add the rime.",
        studentAction: "Read the digraph, read the rime, then blend the whole word.",
        cards: ["sh + ip = ship", "ch + ip = chip", "th + in = thin"],
        targetItems: ["ship", "chip", "thin"],
        answer: "sh + ip is ship. ch + ip is chip. th + in is thin.",
        supportPrompt: "Keep the digraph tile one color and the rime tile another color.",
        challengePrompt: "Build shop, chop, and then."
      }
    ],
    phonemicAwarenessItems: [
      { prompt: "Say shop. Change /sh/ to /ch/. What word?", answer: "chop" },
      { prompt: "Say chip. Change /ch/ to /sh/. What word?", answer: "ship" },
      { prompt: "Say sunset. Take away sun. What is left?", answer: "set" }
    ],
    rhymingItems: [["ship", "chip"], ["shop", "chop"], ["thin", "chin"], ["three", "tree"]],
    decoding: {
      note: "Use digraph tiles. Students read the digraph first, then blend the rest of the word.",
      chains: [
        { start: "sh", steps: ["sh + ip = ship", "sh + op = shop", "sh + ell = shell"] },
        { start: "ch", steps: ["ch + ip = chip", "ch + in = chin", "ch + op = chop"] },
        { start: "th", steps: ["th + in = thin", "th + um = thumb", "th + ree = three"] }
      ]
    },
    writing: {
      formationPractice: ["Use the sh model, then write sh.", "Use the ch model, then write ch.", "Use the th model, then write th."],
      wordWriting: ["Read and write good.", "Read and write look."],
      sentenceFrame: "Look at the __.",
      dictation: ["sh", "ch", "th", "ship", "chip", "thin", "good", "look"],
      interactiveWritingPrompt: "Write: Look at the ship."
    },
    worksheetTasks: [
      "Use the stroke models for sh, ch, and th.",
      "Sort ship, sheep, shop, chip, chair, cheese, thumb, three, teeth.",
      "Circle the digraph at the start of each word.",
      "Build and write ship, chip, and thin.",
      "Read and write good.",
      "Read and write look.",
      "Draw one sh word, one ch word, and one th word.",
      "Complete the frame: Look at the __."
    ],
    clayMat: {
      title: "Cycle 15 Clay Mat: sh, ch, th",
      directions: "Build each two-letter pattern with clay. Trace it. Read the picture words.",
      sections: [
        { label: "sh /sh/", outline: "sh", picturePrompts: ["ship", "sheep", "shop"], handwriting: ["sh"] },
        { label: "ch /ch/", outline: "ch", picturePrompts: ["chip", "chair", "cheese"], handwriting: ["ch"] },
        { label: "th /th/", outline: "th", picturePrompts: ["thumb", "three", "teeth"], handwriting: ["th"] }
      ]
    },
    vocabularyMat: {
      title: "Cycle 15 Vocabulary Mat",
      groups: [
        { label: "sh Words", words: ["ship", "sheep", "shop", "shark"] },
        { label: "ch Words", words: ["chip", "chair", "cheese", "chin"] },
        { label: "th Words", words: ["thumb", "three", "teeth", "thin"] },
        { label: "High-Frequency Words", words: ["good", "look"] }
      ]
    }
  },
  23: {
    title: "Cycle 23: ng and Rime Families",
    childFriendlyGoal: "I can build words with ng families.",
    teacherGoal: "Students read ng and build ang, ing, ong, and ung rime-family words while practising HFW only and other.",
    cardDetails: {
      ng: {
        examples: ["ring", "sing", "king", "song"],
        articulation: "Keep the sound in the back of your mouth: /ng/.",
        teacherScript: "ng is two letters at the end of many words. Say /ng/. Read ring, sing, king, song."
      },
      ang: {
        examples: ["bang", "sang", "rang"],
        articulation: "Say /ang/ as one rime chunk.",
        teacherScript: "Read the rime ang. Add a first sound to build bang, sang, rang."
      },
      ing: {
        examples: ["ring", "sing", "king"],
        articulation: "Say /ing/ as one rime chunk.",
        teacherScript: "Read the rime ing. Add a first sound to build ring, sing, king."
      },
      ong: {
        examples: ["song", "long", "gong"],
        articulation: "Say /ong/ as one rime chunk.",
        teacherScript: "Read the rime ong. Add a first sound to build song, long, gong."
      },
      ung: {
        examples: ["sung", "hung", "rung"],
        articulation: "Say /ung/ as one rime chunk.",
        teacherScript: "Read the rime ung. Add a first sound to build sung, hung, rung."
      }
    },
    poem: {
      title: "The King Can Sing",
      rhythm: "Tap the rime chunk each time you hear -ing or -ong.",
      teacherTip: "Teach rime families as chunks. Children build words with teacher support and read only and other as HFW.",
      lines: [
        "Ring, ring, ring,",
        "the king can sing.",
        "Sing, sing, sing,",
        "hear the bells ring.",
        "Bang, bang, bang,",
        "long, long song.",
        "Only one king,",
        "sings all day long."
      ],
      callAndResponse: [
        { teacher: "What two letters end ring?", students: "ng!" },
        { teacher: "Build r + ing.", students: "ring!" },
        { teacher: "Build s + ong.", students: "song!" },
        { teacher: "Read our words: only, other.", students: "only, other!" }
      ]
    },
    hfwSentences: { only: "Only one king can sing.", other: "The other bell can ring." },
    games: [
      {
        id: "sound-safari",
        title: "NG Hunt",
        prompt: "Find words that end with ng.",
        teacherInstruction: "Say each word. Children listen for /ng/ at the end.",
        studentAction: "Give a thumbs up when the word ends with ng, then say the rime family.",
        baskets: ["ng", "not ng"],
        cards: ["ring", "sing", "song", "long", "cat", "map"],
        targetItems: ["ring", "sing", "song", "long"],
        answer: "ring, sing, song, and long end with ng.",
        supportPrompt: "Stretch the ending: riiing, soooong.",
        challengePrompt: "Students name the rime family: ing or ong."
      },
      {
        id: "ng-family-sort",
        title: "NG Word Family Sort",
        prompt: "Sort words by ang, ing, ong, and ung.",
        teacherInstruction: "Place four rime headers. Read each card and sort by the ending chunk.",
        studentAction: "Read the word with the teacher and place it under the matching rime.",
        baskets: ["ang", "ing", "ong", "ung"],
        cards: ["bang", "sang", "rang", "ring", "sing", "king", "song", "long", "gong", "sung", "hung", "rung"],
        targetItems: ["bang", "sang", "rang", "ring", "sing", "king", "song", "long", "gong", "sung", "hung", "rung"],
        answer: "ang: bang, sang, rang. ing: ring, sing, king. ong: song, long, gong. ung: sung, hung, rung.",
        supportPrompt: "Cover the first letter and read only the rime chunk first.",
        challengePrompt: "Build a new word by changing only the first sound."
      },
      {
        id: "hfw-flash",
        title: "HFW Flash",
        prompt: "Read only and other as whole words.",
        teacherInstruction: "Flash, spell, skywrite, and use each word in a short sentence.",
        studentAction: "Read, spell, write in the air, and read the sentence.",
        cards: ["only", "other", "only other"],
        targetItems: ["only", "other"],
        answer: "only and other are high-frequency words.",
        supportPrompt: "Box the whole word and read it smoothly.",
        challengePrompt: "Use only and other in one oral sentence."
      },
      {
        id: "beat-builder",
        title: "Rime Beat Builder",
        prompt: "Tap the first sound, then tap the rime chunk.",
        teacherInstruction: "Use two boxes: onset and rime. Slide them together to read the word.",
        studentAction: "Tap onset, tap rime, blend the word.",
        cards: ["r + ing = ring", "s + ing = sing", "k + ing = king", "s + ong = song"],
        targetItems: ["ring", "sing", "king", "song"],
        answer: "r + ing = ring. s + ing = sing. k + ing = king. s + ong = song.",
        supportPrompt: "Keep the rime card fixed and change only the first letter.",
        challengePrompt: "Build bang, long, and hung."
      },
      {
        id: "word-chain",
        title: "Rime-Family Word Building",
        prompt: "Change the first sound. Keep the rime.",
        teacherInstruction: "Start with ing. Swap onset cards to build a rhyming chain.",
        studentAction: "Read each new word and say what changed.",
        cards: ["ring", "sing", "king", "bang", "sang", "rang", "song", "long", "gong"],
        targetItems: ["ring", "sing", "king", "bang", "sang", "rang", "song", "long", "gong"],
        answer: "The first sound changes. The rime stays the same inside each family.",
        supportPrompt: "Use only ring, sing, king first.",
        challengePrompt: "Students sort a mixed set without help."
      }
    ],
    phonemicAwarenessItems: [
      { prompt: "Say ring. Change /r/ to /s/. What word?", answer: "sing" },
      { prompt: "Say bang. Change /b/ to /r/. What word?", answer: "rang" },
      { prompt: "Say sung. Change /s/ to /h/. What word?", answer: "hung" }
    ],
    rhymingItems: [["ring", "sing"], ["king", "ring"], ["song", "long"], ["sung", "hung"]],
    decoding: {
      note: "Build each word by reading the rime chunk first, then adding the onset.",
      chains: [
        { start: "ing", steps: ["r + ing = ring", "s + ing = sing", "k + ing = king"] },
        { start: "ang", steps: ["b + ang = bang", "s + ang = sang", "r + ang = rang"] },
        { start: "ong", steps: ["s + ong = song", "l + ong = long", "g + ong = gong"] },
        { start: "ung", steps: ["s + ung = sung", "h + ung = hung", "r + ung = rung"] }
      ]
    },
    writing: {
      formationPractice: ["Use the ng model, then write ng.", "Use the ang, ing, ong, ung models, then read each rime."],
      wordWriting: ["Read and write only.", "Read and write other."],
      sentenceFrame: "Only one __ can __.",
      dictation: ["ng", "ing", "ring", "sing", "song", "only", "other"],
      interactiveWritingPrompt: "Write: Only one king can sing."
    },
    worksheetTasks: [
      "Use the stroke models for ng, ang, ing, ong, and ung.",
      "Build r + ing, s + ing, and k + ing.",
      "Sort bang, sang, rang, ring, sing, king, song, long, gong, sung, hung, rung.",
      "Circle the rime chunk in each word.",
      "Read and write only.",
      "Read and write other.",
      "Complete a rime chain: ring, sing, king.",
      "Write one word from each family: ang, ing, ong, ung."
    ],
    clayMat: {
      title: "Cycle 23 Clay Mat: ng Families",
      directions: "Build ng, then build each rime chunk. Add an onset card and read the word.",
      sections: [
        { label: "ng", outline: "ng", picturePrompts: ["ring", "sing"], handwriting: ["ng"] },
        { label: "ang", outline: "ang", picturePrompts: ["bang", "sang", "rang"], handwriting: ["ang"] },
        { label: "ing", outline: "ing", picturePrompts: ["ring", "sing", "king"], handwriting: ["ing"] },
        { label: "ong / ung", outline: "ong  ung", picturePrompts: ["song", "long", "sung", "hung"], handwriting: ["ong", "ung"] }
      ]
    },
    vocabularyMat: {
      title: "Cycle 23 Vocabulary Mat",
      groups: [
        { label: "ang Family", words: ["bang", "sang", "rang"] },
        { label: "ing Family", words: ["ring", "sing", "king"] },
        { label: "ong Family", words: ["song", "long", "gong"] },
        { label: "ung Family", words: ["sung", "hung", "rung"] },
        { label: "High-Frequency Words", words: ["only", "other"] }
      ]
    }
  }
};

function normalizeLetter(raw) {
  if (Array.isArray(raw)) {
    return {
      grapheme: raw[0],
      sound: raw[1],
      spelling: raw[2],
      day: raw[3] || ""
    };
  }
  return {
    grapheme: raw,
    sound: "",
    spelling: String(raw).toLowerCase(),
    day: ""
  };
}

function letterKey(card = {}) {
  return String(card.spelling || card.grapheme || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "") || "pattern";
}

function makeLetterCard(card) {
  const key = letterKey(card);
  const examples = LETTER_EXAMPLES[key] || LETTER_EXAMPLES[card.spelling] || ["map", "tap", "sit", "run"];
  const formation = FORMATION[key] || FORMATION.default;
  return {
    ...card,
    examples,
    articulation: card.sound
      ? `Say ${card.sound}. Keep it short and clean.`
      : "Say the pattern smoothly and connect it to familiar words.",
    childExplanation: `${card.grapheme} says ${card.sound || card.grapheme}. We can hear it, say it, and find it in words.`,
    teacherScript: `Show ${card.grapheme}. Say: My turn, ${card.sound || card.grapheme}. Your turn. Match ${card.spelling} to a word that starts with it.`,
    formation: [formation.upper, formation.lower]
  };
}

function makeDailyFlow(seed, focusLetters) {
  const letterDays = focusLetters.slice(0, 3).map((card, index) => ({
    day: card.day || DEFAULT_DAYS[index],
    focus: card.grapheme,
    lessonType: "letter-sound",
    description: `${card.sound || card.grapheme} spelled "${card.spelling || card.grapheme}"`
  }));
  return [
    ...letterDays,
    {
      day: "Wednesday",
      focus: "Fluency and Call and Response",
      lessonType: "fluency",
      hfw: seed.highFrequencyWords || []
    },
    {
      day: "Thursday",
      focus: "Feel the Beat and Chaining",
      lessonType: "phonemic-awareness"
    },
    {
      day: "Friday",
      focus: seed.friday || "Cycle Practice",
      lessonType: String(seed.friday || "").toLowerCase().includes("check") ? "cycle-check" : "practice"
    }
  ].filter((item, index, arr) =>
    arr.findIndex(other => other.day === item.day && other.focus === item.focus) === index
  );
}

function makePoem(seed, focusLetters) {
  if (seed.cycleNumber === 1) {
    return {
      title: "Ant and Mouse",
      rhythm: "Clap on each bold sound. March softly for the M lines.",
      teacherTip: "Keep Aa and Mm separate. The word am is a high-frequency word, not the main phonics focus.",
      lines: [
        "A, a, apple,",
        "A, a, ant.",
        "M, m, mouse,",
        "March, march, march!",
        "I am an ant.",
        "I am a mouse.",
        "A and M",
        "come to our house!"
      ],
      callAndResponse: [
        { teacher: "What sound does A make?", students: "/ă/ /ă/ /ă/!" },
        { teacher: "What sound does M make?", students: "/m/ /m/ /m/!" },
        { teacher: "Read this word: am.", students: "am!" },
        { teacher: "Read this word: I.", students: "I!" }
      ]
    };
  }
  const sounds = focusLetters.map(card => card.spelling).filter(Boolean).slice(0, 3);
  const hfw = seed.highFrequencyWords || [];
  const firstCard = focusLetters[0];
  const secondCard = focusLetters[1];
  const firstExamples = firstCard ? (LETTER_EXAMPLES[letterKey(firstCard)] || []).slice(0, 2) : [];
  const secondExamples = secondCard ? (LETTER_EXAMPLES[letterKey(secondCard)] || []).slice(0, 2) : [];
  return {
    title: `${seed.title} Sound Chant`,
    rhythm: "Clap, tap knees, then echo. Keep each line short and bouncy.",
    teacherTip: "Teach the focus spelling first. Treat high-frequency words as separate quick-read practice.",
    lines: [
      firstCard ? `${firstCard.grapheme} says ${firstCard.sound}.` : "Listen, clap, and say it.",
      firstExamples.length ? `${firstExamples.join(", ")} - hear it now!` : "Find the sound and say it now!",
      secondCard ? `${secondCard.grapheme} says ${secondCard.sound}.` : "Read it, tap it, try it now.",
      secondExamples.length ? `${secondExamples.join(", ")} - take a bow!` : "Trace it, write it, take a bow!",
      hfw.length ? `Quick words: ${hfw.slice(0, 3).join(", ")}.` : "Quick words, quick eyes.",
      "We can read. We can write!"
    ],
    callAndResponse: [
      { teacher: "What sound do we hear?", students: sounds.join(" and ") || "our review sounds" },
      { teacher: "What do readers do?", students: "Say it, tap it, read it, write it!" }
    ]
  };
}

function makePhonemicAwareness(seed) {
  const focus = seed.phonemicAwareness || [];
  const deletionItems = [
    { prompt: "Say sunshine. Take away sun. What is left?", answer: "shine" },
    { prompt: "Say cupcake. Take away cup. What is left?", answer: "cake" },
    { prompt: "Say rainbow. Take away rain. What is left?", answer: "bow" },
    { prompt: "Say baseball. Take away ball. What is left?", answer: "base" },
    { prompt: "Say basket. Take away bas. What is left?", answer: "ket" }
  ];
  const cvcItems = [
    { prompt: "Say mat. Take away /m/. What is left?", answer: "at" },
    { prompt: "Say sun. Change /s/ to /r/. What word?", answer: "run" },
    { prompt: "Say cap. Change /ap/ to /at/. What word?", answer: "cat" },
    { prompt: "Say pin. Take away /in/. What is left?", answer: "/p/" },
    { prompt: "Say bug. Change /ug/ to /un/. What word?", answer: "bun" }
  ];
  const items = focus.join(" ").toLowerCase().includes("cvc") || focus.join(" ").toLowerCase().includes("rime")
    ? cvcItems
    : deletionItems;
  return {
    focus,
    teacherWording: "Listen. Say the whole word. Take away one part. Say what is left.",
    practiceItems: items,
    supportPrompt: "Hold up two hands for two word parts. Put one hand down when that part goes away.",
    challengePrompt: "Let a child be the teacher and give the next word."
  };
}

function makeRhyming(seed) {
  const production = (seed.phonemicAwareness || []).join(" ").toLowerCase().includes("production");
  return {
    focus: production ? "Rhyme production" : "Rhyme recognition and identification",
    activities: [
      {
        name: production ? "Make a Rhyme" : "Thumbs Up Rhyme",
        teacherWording: production
          ? "I say a word. You say a word that rhymes. It can be a real word or a silly word during oral play."
          : "I will say two words. Show thumbs up if they rhyme and thumbs sideways if they do not.",
        items: production
          ? [["cat", "bat"], ["sun", "fun"], ["go", "so"], ["ring", "sing"], ["day", "say"]]
          : [["cat", "bat"], ["sun", "sit"], ["go", "so"], ["map", "moon"], ["ring", "sing"]]
      }
    ]
  };
}

function makeHfwCards(words = []) {
  return words.map(word => ({
    word,
    readIt: `Read: ${word}`,
    spellIt: word.split("").join(" "),
    sentence: word.length <= 2 ? `I can read ${word}.` : `We can use ${word} in a sentence.`,
    practice: `Trace ${word}, cover it, write it, then read it in the sentence.`
  }));
}

function makeGames(seed, focusLetters) {
  const cards = focusLetters.map(makeLetterCard);
  const first = cards[0];
  const second = cards[1];
  const firstWords = first?.examples?.slice(0, 3) || ["apple", "ant", "alligator"];
  const secondWords = second?.examples?.slice(0, 3) || ["moon", "map", "mat"];
  const mixedWords = [...firstWords.slice(0, 2), ...secondWords.slice(0, 2)];
  return [
    {
      id: "sound-safari",
      title: "Sound Safari",
      prompt: first ? `Find words that start with ${first.sound}.` : "Find words with the focus sound.",
      cards: mixedWords,
      answer: firstWords.slice(0, 2).join(", ")
    },
    {
      id: "letter-sort",
      title: "Letter Sort",
      prompt: first && second ? `Sort the cards into ${first.grapheme} and ${second.grapheme}.` : "Sort the cards by focus spelling.",
      baskets: [first?.grapheme || "Focus 1", second?.grapheme || "Focus 2"],
      cards: mixedWords,
      answer: `${first?.grapheme || "Focus 1"}: ${firstWords.slice(0, 2).join(", ")} | ${second?.grapheme || "Focus 2"}: ${secondWords.slice(0, 2).join(", ")}`
    },
    {
      id: "rhyme-pop",
      title: "Rhyme Pop",
      prompt: "Pop the words that rhyme.",
      cards: ["cat / bat", "sun / sit", "go / so", "map / moon"],
      answer: "cat / bat and go / so"
    },
    {
      id: "beat-builder",
      title: "Beat Builder",
      prompt: seed.phonemicAwareness?.[0] || "Tap the word parts.",
      cards: ["sunshine -> shine", "cupcake -> cake", "rainbow -> bow"],
      answer: "Say the word. Tap each part. Hide the part that goes away."
    },
    {
      id: "word-chain",
      title: "Word Chain",
      prompt: "Say the sound. Change one part. Read the new word.",
      cards: [first?.spelling, second?.spelling, firstWords[0], secondWords[0]].filter(Boolean),
      answer: "Use only letters and patterns already introduced."
    },
    {
      id: "hfw-flash",
      title: "HFW Flash",
      prompt: "Read it, spell it, clap it, use it.",
      cards: seed.highFrequencyWords || [],
      answer: "Each word is read as a whole word."
    },
    {
      id: "writing-mission",
      title: "Writing Mission",
      prompt: "Trace it, write it, say it.",
      cards: focusLetters.map(card => card.grapheme).filter(Boolean),
      answer: "Write the focus spelling on handwriting lines."
    }
  ];
}

function makeVideoResources(seed, focusLetters) {
  const cycleLabel = seed.title || `Cycle ${seed.cycleNumber}`;
  const focusTerms = focusLetters.map(card => card.grapheme).filter(Boolean).slice(0, 3);
  const baseTerms = focusTerms.length ? focusTerms : [cycleLabel];
  return [
    ...baseTerms.map(term => ({
      label: `Teacher search for ${term}`,
      query: `${term} phonics kindergarten`
    })),
    {
      label: `Teacher search for ${cycleLabel}`,
      query: `${baseTerms.join(" ")} phonics chant kindergarten`
    }
  ];
}

function makeDecoding(seed, focusLetters) {
  const spellings = focusLetters.map(card => card.spelling).filter(Boolean);
  const usable = spellings.filter(item => /^[a-z]+$/.test(item) && item.length <= 2);
  const chains = usable.length
    ? usable.slice(0, 3).map((item, index) => ({
      start: item,
      steps: [`say ${item}`, "tap the sound", "find it in a word", "read the new word"]
    }))
    : [{ start: "review", steps: ["read the pattern", "find it in a word", "write the word", "read it again"] }];
  return {
    routines: seed.routines || ["Fluency", "Call and Response", "Feel the Beat", "Chaining"],
    chains,
    note: "Only use letters, sounds, and patterns introduced in this cycle or earlier."
  };
}

function makeWriting(seed, focusLetters) {
  return {
    formationPractice: focusLetters.map(card => `Trace and write ${card.grapheme}. Say ${card.sound || card.grapheme} each time.`),
    wordWriting: (seed.highFrequencyWords || []).map(word => `Write ${word} on the line and read it back.`),
    sentenceFrame: seed.highFrequencyWords?.length
      ? `I can read ${seed.highFrequencyWords[0]}.`
      : "I can read.",
    dictation: focusLetters[0]?.examples?.slice(0, 3) || ["am", "mat", "sat"],
    interactiveWritingPrompt: `Write a class sentence using ${seed.highFrequencyWords?.[0] || "a focus word"}.`
  };
}

function makeWorksheetTemplates(seed) {
  return [
    "letter tracing",
    "letter/sound matching",
    "circle the beginning sound",
    "circle the ending sound",
    "rhyme match",
    "cut-and-paste HFW",
    "read/write HFW",
    "CVC decoding",
    "chaining practice",
    "dictation",
    "sentence writing",
    "pattern practice",
    "review worksheet",
    String(seed.friday || "").toLowerCase().includes("check") ? "cycle check worksheet" : "cycle practice worksheet"
  ];
}

function makeTeacherNotes(seed) {
  return {
    supportIdeas: [
      "Use a smaller set of two choices before moving to four choices.",
      "Add oral rehearsal before writing.",
      "Pair a sound gesture with each new spelling."
    ],
    extensionIdeas: [
      "Ask students to generate a new word or sentence with the focus spelling.",
      "Have students sort review words by sound or spelling.",
      "Invite students to lead the chant for a partner."
    ],
    reteachSuggestions: [
      "Return to mouth position and sound isolation.",
      "Use counters or finger taps for each sound part.",
      "Keep not-yet-secure HFW in a short daily reread stack."
    ],
    progressConnection: "Later this can connect to saved assessment data to recommend review cycles and worksheets."
  };
}

function applyCardDetails(cards, details = {}) {
  return cards.map(card => {
    const key = letterKey(card);
    const detail = details[key];
    if (!detail) return card;
    return {
      ...card,
      examples: detail.examples || card.examples,
      articulation: detail.articulation || card.articulation,
      teacherScript: detail.teacherScript || card.teacherScript,
      childExplanation: detail.childExplanation || card.childExplanation,
      formation: detail.formation || card.formation
    };
  });
}

function makePriorityHfwCards(words = [], sentences = {}) {
  return words.map(word => ({
    word,
    readIt: `Read: ${word}`,
    spellIt: word.split("").join(" "),
    sentence: sentences[word] || `I can read ${word}.`,
    practice: `Look at ${word}. Spell it. Skywrite it. Trace it. Write it. Read it again.`
  }));
}

function makePriorityTeacherNotes(content) {
  return {
    supportIdeas: [
      "Use two choices before four or more choices.",
      "Model the mouth position, then have children answer chorally.",
      "Keep high-frequency word practice separate from the sound focus."
    ],
    extensionIdeas: [
      "Invite a child to lead one sort card and explain the sound match.",
      "Ask partners to add one new oral word for the focus sound or pattern.",
      "Have students reread the chant with the movement cue."
    ],
    reteachSuggestions: [
      "Return to the sound card and picture word bank.",
      "Use the clay mat before pencil writing when formation is hard.",
      "Use the vocabulary mat for oral rehearsal before independent worksheet tasks."
    ],
    progressConnection: content.teacherGoal
  };
}

function makePriorityWorksheetTemplates(content) {
  return [
    "cycle worksheet pack",
    "clay mat",
    "vocabulary mat",
    "letter tracing",
    "letter/sound matching",
    "read/write HFW",
    "chaining practice",
    "pattern practice",
    "sentence writing"
  ].filter((template, index, arr) => arr.indexOf(template) === index);
}

function applyPriorityCycleContent(cycle) {
  const content = PRIORITY_CYCLE_CONTENT[cycle.cycleNumber];
  if (!content) return cycle;

  const letterCards = applyCardDetails(cycle.sections.letterLearning.cards || [], content.cardDetails);
  const worksheetTasks = content.worksheetTasks || [];
  return {
    ...cycle,
    title: content.title || cycle.title,
    childFriendlyGoal: content.childFriendlyGoal,
    teacherGoal: content.teacherGoal,
    routines: cycle.cycleNumber === 1
      ? ["Sound Cards", "Poem / Chant", "Sound Safari", "Letter Sort", "HFW Flash", "Beat Builder", "Writing Mission"]
      : ["Sound Cards", "Poem / Chant", "Pattern Sort", "HFW Flash", "Beat Builder", "Chaining", "Writing Mission"],
    sections: {
      ...cycle.sections,
      overview: {
        ...cycle.sections.overview,
        goals: [
          content.childFriendlyGoal,
          content.teacherGoal,
          `High-frequency words are practised separately: ${cycle.highFrequencyWords.join(", ")}.`
        ]
      },
      letterLearning: {
        cards: letterCards
      },
      poemAndChant: content.poem,
      phonemicAwareness: {
        ...cycle.sections.phonemicAwareness,
        practiceItems: content.phonemicAwarenessItems || cycle.sections.phonemicAwareness.practiceItems
      },
      rhyming: {
        focus: cycle.sections.rhyming.focus,
        activities: [
          {
            name: "Rhyme Check",
            teacherWording: "Say the two words. Children show thumbs up if they rhyme and thumbs sideways if they do not.",
            items: content.rhymingItems || cycle.sections.rhyming.activities?.[0]?.items || []
          }
        ]
      },
      highFrequencyWords: {
        cards: makePriorityHfwCards(cycle.highFrequencyWords, content.hfwSentences)
      },
      decoding: content.decoding || cycle.sections.decoding,
      writing: content.writing || cycle.sections.writing,
      worksheets: {
        templates: makePriorityWorksheetTemplates(content),
        tasks: {
          "cycle worksheet pack": worksheetTasks,
          "letter tracing": worksheetTasks.filter(task => /trace|write/i.test(task)),
          "letter/sound matching": worksheetTasks.filter(task => /circle|sort|sound|starts|digraph|rime/i.test(task)),
          "read/write HFW": worksheetTasks.filter(task => cycle.highFrequencyWords.some(word => task.includes(word))),
          "chaining practice": worksheetTasks.filter(task => /chain|build|changed|rime/i.test(task)),
          "pattern practice": worksheetTasks.filter(task => /sort|pattern|digraph|rime|family|ng|sh|ch|th/i.test(task)),
          "sentence writing": worksheetTasks.filter(task => /frame|complete|sentence/i.test(task))
        }
      },
      games: content.games || cycle.sections.games,
      videoResources: cycle.sections.videoResources.map(resource => ({
        ...resource,
        query: resource.query.includes("kindergarten") ? resource.query : `${resource.query} kindergarten`
      })),
      clayMat: content.clayMat,
      vocabularyMat: content.vocabularyMat,
      teacherNotes: makePriorityTeacherNotes(content)
    },
    searchText: [
      cycle.searchText,
      content.title,
      content.childFriendlyGoal,
      content.teacherGoal,
      content.poem?.title,
      ...(content.worksheetTasks || []),
      ...(content.vocabularyMat?.groups || []).flatMap(group => group.words)
    ].filter(Boolean).join(" ").toLowerCase()
  };
}

function buildSections(seed, focusLetters) {
  const games = makeGames(seed, focusLetters);
  const videoResources = makeVideoResources(seed, focusLetters);
  return {
    overview: {
      goals: [
        `Teach ${focusLetters.map(card => card.grapheme).join(", ") || "review and benchmark routines"}.`,
        `Practice HFW: ${(seed.highFrequencyWords || []).join(", ") || "none for this benchmark/review area"}.`,
        `Focus phonemic awareness: ${(seed.phonemicAwareness || []).join("; ")}.`
      ]
    },
    letterLearning: {
      cards: focusLetters.map(makeLetterCard)
    },
    poemAndChant: makePoem(seed, focusLetters),
    phonemicAwareness: makePhonemicAwareness(seed),
    rhyming: makeRhyming(seed),
    highFrequencyWords: {
      cards: makeHfwCards(seed.highFrequencyWords || [])
    },
    decoding: makeDecoding(seed, focusLetters),
    writing: makeWriting(seed, focusLetters.map(makeLetterCard)),
    worksheets: {
      templates: makeWorksheetTemplates(seed)
    },
    games,
    videoResources,
    teacherNotes: makeTeacherNotes(seed)
  };
}

function buildCycle(seed) {
  const focusLetters = (seed.focusLetters || []).map(normalizeLetter);
  const reviewLetters = (seed.reviewLetters || []).map(normalizeLetter);
  const allFocus = focusLetters.length ? focusLetters : reviewLetters;
  const title = seed.title || `Cycle ${seed.cycleNumber}`;
  const id = seed.id || `cycle-${seed.cycleNumber}`;
  const cycle = {
    id,
    cycleNumber: seed.cycleNumber || null,
    title,
    type: seed.type || "cycle",
    phase: seed.phase || "skills-block",
    focusLetters,
    reviewLetters,
    highFrequencyWords: seed.highFrequencyWords || [],
    phonemicAwareness: seed.phonemicAwareness || [],
    routines: seed.routines || ["Fluency", "Call and Response", "Feel the Beat", "Chaining"],
    friday: seed.friday || "Cycle Practice",
    guidedReadingRecommendations: makeGuidedReadingRecommendations(seed, allFocus),
    dailyFlow: makeDailyFlow(seed, allFocus),
    sections: buildSections({ ...seed, title }, allFocus),
    searchText: [
      title,
      seed.phase,
      ...(seed.highFrequencyWords || []),
      ...allFocus.flatMap(card => [card.grapheme, card.sound, card.spelling]),
      ...(seed.phonemicAwareness || [])
    ].filter(Boolean).join(" ").toLowerCase()
  };
  return applyPriorityCycleContent(cycle);
}

export const elSkillsBlockCycles = CYCLE_SEEDS.map(buildCycle);

export function getElSkillsBlockCycle(id = "cycle-1") {
  return elSkillsBlockCycles.find(cycle => cycle.id === id) || elSkillsBlockCycles.find(cycle => cycle.id === "cycle-1");
}

export function getRecommendedElSkillsBlockCycle({ assessmentSummary = null } = {}) {
  if (!assessmentSummary?.attempts) return getElSkillsBlockCycle("cycle-1");
  const supportCount = assessmentSummary.studentsNeedingSupport?.length || 0;
  if (supportCount > 4) return getElSkillsBlockCycle("review-cycles-1-4");
  return getElSkillsBlockCycle("cycle-8");
}
