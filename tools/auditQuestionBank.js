import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { questions } from "../src/questions.js";
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
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { skillTree } from "../src/skillTree.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const questionBanks = [
  ["src/questions.js", questions],
  ["src/data/masteryCoreQuestions.js", masteryCoreQuestions],
  ["src/data/masteryExtraQuestions.js", masteryExtraQuestions],
  ["src/data/templateQuestions.js", templateQuestions],
  ["src/data/templateExpansion.js", templateExpansion],
  ["src/data/templateExpansion2.js", templateExpansion2],
  ["src/data/templateExpansion3.js", templateExpansion3],
  ["src/data/templateExpansion4.js", templateExpansion4],
  ["src/data/templateExpansion5.js", templateExpansion5],
  ["src/data/templateExpansion6.js", templateExpansion6],
  ["src/data/templateExpansion7.js", templateExpansion7],
  ["src/data/generatedQuestions.js", generatedQuestions],
  ["src/data/templateComprehensionAdvanced.js", templateComprehensionAdvanced]
];

const allQuestions =
  questionBanks.flatMap(([file, bank]) =>
    bank.map((question, index) => ({ file, index, question }))
  );

const knownPluralNouns = new Set([
  "children",
  "feet",
  "glasses",
  "pants",
  "people",
  "scissors",
  "shoes"
]);

const singularSExceptions = new Set([
  "bus",
  "class",
  "dress",
  "grass"
]);

const obviousQuestionStems = [
  "answer the question",
  "choose the correct answer",
  "choose the right answer",
  "what is the answer",
  "which one is correct"
];

const metaPhonicsPatterns = [
  /\bwhich (word|choice) is a cvc word\b/i,
  /\bwhich choice is a cvc word\b/i
];

const unsafeShortVowelAudioPattern =
  /\bshort [aeiou] sound\b/i;

const phonemeSlashPattern =
  /\/[a-z]{1,3}\//i;

const earlyPhonicsStages = new Set([
  "CVC and Short Vowels",
  "Short Vowel Discrimination"
]);

const earlyBoundaryPromptPattern =
  /\b(blend|blends|digraph|digraphs|two consonants?|consonants together|long vowel|silent e|magic e|vowel team|r-controlled)\b/i;

const cvcVowels = new Set(["a", "e", "i", "o", "u"]);

