// Adjectives — v3 authored bank (wave W10, paired with prepositions_of_place).
// Concept units by semantic dimension (size/color/texture-state/feeling) —
// breadth comes from dimensions, not from recycling five words (the audit's
// brave/bumpy/calm/crisp/cute rotation dies here), and every "a adjective"
// broken frame is gone.
// L1 GRAMMAR_SENTENCE_FIT uses a controlled sentence so the evidence is word
// meaning and adjective function, not background knowledge about an object.
// GRAMMAR_WORD_CHOICE checks adjective-class recognition in print.
// L2: GRAMMAR_SENTENCE_FIT (all four options are describing words or family
//   rivals — a sense pin in the frame picks the key) + GRAMMAR_CONTRAST.
// Child wording: "describing word".
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §17.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const L1_SENTENCES = {
  "Which one is very big?": "The ___ animal was bigger than the rest.",
  "Which one is tiny?": "The ___ button was smaller than my fingernail.",
  "Which one is very tall?": "The ___ tree rose above every roof.",
  "Which one is green?": "The leaf matched fresh grass: it was ___.",
  "Which one is yellow?": "The banana matched sunshine: it was ___.",
  "Which one feels soft?": "The ___ blanket felt gentle on my cheek.",
  "Which one feels wet?": "The ___ towel dripped onto the floor.",
  "Which one feels hard?": "The ___ stone stayed firm when squeezed.",
  "Which one shows a happy face?": "Mina smiled because she felt ___.",
  "Which one is very small?": "The ___ mark was smaller than a dot.",
  "Which one feels bumpy?": "The ___ path made the stroller shake."
};

const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: `Which description fits best: ${L1_SENTENCES[prompt]}`,
  spoken: `Which description fits best? ${L1_SENTENCES[prompt].replace("___", "hmm")}`,
  sentence: L1_SENTENCES[prompt],
  choices: cards.map(word => (word === keyWord ? K(word) : P(word, rationales[word] || "D-PLAUSIBLE-UNSUPPORTED"))),
  media: "text",
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

