// Digraphs — v3 authored bank (wave W1, paired with long_vowels_silent_e).
// Fixes the self-answering "uses the ch digraph" template: prompts use anchor
// words, never the pattern name. Final-position coverage is real (dish, bath,
// lunch, neck…), satisfying the digraph evidence rule honestly.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md §11.

import { makeImageResolver } from "../lib.mjs";

const P = (t, r) => ({ t, r });
const K = t => ({ t, r: "KEY", k: true });

// Image-card choice, anchor-word prompt. Cards render pictures + labels; the
// prompt vocabulary is chosen so letter-chunk scanning always ties (see notes).
const ic = (u, lvl, ph, v, prompt, spoken, cards, keyWord, rationales, pos, note = "") => ({
  u, lvl, ph, v, fmt: "DIGRAPH_IMAGE_CHOICE",
  prompt, spoken,
  cards,
  choices: cards.map(word => (word === keyWord ? K(word) : P(word, rationales[word]))),
  media: "image-required",
  pos,
  // Matching the printed/spoken digraph pattern is the intended phonics
  // construct, so a same-letter oracle is not an illicit shortcut here.
  scannerExpected: true,
  note
});

// Complete-the-word: target picture + blanked word → choose the digraph.
const cw = (u, lvl, ph, v, img, blanked, word, distractors, pos, note = "") => ({
  u, lvl, ph, v, fmt: "DIGRAPH_COMPLETE_WORD", img,
  prompt: `Finish the word: ${blanked}`,
  spoken: `${word}. Finish the word ${word}.`,
  choices: [K(u), ...distractors.map(d => P(d, "D-PATTERN-TRAP"))],
  media: "image-required",
  pos,
  note: note || `${word}: the blank hides the digraph, so nothing leaks in print`
});

