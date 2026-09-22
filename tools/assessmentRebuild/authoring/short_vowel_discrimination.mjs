// Short Vowel Discrimination — v3 authored bank (wave W5, paired with blends).
// Construct: HEAR/identify the medial short vowel — distinct from
// cvc_short_vowels (decode/build). 5 units, D-small, 6 variants per level.
// Formats:
//   LISTEN_CHOOSE_VOWEL — the target word is heard and NEVER printed: the
//     child identifies its middle vowel. Closed-set letters, scanner-null;
//     no picture-name uncertainty contaminates the listening construct.
//   PICTURE_TO_PRINT_MATCH — image → 4 printed words, vowel-varied sets that
//     never duplicate cvc_short_vowels' sets within this bank.
//   SHORT_VOWEL_IMAGE_GROUP_SELECT (L2) — 4 picture cards, pick the one whose
//     word has the target medial vowel. Keys avoid pi/so-chunk words (picture/
//     sound overlap); pi-carriers appear only as distractors, where a scanner
//     hit is a designed trap.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md §5.

import { makeImageResolver } from "../lib.mjs";

const fresh = item => ({ ...item, retention: false });
const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const sentenceCase = value => value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

const resolver = makeImageResolver(["cvc", "vowels", "rhyming", "digraphs", "blends", "long-vowels", "hfw"]);

// LISTEN_CHOOSE_VOWEL: heard word, vowel letter choices. Removing the picture
// prevents object-name uncertainty from contaminating a listening construct.
const lcv = (u, lvl, ph, v, word, vowels, note = "") => ({
  u, lvl, ph, v, fmt: "LISTEN_CHOOSE_VOWEL",
  prompt: "Which letter spells the middle vowel sound?",
  spoken: `${sentenceCase(word)}. Which letter spells the middle vowel sound?`,
  choices: vowels.map((l, i) => (i === 0 ? K(l) : P(l, "D-VOWEL"))),
  media: "audio-required",
  target: word,
  note: note || "the word is heard and never printed"
});

// Heard target → minimal-pair printed words.
const pp = (u, lvl, ph, v, word, words, rationales = {}, note = "") => ({
  u, lvl, ph, v, fmt: "LISTEN_FIND_WORD", questionType: "listen_and_find_word",
  prompt: "Which printed word matches the recording?",
  spoken: `${sentenceCase(word)}. Which printed word matches the recording?`,
  choices: words.map(w => (w === word ? K(w) : P(w, rationales[w] || "D-VOWEL"))),
  media: "audio-required",
  target: word,
  audioRole: "target_word",
  evidenceModality: "audio+print",
  note
});

