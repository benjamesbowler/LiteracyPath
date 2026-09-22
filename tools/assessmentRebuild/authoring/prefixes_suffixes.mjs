// Prefixes & Suffixes — v3 authored bank.
// Level 1 is deliberately ESL-accessible: one familiar base word, one common
// affix meaning, and short spoken language. Abstract morpheme meanings remain
// text-led rather than relying on subjective pictures. Inflection, spelling
// changes and transfer to less-familiar vocabulary begin at Level 2.

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
  prompt: `Which word fits: ${sentence}`,
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
    "The room is messy. Which word means not tidy?", "untidy", ["tidy", "retied", "untie"], "sad-child"),
  l1("prefix_un", 1, 5, "MORPHEME_TRANSFER",
    "Lee feels sick. Which word means not well?", "unwell", ["well", "wellness", "replay"], "unfair-game"),
  l1("prefix_un", 1, 6, "MORPHEME_TRANSFER",
    "Which word means opening something that was locked?", "unlock", ["relock", "lock", "locked"], "unkind-words"),

  // re- = again
  l1("prefix_re", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "The match ended. Which word means they will play again?", "replay", ["unhappy", "playful", "player"], "children-replay-game"),
  l1("prefix_re", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Eva's model broke. Which word means she will make it again?", "remake", ["unfair", "helpful", "maker"], "child-remakes-model"),
  l1("prefix_re", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Milo missed the clue. Which word means he will read it again?", "reread", ["unkind", "careful", "reader"], "child-rereads-book"),
  l1("prefix_re", 1, 4, "MORPHEME_TRANSFER",
    "The jug is empty. Which word means fill again?", "refill", ["unfilled", "filler", "filling"], "child-remakes-picture"),
  l1("prefix_re", 1, 5, "MORPHEME_TRANSFER",
    "Tell the story again. Which word means that?", "retell", ["telling", "teller", "untold"], "child-rereads-page"),
  l1("prefix_re", 1, 6, "MORPHEME_TRANSFER",
    "Use the bag again. Which word means that?", "reuse", ["unused", "useful", "user"], "children-replay-song"),

  // -ful = full of / showing
  l1("suffix_ful", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "Zara carries her friend's heavy bag. Which word describes Zara?", "helpful", ["helpless", "helper", "replay"], "helpful-child"),
  l1("suffix_ful", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Lena grinned and cheered at the good news. Which word describes Lena?", "joyful", ["joyless", "enjoy", "rejoice"], "joyful-child"),
  l1("suffix_ful", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Ben carries a full glass slowly. Which word describes Ben?", "careful", ["careless", "carer", "reader"], "careful-child-carrying-glass"),
  l1("suffix_ful", 1, 4, "MORPHEME_TRANSFER",
    "The kitten loves games. Which word means full of play?", "playful", ["player", "played", "replay"], "child-helping-friend"),
  l1("suffix_ful", 1, 5, "MORPHEME_TRANSFER",
    "Jo says thanks for the gift. How does Jo feel?", "thankful", ["thankless", "careless", "hopeless"], "child-smiling-with-joy"),
  l1("suffix_ful", 1, 6, "MORPHEME_TRANSFER",
    "Her shirt has many colors. Which word describes it?", "colorful", ["colorless", "careful", "playful"], "child-carefully-carrying-glass"),

  // -less = without
  l1("suffix_less", 2, 1, "MORPHEME_MEANING_CONTEXT",
    "The team thinks it cannot win. Which word describes them?", "hopeless", ["hopeful", "helper", "joyful"], "child-feeling-hopeless"),
  l1("suffix_less", 2, 2, "MORPHEME_MEANING_CONTEXT",
    "Ari steps onto the stage without fear. Which word describes Ari?", "fearless", ["fearful", "farmer", "joyful"], "fearless-child"),
  l1("suffix_less", 2, 3, "MORPHEME_MEANING_CONTEXT",
    "The tiny butterfly cannot hurt anyone. Which word describes it?", "harmless", ["harmful", "helper", "careful"], "harmless-butterfly"),
  l1("suffix_less", 2, 4, "MORPHEME_TRANSFER",
    "The baby has no teeth. Which word describes the baby?", "toothless", ["toothed", "teething", "toothy"], "harmless-butterfly-on-hand"),
  l1("suffix_less", 2, 5, "MORPHEME_TRANSFER",
    "Which word means ‘without sleep’?", "sleepless", ["sleepy", "sleeping", "asleep"], "child-trying-bravely"),
  l1("suffix_less", 2, 6, "MORPHEME_TRANSFER",
    "The trapped pup cannot help itself. Which word describes it?", "helpless", ["helpful", "hopeful", "playful"], "team-feeling-hopeless"),

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
  build("suffix_s_es", 1, 1, "Complete ‘I clap; she ___’.", "claps", ["clap", "clapping", "clapper"]),
  build("suffix_s_es", 1, 2, "Change ‘I brush’ to ‘He ___’.", "brushes", ["brush", "brushing", "brushed"]),
  transfer("suffix_s_es", 1, 3, "Birds sing now. One bird ___ while the others listen.", "sings", ["sing", "singing", "singer"]),
  context("suffix_s_es", 1, 4, "Now Dad ___ the car as we watch.", "washes", ["wash", "washing", "washed"]),
  context("suffix_s_es", 1, 5, "While I watch, my cat ___ on the mat.", "naps", ["nap", "napping", "napped"]),
  context("suffix_s_es", 1, 6, "Today Grandma ___ bread while I help her.", "bakes", ["bake", "baking", "baked"]),

  build("suffix_ing", 1, 1, "Add -ing to jump.", "jumping", ["jumps", "jumped", "singing"]),
  build("suffix_ing", 1, 2, "Add -ing to read.", "reading", ["reads", "ready", "singing"]),
  transfer("suffix_ing", 1, 3, "She is ___, making music with her voice.", "singing", ["sings", "sang", "singer"]),
  context("suffix_ing", 1, 4, "Right now, the pot is ___ on the stove.", "boiling", ["boils", "boil", "sleeping"]),
  context("suffix_ing", 1, 5, "We are ___ a sandcastle one bucket at a time.", "building", ["builds", "build", "painting"]),
  context("suffix_ing", 1, 6, "Keep ___! The finish line is close.", "running", ["runs", "run", "sleeping"]),

  build("suffix_ed", 1, 1, "Add -ed to walk.", "walked", ["walks", "walking", "opened"]),
  build("suffix_ed", 1, 2, "Add -ed to help.", "helped", ["helps", "helping", "hopped"]),
  transfer("suffix_ed", 1, 3, "Yesterday we ___ down from a low wall.", "jumped", ["jump", "jumps", "jumping"]),
  context("suffix_ed", 1, 4, "Yesterday we ___ step by step to the park.", "walked", ["walk", "walking", "helped"]),
  context("suffix_ed", 1, 5, "Last night, the baby ___ with tears for hours.", "cried", ["cries", "crying", "cry"]),
  context("suffix_ed", 1, 6, "We ___ the door before bed.", "locked", ["locks", "locking", "filled"]),

  build("suffix_er_est", 2, 1, "Add -est to tall.", "tallest", ["taller", "tall", "fastest"]),
  build("suffix_er_est", 2, 2, "Add -er to fast.", "faster", ["fastest", "fast", "taller"]),
  context("suffix_er_est", 2, 3, "Ana is ___ than Ben in height.", "taller", ["tallest", "tall", "faster"]),
  context("suffix_er_est", 2, 4, "Rex ran faster than everyone else. He was the ___.", "fastest", ["faster", "fast", "tallest"]),
  transfer("suffix_er_est", 2, 5, "One bag weighs more than the other. It is ___.", "heavier", ["heaviest", "heavy", "heavily"]),
  transfer("suffix_er_est", 2, 6, "Ten snails raced. Which word means slower than all the others?", "slowest", ["slower", "slow", "tallest"]),

  build("suffix_ly", 2, 1, "Add -ly to quick.", "quickly", ["quicker", "quickest", "softly"]),
  build("suffix_ly", 2, 2, "Add -ly to soft.", "softly", ["softer", "soft", "quickly"]),
  context("suffix_ly", 2, 3, "Set the eggs down ___, in a gentle way.", "gently", ["gentle", "gentler", "quickly"]),
  context("suffix_ly", 2, 4, "The mouse crept ___, without making a sound.", "quietly", ["quiet", "quieter", "loudly"]),
  transfer("suffix_ly", 2, 5, "Mia stepped onto the stage bravely. How did she step?", "in a brave way", ["in a soft way", "toward a brave person", "before she was brave"]),
  transfer("suffix_ly", 2, 6, "Jay held up the medal proudly. How did Jay hold it?", "in a proud way", ["in a quick way", "toward a proud person", "before he felt proud"]),

  build("prefix_pre", 2, 1, "Add pre- to heat.", "preheat", ["heated", "heats", "preview"]),
  build("prefix_pre", 2, 2, "Add pre- to view.", "preview", ["views", "viewed", "preheat"]),
  context("prefix_pre", 2, 3, "___ the oven before you mix the batter.", "Preheat", ["Cool", "Heated", "Preview"]),
  context("prefix_pre", 2, 4, "We watched a ___ before the movie started.", "preview", ["view", "viewed", "preheat"]),
  transfer("prefix_pre", 2, 5, "The coach gives a pretest. When is it taken?", "before the lessons", ["after the lessons", "during the best lesson", "before looking"]),
  transfer("prefix_pre", 2, 6, "A shop lets people preorder a game before release day. What can they do?", "order before it is out", ["order after it is out", "heat the order", "order more copies"])
];

const retentionItems = [
  l1("prefix_un", 1, 7, "MORPHEME_MEANING_CONTEXT", "The broken bridge could hurt someone. Which word describes it?", "unsafe", ["careless", "safety", "helper"], "unsafe-bridge"),
  l1("prefix_re", 1, 7, "MORPHEME_MEANING_CONTEXT", "The wall is patchy. Which word means paint it again?", "repaint", ["painting", "painter", "careful"], "child-repaints-wall"),
  l1("suffix_ful", 1, 7, "MORPHEME_MEANING_CONTEXT", "Noah believes the team can win. Which word describes Noah?", "hopeful", ["hopeless", "hoping", "unhappy"], "hopeful-child"),
  l1("suffix_less", 2, 7, "MORPHEME_MEANING_CONTEXT", "Lee rushed and spilled the paint. Which word describes Lee?", "careless", ["careful", "caring", "helper"], "careless-spill"),
  l1("suffix_er_person", 2, 7, "MORPHEME_MEANING_CONTEXT", "A person who bakes is a…", "baker", ["baking", "bakes", "remake"], "baker-with-bread"),
  l1("prefix_re", 1, 8, "MORPHEME_TRANSFER", "The block tower fell. Which word means build again?", "rebuild", ["builder", "building", "unbuilt"], "child-rebuilds-block-tower"),
  build("suffix_s_es", 1, 7, "Finish ‘I catch; she ___’.", "catches", ["catch", "catching", "catcher"]),
  build("suffix_ing", 1, 7, "Add -ing to cook.", "cooking", ["cooks", "cooked", "reading"]),
  build("suffix_ed", 1, 7, "Add -ed to play.", "played", ["plays", "playing", "walked"]),
  context("suffix_er_est", 2, 7, "Sam is quick, but Ali is even ___.", "quicker", ["quickest", "quick", "softer"]),
  build("suffix_ly", 2, 7, "Add -ly to brave.", "bravely", ["braver", "bravest", "softly"]),
  build("prefix_pre", 2, 7, "Add pre- to school.", "preschool", ["schools", "schooling", "preheat"])
].map(item => ({ ...item, retention: true }));

const freshPhaseItems = [
  l1("prefix_un", 1, 8, "MORPHEME_TRANSFER", "A cup is not used yet. Which word describes it?", "unused", ["useful", "reuse", "using"]),
  l1("suffix_ful", 1, 8, "MORPHEME_TRANSFER", "The room is full of peace. Which word fits?", "peaceful", ["peacemaker", "piece", "fearful"]),
  l1("suffix_less", 2, 8, "MORPHEME_MEANING_CONTEXT", "A broken tool has no use. It is ___.", "useless", ["useful", "used", "using"]),
  l1("suffix_less", 2, 9, "MORPHEME_TRANSFER", "The sky has no clouds. Which word describes it?", "cloudless", ["cloudy", "clouded", "clouding"]),
  l1("suffix_less", 2, 10, "MORPHEME_TRANSFER", "The dog has no home. Which word describes it?", "homeless", ["homeward", "homely", "homemade"]),
  l1("suffix_less", 2, 11, "MORPHEME_MEANING_CONTEXT", "The clock makes no sound. It is ___.", "soundless", ["sounding", "soundly", "resound"]),
  l1("suffix_er_person", 2, 8, "MORPHEME_MEANING_CONTEXT", "Who drives the bus?", "driver", ["driving", "drives", "driven"]),
  l1("suffix_er_person", 2, 9, "MORPHEME_TRANSFER", "Which word names a person who builds?", "builder", ["building", "rebuild", "built"]),
  l1("suffix_er_person", 2, 10, "MORPHEME_MEANING_CONTEXT", "A person who swims is a…", "swimmer", ["swimming", "swims", "swam"]),
  l1("suffix_er_person", 2, 11, "MORPHEME_TRANSFER", "Who grows food on a farm?", "grower", ["growing", "grown", "regrow"]),
  transfer("suffix_ing", 1, 8, "A dog is ___ after its ball right now.", "chasing", ["chases", "chased", "chase"]),
  transfer("suffix_ed", 1, 8, "Yesterday the class ___ seeds. Today shoots are growing.", "planted", ["plants", "planting", "plant"]),
  transfer("suffix_er_est", 2, 8, "All five jars are tall. This jar is taller than every other: the ___.", "tallest", ["taller", "tall", "tallness"]),
  transfer("suffix_ly", 2, 8, "She waited patiently. How did she wait?", "in a patient way", ["with a patient", "before waiting", "without any patience"])
];

export default {
  skillId: "prefixes_suffixes",
  skillName: "Prefixes & Suffixes",
  items: [...levelOneItems, ...levelTwoItems, ...retentionItems, ...freshPhaseItems]
};
