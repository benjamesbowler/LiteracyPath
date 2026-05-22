import { skillTree } from "../src/skillTree.js";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";

const runtimeQuestionBanks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

function normalize(text) {
  return String(text || "").toLowerCase().trim();
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

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function isWordRecognitionQuestion(question) {
  const typeText = normalize([question.questionType, question.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

function getAnchorWord(question) {
  const text = normalize([question.question, question.prompt, question.spokenPrompt].join(" "));
  const match =
    text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

function hasAnchorChoiceLeakage(question) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

function sentenceCompletionMissingContext(question) {
  const promptText = String([question.question, question.prompt, question.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question.passage || question.sentence || question.context || question.brokenSentence);
}

function isQuestionValid(question) {
  if (!question) return false;
  if (!question.id || !question.skill || !(question.prompt || question.question)) return false;

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

  if (!question.answer) return false;
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  if (!question.choices.includes(question.answer)) return false;
  if (getStageIndex(question) === -1) return false;
  if (hasAnchorChoiceLeakage(question)) return false;
  if (sentenceCompletionMissingContext(question)) return false;

  const choices = question.choices.map(choice => normalize(choice));
  if (new Set(choices).size !== choices.length) return false;

  const questionText = normalize(question.question);
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

const runtimeQuestions =
  runtimeQuestionBanks.flatMap(([source, questions]) =>
    questions.map(question => ({ ...question, source }))
  );

const matchedQuestions = runtimeQuestions.filter(isQuestionValid);
const counts = skillTree.map((stage, index) => ({
  stage,
  count: matchedQuestions.filter(question => getStageIndex(question) === index).length
}));

console.log(`Runtime questions scanned: ${runtimeQuestions.length}`);
console.log(`Runtime questions matched and valid: ${matchedQuestions.length}`);
console.log("");

for (const { stage, count } of counts) {
  console.log(`${String(count).padStart(3)}  ${stage.label}`);
}

const emptyStages = counts.filter(({ count }) => count === 0);

if (emptyStages.length > 0) {
  console.log("");
  console.error("Missing runtime questions for:");
  for (const { stage } of emptyStages) {
    console.error(`- ${stage.label}`);
  }

  process.exit(1);
}

console.log("");
console.log("Runtime question coverage passed.");
