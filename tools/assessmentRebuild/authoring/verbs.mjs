// Verbs — v3 authored bank (wave W9, paired with nouns). Concept units replace
// the legacy 59 word-keys. The audit's generic-copy prompt pattern ("The
// picture shows what happens when someone can…") is dead — every L1 picture
// item names a real depicted action, and L2 verb_precision distractors are
// grammatical-but-wrong (the sense of the frame, not the syntax, picks the
// key — that is what makes L2 harder thinking).
// L1 GRAMMAR_IMAGE_CHOICE: one ACTION card among three thing-cards (the
// mirror of nouns' layout). Child wording: "doing word".
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §16.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const gic = (u, lvl, ph, v, prompt, cards, keyWord, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_IMAGE_CHOICE",
  prompt,
  spoken: prompt,
  cards,
  choices: cards.map(w => (w === keyWord ? K(w) : P(w, rationales[w] || "D-FUNCTION-SWAP"))),
  media: "image-required",
  note
});

const gwc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_WORD_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const gsf = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_SENTENCE_FIT",
  prompt: sentence,
  spoken: `Which doing word finishes the sentence? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

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
      ["clap", "drum", "tent", "fork"], "clap", {},
      "the drum is the trap — you PLAY it, but the card names a thing"),
    gwc("verb_action_body", 1, 1, 4, "Which word is a doing word?",
      ["jump", "bed", "red", "hat"], [FS, FS, FS]),
    gwc("verb_action_body", 1, 1, 5, "Which word is a doing word?",
      ["run", "sun", "fun", "bun"], [FS, FS, FS],
      "a rhyming panel — only the grammar separates them"),
    gwc("verb_action_body", 1, 1, 6, "Which word is a doing word?",
      ["kick", "sock", "leg", "shin"], [FS, FS, FS]),
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
      ["chew", "meat", "dish", "bread"], "chew", {},
      "all three thing-cards are chewable — the action card still wins"),
    gwc("verb_action_object", 1, 1, 4, "Which word is a doing word?",
      ["cut", "cup", "cap", "cot"], [FS, FS, FS]),
    gwc("verb_action_object", 1, 1, 5, "Which word is a doing word?",
      ["pour", "jug", "milk", "mug"], [FS, FS, FS]),
    gwc("verb_action_object", 1, 1, 6, "Which word is a doing word?",
      ["fold", "card", "sock", "flag"], [FS, FS, FS]),
    gic("verb_action_object", 1, 1, 7, "Which one shows a doing word — something you do to things?",
      ["stir", "pot", "lid", "moon"], "stir", {}),
    gwc("verb_action_object", 1, 1, 8, "Which word is a doing word?",
      ["lift", "apple", "moon", "rug"], [FS, FS, FS]),
    // ================= L1 · verb_everyday (phase 2) =================
    gic("verb_everyday", 1, 2, 1, "Which one shows a doing word — something you do every day?",
      ["eat", "plate", "cake", "corn"], "eat", {}),
    gic("verb_everyday", 1, 2, 2, "Which one shows a doing word — something you do every day?",
      ["sleep", "bed", "lamp", "quilt"], "sleep", {}),
    gic("verb_everyday", 1, 2, 3, "Which one shows a doing word — something you do every day?",
      ["read", "book", "desk", "shelf"], "read", {}),
    gwc("verb_everyday", 1, 2, 4, "Which word is a doing word?",
      ["sing", "song", "sun", "hat"], [FS, FS, FS]),
    gwc("verb_everyday", 1, 2, 5, "Which word is a doing word?",
      ["wash", "soap", "tub", "hat"], [FS, FS, FS]),
    gwc("verb_everyday", 1, 2, 6, "Which word is a doing word?",
      ["nap", "cot", "rug", "pup"], [FS, FS, FS]),
    gic("verb_everyday", 1, 2, 7, "Which one shows a doing word — something you do every day?",
      ["drink", "cup", "hat", "jug"], "drink", {},
      "pin ties the in/doing overlap"),
    gwc("verb_everyday", 1, 2, 8, "Which word is a doing word?",
      ["brush", "teeth", "soap", "hair"], [FS, FS, FS],
      "no second action word competes with brush"),

    // ================= L2 · verb_in_sentence (phase 1) =================
    gsf("verb_in_sentence", 2, 1, 1, "We ___ the raft to the dock.",
      ["pull", "rope", "wet", "dock"], [FS, FS, FS],
      "only pull can DO anything here — rope/wet/dock cannot fill a doing slot"),
    gsf("verb_in_sentence", 2, 1, 2, "The twins ___ over the puddle.",
      ["leap", "mud", "deep", "wide"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 3, "Please ___ the door quietly.",
      ["shut", "loud", "hinge", "knob"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 4, "Owls ___ after dark.",
      ["hunt", "moon", "sky", "wing"], [FS, FS, FS],
      "after dark, not sunset — sunset contains un and would gift the key a chunk"),
    gct("verb_in_sentence", 2, 1, 5, "Which word in this sentence is the doing word? \"The pup chased its dinner.\"",
      ["chased", "pup", "dinner", "its"], [FS, FS, FS],
      "dinner matches chased letter-for-letter in length, so the longest-word shortcut ties"),
    gct("verb_in_sentence", 2, 1, 6, "Which word in this sentence is the doing word? \"Gran knits thick socks.\"",
      ["knits", "Gran", "socks", "thick"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 7, "Crabs ___ across the sand.",
      ["creep", "claw", "shell", "salt"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 8, "We ___ the seeds each morning.",
      ["water", "soil", "green", "pot"], [FS, FS, FS],
      "water the verb — the noun reading has no slot here"),
    // ================= L2 · verb_vs_noun (phase 1) =================
    gct("verb_vs_noun", 2, 1, 1, "Which word is a doing word, not a naming word?",
      ["sing", "song", "singer", "band"], [FS, FS, FS],
      "the whole word family in one set — only sing does"),
    gct("verb_vs_noun", 2, 1, 2, "Which word is a doing word, not a naming word?",
      ["bake", "baker", "bread", "oven"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 3, "Which word is a doing word, not a naming word?",
      ["teach", "teacher", "class", "desk"], [FS, FS, FS]),
    gsf("verb_vs_noun", 2, 1, 4, "The ___ swims fifty laps a day.",
      ["swimmer", "swim", "swims", "swam"], [FS, FS, FS],
      "the verb family competes — only the naming word follows The"),
    gct("verb_vs_noun", 2, 1, 5, "Which word is a doing word, not a naming word?",
      ["climbed", "hill", "boots", "rope"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 6, "Which word is a doing word, not a naming word?",
      ["swept", "broom", "dust", "floor"], [FS, FS, FS]),
    gsf("verb_vs_noun", 2, 1, 7, "The ___ twirled across the stage.",
      ["dancer", "dances", "danced", "dancing"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 8, "Which word is a doing word, not a naming word?",
      ["painted", "painter", "wall", "colour"], [FS, FS, FS],
      "the past-tense form is unambiguously the action"),
    // ================= L2 · verb_precision (phase 2) =================
    gsf("verb_precision", 2, 2, 1, "The frog ___ over the log in one big spring.",
      ["jumped", "walked", "slept", "sat"], [PU, PU, PU],
      "all four are grammatical — one big spring pins jumped"),
    gsf("verb_precision", 2, 2, 2, "The soup ___ in the pot until bubbles rose.",
      ["boiled", "froze", "sat", "spilled"], [PU, PU, PU],
      "bubbles pin boiled"),
    gct("verb_precision", 2, 2, 3, "Which doing word fits best for water falling drop by drop?",
      ["drip", "drain", "pour", "splash"], [PU, PU, PU],
      "all four are water words — only one matches drop by drop; drain ties the dr/drop overlap"),
    gsf("verb_precision", 2, 2, 4, "She ___ the note in half and half again.",
      ["folded", "read", "wrote", "lost"], [PU, PU, PU],
      "in half and half again pins folded"),
    gsf("verb_precision", 2, 2, 5, "The snail ___ along, leaving a silver line.",
      ["crawled", "raced", "hopped", "flew"], [PU, PU, PU]),
    gsf("verb_precision", 2, 2, 6, "He ___ the balloon until it nearly burst.",
      ["blew", "tied", "popped", "held"], [PU, PU, PU],
      "nearly burst pins blew — popped would mean it DID burst"),
    gct("verb_precision", 2, 2, 7, "Which doing word fits best for moving on tiptoe without a sound?",
      ["sneak", "stomp", "march", "gallop"], [PU, PU, PU]),
    gsf("verb_precision", 2, 2, 8, "Dad ___ the squeaky wheel with oil.",
      ["fixed", "broke", "washed", "kicked"], [PU, PU, PU]),

    // ================= Retention reserve (form R) =================
    gwc("verb_action_body", 1, 1, 9, "Which word is a doing word?",
      ["stretch", "arm", "mat", "chin"], [FS, FS, FS],
      "chin ties the ch/which overlap"),
    gic("verb_action_object", 1, 1, 9, "Which one shows a doing word — something you do to things?",
      ["chop", "cloth", "brick", "belt"], "chop", {}),
    gwc("verb_everyday", 1, 2, 9, "Which word is a doing word?",
      ["yawn", "quilt", "clock", "moon"], [FS, FS, FS]),
    gsf("verb_in_sentence", 2, 1, 9, "Bees ___ from rose to rose.",
      ["drift", "wing", "sweet", "hive"], [FS, FS, FS]),
    gct("verb_vs_noun", 2, 1, 9, "Which word is a doing word, not a naming word?",
      ["dance", "dancer", "stage", "music"], [FS, FS, FS]),
    gsf("verb_precision", 2, 2, 9, "The ice ___ slowly in the warm sun.",
      ["melted", "grew", "sang", "slept"], [PU, PU, PU]),
    gwc("verb_action_object", 1, 1, 10, "Which word is a doing word?",
      ["wrap", "hat", "cup", "sun"], [FS, FS, FS]),
    gic("verb_everyday", 1, 2, 10, "Which one shows a doing word — something you do every day?",
      ["walk", "path", "gate", "park"], "walk", {}),
    gsf("verb_in_sentence", 2, 1, 10, "The wind ___ the washing dry.",
      ["blows", "peg", "line", "damp"], [FS, FS, FS]),
    gsf("verb_precision", 2, 2, 10, "The baby ___ at every funny face.",
      ["giggled", "wept", "slept", "frowned"], [PU, PU, PU])
  ].map(item => {
    if (item.v >= 9) item.retention = true;
    return item;
  })
};
