import fs from "node:fs";
import path from "node:path";

import { hfwApprovedQuestionBank } from "../src/data/generated/hfwApprovedQuestionBank.generated.js";
import {
  getMultiplePlausibleHfwAnswerIssues,
  getWeakGenericHfwPromptIssues
} from "../src/data/hfwQualityRules.js";

const outputPath = path.join("src", "data", "generated", "hfwAssessmentQuestions.generated.js");
const strictRuntimeRejectPattern = /Tap the word|Find the word|Which word says|When the train slowed|When the ball bounced|before snack|with a smile|may choose a book|truck stopped by the gate/i;

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function skillLabel(skillId = "") {
  return `High-Frequency Words ${String(skillId).replace("hfw_", "").replace("_", "-")}`;
}

function optionObjects(values = [], target = "") {
  return values.map(value => ({
    label: value,
    value,
    text: value,
    word: value,
    correct: value === target
  }));
}

function hasUsableLetterTiles(row = {}) {
  const available = (row.letterTiles || []).reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
  for (const letter of String(row.targetWord || "").split("")) {
    if (!available[letter]) return false;
    available[letter] -= 1;
  }
  return true;
}

function commonFields(row = {}) {
  return {
    id: row.questionId,
    questionId: row.questionId,
    approvedQuestionId: row.questionId,
    skillId: row.skillId,
    assessmentSkillId: row.skillId,
    skillName: skillLabel(row.skillId),
    band: row.band,
    level: row.level,
    phase: row.phase,
    difficultyLevel: row.level,
    itemType: "sight_word",
    disableAudio: true,
    noAudio: true,
    imageRequired: false,
    imagePolicy: row.imagePolicy,
    hfwImagePolicy: row.imagePolicy === "no_image" ? "none" : row.imagePolicy,
    targetWord: row.targetWord,
    answer: row.correctAnswer,
    correctAnswer: row.correctAnswer,
    itemKey: `${row.targetWord}_${row.questionId}`,
    mediaTarget: `approved-hfw:${row.questionId}`,
    source: "approved_hfw_workbook",
    approvedSource: "approved_hfw_workbook",
    sourceWorkbook: row.sourceWorkbook,
    sourceSheet: row.sourceSheet,
    sourceRow: row.sourceRow,
    sourceStatus: row.sourceStatus,
    fullSentence: row.fullSentence,
    sentenceText: row.fullSentence,
    sentence: row.sentenceWithBlank,
    visibleSentenceWithBlank: row.sentenceWithBlank,
    context: row.sentenceWithBlank,
    approvedContentKey: row.contentKey,
    contentKey: row.contentKey,
    workbookContentKey: row.workbookContentKey,
    templateKey: row.templateKey,
    runtimeTemplateKey: row.templateKey,
    formatType: row.templateKey,
    templateType: row.templateKey,
    imagePrompt: row.imagePrompt,
    cartoonImageNeeded: row.cartoonImageNeeded,
    workbookImagePolicy: row.workbookImagePolicy,
    imageUseRule: row.imageUseRule
  };
}

function questionForApprovedRow(row = {}) {
  const target = normalizeWord(row.targetWord);
  if (!row.questionId || !target || row.correctAnswer !== target) return null;
  if (!row.fullSentence || !row.sentenceWithBlank || (row.sentenceWithBlank.match(/___/g) || []).length !== 1) return null;
  if (strictRuntimeRejectPattern.test([
    row.prompt,
    row.sentenceWithBlank,
    row.fullSentence
  ].filter(Boolean).join(" "))) return null;

  const common = commonFields(row);
  if (row.level === 2 || row.questionType === "hfw_sentence_spell") {
    if (!hasUsableLetterTiles(row)) return null;
    const prompt = row.prompt || "Listen to the sentence. Spell the missing word.";
    return {
      ...common,
      questionType: "hfw_sentence_spell",
      prompt,
      question: prompt,
      spokenPrompt: row.fullSentence,
      sentenceAudio: row.fullSentence,
      audioText: row.fullSentence,
      letterTiles: row.letterTiles,
      soundTiles: row.letterTiles,
      correctLetterSequence: row.correctLetterSequence,
      distractorLetters: row.letterTiles.filter(letter => !row.correctLetterSequence.includes(letter))
    };
  }

  const options = row.answerChoices || [];
  if (options.length !== 4 || !options.includes(target)) return null;
  const prompt = row.prompt || "Read the sentence. Choose the word that fits.";
  const trialQuestion = {
    ...common,
    source: "approved_hfw_workbook",
    approvedSource: "approved_hfw_workbook",
    answerOptions: options,
    options,
    choices: options
  };
  if (getMultiplePlausibleHfwAnswerIssues(trialQuestion).length) return null;
  if (getWeakGenericHfwPromptIssues(trialQuestion).length) return null;
  return {
    ...common,
    questionType: "multiple_choice",
    prompt,
    question: prompt,
    choices: options,
    answerOptions: optionObjects(options, target),
    options: optionObjects(options, target)
  };
}

const questions = hfwApprovedQuestionBank
  .map(questionForApprovedRow)
  .filter(Boolean);

fs.writeFileSync(
  outputPath,
  `// Generated by tools/generateHfwAssessmentQuestions.js from hfwApprovedQuestionBank.generated.js. Do not hand-edit.\n\nexport const hfwAssessmentQuestions = ${JSON.stringify(questions, null, 2)};\n`
);

const skillIds = [...new Set(hfwApprovedQuestionBank.map(row => row.skillId))].sort();
console.log(JSON.stringify({
  generated: outputPath,
  source: "src/data/generated/hfwApprovedQuestionBank.generated.js",
  approvedRows: hfwApprovedQuestionBank.length,
  questions: questions.length,
  rejectedRows: hfwApprovedQuestionBank.length - questions.length,
  bySkill: Object.fromEntries(skillIds.map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId).length
  ])),
  level1BySkill: Object.fromEntries(skillIds.map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId && question.level === 1).length
  ])),
  level2BySkill: Object.fromEntries(skillIds.map(skillId => [
    skillId,
    questions.filter(question => question.skillId === skillId && question.level === 2).length
  ]))
}, null, 2));
