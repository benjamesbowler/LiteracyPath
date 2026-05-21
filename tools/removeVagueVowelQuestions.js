import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function isBadVowelQuestion(q) {
  const question = String(q.question || "").toLowerCase();
  const skill = String(q.skill || "").toLowerCase();

  const isVowelSkill =
    skill.includes("vowel") ||
    skill.includes("phonics") ||
    skill.includes("cvc");

  const vague =
    question.includes("short vowel sound in the middle") &&
    !question.includes("same") &&
    !question.includes("a sound") &&
    !question.includes("e sound") &&
    !question.includes("i sound") &&
    !question.includes("o sound") &&
    !question.includes("u sound");

  return isVowelSkill && vague;
}

const before = generatedQuestions.length;

const cleaned =
  generatedQuestions.filter(q => !isBadVowelQuestion(q));

const removed = before - cleaned.length;

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};\n`
);

console.log("Removed vague vowel questions:", removed);
console.log("Remaining questions:", cleaned.length);
