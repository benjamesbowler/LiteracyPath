// Initial Sounds — v3 authored bank (wave W3, paired with final_sounds).
// Construct: isolate the FIRST sound of a pictured/printed word, link it to its
// letter. 24 defensible single-letter targets (a–z minus q/x), D-large. Two formats:
//   FIRST_SOUND — word (+image when a real asset exists) → 4 single-letter
//     choices. Letter choices are scanner-null by construction (no ≥2-letter
//     chunks), so every item's difficulty lives in the letter set itself.
//   INITIAL_SOUND_PAIR_SELECT — "Which word has the same starting sound as
//     ⟨anchor⟩?" over 4 image
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
const sentenceCase = value => `${String(value || "").charAt(0).toUpperCase()}${String(value || "").slice(1)}`;

const resolver = makeImageResolver(["digraphs", "blends", "long-vowels", "hfw"]);
const IMAGE_OVERRIDES = Object.freeze({
  // The objective-word engine bitmap was rejected for nameability/complexity;
  // use the directly reviewed initial-sounds replacement instead.
  engine: "/images/assessment/generated/initial-sounds-l2/engine.webp",
  // The legacy child-mode resolver can encounter PNGs before the reviewed
  // release-media aliases. Pin these two established referents to their
  // approved assessment bitmaps.
  igloo: "/images/assessment/release-media/igloo-d714f227.webp",
  umbrella: "/images/assessment/release-media/umbrella-e1f6f2a3.webp"
});
const resolveImage = word => IMAGE_OVERRIDES[word] || resolver(word);

// FIRST_SOUND: a spoken word plus its directly nameable picture. The target
// word stays out of the printed prompt so the child must isolate its onset.
const fs = (u, lvl, ph, v, word, letters, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "FIRST_SOUND",
  // Do not print the target word: doing so reveals its first grapheme and lets
  // a child answer without isolating the sound from the picture/audio.
  prompt: "Which letter matches the first sound?",
  spoken: `${sentenceCase(word)}. Which letter matches the first sound?`,
  choices: letters.map((l, i) => (i === 0 ? K(l) : P(l, rationales[i - 1]))),
  media: "image-required",
  img: resolveImage(word) ? word : undefined,
  target: word,
  note
});

