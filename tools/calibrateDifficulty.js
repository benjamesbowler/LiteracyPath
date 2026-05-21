import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function estimateDifficulty(q) {
  let score = 1;

  const skill = String(q.skill || "").toLowerCase();
  const question = String(q.question || "");
  const passage = String(q.passage || "");
  const choices = Array.isArray(q.choices) ? q.choices : [];

  if (
    skill.includes("initial") ||
    skill.includes("final") ||
    skill.includes("rhyming") ||
    skill.includes("cvc") ||
    skill.includes("short vowel")
  ) {
    score = 1;
  }

  if (
    skill.includes("spelling") ||
    skill.includes("vocabulary") ||
    skill.includes("antonym") ||
    skill.includes("synonym") ||
    skill.includes("plural") ||
    skill.includes("preposition")
  ) {
    score = 2;
  }

  if (
    skill.includes("prefix") ||
    skill.includes("suffix") ||
    skill.includes("morphology") ||
    skill.includes("sentence comprehension") ||
    skill.includes("sequencing")
  ) {
    score = 3;
  }

  if (
    skill.includes("inference") ||
    skill.includes("main idea") ||
    skill.includes("key details") ||
    skill.includes("cause") ||
    skill.includes("context")
  ) {
    score = 4;
  }

  if (
    skill.includes("theme") ||
    skill.includes("author") ||
    skill.includes("figurative")
  ) {
    score = 5;
  }

  if (passage.length > 80) score += 1;
  if (passage.length > 160) score += 1;
  if (question.length > 100) score += 1;

  if (choices.length === 2) score -= 1;
  if (choices.length >= 4) score += 0;

  return clamp(Math.round(score), 1, 5);
}

const calibrated = generatedQuestions.map(q => {
  const newDifficulty = estimateDifficulty(q);

  return {
    ...q,
    difficulty: newDifficulty
  };
});

let changed = 0;

for (let i = 0; i < generatedQuestions.length; i++) {
  if (generatedQuestions[i].difficulty !== calibrated[i].difficulty) {
    changed++;
  }
}

const output =
`export const generatedQuestions = ${JSON.stringify(calibrated, null, 2)};
`;

fs.writeFileSync("src/data/generatedQuestions.js", output);

console.log("Difficulty scores updated:", changed);
console.log("Total questions:", calibrated.length);
