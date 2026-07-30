// Prepositions of Place — v3 authored bank (wave W10, paired with adjectives).
// The 303-item, 55-key sprawl prunes to 16 curated spatial words.
// L1 PREPOSITION_SCENE_CHOICE: ONE drawn scene, options differ ONLY by the
//   preposition (function-swap by construction). Scene-less relations use the
//   INVERSE of an existing scene (bird_above_tree answers "where is the
//   tree?" for below) — every relation gets real art with zero new assets.
// L1 PREPOSITION_TEXT_CHOICE: class recognition + world-knowledge mini-frames.
// L2 PREPOSITION_SENTENCE_FIT: cloze over four prepositions.
// L2 PREPOSITION_PRECISION: two options are spatially possible, one is exact —
//   every note defends why the key is uniquely right (the C-1 pressure item).
// The malformed "Choose the precise word means…" prompts are dead.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §18.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

// Scene choice: img is the scene file stem, options are relation phrases.
const psc = (u, lvl, ph, v, scene, prompt, phrases, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PREPOSITION_SCENE_CHOICE",
  prompt,
  spoken: prompt,
  choices: phrases.map((p, i) => (i === 0 ? K(p) : P(p, rationales[i - 1] || "D-FUNCTION-SWAP"))),
  media: "image-required",
  img: scene,
  imgAlt: scene.replace(/_/g, " "),
  target: scene,
  note
});

const ptc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PREPOSITION_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const psf = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PREPOSITION_SENTENCE_FIT",
  prompt: sentence,
  spoken: `Which where-word finishes the sentence? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const pp = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "PREPOSITION_PRECISION",
  prompt: sentence,
  spoken: `Which where-word fits exactly? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const FS = "D-FUNCTION-SWAP";
const PU = "D-PLAUSIBLE-UNSUPPORTED";

