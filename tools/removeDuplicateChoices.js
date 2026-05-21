import fs from "fs";
import { questions } from "../src/questions.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function hasDuplicateChoices(q) {
  if (!Array.isArray(q.choices)) return true;

  const lower =
    q.choices.map(c =>
      String(c).trim().toLowerCase()
    );

  return new Set(lower).size !== lower.length;
}

function clean(list) {
  return list.filter(q => !hasDuplicateChoices(q));
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
  "Removed duplicate-choice questions:",
  (questions.length - cleanedQuestions.length) +
  (generatedQuestions.length - cleanedGenerated.length)
);
