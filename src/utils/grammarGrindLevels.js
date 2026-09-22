import { replayShuffle, replayWithinBands } from "./gameReplay.js";
import { starRubric } from "./starRubric.js";

const level = (word, segments, options, cue) => ({
  type: "spelling",
  prompt: "Listen. Collect the spelling parts in order.",
  sentence: segments.map(() => "_").join("  "),
  audioWord: word,
  segments,
  correct: word,
  options,
  cue,
  focus: segments.length === 1 ? "Whole-word spelling" : `Build ${segments.length} spelling parts`,
  teaching: cue,
  success: `${segments.join(" + ")} spells ${word}.`,
  wrongHint: `Blend ${segments.join(" + ")} and look for ${word}.`
});

const EASY = [
  level("cat", ["c", "a", "t"], ["cat", "cap", "cot"], "Collect c, a, t. Blend them: cat."),
  level("sun", ["s", "u", "n"], ["sun", "sit", "run"], "Collect s, u, n. Blend them: sun."),
  level("map", ["m", "a", "p"], ["map", "mat", "mop"], "Collect m, a, p. Blend them: map."),
  level("dog", ["d", "o", "g"], ["dog", "dig", "dot"], "Collect d, o, g. Blend them: dog."),
  level("fish", ["f", "i", "sh"], ["fish", "fin", "dish"], "The final sound /sh/ is written with two letters."),
  level("chip", ["ch", "i", "p"], ["chip", "chop", "ship"], "The first sound /ch/ is written with two letters."),
  level("ring", ["r", "i", "ng"], ["ring", "rang", "sing"], "The final sound /ng/ is written with two letters."),
  level("duck", ["d", "u", "ck"], ["duck", "dock", "luck"], "At the end, /k/ is written ck."),
  level("shop", ["sh", "o", "p"], ["shop", "ship", "chop"], "Start with the two-letter sound sh."),
  level("thin", ["th", "i", "n"], ["thin", "this", "chin"], "Start with the two-letter sound th.")
];

const MEDIUM = [
  level("hand", ["h", "a", "nd"], ["hand", "sand", "hunt"], "Keep the final blend nd together."),
  level("frog", ["f", "r", "o", "g"], ["frog", "from", "fog"], "Hear both sounds in the starting blend fr."),
  level("black", ["b", "l", "a", "ck"], ["black", "block", "back"], "Blend b and l, then finish with ck."),
  level("train", ["tr", "ai", "n"], ["train", "trail", "rain"], "The middle long-a sound is the vowel team ai."),
  level("sheep", ["sh", "ee", "p"], ["sheep", "ship", "sheet"], "The long-e sound in sheep is written ee."),
  level("boat", ["b", "oa", "t"], ["boat", "boot", "coat"], "The long-o sound in boat is written oa."),
  level("light", ["l", "igh", "t"], ["light", "night", "lit"], "The long-i sound is written igh."),
  level("moon", ["m", "oo", "n"], ["moon", "soon", "moan"], "The long /oo/ sound uses the vowel team oo."),
  level("play", ["p", "l", "ay"], ["play", "plan", "stay"], "At the end of a word, long a can be written ay."),
  level("coin", ["c", "oi", "n"], ["coin", "join", "corn"], "The middle /oy/ sound is written oi.")
];

const HARD = [
  level("cake", ["c", "a_e", "k"], ["cake", "cape", "make"], "The split digraph a-e makes the long-a sound."),
  level("shine", ["sh", "i_e", "n"], ["shine", "shone", "shin"], "The split digraph i-e makes the long-i sound."),
  level("stone", ["st", "o_e", "n"], ["stone", "stove", "tone"], "The split digraph o-e makes the long-o sound."),
  level("cube", ["c", "u_e", "b"], ["cube", "tube", "cub"], "The split digraph u-e makes the /yoo/ sound."),
  level("star", ["st", "ar"], ["star", "start", "stir"], "The r-controlled spelling ar makes the sound in star."),
  level("storm", ["st", "or", "m"], ["storm", "store", "form"], "The middle spelling or makes the sound in storm."),
  level("fern", ["f", "er", "n"], ["fern", "turn", "farm"], "The middle spelling er makes the sound in fern."),
  level("cloud", ["cl", "ou", "d"], ["cloud", "could", "clown"], "The middle spelling ou makes the sound in cloud."),
  level("chair", ["ch", "air"], ["chair", "chain", "cheer"], "The ending air makes the sound in chair."),
  level("bright", ["br", "igh", "t"], ["bright", "brought", "right"], "Blend br, then igh, then t.")
];

const LEVELS = Object.freeze({ easy: EASY, medium: MEDIUM, hard: HARD });


