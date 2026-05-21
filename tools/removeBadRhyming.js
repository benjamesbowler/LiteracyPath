import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const rhymeGroups = [
  ["cat", "bat", "hat", "mat", "rat", "sat", "fat"],
  ["dog", "fog", "log", "hog", "frog", "flog"],
  ["bug", "rug", "mug", "hug", "jug", "plug"],
  ["pin", "win", "fin", "tin", "bin", "chin"],
  ["cake", "lake", "make", "take", "bake", "snake"],
  ["bike", "like", "hike", "mike"],
  ["sun", "run", "fun", "bun"],
  ["bed", "red", "fed", "led"],
  ["top", "hop", "pop", "mop", "stop"],
  ["fish", "dish", "wish"]
];

function rhymeCount(choices) {
  const lowerChoices = choices.map(c => String(c).toLowerCase());

  for (const group of rhymeGroups) {
    const count = lowerChoices.filter(c => group.includes(c)).length;
    if (count > 1) return count;
  }

  return 0;
}

function isBadRhymingQuestion(q) {
  const skill = String(q.skill || "").toLowerCase();
  const question = String(q.question || "").toLowerCase();

  if (!skill.includes("rhym") && !question.includes("rhyme")) {
    return false;
  }

  if (!Array.isArray(q.choices)) return true;

  return rhymeCount(q.choices) > 1;
}

const before = generatedQuestions.length;

const cleaned = generatedQuestions.filter(q => !isBadRhymingQuestion(q));

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};\n`
);

console.log("Removed bad rhyming questions:", before - cleaned.length);
console.log("Remaining questions:", cleaned.length);
