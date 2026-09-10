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

export const GRAMMAR_GRIND_LEVELS_PER_DIFFICULTY = 10;

export function grammarGrindLadder(difficulty = "easy") {
  const key = Object.hasOwn(LEVELS, difficulty) ? difficulty : "easy";
  return LEVELS[key].map((item, index) => ({
    ...item,
    level: index,
    difficulty: key,
    segments: [...item.segments],
    options: [...item.options]
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
