// Long Vowels & Silent E — v3 authored bank (wave W1).
// Construct: silent-e (VCe) ONLY. Vowel teams live in vowel_teams now.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONICS.md §12.
// Every item hand-written; distractors rationale-coded; images are existing
// approved assets in /images/assessment/long-vowels.

import { makeImageResolver } from "../lib.mjs";

const P = (t, r) => ({ t, r });                      // distractor
const K = t => ({ t, r: "KEY", k: true });          // key
const PATTERNS = { a: "a_e", i: "i_e", o: "o_e", u: "u_e", e: "e_e" };

// Pattern-choice item: picture + blanked word → choose the VCe pattern.
const pat = (u, lvl, ph, v, img, blanked, spokenWord, distractors, extra = {}) => ({
  u, lvl, ph, v, fmt: "LONG_VOWEL_SILENT_E_PATTERN", img,
  prompt: `Look at the picture. Which pattern finishes the word: ${blanked}?`,
  spoken: `${spokenWord}. Which pattern finishes the word ${spokenWord}?`,
  choices: [K(PATTERNS[u[0]]), ...distractors.map(d => P(PATTERNS[d] || d, d === "trap" ? "D-PATTERN-TRAP" : "D-VOWEL"))],
  media: "image-required",
  note: `encode ${spokenWord} as ${PATTERNS[u[0]]}`,
  ...extra
});

// Silent-e transform: word building (add e) — all choices real words.
const add = (u, lvl, ph, v, base, made, distractors, note = "") => ({
  u, lvl, ph, v, fmt: "SILENT_E_TRANSFORM",
  prompt: `Add e to the end of ${base}. What word do you make?`,
  spoken: `Add e to the end of ${base}. What word do you make?`,
  choices: [K(made), ...distractors],
  media: "text",
  note: note || `${base} → ${made}; the no-change trap catches ignoring the e`
});

// Reverse transform (L2): take the e away.
const strip = (u, lvl, ph, v, made, base, distractors) => ({
  u, lvl, ph, v, fmt: "SILENT_E_TRANSFORM",
  prompt: `Take the silent e away from ${made}. What word is left?`,
  spoken: `Take the silent e away from ${made}. What word is left?`,
  choices: [K(base), ...distractors],
  media: "text",
  note: `${made} → ${base}; scanner picks the unchanged word and fails`
});

// Cross-pattern select (L2, legacy-eligibility CPS): find the long-vowel word.
const cps = (u, lvl, ph, v, vowel, key, distractors) => ({
  u, lvl, ph, v, fmt: "CPS", cross: `long_${vowel}`,
  prompt: `Which word has the long ${vowel} sound?`,
  spoken: `Which word has the long ${vowel} sound, the ${vowel} that says its own name?`,
  choices: [K(key), ...distractors],
  media: "text",
  note: `long-${vowel} CPS; short-vowel trap shares letters, not sound`
});

