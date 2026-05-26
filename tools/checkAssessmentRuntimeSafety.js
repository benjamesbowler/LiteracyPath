import fs from "node:fs";
import { skillTree } from "../src/skillTree.js";
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
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";

const banks = [
  masteryCoreQuestions,
  masteryExtraQuestions,
  initialSoundCoverageQuestions,
  finalSoundCoverageQuestions,
  rhymingCoverageQuestions,
  cvcShortVowelExpansionQuestions,
  contentExpansionPass3Questions,
  targetedContentRecoveryQuestions,
  kimiDataset7RuntimeQuestions,
  ixlStyleSeedQuestions,
  safeContentExpansionQuestions,
  templateQuestions,
  templateExpansion,
  templateExpansion2,
  templateExpansion3,
  templateExpansion4,
  templateExpansion5,
  templateExpansion6,
  templateExpansion7,
  questionBankExpansion8,
  generatedEarlySkillQuestions,
  generatedQuestions,
  fixSentenceQuestions,
  templateComprehensionAdvanced
];

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getStageIndex(question) {
  const skill = normalize(question?.skill || question?.skillName || question?.skillId);
  const exactIndex = skillTree.findIndex(stage =>
    stage.id === skill ||
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

function normalizeTemplateOption(option) {
  if (typeof option === "string") return { label: option, value: option };
  return {
    ...option,
    label: option?.label || option?.word || option?.value || "",
    value: option?.value || option?.word || option?.label || ""
  };
}

function normalizeAssessmentQuestion(rawQuestion, fallbackSkillId, index) {
  if (!rawQuestion) return null;

  const skillId =
    rawQuestion.skillId ??
    rawQuestion.skill_id ??
    fallbackSkillId ??
    rawQuestion.skill ??
    null;
  const answerOptions = Array.isArray(rawQuestion.answerOptions)
    ? rawQuestion.answerOptions.map(normalizeTemplateOption)
    : Array.isArray(rawQuestion.options)
      ? rawQuestion.options.map(normalizeTemplateOption)
      : Array.isArray(rawQuestion.choices)
        ? rawQuestion.choices.map(normalizeTemplateOption)
        : [];
  const correctAnswer =
    rawQuestion.correctAnswer ??
    rawQuestion.answer ??
    rawQuestion.finalSound ??
    rawQuestion.letter ??
    rawQuestion.correctSentence ??
    "";
  const prompt =
    typeof rawQuestion.prompt === "string"
      ? rawQuestion.prompt
      : typeof rawQuestion.question === "string"
        ? rawQuestion.question
        : "";

  return {
    ...rawQuestion,
    id: rawQuestion.id ?? `${skillId || "unknown-skill"}-${index}`,
    skillId,
    questionType: rawQuestion.questionType || "multiple_choice",
    templateType: rawQuestion.templateType || rawQuestion.formatType || rawQuestion.questionType || "MULTIPLE_CHOICE",
    prompt,
    targetWord: rawQuestion.targetWord ?? rawQuestion.word ?? "",
    imageUrl: rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.media?.imageUrl ?? "",
    audioUrl: rawQuestion.audioUrl ?? rawQuestion.audio ?? rawQuestion.media?.audioUrl ?? "",
    correctAnswer,
    answerOptions
  };
}

function isMultipleChoice(question) {
  return question.questionType !== "fix_sentence" &&
    question.templateType !== "PUT_SOUNDS_IN_ORDER" &&
    !["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(question.questionType);
}

function getAnswerValue(question) {
  if (!question) return "";
  if (question.questionType === "fix_sentence") {
    return question.correctSentence || question.correctAnswer || "";
  }
  if (question.answerOptions?.length > 0) {
    return question.answerOptions[0].value || question.answerOptions[0].label || "";
  }
  if (Array.isArray(question.choices) && question.choices.length > 0) return question.choices[0];
  return question.correctAnswer || "";
}

function buildAnswerResult(question, selectedAnswer) {
  const skillId = question?.skillId ?? null;
  if (!skillId) throw new Error("answer result missing skillId");

  const correctAnswer = question.correctAnswer || question.answer || question.correctSentence || "";
  const isCorrect = String(selectedAnswer) === String(correctAnswer);

  return {
    question,
    skillId,
    questionId: question.id,
    selectedAnswer,
    correctAnswer,
    isCorrect
  };
}

function buildFeedbackData(currentQuestion, result) {
  const lastAnsweredQuestion = result?.question || null;
  const skillId = lastAnsweredQuestion?.skillId ?? result?.skillId ?? null;
  if (!skillId) throw new Error("feedback data missing skillId");

  return {
    question: lastAnsweredQuestion,
    skillId,
    isCorrect: Boolean(result?.isCorrect),
    chosen: result?.selectedAnswer || "",
    correct: result?.correctAnswer || "",
    skill: lastAnsweredQuestion?.skill || skillId
  };
}

function scanSourcePatterns() {
  const appSource = fs.readFileSync("src/App.jsx", "utf8");
  const pagesSource = fs.readFileSync("src/components/AppPages.jsx", "utf8");
  const warnings = [];

  if (/const\s*\{\s*skillId\s*\}\s*=\s*currentQuestion/.test(appSource + pagesSource)) {
    warnings.push("Destructuring skillId from currentQuestion is unsafe.");
  }
  if (/const\s*\{\s*skillId\s*\}\s*=\s*question/.test(appSource + pagesSource)) {
    warnings.push("Destructuring skillId from question is unsafe in assessment runtime.");
  }

  const answerFunction = appSource.match(/function answerQuestion\(choice\) \{[\s\S]*?\n  \}\n\n  function buildFeedbackSupport/);
  if (answerFunction) {
    const body = answerFunction[0];
    const saveIndex = body.indexOf("saveAnswerToSupabase");
    const firstNullBeforeSave = body.indexOf("setCurrentQuestion(null)");
    const feedbackBlocks = body.match(/setFeedback\(\{[\s\S]*?\n      \}\);/g) || [];
    const timeoutBlocks = body.match(/setTimeout\(\(\) => \{[\s\S]*?\n        \},\s*\d+\);/g) || [];

    if (firstNullBeforeSave !== -1 && saveIndex !== -1 && firstNullBeforeSave < saveIndex) {
      warnings.push("answerQuestion clears currentQuestion before saving answer.");
    }

    if (feedbackBlocks.some(block => block.includes("currentQuestion"))) {
      warnings.push("answerQuestion feedback data still reads currentQuestion.");
    }

    if (timeoutBlocks.some(block => block.includes("currentQuestion"))) {
      warnings.push("answerQuestion transition timer still reads currentQuestion.");
    }
  }

  return warnings;
}

const rawQuestions = banks.flatMap(bank => bank);
const problems = [];
const activeQuestions = [];

rawQuestions.forEach((question, index) => {
  if (!question) {
    problems.push(`Question ${index} is null.`);
    return;
  }

  const stage = skillTree[getStageIndex(question)];
  const normalized = normalizeAssessmentQuestion(question, stage?.id, index);

  if (!normalized) {
    problems.push(`Question ${question?.id || index} could not be normalized.`);
    return;
  }

  if (!normalized.skillId) {
    problems.push(`${normalized.id}: skillId cannot be derived.`);
  }

  if (!normalized.prompt && !normalized.question && !normalized.spokenPrompt && !normalized.audioText && !normalized.passage && !normalized.brokenSentence) {
    problems.push(`${normalized.id}: prompt cannot be safely rendered.`);
  }

  if (!normalized.templateType && !normalized.formatType && !normalized.questionType) {
    problems.push(`${normalized.id}: templateType/formatType/questionType missing.`);
  }

  if (!normalized.correctAnswer) {
    problems.push(`${normalized.id}: correctAnswer missing.`);
  }

  if (isMultipleChoice(normalized)) {
    if (!Array.isArray(normalized.answerOptions) || normalized.answerOptions.length < 2) {
      problems.push(`${normalized.id}: answerOptions invalid for multiple choice.`);
    }

    const optionValues = normalized.answerOptions.map(option => option.value).filter(Boolean);
    if (normalized.correctAnswer && optionValues.length > 0 && !String(normalized.correctAnswer).includes("|") && !optionValues.includes(normalized.correctAnswer)) {
      problems.push(`${normalized.id}: correctAnswer "${normalized.correctAnswer}" not present in answerOptions.`);
    }
  }

  if (stage && normalized.skillId) activeQuestions.push(normalized);
});

for (const stage of skillTree) {
  const round = activeQuestions
    .filter(question => question.skillId === stage.id || normalize(question.skill) === normalize(stage.label))
    .slice(0, 10);
  const firstQuestion = normalizeAssessmentQuestion(round[0], stage.id, 0);

  if (!firstQuestion) {
    problems.push(`${stage.label}: simulated assessment start produced no first question.`);
    continue;
  }

  try {
    if (!firstQuestion.skillId) throw new Error("missing skillId");
    void firstQuestion.id;
    void firstQuestion.prompt;
    void firstQuestion.correctAnswer;
    void firstQuestion.answerOptions;

    const selectedAnswer = getAnswerValue(firstQuestion);
    const result = buildAnswerResult(firstQuestion, selectedAnswer);
    const currentQuestionAfterAnswer = null;
    const feedback = buildFeedbackData(currentQuestionAfterAnswer, result);
    if (!feedback.skillId) throw new Error("feedback missing stable skillId");

    const secondQuestion = normalizeAssessmentQuestion(round[1], stage.id, 1);
    if (secondQuestion) {
      void secondQuestion.skillId;
      void secondQuestion.id;
    }
  } catch (error) {
    problems.push(`${stage.label}: renderer field read failed: ${error.message}`);
  }
}

for (const warning of scanSourcePatterns()) {
  problems.push(`Post-answer source safety: ${warning}`);
}

console.log(`Assessment runtime questions scanned: ${rawQuestions.length}`);
console.log(`Assessment runtime active questions: ${activeQuestions.length}`);

if (problems.length > 0) {
  console.error("");
  console.error(`Assessment runtime safety problems found: ${problems.length}`);
  for (const problem of problems.slice(0, 100)) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Assessment runtime safety passed.");
