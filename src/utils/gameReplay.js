// A run owns its randomness. Checkpoints retain the seed; a fresh outing gets
// a new one. Pure generators can still reproduce the original deck with seed 0.
export function newGameSeed(previous = 0, random = Math.random) {
  const candidate = Math.floor(random() * 0xffffffff) >>> 0;
  return candidate && candidate !== previous ? candidate : ((previous + 1) >>> 0) || 1;
}

export function gameRandom(seed) {
  let state = 2166136261;
  for (const character of String(seed)) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function replayShuffle(items, seed = 0) {
  const result = [...items];
  if (seed === 0 || seed == null) return result;
  const random = gameRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// Preserve the authored difficulty ramp while varying equally demanding words.
export function replayWithinBands(items, seed, bandFor) {
  if (!seed) return [...items];
  const bands = new Map();
  items.forEach(item => {
    const key = bandFor(item);
    bands.set(key, [...(bands.get(key) || []), item]);
  });
  for (const [key, band] of bands) bands.set(key, replayShuffle(band, `${seed}:${key}`));
  return items.map(item => bands.get(bandFor(item)).shift());
}
