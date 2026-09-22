// Nouns — v3 authored bank (wave W9, paired with verbs). The family-wide
// re-keying: concept units (a child masters "nouns name people/places/things"),
// never the 86 word-keys of the legacy bank.
// L1 (category recognition): controlled sentence contexts make the child use
// word function. Pictures no longer reveal the noun/verb distinction.
// L2: GRAMMAR_SENTENCE_FIT (only one option can NAME the thing in the frame —
//   distractors are un-nounable verbs/adjectives, which IS the construct),
//   GRAMMAR_CONTRAST (which word names a thing / which sentence names TWO).
// Child wording: "naming word", never bare "noun" at L1.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §15.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const L1_SENTENCES = {
  king: "The ___ wore a golden crown.",
  vet: "The ___ helped the sick dog.",
  queen: "The ___ sat on the throne.",
  fox: "A ___ crept past the hens.",
  zebra: "The ___ had black-and-white stripes.",
  sheep: "A ___ gave us warm wool.",
  farm: "We saw cows at the ___.",
  park: "We played games at the ___.",
  zoo: "We visited lions at the ___.",
  cup: "I drank water from a ___.",
  drum: "Sam tapped the ___ with sticks.",
  spoon: "I stirred the soup with a ___.",
  girl: "The ___ waved to her friend.",
  goat: "The ___ munched grass by the gate."
};

// L1 context: one naming word and three function-swaps.
const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: `Which naming word fits: ${L1_SENTENCES[keyWord]}`,
  spoken: `Which naming word fits? ${L1_SENTENCES[keyWord].replace("___", "hmm")}`,
  sentence: L1_SENTENCES[keyWord],
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w] || "D-FUNCTION-SWAP"))),
  media: "text",
  note: note || "language context, not a category-revealing picture, provides the evidence"
});

// L1 print.
const gwc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_WORD_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

