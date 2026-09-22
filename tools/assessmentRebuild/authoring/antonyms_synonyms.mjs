// Antonyms & Synonyms — v3 authored bank (wave W12, paired with homophones).
// The set law (BLUEPRINTS_LANGUAGE §21):
//   antonym items — key is the TRUE opposite; distractors are a synonym of
//     the prompt word (D-OPPOSITE relative to the key), a topic-adjacent
//     near-miss, and a plausible same-domain non-relation.
//   synonym items — the TRUE ANTONYM of the prompt word rides as a mandatory
//     D-OPPOSITE distractor; plus a near-miss and a same-domain non-relation.
// Shade/precision items (synonym_shade, antonym_precise) carry notes that
// defend why the key is uniquely exact — the weaker-degree rival is the trap.
// Scanner-proofing: "opposite"/"closest" gift or/it/te/st chunks — every set
// that receives a gift carries a second carrier so the top is never strict.
// Word relations are assessed in print/context. Abstract relation words do not
// receive subjective picture cards that can cue a different name.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §21.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const OPP = "D-OPPOSITE";
const TA = "D-TOPIC-ADJACENT";
const SAME = "D-SAME-DOMAIN";

const lptc = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "LANGUAGE_PAIR_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

// Pair recognition differs from applying a relation to a supplied sentence.
const gic = (u, lvl, ph, v, target, _prompt, words, rationales, note = "") => {
  const prompt = u.startsWith("antonym")
    ? "Which pair has opposite meanings?"
    : "Find two words that mean the same.";
  const stimulus = ({ sun: "bright", rock: "hard", snow: "cold", ant: "tiny", lamp: "glows" })[target] || target;
  return { u, lvl, ph, v, fmt: "WORD_RELATION_TEXT_CHOICE", prompt, spoken: prompt,
    choices: words.map((w, i) => i === 0 ? K(`${stimulus} — ${w}`) : P(`${stimulus} — ${w}`, rationales[i - 1])),
    media: "text", note: note || "Compare both members of each word pair." };
};

