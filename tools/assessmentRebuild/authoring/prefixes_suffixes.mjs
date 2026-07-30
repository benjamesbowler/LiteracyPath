// Prefixes & Suffixes — v3 authored bank (wave W11, paired with plurals).
// Three formats. MORPHEME_BUILD: "Add -ing to jump." — three same-base forms
// tie the base chunk, plus ONE same-affix-different-base carrier so the named
// affix never sits in exactly one option (patternMatch rule). MEANING_CONTEXT:
// the affix's meaning is forced by the frame; near-miss frames carry a
// defended D-PLAUSIBLE-UNSUPPORTED note. TRANSFER (L2): apply a taught gloss
// to a NEW word; every option repeats the base so the gloss word ties, and
// the gloss-swap trap (D-MORPH-LITERAL) mirrors any long shared word.
// Glosses are natural sentences, never a formula repeated verbatim.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §20.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const FS = "D-FUNCTION-SWAP";   // right base, wrong affix for the frame
const PT = "D-PATTERN-TRAP";    // right affix, wrong base
const ML = "D-MORPH-LITERAL";   // gloss-swap: the taught example, not the new word
const SEM = "D-SEMANTIC";
const OPP = "D-OPPOSITE";
const PU = "D-PLAUSIBLE-UNSUPPORTED";

const mb = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "MORPHEME_BUILD",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const mmc = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "MORPHEME_MEANING_CONTEXT",
  prompt: sentence,
  spoken: sentence.includes("___")
    ? `Which word fits? ${sentence.replace("___", "hmm")}`
    : sentence,
  sentence: sentence.includes("___") ? sentence : undefined,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const mt = (u, lvl, ph, v, prompt, phrases, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "MORPHEME_TRANSFER",
  prompt,
  spoken: prompt,
  choices: phrases.map((p, i) => (i === 0 ? K(p) : P(p, rationales[i - 1]))),
  media: "text",
  note
});