const JOURNEY_BANKS = {
  easy: [EASY,
    [
      level("hat", ["h", "a", "t"], ["hat", "hot", "hit"], "Build hat with h, a, t."),
      level("pig", ["p", "i", "g"], ["pig", "peg", "pin"], "Build pig with p, i, g."),
      level("pen", ["p", "e", "n"], ["pen", "pan", "pin"], "Build pen with p, e, n."),
      level("cup", ["c", "u", "p"], ["cup", "cap", "cop"], "Build cup with c, u, p."),
      level("ship", ["sh", "i", "p"], ["ship", "shop", "chip"], "Build ship with sh, i, p."),
      level("chop", ["ch", "o", "p"], ["chop", "chip", "shop"], "Build chop with ch, o, p."),
      level("sing", ["s", "i", "ng"], ["sing", "sang", "song"], "Build sing with s, i, ng."),
      level("neck", ["n", "e", "ck"], ["neck", "nick", "peck"], "Build neck with n, e, ck."),
      level("shed", ["sh", "e", "d"], ["shed", "ship", "sad"], "Build shed with sh, e, d."),
      level("moth", ["m", "o", "th"], ["moth", "bath", "moss"], "Build moth with m, o, th."),
    ],
    [
      level("red", ["r", "e", "d"], ["red", "rod", "rid"], "Build red with r, e, d."),
      level("hen", ["h", "e", "n"], ["hen", "hat", "him"], "Build hen with h, e, n."),
      level("log", ["l", "o", "g"], ["log", "leg", "lot"], "Build log with l, o, g."),
      level("run", ["r", "u", "n"], ["run", "ran", "sun"], "Build run with r, u, n."),
      level("dish", ["d", "i", "sh"], ["dish", "dash", "fish"], "Build dish with d, i, sh."),
      level("chill", ["ch", "i", "ll"], ["chill", "shell", "chip"], "Build chill with ch, i, ll."),
      level("king", ["k", "i", "ng"], ["king", "ring", "kind"], "Build king with k, i, ng."),
      level("back", ["b", "a", "ck"], ["back", "buck", "pack"], "Build back with b, a, ck."),
      level("rush", ["r", "u", "sh"], ["rush", "rash", "run"], "Build rush with r, u, sh."),
      level("thud", ["th", "u", "d"], ["thud", "thin", "mud"], "Build thud with th, u, d."),
    ],
  ],
  medium: [MEDIUM,
    [
      level("milk", ["m", "i", "l", "k"], ["milk", "silk", "mill"], "Build milk with m, i, l, k."),
      level("stop", ["s", "t", "o", "p"], ["stop", "step", "shop"], "Build stop with s, t, o, p."),
      level("crab", ["c", "r", "a", "b"], ["crab", "crib", "cab"], "Build crab with c, r, a, b."),
      level("rain", ["r", "ai", "n"], ["rain", "ran", "rail"], "Build rain with r, ai, n."),
      level("feet", ["f", "ee", "t"], ["feet", "feed", "fit"], "Build feet with f, ee, t."),
      level("goat", ["g", "oa", "t"], ["goat", "got", "coat"], "Build goat with g, oa, t."),
      level("night", ["n", "igh", "t"], ["night", "light", "knit"], "Build night with n, igh, t."),
      level("food", ["f", "oo", "d"], ["food", "foot", "fold"], "Build food with f, oo, d."),
      level("stay", ["s", "t", "ay"], ["stay", "star", "play"], "Build stay with s, t, ay."),
      level("join", ["j", "oi", "n"], ["join", "coin", "chin"], "Build join with j, oi, n."),
    ],
    [
      level("tent", ["t", "e", "n", "t"], ["tent", "test", "ten"], "Build tent with t, e, n, t."),
      level("drum", ["d", "r", "u", "m"], ["drum", "drop", "rum"], "Build drum with d, r, u, m."),
      level("clap", ["c", "l", "a", "p"], ["clap", "clip", "cap"], "Build clap with c, l, a, p."),
      level("tail", ["t", "ai", "l"], ["tail", "tall", "mail"], "Build tail with t, ai, l."),
      level("seed", ["s", "ee", "d"], ["seed", "shed", "see"], "Build seed with s, ee, d."),
      level("road", ["r", "oa", "d"], ["road", "rod", "read"], "Build road with r, oa, d."),
      level("high", ["h", "igh"], ["high", "sigh", "hit"], "Build high with h, igh."),
      level("boot", ["b", "oo", "t"], ["boot", "boat", "book"], "Build boot with b, oo, t."),
      level("day", ["d", "ay"], ["day", "dry", "bay"], "Build day with d, ay."),
      level("soil", ["s", "oi", "l"], ["soil", "sail", "seal"], "Build soil with s, oi, l."),
    ],
  ],
  hard: [HARD,
    [
      level("make", ["m", "a_e", "k"], ["make", "made", "cake"], "Build make with m, a_e, k."),
      level("slide", ["s", "l", "i_e", "d"], ["slide", "slid", "side"], "Build slide with s, l, i_e, d."),
      level("rope", ["r", "o_e", "p"], ["rope", "ripe", "hope"], "Build rope with r, o_e, p."),
      level("tube", ["t", "u_e", "b"], ["tube", "tub", "cube"], "Build tube with t, u_e, b."),
      level("park", ["p", "ar", "k"], ["park", "part", "pork"], "Build park with p, ar, k."),
      level("fork", ["f", "or", "k"], ["fork", "form", "park"], "Build fork with f, or, k."),
      level("herd", ["h", "er", "d"], ["herd", "hard", "held"], "Build herd with h, er, d."),
      level("shout", ["sh", "ou", "t"], ["shout", "shot", "shoot"], "Build shout with sh, ou, t."),
      level("hair", ["h", "air"], ["hair", "hare", "fair"], "Build hair with h, air."),
      level("flight", ["f", "l", "igh", "t"], ["flight", "fight", "fright"], "Build flight with f, l, igh, t."),
    ],
    [
      level("gate", ["g", "a_e", "t"], ["gate", "gap", "late"], "Build gate with g, a_e, t."),
      level("smile", ["s", "m", "i_e", "l"], ["smile", "smell", "mile"], "Build smile with s, m, i_e, l."),
      level("home", ["h", "o_e", "m"], ["home", "hope", "hum"], "Build home with h, o_e, m."),
      level("flute", ["f", "l", "u_e", "t"], ["flute", "flue", "flat"], "Build flute with f, l, u_e, t."),
      level("cart", ["c", "ar", "t"], ["cart", "cat", "curt"], "Build cart with c, ar, t."),
      level("short", ["sh", "or", "t"], ["short", "shirt", "shot"], "Build short with sh, or, t."),
      level("term", ["t", "er", "m"], ["term", "team", "turn"], "Build term with t, er, m."),
      level("sound", ["s", "ou", "n", "d"], ["sound", "sand", "found"], "Build sound with s, ou, n, d."),
      level("pair", ["p", "air"], ["pair", "pear", "pain"], "Build pair with p, air."),
      level("fright", ["f", "r", "igh", "t"], ["fright", "fight", "bright"], "Build fright with f, r, igh, t."),
    ],
  ],
};

