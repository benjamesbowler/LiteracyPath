import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { skillTree } from "../src/skillTree.js";
import { questions } from "../src/questions.js";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../src/data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../src/data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../src/data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../src/data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../src/data/kimiDataset7RuntimeQuestions.js";
import { ixlStyleSeedQuestions } from "../src/data/ixlStyleSeedQuestions.js";
import { safeContentExpansionQuestions } from "../src/data/safeContentExpansionQuestions.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { questionBankExpansion8 } from "../src/data/questionBankExpansion8.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { enrichListenAndFindWordQuestion } from "../src/data/listenAndFindAssets.js";
import { enrichInitialSoundPairQuestion } from "../src/data/initialSoundPairAssets.js";
import { applyQuestionFormatMetadata } from "../src/questionFormatFramework.js";
import { getAssessmentContentIssues } from "../src/assessmentContentValidation.js";
import {
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord
} from "../src/questionRepeatGuards.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const roundLength = 15;
const simulatedRounds = 3;

const runtimeQuestionBanks = [
  ["questions", questions],
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["questionBankExpansion8", questionBankExpansion8],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function publicAssetExists(assetPath) {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(rootDir, "public", assetPath))
  );
}

function getStageIndex(question) {
  const skill = normalize(question.skill);
  const exactIndex = skillTree.findIndex(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactIndex !== -1) return exactIndex;

  return skillTree.findIndex(stage =>
    stage.match.some(term =>
      skill.includes(normalize(term)) ||
      normalize(term).includes(skill)
    )
  );
}

function prepareQuestion(question, source, index) {
  return {
    ...applyQuestionFormatMetadata(
      enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question))
    ),
    source,
    sourceIndex: index
  };
}

function getQuestionPrompt(question = {}) {
  return question.question || question.prompt || question.spokenPrompt || "";
}

function getQuestionAnswer(question = {}) {
  return question.answer || question.correctAnswer || question.correctSentence || "";
}

function isPairSelectionQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  return Boolean(
    Array.isArray(question.correctAnswers) ||
    ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(question.questionType) ||
    format.includes("PAIR_SELECT") ||
    format.includes("GROUP_SELECT")
  );
}

function isFixSentenceQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const type = normalize(question.questionType);
  return Boolean(type.includes("fix_sentence") || format === "FIX_SENTENCE");
}

function getAnchorWord(question = {}) {
  const explicit = question.anchorWord || question.anchor || "";
  if (explicit) return normalize(explicit);

  const text = normalize([question.question, question.prompt].join(" "));
  const match = text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

function isWordRecognitionQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const type = normalize(question.questionType);
  return format.includes("FIND_WORD") || type.includes("listen_and_find_word");
}

function hasAnchorChoiceLeakage(question = {}) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

function sentenceCompletionMissingContext(question = {}) {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question.passage || question.sentence || question.context || question.brokenSentence);
}

function questionContainsWord(question = {}, word) {
  const target = normalize(word);
  const values = [
    question.answer,
    question.correctAnswer,
    question.targetWord,
    question.audioText,
    ...(question.choices || []),
    ...(question.correctWords || []),
    ...(question.correctAnswers || []),
    ...(question.imageCards || []).map(card => card.word)
  ];

  return values.some(value => normalize(value) === target);
}

function weakLegacyPhonicsReason(question = {}) {
  const skill = normalize(question.skill);
  const promptText = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const formatType = String(question.formatType || "").toUpperCase();
  const questionType = normalize(question.questionType);
  const hasVisualOrAudio = Boolean(
    question.imagePath ||
    question.audioPath ||
    question.imageCards?.length ||
    question.promptImageCards?.length ||
    question.answerOptions?.some(option => option?.image || option?.audio)
  );
  const assetBackedFormats = new Set([
    "INITIAL_SOUND_PAIR_SELECT",
    "FINAL_SOUND_PAIR_SELECT",
    "RHYME_PAIR_SELECT",
    "LISTEN_FIND_RHYME",
    "READ_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "MISSING_VOWEL_CVC",
    "PICTURE_AUDIO_TO_PATTERN",
    "IMAGE_WORD_PATTERN_MATCH",
    "FIRST_SOUND",
    "ENDING_SOUND",
    "BLEND_SOUNDS",
    "PUT_SOUNDS_IN_ORDER",
    "RHYMING_PICTURE",
    "SHORT_VOWEL_WORD",
    "COMPLETE_WORD",
    "SENTENCE_MATCHES_PICTURE",
    "VOCABULARY_CATEGORY",
    "GRAMMAR_BASICS"
  ]);

  if (assetBackedFormats.has(formatType) || questionType === "listen_and_find_word") return "";
  if (skill.includes("initial") && /\b(which word starts the same as|starts the same as|starts like)\b/.test(promptText)) return "legacy initial sound";
  if (skill.includes("final") && /\b(which word ends|ends the same|ends like)\b/.test(promptText)) return "legacy final sound";
  if (/\b(which word rhymes|choose the word that rhymes)\b/.test(promptText) && !hasVisualOrAudio) return "legacy rhyming";
  if ((skill.includes("short vowel") || skill.includes("cvc")) && /\b(same middle sound|same sound in the middle)\b/.test(promptText)) return "legacy short vowel";
  if ((skill.includes("blend") || skill.includes("digraph")) && /\bwhich word starts with\b/.test(promptText) && !hasVisualOrAudio) return "legacy phonics pattern";
  if (/\bwhich word has the [a-z]{2} (?:blend|digraph)\b/.test(promptText) && !hasVisualOrAudio) return "legacy phonics pattern";

  return "";
}

