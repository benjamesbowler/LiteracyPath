// Initial Sounds — v3 authored bank (wave W3, paired with final_sounds).
// Construct: isolate the FIRST sound of a pictured/printed word, link it to its
// letter. 25 units (a–z minus x), D-large. Two formats:
//   FIRST_SOUND — word (+image when a real asset exists) → 4 single-letter
//     choices. Letter choices are scanner-null by construction (no ≥2-letter
//     chunks), so every item's difficulty lives in the letter set itself.
//   INITIAL_SOUND_PAIR_SELECT — "Which one starts like ⟨anchor⟩?" over 4 image
//     cards (v3 semantics: single-select; the legacy tap-two enrichment keys on
//     questionType and never touches these).
// Letter-set craft rules applied to every FIRST_SOUND item:
//   - onset neighbour (D-ONSET) is a letter that can NEVER legitimately spell
//     the target onset (c/k, g/j, q/k, s/c traps are excluded as false
//     distractors — k never appears in c-items, g never in j-items, c/k never
//     in q-items, c never in s-items).
//   - D-VISUAL-NEIGHBOR is a shape confusion (b/d, p/q, m/w, n/u, i/l, e/c…).
//   - D-POSITION is the word's FINAL sound letter — the classic error.
//   - vowels discriminate against other short vowels (D-VOWEL).
// L2 pressure: longer words in print + onset-NEIGHBOUR card sets (s/z, b/p,
// m/n, f/v, t/d, k/g, r/w, j/y) on pair-select.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_PHONOLOGICAL.md §1.

import { makeImageResolver } from "../lib.mjs";

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const resolver = makeImageResolver(["digraphs", "blends", "long-vowels", "hfw"]);

// FIRST_SOUND: word in prompt, image attached when the asset exists.
const fs = (u, lvl, ph, v, word, letters, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "FIRST_SOUND",
  prompt: `Which letter makes the first sound in ${word}?`,
  spoken: `${word}. Which letter makes the first sound in ${word}?`,
  choices: letters.map((l, i) => (i === 0 ? K(l) : P(l, rationales[i - 1]))),
  media: resolver(word) ? "image-optional" : "text",
  img: resolver(word) ? word : undefined,
  target: word,
  note
});

// INITIAL_SOUND_PAIR_SELECT: anchor in prompt, 4 image cards, single select.
// frame "listen" drops the word "like" from the printed prompt — used when a
// card would otherwise out-chunk the rest on the like/kite letter overlap.
const ps = (u, lvl, ph, v, anchor, cards, keyWord, rationales, note = "", frame = "which") => ({
  u, lvl, ph, v, fmt: "INITIAL_SOUND_PAIR_SELECT",
  prompt: frame === "listen"
    ? `Listen: ${anchor}. Find the one that starts the same.`
    : `Which one starts like ${anchor}?`,
  spoken: `${anchor}. Which one starts with the same sound as ${anchor}?`,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w]))),
  media: "image-required",
  evidenceModality: "audio+image",
  constructClaim: "initial_sound_discrimination",
  hideWrittenLabels: true,
  pos: "initial",
  target: anchor,
  note
});

// Rationale orders below follow the letter arrays: [onset-nb, visual-nb, position/free].
const ONV = ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"];
const VOW = ["D-VOWEL", "D-VOWEL", "D-POSITION"];

