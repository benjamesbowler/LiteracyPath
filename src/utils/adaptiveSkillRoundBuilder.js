import { createSeededRandom, shuffleItems } from "./adaptiveRoundBuilder.js";

export function buildAdaptiveSkillRound({
  candidates = [],
  targetOrder = [],
  usedTargetWordsByTarget = {},
  roundLength = 15,
  seed = Date.now()
} = {}) {
  const random = createSeededRandom(seed);
  const selected = [];
  const selectedTargets = new Set();
  const selectedWords = new Set();
  const candidatesByTarget = candidates.reduce((groups, item) => {
    groups[item.target] = [...(groups[item.target] || []), item];
    return groups;
  }, {});

  function chooseForTarget(target) {
    const items = shuffleItems(candidatesByTarget[target] || [], random);
    const usedWords = new Set((usedTargetWordsByTarget[target] || []).map(word => String(word).toLowerCase()));
    return items.find(item => !usedWords.has(String(item.targetWord || "").toLowerCase()) && !selectedWords.has(item.targetWord)) ||
      items.find(item => !selectedWords.has(item.targetWord)) ||
      null;
  }

  for (const target of targetOrder) {
    if (selected.length >= roundLength) break;
    if (selectedTargets.has(target)) continue;
    const item = chooseForTarget(target);
    if (!item) continue;
    selected.push(item);
    selectedTargets.add(target);
    if (item.targetWord) selectedWords.add(item.targetWord);
  }

  if (selected.length < roundLength) {
    for (const item of shuffleItems(candidates, random)) {
      if (selected.length >= roundLength) break;
      if (selected.some(existing => existing.id === item.id)) continue;
      if (item.targetWord && selectedWords.has(item.targetWord)) continue;
      selected.push(item);
      if (item.target) selectedTargets.add(item.target);
      if (item.targetWord) selectedWords.add(item.targetWord);
    }
  }

  return {
    items: selected.slice(0, roundLength),
    selectedTargets: [...selectedTargets],
    selectedTargetWords: [...selectedWords]
  };
}
