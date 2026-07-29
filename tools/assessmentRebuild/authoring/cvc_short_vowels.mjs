// CVC Short Vowels — v3 authored bank (wave W4, paired with rhyming).
// Construct: decode/build CVC (L1) and CCVC/CVCC (L2) short-vowel words.
// 5 units (short_a/e/i/o/u), D-small, 6 variants per unit per level.
// Formats:
//   MISSING_VOWEL_CVC — image + blanked word (c_t) → vowel letters. Wrong
//     vowels may complete other real words (cat/cot/cut); the image + spoken
//     anchor pins the target, so those are honest traps, not false keys.
//     Closed-set format: option sets repeat by design; scanner-null (letters).
//   PICTURE_TO_PRINT_MATCH — image → 4 printed minimal-pair words that share
//     an onset (pan/pin/pen/pot), so option letter-overlap always ties.
//   SHORT_VOWEL_WORD (L1) — "Which word has the short a sound?" with a
//     long-vowel same-letter decoy (cake in the short-a item): the decoy is
//     the real discrimination AND the tie for any letter matcher.
//   PUT_SOUNDS_IN_ORDER (L2) — image + sound tiles (sh/ck are ONE tile:
//     phoneme-honest). No choices to scan; guessing is 1/n! and simulated as
//     such by the gate.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md §4.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["cvc", "vowels", "rhyming", "digraphs", "blends", "long-vowels", "hfw"]);

// MISSING_VOWEL_CVC: image-pinned blank, vowel letter choices.
const mv = (u, lvl, ph, v, word, blanked, vowels, note = "") => ({
  u, lvl, ph, v, fmt: "MISSING_VOWEL_CVC",
  prompt: `Complete: ${blanked}`,
  spoken: `${word}. Which vowel finishes the word ${word}?`,
  choices: vowels.map((l, i) => (i === 0 ? K(l) : P(l, "D-VOWEL"))),
  media: "image-required",
  img: word,
  target: word,
  note
});

// PICTURE_TO_PRINT_MATCH: image target, minimal-pair printed words.
const pp = (u, lvl, ph, v, word, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PICTURE_TO_PRINT_MATCH",
  prompt: "Which word goes with the picture?",
  spoken: `Which word goes with the picture?`,
  choices: words.map(w => (w === word ? K(w) : P(w, rationales[w] || "D-VOWEL"))),
  media: "image-required",
  img: word,
  target: word,
  note
});

// SHORT_VOWEL_WORD: find the word with the target short vowel.
const svw = (u, lvl, ph, v, vowelName, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "SHORT_VOWEL_WORD",
  prompt: `Which word has the short ${vowelName} sound?`,
  spoken: `Which word has the short ${vowelName} sound? Listen: ${vowelName}.`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  note
});

// PUT_SOUNDS_IN_ORDER: image + sound tiles, child arranges.
const pso = (u, lvl, ph, v, word, tiles, note = "") => ({
  u, lvl, ph, v, fmt: "PUT_SOUNDS_IN_ORDER",
  prompt: "Put the sounds in order to build the picture's word.",
  spoken: `${word}. Put the sounds in order to build ${word}.`,
  choices: [K(word)],
  soundTiles: tiles,
  media: "image-required",
  img: word,
  target: word,
  note: note || "tiles are phonemes, not letters — sh/ck ride as one tile"
});

