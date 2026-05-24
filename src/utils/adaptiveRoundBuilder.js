export function createSeededRandom(seed = Date.now()) {
  let value = Number(seed) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function shuffleItems(items, random = Math.random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter(item => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildAdaptiveRound({
  candidates,
  roundLength,
  random = Math.random,
  itemKey = item => item.itemKey || item.letter,
  targetKey = item => item.targetWord,
  canRepeatItemKey = false,
  preserveCandidateOrder = false
}) {
  const selected = [];
  const selectedTargets = new Set();
  const selectedItemKeys = new Set();

  const ordered = preserveCandidateOrder ? [...candidates] : shuffleItems(candidates, random);

  function tryAdd(candidate, allowItemKeyRepeat = canRepeatItemKey) {
    if (selected.length >= roundLength) return false;
    const target = targetKey(candidate);
    const key = itemKey(candidate);
    if (target && selectedTargets.has(target)) return false;
    if (!allowItemKeyRepeat && key && selectedItemKeys.has(key)) return false;
    selected.push(candidate);
    if (target) selectedTargets.add(target);
    if (key) selectedItemKeys.add(key);
    return true;
  }

  ordered.forEach(candidate => tryAdd(candidate, false));

  if (selected.length < roundLength) {
    ordered.forEach(candidate => {
      if (selected.some(item => item.id === candidate.id)) return;
      tryAdd(candidate, true);
    });
  }

  return selected.slice(0, roundLength);
}
