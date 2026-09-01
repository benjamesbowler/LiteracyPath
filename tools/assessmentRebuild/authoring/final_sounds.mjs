// Final Sounds — v3 authored bank (wave W3, paired with initial_sounds).
// Construct: isolate the FINAL sound. Position errors dominate, so every item
// carries a D-POSITION trap (the word's INITIAL sound) somewhere in its set.
// L1: 8 single-consonant finals (b d g l m n p t) — phonological, image-backed.
// L2: 10 pattern finals (sh th ll ng nd nk st sk ft lt) — orthographic endings.
// Formats: ENDING_SOUND (blank completion — the ending is hidden in print, so
// nothing leaks), FINAL_SOUND_PAIR_SELECT (same-final-sound matching over image
// cards at L1 / printed words at L2 where card art is thin — v3 single-select),
// ENDING_SOUND_WORD_MATCH (L1 printed-word match).
// Craft rules:
//   - Exactly ONE choice completes/carries the target ending; a wrong completion
//     may form a different real word ONLY when the target word is pinned by
//     image + spoken anchor. Where an item has no image, every wrong completion
//     is a non-word (checked choice by choice below).
//   - No card/word in an ends-like set may end with the target sound except the
//     key (no second keys).
//   - L2 asks for the same TWO ending letters. A distractor may contain those
//     letters internally, but it must not share only the last component sound
//     (for example d beside nd, or l beside ll). Those partial matches give a
//     young child a second defensible answer.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md §2.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const sentenceCase = value => value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

const resolver = makeImageResolver(["digraphs", "blends", "long-vowels", "hfw"]);

// ENDING_SOUND: blanked word, choices are letters/patterns. The wording names
// whether the child is choosing one final letter or a multi-letter ending.
const es = (u, lvl, ph, v, word, blanked, choices, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "ENDING_SOUND",
  prompt: lvl === 2
    ? `Which letter pair completes ${blanked}?`
    : `Which letter completes ${blanked}?`,
  spoken: lvl === 2
    ? `${sentenceCase(word)}. Which two ending letters complete the word?`
    : `${sentenceCase(word)}. Which letter matches the final sound?`,
  choices: choices.map((c, i) => (i === 0 ? K(c) : P(c, rationales[i - 1]))),
  // L2 is an orthographic pattern task: the printed blank is the evidence.
  // Decorative pictures add naming load without measuring the target skill.
  media: lvl === 2 ? "text" : resolver(word) ? "image-optional" : "text",
  img: lvl === 2 ? undefined : resolver(word) ? word : undefined,
  target: word,
  pos: "final",
  note
});

// FINAL_SOUND_PAIR_SELECT with image cards (L1).
const pc = (u, lvl, ph, v, anchor, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "FINAL_SOUND_PAIR_SELECT",
  // The L1 anchor is heard, not printed, so its final grapheme cannot reveal
  // the answer. L2 uses the printed-word helper below.
  prompt: "Which word has the same final sound?",
  spoken: lvl === 2
    ? `${sentenceCase(anchor)}. Which word has the same two ending letters?`
    : `${sentenceCase(anchor)}. Which word has the same final sound?`,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "image-required",
  evidenceModality: "audio+image",
  constructClaim: "final_sound_discrimination",
  hideWrittenLabels: true,
  pos: "final",
  target: anchor,
  note
});

// FINAL_SOUND_PAIR_SELECT with printed words (L2 units without card art).
const pw = (u, lvl, ph, v, anchor, words, keyWord, rationales, framing = "print", note = "") => ({
  u, lvl, ph, v, fmt: "FINAL_SOUND_PAIR_SELECT",
  prompt: framing === "print"
    ? `Which word has the same two ending letters as ${anchor}?`
    : `Which word has the same final sound as ${anchor}?`,
  spoken: framing === "print"
    ? `${sentenceCase(anchor)}. Which word has the same two ending letters?`
    : `${sentenceCase(anchor)}. Which word has the same final sound?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  pos: "final",
  target: anchor,
  note
});

// ENDING_SOUND_WORD_MATCH: printed words, ends-like anchor (L1 only).
const wm = (u, lvl, ph, v, anchor, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "ENDING_SOUND_WORD_MATCH",
  prompt: "Which word has the same final sound?",
  spoken: `${sentenceCase(anchor)}. Which word has the same final sound?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: resolver(anchor) ? "image-optional" : "text",
  img: resolver(anchor) ? anchor : undefined,
  target: anchor,
  pos: "final",
  note
});

