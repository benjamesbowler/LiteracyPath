// Short Vowel Discrimination — v3 authored bank (wave W5, paired with blends).
// Construct: HEAR/identify the medial short vowel — distinct from
// cvc_short_vowels (decode/build). 5 units, D-small, 6 variants per level.
// Formats:
//   LISTEN_CHOOSE_VOWEL — image only, the word is NEVER printed: the child
//     names the picture and identifies the middle vowel. Closed-set letters,
//     scanner-null. Spoken line carries the word for the audio tier.
//   PICTURE_TO_PRINT_MATCH — image → 4 printed words, vowel-varied sets that
//     never duplicate cvc_short_vowels' sets within this bank.
//   SHORT_VOWEL_IMAGE_GROUP_SELECT (L2) — 4 picture cards, pick the one whose
//     word has the target medial vowel. Keys avoid pi/so-chunk words (picture/
//     sound overlap); pi-carriers appear only as distractors, where a scanner
//     hit is a designed trap.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md §5.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["cvc", "vowels", "rhyming", "digraphs", "blends", "long-vowels", "hfw"]);

// LISTEN_CHOOSE_VOWEL: image only, vowel letter choices.
const lcv = (u, lvl, ph, v, word, vowels, note = "") => ({
  u, lvl, ph, v, fmt: "LISTEN_CHOOSE_VOWEL",
  prompt: "Which vowel do you hear in the middle?",
  spoken: `${word}. Which vowel do you hear in the middle of ${word}?`,
  choices: vowels.map((l, i) => (i === 0 ? K(l) : P(l, "D-VOWEL"))),
  media: "image-required",
  img: word,
  target: word,
  note: note || "the word is never printed — the picture carries it"
});

// PICTURE_TO_PRINT_MATCH: image → minimal-pair printed words.
const pp = (u, lvl, ph, v, word, words, rationales = {}, note = "") => ({
  u, lvl, ph, v, fmt: "PICTURE_TO_PRINT_MATCH",
  prompt: "Which word goes with the picture?",
  spoken: "Which word goes with the picture?",
  choices: words.map(w => (w === word ? K(w) : P(w, rationales[w] || "D-VOWEL"))),
  media: "image-required",
  img: word,
  target: word,
  note
});

// SHORT_VOWEL_IMAGE_GROUP_SELECT: 4 picture cards, one has the target vowel.
// Prompt avoids "in the middle" — the word "in" would flag any in-carrying
// card (fin, pin) for a letter matcher. The spoken line keeps the full phrase.
const gs = (u, lvl, ph, v, vowelName, cards, keyWord, note = "") => ({
  u, lvl, ph, v, fmt: "SHORT_VOWEL_IMAGE_GROUP_SELECT",
  prompt: `Which picture has the short ${vowelName} sound?`,
  spoken: `Which picture's word has the short ${vowelName} sound in the middle?`,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, "D-VOWEL"))),
  media: "image-required",
  note
});