export default {
  skillId: "digraphs",
  skillName: "Digraphs",
  imageResolver: makeImageResolver(["digraphs", "blends", "long-vowels", "hfw"]),
  items: [
    // ------------------------------ ch (L1 phase 1 · initial)
    ic("ch", 1, 1, 1,
      "Which one starts like chair?", "Chair. Which one starts with the same sound as chair?",
      ["cheese", "whale", "thorn", "sock"], "cheese",
      { whale: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP", sock: "D-ONSET" },
      "initial", "whale ties the which/ch letter overlap so print scanning cannot win"),
    ic("ch", 1, 1, 2,
      "Which one starts with the same sound as chair?", "Chair. Which one starts with the same sound as chair?",
      ["chip", "wheel", "shell", "cake"], "chip",
      { wheel: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", cake: "D-ONSET" },
      "initial"),
    cw("ch", 1, 1, 3, "chain", "__ain", "chain", ["sh", "th", "wh"], "initial"),
    cw("ch", 1, 1, 4, "cherry", "__erry", "cherry", ["sh", "wh", "ph"], "initial"),
    // ch (L2 phase 1 · final)
    cw("ch", 2, 1, 1, "bench", "ben__", "bench", ["sh", "th", "ck"], "final"),
    cw("ch", 2, 1, 2, "watch", "wat__", "watch", ["sh", "th", "ck"], "final"),
    ic("ch", 2, 1, 3,
      "Which one ends like lunch?", "Lunch. Which one ends with the same sound as lunch?",
      ["watch", "wheel", "moth", "sock"], "watch",
      { wheel: "D-POSITION", moth: "D-PATTERN-TRAP", sock: "D-PATTERN-TRAP" },
      "final", "wheel ties the which-overlap; moth/sock are rival final sounds"),
    ic("ch", 2, 1, 4,
      "Which one ends with the same sound as watch?", "Watch. Which one ends with the same sound as watch?",
      ["bench", "whisk", "tooth", "rock"], "bench",
      { whisk: "D-POSITION", tooth: "D-PATTERN-TRAP", rock: "D-PATTERN-TRAP" },
      "final"),

    // ------------------------------ sh (L1 phase 1 · initial)
    ic("sh", 1, 1, 1,
      "Which one starts like shell?", "Shell. Which one starts with the same sound as shell?",
      ["ship", "chick", "thumb", "sun"], "ship",
      { chick: "D-PATTERN-TRAP", thumb: "D-PATTERN-TRAP", sun: "D-ONSET" },
      "initial", "chick is the scanner decoy: its letters overlap 'which' more than the key does"),
    ic("sh", 1, 1, 2,
      "Which one starts with the same sound as shell?", "Shell. Which one starts with the same sound as shell?",
      ["shoe", "chain", "whisk", "thorn"], "shoe",
      { chain: "D-PATTERN-TRAP", whisk: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial"),
    cw("sh", 1, 1, 3, "ship", "__ip", "ship", ["ch", "wh", "th"], "initial"),
    cw("sh", 1, 1, 4, "shirt", "__irt", "shirt", ["ch", "th", "wh"], "initial"),
    // sh (L2 phase 1 · final)
    cw("sh", 2, 1, 1, "fish", "fi__", "fish", ["ch", "th", "ck"], "final"),
    cw("sh", 2, 1, 2, "brush", "bru__", "brush", ["ch", "ck", "th"], "final"),
    ic("sh", 2, 1, 3,
      "Which one ends like fish?", "Fish. Which one ends with the same sound as fish?",
      ["brush", "chick", "thorn", "lock"], "brush",
      { chick: "D-PATTERN-TRAP", thorn: "D-POSITION", lock: "D-PATTERN-TRAP" },
      "final"),
    ic("sh", 2, 1, 4,
      "Which one ends with the same sound as brush?", "Brush. Which one ends with the same sound as brush?",
      ["dish", "chip", "moth", "wheel"], "dish",
      { chip: "D-PATTERN-TRAP", moth: "D-PATTERN-TRAP", wheel: "D-POSITION" },
      "final"),

    // ------------------------------ th (L1 phase 1 · initial)
    ic("th", 1, 1, 1,
      "Which one starts like thumb?", "Thumb. Which one starts with the same sound as thumb?",
      ["three", "chip", "shell", "tooth"], "three",
      { chip: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", tooth: "D-POSITION" },
      "initial", "tooth STARTS with t — th is at its end, the classic position error"),
    ic("th", 1, 1, 2,
      "Which one starts with the same sound as thumb?", "Thumb. Which one starts with the same sound as thumb?",
      ["thread", "cherry", "shoe", "tree"], "thread",
      { cherry: "D-PATTERN-TRAP", shoe: "D-PATTERN-TRAP", tree: "D-ONSET" },
      "initial"),
    cw("th", 1, 1, 3, "thumb", "__umb", "thumb", ["ch", "sh", "wh"], "initial"),
    cw("th", 1, 1, 4, "thorn", "__orn", "thorn", ["sh", "ch", "ph"], "initial"),
    // th (L2 phase 1 · final)
    cw("th", 2, 1, 1, "tooth", "too__", "tooth", ["sh", "ch", "ck"], "final"),
    cw("th", 2, 1, 2, "bath", "ba__", "bath", ["sh", "ck", "ch"], "final"),
    ic("th", 2, 1, 3,
      "Which one ends like bath?", "Bath. Which one ends with the same sound as bath?",
      ["moth", "chick", "shirt", "lock"], "moth",
      { chick: "D-PATTERN-TRAP", shirt: "D-POSITION", lock: "D-PATTERN-TRAP" },
      "final"),
    ic("th", 2, 1, 4,
      "Which one ends with the same sound as tooth?", "Tooth. Which one ends with the same sound as tooth?",
      ["bath", "chip", "whisk", "sock"], "bath",
      { chip: "D-PATTERN-TRAP", whisk: "D-POSITION", sock: "D-PATTERN-TRAP" },
      "final"),

    // ------------------------------ wh (L1 phase 2 · initial, position-exempt)
    ic("wh", 1, 2, 1,
      "Which one starts like whale?", "Whale. Which one starts with the same sound as whale?",
      ["wheel", "chick", "shell", "watch"], "wheel",
      { chick: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", watch: "D-ONSET" },
      "initial"),
    ic("wh", 1, 2, 2,
      "Which one starts with the same sound as whale?", "Whale. Which one starts with the same sound as whale?",
      ["whisk", "cheese", "sheep", "wasp"], "whisk",
      { cheese: "D-PATTERN-TRAP", sheep: "D-PATTERN-TRAP", wasp: "D-ONSET" },
      "initial"),
    cw("wh", 1, 2, 3, "wheel", "__eel", "wheel", ["sh", "ch", "th"], "initial"),
    cw("wh", 1, 2, 4, "whistle", "__istle", "whistle", ["th", "sh", "ch"], "initial"),
    // wh (L2 phase 2 · harder initial)
    cw("wh", 2, 2, 1, "wheelbarrow", "__eelbarrow", "wheelbarrow", ["sh", "ch", "th"], "initial"),
    cw("wh", 2, 2, 2, "whisker", "__isker", "whisker", ["th", "sh", "ph"], "initial"),
    ic("wh", 2, 2, 3,
      "Which one starts like whistle?", "Whistle. Which one starts with the same sound as whistle?",
      ["whirlpool", "chick", "thread", "shark"], "whirlpool",
      { chick: "D-PATTERN-TRAP", thread: "D-PATTERN-TRAP", shark: "D-PATTERN-TRAP" },
      "initial"),
    ic("wh", 2, 2, 4,
      "Listen: whale. Find the one that starts the same.", "Whale. Find the one that starts the same as whale.",
      ["wheat", "thorn", "cheese", "shell"], "wheat",
      { thorn: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP" },
      "initial", "prompt avoids 'which' so no card outruns the anchor overlap"),

    // ------------------------------ ph (L1 phase 2 · initial, position-exempt)
    ic("ph", 1, 2, 1,
      "Which one starts like phone?", "Phone. Which one starts with the same sound as phone?",
      ["photo", "chick", "shell", "thorn"], "photo",
      { chick: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial"),
    ic("ph", 1, 2, 2,
      "Which one starts with the same sound as phone?", "Phone. Which one starts with the same sound as phone?",
      ["pheasant", "chip", "sheep", "three"], "pheasant",
      { chip: "D-PATTERN-TRAP", sheep: "D-PATTERN-TRAP", three: "D-PATTERN-TRAP" },
      "initial"),
    cw("ph", 1, 2, 3, "phone", "__one", "phone", ["wh", "sh", "th"], "initial"),
    cw("ph", 1, 2, 4, "photo", "__oto", "photo", ["sh", "ch", "wh"], "initial"),
    // ph (L2 phase 2 · medial/final)
    cw("ph", 2, 2, 1, "dolphin", "dol__in", "dolphin", ["sh", "ch", "th"], "medial"),
    cw("ph", 2, 2, 2, "elephant", "ele__ant", "elephant", ["sh", "wh", "th"], "medial"),
    cw("ph", 2, 2, 3, "graph", "gra__", "graph", ["sh", "ck", "th"], "final",
      "graph is the rare real final-ph child word — bonus final exposure for an exempt unit"),
    ic("ph", 2, 2, 4,
      "Which one starts like photo?", "Photo. Which one starts with the same sound as photo?",
      ["phone", "chick", "cherry", "shark"], "phone",
      { chick: "D-PATTERN-TRAP", cherry: "D-PATTERN-TRAP", shark: "D-PATTERN-TRAP" },
      "initial"),

    // ------------------------------ ck (final-only unit)
    cw("ck", 1, 2, 1, "duck", "du__", "duck", ["ch", "sh", "th"], "final"),
    cw("ck", 1, 2, 2, "sock", "so__", "sock", ["sh", "ch", "th"], "final"),
    ic("ck", 1, 2, 3,
      "Which one ends like duck?", "Duck. Which one ends with the same sound as duck?",
      ["rock", "chip", "moth", "shell"], "rock",
      { chip: "D-PATTERN-TRAP", moth: "D-PATTERN-TRAP", shell: "D-POSITION" },
      "final", "chip ties the which-overlap; -ock keys are avoided when the anchor is -ock"),
    ic("ck", 1, 2, 4,
      "Which one ends with the same sound as rock?", "Rock. Which one ends with the same sound as rock?",
      ["brick", "chip", "dish", "thread"], "brick",
      { chip: "D-PATTERN-TRAP", dish: "D-PATTERN-TRAP", thread: "D-POSITION" },
      "final"),
    cw("ck", 2, 2, 1, "brick", "bri__", "brick", ["sh", "ch", "th"], "final"),
    cw("ck", 2, 2, 2, "clock", "clo__", "clock", ["sh", "th", "ch"], "final"),
    cw("ck", 2, 2, 3, "neck", "ne__", "neck", ["sh", "ch", "th"], "final"),
    ic("ck", 2, 2, 4,
      "Which one ends like neck?", "Neck. Which one ends with the same sound as neck?",
      ["stick", "chip", "moth", "whale"], "stick",
      { chip: "D-PATTERN-TRAP", moth: "D-PATTERN-TRAP", whale: "D-POSITION" },
      "final"),

    // ------------------------------ Retention reserve (form R)
    cw("ch", 1, 1, 7, "chip", "__ip", "chip", ["sh", "wh", "th"], "initial",
      "same blank as ship's item, different picture — a true minimal pair across sittings"),
    cw("ch", 2, 1, 8, "lunch", "lun__", "lunch", ["sh", "th", "ck"], "final"),
    ic("sh", 1, 1, 7,
      "Which one starts like shell?", "Shell. Which one starts with the same sound as shell?",
      ["sheep", "chain", "whisk", "tooth"], "sheep",
      { chain: "D-PATTERN-TRAP", whisk: "D-PATTERN-TRAP", tooth: "D-POSITION" },
      "initial"),
    cw("sh", 2, 1, 8, "dish", "di__", "dish", ["ch", "th", "ck"], "final"),
    cw("th", 1, 1, 7, "three", "__ree", "three", ["ch", "sh", "wh"], "initial"),
    cw("th", 2, 1, 8, "moth", "mo__", "moth", ["sh", "ch", "ck"], "final"),
    cw("wh", 1, 2, 7, "wheat", "__eat", "wheat", ["ch", "sh", "th"], "initial"),
    ic("wh", 2, 2, 8,
      "Listen: whale. Find the one that starts the same.", "Whale. Find the one that starts the same as whale.",
      ["white", "thorn", "cheese", "ship"], "white",
      { thorn: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP", ship: "D-PATTERN-TRAP" },
      "initial"),
    cw("ph", 1, 2, 7, "headphones", "head__ones", "headphones", ["sh", "ch", "th"], "medial"),
    cw("ph", 2, 2, 8, "microphone", "micro__one", "microphone", ["sh", "wh", "th"], "medial"),
    cw("ck", 1, 2, 7, "truck", "tru__", "truck", ["ch", "sh", "th"], "final"),
    cw("ck", 2, 2, 8, "stick", "sti__", "stick", ["sh", "ch", "th"], "final")
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