export default {
  skillId: "initial_sounds",
  skillName: "Initial Sounds",
  imageResolver: resolver,
  items: [
    // ---------------- a (phase 1)
    fs("a", 1, 1, 1, "apple", ["a", "e", "o", "l"], VOW),
    fs("a", 1, 1, 2, "ant", ["a", "e", "o", "t"], VOW),
    ps("a", 1, 1, 3, "ant", ["apple", "egg", "igloo", "ox"], "apple",
      { egg: "D-VOWEL", igloo: "D-VOWEL", ox: "D-VOWEL" }),
    fs("a", 2, 1, 1, "astronaut", ["a", "u", "o", "t"], VOW),
    fs("a", 2, 1, 2, "alligator", ["a", "e", "i", "r"], VOW),
    ps("a", 2, 1, 3, "apple", ["ant", "elephant", "insect", "umbrella"], "ant",
      { elephant: "D-VOWEL", insect: "D-VOWEL", umbrella: "D-VOWEL" }),

    // ---------------- b (phase 1)
    fs("b", 1, 1, 1, "boat", ["b", "p", "d", "t"], ONV),
    fs("b", 1, 1, 2, "bike", ["b", "p", "d", "k"], ONV),
    ps("b", 1, 1, 3, "boat", ["bike", "pig", "web", "duck"], "bike",
      { pig: "D-ONSET", web: "D-POSITION", duck: "D-SEMANTIC" },
      "web ends with /b/ — the position trap; duck shares the water scene",
      "listen"),
    fs("b", 2, 1, 1, "banana", ["b", "p", "d", "a"], ONV),
    fs("b", 2, 1, 2, "butterfly", ["b", "p", "d", "y"], ONV),
    ps("b", 2, 1, 3, "bread", ["bike", "pen", "pot", "dish"], "bike",
      { pen: "D-ONSET", pot: "D-ONSET", dish: "D-ONSET" },
      "all-neighbour card set: b against p/p/d voicing-place pressure",
      "listen"),

    // ---------------- c (phase 1) — k never appears (it spells /k/ too)
    fs("c", 1, 1, 1, "corn", ["c", "g", "o", "n"], ONV),
    fs("c", 1, 1, 2, "cap", ["c", "g", "o", "p"], ONV),
    ps("c", 1, 1, 3, "cake", ["corn", "goat", "sock", "moon"], "corn",
      { goat: "D-ONSET", sock: "D-POSITION", moon: "D-VISUAL-NEIGHBOR" },
      "sock ends /k/; moon is round like the cake — no card starts /k/"),
    fs("c", 2, 1, 1, "caterpillar", ["c", "g", "o", "r"], ONV),
    fs("c", 2, 1, 2, "camera", ["c", "g", "e", "a"], ONV),
    ps("c", 2, 1, 3, "cap", ["cone", "gate", "goat", "phone"], "cone",
      { gate: "D-ONSET", goat: "D-ONSET", phone: "D-RIME-NEAR" },
      "voicing pressure from gate/goat; phone rhymes with the key and ties its one-overlap for scanners"),

    // ---------------- d (phase 1)
    fs("d", 1, 1, 1, "dog", ["d", "t", "b", "g"], ONV),
    fs("d", 1, 1, 2, "duck", ["d", "t", "b", "k"], ONV),
    ps("d", 1, 1, 3, "dog", ["duck", "tent", "bread", "bone"], "duck",
      { tent: "D-ONSET", bread: "D-POSITION", bone: "D-SEMANTIC" },
      "bread ends /d/; the bone belongs to the dog but starts /b/"),
    fs("d", 2, 1, 1, "dinosaur", ["d", "t", "b", "r"], ONV),
    fs("d", 2, 1, 2, "dolphin", ["d", "t", "b", "n"], ONV),
    ps("d", 2, 1, 3, "drum", ["dish", "tent", "tie", "toe"], "dish",
      { tent: "D-ONSET", tie: "D-ONSET", toe: "D-ONSET" },
      "voicing panel: /d/ key against three /t/ starters"),

    // ---------------- e (phase 1)
    fs("e", 1, 1, 1, "egg", ["e", "i", "c", "g"], VOW),
    fs("e", 1, 1, 2, "envelope", ["e", "i", "c", "p"], VOW),
    ps("e", 1, 1, 3, "egg", ["envelope", "apple", "ink", "octopus"], "envelope",
      { apple: "D-VOWEL", ink: "D-VOWEL", octopus: "D-VOWEL" }),
    fs("e", 2, 1, 1, "elephant", ["e", "i", "c", "t"], VOW),
    fs("e", 2, 1, 2, "elbow", ["e", "i", "c", "w"], VOW),
    ps("e", 2, 1, 3, "envelope", ["elephant", "ant", "igloo", "uncle"], "elephant",
      { ant: "D-VOWEL", igloo: "D-VOWEL", uncle: "D-VOWEL" }),

    // ---------------- f (phase 1)
    fs("f", 1, 1, 1, "fan", ["f", "v", "t", "n"], ONV),
    fs("f", 1, 1, 2, "fox", ["f", "v", "t", "x"], ONV),
    ps("f", 1, 1, 3, "fish", ["fan", "van", "leaf", "boat"], "fan",
      { van: "D-ONSET", leaf: "D-POSITION", boat: "D-SEMANTIC" },
      "leaf ends /f/; van is the f/v voicing trap"),
    fs("f", 2, 1, 1, "feather", ["f", "v", "t", "r"], ONV),
    fs("f", 2, 1, 2, "flamingo", ["f", "v", "t", "o"], ONV),
    ps("f", 2, 1, 3, "fan", ["fish", "van", "vet", "vase"], "fish",
      { van: "D-ONSET", vet: "D-ONSET", vase: "D-ONSET" },
      "voicing panel: /f/ key against three /v/ starters"),

    // ---------------- g (phase 1) — hard-g words only, so j stays legal where used
    fs("g", 1, 1, 1, "goat", ["g", "k", "q", "t"], ONV),
    fs("g", 1, 1, 2, "gate", ["g", "c", "q", "t"], ONV),
    ps("g", 1, 1, 3, "goat", ["gate", "cake", "pig", "farm"], "gate",
      { cake: "D-ONSET", pig: "D-POSITION", farm: "D-SEMANTIC" },
      "pig ends /g/; cake is the k/g voicing trap"),
    fs("g", 2, 1, 1, "guitar", ["g", "k", "j", "r"], ONV),
    fs("g", 2, 1, 2, "gorilla", ["g", "c", "q", "a"], ONV),
    ps("g", 2, 1, 3, "gate", ["gum", "cake", "key", "corn"], "gum",
      { cake: "D-ONSET", key: "D-ONSET", corn: "D-ONSET" },
      "voicing panel: /g/ key against three /k/ starters"),

    // ---------------- h (phase 1)
    fs("h", 1, 1, 1, "hat", ["h", "f", "n", "t"], ONV),
    fs("h", 1, 1, 2, "hen", ["h", "f", "b", "n"], ONV),
    ps("h", 1, 1, 3, "hat", ["hen", "fan", "cap", "rat"], "hen",
      { fan: "D-ONSET", cap: "D-SEMANTIC", rat: "D-RIME-NEAR" },
      "cap is the other thing you wear; rat rhymes with the anchor"),
    fs("h", 2, 1, 1, "helicopter", ["h", "f", "n", "r"], ONV),
    fs("h", 2, 1, 2, "hedgehog", ["h", "f", "b", "g"], ONV),
    ps("h", 2, 1, 3, "hen", ["ham", "fan", "fish", "fin"], "ham",
      { fan: "D-ONSET", fish: "D-ONSET", fin: "D-ONSET" },
      "breathy panel: /h/ key against three /f/ starters"),

    // ---------------- i (phase 1)
    fs("i", 1, 1, 1, "igloo", ["i", "e", "l", "o"], VOW),
    fs("i", 1, 1, 2, "ink", ["i", "e", "l", "k"], VOW),
    ps("i", 1, 1, 3, "ink", ["igloo", "egg", "apple", "umbrella"], "igloo",
      { egg: "D-VOWEL", apple: "D-VOWEL", umbrella: "D-VOWEL" }),
    fs("i", 2, 1, 1, "insect", ["i", "e", "j", "t"], VOW),
    fs("i", 2, 1, 2, "instrument", ["i", "e", "l", "t"], VOW),
    ps("i", 2, 1, 3, "igloo", ["insect", "elephant", "ox", "ant"], "insect",
      { elephant: "D-VOWEL", ox: "D-VOWEL", ant: "D-VOWEL" }),

    // ---------------- j (phase 1) — g never appears (it can spell /dʒ/)
    fs("j", 1, 1, 1, "jet", ["j", "y", "i", "t"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 1, 1, 2, "jam", ["j", "y", "i", "m"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("j", 1, 1, 3, "jug", ["jet", "drum", "yarn", "mug"], "jet",
      { drum: "D-ONSET", yarn: "D-DEVELOPMENTAL", mug: "D-RIME-NEAR" },
      "yarn is the y-for-j glide error; mug rhymes with the anchor"),
    fs("j", 2, 1, 1, "jacket", ["j", "d", "i", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 2, 1, 2, "jellyfish", ["j", "y", "d", "h"], ["D-DEVELOPMENTAL", "D-ONSET", "D-POSITION"]),
    ps("j", 2, 1, 3, "jet", ["jam", "yarn", "yak", "drum"], "jam",
      { yarn: "D-DEVELOPMENTAL", yak: "D-DEVELOPMENTAL", drum: "D-ONSET" },
      "glide panel: /dʒ/ key against y/y/d pressure"),

    // ---------------- k (phase 1) — c never appears as a distractor for /k/ keys? c spells /k/, so keep c out
    fs("k", 1, 1, 1, "kite", ["k", "g", "h", "t"], ONV),
    fs("k", 1, 1, 2, "king", ["k", "q", "h", "g"], ["D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("k", 1, 1, 3, "kite", ["key", "goat", "duck", "bike"], "key",
      { goat: "D-ONSET", duck: "D-POSITION", bike: "D-RIME-NEAR" },
      "duck ends /k/; bike shares the i_e rime AND ends /k/ — it also ties the like/kite letter overlap so scanning cannot win"),
    fs("k", 2, 1, 1, "kangaroo", ["k", "g", "h", "o"], ONV),
    fs("k", 2, 1, 2, "kettle", ["k", "g", "h", "l"], ONV),
    ps("k", 2, 1, 3, "king", ["key", "goat", "gate", "gum"], "key",
      { goat: "D-ONSET", gate: "D-ONSET", gum: "D-ONSET" },
      "voicing panel: /k/ key against three /g/ starters",
      "listen"),

    // ---------------- l (phase 1)
    fs("l", 1, 1, 1, "lamp", ["l", "r", "i", "p"], ONV),
    fs("l", 1, 1, 2, "leg", ["l", "r", "i", "g"], ONV),
    ps("l", 1, 1, 3, "lamp", ["lion", "rug", "wheel", "map"], "lion",
      { rug: "D-ONSET", wheel: "D-POSITION", map: "D-RIME-NEAR" },
      "wheel ends /l/; map shares the anchor's -amp/-ap ending feel"),
    fs("l", 2, 1, 1, "lemon", ["l", "r", "i", "n"], ONV),
    fs("l", 2, 1, 2, "lion", ["l", "r", "t", "n"], ONV),
    ps("l", 2, 1, 3, "lion", ["leaf", "rose", "ring", "rug"], "leaf",
      { rose: "D-ONSET", ring: "D-ONSET", rug: "D-ONSET" },
      "liquid panel: /l/ key against three /r/ starters"),

    // ---------------- m (phase 1)
    fs("m", 1, 1, 1, "map", ["m", "n", "w", "p"], ONV),
    fs("m", 1, 1, 2, "mug", ["m", "n", "w", "g"], ONV),
    ps("m", 1, 1, 3, "moon", ["map", "net", "drum", "spoon"], "map",
      { net: "D-ONSET", drum: "D-POSITION", spoon: "D-RIME-NEAR" },
      "drum ends /m/; spoon rhymes with the anchor"),
    fs("m", 2, 1, 1, "mountain", ["m", "n", "w", "t"], ONV),
    fs("m", 2, 1, 2, "microphone", ["m", "n", "w", "o"], ONV),
    ps("m", 2, 1, 3, "mug", ["moon", "nose", "net", "nut"], "moon",
      { nose: "D-ONSET", net: "D-ONSET", nut: "D-ONSET" },
      "nasal panel: /m/ key against three /n/ starters"),

    // ---------------- n (phase 2)
    fs("n", 1, 2, 1, "net", ["n", "m", "u", "t"], ONV),
    fs("n", 1, 2, 2, "nose", ["n", "m", "u", "z"], ONV),
    ps("n", 1, 2, 3, "net", ["nose", "map", "pin", "vet"], "nose",
      { map: "D-ONSET", pin: "D-POSITION", vet: "D-RIME-NEAR" },
      "pin ends /n/; vet rhymes with the anchor"),
    fs("n", 2, 2, 1, "necklace", ["n", "m", "u", "s"], ONV),
    fs("n", 2, 2, 2, "newspaper", ["n", "m", "u", "r"], ONV),
    ps("n", 2, 2, 3, "nut", ["nest", "moon", "map", "mop"], "nest",
      { moon: "D-ONSET", map: "D-ONSET", mop: "D-ONSET" },
      "nasal panel: /n/ key against three /m/ starters"),

    // ---------------- o (phase 2)
    fs("o", 1, 2, 1, "ox", ["o", "u", "c", "x"], VOW),
    fs("o", 1, 2, 2, "octopus", ["o", "u", "c", "s"], VOW),
    ps("o", 1, 2, 3, "ox", ["octopus", "apple", "umbrella", "egg"], "octopus",
      { apple: "D-VOWEL", umbrella: "D-VOWEL", egg: "D-VOWEL" }),
    fs("o", 2, 2, 1, "otter", ["o", "u", "c", "r"], VOW),
    fs("o", 2, 2, 2, "olive", ["o", "a", "c", "v"], VOW),
    ps("o", 2, 2, 3, "octopus", ["ox", "uncle", "ink", "elephant"], "ox",
      { uncle: "D-VOWEL", ink: "D-VOWEL", elephant: "D-VOWEL" }),

    // ---------------- p (phase 2)
    fs("p", 1, 2, 1, "pig", ["p", "b", "q", "g"], ONV),
    fs("p", 1, 2, 2, "pen", ["p", "b", "q", "n"], ONV),
    ps("p", 1, 2, 3, "pig", ["pen", "boat", "map", "dig"], "pen",
      { boat: "D-ONSET", map: "D-POSITION", dig: "D-RIME-NEAR" },
      "map ends /p/; dig rhymes with the anchor"),
    fs("p", 2, 2, 1, "penguin", ["p", "b", "d", "n"], ONV),
    fs("p", 2, 2, 2, "pumpkin", ["p", "b", "q", "k"], ONV),
    ps("p", 2, 2, 3, "pen", ["pin", "bike", "boat", "bell"], "pin",
      { bike: "D-ONSET", boat: "D-ONSET", bell: "D-ONSET" },
      "voicing panel: /p/ key against three /b/ starters"),

    // ---------------- q (phase 2) — c and k never appear (both can spell /k/)
    fs("q", 1, 2, 1, "queen", ["q", "w", "p", "n"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("q", 1, 2, 2, "quilt", ["q", "w", "p", "t"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("q", 1, 2, 3, "queen", ["quilt", "king", "wheel", "crown"], "quilt",
      { king: "D-ONSET", wheel: "D-DEVELOPMENTAL", crown: "D-SEMANTIC" },
      "king starts the bare /k/; wheel is the /w/-component error and ties the queen ee-overlap; the crown belongs to the queen"),
    fs("q", 2, 2, 1, "question", ["q", "w", "g", "n"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("q", 2, 2, 2, "quarter", ["q", "w", "g", "r"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("q", 2, 2, 3, "question", ["quiz", "web", "wheel", "vest"], "quiz",
      { web: "D-DEVELOPMENTAL", wheel: "D-DEVELOPMENTAL", vest: "D-PATTERN-TRAP" },
      "web/wheel are the /w/-reduction; vest ties the question st-overlap so scanning cannot win"),

    // ---------------- r (phase 2)
    fs("r", 1, 2, 1, "rug", ["r", "w", "n", "g"], ONV),
    fs("r", 1, 2, 2, "ring", ["r", "l", "n", "g"], ONV),
    ps("r", 1, 2, 3, "ring", ["rose", "wheel", "deer", "king"], "rose",
      { wheel: "D-ONSET", deer: "D-POSITION", king: "D-RIME-NEAR" },
      "deer ends /r/; king rhymes with the anchor"),
    fs("r", 2, 2, 1, "rainbow", ["r", "w", "l", "o"], ONV),
    fs("r", 2, 2, 2, "rocket", ["r", "w", "l", "t"], ONV),
    ps("r", 2, 2, 3, "rug", ["ring", "wheel", "web", "wasp"], "ring",
      { wheel: "D-ONSET", web: "D-ONSET", wasp: "D-ONSET" },
      "glide panel: /r/ key against three /w/ starters — the wabbit error"),

    // ---------------- s (phase 2) — c never appears (it can spell /s/)
    fs("s", 1, 2, 1, "sun", ["s", "z", "e", "n"], ONV),
    fs("s", 1, 2, 2, "sock", ["s", "z", "e", "k"], ONV),
    ps("s", 1, 2, 3, "sun", ["sock", "zip", "glass", "run"], "sock",
      { zip: "D-ONSET", glass: "D-POSITION", run: "D-RIME-NEAR" },
      "glass ends /s/; run rhymes with the anchor"),
    fs("s", 2, 2, 1, "sunflower", ["s", "z", "e", "r"], ONV),
    fs("s", 2, 2, 2, "sandwich", ["s", "z", "e", "h"], ONV),
    ps("s", 2, 2, 3, "sock", ["sun", "zip", "zoo", "zebra"], "sun",
      { zip: "D-ONSET", zoo: "D-ONSET", zebra: "D-ONSET" },
      "voicing panel: /s/ key against three /z/ starters"),

    // ---------------- t (phase 2)
    fs("t", 1, 2, 1, "tent", ["t", "d", "f", "n"], ONV),
    fs("t", 1, 2, 2, "toe", ["t", "d", "f", "o"], ONV),
    ps("t", 1, 2, 3, "tent", ["toe", "dog", "hat", "net"], "toe",
      { dog: "D-ONSET", hat: "D-POSITION", net: "D-RIME-NEAR" },
      "hat ends /t/; net shares the anchor's -et ending"),
    fs("t", 2, 2, 1, "tiger", ["t", "d", "f", "r"], ONV),
    fs("t", 2, 2, 2, "tomato", ["t", "d", "l", "o"], ONV),
    ps("t", 2, 2, 3, "tooth", ["tie", "dog", "duck", "dish"], "tie",
      { dog: "D-ONSET", duck: "D-ONSET", dish: "D-ONSET" },
      "voicing panel: /t/ key against three /d/ starters"),

    // ---------------- u (phase 2)
    fs("u", 1, 2, 1, "umbrella", ["u", "o", "n", "a"], VOW),
    fs("u", 1, 2, 2, "uncle", ["u", "o", "n", "l"], VOW),
    ps("u", 1, 2, 3, "umbrella", ["uncle", "ox", "ant", "egg"], "uncle",
      { ox: "D-VOWEL", ant: "D-VOWEL", egg: "D-VOWEL" }),
    fs("u", 2, 2, 1, "umpire", ["u", "o", "n", "r"], VOW),
    fs("u", 2, 2, 2, "uniform", ["u", "o", "v", "d"], VOW),
    ps("u", 2, 2, 3, "uncle", ["under", "igloo", "apple", "octopus"], "under",
      { igloo: "D-VOWEL", apple: "D-VOWEL", octopus: "D-VOWEL" }),

    // ---------------- v (phase 2)
    fs("v", 1, 2, 1, "van", ["v", "f", "y", "n"], ONV),
    fs("v", 1, 2, 2, "vet", ["v", "f", "y", "t"], ONV),
    ps("v", 1, 2, 3, "van", ["vet", "fan", "web", "man"], "vet",
      { fan: "D-ONSET", web: "D-VISUAL-NEIGHBOR", man: "D-RIME-NEAR" },
      "fan is the f/v voicing trap AND rhymes with the anchor; man rhymes too"),
    fs("v", 2, 2, 1, "volcano", ["v", "f", "y", "o"], ONV),
    fs("v", 2, 2, 2, "vulture", ["v", "f", "w", "r"], ONV),
    ps("v", 2, 2, 3, "vet", ["van", "fan", "fish", "fin"], "van",
      { fan: "D-ONSET", fish: "D-ONSET", fin: "D-ONSET" },
      "voicing panel: /v/ key against three /f/ starters; van/fan is a true minimal pair"),

    // ---------------- w (phase 2)
    fs("w", 1, 2, 1, "web", ["w", "v", "m", "b"], ONV),
    fs("w", 1, 2, 2, "worm", ["w", "v", "u", "m"], ONV),
    ps("w", 1, 2, 3, "web", ["worm", "vet", "mop", "net"], "worm",
      { vet: "D-ONSET", mop: "D-VISUAL-NEIGHBOR", net: "D-SEMANTIC" },
      "a net looks and works like a web — semantic pull with a different onset"),
    fs("w", 2, 2, 1, "watermelon", ["w", "v", "m", "n"], ONV),
    fs("w", 2, 2, 2, "window", ["w", "v", "u", "o"], ONV),
    ps("w", 2, 2, 3, "wasp", ["wheel", "vet", "van", "vase"], "wheel",
      { vet: "D-ONSET", van: "D-ONSET", vase: "D-ONSET" },
      "glide panel: /w/ key against three /v/ starters"),

    // ---------------- y (phase 2)
    fs("y", 1, 2, 1, "yak", ["y", "w", "v", "k"], ONV),
    fs("y", 1, 2, 2, "yarn", ["y", "w", "v", "n"], ONV),
    ps("y", 1, 2, 3, "yak", ["yarn", "wasp", "jam", "farm"], "yarn",
      { wasp: "D-ONSET", jam: "D-DEVELOPMENTAL", farm: "D-SEMANTIC" },
      "jam is the j-letter-name trap; the farm is where the yak lives — and its ar ties the starts-overlap"),
    fs("y", 2, 2, 1, "yoghurt", ["y", "w", "v", "t"], ONV),
    fs("y", 2, 2, 2, "yawn", ["y", "w", "u", "n"], ONV),
    ps("y", 2, 2, 3, "yarn", ["yak", "jam", "jet", "star"], "yak",
      { jam: "D-ONSET", jet: "D-ONSET", star: "D-PATTERN-TRAP" },
      "jam/jet keep the yet/jet pressure; star ties the yarn ar-overlap so scanning cannot win"),

    // ---------------- z (phase 2)
    fs("z", 1, 2, 1, "zip", ["z", "s", "n", "p"], ONV),
    fs("z", 1, 2, 2, "zoo", ["z", "s", "n", "o"], ONV),
    ps("z", 1, 2, 3, "zip", ["zoo", "sock", "quiz", "ship"], "zoo",
      { sock: "D-ONSET", quiz: "D-POSITION", ship: "D-RIME-NEAR" },
      "quiz ends /z/; ship rhymes with the anchor"),
    fs("z", 2, 2, 1, "zebra", ["z", "s", "n", "a"], ONV),
    fs("z", 2, 2, 2, "zigzag", ["z", "s", "n", "g"], ONV),
    ps("z", 2, 2, 3, "zoo", ["zebra", "sun", "sock", "sheep"], "zebra",
      { sun: "D-ONSET", sock: "D-ONSET", sheep: "D-ONSET" },
      "voicing panel: /z/ key against three /s/ starters"),

    // ---------------- Retention reserve (form R)
    fs("a", 2, 1, 7, "ambulance", ["a", "e", "o", "s"], VOW),
    fs("e", 2, 1, 7, "engine", ["e", "i", "c", "n"], VOW),
    fs("m", 1, 1, 7, "mat", ["m", "n", "h", "t"], ONV),
    fs("s", 2, 2, 7, "sandcastle", ["s", "z", "e", "l"], ONV),
    fs("t", 2, 2, 7, "table", ["t", "d", "f", "l"], ONV),
    ps("b", 1, 1, 7, "bike", ["bell", "pig", "dog", "web"], "bell",
      { pig: "D-ONSET", dog: "D-ONSET", web: "D-POSITION" }),
    ps("g", 2, 1, 7, "goat", ["gift", "kite", "king", "key"], "gift",
      { kite: "D-ONSET", king: "D-ONSET", key: "D-ONSET" }),
    ps("n", 1, 2, 7, "nose", ["nap", "mug", "moon", "mat"], "nap",
      { mug: "D-ONSET", moon: "D-ONSET", mat: "D-ONSET" }),
    ps("r", 2, 2, 7, "rose", ["ram", "wasp", "wheel", "web"], "ram",
      { wasp: "D-ONSET", wheel: "D-ONSET", web: "D-ONSET" }),
    ps("w", 1, 2, 7, "wheel", ["wasp", "vet", "van", "moon"], "wasp",
      { vet: "D-ONSET", van: "D-ONSET", moon: "D-VISUAL-NEIGHBOR" })
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