export default {
  skillId: "prefixes_suffixes",
  skillName: "Prefixes & Suffixes",
  items: [
    // ================= L1 phase 1: suffix_s_es =================
    mb("suffix_s_es", 1, 1, 1, "Add -s to hen.",
      ["hens", "hen", "pens", "pen"], [FS, PT, SEM]),
    mb("suffix_s_es", 1, 1, 2, "Add -es to fox.",
      ["foxes", "fox", "dishes", "dish"], [FS, PT, SEM],
      "dishes carries -es too, so the named affix never sits in one option alone"),
    mb("suffix_s_es", 1, 1, 3, "Add -s to cup.",
      ["cups", "cup", "caps", "cap"], [FS, PT, SEM]),
    mmc("suffix_s_es", 1, 1, 4, "Every day, Dad ___ the car.",
      ["washes", "wash", "washing", "washed"], [FS, FS, FS],
      "the car, not the dishes — dishes hands the key its shes chunk"),
    mmc("suffix_s_es", 1, 1, 5, "My cat ___ on the mat all day.",
      ["naps", "nap", "napping", "napped"], [FS, FS, FS]),
    mmc("suffix_s_es", 1, 1, 6, "Gran ___ brown bread every Sunday.",
      ["bakes", "bake", "baking", "baked"], [FS, FS, FS],
      "brown bread, not fresh loaves — fresh and loaves both gift es to the key"),

    // ================= L1 phase 1: suffix_ing =================
    mb("suffix_ing", 1, 1, 1, "Add -ing to jump.",
      ["jumping", "jumps", "jumped", "going"], [FS, FS, PT]),
    mb("suffix_ing", 1, 1, 2, "Add -ing to read.",
      ["reading", "reads", "ready", "singing"], [FS, "D-VISUAL-NEIGHBOR", PT]),
    mb("suffix_ing", 1, 1, 3, "Add -ing to play.",
      ["playing", "plays", "played", "doing"], [FS, FS, PT]),
    mmc("suffix_ing", 1, 1, 4, "Right now, the pot is ___ on the stove.",
      ["boiling", "boils", "boil", "sleeping"], [FS, FS, PT]),
    mmc("suffix_ing", 1, 1, 5, "We are ___ a sandcastle today.",
      ["building", "builds", "build", "painting"], [FS, FS, PT]),
    mmc("suffix_ing", 1, 1, 6, "Keep ___! The finish line is close.",
      ["running", "singing", "runs", "run"], [PT, FS, FS],
      "finish and line gift in to the key — singing carries in too and ties it"),

    // ================= L1 phase 1: suffix_ed =================
    mb("suffix_ed", 1, 1, 1, "Add -ed to walk.",
      ["walked", "walks", "walking", "opened"], [FS, FS, PT]),
    mb("suffix_ed", 1, 1, 2, "Add -ed to help.",
      ["helped", "helps", "helping", "hopped"], [FS, FS, PT]),
    mb("suffix_ed", 1, 1, 3, "Add -ed to jump.",
      ["jumped", "jumping", "jumps", "landed"], [FS, FS, PT]),
    mmc("suffix_ed", 1, 1, 4, "Yesterday we ___ to the park.",
      ["walked", "walk", "walking", "jumped"], [FS, FS, PT]),
    mmc("suffix_ed", 1, 1, 5, "Last night, the baby ___ for hours.",
      ["cried", "cries", "crying", "called"], [FS, FS, PT]),
    mmc("suffix_ed", 1, 1, 6, "We ___ the door before bed last night.",
      ["locked", "locks", "locking", "filled"], [FS, FS, PT],
      "bed gifts ed to the key — filled carries ed and ties it"),

    // ================= L1 phase 2: suffix_er_person =================
    mb("suffix_er_person", 1, 2, 1, "Add -er to sing.",
      ["singer", "sings", "singing", "helper"], [FS, FS, PT]),
    mb("suffix_er_person", 1, 2, 2, "Add -er to paint.",
      ["painter", "paints", "painted", "farmer"], [FS, FS, PT]),
    mb("suffix_er_person", 1, 2, 3, "Add -er to help.",
      ["helper", "helped", "helping", "singer"], [FS, FS, PT]),
    mmc("suffix_er_person", 1, 2, 4, "A person who sings is a ___.",
      ["singer", "singing", "sings", "teacher"], [FS, FS, PT],
      "the prompt's own verb outscores every option — scanner takes sings, not the key"),
    mmc("suffix_er_person", 1, 2, 5, "A person who teaches is a ___.",
      ["teacher", "teaches", "teaching", "painter"], [FS, FS, PT]),
    mmc("suffix_er_person", 1, 2, 6, "A person who helps is a ___.",
      ["helper", "helps", "helping", "farmer"], [FS, FS, PT]),

    // ================= L1 phase 2: suffix_ful =================
    mb("suffix_ful", 1, 2, 1, "Add -ful to care.",
      ["careful", "cares", "caring", "helpful"], [FS, FS, PT]),
    mb("suffix_ful", 1, 2, 2, "Add -ful to help.",
      ["helpful", "helper", "helping", "careful"], [FS, FS, PT]),
    mb("suffix_ful", 1, 2, 3, "Add -ful to joy.",
      ["joyful", "joys", "enjoy", "playful"], [FS, "D-VISUAL-NEIGHBOR", PT]),
    mmc("suffix_ful", 1, 2, 4, "A face full of joy is a ___ face.",
      ["joyful", "joy", "joys", "careful"], [FS, FS, PT],
      "joy and full tie every option at three letters — no gift anywhere"),
    mmc("suffix_ful", 1, 2, 5, "Sam is always ___ with the baby bird.",
      ["careful", "care", "cares", "helpful"], [FS, FS, PT]),
    mmc("suffix_ful", 1, 2, 6, "Thank you! That was very ___ of you.",
      ["helpful", "help", "helped", "joyful"], [FS, FS, PT]),

    // ================= L2 phase 1: prefix_un =================
    mb("prefix_un", 2, 1, 1, "Add un- to lock.",
      ["unlock", "locked", "locks", "unhappy"], [FS, FS, PT]),
    mb("prefix_un", 2, 1, 2, "Add un- to tie.",
      ["untie", "tied", "ties", "unpack"], [FS, FS, PT]),
    mmc("prefix_un", 2, 1, 3, "The door was ___, so we walked right in.",
      ["unlocked", "locked", "unlock", "locking"], [OPP, FS, FS],
      "in sits in locking alone, so the scanner takes a distractor, never the key"),
    mmc("prefix_un", 2, 1, 4, "My shoelace came ___ on the run.",
      ["undone", "done", "doing", "untied"], [FS, FS, PT],
      "run and on gift chunks to key, done and untied together — three-way tie"),
    mt("prefix_un", 2, 1, 5, "'Untie' undoes a knot. What does 'unzip' do?",
      ["opens the zip", "closes the zip", "makes a new zip", "loses the zip"],
      [OPP, SEM, SEM],
      "zip repeats in every option — the shared chunk ties all four"),
    mt("prefix_un", 2, 1, 6, "'Unhappy' is the opposite of happy. Which one is 'unkind'?",
      ["not kind", "very kind", "kind again", "kind of"],
      [OPP, PT, SEM]),

    // ================= L2 phase 1: prefix_re =================
    mb("prefix_re", 2, 1, 1, "Add re- to read.",
      ["reread", "reading", "reads", "redo"], [FS, FS, PT]),
    mb("prefix_re", 2, 1, 2, "Add re- to fill.",
      ["refill", "filled", "fills", "retell"], [FS, FS, PT]),
    mmc("prefix_re", 2, 1, 3, "The tower fell, so we will ___ it.",
      ["rebuild", "build", "built", "redo"], [PU, FS, SEM],
      "build alone is possible — but the tower stood once already, and fell pins build-AGAIN; will gifts il to key, build and built together"),
    mmc("prefix_re", 2, 1, 4, "This maze was fun! I want to ___ it tomorrow.",
      ["redo", "did", "doing", "refill"], [FS, FS, PT],
      "want to DO it again tomorrow — redo is the again-verb; did breaks the frame's tense"),
    mt("prefix_re", 2, 1, 5, "'Reread' is read again. What is 'retell'?",
      ["tell again", "read again", "tell first", "stop telling"],
      [ML, SEM, OPP],
      "read again mirrors the gloss and ties the key's again chunk"),
    mt("prefix_re", 2, 1, 6, "'Redo' is do it over. What is 'rebuild'?",
      ["build it over", "build it first", "knock it down", "buy a new one"],
      [SEM, OPP, SEM]),

    // ================= L2 phase 1: suffix_less =================
    mb("suffix_less", 2, 1, 1, "Add -less to fear.",
      ["fearless", "fears", "feared", "careless"], [FS, FS, PT]),
    mb("suffix_less", 2, 1, 2, "Add -less to care.",
      ["careless", "cares", "caring", "fearless"], [FS, FS, PT]),
    mmc("suffix_less", 2, 1, 3, "The scratch was tiny and ___ — it did not hurt at all.",
      ["harmless", "harmful", "harm", "helpless"], [OPP, FS, PT]),
    mmc("suffix_less", 2, 1, 4, "The old torch is ___ without batteries.",
      ["useless", "useful", "uses", "helpless"], [OPP, FS, PT],
      "batteries gifts es to key, uses and helpless together — three-way tie"),
    mt("suffix_less", 2, 1, 5, "'Fearless' is without fear. What is 'careless'?",
      ["without care", "without fear", "full of care", "care again"],
      [ML, OPP, PT],
      "without fear mirrors the gloss and ties the key's without chunk"),
    mt("suffix_less", 2, 1, 6, "'Useless' is no use at all. What is 'hopeless'?",
      ["no hope at all", "no fear at all", "full of hope", "hope again"],
      [ML, OPP, PT],
      "no fear at all carries the no chunk too, so the pattern rule never fires alone"),

    // ================= L2 phase 2: suffix_er_est =================
    mb("suffix_er_est", 2, 2, 1, "Add -est to tall.",
      ["tallest", "taller", "tall", "fastest"], [FS, FS, PT]),
    mb("suffix_er_est", 2, 2, 2, "Add -er to fast.",
      ["faster", "fastest", "fast", "taller"], [FS, FS, PT]),
    mmc("suffix_er_est", 2, 2, 3, "Ben is tall, but Ana is even ___.",
      ["taller", "tallest", "tall", "faster"], [FS, FS, PT],
      "tall in the prompt ties key, tallest and tall at four letters"),
    mmc("suffix_er_est", 2, 2, 4, "Of all three dogs, Rex is the ___.",
      ["fastest", "faster", "fast", "tallest"], [FS, FS, PT]),
    mt("suffix_er_est", 2, 2, 5, "'Taller' compares two. Which word picks the top one of all?",
      ["tallest", "taller", "tall", "slowest"], [FS, FS, PT],
      "the prompt's own taller outscores everything — scanner takes a distractor"),
    mt("suffix_er_est", 2, 2, 6, "You know 'taller' and 'tallest'. Of every snail in the garden, Sid is the ___.",
      ["slowest", "slower", "slow", "tallest"], [FS, FS, ML],
      "tallest repeats from the prompt and outscores the key — scanner takes the taught word"),

    // ================= L2 phase 2: suffix_ly =================
    mb("suffix_ly", 2, 2, 1, "Add -ly to quick.",
      ["quickly", "quicker", "quickest", "softly"], [FS, FS, PT]),
    mb("suffix_ly", 2, 2, 2, "Add -ly to soft.",
      ["softly", "softer", "soft", "quickly"], [FS, FS, PT]),
    mmc("suffix_ly", 2, 2, 3, "Tip the eggs into the pan ___, with no bumps.",
      ["gently", "gentle", "gentler", "quickly"], [FS, FS, PU],
      "quickly is how you might tip them — but with no bumps pins gentle handling; into gifts nt to key, gentle and gentler together"),
    mmc("suffix_ly", 2, 2, 4, "The mouse crept ___ past the cat.",
      ["quietly", "quiet", "quieter", "loudly"], [FS, FS, OPP],
      "mouse gifts ou to loudly alone — scanner picks the opposite, never the key"),
    mt("suffix_ly", 2, 2, 5, "'Softly' tells how — in a soft way. What does 'bravely' tell?",
      ["in a brave way", "in a soft way", "a brave person", "being brave"],
      [ML, FS, FS]),
    mt("suffix_ly", 2, 2, 6, "'Quickly' is in a quick way. What is 'proudly'?",
      ["in a proud way", "in a quick way", "a proud person", "very proud"],
      [ML, FS, FS],
      "proud and quick tie every option at five letters"),

    // ================= L2 phase 2: prefix_pre =================
    mb("prefix_pre", 2, 2, 1, "Add pre- to heat.",
      ["preheat", "heated", "heats", "preview"], [FS, FS, PT]),
    mb("prefix_pre", 2, 2, 2, "Add pre- to view.",
      ["preview", "views", "viewed", "preheat"], [FS, FS, PT]),
    mmc("prefix_pre", 2, 2, 3, "___ the oven before you mix the batter.",
      ["Preheat", "Heat", "Heated", "Preview"], [PU, FS, PT],
      "heat alone would warm it — before you even start is the pre- meaning the recipe wants; before and batter spread chunks across all four"),
    mmc("prefix_pre", 2, 2, 4, "We watched a ___ of the film before it opened.",
      ["preview", "view", "viewed", "preheat"], [FS, FS, PT],
      "before gifts re to key and preheat; watched gifts ed to viewed — tie"),
    mt("prefix_pre", 2, 2, 5, "'Preview' is a look before. What is 'pretest'?",
      ["a test before", "a test after", "the best test", "a look before"],
      [OPP, SEM, ML],
      "a look before mirrors the gloss and ties the key's before chunk"),
    mt("prefix_pre", 2, 2, 6, "'Preheat' warms the oven first. What is 'preorder'?",
      ["order before it is out", "order after it is out", "heat the order", "order more"],
      [OPP, ML, SEM],
      "first, not before, in the prompt — order ties all four options"),

    // ================= Retention reserve (form R) =================
    mb("suffix_s_es", 1, 1, 7, "Add -es to bus.",
      ["buses", "bus", "foxes", "fox"], [FS, PT, SEM]),
    mb("suffix_ing", 1, 1, 7, "Add -ing to cook.",
      ["cooking", "cooks", "cooked", "reading"], [FS, FS, PT]),
    mb("suffix_ed", 1, 1, 7, "Add -ed to play.",
      ["played", "plays", "playing", "walked"], [FS, FS, PT]),
    mmc("suffix_er_person", 1, 2, 7, "A person who paints is a ___.",
      ["painter", "paints", "painting", "helper"], [FS, FS, PT]),
    mb("suffix_ful", 1, 2, 7, "Add -ful to hope.",
      ["hopeful", "hopes", "hoped", "joyful"], [FS, FS, PT]),
    mmc("suffix_ing", 1, 1, 8, "Right now the twins are ___ in the pool.",
      ["splashing", "splashed", "splash", "jumping"], [FS, FS, PT],
      "in gifts its chunk to key and jumping together"),
    mb("prefix_un", 2, 1, 7, "Add un- to pack.",
      ["unpack", "packs", "packed", "untie"], [FS, FS, PT]),
    mb("prefix_re", 2, 1, 7, "Add re- to tell.",
      ["retell", "tells", "telling", "reread"], [FS, FS, PT]),
    mt("suffix_less", 2, 1, 7, "'Spotless' is without a spot. What is 'endless'?",
      ["without an end", "without a spot", "the very end", "end again"],
      [ML, SEM, PT]),
    mmc("suffix_er_est", 2, 2, 7, "Sam is quick, but Ali is even ___.",
      ["quicker", "quickest", "quick", "softer"], [FS, FS, PT]),
    mb("suffix_ly", 2, 2, 7, "Add -ly to brave.",
      ["bravely", "braver", "bravest", "softly"], [FS, FS, PT]),
    mb("prefix_pre", 2, 2, 7, "Add pre- to school.",
      ["preschool", "schools", "schooling", "preheat"], [FS, FS, PT])
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