function lowQualityPluralDistractorReason(question = {}) {
  const skill = normalize(question.skill);
  if (!skill.includes("plural")) return "";

  return (question.choices || []).some(choice => normalize(choice).endsWith("z"))
    ? "low-quality plural z distractor"
    : "";
}

function isRuntimeQuestionValid(question = {}) {
  if (!question.id || !question.skill || !getQuestionPrompt(question) || !getQuestionAnswer(question)) return false;

  if (isFixSentenceQuestion(question)) {
    const tiles = question.tiles || question.choices;
    return Boolean(
      question.correctSentence &&
      question.brokenSentence &&
      Array.isArray(tiles) &&
      tiles.length >= 2 &&
      getStageIndex(question) !== -1
    );
  }

  if (String(question.templateType || question.formatType || "").toUpperCase() === "PUT_SOUNDS_IN_ORDER") {
    return Array.isArray(question.soundTiles) &&
      question.soundTiles.length >= 2 &&
      getStageIndex(question) !== -1 &&
      getAssessmentContentIssues(question, { assetExists: publicAssetExists }).length === 0;
  }

  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!isPairSelectionQuestion(question) && !question.choices.includes(question.answer)) return false;
  if (getStageIndex(question) === -1) return false;
  if (hasAnchorChoiceLeakage(question)) return false;
  if (sentenceCompletionMissingContext(question)) return false;
  if (questionContainsWord(question, "pun")) return false;
  if (weakLegacyPhonicsReason(question)) return false;
  if (lowQualityPluralDistractorReason(question)) return false;
  if (getAssessmentContentIssues(question, { assetExists: publicAssetExists }).length > 0) return false;

  const choices = question.choices.map(choice => normalize(choice));
  const duplicateChoicesAllowed =
    question.questionType === "ixl_template" &&
    String(question.templateType || question.formatType || "").toUpperCase() === "GRAMMAR_BASICS";
  if (new Set(choices).size !== choices.length && !duplicateChoicesAllowed) return false;

  const questionText = normalize(getQuestionPrompt(question));
  const allText = [
    question.question,
    question.skill,
    question.passage,
    ...question.choices
  ].join(" ").toLowerCase();

  if (questionText.includes("silent letter")) return false;
  if (allText.includes("sun") && allText.includes("son") && allText.includes("middle")) return false;
  if (questionText.includes("which word spells")) return false;
  if (questionText.includes("matches the picture") && !question.imagePath) return false;

  return true;
}

function getActiveRuntimeQuestions() {
  const active = runtimeQuestionBanks
    .flatMap(([source, questions]) =>
      questions.map((question, index) => prepareQuestion(question, source, index))
    )
    .filter(isRuntimeQuestionValid);
  const seen = new Set();
  const canonical = [];

  for (const question of active) {
    const signature = getQuestionSignature(question);
    const key = signature || question.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    canonical.push(question);
  }

  return canonical;
}

function hasDuplicateInRound(question, round) {
  const id = question.id || "";
  const signature = getQuestionSignature(question);

  return round.some(selected =>
    (id && selected.id === id) ||
    (signature && getQuestionSignature(selected) === signature)
  );
}

function getRoundSoftDuplicateFlags(question, round) {
  const promptAnswer = getQuestionPromptAnswerSignature(question);
  const targetWord = getRepeatTargetWord(question);
  const optionSet = getRepeatOptionSetSignature(question);

  return {
    promptAnswer: Boolean(promptAnswer && round.some(selected => getQuestionPromptAnswerSignature(selected) === promptAnswer)),
    targetWord: Boolean(targetWord && round.some(selected => getRepeatTargetWord(selected) === targetWord)),
    optionSet: Boolean(optionSet && round.some(selected => getRepeatOptionSetSignature(selected) === optionSet))
  };
}

