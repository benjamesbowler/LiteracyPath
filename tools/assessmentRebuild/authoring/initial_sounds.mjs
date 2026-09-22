// Initial Sounds — v3 authored bank (wave W3, paired with final_sounds).
// Construct: isolate the FIRST sound of a heard word, link it to its
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
// L2 pressure: longer heard words + onset-NEIGHBOUR card sets (s/z, b/p,
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
  underpants: "/images/assessment/generated/initial-sounds-l2/underpants.webp",
  undershirt: "/images/assessment/generated/initial-sounds-l2/undershirt.webp",
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

// A word can supply an onset target without a misleading object image.
// The complete word is spoken; no answer spelling is printed.
const heard = (u, lvl, ph, v, word, letters, rationales = ["D-VOWEL", "D-VOWEL", "D-VOWEL"]) => ({
  ...fs(u, lvl, ph, v, word, letters, rationales),
  media: "audio-required", img: undefined,
  evidenceModality: "audio+print", constructClaim: "initial_sound_isolation",
  audioRole: "target_word",
  note: "the spoken word supplies the stimulus without relying on ambiguous picture naming"
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

// Rationale codes below name the actual contrast. A silent final letter or
// one letter of a final digraph is not labelled as the final phoneme.

export default {
  skillId: "initial_sounds",
  skillName: "Initial Sounds",
  imageResolver: resolveImage,
  items: [
    // ---------------- a (phase 1)
    fs("a", 1, 1, 1, "apple", ["a", "e", "o", "l"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    fs("a", 1, 1, 2, "ant", ["a", "e", "o", "t"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    ps("a", 1, 1, 3, "ant", ["apple", "egg", "igloo", "umbrella"], "apple",
      { egg: "D-VOWEL", igloo: "D-VOWEL", umbrella: "D-VOWEL" }),
    fs("a", 2, 1, 1, "astronaut", ["a", "u", "o", "t"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    fs("a", 2, 1, 2, "apple", ["a", "e", "i", "l"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    ps("a", 2, 1, 3, "apple", ["ant", "egg", "igloo", "umbrella"], "ant",
      { egg: "D-VOWEL", igloo: "D-VOWEL", umbrella: "D-VOWEL" }),

    // ---------------- b (phase 1)
    fs("b", 1, 1, 1, "boat", ["b", "p", "d", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("b", 1, 1, 2, "bike", ["b", "p", "d", "k"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("b", 1, 1, 3, "boat", ["bike", "pig", "web", "duck"], "bike",
      { pig: "D-ONSET", web: "D-POSITION", duck: "D-SEMANTIC" },
      "web ends with /b/ — the position trap; duck shares the water scene"),
    fs("b", 2, 1, 1, "banana", ["b", "p", "d", "a"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("b", 2, 1, 2, "butterfly", ["b", "p", "d", "y"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("b", 2, 1, 3, "bread", ["bike", "pen", "pot", "dog"], "bike",
      { pen: "D-ONSET", pot: "D-ONSET", dog: "D-ONSET" },
      "all-neighbour card set: b against p/p/d voicing-place pressure"),

    // ---------------- c (phase 1) — k never appears (it spells /k/ too)
    fs("c", 1, 1, 1, "corn", ["c", "g", "o", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("c", 1, 1, 2, "cap", ["c", "g", "o", "p"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("c", 1, 1, 3, "cake", ["corn", "goat", "duck", "moon"], "corn",
      { goat: "D-ONSET", duck: "D-POSITION", moon: "D-VISUAL-NEIGHBOR" },
      "duck ends /k/; moon is round like the cake — no card starts /k/"),
    fs("c", 2, 1, 1, "caterpillar", ["c", "g", "o", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("c", 2, 1, 2, "camera", ["c", "g", "e", "a"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("c", 2, 1, 3, "cap", ["cone", "gate", "goat", "phone"], "cone",
      { gate: "D-ONSET", goat: "D-ONSET", phone: "D-RIME-NEAR" },
      "voicing pressure from gate/goat; phone rhymes with the key and ties its one-overlap for scanners"),

    // ---------------- d (phase 1)
    fs("d", 1, 1, 1, "dog", ["d", "t", "b", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("d", 1, 1, 2, "duck", ["d", "t", "b", "k"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("d", 1, 1, 3, "dog", ["duck", "tent", "bread", "bone"], "duck",
      { tent: "D-ONSET", bread: "D-POSITION", bone: "D-SEMANTIC" },
      "bread ends /d/; the bone belongs to the dog but starts /b/"),
    fs("d", 2, 1, 1, "dinosaur", ["d", "t", "b", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("d", 2, 1, 2, "dolphin", ["d", "t", "b", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("d", 2, 1, 3, "drum", ["dog", "tent", "tie", "tiger"], "dog",
      { tent: "D-ONSET", tie: "D-ONSET", tiger: "D-ONSET" },
      "voicing panel: /d/ key against three /t/ starters"),

    // ---------------- e (phase 1)
    fs("e", 1, 1, 1, "egg", ["e", "i", "c", "g"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("e", 1, 1, 2, "engine", ["e", "i", "c", "n"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("e", 1, 1, 3, "egg", ["elbow", "apple", "igloo", "octopus"], "elbow",
      { apple: "D-VOWEL", igloo: "D-VOWEL", octopus: "D-VOWEL" }),
    fs("e", 2, 1, 1, "elephant", ["e", "i", "c", "t"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("e", 2, 1, 2, "elbow", ["e", "i", "c", "w"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("e", 2, 1, 3, "engine", ["egg", "ant", "igloo", "octopus"], "egg",
      { ant: "D-VOWEL", igloo: "D-VOWEL", octopus: "D-VOWEL" }),

    // ---------------- f (phase 1)
    fs("f", 1, 1, 1, "fan", ["f", "v", "t", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("f", 1, 1, 2, "fox", ["f", "v", "t", "x"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("f", 1, 1, 3, "fish", ["fan", "van", "vase", "boat"], "fan",
      { van: "D-ONSET", vase: "D-ONSET", boat: "D-SEMANTIC" },
      "van and vase supply the f/v voicing trap; boat shares the water domain"),
    fs("f", 2, 1, 1, "feather", ["f", "v", "t", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("f", 2, 1, 2, "flamingo", ["f", "v", "t", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("f", 2, 1, 3, "fan", ["fish", "van", "vase", "volcano"], "fish",
      { van: "D-ONSET", vase: "D-ONSET", volcano: "D-ONSET" },
      "voicing panel: /f/ key against three /v/ starters"),

    // ---------------- g (phase 1) — hard-g words only, so j stays legal where used
    fs("g", 1, 1, 1, "goat", ["g", "k", "q", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("g", 1, 1, 2, "gate", ["g", "c", "q", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("g", 1, 1, 3, "goat", ["gate", "cake", "pig", "fish"], "gate",
      { cake: "D-ONSET", pig: "D-POSITION", fish: "D-SEMANTIC" },
      "pig ends /g/; cake is the k/g voicing trap"),
    fs("g", 2, 1, 1, "guitar", ["g", "k", "j", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("g", 2, 1, 2, "gorilla", ["g", "c", "q", "a"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("g", 2, 1, 3, "gate", ["glass", "cake", "key", "corn"], "glass",
      { cake: "D-ONSET", key: "D-ONSET", corn: "D-ONSET" },
      "voicing panel: /g/ key against three /k/ starters"),

    // ---------------- h (phase 1)
    fs("h", 1, 1, 1, "hat", ["h", "f", "n", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("h", 1, 1, 2, "house", ["h", "f", "b", "e"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("h", 1, 1, 3, "hat", ["house", "fan", "cap", "net"], "house",
      { fan: "D-ONSET", cap: "D-SEMANTIC", net: "D-RIME-NEAR" },
      "cap is the other thing you wear; net shares the short vowel"),
    fs("h", 2, 1, 1, "helicopter", ["h", "f", "n", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("h", 2, 1, 2, "hedgehog", ["h", "f", "b", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("h", 2, 1, 3, "hen", ["house", "fan", "fish", "feather"], "house",
      { fan: "D-ONSET", fish: "D-ONSET", feather: "D-ONSET" },
      "breathy panel: /h/ key against three /f/ starters"),

    // ---------------- i (phase 1)
    fs("i", 1, 1, 1, "igloo", ["i", "e", "l", "o"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("i", 1, 1, 2, "ink", ["i", "e", "l", "k"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("i", 1, 1, 3, "ink", ["igloo", "egg", "apple", "octopus"], "igloo",
      { egg: "D-VOWEL", apple: "D-VOWEL", octopus: "D-VOWEL" }),
    heard("i", 2, 1, 1, "insect", ["i", "e", "j", "t"], ["D-VOWEL", "D-DEVELOPMENTAL", "D-POSITION"]),
    fs("i", 2, 1, 2, "iguana", ["i", "e", "o", "n"], ["D-VOWEL", "D-VOWEL", "D-DEVELOPMENTAL"]),
    ps("i", 2, 1, 3, "inside", ["igloo", "egg", "apple", "orange"], "igloo",
      { egg: "D-VOWEL", apple: "D-VOWEL", orange: "D-VOWEL" }),

    // ---------------- j (phase 1) — g never appears (it can spell /dʒ/)
    heard("j", 1, 1, 1, "jet", ["j", "y", "i", "t"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 1, 1, 2, "jam", ["j", "y", "i", "m"], ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("j", 1, 1, 3, "jet", ["jellyfish", "drum", "chick", "mug"], "jellyfish",
      { drum: "D-ONSET", chick: "D-ONSET", mug: "D-RIME-NEAR" },
      "chick begins with the voiceless /tʃ/ neighbour; mug shares the short vowel"),
    fs("j", 2, 1, 1, "jacket", ["j", "d", "i", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("j", 2, 1, 2, "jellyfish", ["j", "y", "d", "h"], ["D-DEVELOPMENTAL", "D-ONSET", "D-DEVELOPMENTAL"]),
    ps("j", 2, 1, 3, "jet", ["jellyfish", "chick", "ship", "drum"], "jellyfish",
      { chick: "D-ONSET", ship: "D-ONSET", drum: "D-ONSET" },
      "affricate panel: /dʒ/ against familiar /tʃ/, /ʃ/, and /d/ starters"),

    // ---------------- k (phase 1) — c never appears as a distractor for /k/ keys? c spells /k/, so keep c out
    fs("k", 1, 1, 1, "key", ["k", "g", "h", "y"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("k", 1, 1, 2, "king", ["k", "q", "h", "g"], ["D-VISUAL-NEIGHBOR", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("k", 1, 1, 3, "kite", ["key", "goat", "duck", "bike"], "key",
      { goat: "D-ONSET", duck: "D-POSITION", bike: "D-RIME-NEAR" },
      "duck ends /k/; bike shares the i_e rime AND ends /k/ — it also ties the like/kite letter overlap so scanning cannot win"),
    fs("k", 2, 1, 1, "kangaroo", ["k", "g", "h", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("k", 2, 1, 2, "kettle", ["k", "g", "h", "l"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("k", 2, 1, 3, "king", ["key", "goat", "gate", "glass"], "key",
      { goat: "D-ONSET", gate: "D-ONSET", glass: "D-ONSET" },
      "voicing panel: /k/ key against three /g/ starters"),

    // ---------------- l (phase 1)
    fs("l", 1, 1, 1, "lamp", ["l", "r", "i", "p"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("l", 1, 1, 2, "leg", ["l", "r", "i", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("l", 1, 1, 3, "lamp", ["lion", "ring", "wheel", "map"], "lion",
      { ring: "D-ONSET", wheel: "D-POSITION", map: "D-RIME-NEAR" },
      "wheel ends /l/; map shares the anchor's -amp/-ap ending feel"),
    fs("l", 2, 1, 1, "lemon", ["l", "r", "i", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("l", 2, 1, 2, "lion", ["l", "r", "t", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("l", 2, 1, 3, "lion", ["lamp", "ring", "rocket", "wheel"], "lamp",
      { ring: "D-ONSET", rocket: "D-ONSET", wheel: "D-POSITION" },
      "liquid pressure comes from ring and rocket; wheel ends with /l/"),

    // ---------------- m (phase 1)
    fs("m", 1, 1, 1, "map", ["m", "n", "w", "p"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("m", 1, 1, 2, "mug", ["m", "n", "w", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("m", 1, 1, 3, "moon", ["map", "net", "drum", "spoon"], "map",
      { net: "D-ONSET", drum: "D-POSITION", spoon: "D-RIME-NEAR" },
      "drum ends /m/; spoon rhymes with the anchor"),
    fs("m", 2, 1, 1, "mountain", ["m", "n", "w", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("m", 2, 1, 2, "microphone", ["m", "n", "w", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("m", 2, 1, 3, "mug", ["moon", "nest", "net", "nut"], "moon",
      { nest: "D-ONSET", net: "D-ONSET", nut: "D-ONSET" },
      "nasal panel: /m/ key against three /n/ starters"),

    // ---------------- n (phase 2)
    fs("n", 1, 2, 1, "net", ["n", "m", "u", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("n", 1, 2, 2, "nut", ["n", "d", "u", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"],
      "d shares the alveolar tongue placement; u is the visual neighbour; t is the final-sound trap"),
    ps("n", 1, 2, 3, "net", ["nut", "map", "pin", "bed"], "nut",
      { map: "D-ONSET", pin: "D-POSITION", bed: "D-RIME-NEAR" },
      "pin ends /n/; bed shares the short vowel but ends with /d/"),
    fs("n", 2, 2, 1, "necklace", ["n", "m", "u", "s"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("n", 2, 2, 2, "newspaper", ["n", "m", "u", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("n", 2, 2, 3, "nut", ["net", "moon", "map", "mop"], "net",
      { moon: "D-ONSET", map: "D-ONSET", mop: "D-ONSET" },
      "nasal panel: /n/ key against three /m/ starters"),

    // ---------------- o (phase 2)
    fs("o", 1, 2, 1, "octopus", ["o", "u", "c", "s"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("o", 1, 2, 2, "orange", ["o", "u", "c", "n"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    heard("o", 1, 2, 3, "ox", ["o", "u", "a", "s"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    fs("o", 2, 2, 1, "octopus", ["o", "u", "e", "s"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),
    fs("o", 2, 2, 2, "orange", ["o", "a", "u", "e"], ["D-VOWEL", "D-VOWEL", "D-DEVELOPMENTAL"]),
    heard("o", 2, 2, 3, "on", ["o", "a", "i", "n"], ["D-VOWEL", "D-VOWEL", "D-POSITION"]),

    // ---------------- p (phase 2)
    fs("p", 1, 2, 1, "pig", ["p", "b", "q", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("p", 1, 2, 2, "pen", ["p", "b", "q", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("p", 1, 2, 3, "pig", ["pen", "boat", "map", "lid"], "pen",
      { boat: "D-ONSET", map: "D-POSITION", lid: "D-RIME-NEAR" },
      "map ends /p/; lid shares the short /i/ but ends differently"),
    fs("p", 2, 2, 1, "penguin", ["p", "b", "d", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("p", 2, 2, 2, "pumpkin", ["p", "b", "q", "k"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("p", 2, 2, 3, "pen", ["pin", "bike", "boat", "bell"], "pin",
      { bike: "D-ONSET", boat: "D-ONSET", bell: "D-ONSET" },
      "voicing panel: /p/ key against three /b/ starters"),

    // ---------------- r (phase 2)
    fs("r", 1, 2, 1, "ring", ["r", "w", "u", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("r", 1, 2, 2, "rocket", ["r", "w", "n", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("r", 1, 2, 3, "ring", ["rocket", "wheel", "deer", "king"], "rocket",
      { wheel: "D-ONSET", deer: "D-POSITION", king: "D-RIME-NEAR" },
      "deer ends /r/; king rhymes with the anchor"),
    fs("r", 2, 2, 1, "rainbow", ["r", "w", "l", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("r", 2, 2, 2, "rocket", ["r", "w", "l", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("r", 2, 2, 3, "rocket", ["ring", "wheel", "web", "van"], "ring",
      { wheel: "D-ONSET", web: "D-ONSET", van: "D-VISUAL-NEIGHBOR" },
      "glide panel: /r/ key against three /w/ starters — the wabbit error"),

    // ---------------- s (phase 2) — c never appears (it can spell /s/)
    fs("s", 1, 2, 1, "sun", ["s", "z", "e", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("s", 1, 2, 2, "seal", ["s", "z", "e", "l"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("s", 1, 2, 3, "sun", ["seal", "zebra", "glass", "mug"], "seal",
      { zebra: "D-ONSET", glass: "D-POSITION", mug: "D-RIME-NEAR" },
      "glass ends /s/; mug shares the short vowel but not the rime"),
    fs("s", 2, 2, 1, "sunflower", ["s", "z", "e", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("s", 2, 2, 2, "sandwich", ["s", "z", "e", "h"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("s", 2, 2, 3, "sock", ["sun", "zebra", "van", "ship"], "sun",
      { zebra: "D-ONSET", van: "D-VISUAL-NEIGHBOR", ship: "D-PATTERN-TRAP" },
      "zebra supplies the /z/ voicing trap; ship is a familiar s-family spelling trap"),

    // ---------------- t (phase 2)
    fs("t", 1, 2, 1, "tent", ["t", "d", "f", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    heard("t", 1, 2, 2, "top", ["t", "d", "f", "p"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("t", 1, 2, 3, "tent", ["tiger", "dog", "hat", "net"], "tiger",
      { dog: "D-ONSET", hat: "D-POSITION", net: "D-RIME-NEAR" },
      "hat ends /t/; net shares the anchor's -et ending"),
    fs("t", 2, 2, 1, "tiger", ["t", "d", "f", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("t", 2, 2, 2, "tomato", ["t", "d", "l", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("t", 2, 2, 3, "tooth", ["tie", "dog", "duck", "fan"], "tie",
      { dog: "D-ONSET", duck: "D-ONSET", fan: "D-VISUAL-NEIGHBOR" },
      "voicing panel: /t/ key against three /d/ starters"),

    // ---------------- u (phase 2)
    fs("u", 1, 2, 1, "umbrella", ["u", "o", "n", "a"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("u", 1, 2, 2, "underpants", ["u", "o", "n", "s"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("u", 1, 2, 3, "up", ["umbrella", "ant", "engine", "igloo"], "umbrella",
      { ant: "D-VOWEL", engine: "D-VOWEL", igloo: "D-VOWEL" }),
    fs("u", 2, 2, 1, "undershirt", ["u", "o", "n", "t"], ["D-VOWEL", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    heard("u", 2, 2, 2, "under", ["u", "a", "i", "e"]),
    heard("u", 2, 2, 3, "upstairs", ["u", "i", "e", "o"]),

    // ---------------- v (phase 2)
    fs("v", 1, 2, 1, "van", ["v", "f", "y", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("v", 1, 2, 2, "vase", ["v", "f", "y", "s"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("v", 1, 2, 3, "van", ["vase", "fan", "web", "pan"], "vase",
      { fan: "D-ONSET", web: "D-VISUAL-NEIGHBOR", pan: "D-RIME-NEAR" },
      "fan is the f/v voicing trap; pan rhymes with the anchor"),
    fs("v", 2, 2, 1, "volcano", ["v", "f", "y", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("v", 2, 2, 2, "vulture", ["v", "f", "w", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("v", 2, 2, 3, "vase", ["van", "fan", "fish", "feather"], "van",
      { fan: "D-ONSET", fish: "D-ONSET", feather: "D-ONSET" },
      "voicing panel: /v/ key against three /f/ starters; van/fan is a true minimal pair"),

    // ---------------- w (phase 2)
    fs("w", 1, 2, 1, "web", ["w", "v", "m", "b"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("w", 1, 2, 2, "wasp", ["w", "v", "u", "p"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("w", 1, 2, 3, "web", ["window", "vase", "mop", "net"], "window",
      { vase: "D-ONSET", mop: "D-VISUAL-NEIGHBOR", net: "D-SEMANTIC" },
      "a net looks and works like a web — semantic pull with a different onset"),
    fs("w", 2, 2, 1, "watermelon", ["w", "v", "m", "n"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("w", 2, 2, 2, "window", ["w", "v", "u", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("w", 2, 2, 3, "wasp", ["wheel", "vase", "van", "volcano"], "wheel",
      { vase: "D-ONSET", van: "D-ONSET", volcano: "D-ONSET" },
      "glide panel: /w/ key against three /v/ starters"),

    // ---------------- y (phase 2)
    fs("y", 1, 2, 1, "yo-yo", ["y", "w", "v", "s"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("y", 1, 2, 2, "yawn", ["y", "w", "v", "m"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    heard("y", 1, 2, 3, "yes", ["y", "j", "w", "s"], ["D-DEVELOPMENTAL", "D-ONSET", "D-POSITION"]),
    heard("y", 2, 2, 1, "yellow", ["y", "j", "v", "l"],
      ["D-DEVELOPMENTAL", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    heard("y", 2, 2, 2, "yoghurt", ["y", "w", "u", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    fs("y", 2, 2, 3, "yo-yo", ["y", "w", "v", "d"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),

    // ---------------- z (phase 2)
    fs("z", 1, 2, 1, "zipper", ["z", "s", "n", "r"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("z", 1, 2, 2, "zebra", ["z", "s", "n", "a"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
    ps("z", 1, 2, 3, "zoo", ["zebra", "seal", "rose", "ship"], "zebra",
      { seal: "D-ONSET", rose: "D-POSITION", ship: "D-RIME-NEAR" },
      "rose ends /z/; ship shares the short-i vowel"),
    fs("z", 2, 2, 1, "zipper", ["z", "s", "n", "g"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    fs("z", 2, 2, 2, "zebra", ["z", "s", "n", "o"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-DEVELOPMENTAL"]),
    ps("z", 2, 2, 3, "zero", ["zebra", "sun", "seal", "sheep"], "zebra",
      { sun: "D-ONSET", seal: "D-ONSET", sheep: "D-ONSET" },
      "voicing panel: /z/ key against three /s/ starters"),

    // ---------------- Retention reserve (form R)
    heard("a", 2, 1, 7, "ankle", ["a", "e", "i", "k"], ["D-VOWEL", "D-VOWEL", "D-DEVELOPMENTAL"]),
    heard("e", 2, 1, 7, "empty", ["e", "i", "o", "p"], ["D-VOWEL", "D-VOWEL", "D-DEVELOPMENTAL"]),
    fs("m", 1, 1, 7, "mat", ["m", "n", "h", "t"], ["D-ONSET", "D-VISUAL-NEIGHBOR", "D-POSITION"]),
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
    ps("w", 1, 2, 7, "wind", ["wheel", "vase", "van", "moon"], "wheel",
      { vase: "D-ONSET", van: "D-ONSET", moon: "D-VISUAL-NEIGHBOR" })
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