export const GRAMMAR_GRIND_LEVELS_PER_DIFFICULTY = 10;

export function grammarGrindLadder(difficulty = "easy", sessionSeed = 0, chapter = 0) {
  const key = Object.hasOwn(LEVELS, difficulty) ? difficulty : "easy";
  const bank = JOURNEY_BANKS[key][Math.abs(chapter) % 3];
  return replayWithinBands(bank, sessionSeed, item => Math.floor(bank.indexOf(item) / 3)).map((item, index) => ({
    ...item,
    level: index,
    difficulty: key,
    segments: [...item.segments],
    options: replayShuffle(item.options, sessionSeed ? `${sessionSeed}:${index}` : 0)
  }));
}

export function grammarGrindIsCorrect(choice, currentLevel) {
  return String(choice) === String(currentLevel?.correct ?? "");
}

export function grammarGrindChoiceFeedback(choice, currentLevel, { reveal = false } = {}) {
  if (!currentLevel) return "Listen again, then blend the sounds you collected.";
  if (grammarGrindIsCorrect(choice, currentLevel)) return currentLevel.success;
  const chosen = String(choice);
  const hint = currentLevel.wrongHint || currentLevel.cue;
  return reveal
    ? `"${chosen}" is not the word. ${hint} Choose "${currentLevel.correct}".`
    : `"${chosen}" is not the word. ${hint}`;
}

export function grammarGrindSegmentChoices(currentLevel, ladder, stepIndex = 0, seedOffset = 0) {
  const expected = currentLevel?.segments?.[stepIndex];
  if (!expected) return [];
  const pool = [...new Set((ladder || []).flatMap(item => item?.segments || []))]
    .filter(segment => segment && segment !== expected);
  const start = Math.abs((Number(seedOffset) || 0) * 5 + stepIndex * 3) % Math.max(1, pool.length);
  const distractors = [];
  for (let index = 0; index < pool.length && distractors.length < 2; index += 1) {
    const candidate = pool[(start + index) % pool.length];
    if (!distractors.includes(candidate)) distractors.push(candidate);
  }
  const choices = [expected, ...distractors];
  while (choices.length < 3) choices.push(`?${choices.length}`);
  const shift = Math.abs((Number(seedOffset) || 0) + stepIndex) % choices.length;
  return [...choices.slice(shift), ...choices.slice(0, shift)];
}

export function grammarGrindStars(result = {}) {
  return starRubric(result);
}
