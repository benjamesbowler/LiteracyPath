import fs from "fs";
import { questions } from "../src/questions.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const ambiguousPairs = [
  ["sun", "son"],
  ["cot", "caught"],
  ["pin", "pen"],
  ["ship", "sheep"],
  ["full", "fool"],
  ["pool", "pull"],
  ["bed", "bad"],
  ["man", "men"],
  ["hat", "hot"]
];

function containsAmbiguousPair(choices) {
  const lower =
    choices.map(c =>
      String(c).toLowerCase()
    );

  for (const pair of ambiguousPairs) {
    const count =
      pair.filter(word =>
        lower.includes(word)
      ).length;

    if (count >= 2) {
      return true;
    }
  }

  return false;
}

function isBadQuestion(q) {
  const question =
    String(q.question || "").toLowerCase();

  const skill =
    String(q.skill || "").toLowerCase();

  const vowelQuestion =
    question.includes("middle sound") ||
    question.includes("vowel sound") ||
    skill.includes("short vowel");

  if (!vowelQuestion) return false;
  if (!Array.isArray(q.choices)) return false;

  return containsAmbiguousPair(q.choices);
}

function clean(list) {
  return list.filter(q => !isBadQuestion(q));
}

const cleanedQuestions = clean(questions);
const cleanedGenerated = clean(generatedQuestions);

fs.writeFileSync(
  "src/questions.js",
  `export const questions = ${JSON.stringify(cleanedQuestions, null, 2)};\n`
);

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(cleanedGenerated, null, 2)};\n`
);

console.log(
  "Removed ambiguous vowel questions:",
  (questions.length - cleanedQuestions.length) +
  (generatedQuestions.length - cleanedGenerated.length)
);
