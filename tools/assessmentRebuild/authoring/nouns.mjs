// Nouns — v3 authored bank (wave W9, paired with verbs). The family-wide
// re-keying: concept units (a child masters "nouns name people/places/things"),
// never the 86 word-keys of the legacy bank.
// L1 (category recognition): GRAMMAR_IMAGE_CHOICE — one card names the target
//   category, three cards picture ACTIONS (the doc's function-swap rule), so
//   the child separates naming words from doing words with pictures.
//   GRAMMAR_WORD_CHOICE — same discrimination in print.
// L2: GRAMMAR_SENTENCE_FIT (only one option can NAME the thing in the frame —
//   distractors are un-nounable verbs/adjectives, which IS the construct),
//   GRAMMAR_CONTRAST (which word names a thing / which sentence names TWO).
// Child wording: "naming word", never bare "noun" at L1.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §15.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

// L1 picture: one category card + three action cards.
const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_IMAGE_CHOICE",
  prompt,
  spoken: prompt,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w] || "D-FUNCTION-SWAP"))),
  media: "image-required",
  note
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

// L2 sentence fit — the sentence is the prompt (instruction words leak chunks).
const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: sentence,
  spoken: `Which naming word finishes the sentence? ${sentence.replace("___", "hmm")}`,
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

const FS = "D-FUNCTION-SWAP";

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
    gwc("noun_thing", 1, 2, 4, "Which word names a thing?",
      ["lamp", "lift", "loud", "lick"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 5, "Which word names a thing?",
      ["belt", "bend", "bumpy", "bite"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 6, "Which word names a thing?",
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
    gct("noun_vs_verb", 2, 1, 1, "Which word names a thing, not a doing word?",
      ["bed", "jump", "run", "go"], [FS, FS, FS],
      "the blueprint exemplar set"),
    gct("noun_vs_verb", 2, 1, 2, "Which word names a thing, not a doing word?",
      ["fork", "stir", "chop", "pour"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 3, "Which word names a thing, not a doing word?",
      ["tent", "camp", "hike", "rest"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 4, "The ___ sang to the crowd.",
      ["singer", "sing", "sung", "sang"], [FS, FS, FS],
      "the whole verb family competes — only the naming word can follow The"),
    gct("noun_vs_verb", 2, 1, 5, "Which word names a thing, not a doing word?",
      ["broom", "sweep", "scrub", "wipe"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 6, "Which word is a doing word, not a naming word?",
      ["climb", "ladder", "roof", "wall"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 7, "Which word names a thing, not a doing word?",
      ["kite", "soar", "glide", "drift"], [FS, FS, FS]),
    gsf("noun_vs_verb", 2, 1, 8, "Our ___ reads to us after lunch.",
      ["teacher", "teach", "taught", "teaches"], [FS, FS, FS]),
    // ================= L2 · noun_two_step (phase 2) =================
    gct("noun_two_step", 2, 2, 1, "Which sentence names TWO things?",
      ["The cat sat on the mat.", "Run fast and jump high.", "She is very happy.", "We went out late."],
      [FS, FS, FS],
      "cat + mat; the others name one thing or none"),
    gct("noun_two_step", 2, 2, 2, "Which sentence names TWO things?",
      ["The dog dug up a bone.", "He hops and skips well.", "They are so tall.", "I ran off quickly."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 3, "Which sentence names TWO things?",
      ["A frog sat on a log.", "She sang and danced.", "It is too cold.", "You did so well."],
      [FS, FS, FS]),
    gsf("noun_two_step", 2, 2, 4, "The cat and the ___ hid in the barn.",
      ["mouse", "ran", "wet", "hid"], [FS, FS, FS],
      "finish the two-thing list — only a naming word can join the and"),
    gct("noun_two_step", 2, 2, 5, "Which sentence names TWO things?",
      ["My hat fell in the mud.", "Sit down and rest up.", "It was so loud.", "They ran and hid."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 6, "Which sentence names TWO things?",
      ["The bee flew to the rose.", "Come in and dry off.", "She is quite quick.", "He will not stop."],
      [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 7, "Which sentence names TWO things?",
      ["A crab hid under a rock.", "Hop up and hold on.", "It got very dark.", "You may go in."],
      [FS, FS, FS]),
    gsf("noun_two_step", 2, 2, 8, "A fork and a ___ sat by the plate.",
      ["spoon", "eat", "clean", "cut"], [FS, FS, FS]),

    // ================= Retention reserve (form R) =================
    gic("noun_person", 1, 1, 7, "Which one shows a person?",
      ["girl", "hop", "dig", "swim"], "girl", {}),
    gic("noun_animal", 1, 1, 7, "Which one shows an animal?",
      ["goat", "press", "clap", "draw"], "goat", {}),
    gwc("noun_place", 1, 2, 7, "Which word names a place?",
      ["park", "pull", "pink", "peck"], [FS, FS, FS]),
    gwc("noun_thing", 1, 2, 7, "Which word names a thing?",
      ["brush", "brave", "bump", "blow"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 9, "The ___ chimed at noon.",
      ["clock", "rang", "loud", "slow"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 9, "Which word names a thing, not a doing word?",
      ["nest", "build", "perch", "peck"], [FS, FS, FS]),
    gct("noun_two_step", 2, 2, 9, "Which sentence names TWO things?",
      ["The hen laid an egg.", "Duck down and creep in.", "It is far too wet.", "She may not come."],
      [FS, FS, FS]),
    gwc("noun_person", 1, 1, 8, "Which word names a person?",
      ["baker", "bake", "water", "mix"], [FS, FS, FS],
      "water ties the er/person overlap — it names a thing, never a person"),
    gwc("noun_animal", 1, 1, 8, "Which word names an animal?",
      ["shark", "sharp", "swim", "dive"], [FS, FS, FS]),
    gsf("noun_in_sentence", 2, 1, 10, "A ___ nested in our chimney.",
      ["bird", "flew", "small", "sang"], [FS, FS, FS]),
    gct("noun_vs_verb", 2, 1, 10, "Which word is a doing word, not a naming word?",
      ["splash", "pond", "duck", "puddle"], [FS, FS, FS],
      "splash and duck both zero-derive — the frame asks for the doing word, and only splash is pictured as pure action; duck the animal is the trap"),
    gct("noun_two_step", 2, 2, 10, "Which sentence names TWO things?",
      ["The moth flew at the lamp.", "Spin round and sit down.", "He was not there.", "You can all go."],
      [FS, FS, FS])
  ].map(item => {
    if ((item.lvl === 1 && item.v >= 7) || (item.lvl === 2 && item.v >= 9)) item.retention = true;
    return item;
  })
};