const lpisc = (u, lvl, ph, v, img, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "LANGUAGE_PAIR_TEXT_CHOICE",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const wiss = (u, lvl, ph, v, sentence, words, rationales, note = "") => {
  const task = u === "synonym_shade"
    ? "Which same-meaning word fits best"
    : u.startsWith("synonym")
      ? "Which same-meaning word fits"
      : "Which opposite word fits";
  return {
    u, lvl, ph, v, fmt: "WORD_IN_SENTENCE_SWAP",
    prompt: `${task}: ${sentence}`,
    spoken: `${task}? ${sentence.replace("___", "hmm")}`,
    sentence,
    choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
    media: "text",
    note
  };
};

const freshPhaseItems = [
  gic("antonym_concrete", 1, 1, 9, "push", "", ["pull", "press", "shove", "nudge"], [OPP, TA, SAME]),
  lpisc("antonym_concrete", 1, 1, 10, "fast", "A fast car moves quickly. Choose the opposite of fast.", ["slow", "speedy", "quick", "rapid"], [OPP, TA, SAME]),
  gic("synonym_concrete", 1, 1, 9, "near", "", ["close", "far", "above", "behind"], [OPP, TA, SAME]),
  lpisc("synonym_concrete", 1, 1, 10, "strong", "The rope is strong. Which word means the same here?", ["tough", "weak", "thick", "stiff"], [OPP, TA, SAME]),
  gic("antonym_picture", 1, 2, 8, "soft", "", ["hard", "fluffy", "squishy", "spongy"], [OPP, TA, SAME]),
  lpisc("antonym_picture", 1, 2, 9, "smooth", "The stone feels smooth. Choose the opposite of smooth.", ["rough", "silky", "slick", "even"], [OPP, TA, SAME]),
  gic("synonym_picture", 1, 2, 8, "close", "", ["shut", "open", "lift", "turn"], [OPP, TA, SAME]),
  lpisc("synonym_picture", 1, 2, 9, "ill", "The child feels ill. Which word means the same here?", ["sick", "well", "tired", "hungry"], [OPP, TA, SAME]),
  lptc("antonym_precise", 2, 1, 9, "Which word is the opposite of 'carefully'?", ["carelessly", "gently", "slowly", "neatly"], [OPP, TA, SAME]),
  wiss("antonym_precise", 2, 1, 10, "The towel was soaked. Its opposite is completely ___.", ["dry", "wet", "damp", "dripping"], [OPP, TA, SAME]),
  lptc("synonym_shade", 2, 1, 9, "Which word is closest to 'furious'?", ["angry", "pleased", "worried", "upset"], [OPP, TA, SAME]),
  wiss("synonym_shade", 2, 1, 10, "The puppy was exhausted, meaning very ___.", ["tired", "lively", "calm", "quiet"], [OPP, TA, SAME]),
  lptc("antonym_in_context", 2, 2, 8, "The box is heavy. Which pair reverses that meaning?", ["heavy — light", "heavy — solid", "heavy — large", "heavy — full"], [OPP, TA, SAME]),
  wiss("antonym_in_context", 2, 2, 9, "The water rose. Later it did the opposite: it ___.", ["fell", "climbed", "flowed", "rippled"], [OPP, TA, SAME]),
  lptc("synonym_in_context", 2, 2, 8, "The child was brave. Which pair means the same here?", ["brave — bold", "brave — fearful", "brave — careful", "brave — loud"], [OPP, TA, SAME]),
  wiss("synonym_in_context", 2, 2, 9, "He spoke in a quiet voice: a ___ voice.", ["soft", "loud", "deep", "high"], [OPP, TA, SAME])
];

export default {
  skillId: "antonyms_synonyms",
  skillName: "Antonyms & Synonyms",
  items: [
    // ================= L1 phase 1: antonym_concrete =================
    gic("antonym_concrete", 1, 1, 1, "hot", "What is the opposite of hot?",
      ["cold", "scorching", "warm", "heated"], [OPP, TA, SAME]),
    gic("antonym_concrete", 1, 1, 2, "big", "What is the opposite of big?",
      ["small", "huge", "tall", "high"], [OPP, TA, SAME]),
    gic("antonym_concrete", 1, 1, 3, "up", "What is the opposite of up?",
      ["down", "high", "under", "top"], [OPP, TA, SAME]),
    lpisc("antonym_concrete", 1, 1, 4, "wet", "What is the opposite of wet?",
      ["dry", "soaked", "damp", "dripping"], [OPP, TA, SAME]),
    lpisc("antonym_concrete", 1, 1, 5, "full", "The cup is full. Which word is its opposite?",
      ["empty", "filled", "packed", "overflowing"], [OPP, TA, SAME],
      "empty reverses full; the other options describe contents rather than absence"),
    lpisc("antonym_concrete", 1, 1, 6, "wide", "This gate is wide. Which word is its opposite?",
      ["narrow", "broad", "deep", "thick"], [OPP, TA, SAME]),

    // ================= L1 phase 1: synonym_concrete =================
    gic("synonym_concrete", 1, 1, 1, "happy", "Which word means about the same as happy?",
      ["glad", "sad", "proud", "sleepy"], [OPP, TA, SAME]),
    gic("synonym_concrete", 1, 1, 2, "shout", "Which word means about the same as shout?",
      ["yell", "whisper", "talk", "sing"], [OPP, TA, SAME]),
    lptc("synonym_concrete", 1, 1, 3, "Which word means about the same as little?",
      ["small", "huge", "thin", "wide"], [OPP, TA, SAME]),
    lpisc("synonym_concrete", 1, 1, 4, "begin", "Which word means about the same as begin?",
      ["start", "finish", "continue", "pause"], [OPP, TA, SAME],
      "finish is the true opposite; continue and pause are plausible event-stage near-misses"),
    lpisc("synonym_concrete", 1, 1, 5, "sea", "Which word is another name for sea?",
      ["ocean", "land", "beach", "lake"], [OPP, TA, SAME],
      "ocean alone is a synonym; land contrasts with sea while beach and lake stay in the same domain"),
    lpisc("synonym_concrete", 1, 1, 6, "rain", "The rain makes things wet. Which word is closest to 'wet'?",
      ["damp", "dry", "cold", "muddy"], [OPP, TA, SAME]),

    // ================= L1 phase 2: antonym_picture =================
    gic("antonym_picture", 1, 2, 1, "awake", "Which word is the opposite of awake?",
      ["asleep", "alert", "lively", "watchful"], [OPP, TA, SAME],
      "Asleep reverses awake; alert, lively and watchful do not."),
    gic("antonym_picture", 1, 2, 2, "night", "Which word is the opposite of night?",
      ["day", "dark", "moon", "midnight"], [OPP, TA, SAME]),
    gic("antonym_picture", 1, 2, 3, "new", "Which word is the opposite of new?",
      ["old", "fresh", "shiny", "clean"], [OPP, TA, SAME],
      "shoes gifts sh to fresh and shiny — a tied distractor pair"),
    lpisc("antonym_picture", 1, 2, 4, "open", "Which word is the opposite of open?",
      ["shut", "wide", "unlocked", "empty"], [OPP, TA, SAME]),
    lpisc("antonym_picture", 1, 2, 5, "clean", "The towel is clean. Choose the opposite of clean.",
      ["dirty", "washed", "spotless", "fresh"], [TA, OPP, SAME],
      "Dirty reverses clean; the other descriptions are compatible with cleanliness."),
    lpisc("antonym_picture", 1, 2, 6, "tall", "What is the opposite of tall?",
      ["short", "giant", "long", "high"], [OPP, TA, SAME],
      "short alone reverses height; giant, long, and high remain plausible size words"),

    // ================= L1 phase 2: synonym_picture =================
    gic("synonym_picture", 1, 2, 1, "sun", "The sun is bright. Which word is closest to 'bright'?",
      ["light", "dark", "dim", "gloomy"], [OPP, TA, SAME],
      "Bright and light describe illumination; the other pairs contrast illumination."),
    gic("synonym_picture", 1, 2, 2, "rock", "The rock is hard. Which word is closest to 'hard'?",
      ["solid", "soft", "heavy", "hot"], [OPP, TA, SAME]),
    gic("synonym_picture", 1, 2, 3, "snow", "Snow is cold. Which word is closest to 'cold'?",
      ["chilly", "warm", "mild", "hot"], [OPP, TA, SAME],
      "Chilly means cold; warm, mild and hot do not."),
    lpisc("synonym_picture", 1, 2, 4, "ant", "The ant is tiny. Which word is closest to 'tiny'?",
      ["small", "giant", "thin", "wide"], [OPP, TA, SAME],
      "ant gifts an to giant; which gifts hi to thin — tied distractors"),
    lpisc("synonym_picture", 1, 2, 5, "quick", "Pick a word that means quick.",
      ["fast", "slow", "steady", "early"], [OPP, TA, SAME],
      "closest gifts st to fast — steady carries st too and ties"),
    lpisc("synonym_picture", 1, 2, 6, "sleepy", "Which word means about the same as sleepy?",
      ["tired", "awake", "cozy", "calm"], [OPP, TA, SAME]),

    // ================= L2 phase 1: antonym_precise =================
    lptc("antonym_precise", 2, 1, 1, "Which is the exact opposite of 'whisper'?",
      ["shout", "talk", "mumble", "sing"], [TA, OPP, SAME]),
    lptc("antonym_precise", 2, 1, 2, "Which word means the opposite of 'freezing cold'?",
      ["boiling", "freezing cold", "icy", "chilly"], [TA, OPP, SAME],
      "boiling is the only hot extreme; icy and cold reinforce freezing"),
    lptc("antonym_precise", 2, 1, 3, "Which is the exact opposite of 'giant'?",
      ["tiny", "huge", "long", "tall"], [OPP, TA, SAME]),
    lptc("antonym_precise", 2, 1, 4, "Pick the opposite of 'noisy'.",
      ["silent", "loud", "busy", "musical"], [OPP, TA, SAME],
      "silent is the only choice about an absence of sound"),
    wiss("antonym_precise", 2, 1, 5, "The kitten is tame. The tiger is ___.",
      ["wild", "calm", "soft", "playful"], [OPP, TA, SAME]),
    wiss("antonym_precise", 2, 1, 6, "This puzzle is simple. Its opposite is ___.",
      ["tricky", "easy", "long", "colorful"], [OPP, TA, SAME]),

    // ================= L2 phase 1: synonym_shade =================
    lptc("synonym_shade", 2, 1, 1, "Which word is closest to 'giggle'?",
      ["chuckle", "whisper", "sob", "chat"], [TA, OPP, SAME],
      "chuckle alone names the same small laugh; no broader laugh synonym competes"),
    lptc("synonym_shade", 2, 1, 2, "Which word is closest to 'huge'?",
      ["enormous", "narrow", "small", "short"], [TA, OPP, SAME],
      "enormous is the only same-meaning size word"),
    lptc("synonym_shade", 2, 1, 3, "Which word is closest to 'sprint'?",
      ["dash", "crawl", "stroll", "jog"], [TA, OPP, SAME],
      "dash is the only fast-running match"),
    lptc("synonym_shade", 2, 1, 4, "Which word is closest to 'grin'?",
      ["smile", "frown", "cry", "laugh"], [OPP, TA, SAME],
      "smile alone matches the facial expression; laugh remains a related but distinct response"),
    wiss("synonym_shade", 2, 1, 5, "The mouse was very small: it was ___.",
      ["tiny", "huge", "short", "slim"], [OPP, SAME, TA],
      "Tiny matches very small; short and slim describe different dimensions."),
    wiss("synonym_shade", 2, 1, 6, "The lake was icy: its surface was ___.",
      ["frozen", "melted", "cool", "chilly"], [TA, OPP, SAME],
      "Icy describes a frozen surface; cool and chilly do not require ice."),

    // ================= L2 phase 2: antonym_in_context =================
    wiss("antonym_in_context", 2, 2, 1, "The morning was noisy. The night was ___.",
      ["quiet", "loud", "busy", "musical"], [OPP, TA, SAME]),
    wiss("antonym_in_context", 2, 2, 2, "This bag is heavy. That bag is ___.",
      ["light", "big", "soft", "empty"], [OPP, TA, SAME]),
    wiss("antonym_in_context", 2, 2, 3, "The turtle is slow. The hare is ___.",
      ["fast", "sleepy", "late", "steady"], [TA, OPP, SAME],
      "slow gifts sl to sleepy; opposite gifts te to late — tied distractors"),
    wiss("antonym_in_context", 2, 2, 4, "My hands were dirty. Now they are ___.",
      ["clean", "muddy", "dry", "wet"], [OPP, TA, SAME]),
    wiss("antonym_in_context", 2, 2, 5, "The kite rose above us. Its opposite is ___.",
      ["below", "beside", "over", "near"], [TA, OPP, SAME],
      "opposite gifts si to beside — a distractor tops, never the key"),
    wiss("antonym_in_context", 2, 2, 6, "We arrived early. The opposite of early is ___.",
      ["late", "soon", "first", "promptly"], [TA, OPP, SAME],
      "Late reverses early; soon, first and promptly remain time-related distractors."),

    // ================= L2 phase 2: synonym_in_context =================
    wiss("synonym_in_context", 2, 2, 1, "Dad fixed the gate. In the same way, he ___ the fence.",
      ["mended", "broke", "painted", "built"], [OPP, SAME, TA],
      "fixed gifts ed to mended and painted — tie"),
    wiss("synonym_in_context", 2, 2, 2, "The soup was tasty, or ___.",
      ["delicious", "awful", "warm", "salty"], [OPP, TA, SAME],
      "delicious alone matches tasty; awful contrasts while warm and salty are related food qualities"),
    wiss("synonym_in_context", 2, 2, 3, "We shouted with joy — with ___.",
      ["glee", "fear", "luck", "pride"], [OPP, SAME, TA]),
    wiss("synonym_in_context", 2, 2, 4, "The ribbon was narrow, or ___.",
      ["thin", "wide", "long", "smooth"], [OPP, SAME, TA],
      "Thin is the only same-meaning description of the ribbon's width."),
    wiss("synonym_in_context", 2, 2, 5, "The angry child stamped a foot. Angry means ___.",
      ["mad", "calm", "sad", "afraid"], [OPP, TA, SAME]),
    wiss("synonym_in_context", 2, 2, 6, "Jo is my friend. Jo is my ___.",
      ["pal", "enemy", "teacher", "teammate"], [OPP, SAME, TA],
      "friend gifts en to enemy; which gifts ch to teacher — tied distractors"),

    // ================= Retention reserve (form R) =================
    gic("antonym_concrete", 1, 1, 7, "high", "What is the opposite of high?",
      ["low", "up", "tall", "top"], [TA, OPP, SAME]),
    gic("antonym_concrete", 1, 1, 8, "old", "The boots are old. Pick the opposite of old.",
      ["new", "worn", "clean", "shiny"], [OPP, TA, SAME]),
    gic("synonym_concrete", 1, 1, 7, "jump", "What word is closest to jump?",
      ["leap", "fall", "run", "slide"], [OPP, TA, SAME]),
    gic("synonym_concrete", 1, 1, 8, "yell", "Which word means about the same as yell?",
      ["shout", "whisper", "talk", "sing"], [OPP, TA, SAME]),
    gic("antonym_picture", 1, 2, 7, "down", "The arrow points down. Pick the opposite of down.",
      ["up", "low", "under", "top"], [OPP, TA, SAME],
      "arrow and down gift ow to low — a distractor tops"),
    gic("synonym_picture", 1, 2, 7, "lamp", "The lamp glows. Which word means about the same as glows?",
      ["shines", "dims", "flickers", "warms"], [OPP, TA, SAME]),
    lptc("antonym_precise", 2, 1, 7, "Which is the exact opposite of 'arrive'?",
      ["leave", "come", "stay", "enter"], [TA, OPP, SAME],
      "leave alone reverses arrival; come, stay, and enter remain plausible movement-state words"),
    lptc("antonym_precise", 2, 1, 8, "Which is the exact opposite of 'sunrise'?",
      ["sunset", "morning", "sunlight", "rainbow"], [TA, OPP, SAME],
      "sunrise gifts sun to the key — sunlight carries sun too and ties"),
    lptc("synonym_shade", 2, 1, 7, "Which word is closest to 'soaked'?",
      ["drenched", "dusty", "dry", "muddy"], [TA, OPP, SAME],
      "drenched is the only equally wet meaning"),
    lptc("synonym_shade", 2, 1, 8, "Which word is closest to 'spotless'?",
      ["clean", "dirty", "shiny", "cloudy"], [OPP, TA, SAME],
      "clean is the only same-meaning choice"),
    wiss("antonym_in_context", 2, 2, 7, "The oven is hot. The fridge is ___.",
      ["cold", "warm", "full", "empty"], [OPP, TA, SAME]),
    wiss("synonym_in_context", 2, 2, 7, "The old map was torn. It was ___.",
      ["ripped", "mended", "folded", "creased"], [OPP, TA, SAME],
      "old gifts ol to folded — a distractor tops, never the key")
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  }).concat(freshPhaseItems)
};