export default {
  skillId: "prepositions_of_place",
  skillName: "Prepositions of Place",
  items: [
    // ================= L1 phase 1: in on under behind next_to =================
    psc("in", 1, 1, 1, "cat_in_box", "Where is the cat?",
      ["in the box", "on the box", "under the box", "behind the box"], [FS, FS, FS]),
    psc("in", 1, 1, 2, "goat_inside_barn", "Where is the goat?",
      ["in the barn", "on the barn", "behind the barn", "under the barn"], [FS, FS, FS]),
    ptc("in", 1, 1, 3, "Which word says where?",
      ["in", "and", "big", "run"], [FS, FS, FS]),
    ptc("in", 1, 1, 4, "The jam lives ___ the jar with the lid on.",
      ["in", "on", "under", "behind"], [FS, FS, FS],
      "with the lid on pins in"),
    psc("on", 1, 1, 1, "ball_on_chair", "Where is the ball?",
      ["on the chair", "in the chair", "under the chair", "behind the chair"], [FS, FS, FS]),
    ptc("on", 1, 1, 2, "Snow settled ___ the roof.",
      ["on", "in", "under", "next to"], [FS, FS, FS]),
    ptc("on", 1, 1, 3, "The stamp goes ___ the envelope, top right.",
      ["on", "in", "under", "beside"], [FS, FS, FS]),
    ptc("on", 1, 1, 4, "Which word says where?",
      ["on", "or", "no", "go"], [FS, FS, FS]),
    psc("under", 1, 1, 1, "dog_under_table", "Where is the dog?",
      ["under the table", "on the table", "in the table", "next to the table"], [FS, FS, FS]),
    ptc("under", 1, 1, 2, "Roots grow ___ the soil.",
      ["under", "on", "over", "next to"], [FS, FS, FS]),
    ptc("under", 1, 1, 3, "The slippers sit ___ the bed, out of sight.",
      ["under", "on", "in", "over"], [FS, FS, FS],
      "over ties the er-chunk that slippers gifts under"),
    ptc("under", 1, 1, 4, "Which word says where?",
      ["under", "thunder", "wonder", "hunt"], [FS, FS, FS]),
    psc("behind", 1, 1, 1, "bear_behind_tree", "Where is the bear?",
      ["behind the tree", "in front of the tree", "above the tree", "in the tree"], [FS, FS, FS]),
    ptc("behind", 1, 1, 2, "The sun dropped ___ the barn.",
      ["behind", "in", "on", "between"], [FS, FS, FS]),
    ptc("behind", 1, 1, 3, "Hide ___ the curtain so no one sees you.",
      ["behind", "on", "above", "next to"], [FS, FS, FS],
      "so no one sees you pins behind"),
    ptc("behind", 1, 1, 4, "Which word says where?",
      ["behind", "being", "began", "before"], [FS, FS, FS],
      "before is the classic when-word trap and ties the hi-chunk which gifts behind"),
    psc("next_to", 1, 1, 1, "rabbit_beside_basket", "Where is the rabbit?",
      ["next to the basket", "in the basket", "under the basket", "behind the basket"], [FS, FS, FS]),
    ptc("next_to", 1, 1, 2, "Park your bike ___ mine, side by side.",
      ["next to", "under", "above", "behind"], [FS, FS, FS],
      "side by side pins next to"),
    ptc("next_to", 1, 1, 3, "My desk is ___ the window, so I see the yard.",
      ["next to", "under", "behind", "in"], [FS, FS, FS]),
    ptc("next_to", 1, 1, 4, "Which words say where?",
      ["next to", "not yet", "nearly", "never"], [FS, FS, FS]),

    // ================= L1 phase 2: between in_front_of above below =================
    psc("between", 1, 2, 1, "cup_between_books", "Where is the cup?",
      ["between the books", "on the books", "under the books", "behind the books"], [FS, FS, FS]),
    ptc("between", 1, 2, 2, "The net hangs ___ the posts, one on each side.",
      ["between", "on", "under", "behind"], [FS, FS, FS],
      "one on each side pins between; the word two would gift the key its tw-chunk"),
    ptc("between", 1, 2, 3, "I sat ___ Mum and Dad, one on each side.",
      ["between", "under", "behind", "above"], [FS, FS, FS]),
    ptc("between", 1, 2, 4, "Which word says where?",
      ["between", "because", "before", "begin"], [FS, FS, FS]),
    psc("in_front_of", 1, 2, 1, "bear_behind_tree", "Where is the tree?",
      ["in front of the bear", "behind the bear", "on the bear", "under the bear"], [FS, FS, FS],
      "the same scene answers both relations — the tree stands in front of the bear"),
    ptc("in_front_of", 1, 2, 2, "The queue formed ___ the gate before opening time.",
      ["in front of", "behind", "under", "inside"], [FS, FS, FS]),
    ptc("in_front_of", 1, 2, 3, "Stand ___ the mirror to see your costume.",
      ["in front of", "behind", "under", "next to"], [FS, FS, FS],
      "to see your costume pins in front of"),
    ptc("in_front_of", 1, 2, 4, "Which words say where?",
      ["in front of", "in a bit", "first of all", "for now"], [FS, FS, FS]),
    psc("above", 1, 2, 1, "bird_above_tree", "Where is the bird?",
      ["above the tree", "under the tree", "in the tree", "next to the tree"], [FS, FS, FS]),
    ptc("above", 1, 2, 2, "The clock hangs ___ the door, too high to touch.",
      ["above", "under", "behind", "in"], [FS, FS, FS]),
    ptc("above", 1, 2, 3, "Stars shine far ___ the clouds.",
      ["above", "below", "between", "behind"], [FS, FS, FS]),
    ptc("above", 1, 2, 4, "Which word says where?",
      ["above", "about", "again", "aboard"], [FS, FS, FS]),
    psc("below", 1, 2, 1, "bird_above_tree", "Where is the tree?",
      ["below the bird", "above the bird", "behind the bird", "next to the bird"], [FS, FS, FS],
      "the inverse question of the same scene"),
    ptc("below", 1, 2, 2, "Fish swim ___ the surface of the pond.",
      ["below", "above", "behind", "beside"], [FS, FS, FS]),
    ptc("below", 1, 2, 3, "Write your name ___ the line at the bottom.",
      ["below", "above", "behind", "inside"], [FS, FS, FS],
      "at the bottom pins below; inside keeps the set distinct from below.v2"),
    ptc("below", 1, 2, 4, "Which word says where?",
      ["below", "belong", "bellow", "yellow"], [FS, FS, FS]),

    // ================= L2 phase 1: over through near opposite =================
    psf("over", 2, 1, 1, "The plane flew ___ the town.",
      ["over", "under", "between", "behind"], [FS, FS, FS]),
    psf("over", 2, 1, 2, "A rainbow arched ___ the valley.",
      ["over", "inside", "under", "next to"], [FS, FS, FS]),
    pp("over", 2, 1, 3, "The horse jumped ___ the locked gate.",
      ["over", "through", "under", "past"], [PU, PU, PU],
      "through and under are spatially possible for an OPEN gate — locked leaves only over"),
    pp("over", 2, 1, 4, "She leaned ___ the fence to reach the ball.",
      ["over", "on", "through", "under"], [PU, PU, PU],
      "through a fence gap and under it are possible — leaning to REACH pins over"),
    psf("through", 2, 1, 1, "The train roared ___ the tunnel.",
      ["through", "above", "beside", "behind"], [FS, FS, FS]),
    psf("through", 2, 1, 2, "Rain dripped ___ the crack in the tent.",
      ["through", "under", "behind", "over"], [FS, FS, FS]),
    pp("through", 2, 1, 3, "Wool goes ___ a needle's eye.",
      ["through", "around", "over", "under"], [PU, PU, PU],
      "around the needle is possible — but sewing means through the eye; frame avoids the, whose th-chunk gifts through"),
    pp("through", 2, 1, 4, "We cut ___ the park to save time.",
      ["through", "around", "past", "near"], [PU, PU, PU],
      "around the park is the LONG way — cutting to save time means through"),
    psf("near", 2, 1, 1, "We live ___ the school, so we walk there.",
      ["near", "inside", "above", "behind"], [FS, FS, FS]),
    psf("near", 2, 1, 2, "Keep the bucket ___ the door for spills.",
      ["near", "above", "through", "between"], [FS, FS, FS]),
    pp("near", 2, 1, 3, "Put the trolley ___ the till, not miles away.",
      ["near", "opposite", "behind", "inside"], [PU, PU, PU],
      "opposite and behind are possible spots — not miles away pins near"),
    pp("near", 2, 1, 4, "The nests sit ___ the pond, a short hop for the ducks.",
      ["near", "in", "over", "under"], [PU, PU, PU],
      "in the pond is possible for a duck nest — a short hop pins near, not in"),
    psf("opposite", 2, 1, 1, "The bakery is ___ the bank, just across the road.",
      ["opposite", "inside", "under", "through"], [FS, FS, FS],
      "just across the road defines opposite"),
    psf("opposite", 2, 1, 2, "Our team sat ___ theirs before the quiz.",
      ["opposite", "under", "through", "over"], [FS, FS, FS]),
    pp("opposite", 2, 1, 3, "She sat ___ me so we could talk face to face.",
      ["opposite", "beside", "behind", "near"], [PU, PU, PU],
      "beside and near both allow talking — face to face pins opposite"),
    pp("opposite", 2, 1, 4, "The two goals stand ___ each other on the pitch.",
      ["opposite", "beside", "near", "over"], [PU, PU, PU],
      "goals face each other end to end — beside would be the same end"),

    // ================= L2 phase 2: among around inside_outside =================
    psf("among", 2, 2, 1, "A red tulip grew ___ the yellow tulips.",
      ["among", "between", "inside", "above"], [FS, FS, FS],
      "many yellow ones — among, not the two-thing between"),
    psf("among", 2, 2, 2, "The hen hid ___ the tall reeds.",
      ["among", "between", "over", "onto"], [FS, FS, FS]),
    pp("among", 2, 2, 3, "The coin was lost ___ the pebbles.",
      ["among", "between", "under", "behind"], [PU, PU, PU],
      "under one pebble is possible — lost in MANY pins among; between needs exactly two"),
    pp("among", 2, 2, 4, "A deer stood ___ the trees, hard to spot.",
      ["among", "between", "behind", "near"], [PU, PU, PU],
      "behind one tree is possible — hard to spot in a WOOD pins among"),
    psf("around", 2, 2, 1, "The fence runs ___ the whole garden.",
      ["around", "across", "through", "over"], [FS, FS, FS],
      "the whole garden pins the ring shape of around"),
    psf("around", 2, 2, 2, "We joined hands and danced ___ the maypole.",
      ["around", "under", "through", "onto"], [FS, FS, FS]),
    pp("around", 2, 2, 3, "We walked ___ the puddle to keep our shoes dry.",
      ["around", "through", "over", "into"], [PU, PU, PU],
      "through gets you wet and over means a jump — walking dry pins around"),
    pp("around", 2, 2, 4, "The ribbon wraps twice ___ the box.",
      ["around", "over", "under", "past"], [PU, PU, PU],
      "over and under describe one pass — wrapping twice pins around"),
    psf("inside_outside", 2, 2, 1, "It poured with rain, so we played ___ the house.",
      ["inside", "outside", "above", "under"], [FS, FS, FS],
      "rain pins inside"),
    psf("inside_outside", 2, 2, 2, "The chicks stay ___ the coop at night, safe from foxes.",
      ["inside", "outside", "near", "behind"], [FS, FS, FS]),
    pp("inside_outside", 2, 2, 3, "Leave your muddy boots ___ the door, then come in.",
      ["outside", "inside", "beside", "behind"], [PU, PU, PU],
      "beside and behind the door are possible spots — muddy boots before coming IN pins outside"),
    pp("inside_outside", 2, 2, 4, "The pips are ___ the apple, so you cannot see them.",
      ["inside", "outside", "under", "on"], [PU, PU, PU],
      "cannot see them pins inside"),

    // ================= Retention reserve (form R) =================
    psc("on", 1, 1, 5, "ball_on_chair", "Where is the chair?",
      ["under the ball", "on the ball", "in the ball", "behind the ball"], [FS, FS, FS],
      "the inverse question of the same scene"),
    psc("between", 1, 2, 5, "cup_between_books", "Where are the books?",
      ["next to the cup", "in the cup", "under the cup", "above the cup"], [FS, FS, FS],
      "one book on each side — next to the cup"),
    ptc("in", 1, 1, 5, "The letters wait ___ the postbox.",
      ["in", "on", "beside", "behind"], [FS, FS, FS]),
    ptc("under", 1, 1, 5, "The cat cooled off ___ the shady bush.",
      ["under", "on", "above", "between"], [FS, FS, FS]),
    ptc("above", 1, 2, 5, "The kite flew high ___ our heads.",
      ["above", "under", "behind", "beside"], [FS, FS, FS]),
    ptc("next_to", 1, 1, 5, "The salt sits ___ the pepper on the shelf.",
      ["next to", "under", "above", "inside"], [FS, FS, FS]),
    psf("over", 2, 1, 5, "The cat leapt ___ the sleeping dog.",
      ["over", "under", "inside", "between"], [FS, FS, FS]),
    psf("through", 2, 1, 5, "Wind whistled ___ the gap in the wall.",
      ["through", "over", "behind", "onto"], [FS, FS, FS],
      "behind ties the in/wind overlap"),
    pp("near", 2, 1, 5, "Plant the herbs ___ the kitchen, handy for cooking.",
      ["near", "inside", "opposite", "above"], [PU, PU, PU],
      "inside the kitchen is possible for pots — a garden bed HANDY for cooking pins near"),
    pp("among", 2, 2, 5, "Mushrooms popped up ___ the fallen leaves.",
      ["among", "between", "under", "onto"], [PU, PU, PU]),
    psf("around", 2, 2, 5, "The moat runs ___ the castle.",
      ["around", "through", "onto", "above"], [FS, FS, FS]),
    psf("inside_outside", 2, 2, 5, "Keep the guinea pig ___ when it snows.",
      ["inside", "outside", "under", "between"], [FS, FS, FS])
  ].map(item => {
    if (item.v >= 5) item.retention = true;
    return item;
  })
};
