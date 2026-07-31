// Adjectives — v3 authored bank (wave W10, paired with prepositions_of_place).
// Concept units by semantic dimension (size/colour/texture-state/feeling) —
// breadth comes from dimensions, not from recycling five words (the audit's
// brave/bumpy/calm/crisp/cute rotation dies here), and every "a adjective"
// broken frame is gone.
// L1 GRAMMAR_IMAGE_CHOICE: the describing word sits in the PROMPT and the
//   child picks the picture it fits — canonical world knowledge (a leaf is
//   green, wool is soft), safe in line art. Colour leans on print items where
//   canon is weak. GRAMMAR_WORD_CHOICE: class recognition in print.
// L2: GRAMMAR_SENTENCE_FIT (all four options are describing words or family
//   rivals — a sense pin in the frame picks the key) + GRAMMAR_CONTRAST.
// Child wording: "describing word".
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §17.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["language", "hfw", "cvc", "rhyming", "blends", "digraphs", "long-vowels"]);

const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_IMAGE_CHOICE",
  prompt,
  spoken: prompt,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w] || "D-FUNCTION-SWAP"))),
  media: "image-required",
  note
});

const gwc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_WORD_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: sentence,
  spoken: `Which describing word finishes the sentence? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const gct = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_CONTRAST",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const FS = "D-FUNCTION-SWAP";
const PU = "D-PLAUSIBLE-UNSUPPORTED";

export default {
  skillId: "adjectives",
  skillName: "Adjectives",
  items: [
    // ================= L1 · adj_size (phase 1) =================
    gic("adj_size", 1, 1, 1, "Which one is very big?",
      ["whale", "ant", "wheel", "cup"], "whale", {},
      "wheel ties the wh/which overlap"),
    gic("adj_size", 1, 1, 2, "Which one is tiny?",
      ["ant", "whale", "house", "tent"], "ant", {}),
    gic("adj_size", 1, 1, 3, "Which one is very tall?",
      ["tree", "mat", "sock", "dish"], "tree", {}),
    gwc("adj_size", 1, 1, 4, "Which word is a describing word for size?",
      ["big", "bag", "dig", "bin"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 5, "Which word is a describing word for size?",
      ["small", "smell", "spill", "shell"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 6, "Which word is a describing word for size?",
      ["long", "log", "song", "lung"], [FS, FS, FS]),
    // ================= L1 · adj_color (phase 1) =================
    gic("adj_color", 1, 1, 1, "Which one is green?",
      ["frog", "crab", "moth", "wasp"], "frog", {},
      "canonical colours the child knows even in line art"),
    gic("adj_color", 1, 1, 2, "Which one is yellow?",
      ["sun", "moon", "cloud", "log"], "sun", {}),
    gwc("adj_color", 1, 1, 3, "Which word is a colour word?",
      ["red", "bed", "ten", "run"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 4, "Which word is a colour word?",
      ["blue", "glue", "blow", "club"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 5, "Which word is a colour word?",
      ["green", "grin", "grow", "queen"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 6, "Which word is a colour word?",
      ["brown", "crown", "brow", "barn"], [FS, FS, FS]),
    // ================= L1 · adj_texture_state (phase 2) =================
    gic("adj_texture_state", 1, 2, 1, "Which one feels soft?",
      ["sheep", "brick", "fork", "shell"], "sheep", {},
      "wool is the canon of soft"),
    gic("adj_texture_state", 1, 2, 2, "Which one feels wet?",
      ["fish", "brick", "quilt", "drum"], "fish", {}),
    gic("adj_texture_state", 1, 2, 3, "Which one feels hard?",
      ["rock", "sheep", "jam", "cloud"], "rock", {}),
    gwc("adj_texture_state", 1, 2, 4, "Which word is a describing word for how things feel?",
      ["soft", "sofa", "sat", "sock"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 5, "Which word is a describing word for how things feel?",
      ["wet", "web", "vet", "win"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 6, "Which word is a describing word for how things feel?",
      ["cold", "coat", "gold", "colt"], [FS, FS, FS]),
    // ================= L1 · adj_feeling (phase 2) =================
    gic("adj_feeling", 1, 2, 1, "Which one shows a happy face?",
      ["smile", "moth", "brick", "rope"], "smile", {}),
    gwc("adj_feeling", 1, 2, 2, "Which word is a feeling word?",
      ["sad", "sat", "sand", "said"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 3, "Which word is a feeling word?",
      ["happy", "hoppy", "hippo", "puppy"], [FS, FS, FS],
      "hoppy is the developmental spelling neighbour — real word, wrong class"),
    gwc("adj_feeling", 1, 2, 4, "Which word is a feeling word?",
      ["tired", "tied", "tries", "tiger"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 5, "Which word is a feeling word?",
      ["cross", "crust", "class", "crisp"], [FS, FS, FS],
      "cross the feeling — the British everyday word for angry"),
    gwc("adj_feeling", 1, 2, 6, "Which word is a feeling word?",
      ["proud", "cloud", "round", "pound"], [FS, FS, FS]),

    // ================= L2 · adj_in_sentence (phase 1) =================
    gsf("adj_in_sentence", 2, 1, 1, "The ___ soup burned my lip.",
      ["hot", "cold", "lost", "torn"], [PU, FS, FS],
      "all four describe — burned pins hot"),
    gsf("adj_in_sentence", 2, 1, 2, "My ___ boots let the rain in.",
      ["leaky", "new", "shiny", "warm"], [PU, PU, PU],
      "let the rain in pins leaky"),
    gsf("adj_in_sentence", 2, 1, 3, "The ___ box needed two of us to lift.",
      ["heavy", "empty", "tiny", "light"], [PU, PU, PU]),
    gsf("adj_in_sentence", 2, 1, 4, "We squinted in the ___ sunshine.",
      ["bright", "dim", "soft", "grey"], [PU, PU, PU],
      "squinted pins bright"),
    gct("adj_in_sentence", 2, 1, 5, "Which word in this sentence is the describing word? \"The muddy pup shook itself.\"",
      ["muddy", "pup", "shook", "itself"], [FS, FS, FS]),
    gct("adj_in_sentence", 2, 1, 6, "Which word in this sentence is the describing word? \"A gentle breeze turned the pages.\"",
      ["gentle", "breeze", "turned", "pages"], [FS, FS, FS]),
    gsf("adj_in_sentence", 2, 1, 7, "The ___ kitten slept through the storm.",
      ["sleepy", "sleep", "sleeps", "slept"], [FS, FS, FS],
      "the family fit — only the describing form sits before kitten"),
    gsf("adj_in_sentence", 2, 1, 8, "Her ___ scarf trailed on the ground.",
      ["longest", "length", "lengthen", "longs"], [FS, FS, FS]),
    // ================= L2 · adj_precision (phase 1) =================
    gsf("adj_precision", 2, 1, 1, "The path was ___ after days of rain.",
      ["muddy", "dusty", "sunny", "tidy"], [PU, PU, PU],
      "days of rain pins muddy — dusty is its dry opposite"),
    gsf("adj_precision", 2, 1, 2, "The lemonade was ___ enough to make us wince.",
      ["sour", "sweet", "warm", "pale"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 3, "The old stairs were ___ under our feet.",
      ["creaky", "quiet", "fresh", "damp"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 4, "Wear the ___ coat — it is snowing hard.",
      ["thick", "thin", "torn", "wet"], [PU, PU, PU]),
    gct("adj_precision", 2, 1, 5, "Which describing word fits best for a street with no sound at all?",
      ["silent", "busy", "narrow", "steep"], [PU, PU, PU]),
    gct("adj_precision", 2, 1, 6, "Which describing word fits best for bread just out of the oven?",
      ["warm", "stale", "frozen", "salty"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 7, "The ___ knife went through the pumpkin easily.",
      ["sharp", "blunt", "clean", "bent"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 8, "Our tent felt ___ with five of us in it.",
      ["crowded", "roomy", "airy", "bare"], [PU, PU, PU]),
    // ================= L2 · adj_vs_noun_verb (phase 2) =================
    gct("adj_vs_noun_verb", 2, 2, 1, "Which word is a describing word, not a naming or doing word?",
      ["soft", "sofa", "sit", "sand"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 2, "Which word is a describing word, not a naming or doing word?",
      ["brave", "bravery", "brag", "branch"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 3, "Which word is a describing word, not a naming or doing word?",
      ["windy", "wind", "window", "winding"], [FS, FS, FS],
      "the wind family in one set"),
    gsf("adj_vs_noun_verb", 2, 2, 4, "The ___ sea tossed the little boat.",
      ["stormy", "storm", "storms", "stormed"], [FS, FS, FS],
      "family fit — only the describing form sits before sea"),
    gct("adj_vs_noun_verb", 2, 2, 5, "Which word is a describing word, not a naming or doing word?",
      ["dusty", "dust", "duster", "dusting"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 6, "Which word is a describing word, not a naming or doing word?",
      ["salty", "salt", "sale", "salute"], [FS, FS, FS]),
    gsf("adj_vs_noun_verb", 2, 2, 7, "A ___ morning is best for kites.",
      ["breezy", "breeze", "breezes", "bread"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 8, "Which word is a describing word, not a naming or doing word?",
      ["curly", "curl", "curler", "curling"], [FS, FS, FS]),

    // ================= Retention reserve (form R) =================
    gic("adj_size", 1, 1, 7, "Which one is very small?",
      ["ink", "house", "tent", "tree"], "ink", {},
      "an ink drop against three big things"),
    gwc("adj_color", 1, 1, 7, "Which word is a colour word?",
      ["pink", "pin", "wink", "sink"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 7, "Which word is a describing word for how things feel?",
      ["dry", "day", "dig", "drum"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 7, "Which word is a feeling word?",
      ["glad", "glass", "grab", "gold"], [FS, FS, FS]),
    gsf("adj_in_sentence", 2, 1, 9, "The ___ floor squeaked with every step.",
      ["shiny", "shine", "shone", "shines"], [FS, FS, FS]),
    gsf("adj_precision", 2, 1, 9, "The rope was too ___ to snap.",
      ["strong", "weak", "thin", "old"], [PU, PU, PU],
      "too ___ to snap — only strong survives the frame"),
    gct("adj_vs_noun_verb", 2, 2, 9, "Which word is a describing word, not a naming or doing word?",
      ["rusty", "rust", "rustle", "russet"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 8, "Which word is a describing word for size?",
      ["wide", "wade", "wind", "web"], [FS, FS, FS]),
    gic("adj_texture_state", 1, 2, 8, "Which one feels bumpy?",
      ["crab", "quilt", "leaf", "moon"], "crab", {},
      "a crab's shell is the canon of bumpy"),
    gsf("adj_in_sentence", 2, 1, 10, "The ___ moth circled the lamp.",
      ["dusty", "dust", "dusts", "dusted"], [FS, FS, FS]),
    gct("adj_precision", 2, 1, 10, "Which describing word fits best for socks left out in the snow?",
      ["frozen", "warm", "clean", "striped"], [PU, PU, PU]),
    gwc("adj_feeling", 1, 2, 8, "Which word is a feeling word?",
      ["upset", "under", "up", "sunset"], [FS, FS, FS])
  ].map(item => {
    if ((item.lvl === 1 && item.v >= 7) || (item.lvl === 2 && item.v >= 9)) item.retention = true;
    return item;
  })
};
