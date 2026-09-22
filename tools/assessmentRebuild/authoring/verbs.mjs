// Verbs — v3 authored bank (wave W9, paired with nouns). Concept units replace
// the legacy 59 word-keys. The audit's generic picture prompt pattern is dead:
// every L1 item uses a controlled language context, and L2 verb_precision
// distractors are grammatical-but-wrong (the sense of the frame, not the
// syntax, picks the key — that is what makes L2 harder thinking).
// L1 uses controlled sentence contexts so the child must identify a doing
// word from language. Static action/object pictures no longer reveal the key.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §16.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const L1_SENTENCES = {
  swim: "We ___ across the pool.",
  hop: "The rabbit can ___ over a log.",
  clap: "We ___ when the song ends.",
  dig: "The dog can ___ in the soil.",
  draw: "Please ___ a boat on the paper.",
  press: "Please ___ the switch once.",
  chew: "We ___ our food before swallowing.",
  stir: "Please ___ the soup with care.",
  eat: "We ___ lunch at noon.",
  sleep: "Babies ___ in their cribs.",
  read: "We ___ a book after lunch.",
  drink: "We ___ water when we are thirsty.",
  chop: "Please ___ the carrots into pieces.",
  walk: "We ___ to school each morning."
};

const L1_WORD_SENTENCES = {
  jump: ["I jump over a puddle.", ["I", "over", "puddle"]],
  run: ["We run around the track.", ["we", "around", "track"]],
  kick: ["I kick the ball hard.", ["I", "ball", "hard"]],
  skip: ["We skip down the path.", ["we", "down", "path"]],
  cut: ["I cut the paper carefully.", ["I", "paper", "carefully"]],
  pour: ["We pour milk into cups.", ["milk", "into", "cups"]],
  fold: ["I fold the red card.", ["I", "red", "card"]],
  lift: ["We lift the heavy rug.", ["we", "heavy", "rug"]],
  sing: ["We sing a happy song.", ["we", "happy", "song"]],
  wash: ["I wash my muddy hands.", ["my", "muddy", "hands"]],
  nap: ["Babies nap after their lunch.", ["babies", "after", "lunch"]],
  brush: ["We brush our teeth daily.", ["our", "teeth", "daily"]],
  stretch: ["I stretch before breakfast.", ["I", "before", "breakfast"]],
  yawn: ["We yawn after a long day.", ["we", "long", "day"]],
  wrap: ["We wrap a small gift.", ["we", "small", "gift"]],
  breathe: ["We breathe air through our noses.", ["we", "through", "noses"]],
  listen: ["We listen to a bedtime story.", ["we", "bedtime", "story"]],
  dress: ["I dress myself each morning.", ["I", "myself", "morning"]],
  comb: ["I comb my long hair.", ["my", "long", "hair"]]
};

const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: `Which doing word fits: ${L1_SENTENCES[keyWord]}`,
  spoken: `Which doing word fits? ${L1_SENTENCES[keyWord].replace("___", "hmm")}`,
  sentence: L1_SENTENCES[keyWord],
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w] || "D-FUNCTION-SWAP"))),
  media: "text",
  note: note || "language context, not a category-revealing picture, provides the evidence"
});

const gwc = (u, lvl, ph, v, _prompt, words, _rationales, note = "") => {
  const key = words[0];
  const [sentence, foils] = L1_WORD_SENTENCES[key];
  const prompt = `Which word tells the action? ${sentence}`;
  return { u, lvl, ph, v, fmt: "GRAMMAR_WORD_CHOICE", prompt, spoken: prompt,
    sentence, choices: [K(key), ...foils.map(w => P(w, "D-FUNCTION-SWAP"))],
    media: "text", note: note || "Identify the action among words from the same sentence." };
};

const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => {
  const task = u === "verb_precision" ? "Which doing word fits best" : "Which doing word fits";
  return {
    u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
    prompt: `${task}: ${sentence}`,
    spoken: `${task}? ${sentence.replace("___", "hmm")}`,
    sentence,
    choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
    media: "text",
    note
  };
};

const gct = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_CONTRAST",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const FS = "D-FUNCTION-SWAP";
const PU = "D-PLAUSIBLE-UNSUPPORTED";

