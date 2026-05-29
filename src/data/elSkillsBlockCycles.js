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
  a: ["apple", "ant", "alligator", "axe"],
  m: ["map", "mat", "moon", "milk"],
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
  b: ["bat", "bug", "bed", "bus"],
  w: ["web", "wig", "wet", "wind"],
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
  sh: ["ship", "shop", "shell", "shut"],
  ch: ["chip", "chop", "chin", "chat"],
  th: ["thin", "this", "that", "them"],
  all: ["all", "ball", "fall", "call"],
  wh: ["what", "when", "who", "whisk"],
  nk: ["sink", "bank", "pink", "wink"],
  ng: ["ring", "sing", "song", "hung"],
  fszl: ["puff", "miss", "buzz", "will"],
  pattern: ["by", "my", "try", "why"]
};

const FORMATION = {
  a: {
    upper: "Uppercase A: slant down, slant down, cross.",
    lower: "Lowercase a: circle around, short stick down."
  },
  m: {
    upper: "Uppercase M: down, slant down, slant up, down.",
    lower: "Lowercase m: short stick, bump, bump."
  },
  default: {
    upper: "Say the letter name, trace the big letter, then write it with a steady pencil.",
    lower: "Say the sound, trace the small letter, then write it on the line."
  }
};

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
      ? `Say ${card.sound}. Notice what your mouth, tongue, and breath do. Keep the sound short and clean.`
      : "Say the pattern smoothly and connect it to familiar words.",
    childExplanation: `${card.grapheme} helps us read and write words. We say it, hear it, trace it, and use it in a word.`,
    teacherScript: `Point to ${card.grapheme}. Say: My turn, ${card.sound || card.grapheme}. Your turn. Touch the spelling ${card.spelling}. Let's find it in a word.`,
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
  const sounds = focusLetters.map(card => card.spelling).filter(Boolean).slice(0, 3);
  const hfw = seed.highFrequencyWords || [];
  const firstWord = hfw[0] || "we";
  const secondWord = hfw[1] || "read";
  return {
    title: `${seed.title} Chant`,
    rhythm: "Clap a steady beat. Teacher reads the first line; children echo the second line.",
    lines: [
      `${firstWord} can tap and say the sound.`,
      `${secondWord} can find it all around.`,
      sounds.length ? `Look for ${sounds.join(", ")} in words we know.` : "Listen for sounds in words we know.",
      "Say it, tap it, read it, write it, go!"
    ],
    callAndResponse: [
      { teacher: "What sound are we learning?", students: sounds.join(" and ") || "our review sounds" },
      { teacher: "How do readers practice?", students: "We say it, hear it, read it, and write it." }
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
    teacherWording: `Today we will listen carefully to word parts. I will say a word, then we will take away or change one part and say what is left.`,
    practiceItems: items,
    supportPrompt: "Use two hand motions: one hand for the first part, one hand for the second part. Hide the part that is removed.",
    challengePrompt: "Ask children to make a new example for a partner after they answer."
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

function makeDecoding(seed, focusLetters) {
  const spellings = focusLetters.map(card => card.spelling).filter(Boolean);
  const usable = spellings.filter(item => /^[a-z]+$/.test(item) && item.length <= 2);
  const chains = usable.length
    ? usable.slice(0, 3).map((item, index) => ({
      start: index === 0 ? `${item}a` : `a${item}`,
      steps: [`say ${item}`, `blend with a known vowel`, `change one sound`, `read the new word`]
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

function buildSections(seed, focusLetters) {
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
    teacherNotes: makeTeacherNotes(seed)
  };
}

function buildCycle(seed) {
  const focusLetters = (seed.focusLetters || []).map(normalizeLetter);
  const reviewLetters = (seed.reviewLetters || []).map(normalizeLetter);
  const allFocus = focusLetters.length ? focusLetters : reviewLetters;
  const title = seed.title || `Cycle ${seed.cycleNumber}`;
  const id = seed.id || `cycle-${seed.cycleNumber}`;
  return {
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
