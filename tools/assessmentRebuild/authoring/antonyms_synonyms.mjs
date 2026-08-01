// Antonyms & Synonyms — v3 authored bank (wave W12, paired with homophones).
// The set law (BLUEPRINTS_LANGUAGE §21):
//   antonym items — key is the TRUE opposite; distractors are a synonym of
//     the prompt word (D-OPPOSITE relative to the key), a topic-adjacent
//     near-miss, and an unrelated same-POS word.
//   synonym items — the TRUE ANTONYM of the prompt word rides as a mandatory
//     D-OPPOSITE distractor; plus a near-miss and an unrelated same-POS word.
// Shade/precision items (synonym_shade, antonym_precise) carry notes that
// defend why the key is uniquely exact — the weaker-degree rival is the trap.
// Scanner-proofing: "opposite"/"closest" gift or/it/te/st chunks — every set
// that receives a gift carries a second carrier so the top is never strict.
// GIC images all resolve to existing art; option words live in the lexicon.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §21.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const OPP = "D-OPPOSITE";
const TA = "D-TOPIC-ADJACENT";
const SEM = "D-SEMANTIC";

const lptc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "LANGUAGE_PAIR_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const gic = (u, lvl, ph, v, img, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "GRAMMAR_IMAGE_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "image-required",
  img,
  imgAlt: img.replace(/_/g, " "),
  cards: words,
  alts: Object.fromEntries(words.map(word => [word, `Picture showing ${word}`])),
  note
});

const lpisc = (u, lvl, ph, v, img, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "LANGUAGE_PAIR_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "image-required",
  img,
  imgAlt: img.replace(/_/g, " "),
  note
});

