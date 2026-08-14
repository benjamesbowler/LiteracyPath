// Prefixes & Suffixes — v3 authored bank.
// Level 1 is deliberately ESL-accessible: one familiar base word, one common
// affix meaning, short spoken language, and one supporting scene. Inflection,
// spelling changes and transfer to less-familiar vocabulary begin at Level 2.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const FS = "D-FUNCTION-SWAP";
const PT = "D-PATTERN-TRAP";
const OPP = "D-OPPOSITE";
const SEM = "D-SEMANTIC";

const choices = (key, distractors) => [
  K(key),
  ...distractors.map((text, index) => P(text, [OPP, PT, SEM][index] || SEM))
];

const l1 = (u, ph, v, fmt, prompt, key, distractors) => ({
  u,
  lvl: 1,
  ph,
  v,
  fmt,
  prompt,
  spoken: prompt,
  choices: choices(key, distractors),
  media: "text",
  constructClaim: "apply_affix_meaning_in_context"
});

const build = (u, ph, v, prompt, key, distractors) => ({
  u,
  lvl: 2,
  ph,
  v,
  fmt: "MORPHEME_BUILD",
  prompt,
  spoken: prompt,
  choices: [
    K(key),
    P(distractors[0], FS),
    P(distractors[1], FS),
    P(distractors[2], PT)
  ],
  media: "text"
});

const context = (u, ph, v, sentence, key, distractors, note = "") => ({
  u,
  lvl: 2,
  ph,
  v,
  fmt: "MORPHEME_MEANING_CONTEXT",
  prompt: sentence,
  spoken: `Which word fits? ${sentence.replace("___", "…")}`,
  sentence,
  choices: [
    K(key),
    P(distractors[0], FS),
    P(distractors[1], FS),
    P(distractors[2], PT)
  ],
  media: "text",
  note
});

const transfer = (u, ph, v, prompt, key, distractors) => ({
  u,
  lvl: 2,
  ph,
  v,
  fmt: "MORPHEME_TRANSFER",
  prompt,
  spoken: prompt,
  choices: choices(key, distractors),
  media: "text"
});

