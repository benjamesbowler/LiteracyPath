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

function exactIndexPermutation(order, length) {
  return Array.isArray(order)
    && order.length === length
    && order.every(index => Number.isInteger(index) && index >= 0 && index < length)
    && new Set(order).size === length;
}

function sameVisibleOrder(values, order, comparison) {
  return order.every((sourceIndex, visibleIndex) => (
    values[sourceIndex] === comparison[visibleIndex]
  ));
}

// Keep authored tile instances stable while preventing their visual bank from
// becoming an answer key. A seeded caller supplies the proposed permutation;
// pair swaps provide a deterministic safety net if it happens to be identity
// (or the fixed reverse traversal that previously solved every Sound Box).
export function constrainedIndexOrder(values = [], proposedOrder = [], options = {}) {
  const items = Array.isArray(values) ? values : [];
  const identity = items.map((_, index) => index);
  const proposed = exactIndexPermutation(proposedOrder, items.length)
    ? [...proposedOrder]
    : identity;
  if (items.length < 2) return proposed;

  const candidates = [proposed];
  for (let left = 0; left < proposed.length - 1; left += 1) {
    for (let right = left + 1; right < proposed.length; right += 1) {
      const candidate = [...proposed];
      [candidate[left], candidate[right]] = [candidate[right], candidate[left]];
      candidates.push(candidate);
    }
  }

  const reversed = [...items].reverse();
  const isNonIdentity = order => !sameVisibleOrder(items, order, items);
  if (options.avoidReverse) {
    const nonFixed = candidates.find(order => (
      isNonIdentity(order) && !sameVisibleOrder(items, order, reversed)
    ));
    if (nonFixed) return nonFixed;
  }
  return candidates.find(isNonIdentity) || proposed;
}

export function seededIndexOrder(length, seedText) {
  const size = Math.max(0, Math.floor(Number(length) || 0));
  const order = Array.from({ length: size }, (_, index) => index);
  let seed = 2166136261;
  for (const character of String(seedText || "")) {
    seed ^= character.codePointAt(0);
    seed = Math.imul(seed, 16777619);
  }
  for (let index = order.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
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
