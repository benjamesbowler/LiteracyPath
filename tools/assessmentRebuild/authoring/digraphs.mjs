// Digraphs — v3 authored bank (wave W1, paired with long_vowels_silent_e).
// Fixes the self-answering "uses the ch digraph" template: prompts use anchor
// words, never the pattern name. Final-position coverage is real (dish, bath,
// lunch, neck…), satisfying the digraph evidence rule honestly.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md §11.

import { makeImageResolver } from "../lib.mjs";

const P = (t, r) => ({ t, r });
const fresh = item => ({ ...item, retention: false });
const K = t => ({ t, r: "KEY", k: true });
const sentenceCase = value => value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

// Image-card choice, anchor-word prompt. This is explicitly a sound-
// discrimination format: hidden picture labels do not reveal whether /w/,
// /f/, or /k/ is written wh, ph, or ck. Spelling evidence comes from the
// completion format elsewhere in every unit.
const ic = (u, lvl, ph, v, anchorWord, cards, keyWord, rationales, pos, note = "") => {
  const anchor = anchorWord.trim().toLowerCase();
  const soundPosition = pos === "final" ? "final" : "starting";
  return {
    u, lvl, ph, v, fmt: "DIGRAPH_IMAGE_CHOICE",
    // The anchor is heard, never printed; otherwise its digraph gives away
    // the spelling pattern before the child compares the sounds.
    prompt: `Which word has the same ${soundPosition} sound?`,
    spoken: `${sentenceCase(anchor)}. Which word has the same ${soundPosition} sound?`,
    cards,
    choices: cards.map(word => (word === keyWord ? K(word) : P(word, rationales[word]))),
    media: "image-required",
    pos,
    constructClaim: "digraph_sound_discrimination",
    evidenceModality: "audio+image",
    hideWrittenLabels: true,
    target: anchor,
    note
  };
};