const levelOneItems = [
  // un- = not / opposite
  l1("prefix_un", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "Jo dropped the cake and stopped smiling. Which word describes Jo?", "unhappy", ["joyful", "careful", "helpful"], "child-feeling-unhappy"),
  l1("prefix_un", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Only one team was allowed to score. Which word describes the game?", "unfair", ["careful", "helpful", "joyful"], "two-children-unfair-share"),
  l1("prefix_un", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "The note called Noor nasty names. Which word describes the note?", "unkind", ["joyful", "helpful", "careful"], "child-being-unkind"),
  l1("prefix_un", 1, 4, "MORPHEME_TRANSFER",
    "Mia feels sad. Which word also means not happy?", "unhappy", ["unfair", "joyful", "painter"], "sad-child"),
  l1("prefix_un", 1, 5, "MORPHEME_TRANSFER",
    "The game is not fair. Which word means not fair?", "unfair", ["careful", "remake", "painter"], "unfair-game"),
  l1("prefix_un", 1, 6, "MORPHEME_TRANSFER",
    "The words were not kind. Which word means not kind?", "unkind", ["joyful", "reread", "helper"], "unkind-words"),

  // re- = again
  l1("prefix_re", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "The match ended. They want to play once more. Pick the word.", "replay", ["unhappy", "playful", "player"], "children-replay-game"),
  l1("prefix_re", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Eva's model broke. She will make it once more. Pick the word.", "remake", ["unfair", "helpful", "maker"], "child-remakes-model"),
  l1("prefix_re", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Milo missed the clue. He reads once more. Pick the word.", "reread", ["unkind", "careful", "reader"], "child-rereads-book"),
  l1("prefix_re", 1, 4, "MORPHEME_TRANSFER",
    "The picture went wrong. I will make it again. Which word fits?", "remake", ["unmake", "maker", "making"], "child-remakes-picture"),
  l1("prefix_re", 1, 5, "MORPHEME_TRANSFER",
    "I missed the page. I will read it again. Which word fits?", "reread", ["reader", "reading", "unread"], "child-rereads-page"),
  l1("prefix_re", 1, 6, "MORPHEME_TRANSFER",
    "We loved the song. We will play it again. Which word fits?", "replay", ["player", "playful", "unplayed"], "children-replay-song"),

  // -ful = full of / showing
  l1("suffix_ful", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "Zara carries her friend's heavy bag. Which word describes Zara?", "helpful", ["helpless", "helper", "replay"], "helpful-child"),
  l1("suffix_ful", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Which word means full of joy?", "joyful", ["joyless", "enjoy", "rejoice"], "joyful-child"),
  l1("suffix_ful", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Ben moves the glass slowly. It must not spill. Pick a word.", "careful", ["careless", "carer", "reader"], "careful-child-carrying-glass"),
  l1("suffix_ful", 1, 4, "MORPHEME_TRANSFER",
    "Ava helps her friend. Which word describes Ava?", "helpful", ["helpless", "replay", "singer"], "child-helping-friend"),
  l1("suffix_ful", 1, 5, "MORPHEME_TRANSFER",
    "Noah smiles with joy. Which word describes Noah?", "joyful", ["joyless", "unfair", "reader"], "child-smiling-with-joy"),
  l1("suffix_ful", 1, 6, "MORPHEME_TRANSFER",
    "Kim carries the glass slowly. Which word describes Kim?", "careful", ["careless", "remake", "teacher"], "child-carefully-carrying-glass"),

  // -less = without
  l1("suffix_less", 2, 1, "MORPHEME_MEANING_CONTEXT",
    "The team thinks it cannot win. Which word describes them?", "hopeless", ["hopeful", "helper", "joyful"], "child-feeling-hopeless"),
  l1("suffix_less", 2, 2, "MORPHEME_MEANING_CONTEXT",
    "Ari climbs onto the stage without being afraid. Which word describes Ari?", "fearless", ["fearful", "farmer", "careful"], "fearless-child"),
  l1("suffix_less", 2, 3, "MORPHEME_MEANING_CONTEXT",
    "The tiny butterfly cannot hurt anyone. Which word describes it?", "harmless", ["harmful", "helper", "careful"], "harmless-butterfly"),
  l1("suffix_less", 2, 4, "MORPHEME_TRANSFER",
    "The tiny butterfly cannot hurt you. Which word describes it?", "harmless", ["harmful", "helpful", "replay"], "harmless-butterfly-on-hand"),
  l1("suffix_less", 2, 5, "MORPHEME_TRANSFER",
    "Leo is not afraid to try. Which word describes Leo?", "fearless", ["fearful", "careful", "reader"], "child-trying-bravely"),
  l1("suffix_less", 2, 6, "MORPHEME_TRANSFER",
    "The team thinks it cannot win. Which word describes the team?", "hopeless", ["hopeful", "joyful", "painter"], "team-feeling-hopeless"),

  // -er = a person who
  l1("suffix_er_person", 2, 1, "MORPHEME_MEANING_CONTEXT",
    "A person who sings is a…", "singer", ["singing", "sings", "replay"], "person-singing"),
  l1("suffix_er_person", 2, 2, "MORPHEME_MEANING_CONTEXT",
    "A person who teaches is a…", "teacher", ["teaching", "teaches", "unfair"], "teacher-with-class"),
  l1("suffix_er_person", 2, 3, "MORPHEME_MEANING_CONTEXT",
    "A person who helps is a…", "helper", ["helping", "helpful", "remake"], "child-helper"),
  l1("suffix_er_person", 2, 4, "MORPHEME_TRANSFER",
    "Who reads books to the class?", "reader", ["reading", "reread", "careful"], "person-reading-to-class"),
  l1("suffix_er_person", 2, 5, "MORPHEME_TRANSFER",
    "Who paints a picture?", "painter", ["painting", "repaint", "joyful"], "person-painting"),
  l1("suffix_er_person", 2, 6, "MORPHEME_TRANSFER",
    "Who works on a farm?", "farmer", ["farming", "farm", "fearless"], "farmer-on-farm")
];

const levelTwoItems = [
  build("suffix_s_es", 1, 1, "Add -s to hen.", "hens", ["hen", "pens", "eggs"]),
  build("suffix_s_es", 1, 2, "Add -es to fox.", "foxes", ["fox", "boxes", "dishes"]),
  build("suffix_s_es", 1, 3, "Add -s to cup.", "cups", ["cup", "caps", "mugs"]),
  context("suffix_s_es", 1, 4, "Every day, Dad ___ the car.", "washes", ["wash", "washing", "washed"]),
  context("suffix_s_es", 1, 5, "My cat ___ on the mat each day.", "naps", ["nap", "napping", "napped"]),
  context("suffix_s_es", 1, 6, "Gran ___ bread every Sunday.", "bakes", ["bake", "baking", "baked"]),

  build("suffix_ing", 1, 1, "Add -ing to jump.", "jumping", ["jumps", "jumped", "singing"]),
  build("suffix_ing", 1, 2, "Add -ing to read.", "reading", ["reads", "ready", "singing"]),
  build("suffix_ing", 1, 3, "Add -ing to play.", "playing", ["plays", "played", "doing"]),
  context("suffix_ing", 1, 4, "Right now, the pot is ___ on the stove.", "boiling", ["boils", "boil", "sleeping"]),
  context("suffix_ing", 1, 5, "We are ___ a sandcastle today.", "building", ["builds", "build", "painting"]),
  context("suffix_ing", 1, 6, "Keep ___! The finish line is close.", "running", ["runs", "run", "singing"]),

  build("suffix_ed", 1, 1, "Add -ed to walk.", "walked", ["walks", "walking", "opened"]),
  build("suffix_ed", 1, 2, "Add -ed to help.", "helped", ["helps", "helping", "hopped"]),
  build("suffix_ed", 1, 3, "Add -ed to jump.", "jumped", ["jumping", "jumps", "landed"]),
  context("suffix_ed", 1, 4, "Yesterday we ___ to the park.", "walked", ["walk", "walking", "jumped"]),
  context("suffix_ed", 1, 5, "Last night, the baby ___ for hours.", "cried", ["cries", "crying", "called"]),
  context("suffix_ed", 1, 6, "We ___ the door before bed.", "locked", ["locks", "locking", "filled"]),

  build("suffix_er_est", 2, 1, "Add -est to tall.", "tallest", ["taller", "tall", "fastest"]),
  build("suffix_er_est", 2, 2, "Add -er to fast.", "faster", ["fastest", "fast", "taller"]),
  context("suffix_er_est", 2, 3, "Ben is tall, but Ana is even ___.", "taller", ["tallest", "tall", "faster"]),
  context("suffix_er_est", 2, 4, "Of all three dogs, Rex is the ___.", "fastest", ["faster", "fast", "tallest"]),
  transfer("suffix_er_est", 2, 5, "Which word compares two tall things?", "taller", ["tallest", "tall", "slowest"]),
  transfer("suffix_er_est", 2, 6, "Which word picks the slow one from every snail?", "slowest", ["slower", "slow", "tallest"]),

  build("suffix_ly", 2, 1, "Add -ly to quick.", "quickly", ["quicker", "quickest", "softly"]),
  build("suffix_ly", 2, 2, "Add -ly to soft.", "softly", ["softer", "soft", "quickly"]),
  context("suffix_ly", 2, 3, "Set the eggs down ___, with no bumps.", "gently", ["gentle", "gentler", "quickly"]),
  context("suffix_ly", 2, 4, "The mouse crept ___ past the cat.", "quietly", ["quiet", "quieter", "loudly"]),
  transfer("suffix_ly", 2, 5, "Mia trembled but stepped onto the stage bravely. How did she step?", "in a brave way", ["in a soft way", "like a brave person", "while being afraid"]),
  transfer("suffix_ly", 2, 6, "Jay held up the medal proudly. How did Jay hold it?", "in a proud way", ["in a quick way", "like a proud person", "while being sad"]),

  build("prefix_pre", 2, 1, "Add pre- to heat.", "preheat", ["heated", "heats", "preview"]),
  build("prefix_pre", 2, 2, "Add pre- to view.", "preview", ["views", "viewed", "preheat"]),
  context("prefix_pre", 2, 3, "___ the oven before you mix the batter.", "Preheat", ["Heat", "Heated", "Preview"]),
  context("prefix_pre", 2, 4, "We watched a ___ before the film opened.", "preview", ["view", "viewed", "preheat"]),
  transfer("prefix_pre", 2, 5, "The coach gives a pretest before the lessons begin. When is it taken?", "before the lessons", ["after the lessons", "during the best lesson", "before looking"]),
  transfer("prefix_pre", 2, 6, "A shop lets people preorder a game before release day. What can they do?", "order before it is out", ["order after it is out", "heat the order", "order more copies"])
];

const retentionItems = [
  l1("prefix_un", 1, 7, "MORPHEME_MEANING_CONTEXT", "The broken bridge could hurt someone. Which word describes it?", "unsafe", ["careless", "safety", "helper"], "unsafe-bridge"),
  l1("prefix_re", 1, 7, "MORPHEME_MEANING_CONTEXT", "The wall is patchy. Kim will paint once more. Pick the word.", "repaint", ["painting", "painter", "careful"], "child-repaints-wall"),
  l1("suffix_ful", 1, 7, "MORPHEME_MEANING_CONTEXT", "Which word means full of hope?", "hopeful", ["hopeless", "hoping", "unhappy"], "hopeful-child"),
  l1("suffix_less", 2, 7, "MORPHEME_MEANING_CONTEXT", "Which word means without care?", "careless", ["careful", "caring", "unsafe"], "careless-spill"),
  l1("suffix_er_person", 2, 7, "MORPHEME_MEANING_CONTEXT", "A person who bakes is a…", "baker", ["baking", "bakes", "remake"], "baker-with-bread"),
  l1("prefix_re", 1, 8, "MORPHEME_TRANSFER", "The block tower fell. Which word means build again?", "rebuild", ["builder", "building", "unbuilt"], "child-rebuilds-block-tower"),
  build("suffix_s_es", 1, 7, "Add -es to bus.", "buses", ["bus", "boxes", "foxes"]),
  build("suffix_ing", 1, 7, "Add -ing to cook.", "cooking", ["cooks", "cooked", "reading"]),
  build("suffix_ed", 1, 7, "Add -ed to play.", "played", ["plays", "playing", "walked"]),
  context("suffix_er_est", 2, 7, "Sam is quick, but Ali is even ___.", "quicker", ["quickest", "quick", "softer"]),
  build("suffix_ly", 2, 7, "Add -ly to brave.", "bravely", ["braver", "bravest", "softly"]),
  build("prefix_pre", 2, 7, "Add pre- to school.", "preschool", ["schools", "schooling", "preheat"])
].map(item => ({ ...item, retention: true }));

export default {
  skillId: "prefixes_suffixes",
  skillName: "Prefixes & Suffixes",
  items: [...levelOneItems, ...levelTwoItems, ...retentionItems]
};