function wasAnsweredCorrect(question, memory) {
  return (
    (question.id && memory.ids.has(question.id)) ||
    memory.signatures.has(getQuestionSignature(question))
  );
}

function selectQuestion(pool, round, memory) {
  const currentSafe = pool.filter(question => !hasDuplicateInRound(question, round));
  const globalNeverCorrect = pool.filter(question => !wasAnsweredCorrect(question, memory));
  const neverCorrect = currentSafe.filter(question => !wasAnsweredCorrect(question, memory));
  const noCorrectTarget = neverCorrect.filter(question => {
    const targetWord = getRepeatTargetWord(question);
    return !targetWord || !memory.targetWords.has(targetWord);
  });
  const noRecentTarget = noCorrectTarget.filter(question => {
    const targetWord = getRepeatTargetWord(question);
    const promptAnswer = getQuestionPromptAnswerSignature(question);
    const optionSet = getRepeatOptionSetSignature(question);
    return (!targetWord || !memory.recentTargetWords.has(targetWord)) &&
      (!promptAnswer || !memory.promptAnswers.has(promptAnswer)) &&
      (!optionSet || !memory.optionSets.has(optionSet));
  });

  const basePool =
    noRecentTarget.length > 0
      ? noRecentTarget
      : noCorrectTarget.length > 0
        ? noCorrectTarget
        : neverCorrect.length > 0
          ? neverCorrect
          : globalNeverCorrect.length > 0
            ? []
            : currentSafe;

  if (basePool.length === 0) return null;

  const strict = basePool.filter(question => {
    const flags = getRoundSoftDuplicateFlags(question, round);
    return !flags.targetWord && !flags.promptAnswer && !flags.optionSet;
  });
  const relaxPrompt = basePool.filter(question => {
    const flags = getRoundSoftDuplicateFlags(question, round);
    return !flags.targetWord && !flags.optionSet;
  });
  const relaxOptionSet = basePool.filter(question => {
    const flags = getRoundSoftDuplicateFlags(question, round);
    return !flags.targetWord;
  });

  return strict[0] ||
    relaxPrompt[0] ||
    relaxOptionSet[0] ||
    basePool[0] ||
    null;
}

function addCorrectMemory(question, memory) {
  if (question.id) memory.ids.add(question.id);
  memory.signatures.add(getQuestionSignature(question));
  memory.promptAnswers.add(getQuestionPromptAnswerSignature(question));
  memory.optionSets.add(getRepeatOptionSetSignature(question));
  const targetWord = getRepeatTargetWord(question);
  if (targetWord) {
    memory.targetWords.add(targetWord);
    memory.recentTargetWords.add(targetWord);
    memory.recentQueue.push(targetWord);
    while (memory.recentQueue.length > roundLength * 3) {
      const removed = memory.recentQueue.shift();
      if (!memory.recentQueue.includes(removed)) memory.recentTargetWords.delete(removed);
    }
  }
}

function simulateStage(stage, questions) {
  const memory = {
    ids: new Set(),
    signatures: new Set(),
    promptAnswers: new Set(),
    optionSets: new Set(),
    targetWords: new Set(),
    recentTargetWords: new Set(),
    recentQueue: []
  };
  const uniqueSignatures = new Set(questions.map(getQuestionSignature));
  const uniqueTargets = new Set(questions.map(getRepeatTargetWord).filter(Boolean));
  const rounds = [];
  const failures = [];
  const contentGaps = [];

  for (let roundIndex = 0; roundIndex < simulatedRounds; roundIndex += 1) {
    const round = [];

    for (let step = 0; step < roundLength; step += 1) {
      const remainingUnseenSignatures = questions.filter(question =>
        !memory.signatures.has(getQuestionSignature(question))
      ).length;
      const picked = selectQuestion(questions, round, memory);

      if (!picked) {
        contentGaps.push({
          round: roundIndex + 1,
          step: step + 1,
          type: "pool_exhausted",
          detail: "No non-duplicate question remained for this round."
        });
        break;
      }

      const signature = getQuestionSignature(picked);
      if (memory.signatures.has(signature) && remainingUnseenSignatures > 0) {
        failures.push({
          round: roundIndex + 1,
          step: step + 1,
          type: "signature_repeat_before_exhaustion",
          detail: picked.id || signature
        });
      }

      round.push(picked);
      addCorrectMemory(picked, memory);
    }

    rounds.push(round);
  }

  return {
    stage,
    active: questions.length,
    uniqueSignatures: uniqueSignatures.size,
    uniqueTargets: uniqueTargets.size,
    rounds,
    failures,
    contentGaps
  };
}

