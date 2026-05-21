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
  ["src/data/generatedQuestions.js", generatedQuestions]
];

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

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function isPrepositionQuestion(question) {
  return normalize(question.skill).includes("preposition");
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

function expectedVerbFor(questionText) {
  const match =
    String(questionText || "").match(/^Where (is|are) the ([a-z][a-z -]*?)\?$/i);

  if (!match) return null;

  return nounPhraseIsPlural(match[2]) ? "are" : "is";
}

const problems = [];
let checked = 0;

for (const [file, bank] of questionBanks) {
  for (const question of bank) {
    if (!isPrepositionQuestion(question)) continue;

    const expectedVerb = expectedVerbFor(question.question);

    if (!expectedVerb) continue;

    checked += 1;

    const actualVerb =
      question.question.match(/^Where (is|are) /i)?.[1].toLowerCase();

    if (actualVerb !== expectedVerb) {
      problems.push({
        file,
        id: question.id,
        question: question.question,
        expected: question.question.replace(
          /^Where (is|are) /i,
          `Where ${expectedVerb} `
        )
      });
    }
  }
}

console.log(`Checked ${checked} exact preposition where-question prompts.`);

if (problems.length > 0) {
  console.error(`Found ${problems.length} likely preposition grammar problem(s):`);

  for (const problem of problems) {
    console.error(
      `- ${problem.file} ${problem.id}: "${problem.question}" -> "${problem.expected}"`
    );
  }

  process.exit(1);
}

console.log("Preposition grammar validation passed.");
