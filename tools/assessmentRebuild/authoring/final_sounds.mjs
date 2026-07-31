// Final Sounds — v3 authored bank (wave W3, paired with initial_sounds).
// Construct: isolate the FINAL sound. Position errors dominate, so every item
// carries a D-POSITION trap (the word's INITIAL sound) somewhere in its set.
// L1: 8 single-consonant finals (b d g l m n p t) — phonological, image-backed.
// L2: 10 pattern finals (sh th ll ng nd nk st sk ft lt) — orthographic endings.
// Formats: ENDING_SOUND (blank completion — the ending is hidden in print, so
// nothing leaks), FINAL_SOUND_PAIR_SELECT ("ends like ⟨anchor⟩" over image
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

const resolver = makeImageResolver(["digraphs", "blends", "long-vowels", "hfw"]);

// ENDING_SOUND: blanked word, choices are letters/patterns. The printed prompt
// is deliberately terse: "ending", "finishes" and "the" contain ng/nd/sh/th, so
// a wordier frame would hand pattern keys to any letter-chunk scanner. The full
// instruction lives in the spoken line (instruction audio ships via
// current production-audio coverage for every item).
const es = (u, lvl, ph, v, word, blanked, choices, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "ENDING_SOUND",
  prompt: `Complete: ${blanked}`,
  spoken: lvl === 2
    ? `${word}. Which two ending letters finish the word ${word}?`
    : `${word}. Which ending sound finishes the word ${word}?`,
  choices: choices.map((c, i) => (i === 0 ? K(c) : P(c, rationales[i - 1]))),
  media: resolver(word) ? "image-optional" : "text",
  img: resolver(word) ? word : undefined,
  target: word,
  pos: "final",
  note
});

// FINAL_SOUND_PAIR_SELECT with image cards (L1).
const pc = (u, lvl, ph, v, anchor, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "FINAL_SOUND_PAIR_SELECT",
  prompt: lvl === 2
    ? `Which one ends with the same two letters as ${anchor}?`
    : `Which one ends like ${anchor}?`,
  spoken: lvl === 2
    ? `${anchor}. Which one ends with the same two letters as ${anchor}?`
    : `${anchor}. Which one ends with the same sound as ${anchor}?`,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "image-required",
  pos: "final",
  target: anchor,
  note
});

// FINAL_SOUND_PAIR_SELECT with printed words (L2 units without card art).
const pw = (u, lvl, ph, v, anchor, words, keyWord, rationales, framing = "print", note = "") => ({
  u, lvl, ph, v, fmt: "FINAL_SOUND_PAIR_SELECT",
  prompt: framing === "print"
    ? `Which word ends with the same letters as ${anchor}?`
    : `Which word ends like ${anchor}?`,
  spoken: framing === "print"
    ? `${anchor}. Which word ends with the same two letters as ${anchor}?`
    : `${anchor}. Which word ends like ${anchor}?`,
  choices: words.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "text",
  pos: "final",
  target: anchor,
  note
});