export default {
  skillId: "cvc_short_vowels",
  skillName: "CVC & Short Vowels",
  imageResolver: resolver,
  items: [
    // ================= short_a =================
    mv("short_a", 1, 1, 1, "cat", "c_t", ["a", "o", "u", "e"],
      "c-o-t and c-u-t are real words — the cat image pins the target"),
    mv("short_a", 1, 1, 2, "hat", "h_t", ["a", "o", "u", "i"]),
    pp("short_a", 1, 1, 3, "pan", ["pan", "pin", "pen", "pot"], {}),
    pp("short_a", 1, 1, 4, "bat", ["bat", "bit", "bet", "but"], {}),
    svw("short_a", 1, 1, 5, "a", ["cat", "cake", "pen", "pig"], "cat",
      { cake: "D-PATTERN-TRAP", pen: "D-VOWEL", pig: "D-VOWEL" },
      "cake has the letter a but the long sound — the honest discrimination and the letter-scanner tie"),
    svw("short_a", 1, 1, 6, "a", ["pan", "rain", "nut", "dog"], "pan",
      { rain: "D-PATTERN-TRAP", nut: "D-VOWEL", dog: "D-VOWEL" }),
    mv("short_a", 2, 1, 1, "flag", "fl_g", ["a", "o", "u", "e"]),
    mv("short_a", 2, 1, 2, "hand", "h_nd", ["a", "e", "o", "u"]),
    pp("short_a", 2, 1, 3, "crab", ["crab", "crib", "cub", "cab"],
      { crib: "D-VOWEL", cub: "D-VOWEL", cab: "D-DEVELOPMENTAL" },
      "cab drops the r — the cluster-reduction error"),
    pp("short_a", 2, 1, 4, "jam", ["jam", "gem", "jab", "yam"],
      { gem: "D-VOWEL", jab: "D-RIME-NEAR", yam: "D-ONSET" }),
    pso("short_a", 2, 1, 5, "flag", ["f", "l", "a", "g"]),
    pso("short_a", 2, 1, 6, "crab", ["c", "r", "a", "b"]),

    // ================= short_e =================
    mv("short_e", 1, 1, 1, "bed", "b_d", ["e", "a", "u", "i"],
      "b-a-d and b-u-d are real words — the bed image pins the target"),
    mv("short_e", 1, 1, 2, "net", "n_t", ["e", "u", "o", "i"]),
    pp("short_e", 1, 1, 3, "pen", ["pen", "pan", "pin", "pat"], {}),
    pp("short_e", 1, 1, 4, "net", ["net", "nut", "not", "nap"], {}),
    svw("short_e", 1, 1, 5, "e", ["bed", "bee", "bag", "bug"], "bed",
      { bee: "D-PATTERN-TRAP", bag: "D-VOWEL", bug: "D-VOWEL" }),
    svw("short_e", 1, 1, 6, "e", ["ten", "tree", "tap", "top"], "ten",
      { tree: "D-PATTERN-TRAP", tap: "D-VOWEL", top: "D-VOWEL" }),
    mv("short_e", 2, 1, 1, "nest", "n_st", ["e", "a", "u", "i"]),
    mv("short_e", 2, 1, 2, "desk", "d_sk", ["e", "i", "a", "o"]),
    pp("short_e", 2, 1, 3, "tent", ["tent", "tint", "hunt", "ten"],
      { tint: "D-VOWEL", hunt: "D-VOWEL", ten: "D-DEVELOPMENTAL" },
      "ten drops the final t — the cluster-reduction error"),
    pp("short_e", 2, 1, 4, "shell", ["shell", "shall", "hill", "sell"],
      { shall: "D-VOWEL", hill: "D-VOWEL", sell: "D-DEVELOPMENTAL" }),
    pso("short_e", 2, 1, 5, "nest", ["n", "e", "s", "t"]),
    pso("short_e", 2, 1, 6, "vest", ["v", "e", "s", "t"]),

    // ================= short_i =================
    mv("short_i", 1, 1, 1, "pig", "p_g", ["i", "e", "a", "u"]),
    mv("short_i", 1, 1, 2, "pin", "p_n", ["i", "a", "e", "o"],
      "p-a-n and p-e-n are real words — the pin image pins the target"),
    pp("short_i", 1, 1, 3, "pig", ["pig", "peg", "pug", "pit"],
      { peg: "D-VOWEL", pug: "D-VOWEL", pit: "D-RIME-NEAR" },
      "pit ties the pi/picture overlap so the key cannot be scanned out"),
    pp("short_i", 1, 1, 4, "fin", ["fin", "fan", "fun", "ten"],
      { fan: "D-VOWEL", fun: "D-VOWEL", ten: "D-ONSET" }),
    svw("short_i", 1, 1, 5, "i", ["pin", "pine", "pen", "pot"], "pin",
      { pine: "D-PATTERN-TRAP", pen: "D-VOWEL", pot: "D-VOWEL" },
      "pine is one silent e away — the short/long discrimination"),
    svw("short_i", 1, 1, 6, "i", ["big", "bike", "bag", "bed"], "big",
      { bike: "D-PATTERN-TRAP", bag: "D-VOWEL", bed: "D-VOWEL" }),
    mv("short_i", 2, 1, 1, "brick", "br_ck", ["i", "a", "o", "u"]),
    mv("short_i", 2, 1, 2, "gift", "g_ft", ["i", "a", "e", "o"]),
    pp("short_i", 2, 1, 3, "swim", ["swim", "swam", "swum", "win"],
      { swam: "D-VOWEL", swum: "D-VOWEL", win: "D-RIME-NEAR" },
      "swim/swam/swum — the real verb family; win ties the wi/with overlap"),
    pp("short_i", 2, 1, 4, "fish", ["fish", "fresh", "flash", "wish"],
      { fresh: "D-VOWEL", flash: "D-VOWEL", wish: "D-ONSET" }),
    pso("short_i", 2, 1, 5, "swim", ["s", "w", "i", "m"]),
    pso("short_i", 2, 1, 6, "fish", ["f", "i", "sh"]),

    // ================= short_o =================
    mv("short_o", 1, 2, 1, "dog", "d_g", ["o", "u", "i", "a"],
      "d-u-g and d-i-g are real words — the dog image pins the target"),
    mv("short_o", 1, 2, 2, "pot", "p_t", ["o", "a", "i", "e"]),
    pp("short_o", 1, 2, 3, "pot", ["pot", "pat", "pit", "pet"], {}),
    pp("short_o", 1, 2, 4, "log", ["log", "leg", "lag", "lug"], {}),
    svw("short_o", 1, 2, 5, "o", ["dog", "bone", "dig", "dug"], "dog",
      { bone: "D-PATTERN-TRAP", dig: "D-VOWEL", dug: "D-VOWEL" }),
    svw("short_o", 1, 2, 6, "o", ["pot", "rope", "pat", "pet"], "pot",
      { rope: "D-PATTERN-TRAP", pat: "D-VOWEL", pet: "D-VOWEL" }),
    mv("short_o", 2, 2, 1, "sock", "s_ck", ["o", "a", "i", "u"]),
    mv("short_o", 2, 2, 2, "clock", "cl_ck", ["o", "a", "u", "e"]),
    pp("short_o", 2, 2, 3, "sock", ["sock", "sack", "sick", "snack"],
      { sack: "D-VOWEL", sick: "D-VOWEL", snack: "D-PATTERN-TRAP" }),
    pp("short_o", 2, 2, 4, "frog", ["frog", "flag", "fog", "frown"],
      { flag: "D-VOWEL", fog: "D-DEVELOPMENTAL", frown: "D-PATTERN-TRAP" },
      "fog drops the r — the cluster-reduction error"),
    pso("short_o", 2, 2, 5, "frog", ["f", "r", "o", "g"]),
    pso("short_o", 2, 2, 6, "sock", ["s", "o", "ck"]),

    // ================= short_u =================
    mv("short_u", 1, 2, 1, "bug", "b_g", ["u", "a", "i", "o"],
      "b-a-g and b-i-g are real words — the bug image pins the target"),
    mv("short_u", 1, 2, 2, "sun", "s_n", ["u", "o", "i", "a"]),
    pp("short_u", 1, 2, 3, "bug", ["bug", "bag", "big", "bog"], {}),
    pp("short_u", 1, 2, 4, "nut", ["nut", "net", "not", "mat"],
      { net: "D-VOWEL", not: "D-VOWEL", mat: "D-RIME-NEAR" }),
    svw("short_u", 1, 2, 5, "u", ["bug", "cube", "bag", "big"], "bug",
      { cube: "D-PATTERN-TRAP", bag: "D-VOWEL", big: "D-VOWEL" }),
    svw("short_u", 1, 2, 6, "u", ["mud", "moon", "mad", "mid"], "mud",
      { moon: "D-PATTERN-TRAP", mad: "D-VOWEL", mid: "D-VOWEL" }),
    mv("short_u", 2, 2, 1, "drum", "dr_m", ["u", "a", "i", "o"]),
    mv("short_u", 2, 2, 2, "truck", "tr_ck", ["u", "a", "i", "e"]),
    pp("short_u", 2, 2, 3, "duck", ["duck", "deck", "dock", "desk"],
      { deck: "D-VOWEL", dock: "D-VOWEL", desk: "D-PATTERN-TRAP" },
      "duck/deck/dock — a true vowel minimal triple"),
    pp("short_u", 2, 2, 4, "brush", ["brush", "fresh", "bush", "crush"],
      { fresh: "D-VOWEL", bush: "D-DEVELOPMENTAL", crush: "D-ONSET" },
      "bush drops the r and shifts the vowel sound despite the u"),
    pso("short_u", 2, 2, 5, "drum", ["d", "r", "u", "m"]),
    pso("short_u", 2, 2, 6, "brush", ["b", "r", "u", "sh"]),

    // ================= Retention reserve (form R) =================
    mv("short_u", 1, 2, 7, "hut", "h_t", ["u", "a", "o", "e"],
      "h-a-t and h-o-t are real words — the hut image pins the target"),
    mv("short_u", 1, 2, 8, "mug", "m_g", ["u", "a", "i", "o"]),
    pp("short_a", 1, 1, 7, "hat", ["hat", "hot", "hut", "hit"], {},
      "the full hat/hot/hut/hit vowel square"),
    pp("short_i", 1, 1, 7, "pin", ["pin", "pan", "pen", "pit"], {}),
    svw("short_a", 1, 1, 8, "a", ["jam", "game", "jet", "jug"], "jam",
      { game: "D-PATTERN-TRAP", jet: "D-VOWEL", jug: "D-VOWEL" }),
    svw("short_o", 1, 2, 7, "o", ["hot", "home", "hat", "hut"], "hot",
      { home: "D-PATTERN-TRAP", hat: "D-VOWEL", hut: "D-VOWEL" }),
    mv("short_e", 2, 1, 7, "sled", "sl_d", ["e", "a", "i", "o"]),
    pso("short_u", 2, 2, 7, "plug", ["p", "l", "u", "g"]),
    mv("short_i", 1, 1, 8, "fin", "f_n", ["i", "a", "u", "e"]),
    pp("short_u", 2, 2, 8, "cut", ["cut", "cot", "cat", "kit"], {})
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
