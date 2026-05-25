import { initialSoundWordBank } from "../initialSounds/initialSoundWordBank.js";
import { cvcShortVowelExpansionQuestions } from "../../data/cvcShortVowelExpansionQuestions.js";
import { finalSoundCoverageQuestions } from "../../data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../../data/rhymingCoverageQuestions.js";
import { initialSoundCoverageQuestions } from "../../data/initialSoundCoverageQuestions.js";
import { ixlStyleSeedQuestions } from "../../data/ixlStyleSeedQuestions.js";
import {
  inferFinalSound,
  inferInitialSound,
  inferMedialVowel,
  inferOnset,
  inferPhonicsTags,
  inferRime,
  inferSyllables,
  inferSyllableType,
  inferVowelPattern,
  inferWordDifficulty,
  makeWordId,
  normalizeLexiconWord
} from "../../utils/phonics/phonicsHeuristics.js";

const SOURCE_SETS = [
  { skillId: "initial_sounds", skillTag: "initial-sounds", items: initialSoundWordBank },
  { skillId: "initial_sounds", skillTag: "initial-sounds", items: initialSoundCoverageQuestions },
  { skillId: "final_sounds", skillTag: "ending-sounds", items: finalSoundCoverageQuestions },
  { skillId: "cvc_short_vowels", skillTag: "cvc-short-vowels", items: cvcShortVowelExpansionQuestions },
  { skillId: "rhyming", skillTag: "rhyming", items: rhymingCoverageQuestions },
  { skillId: "mixed_assessment", skillTag: "assessment-bank", items: ixlStyleSeedQuestions }
];

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanWordCandidate(value) {
  const normalized = normalizeLexiconWord(value);
  if (!normalized || normalized.length > 24) return "";
  if (!/[a-z]/u.test(normalized)) return "";
  return normalized;
}

function collectWordsFromQuestion(item = {}) {
  const candidates = [
    item.word,
    item.targetWord,
    item.promptWord,
    item.representedWord,
    item.audioText,
    item.spokenPrompt,
    item.correctAnswer,
    item.answer,
    item.diagnosticTarget
  ];

  toArray(item.answerOptions).forEach(option => {
    if (typeof option === "string") {
      candidates.push(option);
    } else if (option) {
      candidates.push(option.word, option.label, option.text, option.value, option.answer);
    }
  });

  toArray(item.choices).forEach(option => {
    if (typeof option === "string") {
      candidates.push(option);
    } else if (option) {
      candidates.push(option.word, option.label, option.text, option.value, option.answer);
    }
  });

  toArray(item.imageCards).forEach(card => {
    candidates.push(card?.word, card?.label, card?.text, card?.answer);
  });

  return [...new Set(candidates.map(cleanWordCandidate).filter(Boolean))];
}

function resolveImageUrl(item = {}) {
  return item.imageUrl || item.image || item.imagePath || item.picture || item.media?.image || "";
}

function resolveAudioUrl(item = {}) {
  return item.audioUrl || item.audio || item.audioPath || item.media?.audio || "";
}

function createEmptyEntry(word) {
  const lowercaseWord = normalizeLexiconWord(word);
  const compact = lowercaseWord.replace(/[\s-]/g, "");
  const rime = inferRime(compact);
  const phonicsTags = inferPhonicsTags(compact);

  return {
    id: `lex_${makeWordId(lowercaseWord)}`,
    word,
    lowercaseWord,
    skillTags: [],
    phonicsTags,
    initialSound: inferInitialSound(compact),
    finalSound: inferFinalSound(compact),
    medialVowel: inferMedialVowel(compact),
    rime,
    syllables: inferSyllables(compact),
    wordType: "word",
    difficulty: inferWordDifficulty(compact),
    level: null,
    imageKey: "",
    imageUrl: "",
    audioKey: "",
    audioUrl: "",
    qaStatus: "unreviewed",
    active: true,
    notes: "",
    onset: inferOnset(compact),
    rhymeFamily: rime,
    syllableType: inferSyllableType(compact),
    syllableStructure: "",
    vowelPattern: inferVowelPattern(compact),
    sourceQuestionIds: []
  };
}

function mergeSource(entry, item, source) {
  const skillTags = new Set(entry.skillTags);
  skillTags.add(source.skillTag);
  if (item.skillId) skillTags.add(String(item.skillId).replace(/_/g, "-"));
  if (item.skillName) skillTags.add(String(item.skillName).toLowerCase().replace(/\s+/g, "-"));

  const imageUrl = resolveImageUrl(item);
  const audioUrl = resolveAudioUrl(item);
  const sourceLevel = item.level ?? item.difficultyLevel ?? item.masteryLevel ?? null;

  return {
    ...entry,
    skillTags: [...skillTags].sort(),
    difficulty: entry.difficulty === "early" ? inferWordDifficulty(entry.lowercaseWord, sourceLevel) : entry.difficulty,
    level: entry.level ?? sourceLevel,
    imageKey: entry.imageKey || item.imageKey || "",
    imageUrl: entry.imageUrl || imageUrl,
    audioKey: entry.audioKey || item.audioKey || "",
    audioUrl: entry.audioUrl || audioUrl,
    qaStatus: item.qaStatus || entry.qaStatus,
    active: entry.active && item.active !== false,
    notes: [entry.notes, item.qaNotes, item.notes].filter(Boolean).join(" | "),
    sourceQuestionIds: [...new Set([...entry.sourceQuestionIds, item.id].filter(Boolean))]
  };
}

function buildMasterWordLexicon() {
  const entries = new Map();

  SOURCE_SETS.forEach(source => {
    source.items.forEach(item => {
      collectWordsFromQuestion(item).forEach(word => {
        const key = normalizeLexiconWord(word);
        const current = entries.get(key) || createEmptyEntry(word);
        entries.set(key, mergeSource(current, item, source));
      });
    });
  });

  return [...entries.values()].sort((a, b) => a.lowercaseWord.localeCompare(b.lowercaseWord));
}

export const masterWordLexicon = buildMasterWordLexicon();

export const masterWordLexiconByWord = new Map(
  masterWordLexicon.map(entry => [entry.lowercaseWord, entry])
);

export function getLexiconEntry(word) {
  return masterWordLexiconByWord.get(normalizeLexiconWord(word)) || null;
}
