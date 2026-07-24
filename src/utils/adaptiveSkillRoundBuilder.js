import { createSeededRandom, shuffleItems } from "./adaptiveRoundBuilder.js";

export function buildAdaptiveSkillRound({
  candidates = [],
  targetOrder = [],
  usedTargetWordsByTarget = {},
  avoidQuestionIds = [],
  avoidTargetWords = [],
  roundLength = 15,
  seed = Date.now()
} = {}) {
  const random = createSeededRandom(seed);
  const selected = [];
  const selectedTargets = new Set();
  const selectedWords = new Set();
  const recentQuestionIds = new Set(avoidQuestionIds.map(id => String(id || "")).filter(Boolean));
  const recentTargetWords = new Set(
    avoidTargetWords.map(word => String(word || "").toLowerCase()).filter(Boolean)
  );
  const previouslyUsedWords = new Set(
    Object.values(usedTargetWordsByTarget)
      .flat()
      .map(word => String(word || "").toLowerCase())
      .filter(Boolean)
  );
  const candidatesByTarget = candidates.reduce((groups, item) => {
    groups[item.target] = [...(groups[item.target] || []), item];
    return groups;
  }, {});

  function chooseForTarget(target, allowPreviousUse = false) {
    const items = shuffleItems(candidatesByTarget[target] || [], random);
    const usedWords = new Set((usedTargetWordsByTarget[target] || []).map(word => String(word).toLowerCase()));
    return items.find(item => {
      const word = String(item.targetWord || "").toLowerCase();
      return (
        !usedWords.has(word) &&
        !previouslyUsedWords.has(word) &&
        !recentTargetWords.has(word) &&
        !recentQuestionIds.has(String(item.id || "")) &&
        !selectedWords.has(word)
      );
    }) || (allowPreviousUse
      ? items.find(item => {
        const word = String(item.targetWord || "").toLowerCase();
        return (
          !selectedWords.has(word) &&
          !recentTargetWords.has(word) &&
          !recentQuestionIds.has(String(item.id || ""))
        );
      }) || items.find(item => !selectedWords.has(String(item.targetWord || "").toLowerCase()))
      : null);
  }

  for (const target of targetOrder) {
    if (selected.length >= roundLength) break;
    if (selectedTargets.has(target)) continue;
    const item = chooseForTarget(target);
    if (!item) continue;
    selected.push(item);
    selectedTargets.add(target);
    if (item.targetWord) selectedWords.add(String(item.targetWord).toLowerCase());
  }

  if (selected.length < roundLength) {
    for (const target of targetOrder) {
      if (selected.length >= roundLength) break;
      if (selectedTargets.has(target)) continue;
      const item = chooseForTarget(target, true);
      if (!item || selected.some(existing => existing.id === item.id)) continue;
      selected.push(item);
      selectedTargets.add(target);
      if (item.targetWord) selectedWords.add(String(item.targetWord).toLowerCase());
    }
  }

  if (selected.length < roundLength) {
    for (const item of shuffleItems(candidates, random)) {
      if (selected.length >= roundLength) break;
      if (selected.some(existing => existing.id === item.id)) continue;
      const word = String(item.targetWord || "").toLowerCase();
      if (
        recentQuestionIds.has(String(item.id || "")) ||
        (word && (
          selectedWords.has(word) ||
          previouslyUsedWords.has(word) ||
          recentTargetWords.has(word)
        ))
      ) continue;
      selected.push(item);
      if (item.target) selectedTargets.add(item.target);
      if (word) selectedWords.add(word);
    }
  }

  if (selected.length < roundLength) {
    for (const item of shuffleItems(candidates, random)) {
      if (selected.length >= roundLength) break;
      if (selected.some(existing => existing.id === item.id)) continue;
      const word = String(item.targetWord || "").toLowerCase();
      if (word && selectedWords.has(word)) continue;
      selected.push(item);
      if (item.target) selectedTargets.add(item.target);
      if (word) selectedWords.add(word);
    }
  }

  return {
    items: selected.slice(0, roundLength),
    selectedTargets: [...selectedTargets],
    selectedTargetWords: [...selectedWords]
  };
}
