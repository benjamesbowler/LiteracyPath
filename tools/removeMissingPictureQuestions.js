import fs from "fs";
import { questions } from "../src/questions.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function isMissingPictureQuestion(q) {
  const question = String(q.question || "").toLowerCase();

  const asksForPicture =
    question.includes("matches the picture") ||
    question.includes("look at the picture") ||
    question.includes("picture shows") ||
    question.includes("what is in the picture");

  const hasPicture =
    Boolean(q.imagePath);

  return asksForPicture && !hasPicture;
}

function clean(list) {
  return list.filter(q => !isMissingPictureQuestion(q));
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
  "Removed missing-picture questions:",
  (questions.length - cleanedQuestions.length) +
  (generatedQuestions.length - cleanedGenerated.length)
);