const wiss = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "WORD_IN_SENTENCE_SWAP",
  prompt: sentence,
  spoken: `Which word fits the swap? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

export default {
  skillId: "antonyms_synonyms",
  skillName: "Antonyms & Synonyms",
  items: [
    // ================= L1 phase 1: antonym_concrete =================
    gic("antonym_concrete", 1, 1, 1, "hot", "What is the opposite of hot?",
      ["cold", "warm", "boiling", "green"], [TA, OPP, SEM]),
    gic("antonym_concrete", 1, 1, 2, "big", "What is the opposite of big?",
      ["small", "huge", "tall", "white"], [OPP, TA, SEM]),
    gic("antonym_concrete", 1, 1, 3, "up", "What is the opposite of up?",
      ["down", "high", "under", "blue"], [OPP, TA, SEM]),
    lpisc("antonym_concrete", 1, 1, 4, "wet", "What is the opposite of wet?",
      ["dry", "soaked", "cool", "loud"], [OPP, TA, SEM]),
    lpisc("antonym_concrete", 1, 1, 5, "hot", "The picture shows something hot. Pick the opposite of hot.",
      ["cold", "cool", "boiling", "wet"], [TA, OPP, SEM],
      "something gifts in to boiling — a distractor tops, never the key"),
    lpisc("antonym_concrete", 1, 1, 6, "whale", "The whale in the picture is big. Pick the opposite of big.",
      ["small", "huge", "long", "green"], [OPP, TA, SEM]),

    // ================= L1 phase 1: synonym_concrete =================
    gic("synonym_concrete", 1, 1, 1, "happy", "Which word means about the same as happy?",
      ["glad", "sad", "soft", "tall"], [OPP, TA, SEM]),
    gic("synonym_concrete", 1, 1, 2, "shout", "Which word means about the same as shout?",
      ["yell", "sing", "talk", "jump"], [OPP, TA, SEM]),
    gic("synonym_concrete", 1, 1, 3, "small", "Which word means about the same as little?",
      ["small", "huge", "thin", "blue"], [OPP, TA, SEM]),
    lpisc("synonym_concrete", 1, 1, 4, "begin", "Which word means about the same as begin?",
      ["start", "finish", "try", "sing"], [OPP, TA, SEM],
      "closest gifts st to start; begin gifts in to finish and sing — three-way tie"),
    lpisc("synonym_concrete", 1, 1, 5, "sea", "The picture shows the sea. Which word is closest to 'sea'?",
      ["ocean", "beach", "land", "sky"], [TA, OPP, SEM],
      "sea gifts ea to ocean — beach carries ea too and ties"),
    lpisc("synonym_concrete", 1, 1, 6, "rain", "The rain makes things wet. Which word is closest to 'wet'?",
      ["damp", "dry", "cold", "tall"], [OPP, TA, SEM]),

    // ================= L1 phase 2: antonym_picture =================
    gic("antonym_picture", 1, 2, 1, "up", "The arrow points up. Pick the opposite of up.",
      ["down", "high", "top", "red"], [OPP, TA, SEM],
      "arrow gifts ow to down; opposite gifts op to top — tie"),
    gic("antonym_picture", 1, 2, 2, "night", "It is night in the picture. Pick the opposite of night.",
      ["day", "dark", "moon", "wet"], [OPP, TA, SEM]),
    gic("antonym_picture", 1, 2, 3, "new", "The shoes in the picture are new. Pick the opposite of new.",
      ["old", "fresh", "shiny", "loud"], [OPP, TA, SEM],
      "shoes gifts sh to fresh and shiny — a tied distractor pair"),
    lpisc("antonym_picture", 1, 2, 4, "open", "The door in the picture is open. Pick the opposite of open.",
      ["shut", "wide", "locked", "red"], [OPP, TA, SEM]),
    lpisc("antonym_picture", 1, 2, 5, "day", "What is the opposite of day?",
      ["night", "morning", "bright", "red"], [TA, OPP, SEM],
      "word gifts or to morning — a distractor tops, never the key"),
    lpisc("antonym_picture", 1, 2, 6, "tall", "What is the opposite of tall?",
      ["short", "giant", "long", "orange"], [OPP, TA, SEM],
      "word gifts or to short — orange carries or too and ties"),

    // ================= L1 phase 2: synonym_picture =================
    gic("synonym_picture", 1, 2, 1, "sun", "The sun is bright. Which word is closest to 'bright'?",
      ["shiny", "dark", "hot", "white"], [OPP, TA, SEM],
      "which gifts hi to shiny — white carries it too and ties"),
    gic("synonym_picture", 1, 2, 2, "rock", "The rock is hard. Which word is closest to 'hard'?",
      ["solid", "soft", "heavy", "pink"], [OPP, TA, SEM]),
    gic("synonym_picture", 1, 2, 3, "snow", "Snow is cold. Which word is closest to 'cold'?",
      ["chilly", "warm", "white", "glad"], [OPP, TA, SEM],
      "which gifts ch to chilly and hi to white — tie"),
    lpisc("synonym_picture", 1, 2, 4, "ant", "The ant is tiny. Which word is closest to 'tiny'?",
      ["small", "giant", "thin", "wet"], [OPP, TA, SEM],
      "ant gifts an to giant; which gifts hi to thin — tied distractors"),
    lpisc("synonym_picture", 1, 2, 5, "quick", "Pick a synonym for quick.",
      ["fast", "slow", "steady", "pink"], [OPP, TA, SEM],
      "closest gifts st to fast — steady carries st too and ties"),
    lpisc("synonym_picture", 1, 2, 6, "sleepy", "Which word means about the same as sleepy?",
      ["tired", "awake", "cozy", "green"], [OPP, TA, SEM]),

    // ================= L2 phase 1: antonym_precise =================
    lptc("antonym_precise", 2, 1, 1, "Which is the exact opposite of 'whisper'?",
      ["shout", "talk", "mumble", "sing"], [TA, OPP, SEM]),
    lptc("antonym_precise", 2, 1, 2, "Which is the exact opposite of 'freezing'?",
      ["boiling", "icy", "cold", "loud"], [TA, OPP, SEM],
      "boiling is the only hot extreme; icy and cold reinforce freezing"),
    lptc("antonym_precise", 2, 1, 3, "Which is the exact opposite of 'giant'?",
      ["tiny", "huge", "long", "kind"], [OPP, TA, SEM]),
    lptc("antonym_precise", 2, 1, 4, "Pick the antonym of 'noisy'.",
      ["silent", "bright", "loud", "green"], [TA, OPP, SEM],
      "silent is the only choice about an absence of sound"),
    wiss("antonym_precise", 2, 1, 5, "The kitten is tame. The tiger is ___.",
      ["wild", "calm", "soft", "blue"], [OPP, TA, SEM]),
    wiss("antonym_precise", 2, 1, 6, "This puzzle is simple. Its opposite is ___.",
      ["tricky", "easy", "long", "pink"], [OPP, TA, SEM]),

    // ================= L2 phase 1: synonym_shade =================
    lptc("synonym_shade", 2, 1, 1, "Which word is closest to 'giggle'?",
      ["chuckle", "whisper", "sob", "chat"], [TA, OPP, SEM],
      "chuckle alone names the same small laugh; no broader laugh synonym competes"),
    lptc("synonym_shade", 2, 1, 2, "Which word is closest to 'huge'?",
      ["enormous", "narrow", "small", "orange"], [TA, OPP, SEM],
      "enormous is the only same-meaning size word"),
    lptc("synonym_shade", 2, 1, 3, "Which word is closest to 'sprint'?",
      ["dash", "crawl", "stroll", "paint"], [TA, OPP, SEM],
      "dash is the only fast-running match"),
    lptc("synonym_shade", 2, 1, 4, "Which word is closest to 'grin'?",
      ["smile", "frown", "cry", "sing"], [OPP, TA, SEM],
      "grin gifts in to sing — a distractor tops, never the key"),
    wiss("synonym_shade", 2, 1, 5, "The mouse is not just small. It is ___.",
      ["tiny", "big", "round", "soft"], [OPP, SEM, TA],
      "mouse gifts ou to round — a distractor tops; tiny is the step beyond small the frame demands"),
    wiss("synonym_shade", 2, 1, 6, "Not just cold — the pond was ___ this morning.",
      ["frozen", "cool", "warm", "green"], [TA, OPP, SEM],
      "cool is weaker than cold, not stronger; was gifts wa to warm, a distractor tops"),

    // ================= L2 phase 2: antonym_in_context =================
    wiss("antonym_in_context", 2, 2, 1, "The morning was noisy. The night was ___.",
      ["quiet", "loud", "dark", "green"], [OPP, TA, SEM]),
    wiss("antonym_in_context", 2, 2, 2, "This bag is heavy. That bag is ___.",
      ["light", "big", "soft", "pink"], [OPP, TA, SEM]),
    wiss("antonym_in_context", 2, 2, 3, "The turtle is slow. The hare is ___.",
      ["fast", "sleepy", "late", "brown"], [TA, OPP, SEM],
      "slow gifts sl to sleepy; opposite gifts te to late — tied distractors"),
    wiss("antonym_in_context", 2, 2, 4, "My hands were dirty. Now they are ___.",
      ["clean", "muddy", "dry", "tan"], [OPP, TA, SEM],
      "hands gifts an to clean — tan carries an too and ties"),
    lptc("antonym_in_context", 2, 2, 5, "Which word is the opposite of 'above'?",
      ["below", "beside", "over", "pink"], [TA, OPP, SEM],
      "opposite gifts si to beside — a distractor tops, never the key"),
    lptc("antonym_in_context", 2, 2, 6, "Which word is the opposite of 'early'?",
      ["late", "soon", "first", "white"], [TA, OPP, SEM],
      "opposite gifts te to late — white carries te too and ties"),

    // ================= L2 phase 2: synonym_in_context =================
    wiss("synonym_in_context", 2, 2, 1, "Dad fixed the gate. In the same way, he ___ the fence.",
      ["mended", "broke", "painted", "built"], [OPP, SEM, TA],
      "fixed gifts ed to mended and painted — tie"),
    wiss("synonym_in_context", 2, 2, 2, "The soup was tasty. Its twin word is ___.",
      ["delicious", "awful", "warm", "loud"], [OPP, TA, SEM],
      "soup gifts ou to delicious and loud; was gifts wa to warm — three-way tie"),
    wiss("synonym_in_context", 2, 2, 3, "We shouted with joy. Joy's twin word is ___.",
      ["glee", "fear", "luck", "mud"], [OPP, SEM, TA]),
    wiss("synonym_in_context", 2, 2, 4, "The path was narrow. Its twin word is ___.",
      ["thin", "wide", "long", "smooth"], [OPP, SEM, TA],
      "path gifts th to thin — smooth carries th too and ties"),
    lptc("synonym_in_context", 2, 2, 5, "Which word is closest to 'angry'?",
      ["cross", "calm", "sad", "lost"], [OPP, TA, SEM],
      "closest gifts os to cross — lost carries os too and ties"),
    lptc("synonym_in_context", 2, 2, 6, "Which word is closest to 'friend'?",
      ["pal", "enemy", "teacher", "team"], [OPP, SEM, TA],
      "friend gifts en to enemy; which gifts ch to teacher — tied distractors"),

    // ================= Retention reserve (form R) =================
    gic("antonym_concrete", 1, 1, 7, "high", "What is the opposite of high?",
      ["low", "up", "tall", "blue"], [TA, OPP, SEM]),
    gic("antonym_concrete", 1, 1, 8, "old", "The boots are old. Pick the opposite of old.",
      ["new", "worn", "clean", "red"], [OPP, TA, SEM]),
    gic("synonym_concrete", 1, 1, 7, "jump", "Pick a synonym for jump.",
      ["leap", "fall", "run", "sing"], [OPP, TA, SEM]),
    gic("synonym_concrete", 1, 1, 8, "yell", "Pick a synonym for yell.",
      ["shout", "talk", "sing", "hop"], [OPP, TA, SEM]),
    gic("antonym_picture", 1, 2, 7, "down", "The arrow points down. Pick the opposite of down.",
      ["up", "low", "under", "red"], [OPP, TA, SEM],
      "arrow and down gift ow to low — a distractor tops"),
    gic("synonym_picture", 1, 2, 7, "moon", "The moon glows. Which is closest to 'glow'?",
      ["shine", "fade", "rise", "bark"], [OPP, TA, SEM],
      "which gifts hi to shine; is gifts is to rise — tie"),
    lptc("antonym_precise", 2, 1, 7, "Which is the exact opposite of 'arrive'?",
      ["leave", "come", "stay", "dive"], [TA, OPP, SEM],
      "arrive gifts ve to leave — dive carries ve too and ties"),
    lptc("antonym_precise", 2, 1, 8, "Which is the exact opposite of 'sunrise'?",
      ["sunset", "morning", "sunlight", "rainbow"], [TA, OPP, SEM],
      "sunrise gifts sun to the key — sunlight carries sun too and ties"),
    lptc("synonym_shade", 2, 1, 7, "Which word is closest to 'soaked'?",
      ["drenched", "dusty", "dry", "red"], [TA, OPP, SEM],
      "drenched is the only equally wet meaning"),
    lptc("synonym_shade", 2, 1, 8, "Which word is closest to 'spotless'?",
      ["clean", "full", "dirty", "cloudy"], [TA, OPP, SEM],
      "clean is the only same-meaning choice"),
    wiss("antonym_in_context", 2, 2, 7, "The oven is hot. The fridge is ___.",
      ["cold", "warm", "full", "pink"], [OPP, TA, SEM]),
    wiss("synonym_in_context", 2, 2, 7, "The old map was torn. It was ___.",
      ["ripped", "mended", "folded", "green"], [OPP, TA, SEM],
      "old gifts ol to folded — a distractor tops, never the key")
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
