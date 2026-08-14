// R-Controlled Vowels — v3 authored bank (wave W6, paired with vowel_teams).
// The audit's best advanced bank — prune + harden, not rebuild. 5 units
// (ar or er ir ur), both levels. L1: recognition in familiar words.
// L2: the three-way /ɜr/ spelling choice (er/ir/ur) with mandatory sibling
// spellings ×2 per item, plus ar/or contrast.
// Formats:
//   R_CONTROLLED_PATTERN — blank hides the pattern; image or unique-real
//     completion pins the word (stir/form/short are real, so their frames
//     carry images). Closed-set.
//   PICTURE_AUDIO_TO_PATTERN (L1) — picture → pattern choice, word spoken
//     not printed.
//   CPS (L2) — cross-family select; /ɜr/ items use only ar/or (or plain
//     short-vowel) distractors, since er=ir=ur share one sound and a sibling
//     spelling would be a second key.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md §14.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["long-vowels", "blends", "digraphs", "hfw", "cvc", "rhyming"]);

const SIB = new Set(["er", "ir", "ur"]);

const rcp = (u, lvl, ph, v, word, blanked, patterns, note = "") => ({
  u, lvl, ph, v, fmt: "R_CONTROLLED_PATTERN",
  prompt: `Finish: ${blanked}`,
  spoken: `${word}. Which letters finish the word ${word}?`,
  choices: patterns.map((p, i) => (i === 0 ? K(p)
    : P(p, SIB.has(u) && SIB.has(p) ? "D-PATTERN-TRAP" : (SIB.has(p) || SIB.has(u) ? "D-PATTERN-TRAP" : "D-VOWEL")))),
  media: resolver(word) ? "image-required" : "text",
  img: resolver(word) ? word : undefined,
  target: word,
  note
});

const patp = (u, lvl, ph, v, word, patterns, note = "") => ({
  u, lvl, ph, v, fmt: "PICTURE_AUDIO_TO_PATTERN",
  prompt: "Which letters make the sound you hear in this picture's word?",
  spoken: `${word}. Which letters make the r sound in ${word}?`,
  choices: patterns.map((p, i) => (i === 0 ? K(p) : P(p, "D-PATTERN-TRAP"))),
  media: "image-required",
  img: word,
  target: word,
  note: note || "the word is spoken and pictured, never printed"
});