// Complete-the-word: target picture + blanked word → choose the digraph.
const cw = (u, lvl, ph, v, _img, blanked, word, distractors, pos, note = "") => ({
  u, lvl, ph, v, fmt: "DIGRAPH_COMPLETE_WORD",
  prompt: `${u === "ch" ? "Select" : "Choose"} the missing letters for ${blanked}.`,
  spoken: `${sentenceCase(word)}. Choose the missing letters.`,
  choices: [K(u), ...distractors.map(d => P(d, "D-PATTERN-TRAP"))],
  media: "audio-required",
  target: word,
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
      "chair",
      ["cheese", "whale", "thorn", "clock"], "cheese",
      { whale: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP", clock: "D-ONSET" },
      "initial", "whale ties the which/ch letter overlap so print scanning cannot win"),
    ic("ch", 1, 1, 2,
      "chair",
      ["chick", "wheel", "shell", "cake"], "chick",
      { wheel: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", cake: "D-ONSET" },
      "initial"),
    cw("ch", 1, 1, 3, "chain", "__ain", "chain", ["sh", "th", "wh"], "initial"),
    cw("ch", 1, 1, 4, "cherry", "__erry", "cherry", ["sh", "wh", "ph"], "initial"),
    // ch (L2 phase 1 · final)
    cw("ch", 2, 1, 1, "bench", "ben__", "bench", ["sh", "th", "ck"], "final"),
    cw("ch", 2, 1, 2, "watch", "wat__", "watch", ["sh", "th", "ck"], "final"),
    ic("ch", 2, 1, 3,
      "lunch",
      ["watch", "wheel", "tooth", "clock"], "watch",
      { wheel: "D-POSITION", tooth: "D-PATTERN-TRAP", clock: "D-PATTERN-TRAP" },
      "final", "wheel ties the prompt overlap; tooth/clock are rival final sounds"),
    ic("ch", 2, 1, 4,
      "watch",
      ["bench", "wheel", "tooth", "clock"], "bench",
      { wheel: "D-POSITION", tooth: "D-PATTERN-TRAP", clock: "D-PATTERN-TRAP" },
      "final"),

    // ------------------------------ sh (L1 phase 1 · initial)
    ic("sh", 1, 1, 1,
      "shell",
      ["ship", "chick", "thorn", "sun"], "ship",
      { chick: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP", sun: "D-ONSET" },
      "initial", "chick is the scanner decoy: its letters overlap 'which' more than the key does"),
    ic("sh", 1, 1, 2,
      "shell",
      ["shoe", "chain", "whale", "thorn"], "shoe",
      { chain: "D-PATTERN-TRAP", whale: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial"),
    cw("sh", 1, 1, 3, "ship", "__ip", "ship", ["ch", "wh", "th"], "initial"),
    cw("sh", 1, 1, 4, "shirt", "__irt", "shirt", ["ch", "th", "wh"], "initial"),
    // sh (L2 phase 1 · final)
    cw("sh", 2, 1, 1, "fish", "fi__", "fish", ["ch", "th", "ck"], "final"),
    cw("sh", 2, 1, 2, "brush", "bru__", "brush", ["ch", "ck", "th"], "final"),
    ic("sh", 2, 1, 3,
      "fish",
      ["brush", "chick", "thorn", "lock"], "brush",
      { chick: "D-PATTERN-TRAP", thorn: "D-POSITION", lock: "D-PATTERN-TRAP" },
      "final"),
    ic("sh", 2, 1, 4,
      "brush",
      ["fish", "chick", "tooth", "wheel"], "fish",
      { chick: "D-PATTERN-TRAP", tooth: "D-PATTERN-TRAP", wheel: "D-POSITION" },
      "final"),

    // ------------------------------ th (L1 phase 1 · initial)
    ic("th", 1, 1, 1,
      "thumb",
      ["thorn", "chick", "shell", "tie"], "thorn",
      { chick: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", tie: "D-ONSET" },
      "initial", "tie begins with plain /t/, the classic th-versus-t error"),
    ic("th", 1, 1, 2,
      "thin",
      ["thorn", "chick", "shoe", "tree"], "thorn",
      { chick: "D-PATTERN-TRAP", shoe: "D-PATTERN-TRAP", tree: "D-ONSET" },
      "initial", "a different heard anchor uses an approved thorn picture instead of the rejected thumbs-up gesture"),
    cw("th", 1, 1, 3, "thumb", "__umb", "thumb", ["ch", "sh", "wh"], "initial"),
    cw("th", 1, 1, 4, "thorn", "__orn", "thorn", ["sh", "ch", "ph"], "initial"),
    // th (L2 phase 1 · final)
    cw("th", 2, 1, 1, "tooth", "too__", "tooth", ["sh", "ch", "ck"], "final"),
    cw("th", 2, 1, 2, "bath", "ba__", "bath", ["sh", "ck", "ch"], "final"),
    ic("th", 2, 1, 3,
      "moth",
      ["tooth", "chick", "shirt", "lock"], "tooth",
      { chick: "D-PATTERN-TRAP", shirt: "D-POSITION", lock: "D-PATTERN-TRAP" },
      "final"),
    ic("th", 2, 1, 4,
      "bath",
      ["tooth", "chick", "wheel", "clock"], "tooth",
      { chick: "D-PATTERN-TRAP", wheel: "D-POSITION", clock: "D-PATTERN-TRAP" },
      "final"),

    // ------------------------------ wh (L1 phase 2 · initial, position-exempt)
    ic("wh", 1, 2, 1,
      "whale",
      ["wheel", "chick", "shell", "thorn"], "wheel",
      { chick: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial"),
    ic("wh", 1, 2, 2,
      "whale",
      ["watch", "cheese", "sheep", "tiger"], "watch",
      { cheese: "D-PATTERN-TRAP", sheep: "D-PATTERN-TRAP", tiger: "D-ONSET" },
      "initial"),
    cw("wh", 1, 2, 3, "wheel", "__eel", "wheel", ["sh", "ch", "th"], "initial"),
    cw("wh", 1, 2, 4, "whistle", "__istle", "whistle", ["th", "sh", "ch"], "initial"),
    // wh (L2 phase 2 · harder initial)
    cw("wh", 2, 2, 1, "wheelbarrow", "__eelbarrow", "wheelbarrow", ["sh", "ch", "th"], "initial"),
    cw("wh", 2, 2, 2, "whisker", "__isker", "whisker", ["th", "sh", "ph"], "initial"),
    ic("wh", 2, 2, 3,
      "whistle",
      ["whale", "chick", "thorn", "shark"], "whale",
      { chick: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP", shark: "D-PATTERN-TRAP" },
      "initial"),
    ic("wh", 2, 2, 4,
      "whale",
      ["web", "thorn", "cheese", "shell"], "web",
      { thorn: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP" },
      "initial", "prompt avoids 'which' so no card outruns the anchor overlap"),

    // ------------------------------ ph (L1 phase 2 · initial, position-exempt)
    ic("ph", 1, 2, 1,
      "photo",
      ["fan", "chick", "shell", "thorn"], "fan",
      { chick: "D-PATTERN-TRAP", shell: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial", "the spoken ph anchor is matched to a directly nameable /f/ picture; spelling evidence is carried by the completion items"),
    ic("ph", 1, 2, 2,
      "phone",
      ["fox", "chick", "sheep", "thorn"], "fox",
      { chick: "D-PATTERN-TRAP", sheep: "D-PATTERN-TRAP", thorn: "D-PATTERN-TRAP" },
      "initial", "fox is a directly nameable /f/ card; the hidden label does not ask a child to identify a pheasant species"),
    cw("ph", 1, 2, 3, "phone", "__one", "phone", ["wh", "sh", "th"], "initial"),
    cw("ph", 1, 2, 4, "photo", "__oto", "photo", ["sh", "ch", "wh"], "initial"),
    // ph (L2 phase 2 · medial/final)
    cw("ph", 2, 2, 1, "dolphin", "dol__in", "dolphin", ["sh", "ch", "th"], "medial"),
    cw("ph", 2, 2, 2, "elephant", "ele__ant", "elephant", ["sh", "wh", "th"], "medial"),
    cw("ph", 2, 2, 3, "graph", "gra__", "graph", ["sh", "ck", "th"], "final",
      "graph is the rare real final-ph child word — bonus final exposure for an exempt unit"),
    ic("ph", 2, 2, 4,
      "photo",
      ["phone", "chick", "cheese", "shark"], "phone",
      { chick: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP", shark: "D-PATTERN-TRAP" },
      "initial"),

    // ------------------------------ ck (final-only unit)
    cw("ck", 1, 2, 1, "duck", "du__", "duck", ["ch", "sh", "th"], "final"),
    cw("ck", 1, 2, 2, "sock", "so__", "sock", ["sh", "ch", "th"], "final"),
    ic("ck", 1, 2, 3,
      "duck",
      ["clock", "ship", "tooth", "shell"], "clock",
      { ship: "D-PATTERN-TRAP", tooth: "D-PATTERN-TRAP", shell: "D-POSITION" },
      "final", "the concrete clock card carries final /k/; the other cards end /p/, /th/, and /l/"),
    ic("ck", 1, 2, 4,
      "rock",
      ["brick", "ship", "fish", "tooth"], "brick",
      { ship: "D-PATTERN-TRAP", fish: "D-PATTERN-TRAP", tooth: "D-POSITION" },
      "final"),
    cw("ck", 2, 2, 1, "brick", "bri__", "brick", ["sh", "ch", "th"], "final"),
    cw("ck", 2, 2, 2, "clock", "clo__", "clock", ["sh", "th", "ch"], "final"),
    cw("ck", 2, 2, 3, "neck", "ne__", "neck", ["sh", "ch", "th"], "final"),
    ic("ck", 2, 2, 4,
      "neck",
      ["brick", "ship", "tooth", "whale"], "brick",
      { ship: "D-PATTERN-TRAP", tooth: "D-PATTERN-TRAP", whale: "D-POSITION" },
      "final"),

    // Fresh spellings cover a wider range of word positions and lengths.
    fresh(cw("ch", 1, 1, 5, "chin", "__in", "chin", ["sh", "th", "wh"], "initial")),
    fresh(cw("ch", 1, 1, 6, "chat", "__at", "chat", ["sh", "th", "wh"], "initial")),
    fresh(cw("ch", 1, 1, 9, "chop", "__op", "chop", ["sh", "th", "wh"], "initial")),
    fresh(cw("sh", 1, 1, 5, "shop", "__op", "shop", ["ch", "th", "wh"], "initial")),
    fresh(cw("sh", 1, 1, 6, "shed", "__ed", "shed", ["ch", "th", "wh"], "initial")),
    fresh(cw("sh", 1, 1, 9, "shark", "__ark", "shark", ["ch", "th", "wh"], "initial")),
    fresh(cw("th", 1, 1, 5, "thin", "__in", "thin", ["ch", "sh", "wh"], "initial")),
    fresh(cw("th", 1, 1, 6, "thick", "__ick", "thick", ["ch", "sh", "wh"], "initial")),
    fresh(cw("wh", 1, 2, 5, "when", "__en", "when", ["ch", "sh", "th"], "initial")),
    fresh(cw("wh", 1, 2, 6, "whip", "__ip", "whip", ["ch", "sh", "th"], "initial")),
    fresh(cw("wh", 1, 2, 9, "white", "__ite", "white", ["ch", "sh", "th"], "initial")),
    fresh(cw("ph", 1, 2, 5, "phrase", "__rase", "phrase", ["ch", "sh", "th"], "initial")),
    fresh(cw("ph", 1, 2, 6, "phonics", "__onics", "phonics", ["ch", "sh", "th"], "initial")),
    fresh(ic("ph", 1, 2, 9, "photograph", ["feather", "van", "tooth", "cheese"], "feather",
      { van: "D-ONSET", tooth: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP" }, "initial",
      "the photograph anchor is heard; a printed second ph cannot reveal the spelling choice")),
    fresh(cw("ck", 1, 2, 5, "lock", "lo__", "lock", ["ch", "sh", "th"], "final")),
    fresh(cw("ck", 1, 2, 6, "pack", "pa__", "pack", ["ch", "sh", "th"], "final")),
    fresh(cw("ch", 2, 1, 5, "speech", "spee__", "speech", ["sh", "th", "wh"], "final")),
    fresh(cw("ch", 2, 1, 6, "peach", "pea__", "peach", ["sh", "th", "wh"], "final")),
    fresh(cw("ch", 2, 1, 9, "coach", "coa__", "coach", ["sh", "th", "wh"], "final")),
    fresh(cw("sh", 2, 1, 5, "crash", "cra__", "crash", ["ch", "th", "wh"], "final")),
    fresh(cw("sh", 2, 1, 6, "finish", "fini__", "finish", ["ch", "th", "wh"], "final")),
    fresh(cw("sh", 2, 1, 9, "fresh", "fre__", "fresh", ["ch", "th", "wh"], "final")),
    fresh(cw("th", 2, 1, 5, "path", "pa__", "path", ["ch", "sh", "wh"], "final")),
    fresh(cw("th", 2, 1, 6, "teeth", "tee__", "teeth", ["ch", "sh", "wh"], "final")),
    fresh(cw("wh", 2, 2, 5, "whisper", "__isper", "whisper", ["ch", "sh", "th"], "initial")),
    fresh(cw("wh", 2, 2, 6, "whisk", "__isk", "whisk", ["ch", "sh", "th"], "initial")),
    fresh(cw("wh", 2, 2, 9, "whenever", "__enever", "whenever", ["ch", "sh", "th"], "initial")),
    fresh(cw("ph", 2, 2, 5, "alphabet", "al__abet", "alphabet", ["ch", "sh", "th"], "medial")),
    fresh(cw("ph", 2, 2, 6, "trophy", "tro__y", "trophy", ["ch", "sh", "th"], "medial")),
    fresh(cw("ph", 2, 2, 9, "telephone", "tele__one", "telephone", ["ch", "sh", "th"], "medial")),
    fresh(cw("ck", 2, 2, 5, "pocket", "po__et", "pocket", ["ch", "sh", "th"], "medial")),
    fresh(cw("ck", 2, 2, 6, "snack", "sna__", "snack", ["ch", "sh", "th"], "final")),

    // ------------------------------ Retention reserve (form R)
    cw("ch", 1, 1, 7, "chip", "__ip", "chip", ["sh", "wh", "th"], "initial",
      "The heard chip distinguishes the same visible blank from ship without relying on a picture."),
    cw("ch", 2, 1, 8, "lunch", "lun__", "lunch", ["sh", "th", "ck"], "final"),
    ic("sh", 1, 1, 7,
      "shell",
      ["sheep", "chain", "whale", "tooth"], "sheep",
      { chain: "D-PATTERN-TRAP", whale: "D-PATTERN-TRAP", tooth: "D-PATTERN-TRAP" },
      "initial"),
    cw("sh", 2, 1, 8, "dish", "di__", "dish", ["ch", "th", "ck"], "final"),
    cw("th", 1, 1, 7, "three", "__ree", "three", ["ch", "sh", "wh"], "initial"),
    cw("th", 2, 1, 8, "moth", "mo__", "moth", ["sh", "ch", "ck"], "final"),
    cw("wh", 1, 2, 7, "wheat", "__eat", "wheat", ["ch", "sh", "th"], "initial"),
    ic("wh", 2, 2, 8,
      "whisker",
      ["wheel", "thorn", "cheese", "ship"], "wheel",
      { thorn: "D-PATTERN-TRAP", cheese: "D-PATTERN-TRAP", ship: "D-PATTERN-TRAP" },
      "initial"),
    cw("ph", 1, 2, 7, "headphones", "head__ones", "headphones", ["sh", "ch", "th"], "medial"),
    cw("ph", 2, 2, 8, "microphone", "micro__one", "microphone", ["sh", "wh", "th"], "medial"),
    cw("ck", 1, 2, 7, "truck", "tru__", "truck", ["ch", "sh", "th"], "final"),
    cw("ck", 2, 2, 8, "stick", "sti__", "stick", ["sh", "ch", "th"], "final"),
    cw("ch", 1, 1, 10, "chest", "__est", "chest", ["sh", "th", "wh"], "initial",
      "A new heard lexical target tests initial ch in a consonant-cluster word."),
    cw("ck", 1, 2, 9, "back", "ba__", "back", ["ch", "sh", "th"], "final",
      "The heard back distinguishes final ck from the real bath contrast."),
    cw("ch", 2, 1, 10, "beach", "bea__", "beach", ["sh", "th", "ck"], "final",
      "Final ch transfers to a new heard word with a vowel team."),
    cw("ck", 2, 2, 9, "ticket", "ti__et", "ticket", ["sh", "ch", "th"], "medial",
      "A new two-syllable word tests medial ck without repeated printed pattern clues.")
  ].map(item => {
    if (item.v >= 7 && item.retention !== false) item.retention = true;
    return item;
  })
};
