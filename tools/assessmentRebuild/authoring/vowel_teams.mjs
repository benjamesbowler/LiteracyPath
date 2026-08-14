// Vowel Teams — v3 authored bank (wave W6, paired with r_controlled_vowels).
// L1: stable one-sound teams (ai ay ee ea oa igh). L2: variable/diphthong
// teams (oo ow ou oi oy ew aw) — the two-sounds contrasts (moon/book,
// snow/cow, cloud/soup) are the L2 construct, carried by PTD items.
// Formats:
//   LONG_VOWEL_TEAM_COMPLETE — blank hides the team; image or unique-real
//     completion pins the target. Closed-set.
//   CPS — cross-pattern select ("Which word has the long a sound?"), always
//     carrying a same-letters short-vowel trap (plan for play, got for goat).
//     Keys never contain ound/ong chunks (the prompt words sound/long would
//     hand them to a scanner); a chunk-tied distractor rides where needed.
//   PICTURE_TO_PRINT_MATCH — a controlled picture pins one target and all four
//     options are real words from the same taught spelling family.
//   PTD — two-sounds odd-one-out for genuinely variable vowel teams.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md §13.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["long-vowels", "blends", "digraphs", "hfw", "cvc", "rhyming"]);

const cw = (u, lvl, ph, v, word, blanked, patterns, note = "") => ({
  u, lvl, ph, v, fmt: "LONG_VOWEL_TEAM_COMPLETE",
  prompt: `Finish: ${blanked}`,
  spoken: `${word}. Which letters finish the word ${word}?`,
  choices: patterns.map((p, i) => (i === 0 ? K(p) : P(p, "D-PATTERN-TRAP"))),
  media: resolver(word) ? "image-required" : "text",
  img: resolver(word) ? word : undefined,
  target: word,
  note
});

const cps = (u, lvl, ph, v, soundName, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "CPS",
  prompt: `Which word has the ${soundName} sound?`,
  spoken: `Which word has the ${soundName} sound?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  note
});

// L2 CPS uses a CROSS-SPELLING anchor ("same sound as toy" for an oi key):
// naming the letters or a same-spelling anchor in print hands the key to a
// letter scanner, and matching the sound across spellings IS the L2 construct.
const cpsX = (u, lvl, ph, v, anchor, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "CPS",
  prompt: `Which word has the same sound as ${anchor}?`,
  spoken: `${anchor}. Which word has the same middle sound as ${anchor}?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  target: anchor,
  note
});

const ptdSpell = (u, lvl, ph, v, word, realWords, note = "") => ({
  u, lvl, ph, v, fmt: "PICTURE_TO_PRINT_MATCH",
  prompt: "Which word names the picture?",
  spoken: "Which word names the picture?",
  choices: [K(word), ...realWords.map(candidate => P(candidate, "D-PATTERN-TRAP"))],
  media: "image-required",
  img: word,
  target: word,
  constructClaim: "picture_to_real_word_vowel_team_recognition",
  note: note || "all choices are real words from the taught vowel-team family"
});