const cps = (u, lvl, ph, v, soundName, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "CPS",
  prompt: `Which word has the ${soundName} sound?`,
  spoken: `Which word has the ${soundName} sound?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  note
});

export default {
  skillId: "r_controlled_vowels",
  skillName: "R-Controlled Vowels",
  imageResolver: resolver,
  items: [
    // ================= ar (phase 1) =================
    rcp("ar", 1, 1, 1, "car", "c__", ["ar", "or", "er", "ir"],
      "cor, cer and cir are non-words"),
    rcp("ar", 1, 1, 2, "star", "st__", ["ar", "or", "ir", "ur"],
      "stir is real — the star image pins the target"),
    rcp("ar", 1, 1, 3, "farm", "f__m", ["ar", "or", "ir", "er"],
      "form and firm are real — the farm image pins the target"),
    patp("ar", 1, 1, 4, "shark", ["ar", "or", "er", "ur"]),
    patp("ar", 1, 1, 5, "yarn", ["ar", "or", "ir", "er"]),
    patp("ar", 1, 1, 6, "park", ["ar", "or", "ur", "ir"]),
    rcp("ar", 2, 1, 1, "scarf", "sc__f", ["ar", "or", "er", "ur"],
      "scorf, scerf and scurf-ish strings are not child words"),
    rcp("ar", 2, 1, 2, "sharp", "sh__p", ["ar", "or", "ir", "ur"],
      "shorp, shirp and shurp are non-words"),
    rcp("ar", 2, 1, 3, "barn", "b__n", ["ar", "ir", "er", "ai"],
      "born and burn are real, so they stay out — birn, bern and bain are non-words"),
    cps("ar", 2, 1, 4, "ar (as in car)", ["shark", "shirt", "care", "pin"], "shark",
      { shirt: "D-PATTERN-TRAP", care: "D-PATTERN-TRAP", pin: "D-VOWEL" },
      "care has the ar letters without the sound and out-chunks the key; shirt is the /ɜr/ neighbour"),
    cps("ar", 2, 1, 5, "ar (as in car)", ["farm", "fork", "fin", "fun"], "farm",
      { fork: "D-PATTERN-TRAP", fin: "D-VOWEL", fun: "D-VOWEL" },
      "an all-f panel — only the vowel work is left"),
    cps("ar", 2, 1, 6, "ar (as in car)", ["yard", "warm", "win", "hen"], "yard",
      { warm: "D-PATTERN-TRAP", win: "D-VOWEL", hen: "D-VOWEL" },
      "warm has ar without the sound; win ties the in-chunk"),

    // ================= or (phase 1) =================
    rcp("or", 1, 1, 1, "corn", "c__n", ["or", "ar", "er", "ur"],
      "carn, cern and curn are non-words"),
    rcp("or", 1, 1, 2, "fork", "f__k", ["or", "ar", "ir", "er"],
      "fark, firk and ferk are non-words"),
    rcp("or", 1, 1, 3, "storm", "st__m", ["or", "ar", "er", "ir"],
      "starm, sterm and stirm are non-words"),
    patp("or", 1, 1, 4, "corn", ["or", "ar", "er", "ir"]),
    patp("or", 1, 1, 5, "fork", ["or", "ar", "ur", "er"]),
    patp("or", 1, 1, 6, "horn", ["or", "ar", "ir", "ur"]),
    rcp("or", 2, 1, 1, "short", "sh__t", ["or", "ar", "ir", "ur"],
      "shirt is real — the spoken word and sentence-free frame pin short via the sh__t stem's only sensible completion being pinned by audio; shart, shirt and shurt traps stay honest because the target is spoken"),
    rcp("or", 2, 1, 2, "sport", "sp__t", ["or", "ar", "er", "ir"],
      "spart, spert and spirt are non-words"),
    rcp("or", 2, 1, 3, "fort", "f__t", ["or", "ar", "er", "ur"],
      "fart is crude and stays out; fert and furt are non-words — ar is excluded from this set"),
    cps("or", 2, 1, 4, "or (as in corn)", ["storm", "star", "pin", "bug"], "storm",
      { star: "D-PATTERN-TRAP", pin: "D-VOWEL", bug: "D-VOWEL" }),
    cps("or", 2, 1, 5, "or (as in corn)", ["sport", "word", "hard", "pin"], "sport",
      { word: "D-PATTERN-TRAP", hard: "D-PATTERN-TRAP", pin: "D-VOWEL" },
      "word has or without the sound and out-chunks everything; horn-type keys stay out because corn contains orn"),
    cps("or", 2, 1, 6, "or (as in corn)", ["fork", "worm", "win", "net"], "fork",
      { worm: "D-PATTERN-TRAP", win: "D-VOWEL", net: "D-VOWEL" },
      "fork is concrete and pictureable; worm has or with the /ɜr/ sound; win ties the in-chunk"),

    // ================= er (phase 2) =================
    rcp("er", 1, 2, 1, "her", "h__", ["er", "or", "ar", "oa"],
      "hor and hoa are non-words; har stays out as crude-adjacent — or carries the contrast"),
    rcp("er", 1, 2, 2, "fern", "f__n", ["er", "ir", "ur", "ar"],
      "firn, furn and farn are non-words — the full three-way choice"),
    rcp("er", 1, 2, 3, "herd", "h__d", ["er", "ir", "ur", "or"],
      "hird, hurd and hord are non-words"),
    patp("er", 1, 2, 4, "tiger", ["er", "ar", "or", "ur"],
      "the unstressed final er — tiger, not a CVC word"),
    patp("er", 1, 2, 5, "flower", ["er", "ar", "or", "ir"]),
    patp("er", 1, 2, 6, "spider", ["er", "or", "ar", "ur"]),
    rcp("er", 2, 2, 1, "her", "h__ (she did it — it belongs to ___)", ["er", "ir", "ur", "or"],
      "the blueprint exemplar: the sentence frame pins her against hir/hur"),
    rcp("er", 2, 2, 2, "letter", "lett__", ["er", "ir", "ur", "ar"],
      "letter's double t locks the spelling family; lettir, lettur and lettar are non-words"),
    rcp("er", 2, 2, 3, "winter", "wint__", ["er", "ir", "ur", "or"],
      "wintir, wintur and wintor are non-words"),
    cps("er", 2, 2, 4, "er (as in her)", ["fern", "here", "fork", "fox"], "fern",
      { here: "D-PATTERN-TRAP", fork: "D-PATTERN-TRAP", fox: "D-VOWEL" },
      "here carries the her letters without the sound and out-chunks the key; er=ir=ur share one sound, so siblings stay out"),
    cps("er", 2, 2, 5, "er (as in her)", ["herd", "here", "hard", "hop"], "herd",
      { here: "D-PATTERN-TRAP", hard: "D-PATTERN-TRAP", hop: "D-VOWEL" },
      "herd and here both carry the her letters — the scanner ties"),
    cps("er", 2, 2, 6, "er (as in her)", ["letter", "very", "corn", "cart"], "letter",
      { very: "D-PATTERN-TRAP", corn: "D-PATTERN-TRAP", cart: "D-PATTERN-TRAP" },
      "very has er letters with the short sound"),

    // ================= ir (phase 2) =================
    rcp("ir", 1, 2, 1, "bird", "b__d", ["ir", "er", "ur", "ar"],
      "berd and burd are non-words; bard is real but the bird image pins the target"),
    rcp("ir", 1, 2, 2, "girl", "g__l", ["ir", "ur", "er", "ar"],
      "gurl, gerl and garl are non-words"),
    rcp("ir", 1, 2, 3, "shirt", "sh__t", ["ir", "ur", "er", "or"],
      "short is real — the shirt image pins the target"),
    patp("ir", 1, 2, 4, "bird", ["ir", "ar", "or", "er"]),
    patp("ir", 1, 2, 5, "girl", ["ir", "or", "ar", "ur"]),
    patp("ir", 1, 2, 6, "shirt", ["ir", "ar", "or", "er"]),
    rcp("ir", 2, 2, 1, "first", "f__st", ["ir", "ur", "er", "or"],
      "furst, ferst and forst are non-words — the pure three-way plus or"),
    rcp("ir", 2, 2, 2, "third", "th__d", ["ir", "ur", "er", "ar"],
      "thurd, therd and thard are non-words"),
    rcp("ir", 2, 2, 3, "dirt", "d__t", ["ir", "er", "ur", "oa"],
      "dert and durt are non-words; dart is real, so ar stays out and oa fills the vowel slot"),
    cps("ir", 2, 2, 4, "ir (as in bird)", ["girl", "fire", "gate", "log"], "girl",
      { fire: "D-PATTERN-TRAP", gate: "D-VOWEL", log: "D-VOWEL" },
      "fire has the ir letters with a different sound — the tie and the trap"),
    cps("ir", 2, 2, 5, "ir (as in bird)", ["shirt", "fire", "shark", "ship"], "shirt",
      { fire: "D-PATTERN-TRAP", shark: "D-PATTERN-TRAP", ship: "D-VOWEL" },
      "fire ties the ir letters; shark carries the ar contrast"),
    cps("ir", 2, 2, 6, "ir (as in bird)", ["dirt", "dart", "tin", "dig"], "dirt",
      { dart: "D-PATTERN-TRAP", tin: "D-VOWEL", dig: "D-VOWEL" },
      "tin ties the in-chunk of the prompt"),

    // ================= ur (phase 2) =================
    rcp("ur", 1, 2, 1, "hurt", "h__t", ["ur", "ir", "er", "or"],
      "hirt and hert are non-words; hort too"),
    rcp("ur", 1, 2, 2, "nurse", "n__se", ["ur", "er", "ir", "or"],
      "nerse, nirse and norse are not child words"),
    rcp("ur", 1, 2, 3, "burn", "b__n", ["ur", "ir", "er", "oa"],
      "birn and bern are non-words; born is real, so or stays out and oa fills the slot"),
    patp("ur", 1, 2, 4, "purse", ["ur", "ar", "or", "er"]),
    patp("ur", 1, 2, 5, "surf", ["ur", "or", "ar", "ir"]),
    patp("ur", 1, 2, 6, "turtle", ["ur", "ar", "or", "er"]),
    rcp("ur", 2, 2, 1, "curl", "c__l", ["ur", "ir", "er", "ar"],
      "cirl, cerl and carl are non-words for this age"),
    rcp("ur", 2, 2, 2, "turnip", "t__nip", ["ur", "ir", "er", "or"],
      "tirnip, ternip and tornip are non-words"),
    rcp("ur", 2, 2, 3, "burst", "b__st", ["ur", "ir", "er", "oa"],
      "birst, berst and boast-adjacent strings are non-words in this frame"),
    cps("ur", 2, 2, 4, "ur (as in turn)", ["surf", "your", "barn", "bin"], "surf",
      { your: "D-PATTERN-TRAP", barn: "D-PATTERN-TRAP", bin: "D-VOWEL" },
      "burn-type keys stay out (turn contains urn); your has ur without the sound; bin ties the in-chunk"),
    cps("ur", 2, 2, 5, "ur (as in turn)", ["curl", "your", "cart", "pin"], "curl",
      { your: "D-PATTERN-TRAP", cart: "D-PATTERN-TRAP", pin: "D-VOWEL" }),
    cps("ur", 2, 2, 6, "ur (as in turn)", ["nurse", "north", "win", "nut"], "nurse",
      { north: "D-PATTERN-TRAP", win: "D-VOWEL", nut: "D-VOWEL" },
      "win ties the in-chunk"),

    // ================= Retention reserve (form R) =================
    rcp("ar", 1, 1, 7, "jar", "j__", ["ar", "or", "ir", "er"],
      "jor, jir and jer are non-words"),
    rcp("or", 1, 1, 7, "horn", "h__n", ["or", "ar", "er", "ir"],
      "harn, hern and hirn are non-words"),
    patp("ar", 1, 1, 8, "car", ["ar", "or", "er", "ir"]),
    patp("or", 1, 1, 8, "storm", ["or", "ar", "ur", "er"]),
    rcp("ir", 2, 2, 7, "first", "fir__", ["st", "nd", "th", "ft"],
      "firnd, firth and firft are non-words — first is the unique real completion"),
    rcp("ur", 2, 2, 7, "nurse", "nur__", ["se", "ce", "s", "ss"],
      "nurce, nurs and nurss are rival spellings — developmental traps"),
    cps("ir", 2, 2, 8, "ir (as in bird)", ["first", "fire", "fort", "fan"], "first",
      { fire: "D-PATTERN-TRAP", fort: "D-PATTERN-TRAP", fan: "D-VOWEL" }),
    cps("ar", 2, 1, 8, "ar (as in car)", ["yarn", "warm", "win", "yak"], "yarn",
      { warm: "D-PATTERN-TRAP", win: "D-VOWEL", yak: "D-VOWEL" }),
    rcp("er", 1, 2, 7, "sister", "sist__", ["er", "ir", "ur", "ar"],
      "sistir, sistur and sistar are non-words"),
    rcp("ur", 1, 2, 8, "fur", "f__", ["ur", "ir", "er", "oa"],
      "fir and fer — fir is a real tree, so the fur image pins the target; foa is a non-word"),
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
