import fs from "node:fs";
import path from "node:path";

import {
  HFW_FORMATS_BY_PHASE,
  hfwPhaseKey
} from "../src/data/hfwAssessmentFormatConfig.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  hfwAssessmentImageVariants
} from "../src/data/generated/assessmentImageVariants.generated.js";
import {
  hfwCuratedSentences
} from "../src/data/generated/hfwCuratedSentences.generated.js";
import {
  getMultiplePlausibleHfwAnswerIssues,
  normalizeHfwSentenceFrame,
  normalizeHfwText
} from "../src/data/hfwQualityRules.js";
import {
  hfwQuestionReviewBlockedContentKeys,
  hfwQuestionReviewBlockedIds,
  hfwQuestionReviewBlockedSentenceFrames
} from "../src/data/generated/hfwQuestionReviewBlocklist.generated.js";

const outputPath = path.join("src", "data", "generated", "hfwAssessmentQuestions.generated.js");

const ambiguityGroups = [
  ["come", "go"],
  ["look", "see"],
  ["make", "do"],
  ["said", "say"],
  ["has", "have"],
  ["a", "an", "the"],
  ["this", "that", "it"],
  ["my", "your", "his", "her", "our", "their"],
  ["is", "are", "was", "were"],
  ["to", "in", "on", "of", "for", "with", "by", "into", "out", "over", "around", "before", "after"]
];

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value = "") {
  return normalizeWord(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function deterministicHash(value = "") {
  return Array.from(String(value)).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function phaseFromSentence(row = {}) {
  if (Number(row.level) && Number(row.phase)) {
    return {
      level: Number(row.level) >= 2 ? 2 : 1,
      phase: Number(row.phase) === 2 ? 2 : 1
    };
  }
  const number = Number(row.sentenceNumber) || 1;
  if (number <= 5) return { level: 1, phase: 1 };
  if (number <= 10) return { level: 1, phase: 2 };
  if (number <= 15) return { level: 2, phase: 1 };
  return { level: 2, phase: 2 };
}

function forbiddenDistractors(target, sentence = "") {
  const forbidden = new Set([target]);
  const sentenceWords = new Set(normalizeWord(sentence).split(/\s+/).filter(Boolean));
  for (const word of sentenceWords) forbidden.add(word);
  const group = ambiguityGroups.find(words => words.includes(target));
  if (group) {
    for (const word of group) forbidden.add(word);
  }
  return forbidden;
}

function optionObjects(values, target) {
  return values.map(value => ({
    label: value,
    value,
    text: value,
    word: value,
    correct: value === target
  }));
}

function answerOptions({ target, bandWords, sentence = "", seed = 0 }) {
  const forbidden = forbiddenDistractors(target, sentence);
  const ranked = bandWords
    .map(normalizeWord)
    .filter(Boolean)
    .filter(word => !forbidden.has(word))
    .map(word => ({
      word,
      sort: (word.charCodeAt(0) * 17 + word.length * 7 + seed) % 101
    }))
    .sort((a, b) => a.sort - b.sort || a.word.localeCompare(b.word))
    .map(item => item.word);
  const selected = [];
  for (const word of ranked) {
    const trialQuestion = {
      answer: target,
      targetWord: target,
      sentence,
      answerOptions: [target, ...selected, word]
    };
    if (!selected.includes(word) && !getMultiplePlausibleHfwAnswerIssues(trialQuestion).length) {
      selected.push(word);
    }
    if (selected.length === 3) break;
  }
  const fallbackWords = bandWords.map(normalizeWord).filter(word => word && word !== target && !selected.includes(word) && !forbidden.has(word));
  for (const word of fallbackWords) {
    if (selected.length >= 3) break;
    selected.push(word);
  }
  const values = [target, ...selected].slice(0, 4);
  const rotateBy = Math.abs(seed) % values.length;
  return optionObjects([...values.slice(rotateBy), ...values.slice(0, rotateBy)], target);
}

function buildLetterTiles(word, seed = 0) {
  const alphabet = "etaoinshrdlucmfwypvbgkqjxz";
  const targetLetters = String(word || "").toLowerCase().replace(/[^a-z]/g, "").split("");
  const tiles = [...targetLetters];
  let index = Math.abs(Number(seed) || 0);
  while (tiles.length < 12) {
    tiles.push(alphabet[index % alphabet.length]);
    index += 5;
  }
  return tiles
    .map((letter, tileIndex) => ({ letter, sortKey: (tileIndex * 7 + seed) % 17 }))
    .sort((a, b) => a.sortKey - b.sortKey || a.letter.localeCompare(b.letter))
    .map(item => item.letter);
}

function imagePathFor({ skillId, target, level, phase, seed }) {
  const phaseKey = `l${level}p${phase}`;
  const paths = hfwAssessmentImageVariants[skillId]?.[target]?.[phaseKey] || [];
  if (!paths.length) return "";
  return paths[Math.abs(seed) % paths.length];
}

function reviewContentKey({ target, format, sentence, options = [], imagePath = "" }) {
  return [
    target,
    String(format || "").toUpperCase(),
    normalizeHfwText(sentence),
    target,
    options.map(option => normalizeWord(option.value || option)).sort().join("|"),
    imagePath
  ].filter(Boolean).join("::");
}

function isBlockedByTeacherReview({ id, target, format, sentence, options = [], imagePath = "" }) {
  if (hfwQuestionReviewBlockedIds.has(id)) return true;
  if (hfwQuestionReviewBlockedSentenceFrames.has(`${target}::${normalizeHfwSentenceFrame(sentence)}`)) return true;
  return hfwQuestionReviewBlockedContentKeys.has(reviewContentKey({
    target,
    format,
    sentence,
    options,
    imagePath
  }));
}

function questionForSentence(row, index, ordinalInTargetPhase = 0) {
  const target = normalizeWord(row.targetWord);
  const skillId = row.skillId;
  const bandWords = HFW_WORD_BANDS[skillId] || [];
  if (!target || !skillId || !bandWords.includes(target)) return null;
  const { level, phase } = phaseFromSentence(row);
  const isSpell = level >= 2;
  const phaseKeyValue = hfwPhaseKey(level, phase);
  const formats = HFW_FORMATS_BY_PHASE[phaseKeyValue] || [];
  const seed = Number(row.sentenceNumber || row.sourceRow || index + 1);
  const formatSeed = deterministicHash(`${skillId}:${target}:${phaseKeyValue}`) + ordinalInTargetPhase;
  const format = formats[Math.abs(formatSeed) % Math.max(formats.length, 1)] || `HFW_SENTENCE_${isSpell ? "SPELL" : "CLOZE"}_${phaseKeyValue}_01`;
  const id = `hfw_curated_${skillId}_${slug(target)}_${phaseKeyValue.toLowerCase()}_${String(seed).padStart(3, "0")}`;
  const sentence = String(row.sentenceWithBlank || "").trim();
  const fullSentence = String(row.fullSentence || "").trim();
  const imagePath = imagePathFor({ skillId, target, level, phase, seed });
  const common = {
    id,
    skillId,
    assessmentSkillId: skillId,
    skillName: `High-Frequency Words ${skillId.replace("hfw_", "").replace("_", "-")}`,
    level,
    phase,
    difficultyLevel: level,
    itemType: "sight_word",
    disableAudio: true,
    noAudio: true,
    itemKey: `${target}_${row.sentenceId}`,
    targetWord: target,
    answer: target,
    correctAnswer: target,
    imagePath,
    imageUrl: imagePath,
    mediaTarget: `hfw-curated:${skillId}:${target}:${row.sentenceId}`,
    source: "workbook_curated",
    approvedSource: "workbook",
    sentenceId: row.sentenceId,
    curatedContentKey: row.contentKey,
    sourceSheet: row.sourceSheet,
    sourceRow: row.sourceRow,
    formatType: format,
    templateType: format
  };

  if (!sentence || !fullSentence || (sentence.match(/___/g) || []).length !== 1) return null;

  if (isSpell) {
    if (isBlockedByTeacherReview({ id, target, format, sentence, options: [], imagePath })) return null;
    const tiles = buildLetterTiles(target, seed);
    const prompt = "Listen to the sentence. Spell the word that fits.";
    return {
      ...common,
      questionType: "hfw_sentence_spell",
      prompt,
      question: prompt,
      context: sentence,
      sentence,
      visibleSentenceWithBlank: sentence,
      sentenceText: fullSentence,
      fullSentence,
      spokenPrompt: fullSentence,
      sentenceAudio: fullSentence,
      audioText: fullSentence,
      correctLetterSequence: target.split(""),
      letterTiles: tiles,
      soundTiles: tiles,
      distractorLetters: tiles.filter((letter, tileIndex) => !target[tileIndex] || letter !== target[tileIndex])
    };
  }

  const options = answerOptions({ target, bandWords, sentence, seed });
  if (options.length !== 4) return null;
  if (isBlockedByTeacherReview({ id, target, format, sentence, options, imagePath })) return null;
  const prompt = phase === 2
    ? "Read the sentence. Choose the word that fits."
    : "Choose the word that completes the sentence.";
  return {
    ...common,
    questionType: "multiple_choice",
    prompt,
    question: prompt,
    sentence,
    visibleSentenceWithBlank: sentence,
    fullSentence,
    context: sentence,
    choices: options.map(option => option.value),
    answerOptions: options,
    options
  };
}

function generateQuestions() {
  const counters = new Map();
  return hfwCuratedSentences
    .map((row, index) => {
      const target = normalizeWord(row.targetWord);
      const { level, phase } = phaseFromSentence(row);
      const phaseKeyValue = hfwPhaseKey(level, phase);
      const counterKey = `${row.skillId}:${target}:${phaseKeyValue}`;
      const ordinal = counters.get(counterKey) || 0;
      counters.set(counterKey, ordinal + 1);
      return questionForSentence(row, index, ordinal);
    })
    .filter(Boolean);
}

const questions = generateQuestions();
fs.writeFileSync(outputPath, `// Generated by tools/generateHfwAssessmentQuestions.js from hfwCuratedSentences.generated.js. Do not hand-edit.\n\nexport const hfwAssessmentQuestions = ${JSON.stringify(questions, null, 2)};\n`);
console.log(JSON.stringify({
  generated: outputPath,
  source: "src/data/generated/hfwCuratedSentences.generated.js",
  questions: questions.length,
  bySkill: Object.fromEntries(Object.keys(HFW_WORD_BANDS).map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId).length
  ])),
  clozeBySkill: Object.fromEntries(Object.keys(HFW_WORD_BANDS).map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId && question.questionType === "multiple_choice").length
  ]))
}, null, 2));