// L2 sentence fit — always show the full assessment task, not a bare frame.
const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: `Which naming word fits: ${sentence}`,
  spoken: `Which naming word fits? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

// L2 contrast.
const gct = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_CONTRAST",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const gnp = (u, lvl, ph, v, sentence, pairs, note = "Identify both naming words, rather than spotting just one.") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: `Which pair completes both naming words? ${sentence}`,
  spoken: `Which pair completes both naming words? ${sentence.replaceAll("___", "hmm")}`,
  sentence,
  choices: pairs.map((w, i) => i === 0 ? K(w) : P(w, "D-FUNCTION-SWAP")),
  media: "text", note
});

const FS = "D-FUNCTION-SWAP";

// Separate contexts for a fresh full phase retry; these are not retention items.
const freshPhaseItems = [
  gwc("noun_person", 1, 1, 9, "Which word names someone who flies a plane?", ["pilot", "fly", "high", "quickly"], [FS, FS, FS]),
  gwc("noun_person", 1, 1, 10, "Which word names someone in your family?", ["sister", "sleep", "kind", "slowly"], [FS, FS, FS]),
  gwc("noun_animal", 1, 1, 9, "Which naming word is an animal?", ["tiger", "tired", "tickle", "quietly"], [FS, FS, FS]),
  gwc("noun_animal", 1, 1, 10, "Which word names an animal with a shell?", ["turtle", "turn", "tiny", "gently"], [FS, FS, FS]),
  gwc("noun_place", 1, 2, 8, "Which naming word is a place to borrow books?", ["library", "read", "quiet", "carefully"], [FS, FS, FS]),
  gwc("noun_place", 1, 2, 9, "Which word names a place where people swim?", ["pool", "splash", "deep", "slowly"], [FS, FS, FS]),
  gwc("noun_thing", 1, 2, 8, "Which word names something that opens a lock?", ["key", "keep", "kind", "quickly"], [FS, FS, FS]),
  gwc("noun_thing", 1, 2, 9, "Which naming word means something you can read?", ["book", "read", "bright", "quietly"], [FS, FS, FS]),
  gct("noun_two_step", 2, 2, 11, "Which sentence has exactly TWO naming words?",
    ["Rain filled the bucket.", "Rain fell softly.", "Rain filled the bucket and tub.", "It fell all around."], [FS, FS, FS]),
  gct("noun_two_step", 2, 2, 12, "Which sentence has exactly TWO naming words?",
    ["The child opened a parcel.", "The child smiled.", "The child put a toy in the parcel.", "She smiled and waved."], [FS, FS, FS]),
  gct("noun_two_step", 2, 2, 13, "Which sentence has exactly TWO naming words?",
    ["My scarf covered my chin.", "My scarf was warm.", "My scarf covered my chin and neck.", "I was very warm."], [FS, FS, FS]),
  gct("noun_two_step", 2, 2, 14, "Which sentence has exactly TWO naming words?",
    ["A seed grew into a flower.", "A seed grew slowly.", "A seed grew into a flower in our garden.", "It grew very quickly."], [FS, FS, FS]),
  gnp("noun_two_step", 2, 2, 15, "The ___ passed the ___.", ["bus and shop", "bus and passed", "passed and shop", "the and passed"]),
  gnp("noun_two_step", 2, 2, 16, "A ___ lifted the ___.", ["wave and boat", "a and lifted", "wave and lifted", "lifted and boat"]),
  gnp("noun_two_step", 2, 2, 17, "The ___ carried a ___.", ["girl and basket", "girl and carried", "carried and basket", "the and carried"]),
  gnp("noun_two_step", 2, 2, 18, "___ shook the ___.", ["wind and leaves", "wind and shook", "shook and leaves", "the and shook"])
];

export default {
  skillId: "nouns",
  skillName: "Nouns",
  items: [
    // ================= L1 · noun_person (phase 1) =================
    gic("noun_person", 1, 1, 1, "Which one shows a person?",
      ["king", "swim", "clap", "dig"], "king", {},
      "nurse and baker keys stay out of this frame — their er/rs chunks sit inside person"),
    gic("noun_person", 1, 1, 2, "Which one shows a person?",
      ["vet", "draw", "hop", "press"], "vet", {}),
    gic("noun_person", 1, 1, 3, "Which one shows a person?",
      ["queen", "swim", "draw", "clap"], "queen", {}),
    gwc("noun_person", 1, 1, 4, "Which word names a person?",
      ["vet", "run", "wet", "hop"], [FS, FS, FS]),
    gwc("noun_person", 1, 1, 5, "Which word names a person?",
      ["nurse", "sing", "soft", "dig"], [FS, FS, FS]),
    gwc("noun_person", 1, 1, 6, "Which word names a person?",
      ["king", "jump", "cold", "sit"], [FS, FS, FS]),
    // ================= L1 · noun_animal (phase 1) =================
    gic("noun_animal", 1, 1, 1, "Which one shows an animal?",
      ["fox", "clap", "dig", "draw"], "fox", {}),
    gic("noun_animal", 1, 1, 2, "Which one shows an animal?",
      ["zebra", "swim", "press", "hop"], "zebra", {}),
    gic("noun_animal", 1, 1, 3, "Which one shows an animal?",
      ["sheep", "draw", "clap", "swim"], "sheep", {}),
    gwc("noun_animal", 1, 1, 4, "Which word names an animal?",
      ["frog", "wet", "run", "big"], [FS, FS, FS]),
    gwc("noun_animal", 1, 1, 5, "Which word names an animal?",
      ["duck", "dig", "hot", "nap"], [FS, FS, FS]),
    gwc("noun_animal", 1, 1, 6, "Which word names an animal?",
      ["lion", "sing", "tall", "eat"], [FS, FS, FS]),
    // ================= L1 · noun_place (phase 2) =================
    gic("noun_place", 1, 2, 1, "Which one shows a place?",
      ["farm", "clap", "swim", "hop"], "farm", {}),
    gic("noun_place", 1, 2, 2, "Which one shows a place?",
      ["park", "dig", "draw", "press"], "park", {}),
    gic("noun_place", 1, 2, 3, "Which one shows a place?",
      ["zoo", "hop", "clap", "draw"], "zoo", {}),
    gwc("noun_place", 1, 2, 4, "Which word names a place?",
      ["shop", "shut", "slow", "spin"], [FS, FS, FS]),
    gwc("noun_place", 1, 2, 5, "Which word names a place?",
      ["beach", "bring", "brave", "lace"], [FS, FS, FS],
      "lace ties the ac/place overlap — it names a thing, never a place"),
    gwc("noun_place", 1, 2, 6, "Which word names a place?",
      ["school", "skip", "chat", "swim"], [FS, FS, FS],
      "chat ties the ch/which overlap"),
    // ================= L1 · noun_thing (phase 2) =================
    gic("noun_thing", 1, 2, 1, "Which one shows a thing you can hold?",
      ["cup", "swim", "clap", "hop"], "cup", {}),
    gic("noun_thing", 1, 2, 2, "Which one shows a thing you can hold?",
      ["drum", "draw", "dig", "press"], "drum", {}),
    gic("noun_thing", 1, 2, 3, "Which one shows a thing you can hold?",
      ["spoon", "hop", "swim", "draw"], "spoon", {}),
    gwc("noun_thing", 1, 2, 4, "Which word names the thing that lit the room?",
      ["lamp", "lift", "loud", "lick"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 5, "Which word names the thing worn around a waist?",
      ["belt", "bend", "bumpy", "bite"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 6, "Which word names the thing that shows the time?",
      ["clock", "climb", "clean", "cry"], [FS, FS, FS]),

    // ================= L2 · noun_in_sentence (phase 1) =================
    gsf("noun_in_sentence", 2, 1, 1, "The ___ sailed into the bay.",
      ["ship", "went", "wet", "ran"], [FS, FS, FS],
      "only ship can NAME the sailer — went/wet/ran cannot fill a naming slot"),
    gsf("noun_in_sentence", 2, 1, 2, "A ___ buzzed by my ear.",
      ["wasp", "flew", "loud", "ran"], [FS, FS, FS],
      "by, not past — past contains as and would gift the key a chunk"),
    gsf("noun_in_sentence", 2, 1, 3, "The ___ dripped on the rug.",
      ["paint", "spilt", "damp", "fell"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 4, "Our ___ creaks in the wind.",
      ["gate", "blew", "old", "shut"], [FS, FS, FS]),
    gct("noun_in_sentence", 2, 1, 5, "Which word in this sentence is a naming word? \"The kite dipped and spun.\"",
      ["kite", "dipped", "spun", "and"], [FS, FS, FS]),
    gct("noun_in_sentence", 2, 1, 6, "Which word in this sentence is a naming word? \"My boots got soaked.\"",
      ["boots", "got", "soaked", "my"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 7, "The ___ hooted all night long.",
      ["owl", "slept", "dark", "flew"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 8, "A ___ rolled off the shelf.",
      ["jar", "broke", "full", "fell"], [FS, FS, FS]),
    // ================= L2 · noun_vs_verb (phase 1) =================
    gct("noun_vs_verb", 2, 1, 1, "Which word is a naming word in ‘We jump onto the bed’?",
      ["bed", "jump", "onto", "we"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 2, "I ate lunch with a ___.",
      ["fork", "stirring", "quickly", "hungry"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 3, "Which word is a naming word in ‘We hike to the tent’?",
      ["tent", "hike", "to", "we"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 4, "The ___ sang to the crowd.",
      ["singer", "sing", "sung", "sang"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 5, "Which word is a naming word in ‘I sweep with a broom’?",
      ["broom", "sweep", "with", "I"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 6, "Which word is a naming word in ‘We climb the hill’?",
      ["hill", "climb", "the", "we"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 7, "The ___ flew high in the wind.",
      ["kite", "soaring", "glided", "drifting"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 8, "Our ___ reads to us after lunch.",
      ["teacher", "teach", "taught", "teaches"], [FS, FS, FS]),
    // ================= L2 · noun_two_step (phase 2) =================
    gct("noun_two_step", 2, 2, 1, "Which sentence has exactly TWO naming words?",
      ["The cat sat on the mat.", "The cat sat quietly.", "The cat, dog and hen slept.", "We sat very still."],
      [FS, FS, FS],
      "cat + mat; the distractors contain one, three and zero naming words"),
    gct("noun_two_step", 2, 2, 2, "Which sentence has exactly TWO naming words?",
      ["The dog dug up a bone.", "The dog dug quickly.", "The dog took a bone to its bowl.", "They dug all day."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 3, "Which sentence has exactly TWO naming words?",
      ["A frog sat on a log.", "The frog jumped away.", "A frog and a toad sat on a log.", "It jumped up high."],
      [FS, FS, FS]),
    gnp("noun_two_step", 2, 2, 4, "The ___ chased a ___.",
      ["cat and mouse", "cat and chased", "chased and mouse", "the and a"]),
    gct("noun_two_step", 2, 2, 5, "Which sentence has exactly TWO naming words?",
      ["My hat fell in the mud.", "My hat fell down.", "My hat and coat fell in mud.", "It fell down slowly."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 6, "Which sentence has exactly TWO naming words?",
      ["The bee flew to the rose.", "The bee flew away.", "The bee flew from a rose to a tree.", "It flew away fast."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 7, "Which sentence has exactly TWO naming words?",
      ["A crab hid under a rock.", "A crab hid there.", "A crab and a fish hid under a rock.", "They hid very well."],
      [FS, FS, FS]),
    gnp("noun_two_step", 2, 2, 8, "A ___ scratched the ___.",
      ["fork and plate", "fork and scratched", "scratched and plate", "a and the"]),

    // ================= Retention reserve (form R) =================
    gic("noun_person", 1, 1, 7, "Which one shows a person?",
      ["girl", "hop", "dig", "swim"], "girl", {}),
    gic("noun_animal", 1, 1, 7, "Which one shows an animal?",
      ["goat", "press", "clap", "draw"], "goat", {}),
    gwc("noun_place", 1, 2, 7, "Which word names a place?",
      ["park", "pull", "pink", "peck"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 7, "Which word names a thing?",
      ["brush", "brave", "quickly", "gently"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 9, "The ___ chimed at noon.",
      ["clock", "rang", "loud", "slow"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 9, "The bird slept in its ___.",
      ["nest", "built", "perched", "pecked"], [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 9, "Which sentence has exactly TWO naming words?",
      ["The hen laid an egg.", "The hen clucked loudly.", "The hen laid an egg in straw.", "It was so loud."],
      [FS, FS, FS]),
    gwc("noun_person", 1, 1, 8, "Which word names a person?",
      ["baker", "bake", "water", "mix"], [FS, FS, FS],
      "water ties the er/person overlap — it names a thing, never a person"),
    gwc("noun_animal", 1, 1, 8, "Which word names an animal?",
      ["shark", "sharp", "swim", "dive"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 10, "A ___ nested in our chimney.",
      ["bird", "flew", "small", "sang"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 10, "Which word is a naming word in ‘The children splash in the pond’?",
      ["pond", "splash", "in", "the"], [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 10, "Which sentence has exactly TWO naming words?",
      ["The moth flew at the lamp.", "The moth flew inside.", "The moth flew past a lamp and a clock.", "It flew in quietly."],
      [FS, FS, FS])
  ].map(item => {
    if ((item.lvl === 1 && item.v >= 7) || (item.lvl === 2 && item.v >= 9)) item.retention = true;
    return item;
  }).concat(freshPhaseItems)
};
