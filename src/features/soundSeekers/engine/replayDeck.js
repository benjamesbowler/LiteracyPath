const REPLAY_VARIANT_FIELDS = Object.freeze([
  "contentId",
  "candidatePositions",
  "routeId",
  "recipientId",
  "setPieceVariant"
]);
const REPLAY_VARIANT_FIELD_SET = new Set(REPLAY_VARIANT_FIELDS);

function cloneAndFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreeze));
  if (value && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneAndFreeze(item)])));
  }
  return value;
}

function hashSeed(seed) {
  let value = seed | 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
}

function permutation(length, seed) {
  const result = Array.from({ length }, (_, index) => index);
  let state = hashSeed(seed);
  for (let index = length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function validateDeck(deck) {
  if (!deck || typeof deck !== "object" || Array.isArray(deck)) throw new Error("replay deck is required");
  if (typeof deck.targetId !== "string" || !deck.targetId.trim()) throw new Error("replay target is required");
  if (!deck.pronunciation || typeof deck.pronunciation !== "object" || Array.isArray(deck.pronunciation)) {
    throw new Error("replay pronunciation is required");
  }
  if (!Array.isArray(deck.variants) || deck.variants.length === 0) throw new Error("replay variants are required");
  for (const variant of deck.variants) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) throw new Error("replay variant must be an object");
    for (const key of Object.keys(variant)) {
      if (!REPLAY_VARIANT_FIELD_SET.has(key)) throw new Error(`${key} is not an audited replay field`);
    }
    for (const key of REPLAY_VARIANT_FIELDS) {
      if (!Object.hasOwn(variant, key)) throw new Error(`replay variant is missing audited replay field ${key}`);
    }
    if (!Array.isArray(variant.candidatePositions)) throw new Error("candidatePositions must be an array");
  }
}

export function createReplayVariant(deck, seed, replayOrdinal) {
  validateDeck(deck);
  if (!Number.isInteger(seed)) throw new Error("replay needs an integer seed");
  if (!Number.isInteger(replayOrdinal) || replayOrdinal < 0) throw new Error("replay ordinal must be a non-negative integer");
  const order = permutation(deck.variants.length, seed);
  const selected = deck.variants[order[replayOrdinal % order.length]];
  return cloneAndFreeze({
    targetId: deck.targetId,
    pronunciation: deck.pronunciation,
    ...Object.fromEntries(REPLAY_VARIANT_FIELDS.map(key => [key, selected[key]]))
  });
}
