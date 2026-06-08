import { getChildWordAsset } from "./childAssets.js";
import { getRhymeGroup, rhymeGroups } from "./rhymeGroups.js";

function normalizeWord(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "").trim();
}

function firstVowel(word = "") {
  return normalizeWord(word).match(/[aeiou]/)?.[0] || "";
}

function wordRime(word = "") {
  const value = normalizeWord(word);
  const index = value.search(/[aeiou]/);
  return index === -1 ? value.slice(1) : value.slice(index);
}

function hasWordImage(word) {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image || asset?.fallbackImage);
}

function rotate(items = [], start = 0) {
  if (!items.length) return [];
  const safeStart = Math.abs(start) % items.length;
  return items.slice(safeStart).concat(items.slice(0, safeStart));
}

function groupCandidatesByFamily(candidates = []) {
  const grouped = new Map();
  candidates.forEach(candidate => {
    const items = grouped.get(candidate.family) || [];
    items.push(candidate);
    grouped.set(candidate.family, items);
  });
  return [...grouped.entries()]
    .map(([family, items]) => ({
      family,
      items: items.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word)),
      score: Math.max(...items.map(item => item.score))
    }))
    .sort((a, b) => b.score - a.score || a.family.localeCompare(b.family));
}

function optionWords(question = {}) {
  return [
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : [])
  ]
    .map(option => normalizeWord(option?.value || option?.word || option?.label || option))
    .filter(Boolean);
}

export function buildRhymingDistractors({
  targetWord = "",
  answer = "",
  family = "",
  count = 3,
  variantIndex = 0,
  requireImages = false,
  exclude = []
} = {}) {
  const target = normalizeWord(targetWord);
  const correct = normalizeWord(answer);
  const targetFamily = family || getRhymeGroup(target) || getRhymeGroup(correct);
  if (!targetFamily) return [];

  const targetLength = target.length || correct.length || targetFamily.length + 1;
  const targetVowel = firstVowel(target || targetFamily);
  const blocked = new Set([target, correct, ...exclude.map(normalizeWord)].filter(Boolean));
  const selected = [];
  const usedFamilies = new Set();
  const usedInitials = new Set();

  const candidates = Object.entries(rhymeGroups)
    .filter(([candidateFamily]) => candidateFamily !== targetFamily)
    .flatMap(([candidateFamily, words]) =>
      words
        .map(word => normalizeWord(word))
        .filter(word => word && !blocked.has(word))
        .filter(word => !requireImages || hasWordImage(word))
        .map(word => ({
          word,
          family: candidateFamily,
          score:
            (Math.abs(word.length - targetLength) === 0 ? 40 : 0) +
            (Math.abs(word.length - targetLength) === 1 ? 22 : 0) +
            (firstVowel(word) === targetVowel ? 18 : 0) +
            (word.length <= 4 ? 8 : 0) +
            (wordRime(word).length === wordRime(target || correct).length ? 4 : 0)
        }))
    )
    .sort((a, b) =>
      b.score - a.score ||
      a.family.localeCompare(b.family) ||
      a.word.localeCompare(b.word)
    );
  const bestScore = candidates[0]?.score || 0;
  const exactCandidates = candidates.filter(candidate => candidate.score === bestScore);
  const primaryCandidates = exactCandidates.length >= count
    ? exactCandidates
    : candidates.filter(candidate => candidate.score >= bestScore - 22);
  const primaryGroups = rotate(groupCandidatesByFamily(primaryCandidates), variantIndex);

  for (const [groupIndex, group] of primaryGroups.entries()) {
    if (selected.length >= count) break;
    const candidate = rotate(group.items, variantIndex + groupIndex)[0];
    if (selected.includes(candidate.word)) continue;
    if (usedInitials.has(candidate.word[0]) && selected.length + 1 < count) continue;
    selected.push(candidate.word);
    usedFamilies.add(candidate.family);
    usedInitials.add(candidate.word[0]);
  }

  for (const candidate of primaryCandidates.concat(candidates)) {
    if (selected.length >= count) break;
    if (usedFamilies.has(candidate.family) && selected.length + 1 < count) continue;
    if (!selected.includes(candidate.word)) selected.push(candidate.word);
  }

  return selected.slice(0, count);
}

export function normalizeRhymingQuestionChoices(question = {}) {
  const formatType = String(question.formatType || question.templateType || "").toUpperCase();
  const isFindRhyme = formatType === "READ_FIND_RHYME" || formatType === "LISTEN_FIND_RHYME";
  const skillId = String(question.skillId || question.assessmentSkillId || question.skill || "").toLowerCase();
  if (!isFindRhyme || !skillId.includes("rhym")) return question;

  const targetWord = normalizeWord(question.targetWord);
  const answer = normalizeWord(question.answer || question.correctAnswer);
  const family = question.itemKey || question.phonicsPattern || question.targetSound || "";
  const answerFamily = getRhymeGroup(answer);
  const targetFamily = family || getRhymeGroup(targetWord);
  if (!targetWord || !answer || !targetFamily || answerFamily !== targetFamily) return question;

  const distractors = buildRhymingDistractors({
    targetWord,
    answer,
    family: targetFamily,
    count: 3,
    variantIndex: question._sourceIndex || 0,
    exclude: optionWords(question)
  });
  if (distractors.length < 3) return question;

  const choices = [answer, ...distractors];
  return {
    ...question,
    answer,
    correctAnswer: question.correctAnswer || answer,
    choices,
    answerOptions: choices
  };
}
