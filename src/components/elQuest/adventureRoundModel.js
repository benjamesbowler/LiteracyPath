export const ADVENTURE_MECHANIC_IDS = Object.freeze([
  "letterPair",
  "soundGate",
  "sceneHunt",
  "wordWindow",
  "soundBoxes",
  "wordMachine",
  "poemSpotlight",
  "coverClue",
  "letterTrace",
  "patternSort",
  "wordChain",
  "phraseFlow",
  "heartWord"
]);

const MULTI_LETTER_GRAPHEMES = Object.freeze([
  "sh", "ch", "th", "wh", "ck", "ng", "ff", "ss", "zz", "ll"
]);

export function segmentTaughtGraphemes(word, taught = []) {
  const clean = String(word || "").toLowerCase();
  const allowed = new Set([...taught].map(item => String(item || "").toLowerCase()));
  const result = [];
  for (let index = 0; index < clean.length;) {
    const pair = clean.slice(index, index + 2);
    if (MULTI_LETTER_GRAPHEMES.includes(pair) && allowed.has(pair)) {
      result.push(pair);
      index += 2;
    } else {
      result.push(clean[index]);
      index += 1;
    }
  }
  return result;
}

export function scoreCycleQuest(firstAttempts, total) {
  const expected = Math.max(0, Number(total) || 0);
  const attempts = Array.isArray(firstAttempts) ? firstAttempts.slice(0, expected) : [];
  if (
    expected === 0
    || attempts.length < expected
    || attempts.some(attempt => typeof attempt !== "boolean")
  ) return 0;
  const independent = attempts.filter(Boolean).length;
  if (independent === expected) return 3;
  if (independent / expected >= 0.7) return 2;
  return 1;
}