// Fresh everyday actions and semantic contrasts for the second full sitting.
const freshPhaseItems = [
  gsf("verb_everyday", 1, 2, 11, "Please ___ your nose using a tissue.", ["wipe", "soft", "paper", "gently"], [FS, FS, FS]),
  gsf("verb_everyday", 1, 2, 12, "We ___ our bags before school.", ["pack", "lunch", "books", "heavy"], [FS, FS, FS]),
  gsf("verb_everyday", 1, 2, 13, "I ___ my shoes with a bow.", ["tie", "ribbon", "laces", "tight"], [FS, FS, FS]),
  gsf("verb_everyday", 1, 2, 14, "Please ___ the pencil back to me.", ["give", "handful", "mine", "gently"], [FS, FS, FS]),
  gwc("verb_everyday", 1, 2, 15, "", ["breathe"], []),
  gwc("verb_everyday", 1, 2, 16, "", ["listen"], []),
  gwc("verb_everyday", 1, 2, 17, "", ["dress"], []),
  gwc("verb_everyday", 1, 2, 18, "", ["comb"], []),
  gsf("verb_precision", 2, 2, 11, "She ___ the sponge, pressing water out.", ["squeezed", "dipped", "soaked", "dried"], [PU, PU, PU]),
  gsf("verb_precision", 2, 2, 12, "He ___ the sack along the floor without lifting it.", ["dragged", "carried", "raised", "threw"], [PU, PU, PU]),
  gct("verb_precision", 2, 2, 13, "Which action means speaking so softly only someone close can hear?", ["whispering", "shouting", "chanting", "calling"], [PU, PU, PU]),
  gsf("verb_precision", 2, 2, 14, "Gentle rain ___ in tiny, fine drops.", ["drizzled", "poured", "splashed", "gushed"], [PU, PU, PU]),
  gsf("verb_precision", 2, 2, 15, "The rubber band ___ longer as we pulled it.", ["stretched", "snapped", "shrunk", "twisted"], [PU, PU, PU]),
  gct("verb_precision", 2, 2, 16, "Which action means a quick look through a small gap?", ["peeking", "staring", "watching", "searching"], [PU, PU, PU]),
  gsf("verb_precision", 2, 2, 17, "We ___ the blocks one on top of another.", ["stacked", "scattered", "spread", "lined"], [PU, PU, PU]),
  gsf("verb_precision", 2, 2, 18, "She ___ the pan, rubbing hard with a brush.", ["scrubbed", "rinsed", "soaked", "dried"], [PU, PU, PU])
];