// ENDING_SOUND_WORD_MATCH: printed words, ends-like anchor (L1 only).
const wm = (u, lvl, ph, v, anchor, words, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "ENDING_SOUND_WORD_MATCH",
  prompt: `Which word ends like ${anchor}?`,
  spoken: `${anchor}. Which word ends with the same sound as ${anchor}?`,
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
    es("b", 1, 1, 1, "web", "we__", ["b", "p", "w", "v"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "p is the voicing partner; w is the word's own first sound"),
    pc("b", 1, 1, 2, "web", ["crab", "cap", "bike", "road"], "crab",
      { cap: "D-RIME-NEAR", bike: "D-POSITION", road: "D-RIME-NEAR" },
      "cap ends the voiceless partner /p/; bike STARTS with b — the position trap; bike also ties the like-overlap for scanners"),
    wm("b", 1, 1, 3, "tub", ["web", "cap", "bat", "mud"], "web",
      { cap: "D-RIME-NEAR", bat: "D-POSITION", mud: "D-RIME-NEAR" }),
    es("b", 1, 1, 4, "tub", "tu__", ["b", "p", "t", "m"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "tu+p, tu+t, tu+m are all non-words — the only real completion is the target"),

    // ---- d
    es("d", 1, 1, 1, "bread", "brea__", ["d", "t", "b", "g"],
      ["D-RIME-NEAR", "D-VISUAL-NEIGHBOR", "D-POSITION"],
      "t is the voicing partner; b mirrors d; brea+t/b/g are non-words"),
    pc("d", 1, 1, 2, "bread", ["road", "boat", "dog", "leaf"], "road",
      { boat: "D-RIME-NEAR", dog: "D-POSITION", leaf: "D-PATTERN-TRAP" },
      "boat ends the voiceless partner /t/; dog STARTS with d; leaf ties the bread ea-overlap for scanners"),
    wm("d", 1, 1, 3, "road", ["mud", "nut", "dig", "sun"], "mud",
      { nut: "D-RIME-NEAR", dig: "D-POSITION", sun: "D-RIME-NEAR" }),
    es("d", 1, 1, 4, "road", "roa__", ["d", "t", "b", "f"],
      ["D-RIME-NEAR", "D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR"],
      "roa+t/b/f are non-words (roar/roam deliberately kept out of the set)"),

    // ---- g
    es("g", 1, 1, 1, "flag", "fla__", ["g", "c", "f", "q"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "c is the voiceless /k/ neighbour; f is the word's first sound; fla+c/f/q are non-words"),
    pc("g", 1, 1, 2, "frog", ["flag", "duck", "goat", "sock"], "flag",
      { duck: "D-RIME-NEAR", goat: "D-POSITION", sock: "D-RIME-NEAR" },
      "duck/sock end the voiceless /k/; goat STARTS with g"),
    wm("g", 1, 1, 3, "flag", ["dig", "duck", "gum", "rock"], "dig",
      { duck: "D-RIME-NEAR", gum: "D-POSITION", rock: "D-RIME-NEAR" }),
    es("g", 1, 1, 4, "frog", "fro__", ["g", "k", "f", "j"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "fro+k/f/j are non-words"),

    // ---- l
    es("l", 1, 1, 1, "wheel", "whee__", ["l", "r", "w", "i"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "r is the liquid partner; w is the word's first sound; whee+r/w/i are non-words"),
    pc("l", 1, 1, 2, "wheel", ["shell", "deer", "lamp", "boat"], "shell",
      { deer: "D-RIME-NEAR", lamp: "D-POSITION", boat: "D-RIME-NEAR" },
      "deer ends the liquid partner /r/ and shares wheel's ee so scanning ties; lamp STARTS with l"),
    wm("l", 1, 1, 3, "wheel", ["pool", "door", "leaf", "moon"], "pool",
      { door: "D-RIME-NEAR", leaf: "D-POSITION", moon: "D-RIME-NEAR" }),
    es("l", 1, 1, 4, "whirlpool", "whirlpoo__", ["l", "r", "w", "b"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "whirlpoo+r/w/b are non-words"),

    // ================= L1 phase 2: m n p t =================
    // ---- m
    es("m", 1, 2, 1, "drum", "dru__", ["m", "n", "d", "w"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "n is the nasal partner; d is the word's first sound; dru+n/d/w are non-words"),
    pc("m", 1, 2, 2, "drum", ["jam", "pin", "map", "hen"], "jam",
      { pin: "D-RIME-NEAR", map: "D-POSITION", hen: "D-RIME-NEAR" },
      "pin/hen end the nasal partner /n/; map STARTS with the anchor's m"),
    wm("m", 1, 2, 3, "jam", ["ram", "jar", "mat", "pin"], "ram",
      { jar: "D-POSITION", mat: "D-RIME-NEAR", pin: "D-RIME-NEAR" },
      "jar starts like the anchor and ties its ja-overlap for scanners"),
    es("m", 1, 2, 4, "jam", "ja__", ["m", "n", "j", "v"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "ja+n/j/v are non-words (jaw stays out of the set)"),

    // ---- n
    es("n", 1, 2, 1, "ten", "te__", ["n", "m", "t", "u"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "m is the nasal partner; t is the word's first sound; te+m/t/u are non-words"),
    pc("n", 1, 2, 2, "pin", ["hen", "hand", "net", "drum"], "hen",
      { hand: "D-RIME-NEAR", net: "D-POSITION", drum: "D-RIME-NEAR" },
      "hand ends /d/ and shares the nd letters that tie the 'ends' overlap for scanners; net STARTS with n"),
    wm("n", 1, 2, 3, "hen", ["run", "drum", "net", "ham"], "run",
      { drum: "D-RIME-NEAR", net: "D-POSITION", ham: "D-RIME-NEAR" }),
    es("n", 1, 2, 4, "fin", "fi__", ["n", "m", "f", "u"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "fi+m/f/u are non-words"),

    // ---- p
    es("p", 1, 2, 1, "sheep", "shee__", ["p", "b", "m", "f"],
      ["D-RIME-NEAR", "D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR"],
      "b is the voicing partner; shee+b/m/f are non-words (sheet stays out)"),
    pc("p", 1, 2, 2, "cap", ["mop", "crab", "pig", "web"], "mop",
      { crab: "D-RIME-NEAR", pig: "D-POSITION", web: "D-RIME-NEAR" },
      "crab/web end the voiced partner /b/; pig STARTS with p"),
    wm("p", 1, 2, 3, "mop", ["nap", "tub", "pig", "crab"], "nap",
      { tub: "D-RIME-NEAR", pig: "D-POSITION", crab: "D-RIME-NEAR" }),
    es("p", 1, 2, 4, "sleep", "slee__", ["p", "b", "d", "m"],
      ["D-RIME-NEAR", "D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR"],
      "slee+b/d/m are non-words (sleet stays out)"),

    // ---- t
    es("t", 1, 2, 1, "net", "ne__", ["t", "d", "n", "f"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "d is the voicing partner; n is the word's first sound; ne+d/n/f are non-words"),
    pc("t", 1, 2, 2, "hat", ["boat", "hand", "toe", "bread"], "boat",
      { hand: "D-RIME-NEAR", toe: "D-POSITION", bread: "D-RIME-NEAR" },
      "hand/bread end the voiced partner /d/ and hand ties the hat ha-overlap; toe STARTS with t (tent would be a second key — excluded)"),
    wm("t", 1, 2, 3, "goat", ["wet", "mud", "toe", "bed"], "wet",
      { mud: "D-RIME-NEAR", toe: "D-POSITION", bed: "D-RIME-NEAR" }),
    es("t", 1, 2, 4, "boat", "boa__", ["t", "d", "b", "l"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "boa+d/b/l are non-words (boar stays out of the set)"),

    // ================= L2 phase 1: sh th ll ng nd =================
    // ---- sh
    es("sh", 2, 1, 1, "fish", "fi__", ["sh", "ch", "s", "f"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-POSITION"],
      "s is the sh-reduction error; f is the word's first sound; image pins the target"),
    pc("sh", 2, 1, 2, "wish", ["fish", "whisk", "wasp", "glass"], "fish",
      { whisk: "D-PATTERN-TRAP", wasp: "D-POSITION", glass: "D-RIME-NEAR" },
      "whisk shares wish's letters so scanning ties; wasp starts like the anchor; glass ends bare /s/"),
    es("sh", 2, 1, 3, "brush", "bru__", ["sh", "ch", "th", "b"],
      ["D-PATTERN-TRAP", "D-PATTERN-TRAP", "D-POSITION"]),
    es("sh", 2, 1, 4, "splash", "spla__", ["sh", "th", "s", "ck"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-PATTERN-TRAP"]),

    // ---- th
    es("th", 2, 1, 1, "moth", "mo__", ["th", "sh", "f", "m"],
      ["D-PATTERN-TRAP", "D-DEVELOPMENTAL", "D-POSITION"],
      "f is the /θ/→/f/ fronting error; image pins the target"),
    pc("th", 2, 1, 2, "bath", ["moth", "boat", "ring", "toe"], "moth",
      { boat: "D-POSITION", ring: "D-PATTERN-TRAP", toe: "D-DEVELOPMENTAL" },
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
    pc("ng", 2, 1, 2, "song", ["ring", "pin", "sock", "rock"], "ring",
      { pin: "D-DEVELOPMENTAL", sock: "D-POSITION", rock: "D-RIME-NEAR" },
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
    pc("st", 2, 2, 2, "list", ["nest", "desk", "dish", "lemon"], "nest",
      { desk: "D-PATTERN-TRAP", dish: "D-PATTERN-TRAP", lemon: "D-RIME-NEAR" },
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
    wm("b", 1, 1, 5, "web", ["tub", "cap", "wet", "mud"], "tub",
      { cap: "D-RIME-NEAR", wet: "D-POSITION", mud: "D-RIME-NEAR" },
      "wet starts like the anchor and ties its letter overlap for scanners"),
    wm("d", 1, 1, 5, "mud", ["bed", "boat", "map", "rug"], "bed",
      { boat: "D-RIME-NEAR", map: "D-POSITION", rug: "D-RIME-NEAR" }),
    es("m", 1, 1, 5, "gum", "gu__", ["m", "d", "w", "g"],
      ["D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR", "D-POSITION"],
      "gu+d/w/g are non-words (gun stays out of the set by design)"),
    es("t", 1, 2, 5, "mat", "ma__", ["t", "d", "m", "f"],
      ["D-RIME-NEAR", "D-POSITION", "D-VISUAL-NEIGHBOR"],
      "mad is real but the mat image pins the target"),
    pc("n", 1, 2, 5, "ten", ["pin", "jam", "toe", "drum"], "pin",
      { jam: "D-RIME-NEAR", toe: "D-POSITION", drum: "D-RIME-NEAR" }),
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