function duplicateRows(questions) {
  const byId = new Map();
  const bySignature = new Map();

  questions.forEach(question => {
    if (question.id) byId.set(question.id, [...(byId.get(question.id) || []), question]);
    const signature = getQuestionSignature(question);
    bySignature.set(signature, [...(bySignature.get(signature) || []), question]);
  });

  return {
    duplicateIds: [...byId.entries()].filter(([, items]) => items.length > 1),
    duplicateSignatures: [...bySignature.entries()].filter(([, items]) => items.length > 1)
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

const activeQuestions = getActiveRuntimeQuestions();
const stageResults = skillTree.map(stage => {
  const questions = activeQuestions.filter(question => getStageIndex(question) === skillTree.indexOf(stage));
  return simulateStage(stage, questions);
});
const failures = stageResults.flatMap(result =>
  result.failures.map(failure => ({ skill: result.stage.label, ...failure }))
);
const contentGaps = stageResults.flatMap(result =>
  result.contentGaps.map(gap => ({ skill: result.stage.label, ...gap }))
);
const duplicateSummary = duplicateRows(activeQuestions);

const doc = [
  "# Repeat Question Audit",
  "",
  "Generated by `node tools/checkRepeatSelection.js`.",
  "",
  "Rule: a correctly answered exact question signature is burned for that student until all other valid questions for that skill are exhausted. The simulation below assumes three consecutive 15-question rounds with every answer correct.",
  "",
  "## Summary",
  "",
  markdownTable(
    ["Skill", "Active valid questions", "Unique signatures", "Unique target words", "Round 1 IDs", "Round 2 IDs", "Round 3 IDs", "Failures"],
    stageResults.map(result => [
      result.stage.label,
      result.active,
      result.uniqueSignatures,
      result.uniqueTargets,
      result.rounds[0]?.map(question => question.id).join(", ") || "",
      result.rounds[1]?.map(question => question.id).join(", ") || "",
      result.rounds[2]?.map(question => question.id).join(", ") || "",
      [
        ...result.failures.map(failure => `${failure.type} r${failure.round}q${failure.step}`),
        ...result.contentGaps.map(gap => `${gap.type} r${gap.round}q${gap.step}`)
      ].join("; ") || "none"
    ])
  ),
  "",
  "## Active Pool Duplicate IDs",
  "",
  duplicateSummary.duplicateIds.length
    ? markdownTable(
      ["Question ID", "Count", "Sources"],
      duplicateSummary.duplicateIds.map(([id, items]) => [
        id,
        items.length,
        items.map(item => `${item.source}:${item.sourceIndex}`).join(", ")
      ])
    )
    : "No duplicate active question IDs found.",
  "",
  "## Active Pool Duplicate Signatures",
  "",
  duplicateSummary.duplicateSignatures.length
    ? markdownTable(
      ["Signature", "Count", "Question IDs"],
      duplicateSummary.duplicateSignatures.slice(0, 120).map(([signature, items]) => [
        signature,
        items.length,
        items.map(item => item.id).join(", ")
      ])
    )
    : "No duplicate active question signatures found.",
  "",
  "## Repeat Failures",
  "",
  failures.length
    ? markdownTable(
      ["Skill", "Round", "Question", "Type", "Detail"],
      failures.map(failure => [
        failure.skill,
        failure.round,
        failure.step,
        failure.type,
        failure.detail
      ])
    )
    : "No simulated correct-question repeats occurred before alternatives were exhausted.",
  "",
  "## Content Gaps",
  "",
  contentGaps.length
    ? markdownTable(
      ["Skill", "Round", "Question", "Type", "Detail"],
      contentGaps.map(gap => [
        gap.skill,
        gap.round,
        gap.step,
        gap.type,
        gap.detail
      ])
    )
    : "No simulated round ran out of unique, non-repeating candidates."
].join("\n");

const outputPath = path.join(rootDir, "docs", "validation", "repeat_question_audit.md");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, doc);

console.log(`Active runtime questions scanned: ${activeQuestions.length}`);
console.log(`Duplicate active question IDs: ${duplicateSummary.duplicateIds.length}`);
console.log(`Duplicate active signatures: ${duplicateSummary.duplicateSignatures.length}`);
console.log(`Simulation repeat failures: ${failures.length}`);
console.log(`Simulation content gaps: ${contentGaps.length}`);
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);

if (failures.length > 0 || duplicateSummary.duplicateIds.length > 0) {
  process.exitCode = 1;
}