export default {
  skillId: "verbs",
  skillName: "Verbs",
  items: [
    // ================= L1 · verb_action_body (phase 1) =================
    gic("verb_action_body", 1, 1, 1, "Which one shows a doing word — something you do?",
      ["swim", "cup", "hat", "lamp"], "swim", {}),
    gic("verb_action_body", 1, 1, 2, "Which one shows a doing word — something you do?",
      ["hop", "belt", "clock", "spoon"], "hop", {}),
    gic("verb_action_body", 1, 1, 3, "Which one shows a doing word — something you do?",
      ["clap", "drummer", "tent", "fork"], "clap", {},
      "drummer names the person; clap alone can fill the action slot"),
    gwc("verb_action_body", 1, 1, 4, "Which word is a doing word?",
      ["jump", "bed", "red", "hat"], [FS, FS, FS]),
    gwc("verb_action_body", 1, 1, 5, "Which word is a doing word?",
      ["run", "sun", "fun", "bun"], [FS, FS, FS],
      "Run names the action; the remaining choices give the people, relation and place."),
    gwc("verb_action_body", 1, 1, 6, "Which word is a doing word?",
      ["kick", "shoe", "leg", "shin"], [FS, FS, FS]),
    gic("verb_action_body", 1, 1, 7, "Which one shows a doing word — something you do?",
      ["dig", "bag", "log", "mug"], "dig", {}),
    gwc("verb_action_body", 1, 1, 8, "Which word is a doing word?",
      ["skip", "rope", "shoe", "path"], [FS, FS, FS]),
    // ================= L1 · verb_action_object (phase 1) =================
    gic("verb_action_object", 1, 1, 1, "Which one shows a doing word — something you do to things?",
      ["draw", "desk", "bell", "boat"], "draw", {}),
    gic("verb_action_object", 1, 1, 2, "Which one shows a doing word — something you do to things?",
      ["press", "brick", "shell", "moon"], "press", {}),
    gic("verb_action_object", 1, 1, 3, "Which one shows a doing word — something you do to things?",
      ["chew", "meat", "bread", "apple"], "chew", {}),
    gwc("verb_action_object", 1, 1, 4, "Which word is a doing word?",
      ["cut", "cup", "cap", "cot"], [FS, FS, FS]),
    gwc("verb_action_object", 1, 1, 5, "Which word is a doing word?",
      ["pour", "cold", "white", "warm"], [FS, FS, FS]),
    gwc("verb_action_object", 1, 1, 6, "Which word is a doing word?",
      ["fold", "card", "sock", "flag"], [FS, FS, FS]),
    gic("verb_action_object", 1, 1, 7, "Which one shows a doing word — something you do to things?",
      ["stir", "careful", "quietly", "hot"], "stir", {}),
    gwc("verb_action_object", 1, 1, 8, "Which word is a doing word?",
      ["lift", "apple", "moon", "rug"], [FS, FS, FS]),
    // ================= L1 · verb_everyday (phase 2) =================
    gic("verb_everyday", 1, 2, 1, "Which one shows a doing word — something you do every day?",
      ["eat", "hungry", "cake", "corn"], "eat", {}),
    gic("verb_everyday", 1, 2, 2, "Which one shows a doing word — something you do every day?",
      ["sleep", "bed", "lamp", "quilt"], "sleep", {}),
    gic("verb_everyday", 1, 2, 3, "Which one shows a doing word — something you do every day?",
      ["read", "book", "desk", "shelf"], "read", {}),
    gwc("verb_everyday", 1, 2, 4, "Which word is a doing word?",
      ["sing", "song", "sun", "hat"], [FS, FS, FS]),
    gwc("verb_everyday", 1, 2, 5, "Which word is a doing word?",
      ["wash", "sink", "tub", "hat"], [FS, FS, FS]),
    gwc("verb_everyday", 1, 2, 6, "Which word is a doing word?",
      ["nap", "cot", "rug", "pup"], [FS, FS, FS]),
    gic("verb_everyday", 1, 2, 7, "Which one shows a doing word — something you do every day?",
      ["drink", "cup", "hat", "jug"], "drink", {},
      "Drink names the action that fits water and thirst."),
    gwc("verb_everyday", 1, 2, 8, "Which word is a doing word?",
      ["brush", "teeth", "soap", "hair"], [FS, FS, FS],
      "no second action word competes with brush"),

    // ================= L2 · verb_in_sentence (phase 1) =================
    gsf("verb_in_sentence", 2, 1, 1, "We ___ the raft toward the dock.",
      ["pull", "rope", "wet", "tight"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 2, "The twins ___ over the puddle.",
      ["leap", "mud", "deep", "wide"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 3, "Please ___ the door quietly.",
      ["shut", "loud", "hinges", "doorknob"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 4, "Owls ___ after dark.",
      ["hunt", "moon", "sky", "feathers"], [FS, FS, FS],
      "after dark, not sunset — sunset contains un and would gift the key a chunk"),
    gct("verb_in_sentence", 2, 1, 5, "Which word in this sentence is the doing word? \"The pup chased its dinner.\"",
      ["chased", "pup", "dinner", "its"], [FS, FS, FS],
      "dinner matches chased letter-for-letter in length, so the longest-word shortcut ties"),
    gct("verb_in_sentence", 2, 1, 6, "Which word in this sentence is the doing word? \"Grandma knits thick socks.\"",
      ["knits", "Grandma", "socks", "thick"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 7, "Crabs ___ slowly across the sand.",
      ["creep", "shells", "sideways", "shore"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 8, "We ___ the seeds each morning.",
      ["water", "bucket", "sunshine", "roots"], [FS, FS, FS]),
    // ================= L2 · verb_vs_noun (phase 1) =================
    gct("verb_vs_noun", 2, 1, 1, "Which word is the doing word in ‘We sing songs together’?",
      ["sing", "we", "songs", "together"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 2, "Which word is the doing word in ‘The baker can bake bread’?",
      ["bake", "baker", "bread", "can"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 3, "Which word is the doing word in ‘Teachers teach our class’?",
      ["teach", "teachers", "class", "our"], [FS, FS, FS]),
    gsf("verb_vs_noun", 2, 1, 4, "The athlete can ___ fifty laps a day.",
      ["swim", "swimmer", "swims", "swam"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 5, "Which word is the doing word in ‘We climbed the mountain slowly’?",
      ["climbed", "we", "mountain", "slowly"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 6, "Which word is the doing word in ‘Mia swept the dusty floor’?",
      ["swept", "Mia", "floor", "dusty"], [FS, FS, FS]),
    gsf("verb_vs_noun", 2, 1, 7, "The dancer can ___ across the stage.",
      ["dance", "dancer", "danced", "dancing"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 8, "Which word is the doing word in ‘Mia painted the bedroom wall’?",
      ["painted", "Mia", "bedroom", "wall"], [FS, FS, FS]),
    // ================= L2 · verb_precision (phase 2) =================
    gsf("verb_precision", 2, 2, 1, "The frog ___ over the log in one big spring.",
      ["jumped", "walked", "slept", "sat"], [PU, PU, PU],
      "all four are grammatical — one big spring pins jumped"),
    gsf("verb_precision", 2, 2, 2, "The soup ___, making bubbles as it got very hot.",
      ["boiled", "froze", "sat", "spilled"], [PU, PU, PU],
      "bubbles pin boiled"),
    gct("verb_precision", 2, 2, 3, "Which doing word fits best for water falling drop by drop?",
      ["drip", "drain", "pour", "splash"], [PU, PU, PU],
      "all four are water words — only one matches drop by drop; drain ties the dr/drop overlap"),
    gsf("verb_precision", 2, 2, 4, "She ___ the note in half and half again.",
      ["folded", "read", "wrote", "lost"], [PU, PU, PU],
      "in half and half again pins folded"),
    gsf("verb_precision", 2, 2, 5, "The snail ___ slowly, leaving a silver line.",
      ["crawled", "rested", "hid", "waited"], [PU, PU, PU]),
    gsf("verb_precision", 2, 2, 6, "He ___ up the balloon until it nearly burst.",
      ["blew", "tied", "popped", "held"], [PU, PU, PU],
      "nearly burst pins blew — popped would mean it DID burst"),
    gct("verb_precision", 2, 2, 7, "Which doing word fits best for moving on tiptoe without a sound?",
      ["sneak", "stomp", "march", "gallop"], [PU, PU, PU]),
    gsf("verb_precision", 2, 2, 8, "Dad ___ the squeaky wheel with oil.",
      ["fixed", "broke", "washed", "kicked"], [PU, PU, PU]),

    // ================= Retention reserve (form R) =================
    gwc("verb_action_body", 1, 1, 9, "Which word is a doing word?",
      ["stretch", "arm", "mat", "chin"], [FS, FS, FS],
      "The complete sentence distinguishes the action from its surrounding words."),
    gic("verb_action_object", 1, 1, 9, "Which one shows a doing word — something you do to things?",
      ["chop", "cloth", "brick", "belt"], "chop", {}),
    gwc("verb_everyday", 1, 2, 9, "Which word is a doing word?",
      ["yawn", "quilt", "clock", "moon"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 9, "Bees ___ from rose to rose.",
      ["drift", "wings", "sweet", "hive"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 9, "Which word is the doing word in ‘We dance to the music’?",
      ["dance", "we", "music", "to"], [FS, FS, FS]),
    gsf("verb_precision", 2, 2, 9, "The ice ___ into water in the sun.",
      ["melted", "froze", "cracked", "drifted"], [PU, PU, PU]),
    gwc("verb_action_object", 1, 1, 10, "Which word is a doing word?",
      ["wrap", "hat", "cup", "sun"], [FS, FS, FS]),
    gic("verb_everyday", 1, 2, 10, "Which one shows a doing word — something you do every day?",
      ["walk", "path", "gate", "park"], "walk", {}),
    gsf("verb_in_sentence", 2, 1, 10, "The wind ___ the clothes dry.",
      ["blows", "peg", "line", "damp"], [FS, FS, FS]),
    gsf("verb_precision", 2, 2, 10, "The baby ___ happily at every funny face.",
      ["giggled", "wept", "slept", "frowned"], [PU, PU, PU])
  ].map(item => {
    if (item.v >= 9) item.retention = true;
    return item;
  }).concat(freshPhaseItems)
};
