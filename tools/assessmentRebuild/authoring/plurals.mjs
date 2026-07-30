// Plurals — v3 authored bank (wave W11, paired with prefixes_suffixes).
// The distractor law (BLUEPRINTS_LANGUAGE §19): fake forms live ONLY in
// PLURAL_ERROR_SPOT and come from approvedWords.json approvedDevErrors —
// every choice in every other format is a real English word. Number traps
// are the singular of the key; wrong-word pairs supply the other two.
// Scanner-proofing doctrine:
//   PIS/PSC — singular+plural share their root chunk, so any prompt-word
//     gift ties; frames audited so endings (es/ies/ves) are never gifted.
//   PES — the planted error must never be the strictly longest chunk-scorer:
//     each sentence carries a word at least as long as the error.
// All images resolve to existing art (child-mode/plurals + singles).
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §19.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const FS = "D-FUNCTION-SWAP";       // wrong number, right word
const SEM = "D-SEMANTIC";           // wrong word (its number varies)
const PU = "D-PLAUSIBLE-UNSUPPORTED"; // correctly spelled word in error-spot

const pis = (u, lvl, ph, v, img, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PLURAL_IMAGE_SPELLING",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "image-required",
  img,
  imgAlt: img.replace(/_/g, " "),
  note
});

const psc = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PLURAL_SPELLING_CONTEXT",
  prompt: sentence,
  spoken: `Which word finishes the sentence? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const pes = (u, lvl, ph, v, sentence, words, note = "") => ({
  u, lvl, ph, v, fmt: "PLURAL_ERROR_SPOT",
  prompt: `Spot the wrong word: ${sentence}`,
  spoken: `One word is written wrong. Spot it: ${sentence}`,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, PU))),
  media: "text",
  note
});

const ptc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PLURAL_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

export default {
  skillId: "plurals",
  skillName: "Plurals",
  items: [
    // ================= L1 phase 1: plural_add_s =================
    pis("plural_add_s", 1, 1, 1, "cats", "Which word tells what you see?",
      ["cats", "cat", "dogs", "dog"], [FS, SEM, SEM],
      "what gifts at to both cats and cat — root tie by construction"),
    pis("plural_add_s", 1, 1, 2, "dogs", "Pick the word that fits the picture.",
      ["dogs", "dog", "hens", "hen"], [FS, SEM, SEM]),
    pis("plural_add_s", 1, 1, 3, "books", "What does the picture show?",
      ["books", "book", "cups", "cup"], [FS, SEM, SEM],
      "does carries es — safe here because no option ends in es"),
    pis("plural_add_s", 1, 1, 4, "cups", "Which word fits the picture?",
      ["cups", "cup", "hats", "hat"], [FS, SEM, SEM]),
    psc("plural_add_s", 1, 1, 5, "Two ___ sat on the wall.",
      ["cats", "cat", "hens", "hen"], [FS, SEM, SEM],
      "sat gifts at to cats and cat alike"),
    psc("plural_add_s", 1, 1, 6, "The three ___ wag their tails.",
      ["dogs", "dog", "cups", "cup"], [FS, SEM, SEM]),
    psc("plural_add_s", 1, 1, 7, "Both ___ lay open on the desk.",
      ["books", "book", "hats", "hat"], [FS, SEM, SEM],
      "both gifts bo to books and book alike; desk's es chunk touches no option"),
    psc("plural_add_s", 1, 1, 8, "Six ___ shine over the barn.",
      ["stars", "star", "dogs", "dog"], [FS, SEM, SEM],
      "barn gifts ar to stars and star alike"),

    // ================= L1 phase 1: plural_concept =================
    pis("plural_concept", 1, 1, 1, "cat", "Just one! Which word fits?",
      ["cat", "cats", "cups", "cup"], [FS, SEM, SEM],
      "fits gifts ts to the distractor cats only — scanner picks a distractor, never the key"),
    pis("plural_concept", 1, 1, 2, "dogs", "More than one! Which word fits?",
      ["dogs", "dog", "books", "book"], [FS, SEM, SEM]),
    pis("plural_concept", 1, 1, 3, "hats", "More than one! Pick the word.",
      ["hats", "hat", "stars", "star"], [FS, SEM, SEM],
      "than gifts ha to hats and hat alike"),
    pis("plural_concept", 1, 1, 4, "cup", "Just one! Pick the word.",
      ["cup", "cups", "stars", "star"], [FS, SEM, SEM],
      "just gifts st to stars and star — a tied distractor pair, key untouched"),
    psc("plural_concept", 1, 1, 5, "I see one ___ by the door.",
      ["hen", "hens", "cups", "cup"], [FS, SEM, SEM]),
    psc("plural_concept", 1, 1, 6, "Many ___ twinkle at night.",
      ["stars", "star", "books", "book"], [FS, SEM, SEM]),
    psc("plural_concept", 1, 1, 7, "One ___ floats on the pond.",
      ["duck", "ducks", "frogs", "frog"], [FS, SEM, SEM]),
    psc("plural_concept", 1, 1, 8, "Lots of ___ hop in the grass.",
      ["frogs", "frog", "hens", "hen"], [FS, SEM, SEM]),

    // ================= L1 phase 2: plural_add_es =================
    pis("plural_add_es", 1, 2, 1, "boxes", "Pick the word for the picture.",
      ["boxes", "box", "dishes", "dish"], [FS, SEM, SEM]),
    pis("plural_add_es", 1, 2, 2, "dishes", "Which word fits the picture?",
      ["dishes", "dish", "brushes", "brush"], [FS, SEM, SEM]),
    pis("plural_add_es", 1, 2, 3, "brushes", "Which word tells what you see?",
      ["brushes", "brush", "boxes", "box"], [FS, SEM, SEM]),
    psc("plural_add_es", 1, 2, 4, "We packed six ___ for the trip.",
      ["boxes", "box", "hens", "hen"], [FS, SEM, SEM]),
    psc("plural_add_es", 1, 2, 5, "The ___ dried by the sink.",
      ["dishes", "dish", "cups", "cup"], [FS, SEM, SEM]),
    psc("plural_add_es", 1, 2, 6, "Three ___ chugged up the hill.",
      ["buses", "bus", "cats", "cat"], [FS, SEM, SEM]),
    psc("plural_add_es", 1, 2, 7, "The ___ scrubbed the mud off our boots.",
      ["brushes", "brush", "foxes", "fox"], [FS, SEM, SEM],
      "scrubbed gifts ru to brushes and brush alike"),
    psc("plural_add_es", 1, 2, 8, "Two red ___ hid in the den.",
      ["foxes", "fox", "hats", "hat"], [FS, SEM, SEM]),

    // ================= L2 phase 1: plural_y_to_ies =================
    psc("plural_y_to_ies", 2, 1, 1, "The ___ giggled in their cots.",
      ["babies", "baby", "ladies", "lady"], [FS, SEM, SEM]),
    psc("plural_y_to_ies", 2, 1, 2, "Three ___ planned the fair.",
      ["ladies", "lady", "cities", "city"], [FS, SEM, SEM],
      "planned gifts la to ladies and lady alike"),
    psc("plural_y_to_ies", 2, 1, 3, "We hung lights for both ___.",
      ["parties", "party", "cities", "city"], [FS, SEM, SEM]),
    pes("plural_y_to_ies", 2, 1, 4, "The babys slept in their cots.",
      ["babys", "slept", "their", "cots"],
      "babys is the attested error (approvedDevErrors); slept and their tie its chunk length"),
    pes("plural_y_to_ies", 2, 1, 5, "Two citys glow at night.",
      ["citys", "glow", "night", "Two"],
      "night ties citys at five letters"),
    ptc("plural_y_to_ies", 2, 1, 6, "Which is the plural of pony?",
      ["ponies", "pony", "stories", "story"], [FS, SEM, SEM],
      "the prompt names pony, so the scanner takes the bait word, not the key"),

    // ================= L2 phase 1: plural_irregular =================
    psc("plural_irregular", 2, 1, 1, "The ___ marched in the band.",
      ["men", "man", "women", "woman"], [FS, SEM, SEM],
      "band and marched gift chunks to man and woman — a tied distractor pair"),
    psc("plural_irregular", 2, 1, 2, "Both ___ lost a tooth today.",
      ["children", "child", "women", "woman"], [FS, SEM, SEM]),
    pes("plural_irregular", 2, 1, 3, "The mouses hid in the kitchen.",
      ["mouses", "kitchen", "hid", "The"],
      "kitchen outscores mouses, so the scanner lands on a correct word"),
    pes("plural_irregular", 2, 1, 4, "Both foots splashed in the puddle.",
      ["foots", "splashed", "puddle", "Both"]),
    ptc("plural_irregular", 2, 1, 5, "Which is the plural of child?",
      ["children", "child", "teeth", "tooth"], [FS, SEM, SEM]),
    ptc("plural_irregular", 2, 1, 6, "Which is the plural of foot?",
      ["feet", "foot", "mice", "mouse"], [FS, SEM, SEM]),

    // ================= L2 phase 2: plural_f_to_ves =================
    psc("plural_f_to_ves", 2, 2, 1, "Autumn ___ blew across the path.",
      ["leaves", "leaf", "wolves", "wolf"], [FS, SEM, SEM],
      "blew gifts le to leaves and leaf alike"),
    psc("plural_f_to_ves", 2, 2, 2, "The ___ howled on the hill.",
      ["wolves", "wolf", "knives", "knife"], [FS, SEM, SEM]),
    psc("plural_f_to_ves", 2, 2, 3, "The chef laid five ___ by the plates.",
      ["knives", "knife", "shelves", "shelf"], [FS, SEM, SEM],
      "five and plates gift iv/es to knives, shelves and shelf together — three-way tie"),
    pes("plural_f_to_ves", 2, 2, 4, "The leafs drifted onto the doorstep.",
      ["leafs", "drifted", "doorstep", "onto"]),
    pes("plural_f_to_ves", 2, 2, 5, "Wolfs howled outside the window.",
      ["Wolfs", "howled", "outside", "window"]),
    ptc("plural_f_to_ves", 2, 2, 6, "Which is the plural of leaf?",
      ["leaves", "leaf", "knives", "knife"], [FS, SEM, SEM]),

    // ================= L2 phase 2: plural_in_sentence =================
    psc("plural_in_sentence", 2, 2, 1, "All the ___ were fast asleep.",
      ["puppies", "puppy", "geese", "goose"], [FS, SEM, SEM],
      "asleep gifts ee to the distractor geese only — scanner picks a distractor"),
    psc("plural_in_sentence", 2, 2, 2, "One ___ was left on the plate.",
      ["peach", "peaches", "loaves", "loaf"], [FS, SEM, SEM]),
    psc("plural_in_sentence", 2, 2, 3, "Two ___ of bread sat in the basket.",
      ["loaves", "loaf", "slices", "slice"], [FS, SEM, SEM],
      "basket, not oven — oven gifts ve to the key"),
    pes("plural_in_sentence", 2, 2, 4, "Three sheeps grazed in the meadow.",
      ["sheeps", "grazed", "meadow", "Three"],
      "grazed and meadow tie sheeps at six letters"),
    ptc("plural_in_sentence", 2, 2, 5, "Which fits: The ___ are ripe?",
      ["berries", "berry", "cherry", "peach"], [FS, FS, FS],
      "only one plural in the set — are demands it; ripe and the gift chunks to key and two rivals"),
    ptc("plural_in_sentence", 2, 2, 6, "Which fits: One ___ is barking?",
      ["dog", "dogs", "cats", "cat"], [FS, SEM, SEM]),

    // ================= Retention reserve (form R) =================
    pis("plural_add_s", 1, 1, 9, "cats", "Pick the word for the picture.",
      ["cats", "cat", "books", "book"], [FS, SEM, SEM]),
    psc("plural_add_s", 1, 1, 10, "Ten ___ bark at the gate.",
      ["dogs", "dog", "hats", "hat"], [FS, SEM, SEM],
      "gate gifts at to hats and hat — tied distractors, key clean"),
    psc("plural_add_es", 1, 2, 9, "Four ___ played near the barn.",
      ["foxes", "fox", "cups", "cup"], [FS, SEM, SEM],
      "four gifts fo to foxes and fox alike"),
    pis("plural_add_es", 1, 2, 10, "boxes", "Which word tells what you see?",
      ["boxes", "box", "cats", "cat"], [FS, SEM, SEM]),
    psc("plural_concept", 1, 1, 9, "Just one ___ purred by the fire.",
      ["cat", "cats", "frogs", "frog"], [FS, SEM, SEM]),
    pis("plural_concept", 1, 1, 10, "books", "More than one! Which word?",
      ["books", "book", "hens", "hen"], [FS, SEM, SEM]),
    psc("plural_y_to_ies", 2, 1, 7, "Both ___ told long stories.",
      ["ladies", "lady", "ponies", "pony"], [FS, SEM, SEM],
      "stories gifts ie to ladies and ponies alike"),
    pes("plural_y_to_ies", 2, 1, 8, "The ponys trotted around the field.",
      ["ponys", "trotted", "around", "field"]),
    psc("plural_irregular", 2, 1, 7, "Two white ___ nibbled the cheese.",
      ["mice", "mouse", "men", "man"], [FS, SEM, SEM],
      "cheese gifts se to the distractor mouse only — scanner picks a distractor"),
    ptc("plural_irregular", 2, 1, 8, "Which is the plural of tooth?",
      ["teeth", "tooth", "feet", "foot"], [FS, SEM, SEM]),
    psc("plural_f_to_ves", 2, 2, 7, "The baker sliced two ___ for lunch.",
      ["loaves", "loaf", "halves", "half"], [FS, SEM, SEM]),
    psc("plural_in_sentence", 2, 2, 7, "All four ___ chirped at dawn.",
      ["chicks", "chick", "geese", "goose"], [FS, SEM, SEM],
      "chirped gifts ch to chicks and chick alike")
  ].map(item => {
    if ((item.lvl === 1 && item.v >= 9) || (item.lvl === 2 && item.v >= 7)) item.retention = true;
    return item;
  })
};
