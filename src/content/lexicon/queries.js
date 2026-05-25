import { masterWordLexicon, getLexiconEntry } from "./masterWordLexicon.js";
import { normalizeLexiconWord } from "../../utils/phonics/phonicsHeuristics.js";

function by(predicate) {
  return masterWordLexicon.filter(entry => entry.active !== false && predicate(entry));
}

export function getWordsByInitialSound(sound) {
  const normalized = normalizeLexiconWord(sound);
  return by(entry => entry.initialSound === normalized);
}

export function getWordsByFinalSound(sound) {
  const normalized = normalizeLexiconWord(sound);
  return by(entry => entry.finalSound === normalized);
}

export function getWordsWithShortVowel(vowel) {
  const normalized = normalizeLexiconWord(vowel);
  return by(entry =>
    entry.medialVowel === normalized &&
    entry.phonicsTags.includes("short-vowel-cvc")
  );
}

export function getWordsWithDigraph(digraph) {
  const normalized = normalizeLexiconWord(digraph);
  return by(entry =>
    entry.initialSound === normalized ||
    entry.finalSound === normalized ||
    entry.lowercaseWord.includes(normalized)
  );
}

export function getRhymingWords(wordOrRime) {
  const normalized = normalizeLexiconWord(wordOrRime);
  const base = getLexiconEntry(normalized);
  const rime = base?.rime || normalized;
  return by(entry => entry.rime === rime && entry.lowercaseWord !== normalized);
}

export function getMinimalPairs(word) {
  const base = getLexiconEntry(word);
  if (!base) return [];
  return by(entry =>
    entry.lowercaseWord !== base.lowercaseWord &&
    entry.lowercaseWord.length === base.lowercaseWord.length &&
    [...entry.lowercaseWord].filter((letter, index) => letter !== base.lowercaseWord[index]).length === 1
  );
}

export function getDecodableWordsForSkill(skillId) {
  const normalizedSkill = String(skillId || "").replace(/_/g, "-");
  return by(entry => entry.skillTags.includes(normalizedSkill));
}