export default {
  skillId: "long_vowels_silent_e",
  skillName: "Long Vowels and Silent E",
  imageResolver: makeImageResolver(["long-vowels"]),
  items: [
    // ------------------------------ Level 1 · a_e (phase 1)
    pat("a_e", 1, 1, 1, "cake", "c_k_", "cake", ["i", "o", "u"]),
    pat("a_e", 1, 1, 2, "gate", "g_t_", "gate", ["o", "i", "u"]),
    pat("a_e", 1, 1, 3, "snake", "sn_k_", "snake", ["u", "o", "i"]),
    add("a_e", 1, 1, 4, "cap", "cape", [P("cap", "D-PATTERN-TRAP"), P("cope", "D-VOWEL"), P("cup", "D-VOWEL")]),
    add("a_e", 1, 1, 5, "tap", "tape", [P("tap", "D-PATTERN-TRAP"), P("tip", "D-VOWEL"), P("top", "D-VOWEL")]),
    add("a_e", 1, 1, 6, "man", "mane", [P("man", "D-PATTERN-TRAP"), P("mine", "D-VOWEL"), P("men", "D-VOWEL")]),

    // ------------------------------ Level 1 · i_e (phase 1)
    pat("i_e", 1, 1, 1, "kite", "k_t_", "kite", ["a", "o", "u"]),
    pat("i_e", 1, 1, 2, "five", "f_v_", "five", ["o", "a", "u"]),
    pat("i_e", 1, 1, 3, "smile", "sm_l_", "smile", ["u", "a", "o"]),
    add("i_e", 1, 1, 4, "kit", "kite", [P("kit", "D-PATTERN-TRAP"), P("bit", "D-VOWEL"), P("late", "D-VOWEL")]),
    add("i_e", 1, 1, 5, "pin", "pine", [P("pin", "D-PATTERN-TRAP"), P("pane", "D-VOWEL"), P("pen", "D-VOWEL")]),
    add("i_e", 1, 1, 6, "rid", "ride", [P("rid", "D-PATTERN-TRAP"), P("rode", "D-VOWEL"), P("red", "D-VOWEL")]),

    // ------------------------------ Level 1 · o_e (phase 2)
    pat("o_e", 1, 2, 1, "bone", "b_n_", "bone", ["a", "i", "u"]),
    pat("o_e", 1, 2, 2, "rope", "r_p_", "rope", ["i", "a", "u"]),
    pat("o_e", 1, 2, 3, "rose", "r_s_", "rose", ["u", "i", "a"]),
    add("o_e", 1, 2, 4, "hop", "hope", [P("hop", "D-PATTERN-TRAP"), P("hip", "D-VOWEL"), P("hate", "D-VOWEL")]),
    add("o_e", 1, 2, 5, "not", "note", [P("not", "D-PATTERN-TRAP"), P("net", "D-VOWEL"), P("nut", "D-VOWEL")]),
    add("o_e", 1, 2, 6, "rob", "robe", [P("rob", "D-PATTERN-TRAP"), P("ride", "D-VOWEL"), P("rub", "D-VOWEL")]),

    // ------------------------------ Level 1 · u_e (phase 2)
    pat("u_e", 1, 2, 1, "cube", "c_b_", "cube", ["a", "i", "o"]),
    pat("u_e", 1, 2, 2, "mule", "m_l_", "mule", ["o", "a", "i"]),
    pat("u_e", 1, 2, 3, "tube", "t_b_", "tube", ["i", "o", "a"]),
    add("u_e", 1, 2, 4, "cub", "cube", [P("cub", "D-PATTERN-TRAP"), P("cap", "D-VOWEL"), P("cup", "D-VOWEL")]),
    add("u_e", 1, 2, 5, "cut", "cute", [P("cut", "D-PATTERN-TRAP"), P("cot", "D-VOWEL"), P("cat", "D-VOWEL")]),
    add("u_e", 1, 2, 6, "tub", "tube", [P("tub", "D-PATTERN-TRAP"), P("tap", "D-VOWEL"), P("top", "D-VOWEL")]),

    // ------------------------------ Level 1 · e_e exposure (non-gating)
    pat("e_e", 1, 1, 1, "theme", "th_m_", "theme", ["a", "i", "o"], { nonGating: true }),
    pat("e_e", 1, 1, 2, "scene", "sc_n_", "scene", ["o", "a", "i"], { nonGating: true }),
    pat("e_e", 1, 2, 3, "these", "th_s_", "these", ["i", "o", "a"], { nonGating: true }),
    pat("e_e", 1, 2, 4, "complete", "compl_t_", "complete", ["a", "i", "o"], { nonGating: true }),

    // ------------------------------ Level 2 · a_e (phase 1)
    cps("a_e", 2, 1, 1, "a", "gate", [P("gas", "D-PATTERN-TRAP"), P("bed", "D-VOWEL"), P("kite", "D-VOWEL")]),
    cps("a_e", 2, 1, 2, "a", "cane", [P("can", "D-PATTERN-TRAP"), P("fish", "D-VOWEL"), P("rope", "D-VOWEL")]),
    strip("a_e", 2, 1, 3, "tape", "tap", [P("tape", "D-PATTERN-TRAP"), P("tip", "D-VOWEL"), P("pat", "D-VISUAL-NEIGHBOR")]),
    strip("a_e", 2, 1, 4, "made", "mad", [P("made", "D-PATTERN-TRAP"), P("mud", "D-VOWEL"), P("dam", "D-VISUAL-NEIGHBOR")]),
    pat("a_e", 2, 1, 5, "plane", "pl_n_", "plane", ["i", "o", "e"]),
    pat("a_e", 2, 1, 6, "grape", "gr_p_", "grape", ["i", "u", "o"]),

    // ------------------------------ Level 2 · i_e (phase 1)
    cps("i_e", 2, 1, 1, "i", "slide", [P("slid", "D-PATTERN-TRAP"), P("sock", "D-VOWEL"), P("cake", "D-VOWEL")]),
    cps("i_e", 2, 1, 2, "i", "shine", [P("shin", "D-PATTERN-TRAP"), P("bell", "D-VOWEL"), P("boat", "D-VOWEL")]),
    strip("i_e", 2, 1, 3, "bite", "bit", [P("bite", "D-PATTERN-TRAP"), P("bat", "D-VOWEL"), P("bet", "D-VOWEL")]),
    strip("i_e", 2, 1, 4, "ripe", "rip", [P("ripe", "D-PATTERN-TRAP"), P("rope", "D-VOWEL"), P("red", "D-VOWEL")]),
    pat("i_e", 2, 1, 5, "prize", "pr_z_", "prize", ["a", "o", "u"]),
    pat("i_e", 2, 1, 6, "slide", "sl_d_", "slide", ["o", "a", "e"]),

    // ------------------------------ Level 2 · o_e (phase 2)
    cps("o_e", 2, 2, 1, "o", "home", [P("hop", "D-PATTERN-TRAP"), P("hat", "D-VOWEL"), P("five", "D-VOWEL")]),
    cps("o_e", 2, 2, 2, "o", "stone", [P("sock", "D-PATTERN-TRAP"), P("rain", "D-VOWEL"), P("mule", "D-VOWEL")]),
    strip("o_e", 2, 2, 3, "hope", "hop", [P("hope", "D-PATTERN-TRAP"), P("hip", "D-VOWEL"), P("hen", "D-VOWEL")]),
    strip("o_e", 2, 2, 4, "robe", "rob", [P("robe", "D-PATTERN-TRAP"), P("rub", "D-VOWEL"), P("red", "D-VOWEL")]),
    {
      u: "o_e", lvl: 2, ph: 2, v: 5, fmt: "LONG_VOWEL_SILENT_E_PATTERN", img: "cone",
      prompt: "Look at the picture. Which pattern finishes the word: c_n_?",
      spoken: "Cone. Which pattern finishes the word cone?",
      choices: [K("o_e"), P("a_e", "D-PATTERN-TRAP"), P("u_e", "D-VOWEL"), P("i_e", "D-VOWEL")],
      media: "image-required",
      note: "hard item: c_n_ + a_e spells cane, a real competing word — the picture decides"
    },
    pat("o_e", 2, 2, 6, "note", "n_t_", "note", ["u", "a", "i"]),

    // ------------------------------ Level 2 · u_e (phase 2)
    cps("u_e", 2, 2, 1, "u", "cube", [P("cub", "D-PATTERN-TRAP"), P("coat", "D-VOWEL"), P("dime", "D-VOWEL")]),
    cps("u_e", 2, 2, 2, "u", "mule", [P("mud", "D-PATTERN-TRAP"), P("meet", "D-VOWEL"), P("rock", "D-VOWEL")]),
    strip("u_e", 2, 2, 3, "cube", "cub", [P("cube", "D-PATTERN-TRAP"), P("cab", "D-VOWEL"), P("bus", "D-VOWEL")]),
    strip("u_e", 2, 2, 4, "cute", "cut", [P("cute", "D-PATTERN-TRAP"), P("cot", "D-VOWEL"), P("kit", "D-VOWEL")]),
    pat("u_e", 2, 2, 5, "flute", "fl_t_", "flute", ["a", "i", "o"]),
    pat("u_e", 2, 2, 6, "huge", "h_g_", "huge", ["o", "a", "i"]),

    // ------------------------------ Retention reserve (form R, never in sittings)
    pat("a_e", 1, 1, 7, "lake", "l_k_", "lake", ["i", "o", "u"], { retention: true }),
    add("a_e", 1, 1, 8, "pan", "pane", [P("pan", "D-PATTERN-TRAP"), P("pine", "D-VOWEL"), P("pen", "D-VOWEL")]),
    cps("a_e", 2, 1, 7, "a", "late", [P("lap", "D-PATTERN-TRAP"), P("leg", "D-VOWEL"), P("log", "D-VOWEL")]),
    strip("a_e", 2, 1, 8, "cane", "can", [P("cane", "D-PATTERN-TRAP"), P("cone", "D-VOWEL"), P("pen", "D-VOWEL")]),
    pat("i_e", 1, 1, 7, "bike", "b_k_", "bike", ["a", "o", "u"], { retention: true }),
    add("i_e", 1, 1, 8, "fin", "fine", [P("fin", "D-PATTERN-TRAP"), P("fan", "D-VOWEL"), P("fun", "D-VOWEL")]),
    strip("i_e", 2, 1, 7, "hide", "hid", [P("hide", "D-PATTERN-TRAP"), P("had", "D-VOWEL"), P("hat", "D-VOWEL")]),
    cps("i_e", 2, 1, 8, "i", "time", [P("tin", "D-PATTERN-TRAP"), P("top", "D-VOWEL"), P("tray", "D-VOWEL")]),
    add("o_e", 1, 2, 7, "rod", "rode", [P("rod", "D-PATTERN-TRAP"), P("ride", "D-VOWEL"), P("red", "D-VOWEL")]),
    pat("o_e", 1, 2, 8, "home", "h_m_", "home", ["a", "i", "u"], { retention: true }),
    cps("o_e", 2, 2, 7, "o", "nose", [P("not", "D-PATTERN-TRAP"), P("nap", "D-VOWEL"), P("nine", "D-VOWEL")]),
    strip("o_e", 2, 2, 8, "rode", "rod", [P("rode", "D-PATTERN-TRAP"), P("road", "D-HOMOPHONE"), P("red", "D-VOWEL")]),
    add("u_e", 1, 2, 7, "hug", "huge", [P("hug", "D-PATTERN-TRAP"), P("hog", "D-VOWEL"), P("hat", "D-VOWEL")]),
    pat("u_e", 1, 2, 8, "cute", "c_t_", "cute", ["a", "i", "e"], { retention: true }),
    cps("u_e", 2, 2, 7, "u", "tube", [P("tub", "D-PATTERN-TRAP"), P("tent", "D-VOWEL"), P("tie", "D-VOWEL")]),
    strip("u_e", 2, 2, 8, "tube", "tub", [P("tube", "D-PATTERN-TRAP"), P("top", "D-VOWEL"), P("ten", "D-VOWEL")])
  ].map(item => {
    // Retention flags for the v7/v8 variants authored above.
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