const answerVisibleStopwords = new Set([
  "a",
  "an",
  "the"
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedChoices(choices) {
  return choices.map(choice => normalize(choice));
}

function isSingleLetter(text) {
  return /^[a-z]$/i.test(String(text || "").trim());
}

function isSimpleCvcWord(text) {
  const word = normalize(text);

  if (!/^[a-z]{3}$/.test(word)) return false;

  return (
    !cvcVowels.has(word[0]) &&
    cvcVowels.has(word[1]) &&
    !cvcVowels.has(word[2])
  );
}

function extractEarlyPhonicsTarget(questionText) {
  const text = String(questionText || "");
  const sameSoundMatch =
    text.match(/same (?:middle |vowel )?sound as ['"]?([a-z]+)['"]?/i);

  if (sameSoundMatch) return sameSoundMatch[1];

  const soundInWordMatch =
    text.match(/sound in .*?word ['"]?([a-z]+)['"]?/i);

  return soundInWordMatch?.[1] || null;
}

function earlyPhonicsBoundaryIssue(question, stage) {
  if (!earlyPhonicsStages.has(stage)) return null;

  if (earlyBoundaryPromptPattern.test(question.question || "")) {
    return `Prompt uses a later phonics concept in ${stage}: "${question.question}".`;
  }

  const target = extractEarlyPhonicsTarget(question.question);

  if (target && !isSimpleCvcWord(target)) {
    return `Target word "${target}" is not a simple CVC word for ${stage}.`;
  }

  const responseWords = [question.answer, ...(question.choices || [])]
    .map(value => normalize(value))
    .filter(Boolean);

  for (const word of responseWords) {
    if (isSingleLetter(word)) continue;
    if (!isSimpleCvcWord(word)) {
      return `Choice/answer "${word}" is not a simple CVC word for ${stage}.`;
    }
  }

  return null;
}

function getStage(question) {
  const skill = normalize(question.skill);

  if (skill.includes("r controlled")) {
    return "R-Controlled Vowels";
  }

  const exactSkillMatch = skillTree.find(stage =>
    stage.match.some(term => skill === normalize(term))
  );

  if (exactSkillMatch) return exactSkillMatch.label;

  if (skill.includes("short vowel discrimination")) {
    return "Short Vowel Discrimination";
  }

  const text = [
    question.skill,
    question.question,
    question.passage,
    ...(question.choices || [])
  ].join(" ").toLowerCase();

  const index = skillTree.findIndex(stage =>
    stage.match.some(term => text.includes(term.toLowerCase()))
  );

  return index === -1 ? "UNMATCHED" : skillTree[index].label;
}

function addProblem(problems, type, item, detail) {
  problems.push({
    type,
    file: item.file,
    id: item.question?.id || `index ${item.index}`,
    detail
  });
}

function isImageQuestion(question) {
  const questionType = normalize(question.questionType);
  const skill = normalize(question.skill);
  const text = normalize(question.question);

  return (
    questionType.includes("image") ||
    questionType.includes("picture") ||
    skill.includes("picture comprehension") ||
    text.includes("picture") ||
    text.includes("image") ||
    text.includes("matches the picture")
  );
}

function imagePathExists(imagePath) {
  if (!imagePath || !imagePath.startsWith("/")) return false;

  const localPath = path.join(rootDir, "public", imagePath);
  return fs.existsSync(localPath);
}

function nounPhraseIsPlural(nounPhrase) {
  const lastWord = normalize(nounPhrase)
    .split(/\s+/)
    .filter(Boolean)
    .at(-1);

  if (!lastWord) return false;
  if (knownPluralNouns.has(lastWord)) return true;
  if (singularSExceptions.has(lastWord)) return false;

  return lastWord.endsWith("s");
}

function expectedWhereVerb(questionText) {
  const match =
    String(questionText || "").match(/^Where (is|are) the ([a-z][a-z -]*?)\?$/i);

  if (!match) return null;

  return nounPhraseIsPlural(match[2]) ? "are" : "is";
}

function answerIsVisible(question) {
  const answer = normalize(question.answer);
  const questionText = normalize(question.question);

  if (!answer || answer.length < 3) return false;
  if (answerVisibleStopwords.has(answer)) return false;
  if (normalize(question.skill).includes("rhym")) return false;

  return new RegExp(`(^| )${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`)
    .test(questionText);
}

function hasMultipleLikelyCorrectAnswers(question) {
  const skill = normalize(question.skill);
  const answer = normalize(question.answer);
  const choices = normalizedChoices(question.choices || []);

  if (!choices.includes(answer)) return false;

  if (skill.includes("initial")) {
    const first = answer[0];
    return choices.filter(choice => choice[0] === first).length > 1;
  }

  if (skill.includes("final")) {
    const last = answer.at(-1);
    return choices.filter(choice => choice.at(-1) === last).length > 1;
  }

  if (skill.includes("rhym")) {
    const ending = answer.slice(-2);
    return choices.filter(choice => choice.slice(-2) === ending).length > 1;
  }

  return false;
}

function isTooAdvancedForEarlySkill(question) {
  const skill = normalize(question.skill);
  const earlySkill =
    skill.includes("initial") ||
    skill.includes("final") ||
    skill.includes("rhym") ||
    skill.includes("cvc") ||
    skill.includes("short vowel");

  if (!earlySkill) return false;

  const passageLength = normalize(question.passage).split(/\s+/).filter(Boolean).length;
  const questionLength = normalize(question.question).split(/\s+/).filter(Boolean).length;

  return passageLength > 18 || questionLength > 18;
}

function auditQuestions() {
  const problems = [];
  const counts = {};
  const idLocations = new Map();

  for (const item of allQuestions) {
    const question = item.question;
    const stage = getStage(question);
    counts[stage] = (counts[stage] || 0) + 1;

    if (!question.id) addProblem(problems, "missing id", item, "Question has no id.");
    if (!question.question) addProblem(problems, "missing question", item, "Question text is empty.");
    if (!question.skill) addProblem(problems, "missing skill", item, "Skill label is empty.");
    if (!question.answer) addProblem(problems, "missing answer", item, "Answer is empty.");

    if (question.id) {
      if (idLocations.has(question.id)) {
        addProblem(
          problems,
          "duplicate id",
          item,
          `Already used in ${idLocations.get(question.id)}.`
        );
      } else {
        idLocations.set(question.id, item.file);
      }
    }

    if (!Array.isArray(question.choices)) {
      addProblem(problems, "choices not array", item, "Choices must be an array.");
      continue;
    }

    if (question.choices.length < 2) {
      addProblem(problems, "too few choices", item, "Question has fewer than two choices.");
    }

    const choices = normalizedChoices(question.choices);
    const uniqueChoices = new Set(choices);

    if (uniqueChoices.size !== choices.length) {
      addProblem(problems, "duplicate answer choices", item, question.choices.join(" | "));
    }

    if (!choices.includes(normalize(question.answer))) {
      addProblem(
        problems,
        "answer not present in choices",
        item,
        `Answer "${question.answer}" is not one of: ${question.choices.join(" | ")}`
      );
    }

    if (hasMultipleLikelyCorrectAnswers(question)) {
      addProblem(
        problems,
        "multiple likely correct answers",
        item,
        `Choices may include more than one correct response for "${question.answer}".`
      );
    }

    if (answerIsVisible(question)) {
      addProblem(
        problems,
        "answer visible in question",
        item,
        `Answer "${question.answer}" appears in the question text.`
      );
    }

    if (obviousQuestionStems.includes(normalize(question.question))) {
      addProblem(
        problems,
        "unclear wording",
        item,
        `Question wording is too vague: "${question.question}".`
      );
    }

    if (metaPhonicsPatterns.some(pattern => pattern.test(question.question || ""))) {
      addProblem(
        problems,
        "meta phonics wording",
        item,
        `Student-facing prompt uses CVC jargon: "${question.question}".`
      );
    }

    if (unsafeShortVowelAudioPattern.test(question.question || "") && !question.spokenPrompt && !question.audioText) {
      addProblem(
        problems,
        "unsafe phonics audio wording",
        item,
        `Short-vowel prompt needs spokenPrompt/audioText so TTS does not read letter names: "${question.question}".`
      );
    }

    if (phonemeSlashPattern.test(question.question || "") && !question.spokenPrompt && !question.audioText) {
      addProblem(
        problems,
        "phoneme prompt missing safe audio",
        item,
        `Prompt contains slash phoneme notation but no spokenPrompt/audioText: "${question.question}".`
      );
    }

    const earlyBoundaryProblem =
      earlyPhonicsBoundaryIssue(question, stage);

    if (earlyBoundaryProblem) {
      addProblem(
        problems,
        "early phonics boundary",
        item,
        earlyBoundaryProblem
      );
    }
    if (isImageQuestion(question)) {
      if (!question.imagePath) {
        addProblem(
          problems,
          "missing imagePath",
          item,
          `Image/picture question has no imagePath.`
        );
      } else if (!imagePathExists(question.imagePath)) {
        addProblem(
          problems,
          "broken imagePath",
          item,
          `Image file does not exist: ${question.imagePath}`
        );
      }
    } else if (question.imagePath && !imagePathExists(question.imagePath)) {
      addProblem(
        problems,
        "broken imagePath",
        item,
        `Image file does not exist: ${question.imagePath}`
      );
    }

    const expectedVerb = expectedWhereVerb(question.question);

    if (expectedVerb) {
      const actualVerb =
        question.question.match(/^Where (is|are) /i)?.[1].toLowerCase();

      if (actualVerb !== expectedVerb) {
        addProblem(
          problems,
          "mismatched singular/plural wording",
          item,
          `Expected "Where ${expectedVerb}..." for "${question.question}".`
        );
      }
    }

    if (isTooAdvancedForEarlySkill(question)) {
      addProblem(
        problems,
        "too advanced for early skill",
        item,
        "Early phonics question has an unusually long passage or prompt."
      );
    }
  }

  return { counts, problems };
}

function printCounts(counts) {
  console.log("TOTAL QUESTIONS:", allQuestions.length);
  console.log("");

  for (const stage of skillTree) {
    const count = counts[stage.label] || 0;
    const status =
      count >= 40 ? "GOOD" :
      count >= 20 ? "OK" :
      count >= 10 ? "LOW" :
      "TOO LOW";

    console.log(`${status.padEnd(8)} ${String(count).padStart(3)}  ${stage.label}`);
  }

  console.log("");
  console.log("UNMATCHED:", counts.UNMATCHED || 0);
}

function printProblems(problems) {
  const byType = new Map();

  for (const problem of problems) {
    byType.set(problem.type, (byType.get(problem.type) || 0) + 1);
  }

  console.log("");
  console.log("PROBLEMS FOUND:", problems.length);

  for (const [type, count] of byType) {
    console.log(`- ${type}: ${count}`);
  }

  console.log("");

  for (const problem of problems.slice(0, 200)) {
    console.log(
      `[${problem.type}] ${problem.file} ${problem.id}: ${problem.detail}`
    );
  }

  if (problems.length > 200) {
    console.log(`...and ${problems.length - 200} more`);
  }
}

const { counts, problems } = auditQuestions();

printCounts(counts);
printProblems(problems);

if (problems.length > 0) {
  process.exit(1);
}

console.log("Question bank audit passed.");