// Two-sounds odd-one-out (L2).
const ptdOdd = (u, lvl, ph, v, soundName, words, keyWord, note = "", keySoundName = "") => ({
  u, lvl, ph, v, fmt: "PTD",
  prompt: keySoundName
    ? `Which word has the ${keySoundName} sound?`
    : `Which word does NOT have the ${soundName} sound?`,
  spoken: keySoundName
    ? `Which word has the ${keySoundName} sound?`
    : `Which word does not have the ${soundName} sound?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, "D-PATTERN-TRAP"))),
  media: "text",
  note: note || "same letters, different sound — the scanner's max-overlap pick is a same-sound distractor"
});

export default {
  skillId: "vowel_teams",
  skillName: "Vowel Teams",
  imageResolver: resolver,
  items: [
    // ================= L1 phase 1: ai ay ee =================
    cw("ai", 1, 1, 1, "rain", "r__n", ["ai", "ay", "ee", "oa"]),
    cw("ai", 1, 1, 2, "train", "tr__n", ["ai", "ee", "oa", "igh"]),
    cps("ai", 1, 1, 3, "long a", ["rain", "bed", "ship", "frog"], "rain",
      { bed: "D-VOWEL", ship: "D-VOWEL", frog: "D-VOWEL" },
      "the instructional-standards CPS exemplar, now actually published"),
    cps("ai", 1, 1, 4, "long a", ["chain", "chin", "sock", "hen"], "chain",
      { chin: "D-PATTERN-TRAP", sock: "D-VOWEL", hen: "D-VOWEL" },
      "chin is one letter from the key with the short sound"),
    ptdSpell("ai", 1, 1, 5, "chain", ["rain", "paint", "snail"]),
    ptdSpell("ai", 1, 1, 6, "train", ["rain", "chain", "snail"]),
    cw("ay", 1, 1, 1, "play", "pl__", ["ay", "ai", "ee", "oa"],
      "plai is the medial-team-in-final-position error"),
    cw("ay", 1, 1, 2, "tray", "tr__", ["ay", "ai", "oa", "ew"]),
    cps("ay", 1, 1, 3, "long a", ["play", "plan", "pot", "bug"], "play",
      { plan: "D-PATTERN-TRAP", pot: "D-VOWEL", bug: "D-VOWEL" },
      "plan shares three letters with the key but keeps the short a"),
    cps("ay", 1, 1, 4, "long a", ["day", "dad", "pin", "mud"], "day",
      { dad: "D-PATTERN-TRAP", pin: "D-VOWEL", mud: "D-VOWEL" }),
    ptdSpell("ay", 1, 1, 5, "day", ["play", "tray", "boy"]),
    ptdSpell("ay", 1, 1, 6, "tray", ["day", "play", "toy"]),
    cw("ee", 1, 1, 1, "sheep", "sh__p", ["ee", "ea", "ai", "oa"]),
    cw("ee", 1, 1, 2, "green", "gr__n", ["ee", "ea", "ai", "oo"]),
    cps("ee", 1, 1, 3, "long e", ["feet", "fan", "sock", "mud"], "feet",
      { fan: "D-VOWEL", sock: "D-VOWEL", mud: "D-VOWEL" }),
    cps("ee", 1, 1, 4, "long e", ["tree", "tent", "bag", "log"], "tree",
      { tent: "D-PATTERN-TRAP", bag: "D-VOWEL", log: "D-VOWEL" }),
    ptdSpell("ee", 1, 1, 5, "sheep", ["green", "tree", "bee"]),
    ptdSpell("ee", 1, 1, 6, "bee", ["sheep", "feet", "tree"]),

    // ================= L1 phase 2: ea oa igh =================
    cw("ea", 1, 2, 1, "leaf", "l__f", ["ea", "ee", "ai", "oa"]),
    cw("ea", 1, 2, 2, "meat", "m__t", ["ea", "ee", "ai", "oa"],
      "meet is real — the meat image pins the target"),
    cps("ea", 1, 2, 3, "long e", ["leaf", "leg", "fish", "drum"], "leaf",
      { leg: "D-PATTERN-TRAP", fish: "D-VOWEL", drum: "D-VOWEL" }),
    ptdOdd("ea", 1, 2, 4, "long e", ["bread", "meat", "leaf", "beach"], "bread",
      "ea's two sounds — bread keeps the letters and loses the sound", "short e"),
    ptdOdd("ea", 1, 2, 5, "long e", ["dead", "sea", "beach", "peach"], "dead", "", "short e"),
    ptdSpell("ea", 1, 2, 6, "beach", ["leaf", "meat", "sea"]),
    cw("oa", 1, 2, 1, "boat", "b__t", ["oa", "ee", "ai", "igh"],
      "beet and bait are real — the boat image pins the target"),
    cw("oa", 1, 2, 2, "goat", "g__t", ["oa", "ea", "ai", "ee"]),
    cps("oa", 1, 2, 3, "long o", ["goat", "got", "pin", "hen"], "goat",
      { got: "D-PATTERN-TRAP", pin: "D-VOWEL", hen: "D-VOWEL" },
      "got is the key minus its team — the short sibling"),
    cps("oa", 1, 2, 4, "long o", ["road", "rod", "cup", "leg"], "road",
      { rod: "D-PATTERN-TRAP", cup: "D-VOWEL", leg: "D-VOWEL" }),
    ptdSpell("oa", 1, 2, 5, "boat", ["goat", "road", "coat"]),
    ptdSpell("oa", 1, 2, 6, "coat", ["boat", "goat", "soap"]),
    cw("igh", 1, 2, 1, "light", "l__t", ["igh", "ai", "ee", "oa"]),
    cw("igh", 1, 2, 2, "night", "n__t", ["igh", "ai", "ee", "oa"]),
    cps("igh", 1, 2, 3, "long i", ["night", "pin", "dog", "cup"], "night",
      { pin: "D-VOWEL", dog: "D-VOWEL", cup: "D-VOWEL" }),
    cps("igh", 1, 2, 4, "long i", ["light", "lit", "bag", "pot"], "light",
      { lit: "D-PATTERN-TRAP", bag: "D-VOWEL", pot: "D-VOWEL" },
      "lit is the key minus its team"),
    ptdSpell("igh", 1, 2, 5, "light", ["night", "right", "kite"]),
    ptdSpell("igh", 1, 2, 6, "night", ["light", "right", "high"]),

    // ================= L2 phase 1: oo ow ou oi =================
    cw("oo", 2, 1, 1, "moon", "m__n", ["oo", "ew", "oa", "ou"],
      "moan is real — the moon image pins the target"),
    cw("oo", 2, 1, 2, "spoon", "sp__n", ["oo", "ew", "oa", "ai"]),
    cpsX("oo", 2, 1, 3, "blue", ["broom", "book", "bed", "pig"], "broom",
      { book: "D-PATTERN-TRAP", bed: "D-VOWEL", pig: "D-VOWEL" },
      "book keeps the letters and swaps the sound — the two-oo contrast"),
    cpsX("oo", 2, 1, 4, "glue", ["zoo", "look", "fan", "net"], "zoo",
      { look: "D-PATTERN-TRAP", fan: "D-VOWEL", net: "D-VOWEL" }),
    ptdOdd("oo", 2, 1, 5, "oo (as in moon)", ["book", "moon", "spoon", "zoo"], "book"),
    ptdOdd("oo", 2, 1, 6, "oo (as in moon)", ["look", "broom", "boot", "room"], "look"),
    cw("ow", 2, 1, 1, "snow", "sn__", ["ow", "ou", "oa", "oo"]),
    cw("ow", 2, 1, 2, "grow", "gr__", ["ow", "ou", "oa", "aw"]),
    cpsX("ow", 2, 1, 3, "boat", ["grow", "cow", "hat", "bed"], "grow",
      { cow: "D-PATTERN-TRAP", hat: "D-VOWEL", bed: "D-VOWEL" },
      "cow keeps the letters and swaps the sound"),
    cpsX("ow", 2, 1, 4, "loud", ["town", "snow", "pin", "mud"], "town",
      { snow: "D-PATTERN-TRAP", pin: "D-VOWEL", mud: "D-VOWEL" }),
    ptdOdd("ow", 2, 1, 5, "ow (as in cow)", ["snow", "town", "down", "how"], "snow"),
    ptdOdd("ow", 2, 1, 6, "ow (as in snow)", ["cow", "grow", "slow", "show"], "cow"),
    cw("ou", 2, 1, 1, "cloud", "cl__d", ["ou", "ow", "oo", "oa"]),
    cw("ou", 2, 1, 2, "house", "h__se", ["ou", "ow", "oo", "oa"]),
    cpsX("ou", 2, 1, 3, "cow", ["loud", "fond", "hat", "zip"], "loud",
      { fond: "D-PATTERN-TRAP", hat: "D-VOWEL", zip: "D-VOWEL" },
      "keys avoid ound-words — the prompt word sound contains them; fond ties the nd chunk"),
    cpsX("ou", 2, 1, 4, "how", ["mouth", "moth", "bag", "pin"], "mouth",
      { moth: "D-PATTERN-TRAP", bag: "D-VOWEL", pin: "D-VOWEL" },
      "moth is the key minus one letter with a different vowel entirely"),
    ptdOdd("ou", 2, 1, 5, "ou (as in cloud)", ["soup", "mouth", "shout", "loud"], "soup",
      "soup's ou says oo — the variable-team contrast"),
    ptdOdd("ou", 2, 1, 6, "ou (as in cloud)", ["could", "house", "mouse", "shout"], "could",
      "could's ou says the book-oo"),
    cw("oi", 2, 1, 1, "coin", "c__n", ["oi", "oy", "ai", "ee"]),
    cw("oi", 2, 1, 2, "boil", "b__l", ["oi", "oy", "ea", "oo"]),
    cpsX("oi", 2, 1, 3, "toy", ["coin", "cot", "pin", "bag"], "coin",
      { cot: "D-PATTERN-TRAP", pin: "D-VOWEL", bag: "D-VOWEL" }),
    cpsX("oi", 2, 1, 4, "boy", ["oil", "log", "pen", "cup"], "oil",
      { log: "D-VOWEL", pen: "D-VOWEL", cup: "D-VOWEL" }),
    ptdSpell("oi", 2, 1, 5, "oil", ["coin", "boil", "toy"]),
    ptdSpell("oi", 2, 1, 6, "boil", ["coin", "oil", "boy"]),

    // ================= L2 phase 2: oy ew aw =================
    cw("oy", 2, 2, 1, "boy", "b__", ["oy", "oi", "ai", "ay"],
      "bay is real — the boy image pins the target; boi is the position error"),
    cw("oy", 2, 2, 2, "joy", "j__", ["oy", "oi", "ai", "ee"],
      "joi, jai and jee are non-words"),
    cpsX("oy", 2, 2, 3, "coin", ["toy", "top", "net", "rug"], "toy",
      { top: "D-PATTERN-TRAP", net: "D-VOWEL", rug: "D-VOWEL" }),
    cpsX("oy", 2, 2, 4, "oil", ["joy", "jog", "pin", "hen"], "joy",
      { jog: "D-PATTERN-TRAP", pin: "D-VOWEL", hen: "D-VOWEL" }),
    ptdSpell("oy", 2, 2, 5, "boy", ["toy", "joy", "day"]),
    ptdSpell("oy", 2, 2, 6, "toy", ["boy", "joy", "oil"]),
    cw("ew", 2, 2, 1, "screw", "scr__", ["ew", "oo", "ue", "ow"]),
    cw("ew", 2, 2, 2, "chew", "ch__", ["ew", "oo", "ue", "aw"]),
    cpsX("ew", 2, 2, 3, "moon", ["new", "net", "bag", "dog"], "new",
      { net: "D-PATTERN-TRAP", bag: "D-VOWEL", dog: "D-VOWEL" }),
    cpsX("ew", 2, 2, 4, "zoo", ["flew", "fled", "sock", "ram"], "flew",
      { fled: "D-PATTERN-TRAP", sock: "D-VOWEL", ram: "D-VOWEL" }),
    ptdSpell("ew", 2, 2, 5, "new", ["chew", "flew", "grew"]),
    ptdSpell("ew", 2, 2, 6, "flew", ["new", "chew", "blue"]),
    cw("aw", 2, 2, 1, "draw", "dr__", ["aw", "ew", "ow", "oa"],
      "drew is real — the draw image pins the target"),
    cw("aw", 2, 2, 2, "yawn", "y__n", ["aw", "ew", "oo", "oa"],
      "yewn, yoon and yoan are non-words"),
    cpsX("aw", 2, 2, 3, "ball", ["saw", "sat", "pin", "mug"], "saw",
      { sat: "D-PATTERN-TRAP", pin: "D-VOWEL", mug: "D-VOWEL" }),
    cpsX("aw", 2, 2, 4, "tall", ["paw", "pan", "bed", "zip"], "paw",
      { pan: "D-PATTERN-TRAP", bed: "D-VOWEL", zip: "D-VOWEL" }),
    ptdSpell("aw", 2, 2, 5, "draw", ["saw", "straw", "yawn"]),
    ptdSpell("aw", 2, 2, 6, "yawn", ["draw", "saw", "paw"]),

    // ================= Retention reserve (form R) =================
    cw("ai", 1, 1, 7, "tail", "t__l", ["ai", "ay", "ee", "oa"],
      "tayl, teel and toal are non-words"),
    cw("oa", 1, 2, 7, "toast", "t__st", ["oa", "ee", "ai", "oo"]),
    cps("ea", 1, 2, 7, "long e", ["beach", "bench", "dog", "cup"], "beach",
      { bench: "D-PATTERN-TRAP", dog: "D-VOWEL", cup: "D-VOWEL" }),
    cpsX("oo", 2, 1, 7, "flew", ["boot", "book", "pig", "jam"], "boot",
      { book: "D-PATTERN-TRAP", pig: "D-VOWEL", jam: "D-VOWEL" }),
    ptdSpell("ai", 1, 1, 8, "rain", ["chain", "train", "paint"]),
    ptdOdd("ow", 2, 1, 7, "ow (as in snow)", ["brown", "grow", "show", "slow"], "brown"),
    cw("oa", 1, 2, 8, "road", "r__d", ["oa", "ee", "ai", "igh"],
      "reed and raid are real — the road image pins the target"),
    cpsX("oi", 2, 1, 7, "joy", ["boil", "bell", "pot", "sun"], "boil",
      { bell: "D-PATTERN-TRAP", pot: "D-VOWEL", sun: "D-VOWEL" }),
    cw("ew", 2, 2, 7, "new", "n__", ["ew", "oo", "ow", "oy"],
      "now is real — the new word card pins the target"),
    cpsX("aw", 2, 2, 7, "ball", ["straw", "strap", "bin", "leg"], "straw",
      { strap: "D-PATTERN-TRAP", bin: "D-VOWEL", leg: "D-VOWEL" }),
    ptdOdd("oo", 2, 1, 8, "oo (as in moon)", ["good", "room", "zoo", "food"], "good"),
    cw("aw", 2, 2, 8, "crawl", "cr__l", ["aw", "ow", "ee", "oo"],
      "crowl, creel and crool are non-words")
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