export default {
  skillId: "final_sounds",
  skillName: "Final Sounds",
  imageResolver: resolver,
  items: [
    // ================= L1 phase 1: b d g l =================
    // ---- b
    es("b", 1, 1, 1, "web", "we__", ["b", "p", "w", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "p is the voicing partner; w is the word's own first sound"),
    pc("b", 1, 1, 2, "web", ["tub", "cup", "bed", "dog"], "tub",
      { cup: "D-RIME-NEAR", bed: "D-POSITION", dog: "D-RIME-NEAR" },
      "cup ends the voiceless partner /p/; bed STARTS with b — the position trap"),
    wm("b", 1, 1, 3, "web", ["cub", "cap", "bus", "dog"], "cub",
      { cap: "D-RIME-NEAR", bus: "D-POSITION", dog: "D-RIME-NEAR" }),
    wm("b", 1, 1, 4, "tub", ["bib", "cup", "ball", "sun"], "bib",
      { cup: "D-RIME-NEAR", ball: "D-POSITION", sun: "D-RIME-NEAR" }),

    // ---- d
    es("d", 1, 1, 1, "bed", "be__", ["d", "t", "b", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "t is the voicing partner; b is the word's own first sound"),
    pc("d", 1, 1, 2, "bed", ["lid", "cat", "dog", "sun"], "lid",
      { cat: "D-RIME-NEAR", dog: "D-POSITION", sun: "D-RIME-NEAR" },
      "cat ends the voiceless partner /t/; dog STARTS with d — the position trap"),
    wm("d", 1, 1, 3, "lid", ["mud", "cat", "dog", "sun"], "mud",
      { cat: "D-RIME-NEAR", dog: "D-POSITION", sun: "D-RIME-NEAR" }),
    es("d", 1, 1, 4, "lid", "li__", ["d", "t", "l", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "t is the voicing partner; l is the word's own first sound"),

    // ---- g
    es("g", 1, 1, 1, "dog", "do__", ["g", "k", "d", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "k is the voiceless partner; d is the word's own first sound"),
    pc("g", 1, 1, 2, "dog", ["pig", "duck", "goat", "sun"], "pig",
      { duck: "D-RIME-NEAR", goat: "D-POSITION", sun: "D-RIME-NEAR" },
      "duck ends the voiceless partner /k/; goat STARTS with g — the position trap"),
    wm("g", 1, 1, 3, "pig", ["bug", "duck", "goat", "sun"], "bug",
      { duck: "D-RIME-NEAR", goat: "D-POSITION", sun: "D-RIME-NEAR" }),
    es("g", 1, 1, 4, "log", "lo__", ["g", "k", "l", "j"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "k is the voiceless partner; l is the word's own first sound"),

    // ---- l
    es("l", 1, 1, 1, "wheel", "whee__", ["l", "r", "w", "i"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "r is the liquid partner; w is the word's first sound; whee+r/w/i are non-words"),
    pc("l", 1, 1, 2, "wheel", ["bell", "moon", "lamp", "cat"], "bell",
      { moon: "D-RIME-NEAR", lamp: "D-POSITION", cat: "D-RIME-NEAR" },
      "lamp STARTS with l — the position trap; moon and cat end with different common sounds"),
    es("l", 1, 1, 3, "bell", "bel__", ["l", "r", "b", "i"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "r is the liquid neighbour; b is the word's own first sound; the isolated bell removes the tail/tale composite"),
    wm("l", 1, 1, 4, "wheel", ["pool", "moon", "lamp", "cat"], "pool",
      { moon: "D-RIME-NEAR", lamp: "D-POSITION", cat: "D-RIME-NEAR" }),

    // ================= L1 phase 2: m n p t =================
    // ---- m
    es("m", 1, 2, 1, "jam", "ja__", ["m", "n", "j", "w"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "n is the nasal partner; j is the word's own first sound"),
    pc("m", 1, 2, 2, "jam", ["ham", "net", "map", "dog"], "ham",
      { net: "D-RIME-NEAR", map: "D-POSITION", dog: "D-RIME-NEAR" },
      "net ends the nasal neighbour /n/; map STARTS with m — the position trap"),
    wm("m", 1, 2, 3, "ham", ["gum", "net", "map", "dog"], "gum",
      { net: "D-RIME-NEAR", map: "D-POSITION", dog: "D-RIME-NEAR" }),
    es("m", 1, 2, 4, "ham", "ha__", ["m", "n", "h", "w"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "n is the nasal partner; h is the word's own first sound"),

    // ---- n
    es("n", 1, 2, 1, "sun", "su__", ["n", "m", "s", "h"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "m is the nasal partner; s is the word's own first sound"),
    pc("n", 1, 2, 2, "sun", ["hen", "ham", "net", "dog"], "hen",
      { ham: "D-RIME-NEAR", net: "D-POSITION", dog: "D-RIME-NEAR" },
      "ham ends the nasal neighbour /m/; net STARTS with n — the position trap"),
    wm("n", 1, 2, 3, "hen", ["pin", "ham", "net", "dog"], "pin",
      { ham: "D-RIME-NEAR", net: "D-POSITION", dog: "D-RIME-NEAR" }),
    es("n", 1, 2, 4, "ten", "te__", ["n", "m", "t", "h"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "m is the nasal partner; t is the word's own first sound"),

    // ---- p
    es("p", 1, 2, 1, "map", "ma__", ["p", "b", "m", "d"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "b is the voicing partner; m is the word's own first sound"),
    pc("p", 1, 2, 2, "map", ["mop", "crab", "pig", "sun"], "mop",
      { crab: "D-RIME-NEAR", pig: "D-POSITION", sun: "D-RIME-NEAR" },
      "crab ends the voiced partner /b/; pig STARTS with p — the position trap; mop is directly nameable"),
    wm("p", 1, 2, 3, "mop", ["cup", "crab", "pig", "sun"], "cup",
      { crab: "D-RIME-NEAR", pig: "D-POSITION", sun: "D-RIME-NEAR" }),
    es("p", 1, 2, 4, "mop", "mo__", ["p", "b", "m", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "b is the voicing partner; m is the word's own first sound"),

    // ---- t
    es("t", 1, 2, 1, "cat", "ca__", ["t", "d", "c", "f"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "d is the voicing partner; c is the word's own first sound"),
    pc("t", 1, 2, 2, "cat", ["hat", "bed", "tiger", "sun"], "hat",
      { bed: "D-RIME-NEAR", tiger: "D-POSITION", sun: "D-RIME-NEAR" },
      "bed ends the voiced partner /d/; tiger STARTS with t — the position trap"),
    wm("t", 1, 2, 3, "hat", ["net", "bed", "tiger", "sun"], "net",
      { bed: "D-RIME-NEAR", tiger: "D-POSITION", sun: "D-RIME-NEAR" }),
    es("t", 1, 2, 4, "wet", "we__", ["t", "d", "w", "f"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "d is the voicing partner; w is the word's own first sound"),

    // ================= L2 phase 1: sh th ll ng nd =================
    // ---- sh
    es("sh", 2, 1, 1, "fish", "fi__", ["sh", "ch", "s", "f"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-POSITION"],
      "s is the sh-reduction error; f is the word's first sound; image pins the target"),
    pw("sh", 2, 1, 2, "wish", ["fish", "whisk", "wasp", "glass"], "fish",
      { whisk: "D-PATTERN-TRAP", wasp: "D-POSITION", glass: "D-RIME-NEAR" },
      "print",
      "whisk shares wish's letters so scanning ties; wasp starts like the anchor; glass ends bare /s/"),
    es("sh", 2, 1, 3, "brush", "bru__", ["sh", "ch", "th", "b"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"]),
    es("sh", 2, 1, 4, "splash", "spla__", ["sh", "th", "s", "ck"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-PATTERN-TRAP"]),

    // ---- th
    es("th", 2, 1, 1, "moth", "mo__", ["th", "sh", "f", "m"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-POSITION"],
      "f is the /θ/→/f/ fronting error; image pins the target"),
    pw("th", 2, 1, 2, "bath", ["moth", "boat", "ring", "toe"], "moth",
      { boat: "D-POSITION", ring: "D-PATTERN-TRAP", toe: "D-DEVELOPMENTAL" },
      "print",
      "boat starts like the anchor, ends bare /t/, and ties the bath at-overlap; toe is the drop-the-th error"),
    es("th", 2, 1, 3, "bath", "ba__", ["th", "f", "b", "ft"],
      ["D-DEVELOPMENTAL", "D-POSITION", "D-PATTERN-TRAP"],
      "ba+f/b/ft are non-words; sh is kept out because bash is a real word and the item is image-pinned anyway"),
    es("th", 2, 1, 4, "cloth", "clo__", ["th", "ch", "s", "c"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-POSITION"]),

    // ---- ll (print-framed: same two ending letters)
    es("ll", 2, 1, 1, "bell", "be__", ["ll", "sh", "ng", "b"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "No one-l option: l and ll are the same final sound, so l would be defensible."),
    pw("ll", 2, 1, 2, "shell", ["hill", "yellow", "shed", "moth"], "hill",
      { yellow: "D-PATTERN-TRAP", shed: "D-POSITION", moth: "D-RIME-NEAR" }, "print",
      "yellow contains ll internally but does not end in ll; no distractor ends in a single l."),
    es("ll", 2, 1, 3, "hill", "hi__", ["ll", "sh", "ng", "h"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "No one-l option because it would share the same final sound."),
    es("ll", 2, 1, 4, "small", "sma__", ["ll", "sh", "ng", "s"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "No one-l option because it would share the same final sound."),

    // ---- ng
    es("ng", 2, 1, 1, "ring", "ri__", ["ng", "n", "nk", "r"],
      ["D-DEVELOPMENTAL", "D-PATTERN-TRAP", "D-POSITION"],
      "n is the ng-reduction; nk forms rink but the ring image pins the target"),
    pw("ng", 2, 1, 2, "song", ["ring", "pin", "sock", "rock"], "ring",
      { pin: "D-DEVELOPMENTAL", sock: "D-POSITION", rock: "D-RIME-NEAR" },
      "print",
      "anchor avoids the -ing chunk a rhyming anchor would hand to scanners; pin is the n-reduction; sock starts like the anchor and ties its so-overlap"),
    es("ng", 2, 1, 3, "king", "ki__", ["ng", "n", "th", "k"],
      ["D-DEVELOPMENTAL", "D-DEVELOPMENTAL", "D-POSITION"],
      "ki+n = kin is obscure enough to stay, but the king image pins the target regardless"),
    es("ng", 2, 1, 4, "swing", "swi__", ["ng", "n", "nk", "s"],
      ["D-DEVELOPMENTAL", "D-PATTERN-TRAP", "D-POSITION"],
      "swi+n/nk/s are non-words (swim is kept out of the set)"),

    // ---- nd
    es("nd", 2, 1, 1, "hand", "ha__", ["nd", "nt", "nk", "h"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "ha+nt/nk/h are non-words; image pins the target"),
    pw("nd", 2, 1, 2, "hand", ["pond", "candle", "nut", "hen"], "pond",
      { candle: "D-PATTERN-TRAP", nut: "D-RIME-NEAR", hen: "D-POSITION" }, "print",
      "candle contains nd internally but ends in le; no distractor ends in bare d."),
    es("nd", 2, 1, 3, "pond", "po__", ["nd", "nt", "n", "g"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR"],
      "po+nt/n/g are non-words (pop and pong stay out)"),
    es("nd", 2, 1, 4, "wind", "wi__", ["nd", "nt", "mp", "w"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "No bare-d option: hand and wind do end in /d/, so d would be defensible under sound wording."),

    // ================= L2 phase 2: nk st sk ft lt =================
    // ---- nk
    es("nk", 2, 2, 1, "drink", "dri__", ["nk", "ng", "nt", "d"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "dri+ng/nt/d are all non-words — drink is the clean nk frame"),
    pw("nk", 2, 2, 2, "tank", ["drink", "monkey", "tap", "ring"], "drink",
      { monkey: "D-PATTERN-TRAP", tap: "D-POSITION", ring: "D-RIME-NEAR" }, "print",
      "monkey contains nk internally but ends in ey; no distractor ends in bare /k/."),
    es("nk", 2, 2, 3, "trunk", "tru__", ["nk", "ng", "nt", "t"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "tru+ng/nt/t are non-words"),
    es("nk", 2, 2, 4, "blink", "bli__", ["nk", "nt", "b", "g"],
      ["D-PATTERN-TRAP", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "bli+nt/b/g are non-words (bling stays out of the set)"),

    // ---- st
    es("st", 2, 2, 1, "nest", "ne__", ["st", "sk", "ss", "n"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "ne+sk/ss/n are non-words (net stays out); image pins the target"),
    pw("st", 2, 2, 2, "list", ["nest", "desk", "dish", "lemon"], "nest",
      { desk: "D-PATTERN-TRAP", dish: "D-PATTERN-TRAP", lemon: "D-RIME-NEAR" },
      "print",
      "No distractor ends in bare t; desk and dish provide neighboring endings."),
    es("st", 2, 2, 3, "vest", "ve__", ["st", "sk", "ft", "v"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "ve+sk/ft/v are non-words (vet stays out); image pins the target"),
    es("st", 2, 2, 4, "list", "li__", ["st", "sk", "ss", "l"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "li+sk/ss/l are non-words (lift, lick, lip all stay out)"),

    // ---- sk
    es("sk", 2, 2, 1, "desk", "de__", ["sk", "st", "ck", "d"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "deck is real but the desk image pins the target; de+d is a non-word"),
    pw("sk", 2, 2, 2, "desk", ["mask", "basket", "nest", "dish"], "mask",
      { basket: "D-PATTERN-TRAP", nest: "D-RIME-NEAR", dish: "D-POSITION" }, "print",
      "basket contains sk internally but ends in et; no distractor ends in bare /k/."),
    es("sk", 2, 2, 3, "mask", "ma__", ["sk", "ft", "ng", "f"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-VISUAL-NEIGHBOR"],
      "ma+ft/ng/f are non-words — mask has no image so every wrong completion must be a non-word"),
    es("sk", 2, 2, 4, "tusk", "tu__", ["sk", "st", "nt", "m"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-VISUAL-NEIGHBOR"],
      "tu+st/nt/m are non-words (tuck and tug stay out of the set)"),

    // ---- ft
    es("ft", 2, 2, 1, "gift", "gi__", ["ft", "st", "ck", "g"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "image pins the target; gi+g is a non-word"),
    pw("ft", 2, 2, 2, "raft", ["gift", "after", "rain", "mask"], "gift",
      { after: "D-PATTERN-TRAP", rain: "D-POSITION", mask: "D-RIME-NEAR" }, "print",
      "after contains ft internally but ends in er; no distractor ends in bare t."),
    es("ft", 2, 2, 3, "left", "le__", ["ft", "sk", "mp", "l"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "le+sk/mp/l are non-words (leg, let, less all stay out)"),
    es("ft", 2, 2, 4, "raft", "ra__", ["ft", "sk", "nd", "r"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "ra+sk/nd/r are non-words (rat, ran, rag, ramp all stay out)"),

    // ---- lt
    es("lt", 2, 2, 1, "melt", "me__", ["lt", "ft", "sk", "m"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "me+ft/sk/m are non-words (mess and men stay out)"),
    pw("lt", 2, 2, 2, "belt", ["melt", "salty", "book", "ring"], "melt",
      { salty: "D-PATTERN-TRAP", book: "D-POSITION", ring: "D-RIME-NEAR" }, "print",
      "salty contains lt internally but ends in y; no distractor ends in bare l or t."),
    es("lt", 2, 2, 3, "salt", "sa__", ["lt", "ft", "th", "s"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "sa+ft/th/s are non-words (sand and sack stay out of the set)"),
    es("lt", 2, 2, 4, "felt", "fe__", ["lt", "sk", "ng", "f"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"],
      "fe+sk/ng/f are non-words (fell and fed stay out of the set)"),

    // ================= Retention reserve (form R) =================
    wm("b", 1, 1, 5, "web", ["tub", "cap", "ball", "mud"], "tub",
      { cap: "D-RIME-NEAR", ball: "D-POSITION", mud: "D-RIME-NEAR" }),
    wm("d", 1, 1, 5, "mud", ["bed", "cat", "dog", "rug"], "bed",
      { cat: "D-RIME-NEAR", dog: "D-POSITION", rug: "D-RIME-NEAR" }),
    es("m", 1, 1, 5, "drum", "dru__", ["m", "n", "d", "w"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "n is the nasal neighbour; d is the word's own first sound"),
    es("t", 1, 2, 5, "hat", "ha__", ["t", "d", "h", "f"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "d is the voicing partner; h is the word's own first sound"),
    pc("n", 1, 2, 5, "ten", ["pin", "ham", "net", "bug"], "pin",
      { ham: "D-RIME-NEAR", net: "D-POSITION", bug: "D-RIME-NEAR" }),
    es("sh", 2, 1, 5, "dish", "di__", ["sh", "ch", "th", "d"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"]),
    es("ng", 2, 1, 5, "sting", "sti__", ["ng", "n", "nd", "s"],
      ["D-DEVELOPMENTAL", "D-PATTERN-TRAP", "D-POSITION"],
      "sti+n/nd/s are non-words (stink and still stay out of the set)"),
    es("st", 2, 2, 5, "twist", "twi__", ["st", "sk", "ss", "f"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-VISUAL-NEIGHBOR"],
      "twi+sk/ss/f are non-words (twin and twig stay out of the set)"),
    pw("lt", 2, 2, 5, "melt", ["salt", "salty", "moth", "ring"], "salt",
      { salty: "D-PATTERN-TRAP", moth: "D-POSITION", ring: "D-RIME-NEAR" }, "print",
      "salty contains lt internally but ends in y; no distractor ends in bare l or t."),
    es("nk", 2, 2, 5, "think", "thi__", ["nk", "nt", "d", "t"],
      ["D-PATTERN-TRAP", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"],
      "thi+nt/d/t are non-words (thing, thin, this all stay out of the set)")
  ].map(item => {
    if (item.v >= 5) item.retention = true;
    return item;
  })
};
