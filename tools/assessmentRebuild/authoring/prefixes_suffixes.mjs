// Prefixes & Suffixes — v3 authored bank.
// Level 1 is deliberately ESL-accessible: one familiar base word, one common
// affix meaning, and short spoken language. Abstract morpheme meanings remain
// text-led rather than relying on subjective pictures. Inflection, spelling
// changes and transfer to less-familiar vocabulary begin at Level 2.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const MOR = "D-MORPH-LITERAL";
const UNS = "D-PLAUSIBLE-UNSUPPORTED";
const OPP = "D-OPPOSITE";

// Each distractor carries its reviewed misconception; array position has no meaning.
const choices = (key, distractors) => [
  K(key),
  ...distractors
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
  choices: choices(key, distractors),
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
  choices: choices(key, distractors),
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
    "Jo dropped the cake and stopped smiling. Which word describes Jo?", "unhappy", [P("joyful", OPP), P("careful", UNS), P("helpful", UNS)], "child-feeling-unhappy"),
  l1("prefix_un", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Only one team was allowed to score. Which word describes the game?", "unfair", [P("careful", UNS), P("helpful", UNS), P("joyful", UNS)], "two-children-unfair-share"),
  l1("prefix_un", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "The note called Noor nasty names. Which word describes the note?", "unkind", [P("joyful", UNS), P("helpful", OPP), P("careful", UNS)], "child-being-unkind"),
  l1("prefix_un", 1, 4, "MORPHEME_TRANSFER",
    "The room is messy. Which word means not tidy?", "untidy", [P("tidy", OPP), P("retied", MOR), P("untie", MOR)], "sad-child"),
  l1("prefix_un", 1, 5, "MORPHEME_TRANSFER",
    "Lee feels sick. Which word means not well?", "unwell", [P("well", OPP), P("wellness", MOR), P("replay", UNS)], "unfair-game"),
  l1("prefix_un", 1, 6, "MORPHEME_TRANSFER",
    "Which word means opening something that was locked?", "unlock", [P("relock", OPP), P("lock", OPP), P("locked", MOR)], "unkind-words"),

  // re- = again
  l1("prefix_re", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "The match ended. Which word means they will play again?", "replay", [P("unhappy", UNS), P("playful", MOR), P("player", MOR)], "children-replay-game"),
  l1("prefix_re", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Eva's model broke. Which word means she will make it again?", "remake", [P("unfair", UNS), P("helpful", UNS), P("maker", MOR)], "child-remakes-model"),
  l1("prefix_re", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Milo missed the clue. Which word means he will read it again?", "reread", [P("unkind", UNS), P("careful", UNS), P("reader", MOR)], "child-rereads-book"),
  l1("prefix_re", 1, 4, "MORPHEME_TRANSFER",
    "The jug is empty. Which word means fill again?", "refill", [P("unfilled", MOR), P("filler", MOR), P("filling", MOR)], "child-remakes-picture"),
  l1("prefix_re", 1, 5, "MORPHEME_TRANSFER",
    "Tell the story again. Which word means that?", "retell", [P("telling", MOR), P("teller", MOR), P("untold", MOR)], "child-rereads-page"),
  l1("prefix_re", 1, 6, "MORPHEME_TRANSFER",
    "Use the bag again. Which word means that?", "reuse", [P("unused", MOR), P("useful", MOR), P("user", MOR)], "children-replay-song"),

  // -ful = full of / showing
  l1("suffix_ful", 1, 1, "MORPHEME_MEANING_CONTEXT",
    "Zara gives lots of help. Zara is ___.", "helpful", [P("helpless", MOR), P("helper", MOR), P("replay", UNS)], "helpful-child"),
  l1("suffix_ful", 1, 2, "MORPHEME_MEANING_CONTEXT",
    "Lena grinned and cheered at the good news. Which word describes Lena?", "joyful", [P("joyless", OPP), P("enjoy", MOR), P("rejoice", MOR)], "joyful-child"),
  l1("suffix_ful", 1, 3, "MORPHEME_MEANING_CONTEXT",
    "Ben carries a full glass slowly. Which word describes Ben?", "careful", [P("careless", OPP), P("carer", MOR), P("reader", UNS)], "careful-child-carrying-glass"),
  l1("suffix_ful", 1, 4, "MORPHEME_TRANSFER",
    "The kitten loves games. Which word means full of play?", "playful", [P("player", MOR), P("played", MOR), P("replay", MOR)], "child-helping-friend"),
  l1("suffix_ful", 1, 5, "MORPHEME_TRANSFER",
    "Jo says thanks for the gift. How does Jo feel?", "thankful", [P("thankless", OPP), P("careless", UNS), P("hopeless", UNS)], "child-smiling-with-joy"),
  l1("suffix_ful", 1, 6, "MORPHEME_TRANSFER",
    "Her shirt has many colors. Which word describes it?", "colorful", [P("colorless", OPP), P("careful", UNS), P("playful", UNS)], "child-carefully-carrying-glass"),

  // -less = without
  l1("suffix_less", 2, 1, "MORPHEME_MEANING_CONTEXT",
    "The team thinks it cannot win. Which word describes them?", "hopeless", [P("hopeful", OPP), P("helper", MOR), P("joyful", UNS)], "child-feeling-hopeless"),
  l1("suffix_less", 2, 2, "MORPHEME_MEANING_CONTEXT",
    "Ari steps onto the stage without fear. Which word describes Ari?", "fearless", [P("fearful", OPP), P("farmer", UNS), P("joyful", UNS)], "fearless-child"),
  l1("suffix_less", 2, 3, "MORPHEME_MEANING_CONTEXT",
    "The tiny butterfly cannot hurt anyone. Which word describes it?", "harmless", [P("harmful", OPP), P("helper", MOR), P("careful", UNS)], "harmless-butterfly"),
  l1("suffix_less", 2, 4, "MORPHEME_TRANSFER",
    "The baby has no teeth. Which word describes the baby?", "toothless", [P("toothed", OPP), P("teething", MOR), P("toothy", OPP)], "harmless-butterfly-on-hand"),
  l1("suffix_less", 2, 5, "MORPHEME_TRANSFER",
    "Which word means ‘without sleep’?", "sleepless", [P("sleepy", MOR), P("sleeping", OPP), P("asleep", OPP)], "child-trying-bravely"),
  l1("suffix_less", 2, 6, "MORPHEME_TRANSFER",
    "The trapped pup cannot help itself. Which word describes it?", "helpless", [P("helpful", MOR), P("hopeful", UNS), P("playful", UNS)], "team-feeling-hopeless"),

  // -er = a person who
  l1("suffix_er_person", 2, 1, "MORPHEME_MEANING_CONTEXT",
    "A person who sings is a…", "singer", [P("singing", MOR), P("sings", MOR), P("replay", UNS)], "person-singing"),
  l1("suffix_er_person", 2, 2, "MORPHEME_MEANING_CONTEXT",
    "A person who teaches is a…", "teacher", [P("teaching", MOR), P("teaches", MOR), P("unfair", UNS)], "teacher-with-class"),
  l1("suffix_er_person", 2, 3, "MORPHEME_MEANING_CONTEXT",
    "A person who helps is a…", "helper", [P("helping", MOR), P("helpful", MOR), P("remake", UNS)], "child-helper"),
  l1("suffix_er_person", 2, 4, "MORPHEME_TRANSFER",
    "Who reads books to the class?", "reader", [P("reading", MOR), P("reread", MOR), P("careful", UNS)], "person-reading-to-class"),
  l1("suffix_er_person", 2, 5, "MORPHEME_TRANSFER",
    "Who paints a picture?", "painter", [P("painting", MOR), P("repaint", MOR), P("joyful", UNS)], "person-painting"),
  l1("suffix_er_person", 2, 6, "MORPHEME_TRANSFER",
    "Who works on a farm?", "farmer", [P("farming", MOR), P("farm", MOR), P("fearless", UNS)], "farmer-on-farm")
];

const levelTwoItems = [
  build("suffix_s_es", 1, 1, "Complete ‘I clap; she ___’.", "claps", [P("clap", MOR), P("clapping", MOR), P("clapper", MOR)]),
  build("suffix_s_es", 1, 2, "Change ‘I brush’ to ‘He ___’.", "brushes", [P("brush", MOR), P("brushing", MOR), P("brushed", MOR)]),
  transfer("suffix_s_es", 1, 3, "Birds sing now. One bird ___ while the others listen.", "sings", [P("sing", MOR), P("singing", MOR), P("singer", MOR)]),
  context("suffix_s_es", 1, 4, "Now Dad ___ the car as we watch.", "washes", [P("wash", MOR), P("washing", MOR), P("washed", MOR)]),
  context("suffix_s_es", 1, 5, "While I watch, my cat ___ on the mat.", "naps", [P("nap", MOR), P("napping", MOR), P("napped", MOR)]),
  context("suffix_s_es", 1, 6, "Today Grandma ___ bread while I help her.", "bakes", [P("bake", MOR), P("baking", MOR), P("baked", MOR)]),

  build("suffix_ing", 1, 1, "Add -ing to jump.", "jumping", [P("jumps", MOR), P("jumped", MOR), P("singing", MOR)]),
  build("suffix_ing", 1, 2, "Add -ing to read.", "reading", [P("reads", MOR), P("ready", MOR), P("singing", MOR)]),
  transfer("suffix_ing", 1, 3, "She is ___, making music with her voice.", "singing", [P("sings", MOR), P("sang", MOR), P("singer", MOR)]),
  context("suffix_ing", 1, 4, "Right now, the water is ___ on the stove.", "boiling", [P("boils", MOR), P("boil", MOR), P("sleeping", UNS)]),
  context("suffix_ing", 1, 5, "We are ___ a sandcastle by piling up wet sand.", "building", [P("builds", MOR), P("build", MOR), P("painting", UNS)]),
  context("suffix_ing", 1, 6, "Keep ___! The finish line is close.", "running", [P("runs", MOR), P("run", MOR), P("sleeping", UNS)]),

  build("suffix_ed", 1, 1, "Add -ed to walk.", "walked", [P("walks", MOR), P("walking", MOR), P("opened", MOR)]),
  build("suffix_ed", 1, 2, "Add -ed to help.", "helped", [P("helps", MOR), P("helping", MOR), P("hopped", MOR)]),
  transfer("suffix_ed", 1, 3, "Yesterday we ___ down from a low wall.", "jumped", [P("jump", MOR), P("jumps", MOR), P("jumping", MOR)]),
  context("suffix_ed", 1, 4, "Yesterday we ___ step by step to the park.", "walked", [P("walk", MOR), P("walking", MOR), P("helped", UNS)]),
  context("suffix_ed", 1, 5, "Last night, the baby ___ with tears for hours.", "cried", [P("cries", MOR), P("crying", MOR), P("cry", MOR)]),
  context("suffix_ed", 1, 6, "We ___ the door before bed.", "locked", [P("locks", MOR), P("locking", MOR), P("filled", UNS)]),

  build("suffix_er_est", 2, 1, "Add -est to tall.", "tallest", [P("taller", MOR), P("tall", MOR), P("fastest", MOR)]),
  build("suffix_er_est", 2, 2, "Add -er to fast.", "faster", [P("fastest", MOR), P("fast", MOR), P("taller", MOR)]),
  context("suffix_er_est", 2, 3, "Ana is ___ than Ben in height.", "taller", [P("tallest", MOR), P("tall", MOR), P("faster", UNS)]),
  context("suffix_er_est", 2, 4, "Rex ran faster than everyone else. He was the ___.", "fastest", [P("faster", MOR), P("fast", MOR), P("tallest", UNS)]),
  transfer("suffix_er_est", 2, 5, "This bag weighs more. It is ___ than that bag.", "heavier", [P("heaviest", MOR), P("heavy", MOR), P("heavily", MOR)]),
  transfer("suffix_er_est", 2, 6, "Ten snails raced. Which word means slower than all the others?", "slowest", [P("slower", MOR), P("slow", MOR), P("tallest", UNS)]),

  build("suffix_ly", 2, 1, "Add -ly to quick.", "quickly", [P("quicker", MOR), P("quickest", MOR), P("softly", MOR)]),
  build("suffix_ly", 2, 2, "Add -ly to soft.", "softly", [P("softer", MOR), P("soft", MOR), P("quickly", MOR)]),
  context("suffix_ly", 2, 3, "Set the eggs down ___, in a gentle way.", "gently", [P("gentle", MOR), P("gentler", MOR), P("quickly", UNS)]),
  context("suffix_ly", 2, 4, "The mouse crept ___, without making a sound.", "quietly", [P("quiet", MOR), P("quieter", MOR), P("loudly", OPP)]),
  transfer("suffix_ly", 2, 5, "Mia stepped onto the stage bravely. How did she step?", "in a brave way", [P("in a soft way", UNS), P("toward a brave person", MOR), P("before she was brave", MOR)]),
  transfer("suffix_ly", 2, 6, "Jay held up the medal proudly. How did Jay hold it?", "in a proud way", [P("in a quick way", UNS), P("toward a proud person", MOR), P("before he felt proud", MOR)]),

  build("prefix_pre", 2, 1, "Add pre- to heat.", "preheat", [P("heated", MOR), P("heats", MOR), P("preview", MOR)]),
  build("prefix_pre", 2, 2, "Add pre- to view.", "preview", [P("views", MOR), P("viewed", MOR), P("preheat", MOR)]),
  context("prefix_pre", 2, 3, "___ the oven so it is hot before baking.", "Preheat", [P("Cool", OPP), P("Heated", MOR), P("Preview", MOR)]),
  context("prefix_pre", 2, 4, "We watched a ___ before the movie started.", "preview", [P("view", MOR), P("viewed", MOR), P("preheat", MOR)]),
  transfer("prefix_pre", 2, 5, "The coach gives a pretest. When is it taken?", "before the lessons", [P("after the lessons", OPP), P("during the best lesson", MOR), P("before looking", MOR)]),
  transfer("prefix_pre", 2, 6, "A shop lets people preorder a game before release day. What can they do?", "order before it is out", [P("order after it is out", OPP), P("heat the order", MOR), P("order more copies", MOR)])
];

const retentionItems = [
  l1("prefix_un", 1, 7, "MORPHEME_MEANING_CONTEXT", "The broken bridge could hurt someone. Which word describes it?", "unsafe", [P("careless", UNS), P("safety", MOR), P("helper", UNS)], "unsafe-bridge"),
  l1("prefix_re", 1, 7, "MORPHEME_MEANING_CONTEXT", "The wall is patchy. Which word means paint it again?", "repaint", [P("painting", MOR), P("painter", MOR), P("careful", UNS)], "child-repaints-wall"),
  l1("suffix_ful", 1, 7, "MORPHEME_MEANING_CONTEXT", "Noah believes the team can win. Noah feels ___.", "hopeful", [P("hopeless", OPP), P("hoping", MOR), P("unhappy", UNS)], "hopeful-child"),
  l1("suffix_less", 2, 7, "MORPHEME_MEANING_CONTEXT", "Lee rushed and spilled the paint. Which word describes Lee?", "careless", [P("careful", OPP), P("caring", MOR), P("helper", UNS)], "careless-spill"),
  l1("suffix_er_person", 2, 7, "MORPHEME_MEANING_CONTEXT", "A person who bakes is a…", "baker", [P("baking", MOR), P("bakes", MOR), P("remake", UNS)], "baker-with-bread"),
  l1("prefix_re", 1, 8, "MORPHEME_TRANSFER", "The block tower fell. Which word means build again?", "rebuild", [P("builder", MOR), P("building", MOR), P("unbuilt", MOR)], "child-rebuilds-block-tower"),
  build("suffix_s_es", 1, 7, "Finish ‘I catch; she ___’.", "catches", [P("catch", MOR), P("catching", MOR), P("catcher", MOR)]),
  build("suffix_ing", 1, 7, "Add -ing to cook.", "cooking", [P("cooks", MOR), P("cooked", MOR), P("reading", MOR)]),
  build("suffix_ed", 1, 7, "Add -ed to play.", "played", [P("plays", MOR), P("playing", MOR), P("walked", MOR)]),
  context("suffix_er_est", 2, 7, "Sam is quick, but Ali is even ___.", "quicker", [P("quickest", MOR), P("quick", MOR), P("softer", UNS)]),
  build("suffix_ly", 2, 7, "Add -ly to brave.", "bravely", [P("braver", MOR), P("bravest", MOR), P("softly", MOR)]),
  build("prefix_pre", 2, 7, "Add pre- to school.", "preschool", [P("schools", MOR), P("schooling", MOR), P("preheat", MOR)]),
  l1("prefix_un", 1, 31, "MORPHEME_TRANSFER", "No one has opened the parcel. It is ___.", "unopened", [P("opening", MOR), P("opener", MOR), P("reopen", MOR)]),
  l1("suffix_less", 2, 31, "MORPHEME_TRANSFER", "This drink has no taste. Which word describes it?", "tasteless", [P("tasty", OPP), P("tasting", MOR), P("tasted", MOR)]),
  context("suffix_ing", 1, 31, "Right now, the dog is ___ up the buried bone.", "digging", [P("digs", MOR), P("dug", MOR), P("digger", MOR)],
    "Present progressive requires the -ing form; double the final g in dig."),
  transfer("prefix_pre", 2, 31, "We prepay for a trip. When do we pay?", "before the trip", [P("after the trip", OPP), P("during the trip", MOR), P("instead of taking the trip", MOR)])
].map(item => ({ ...item, retention: true }));

const freshPhaseItems = [
  l1("prefix_un", 1, 8, "MORPHEME_TRANSFER", "A cup is not used yet. Which word describes it?", "unused", [P("useful", MOR), P("reuse", MOR), P("using", MOR)]),
  l1("suffix_ful", 1, 8, "MORPHEME_TRANSFER", "The room is full of peace. Which word fits?", "peaceful", [P("peacemaker", MOR), P("piece", MOR), P("fearful", UNS)]),
  l1("suffix_less", 2, 8, "MORPHEME_MEANING_CONTEXT", "A broken tool has no use. It is ___.", "useless", [P("useful", OPP), P("used", MOR), P("using", MOR)]),
  l1("suffix_less", 2, 9, "MORPHEME_TRANSFER", "The sky has no clouds. Which word describes it?", "cloudless", [P("cloudy", OPP), P("clouded", OPP), P("clouding", MOR)]),
  l1("suffix_less", 2, 10, "MORPHEME_TRANSFER", "The dog has no home. Which word describes it?", "homeless", [P("homeward", MOR), P("homely", MOR), P("homemade", MOR)]),
  l1("suffix_less", 2, 11, "MORPHEME_MEANING_CONTEXT", "The clock makes no sound. It is ___.", "soundless", [P("sounding", OPP), P("soundly", MOR), P("resound", MOR)]),
  l1("suffix_er_person", 2, 8, "MORPHEME_MEANING_CONTEXT", "Who drives the bus?", "driver", [P("driving", MOR), P("drives", MOR), P("driven", MOR)]),
  l1("suffix_er_person", 2, 9, "MORPHEME_TRANSFER", "Which word names a person who builds?", "builder", [P("building", MOR), P("rebuild", MOR), P("built", MOR)]),
  l1("suffix_er_person", 2, 10, "MORPHEME_MEANING_CONTEXT", "A person who swims is a…", "swimmer", [P("swimming", MOR), P("swims", MOR), P("swam", MOR)]),
  l1("suffix_er_person", 2, 11, "MORPHEME_TRANSFER", "Who grows food on a farm?", "grower", [P("growing", MOR), P("grown", MOR), P("regrow", MOR)]),
  transfer("suffix_ing", 1, 8, "A dog is ___ after its ball right now.", "chasing", [P("chases", MOR), P("chased", MOR), P("chase", MOR)]),
  transfer("suffix_ed", 1, 8, "Yesterday the class ___ seeds in pots of soil.", "planted", [P("plants", MOR), P("planting", MOR), P("plant", MOR)]),
  transfer("suffix_er_est", 2, 8, "All five jars are tall. This jar is taller than every other: the ___.", "tallest", [P("taller", MOR), P("tall", MOR), P("tallness", MOR)]),
  transfer("suffix_ly", 2, 8, "She waited patiently. How did she wait?", "in a patient way", [P("with a patient", MOR), P("before waiting", MOR), P("without any patience", OPP)])
];

export default {
  skillId: "prefixes_suffixes",
  skillName: "Prefixes & Suffixes",
  items: [...levelOneItems, ...levelTwoItems, ...retentionItems, ...freshPhaseItems]
};