// SHORT_VOWEL_IMAGE_GROUP_SELECT: 4 picture cards, one has the target vowel.
// Prompt avoids "in the middle" — the word "in" would flag any in-carrying
// card (fin, pin) for a letter matcher. The spoken line keeps the full phrase.
const gs = (u, lvl, ph, v, vowelName, cards, keyWord, note = "") => ({
  u, lvl, ph, v, fmt: "SHORT_VOWEL_IMAGE_GROUP_SELECT",
  prompt: `Which pictured word has the short ${vowelName} sound?`,
  spoken: `Which pictured word has the short ${vowelName} sound in the middle?`,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, "D-VOWEL"))),
  media: "image-required",
  evidenceModality: "audio+image",
  constructClaim: "short_vowel_picture_word_discrimination",
  hideWrittenLabels: true,
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
    pp("short_a", 1, 1, 5, "bad", ["bad", "bed", "bud", "bag"],
      { bed: "D-VOWEL", bud: "D-VOWEL", bag: "D-RIME-NEAR" },
      "bed and bud preserve the vowel contrast; bag checks the heard final consonant without the excluded word bid"),
    pp("short_a", 1, 1, 6, "ram", ["ram", "rim", "ran", "run"],
      { rim: "D-VOWEL", ran: "D-VISUAL-NEIGHBOR", run: "D-VOWEL" }),
    lcv("short_a", 2, 1, 1, "hand", ["a", "e", "o", "u"]),
    lcv("short_a", 2, 1, 2, "flag", ["a", "u", "o", "e"]),
    pp("short_a", 2, 1, 3, "band", ["band", "bend", "bind", "bond"],
      { bend: "D-VOWEL", bind: "D-VOWEL", bond: "D-VOWEL" }),
    pp("short_a", 2, 1, 4, "flap", ["flap", "flip", "flop", "flag"],
      { flip: "D-VOWEL", flop: "D-VOWEL", flag: "D-VISUAL-NEIGHBOR" },
      "flip and flop differ only in the medial vowel; flag checks the ending"),
    gs("short_a", 2, 1, 5, "a", ["bag", "bed", "pig", "dog"], "bag"),
    gs("short_a", 2, 1, 6, "a", ["ham", "net", "pin", "mop"], "ham"),

    // ================= short_e =================
    lcv("short_e", 1, 1, 1, "web", ["e", "a", "i", "o"]),
    lcv("short_e", 1, 1, 2, "ten", ["e", "i", "a", "u"]),
    lcv("short_e", 1, 1, 3, "leg", ["e", "a", "u", "i"]),
    pp("short_e", 1, 1, 4, "ten", ["ten", "tan", "tin", "ton"]),
    pp("short_e", 1, 1, 5, "bell", ["bell", "ball", "bill", "bull"]),
    pp("short_e", 1, 1, 6, "leg", ["leg", "lag", "log", "lug"]),
    lcv("short_e", 2, 1, 1, "nest", ["e", "i", "a", "o"]),
    lcv("short_e", 2, 1, 2, "shell", ["e", "a", "o", "u"]),
    pp("short_e", 2, 1, 3, "best", ["best", "bust", "beast", "belt"],
      { bust: "D-VOWEL", beast: "D-VOWEL", belt: "D-VISUAL-NEIGHBOR" },
      "the shared onset requires attending to the vowel, including the long-e contrast"),
    pp("short_e", 2, 1, 4, "belt", ["belt", "bolt", "built", "bell"],
      { bolt: "D-VOWEL", built: "D-VOWEL", bell: "D-DEVELOPMENTAL" },
      "bell drops the final t — cluster reduction"),
    gs("short_e", 2, 1, 5, "e", ["bed", "bag", "pig", "sun"], "bed"),
    gs("short_e", 2, 1, 6, "e", ["web", "cap", "tub", "dog"], "web"),

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
    pp("short_i", 2, 1, 3, "lift", ["lift", "left", "loft", "list"],
      { left: "D-VOWEL", loft: "D-VOWEL", list: "D-VISUAL-NEIGHBOR" }),
    pp("short_i", 2, 1, 4, "click", ["click", "clock", "cluck", "cliff"],
      { clock: "D-VOWEL", cluck: "D-VOWEL", cliff: "D-VISUAL-NEIGHBOR" },
      "all choices share the complete onset; clock and cluck isolate the vowel"),
    gs("short_i", 2, 1, 5, "i", ["brick", "fan", "log", "cup"], "brick",
      "a concrete brick target replaces the less distinctive fin card"),
    gs("short_i", 2, 1, 6, "i", ["pig", "dog", "bag", "sun"], "pig"),

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
    pp("short_u", 2, 2, 3, "clump", ["clump", "clamp", "clip", "clap"],
      { clamp: "D-VOWEL", clip: "D-VOWEL", clap: "D-VOWEL" },
      "clamp keeps both consonant clusters, requiring the medial-vowel contrast"),
    pp("short_u", 2, 2, 4, "truck", ["truck", "track", "trick", "trunk"],
      { track: "D-VOWEL", trick: "D-VOWEL", trunk: "D-VISUAL-NEIGHBOR" }),
    gs("short_u", 2, 2, 5, "u", ["bug", "bag", "pot", "pen"], "bug"),
    gs("short_u", 2, 2, 6, "u", ["mug", "mat", "pig", "hen"], "mug"),

    // Unseen listening stimuli and real minimal-pair contrasts for a fresh retry.
    fresh(lcv("short_a", 1, 1, 9, "pan", ["a", "e", "i", "u"])),
    fresh(pp("short_a", 1, 2, 10, "bag", ["bag", "beg", "big", "bog"])),
    fresh(lcv("short_e", 1, 1, 9, "pen", ["e", "i", "a", "u"])),
    fresh(pp("short_e", 1, 2, 10, "net", ["net", "nut", "not", "nap"])),
    fresh(lcv("short_i", 1, 1, 9, "sip", ["i", "e", "a", "o"])),
    fresh(pp("short_i", 1, 2, 10, "rim", ["rim", "ram", "room", "rip"], { rip: "D-RIME-NEAR" })),
    fresh(lcv("short_o", 1, 1, 9, "cot", ["o", "a", "u", "e"])),
    fresh(pp("short_o", 1, 2, 10, "mop", ["mop", "map", "mob", "mug"], { mob: "D-RIME-NEAR" })),
    fresh(lcv("short_u", 1, 1, 9, "fun", ["u", "o", "a", "i"])),
    fresh(pp("short_u", 1, 2, 10, "hut", ["hut", "hat", "hot", "hit"])),
    fresh(lcv("short_a", 2, 1, 9, "trap", ["a", "e", "o", "u"])),
    fresh(pp("short_a", 2, 2, 10, "clap", ["clap", "clip", "clop", "clam"], { clam: "D-RIME-NEAR" })),
    fresh(lcv("short_e", 2, 1, 9, "desk", ["e", "a", "i", "o"])),
    fresh(pp("short_e", 2, 2, 10, "step", ["step", "stop", "stamp", "stem"], { stem: "D-RIME-NEAR" })),
    fresh(lcv("short_i", 2, 1, 9, "swim", ["i", "e", "a", "u"])),
    fresh(pp("short_i", 2, 2, 10, "slip", ["slip", "slap", "slop", "slid"], { slid: "D-RIME-NEAR" })),
    fresh(lcv("short_o", 2, 1, 9, "spot", ["o", "a", "u", "i"])),
    fresh(pp("short_o", 2, 2, 10, "stomp", ["stomp", "stamp", "stump", "stop"], { stop: "D-DEVELOPMENTAL" })),
    fresh(lcv("short_u", 2, 1, 9, "plum", ["u", "a", "o", "e"])),
    fresh(pp("short_u", 2, 2, 10, "stump", ["stump", "stamp", "stomp", "stub"], { stub: "D-DEVELOPMENTAL" })),

    // Six new recordings spread the sixteen reserves evenly across the two levels.
    { ...lcv("short_a", 1, 1, 20, "cap", ["a", "e", "i", "u"]), retention: true },
    { ...lcv("short_a", 2, 1, 20, "lamp", ["a", "e", "o", "u"]), retention: true,
      note: "new CVCC listening target; isolate the medial vowel despite the final mp cluster" },
    { ...lcv("short_e", 2, 1, 20, "vest", ["e", "i", "a", "o"]), retention: true,
      note: "new CVCC listening target; e/i pressure remains independent of recognizing an object" },
    { ...lcv("short_i", 2, 1, 20, "ship", ["i", "e", "a", "u"]), retention: true,
      note: "new listening target with a single sh onset phoneme and the short-i medial sound" },
    { ...lcv("short_o", 2, 2, 20, "pond", ["o", "u", "a", "i"]), retention: true,
      note: "new CVCC listening target; contrast short o/u without showing its written vowel" },
    { ...lcv("short_u", 2, 2, 20, "plug", ["u", "a", "o", "e"]), retention: true,
      note: "new CCVC listening target; retain both onset sounds while identifying its vowel" },

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
    if (item.v >= 7 && item.retention !== false) item.retention = true;
    if (!item.retention) item.ph = item.v <= 3 || item.v === 9 ? 1 : 2;
    return item;
  })
};
