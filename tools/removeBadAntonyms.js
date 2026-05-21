import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const antonymGroups = [
  ["cold", "hot", "warm"],
  ["big", "small", "tiny", "little"],
  ["happy", "sad", "unhappy"],
  ["fast", "slow"],
  ["up", "down"],
  ["in", "out", "outside"],
  ["open", "closed", "shut"],
  ["full", "empty"],
  ["light", "dark"],
  ["hard", "soft"],
  ["wet", "dry"],
  ["clean", "dirty"],
  ["old", "new", "young"],
  ["near", "far"],
  ["loud", "quiet", "silent"],
  ["easy", "hard", "difficult"]
];

function isAntonymQuestion(q) {
  const skill = String(q.skill || "").toLowerCase();
  const question = String(q.question || "").toLowerCase();

  return skill.includes("antonym") ||
         question.includes("opposite");
}

function hasAmbiguousAntonyms(q) {
  if (!Array.isArray(q.choices)) return true;

  const choices =
    q.choices.map(c => String(c).toLowerCase());

  for (const group of antonymGroups) {
    const count =
      choices.filter(c => group.includes(c)).length;

    if (count > 1) return true;
  }

  return false;
}

const before = generatedQuestions.length;

const cleaned =
  generatedQuestions.filter(q =>
    !(isAntonymQuestion(q) && hasAmbiguousAntonyms(q))
  );

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};\n`
);

console.log("Removed bad antonym questions:", before - cleaned.length);
console.log("Remaining questions:", cleaned.length);
