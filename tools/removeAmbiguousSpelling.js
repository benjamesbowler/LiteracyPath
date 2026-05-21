import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const commonCorrectWords = new Set([
  "man", "mom", "mum", "mommy", "dad", "dog", "cat", "pig", "sun",
  "run", "sit", "top", "pot", "map", "mat", "cup", "box", "pen",
  "book", "cake", "bike", "home", "school", "friend", "friends",
  "winter", "dock", "apple", "happy", "sad", "big", "small"
]);

function isAmbiguousSpelling(q) {
  const skill = String(q.skill || "").toLowerCase();
  const question = String(q.question || "").toLowerCase();

  if (!skill.includes("spelling")) return false;
  if (!question.includes("spelled correctly")) return false;
  if (!Array.isArray(q.choices)) return false;

  const realWordChoices = q.choices.filter(choice =>
    commonCorrectWords.has(String(choice).toLowerCase())
  );

  return realWordChoices.length > 1;
}

const before = generatedQuestions.length;

const cleaned = generatedQuestions.filter(q => !isAmbiguousSpelling(q));

const removed = before - cleaned.length;

const output =
`export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};
`;

fs.writeFileSync("src/data/generatedQuestions.js", output);

console.log("Removed ambiguous spelling questions:", removed);
console.log("Remaining generated questions:", cleaned.length);
