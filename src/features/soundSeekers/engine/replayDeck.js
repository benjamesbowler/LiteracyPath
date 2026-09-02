const REPLAY_VARIANT_FIELDS = Object.freeze([
  "contentId",
  "candidatePositions",
  "routeId",
  "recipientId",
  "setPieceVariant"
]);
const REPLAY_VARIANT_FIELD_SET = new Set(REPLAY_VARIANT_FIELDS);
const REPLAY_ID_FIELDS = Object.freeze([
  "contentId", "routeId", "recipientId", "setPieceVariant"
]);
const FORBIDDEN_PRONUNCIATION_KEYS = /^(?:answer|answerKey|correct|expectedToken|isCorrect|optionTokens)$/u;

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

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertSafePronunciation(value, seen = new Set()) {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (!value.trim()) throw new Error("replay pronunciation strings must be nonempty");
    return;
  }
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (!value || typeof value !== "object" || seen.has(value)) {
    throw new Error("replay pronunciation must be recursively safe data");
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) assertSafePronunciation(item, seen);
    return;
  }
  if (!isPlainObject(value)) throw new Error("replay pronunciation must use plain records");
  for (const [key, item] of Object.entries(value)) {
    if (!key || FORBIDDEN_PRONUNCIATION_KEYS.test(key)) {
      throw new Error(`replay pronunciation contains unsafe field ${key || "(empty)"}`);
    }
    assertSafePronunciation(item, seen);
  }
}

function assertCandidatePermutation(positions, expectedLength) {
  if (!Array.isArray(positions) || positions.length < 2
    || (expectedLength !== null && positions.length !== expectedLength)
    || positions.some(position => !Number.isInteger(position) || position < 0)
    || new Set(positions).size !== positions.length
    || positions.some(position => position >= positions.length)) {
    throw new Error("replay candidate positions must be one complete integer position permutation");
  }
}

function validateDeck(deck) {
  if (!deck || typeof deck !== "object" || Array.isArray(deck)) throw new Error("replay deck is required");
  if (Object.keys(deck).length !== 3
    || !["targetId", "pronunciation", "variants"].every(key => Object.hasOwn(deck, key))) {
    throw new Error("replay deck must use the exact target, pronunciation, and variants schema");
  }
  if (typeof deck.targetId !== "string" || !deck.targetId.trim()) throw new Error("replay target id is required");
  if (!isPlainObject(deck.pronunciation) || Object.keys(deck.pronunciation).length === 0) {
    throw new Error("replay pronunciation is required");
  }
  assertSafePronunciation(deck.pronunciation);
  if (!Array.isArray(deck.variants) || deck.variants.length === 0) throw new Error("replay variants are required");
  const fingerprints = new Set();
  let positionCount = null;
  for (const variant of deck.variants) {
    if (!isPlainObject(variant)) throw new Error("replay variant must be an object");
    for (const key of Object.keys(variant)) {
      if (!REPLAY_VARIANT_FIELD_SET.has(key)) throw new Error(`${key} is not an audited replay field`);
    }
    for (const key of REPLAY_VARIANT_FIELDS) {
      if (!Object.hasOwn(variant, key)) throw new Error(`replay variant is missing audited replay field ${key}`);
    }
    for (const key of REPLAY_ID_FIELDS) {
      if (typeof variant[key] !== "string" || !variant[key].trim()) {
        throw new Error(`replay ${key} must be a nonempty primitive id`);
      }
    }
    assertCandidatePermutation(variant.candidatePositions, positionCount);
    positionCount ??= variant.candidatePositions.length;
    const fingerprint = JSON.stringify(REPLAY_VARIANT_FIELDS.map(key => variant[key]));
    if (fingerprints.has(fingerprint)) throw new Error("duplicate replay variant is not allowed");
    fingerprints.add(fingerprint);
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