// INITIAL_SOUND_PAIR_SELECT: anchor in prompt, 4 image cards, single select.
// All variants use one direct assessment-grade stem; scanner pressure belongs
// in the answer set, not in inconsistent or conversational wording.
const ps = (u, lvl, ph, v, anchor, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "INITIAL_SOUND_PAIR_SELECT",
  // The anchor is heard, not printed. Printing it would expose the initial
  // grapheme and let a child bypass phoneme isolation.
  prompt: "Which word has the same starting sound?",
  spoken: `${sentenceCase(anchor)}. Which word has the same starting sound?`,
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
  imageResolver: resolveImage,
  items: [
    // ---------------- a (phase 1)
    fs("a", 1, 1, 1, "apple", ["a", "e", "o", "l"], VOW),
    fs("a", 1, 1, 2, "ant", ["a", "e", "o", "t"], VOW),
    ps("a", 1, 1, 3, "ant", ["apple", "egg", "igloo", "umbrella"], "apple",
      { egg: "D-VOWEL", igloo: "D-VOWEL", umbrella: "D-VOWEL" }),
    fs("a", 2, 1, 1, "astronaut", ["a", "u", "o", "t"], VOW),
    fs("a", 2, 1, 2, "astronaut", ["a", "e", "i", "r"], VOW),
    ps("a", 2, 1, 3, "apple", ["ant", "egg", "igloo", "umbrella"], "ant",
      { egg: "D-VOWEL", igloo: "D-VOWEL", umbrella: "D-VOWEL" }),

    // ---------------- b (phase 1)
    fs("b", 1, 1, 1, "boat", ["b", "p", "d", "t"], ONV),
    fs("b", 1, 1, 2, "bike", ["b", "p", "d", "k"], ONV),
    ps("b", 1, 1, 3, "boat", ["bike", "pig", "web", "duck"], "bike",
      { pig: "D-ONSET", web: "D-POSITION", duck: "D-SEMANTIC" },
      "web ends with /b/ — the position trap; duck shares the water scene"),
    fs("b", 2, 1, 1, "banana", ["b", "p", "d", "a"], ONV),
    fs("b", 2, 1, 2, "butterfly", ["b", "p", "d", "y"], ONV),
    ps("b", 2, 1, 3, "bread", ["bike", "pen", "pot", "dog"], "bike",
      { pen: "D-ONSET", pot: "D-ONSET", dog: "D-ONSET" },
      "all-neighbour card set: b against p/p/d voicing-place pressure"),

    // ---------------- c (phase 1) — k never appears (it spells /k/ too)
    fs("c", 1, 1, 1, "corn", ["c", "g", "o", "n"], ONV),
    fs("c", 1, 1, 2, "cap", ["c", "g", "o", "p"], ONV),
    ps("c", 1, 1, 3, "cake", ["corn", "goat", "duck", "moon"], "corn",
      { goat: "D-ONSET", duck: "D-POSITION", moon: "D-VISUAL-NEIGHBOR" },
      "duck ends /k/; moon is round like the cake — no card starts /k/"),
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
    ps("d", 2, 1, 3, "drum", ["dog", "tent", "tie", "tiger"], "dog",
      { tent: "D-ONSET", tie: "D-ONSET", tiger: "D-ONSET" },
      "voicing panel: /d/ key against three /t/ starters"),

    // ---------------- e (phase 1)
    fs("e", 1, 1, 1, "egg", ["e", "i", "c", "g"], VOW),
    fs("e", 1, 1, 2, "engine", ["e", "i", "c", "n"], VOW),
    ps("e", 1, 1, 3, "egg", ["elbow", "apple", "igloo", "octopus"], "elbow",
      { apple: "D-VOWEL", igloo: "D-VOWEL", octopus: "D-VOWEL" }),
    fs("e", 2, 1, 1, "elephant", ["e", "i", "c", "t"], VOW),
    fs("e", 2, 1, 2, "elbow", ["e", "i", "c", "w"], VOW),
    ps("e", 2, 1, 3, "engine", ["egg", "ant", "igloo", "octopus"], "egg",
      { ant: "D-VOWEL", igloo: "D-VOWEL", octopus: "D-VOWEL" }),

    // ---------------- f (phase 1)
    fs("f", 1, 1, 1, "fan", ["f", "v", "t", "n"], ONV),
    fs("f", 1, 1, 2, "fox", ["f", "v", "t", "x"], ONV),
    ps("f", 1, 1, 3, "fish", ["fan", "van", "vase", "boat"], "fan",
      { van: "D-ONSET", vase: "D-ONSET", boat: "D-SEMANTIC" },
      "van and vase supply the f/v voicing trap; boat shares the water domain"),
    fs("f", 2, 1, 1, "feather", ["f", "v", "t", "r"], ONV),
    fs("f", 2, 1, 2, "flamingo", ["f", "v", "t", "o"], ONV),
    ps("f", 2, 1, 3, "fan", ["fish", "van", "vase", "volcano"], "fish",
      { van: "D-ONSET", vase: "D-ONSET", volcano: "D-ONSET" },
      "voicing panel: /f/ key against three /v/ starters"),

    // ---------------- g (phase 1) — hard-g words only, so j stays legal where used
    fs("g", 1, 1, 1, "goat", ["g", "k", "q", "t"], ONV),
    fs("g", 1, 1, 2, "gate", ["g", "c", "q", "t"], ONV),
    ps("g", 1, 1, 3, "goat", ["gate", "cake", "pig", "fish"], "gate",
      { cake: "D-ONSET", pig: "D-POSITION", fish: "D-SEMANTIC" },
      "pig ends /g/; cake is the k/g voicing trap"),
    fs("g", 2, 1, 1, "guitar", ["g", "k", "j", "r"], ONV),
    fs("g", 2, 1, 2, "gorilla", ["g", "c", "q", "a"], ONV),
    ps("g", 2, 1, 3, "gate", ["glass", "cake", "key", "corn"], "glass",
      { cake: "D-ONSET", key: "D-ONSET", corn: "D-ONSET" },
      "voicing panel: /g/ key against three /k/ starters"),

    // ---------------- h (phase 1)
    fs("h", 1, 1, 1, "hat", ["h", "f", "n", "t"], ONV),
    fs("h", 1, 1, 2, "house", ["h", "f", "b", "e"], ONV),
    ps("h", 1, 1, 3, "hat", ["house", "fan", "cap", "net"], "house",
      { fan: "D-ONSET", cap: "D-SEMANTIC", net: "D-RIME-NEAR" },
      "cap is the other thing you wear; net shares the short vowel"),
    fs("h", 2, 1, 1, "helicopter", ["h", "f", "n", "r"], ONV),
    fs("h", 2, 1, 2, "hedgehog", ["h", "f", "b", "g"], ONV),
    ps("h", 2, 1, 3, "hen", ["house", "fan", "fish", "fork"], "house",
      { fan: "D-ONSET", fish: "D-ONSET", fork: "D-ONSET" },
      "breathy panel: /h/ key against three /f/ starters"),

    // ---------------- i (phase 1)
    fs("i", 1, 1, 1, "igloo", ["i", "e", "l", "o"], VOW),
    fs("i", 1, 1, 2, "ink", ["i", "e", "l", "k"], VOW),
    ps("i", 1, 1, 3, "ink", ["igloo", "egg", "apple", "octopus"], "igloo",
      { egg: "D-VOWEL", apple: "D-VOWEL", octopus: "D-VOWEL" }),
    fs("i", 2, 1, 1, "igloo", ["i", "e", "j", "d"], VOW),
    fs("i", 2, 1, 2, "ink", ["i", "e", "l", "t"], VOW),
    ps("i", 2, 1, 3, "inside", ["igloo", "egg", "apple", "orange"], "igloo",
      { egg: "D-VOWEL", apple: "D-VOWEL", orange: "D-VOWEL" }),

    // ---------------- j (phase 1) — g never appears (it can spell /dʒ/)
    fs("j", 1, 1, 1, "jam", ["j", "y", "i", "t"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 1, 1, 2, "jam", ["j", "y", "i", "m"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("j", 1, 1, 3, "jet", ["jellyfish", "drum", "chick", "mug"], "jellyfish",
      { drum: "D-ONSET", chick: "D-ONSET", mug: "D-RIME-NEAR" },
      "chick begins with the voiceless /tʃ/ neighbour; mug shares the short vowel"),
    fs("j", 2, 1, 1, "jacket", ["j", "d", "i", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 2, 1, 2, "jellyfish", ["j", "y", "d", "h"], ["D-DEVELOPMENTAL", "D-ONSET", "D-POSITION"]),
    ps("j", 2, 1, 3, "jet", ["jellyfish", "chick", "ship", "drum"], "jellyfish",
      { chick: "D-ONSET", ship: "D-ONSET", drum: "D-ONSET" },
      "affricate panel: /dʒ/ against familiar /tʃ/, /ʃ/, and /d/ starters"),

    // ---------------- k (phase 1) — c never appears as a distractor for /k/ keys? c spells /k/, so keep c out
    fs("k", 1, 1, 1, "key", ["k", "g", "h", "y"], ONV),
    fs("k", 1, 1, 2, "king", ["k", "q", "h", "g"], ["D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("k", 1, 1, 3, "kite", ["key", "goat", "duck", "bike"], "key",
      { goat: "D-ONSET", duck: "D-POSITION", bike: "D-RIME-NEAR" },
      "duck ends /k/; bike shares the i_e rime AND ends /k/ — it also ties the like/kite letter overlap so scanning cannot win"),
    fs("k", 2, 1, 1, "kangaroo", ["k", "g", "h", "o"], ONV),
    fs("k", 2, 1, 2, "kettle", ["k", "g", "h", "l"], ONV),
    ps("k", 2, 1, 3, "king", ["key", "goat", "gate", "glass"], "key",
      { goat: "D-ONSET", gate: "D-ONSET", glass: "D-ONSET" },
      "voicing panel: /k/ key against three /g/ starters"),

    // ---------------- l (phase 1)
    fs("l", 1, 1, 1, "lamp", ["l", "r", "i", "p"], ONV),
    fs("l", 1, 1, 2, "leg", ["l", "r", "i", "g"], ONV),
    ps("l", 1, 1, 3, "lamp", ["lion", "ring", "wheel", "map"], "lion",
      { ring: "D-ONSET", wheel: "D-POSITION", map: "D-RIME-NEAR" },
      "wheel ends /l/; map shares the anchor's -amp/-ap ending feel"),
    fs("l", 2, 1, 1, "lemon", ["l", "r", "i", "n"], ONV),
    fs("l", 2, 1, 2, "lion", ["l", "r", "t", "n"], ONV),
    ps("l", 2, 1, 3, "lion", ["lamp", "ring", "rocket", "wheel"], "lamp",
      { ring: "D-ONSET", rocket: "D-ONSET", wheel: "D-POSITION" },
      "liquid pressure comes from ring and rocket; wheel ends with /l/"),

    // ---------------- m (phase 1)
    fs("m", 1, 1, 1, "map", ["m", "n", "w", "p"], ONV),
    fs("m", 1, 1, 2, "mug", ["m", "n", "w", "g"], ONV),
    ps("m", 1, 1, 3, "moon", ["map", "net", "drum", "spoon"], "map",
      { net: "D-ONSET", drum: "D-POSITION", spoon: "D-RIME-NEAR" },
      "drum ends /m/; spoon rhymes with the anchor"),
    fs("m", 2, 1, 1, "mountain", ["m", "n", "w", "t"], ONV),
    fs("m", 2, 1, 2, "microphone", ["m", "n", "w", "o"], ONV),
    ps("m", 2, 1, 3, "mug", ["moon", "nest", "net", "nut"], "moon",
      { nest: "D-ONSET", net: "D-ONSET", nut: "D-ONSET" },
      "nasal panel: /m/ key against three /n/ starters"),

    // ---------------- n (phase 2)
    fs("n", 1, 2, 1, "net", ["n", "m", "u", "t"], ONV),
    fs("n", 1, 2, 2, "nut", ["n", "d", "u", "t"], ONV,
      "d shares the alveolar tongue placement; u is the visual neighbour; t is the final-sound trap"),
    ps("n", 1, 2, 3, "net", ["nut", "map", "pin", "bed"], "nut",
      { map: "D-ONSET", pin: "D-POSITION", bed: "D-RIME-NEAR" },
      "pin ends /n/; bed shares the short vowel but ends with /d/"),
    fs("n", 2, 2, 1, "necklace", ["n", "m", "u", "s"], ONV),
    fs("n", 2, 2, 2, "newspaper", ["n", "m", "u", "r"], ONV),
    ps("n", 2, 2, 3, "nut", ["net", "moon", "map", "mop"], "net",
      { moon: "D-ONSET", map: "D-ONSET", mop: "D-ONSET" },
      "nasal panel: /n/ key against three /m/ starters"),

    // ---------------- o (phase 2)
    fs("o", 1, 2, 1, "octopus", ["o", "u", "c", "s"], VOW),
    fs("o", 1, 2, 2, "orange", ["o", "u", "c", "n"], VOW),
    fs("o", 1, 2, 3, "octopus", ["o", "u", "a", "f"], VOW),
    fs("o", 2, 2, 1, "octopus", ["o", "u", "e", "s"], VOW),
    fs("o", 2, 2, 2, "orange", ["o", "a", "u", "e"], VOW),
    fs("o", 2, 2, 3, "octopus", ["o", "a", "u", "x"], VOW),

    // ---------------- p (phase 2)
    fs("p", 1, 2, 1, "pig", ["p", "b", "q", "g"], ONV),
    fs("p", 1, 2, 2, "pen", ["p", "b", "q", "n"], ONV),
    ps("p", 1, 2, 3, "pig", ["pen", "boat", "map", "lid"], "pen",
      { boat: "D-ONSET", map: "D-POSITION", lid: "D-RIME-NEAR" },
      "map ends /p/; lid shares the short /i/ but ends differently"),
    fs("p", 2, 2, 1, "penguin", ["p", "b", "d", "n"], ONV),
    fs("p", 2, 2, 2, "pumpkin", ["p", "b", "q", "k"], ONV),
    ps("p", 2, 2, 3, "pen", ["pin", "bike", "boat", "bell"], "pin",
      { bike: "D-ONSET", boat: "D-ONSET", bell: "D-ONSET" },
      "voicing panel: /p/ key against three /b/ starters"),

    // ---------------- r (phase 2)
    fs("r", 1, 2, 1, "ring", ["r", "w", "u", "n"], ONV),
    fs("r", 1, 2, 2, "ring", ["r", "l", "n", "g"], ONV),
    ps("r", 1, 2, 3, "ring", ["rocket", "wheel", "deer", "king"], "rocket",
      { wheel: "D-ONSET", deer: "D-POSITION", king: "D-RIME-NEAR" },
      "deer ends /r/; king rhymes with the anchor"),
    fs("r", 2, 2, 1, "rainbow", ["r", "w", "l", "o"], ONV),
    fs("r", 2, 2, 2, "rocket", ["r", "w", "l", "t"], ONV),
    ps("r", 2, 2, 3, "rocket", ["ring", "wheel", "web", "van"], "ring",
      { wheel: "D-ONSET", web: "D-ONSET", van: "D-VISUAL-NEIGHBOR" },
      "glide panel: /r/ key against three /w/ starters — the wabbit error"),

    // ---------------- s (phase 2) — c never appears (it can spell /s/)
    fs("s", 1, 2, 1, "sun", ["s", "z", "e", "n"], ONV),
    fs("s", 1, 2, 2, "seal", ["s", "z", "e", "l"], ONV),
    ps("s", 1, 2, 3, "sun", ["seal", "zebra", "glass", "mug"], "seal",
      { zebra: "D-ONSET", glass: "D-POSITION", mug: "D-RIME-NEAR" },
      "glass ends /s/; mug shares the short vowel but not the rime"),
    fs("s", 2, 2, 1, "sunflower", ["s", "z", "e", "r"], ONV),
    fs("s", 2, 2, 2, "sandwich", ["s", "z", "e", "h"], ONV),
    ps("s", 2, 2, 3, "sock", ["sun", "zebra", "van", "ship"], "sun",
      { zebra: "D-ONSET", van: "D-VISUAL-NEIGHBOR", ship: "D-PATTERN-TRAP" },
      "zebra supplies the /z/ voicing trap; ship is a familiar s-family spelling trap"),

    // ---------------- t (phase 2)
    fs("t", 1, 2, 1, "tent", ["t", "d", "f", "n"], ONV),
    fs("t", 1, 2, 2, "tent", ["t", "d", "f", "p"], ONV),
    ps("t", 1, 2, 3, "tent", ["tiger", "dog", "hat", "net"], "tiger",
      { dog: "D-ONSET", hat: "D-POSITION", net: "D-RIME-NEAR" },
      "hat ends /t/; net shares the anchor's -et ending"),
    fs("t", 2, 2, 1, "tiger", ["t", "d", "f", "r"], ONV),
    fs("t", 2, 2, 2, "tomato", ["t", "d", "l", "o"], ONV),
    ps("t", 2, 2, 3, "tooth", ["tie", "dog", "duck", "fan"], "tie",
      { dog: "D-ONSET", duck: "D-ONSET", fan: "D-VISUAL-NEIGHBOR" },
      "voicing panel: /t/ key against three /d/ starters"),

    // ---------------- u (phase 2)
    fs("u", 1, 2, 1, "umbrella", ["u", "o", "n", "a"], VOW),
    fs("u", 1, 2, 2, "umbrella", ["u", "o", "n", "p"], VOW),
    fs("u", 1, 2, 3, "umbrella", ["u", "o", "a", "r"], VOW),
    fs("u", 2, 2, 1, "umbrella", ["u", "o", "n", "l"],
      ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("u", 2, 2, 2, "umbrella", ["u", "o", "v", "s"], VOW),
    fs("u", 2, 2, 3, "umbrella", ["u", "o", "e", "t"], VOW),

    // ---------------- v (phase 2)
    fs("v", 1, 2, 1, "van", ["v", "f", "y", "n"], ONV),
    fs("v", 1, 2, 2, "vase", ["v", "f", "y", "s"], ONV),
    ps("v", 1, 2, 3, "van", ["vase", "fan", "web", "pan"], "vase",
      { fan: "D-ONSET", web: "D-VISUAL-NEIGHBOR", pan: "D-RIME-NEAR" },
      "fan is the f/v voicing trap; pan rhymes with the anchor"),
    fs("v", 2, 2, 1, "volcano", ["v", "f", "y", "o"], ONV),
    fs("v", 2, 2, 2, "vulture", ["v", "f", "w", "r"], ONV),
    ps("v", 2, 2, 3, "vase", ["van", "fan", "fish", "fork"], "van",
      { fan: "D-ONSET", fish: "D-ONSET", fork: "D-ONSET" },
      "voicing panel: /v/ key against three /f/ starters; van/fan is a true minimal pair"),

    // ---------------- w (phase 2)
    fs("w", 1, 2, 1, "web", ["w", "v", "m", "b"], ONV),
    fs("w", 1, 2, 2, "wasp", ["w", "v", "u", "p"], ONV),
    ps("w", 1, 2, 3, "web", ["window", "vase", "mop", "net"], "window",
      { vase: "D-ONSET", mop: "D-VISUAL-NEIGHBOR", net: "D-SEMANTIC" },
      "a net looks and works like a web — semantic pull with a different onset"),
    fs("w", 2, 2, 1, "watermelon", ["w", "v", "m", "n"], ONV),
    fs("w", 2, 2, 2, "window", ["w", "v", "u", "o"], ONV),
    ps("w", 2, 2, 3, "wasp", ["wheel", "vase", "van", "volcano"], "wheel",
      { vase: "D-ONSET", van: "D-ONSET", volcano: "D-ONSET" },
      "glide panel: /w/ key against three /v/ starters"),

    // ---------------- y (phase 2)
    fs("y", 1, 2, 1, "yo-yo", ["y", "w", "v", "s"], ONV),
    fs("y", 1, 2, 2, "yawn", ["y", "w", "v", "m"], ONV),
    fs("y", 1, 2, 3, "yo-yo", ["y", "w", "v", "o"], ONV),
    fs("y", 2, 2, 1, "yawn", ["y", "j", "v", "o"],
      ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("y", 2, 2, 2, "yawn", ["y", "w", "u", "n"], ONV),
    fs("y", 2, 2, 3, "yo-yo", ["y", "w", "v", "d"], ONV),

    // ---------------- z (phase 2)
    fs("z", 1, 2, 1, "zipper", ["z", "s", "n", "r"], ONV),
    fs("z", 1, 2, 2, "zebra", ["z", "s", "n", "a"], ONV),
    ps("z", 1, 2, 3, "zoo", ["zebra", "seal", "rose", "ship"], "zebra",
      { seal: "D-ONSET", rose: "D-POSITION", ship: "D-RIME-NEAR" },
      "rose ends /z/; ship shares the short-i vowel"),
    fs("z", 2, 2, 1, "zipper", ["z", "s", "n", "g"], ONV),
    fs("z", 2, 2, 2, "zebra", ["z", "s", "n", "o"], ONV),
    ps("z", 2, 2, 3, "zero", ["zebra", "sun", "seal", "sheep"], "zebra",
      { sun: "D-ONSET", seal: "D-ONSET", sheep: "D-ONSET" },
      "voicing panel: /z/ key against three /s/ starters"),

    // ---------------- Retention reserve (form R)
    fs("a", 2, 1, 7, "astronaut", ["a", "e", "o", "s"], VOW),
    fs("e", 2, 1, 7, "elephant", ["e", "i", "c", "y"], VOW),
    fs("m", 1, 1, 7, "mat", ["m", "n", "h", "t"], ONV),
    fs("s", 2, 2, 7, "sandcastle", ["s", "z", "f", "l"],
      ["D-ONSET", "D-ONSET", "D-POSITION"],
      "z is the voicing neighbour, f is another continuous fricative, and l is the final-sound trap"),
    fs("t", 2, 2, 7, "train", ["t", "d", "p", "n"],
      ["D-ONSET", "D-ONSET", "D-POSITION"],
      "d is the voicing neighbour, p is another voiceless stop, and n is the final-sound trap"),
    ps("b", 1, 1, 7, "bike", ["bell", "pig", "dog", "web"], "bell",
      { pig: "D-ONSET", dog: "D-ONSET", web: "D-POSITION" }),
    ps("g", 2, 1, 7, "goat", ["gate", "cap", "king", "key"], "gate",
      { cap: "D-ONSET", king: "D-ONSET", key: "D-ONSET" }),
    ps("n", 1, 2, 7, "nose", ["net", "mug", "moon", "mat"], "net",
      { mug: "D-ONSET", moon: "D-ONSET", mat: "D-ONSET" }),
    ps("r", 2, 2, 7, "rocket", ["rat", "van", "wheel", "web"], "rat",
      { van: "D-VISUAL-NEIGHBOR", wheel: "D-ONSET", web: "D-ONSET" }),
    ps("w", 1, 2, 7, "web", ["window", "vase", "van", "moon"], "window",
      { vase: "D-ONSET", van: "D-ONSET", moon: "D-VISUAL-NEIGHBOR" })
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