export default {
  skillId: "short_vowel_discrimination",
  skillName: "Short Vowel Discrimination",
  imageResolver: resolver,
  items: [
    // ================= short_a =================
    lcv("short_a", 1, 1, 1, "bag", ["a", "e", "u", "o"]),
    lcv("short_a", 1, 1, 2, "ram", ["a", "u", "e", "i"]),
    lcv("short_a", 1, 1, 3, "tap", ["a", "o", "i", "e"]),
    pp("short_a", 1, 1, 4, "tap", ["tap", "tip", "top", "ten"]),
    pp("short_a", 1, 1, 5, "bad", ["bad", "bed", "bud", "bid"]),
    pp("short_a", 1, 1, 6, "ram", ["ram", "rim", "ran", "run"],
      { rim: "D-VOWEL", ran: "D-VISUAL-NEIGHBOR", run: "D-VOWEL" }),
    lcv("short_a", 2, 1, 1, "hand", ["a", "e", "o", "u"]),
    lcv("short_a", 2, 1, 2, "flag", ["a", "u", "o", "e"]),
    pp("short_a", 2, 1, 3, "hand", ["hand", "band", "bend", "sand"],
      { band: "D-VISUAL-NEIGHBOR", bend: "D-VOWEL", sand: "D-VISUAL-NEIGHBOR" }),
    pp("short_a", 2, 1, 4, "flag", ["flag", "flip", "flop", "flap"],
      { flip: "D-VOWEL", flop: "D-VOWEL", flap: "D-VISUAL-NEIGHBOR" },
      "flag/flap differ by one letter; flip/flop swap the vowel"),
    gs("short_a", 2, 1, 5, "a", ["bag", "bed", "pig", "dog"], "bag"),
    gs("short_a", 2, 1, 6, "a", ["ram", "net", "pin", "mop"], "ram"),

    // ================= short_e =================
    lcv("short_e", 1, 1, 1, "web", ["e", "a", "i", "o"]),
    lcv("short_e", 1, 1, 2, "ten", ["e", "i", "a", "u"]),
    lcv("short_e", 1, 1, 3, "leg", ["e", "a", "u", "i"]),
    pp("short_e", 1, 1, 4, "ten", ["ten", "tan", "tin", "ton"]),
    pp("short_e", 1, 1, 5, "bell", ["bell", "ball", "bill", "bull"]),
    pp("short_e", 1, 1, 6, "leg", ["leg", "lag", "log", "lug"]),
    lcv("short_e", 2, 1, 1, "nest", ["e", "i", "a", "o"]),
    lcv("short_e", 2, 1, 2, "shell", ["e", "a", "o", "u"]),
    pp("short_e", 2, 1, 3, "nest", ["nest", "vest", "mast", "mist"],
      { vest: "D-RIME-NEAR", mast: "D-VOWEL", mist: "D-VOWEL" },
      "vest rhymes with the key and ties its es/goes overlap"),
    pp("short_e", 2, 1, 4, "belt", ["belt", "bolt", "built", "bell"],
      { bolt: "D-VOWEL", built: "D-VOWEL", bell: "D-DEVELOPMENTAL" },
      "bell drops the final t — cluster reduction"),
    gs("short_e", 2, 1, 5, "e", ["bed", "bag", "pig", "sun"], "bed"),
    gs("short_e", 2, 1, 6, "e", ["ten", "tap", "tub", "dog"], "ten"),

    // ================= short_i =================
    lcv("short_i", 1, 1, 1, "bin", ["i", "e", "a", "u"]),
    lcv("short_i", 1, 1, 2, "zip", ["i", "a", "e", "o"]),
    lcv("short_i", 1, 1, 3, "hit", ["i", "e", "u", "a"]),
    pp("short_i", 1, 1, 4, "bin", ["bin", "ban", "bun", "band"],
      { ban: "D-VOWEL", bun: "D-VOWEL", band: "D-VISUAL-NEIGHBOR" }),
    pp("short_i", 1, 1, 5, "hit", ["hit", "hat", "hot", "hid"],
      { hat: "D-VOWEL", hot: "D-VOWEL", hid: "D-VISUAL-NEIGHBOR" },
      "hid ties the hi/which overlap"),
    pp("short_i", 1, 1, 6, "zip", ["zip", "zap", "lip", "lap"],
      { zap: "D-VOWEL", lip: "D-VISUAL-NEIGHBOR", lap: "D-VOWEL" }),
    lcv("short_i", 2, 1, 1, "brick", ["i", "e", "a", "o"]),
    lcv("short_i", 2, 1, 2, "gift", ["i", "e", "u", "a"]),
    pp("short_i", 2, 1, 3, "gift", ["gift", "lift", "left", "loft"],
      { lift: "D-VISUAL-NEIGHBOR", left: "D-VOWEL", loft: "D-VOWEL" }),
    pp("short_i", 2, 1, 4, "brick", ["brick", "black", "block", "click"],
      { black: "D-VOWEL", block: "D-VOWEL", click: "D-VISUAL-NEIGHBOR" },
      "click ties the ic/which overlap"),
    gs("short_i", 2, 1, 5, "i", ["fin", "fan", "log", "cup"], "fin"),
    gs("short_i", 2, 1, 6, "i", ["dig", "dog", "bag", "sun"], "dig"),

    // ================= short_o =================
    lcv("short_o", 1, 2, 1, "fox", ["o", "a", "u", "e"]),
    lcv("short_o", 1, 2, 2, "mop", ["o", "u", "a", "i"]),
    lcv("short_o", 1, 2, 3, "dot", ["o", "a", "e", "u"]),
    pp("short_o", 1, 2, 4, "dog", ["dog", "dig", "dug", "bag"],
      { dig: "D-VOWEL", dug: "D-VOWEL", bag: "D-VISUAL-NEIGHBOR" }),
    pp("short_o", 1, 2, 5, "top", ["top", "tap", "tip", "tub"],
      { tap: "D-VOWEL", tip: "D-VOWEL", tub: "D-VISUAL-NEIGHBOR" }),
    pp("short_o", 1, 2, 6, "pot", ["pot", "pat", "pit", "pet"]),
    lcv("short_o", 2, 2, 1, "sock", ["o", "a", "u", "i"]),
    lcv("short_o", 2, 2, 2, "clock", ["o", "u", "a", "e"]),
    pp("short_o", 2, 2, 3, "clock", ["clock", "click", "cluck", "block"],
      { click: "D-VOWEL", cluck: "D-VOWEL", block: "D-VISUAL-NEIGHBOR" }),
    pp("short_o", 2, 2, 4, "dock", ["dock", "duck", "deck", "desk"],
      { duck: "D-VOWEL", deck: "D-VOWEL", desk: "D-VISUAL-NEIGHBOR" }),
    gs("short_o", 2, 2, 5, "o", ["mop", "map", "net", "bug"], "mop"),
    gs("short_o", 2, 2, 6, "o", ["pot", "bat", "bed", "bug"], "pot"),

    // ================= short_u =================
    lcv("short_u", 1, 2, 1, "jug", ["u", "a", "o", "i"]),
    lcv("short_u", 1, 2, 2, "cup", ["u", "o", "a", "e"]),
    lcv("short_u", 1, 2, 3, "mud", ["u", "a", "e", "o"]),
    pp("short_u", 1, 2, 4, "jug", ["jug", "jog", "jig", "jet"],
      { jog: "D-VOWEL", jig: "D-VOWEL", jet: "D-VOWEL" }),
    pp("short_u", 1, 2, 5, "cup", ["cup", "cap", "cape", "cub"],
      { cap: "D-VOWEL", cape: "D-PATTERN-TRAP", cub: "D-VISUAL-NEIGHBOR" },
      "cape is the long-a silent-e decoy"),
    pp("short_u", 1, 2, 6, "rug", ["rug", "rag", "rig", "ram"],
      { rag: "D-VOWEL", rig: "D-VOWEL", ram: "D-VISUAL-NEIGHBOR" }),
    lcv("short_u", 2, 2, 1, "drum", ["u", "o", "a", "i"]),
    lcv("short_u", 2, 2, 2, "brush", ["u", "a", "o", "e"]),
    pp("short_u", 2, 2, 3, "plug", ["plug", "plan", "plot", "plum"],
      { plan: "D-VOWEL", plot: "D-VOWEL", plum: "D-VISUAL-NEIGHBOR" }),
    pp("short_u", 2, 2, 4, "truck", ["truck", "track", "trick", "trunk"],
      { track: "D-VOWEL", trick: "D-VOWEL", trunk: "D-VISUAL-NEIGHBOR" }),
    gs("short_u", 2, 2, 5, "u", ["bug", "bag", "dot", "pen"], "bug"),
    gs("short_u", 2, 2, 6, "u", ["mug", "mat", "pig", "hen"], "mug"),

    // ================= Retention reserve (form R) =================
    lcv("short_e", 1, 1, 7, "hen", ["e", "i", "o", "a"]),
    lcv("short_u", 1, 2, 7, "hut", ["u", "a", "o", "e"]),
    lcv("short_o", 1, 2, 7, "hop", ["o", "u", "e", "i"]),
    lcv("short_i", 1, 1, 7, "sit", ["i", "u", "e", "o"]),
    lcv("short_a", 2, 1, 7, "crab", ["a", "u", "e", "o"]),
    pp("short_e", 1, 1, 8, "vet", ["vet", "vat", "vest", "net"],
      { vat: "D-VOWEL", vest: "D-PATTERN-TRAP", net: "D-VISUAL-NEIGHBOR" }),
    pp("short_o", 1, 2, 8, "hop", ["hop", "hip", "hat", "hut"],
      { hip: "D-VOWEL", hat: "D-VOWEL", hut: "D-VOWEL" }),
    pp("short_u", 1, 2, 8, "dug", ["dug", "dog", "dig", "den"],
      { dog: "D-VOWEL", dig: "D-VOWEL", den: "D-VOWEL" }),
    gs("short_e", 2, 1, 7, "e", ["hen", "hat", "log", "bug"], "hen"),
    gs("short_o", 2, 2, 7, "o", ["log", "jam", "pin", "cup"], "log")
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