const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => {
  const task = u === "adj_precision" ? "Which adjective fits best" : "Which adjective fits";
  return {
    u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
    prompt: `${task}: ${sentence}`,
    spoken: `${task}? ${sentence.replace("___", "hmm")}`,
    sentence,
    choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
    media: "text",
    note
  };
};

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
      ["huge", "tiny", "thin", "soft"], "huge", {}),
    gic("adj_size", 1, 1, 2, "Which one is tiny?",
      ["tiny", "huge", "wide", "rough"], "tiny", {}),
    gic("adj_size", 1, 1, 3, "Which one is very tall?",
      ["tall", "short", "round", "quiet"], "tall", {}),
    gwc("adj_size", 1, 1, 4, "Which word is a describing word for size?",
      ["big", "bag", "dig", "bin"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 5, "Which word is a describing word for size?",
      ["small", "smell", "spill", "shell"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 6, "Which word is a describing word for size?",
      ["long", "log", "song", "lung"], [FS, FS, FS]),
    // ================= L1 · adj_color (phase 1) =================
    gic("adj_color", 1, 1, 1, "Which one is green?",
      ["green", "red", "blue", "brown"], "green", {}),
    gic("adj_color", 1, 1, 2, "Which one is yellow?",
      ["yellow", "purple", "blue", "black"], "yellow", {}),
    gwc("adj_color", 1, 1, 3, "Which word is a color word?",
      ["red", "bed", "ten", "run"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 4, "Which word is a color word?",
      ["blue", "glue", "blow", "club"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 5, "Which word is a color word?",
      ["green", "grin", "grow", "queen"], [FS, FS, FS]),
    gwc("adj_color", 1, 1, 6, "Which word is a color word?",
      ["brown", "crown", "brow", "barn"], [FS, FS, FS]),
    // ================= L1 · adj_texture_state (phase 2) =================
    gic("adj_texture_state", 1, 2, 1, "Which one feels soft?",
      ["soft", "hard", "rough", "wet"], "soft", {}),
    gic("adj_texture_state", 1, 2, 2, "Which one feels wet?",
      ["wet", "dry", "soft", "cold"], "wet", {}),
    gic("adj_texture_state", 1, 2, 3, "Which one feels hard?",
      ["hard", "soft", "wet", "warm"], "hard", {}),
    gwc("adj_texture_state", 1, 2, 4, "Which word describes how something feels to touch?",
      ["soft", "sofa", "sat", "sock"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 5, "Which word describes how something feels to touch?",
      ["wet", "web", "vet", "win"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 6, "Which word describes how something feels to touch?",
      ["cold", "coat", "gold", "colt"], [FS, FS, FS]),
    // ================= L1 · adj_feeling (phase 2) =================
    gic("adj_feeling", 1, 2, 1, "Which one shows a happy face?",
      ["happy", "sad", "mad", "tired"], "happy", {}),
    gwc("adj_feeling", 1, 2, 2, "Which word is a feeling word?",
      ["sad", "sat", "sand", "said"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 3, "Which word is a feeling word?",
      ["happy", "hoppy", "hippo", "puppy"], [FS, FS, FS],
      "hoppy is the developmental spelling neighbour — real word, wrong class"),
    gwc("adj_feeling", 1, 2, 4, "Which word is a feeling word?",
      ["tired", "tied", "tries", "tiger"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 5, "Which word is a feeling word?",
      ["mad", "mat", "map", "man"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 6, "Which word is a feeling word?",
      ["proud", "cloud", "round", "pound"], [FS, FS, FS]),

    // ================= L2 · adj_in_sentence (phase 1) =================
    gsf("adj_in_sentence", 2, 1, 1, "The ___ soup burned my lip.",
      ["hot", "cold", "lost", "torn"], [PU, FS, FS],
      "all four describe — burned pins hot"),
    gsf("adj_in_sentence", 2, 1, 2, "My ___ boots let the rain in.",
      ["leaky", "new", "shiny", "warm"], [PU, PU, PU],
      "let the rain in pins leaky"),
    gsf("adj_in_sentence", 2, 1, 3, "The ___ box weighed more than I could lift.",
      ["heavy", "empty", "tiny", "light"], [PU, PU, PU]),
    gsf("adj_in_sentence", 2, 1, 4, "We squinted in the ___ sunshine.",
      ["bright", "dim", "soft", "gray"], [PU, PU, PU],
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
    gsf("adj_precision", 2, 1, 2, "The lemonade was ___ and made our mouths pucker.",
      ["sour", "sweet", "warm", "pale"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 3, "The old stairs were ___ and groaned under our feet.",
      ["creaky", "quiet", "fresh", "damp"], [PU, PU, PU]),
    gsf("adj_precision", 2, 1, 4, "Wear the ___ coat to stay warm in the snow.",
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
    gct("adj_vs_noun_verb", 2, 2, 1, "Which word describes something in ‘The soft blanket covered the bed’?",
      ["soft", "blanket", "covered", "bed"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 2, "Which word describes something in ‘The brave child helped a friend’?",
      ["brave", "child", "helped", "friend"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 3, "Which word describes something in ‘The windy day bent the trees’?",
      ["windy", "day", "bent", "trees"], [FS, FS, FS]),
    gsf("adj_vs_noun_verb", 2, 2, 4, "The ___ sea tossed the little boat.",
      ["stormy", "storm", "storms", "stormed"], [FS, FS, FS],
      "family fit — only the describing form sits before sea"),
    gct("adj_vs_noun_verb", 2, 2, 5, "Which word describes something in ‘The dusty shelf made me sneeze’?",
      ["dusty", "shelf", "made", "sneeze"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 6, "Which word describes something in ‘The salty soup needed more water’?",
      ["salty", "soup", "needed", "water"], [FS, FS, FS]),
    gsf("adj_vs_noun_verb", 2, 2, 7, "A ___ morning is best for kites.",
      ["breezy", "breeze", "breezes", "bread"], [FS, FS, FS]),
    gct("adj_vs_noun_verb", 2, 2, 8, "Which word describes something in ‘Her curly hair bounced as she ran’?",
      ["curly", "hair", "bounced", "ran"], [FS, FS, FS]),

    // ================= Retention reserve (form R) =================
    gic("adj_size", 1, 1, 7, "Which one is very small?",
      ["tiny", "huge", "wide", "long"], "tiny", {}),
    gwc("adj_color", 1, 1, 7, "Which word is a color word?",
      ["pink", "pin", "wink", "sink"], [FS, FS, FS]),
    gwc("adj_texture_state", 1, 2, 7, "Which word describes how something feels to touch?",
      ["dry", "day", "dig", "drum"], [FS, FS, FS]),
    gwc("adj_feeling", 1, 2, 7, "Which word is a feeling word?",
      ["glad", "glass", "grab", "gold"], [FS, FS, FS]),
    gsf("adj_in_sentence", 2, 1, 9, "The ___ floor squeaked with every step.",
      ["shiny", "shine", "shone", "shines"], [FS, FS, FS]),
    gsf("adj_precision", 2, 1, 9, "The rope was too ___ to snap.",
      ["strong", "weak", "thin", "old"], [PU, PU, PU],
      "too ___ to snap — only strong survives the frame"),
    gct("adj_vs_noun_verb", 2, 2, 9, "Which word describes something in ‘The rusty gate creaked when it opened’?",
      ["rusty", "gate", "creaked", "opened"], [FS, FS, FS]),
    gwc("adj_size", 1, 1, 8, "Which word is a describing word for size?",
      ["wide", "wade", "wind", "web"], [FS, FS, FS]),
    gic("adj_texture_state", 1, 2, 8, "Which one feels bumpy?",
      ["bumpy", "smooth", "soft", "flat"], "bumpy", {}),
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
