import fs from "fs";
import { questions } from "../src/questions.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function getTargetWord(question) {
  const match = String(question || "").match(/['"“”‘’]([a-zA-Z]+)['"“”‘’]/);
  return match ? match[1].toLowerCase() : null;
}

function firstSound(word) {
  word = String(word || "").toLowerCase();
  if (word.startsWith("ph")) return "f";
  if (word.startsWith("sh")) return "sh";
  if (word.startsWith("ch")) return "ch";
  if (word.startsWith("th")) return "th";
  if (word.startsWith("wh")) return "wh";
  return word[0] || "";
}

function lastSound(word) {
  word = String(word || "").toLowerCase();
  if (word.endsWith("ck")) return "k";
  if (word.endsWith("sh")) return "sh";
  if (word.endsWith("ch")) return "ch";
  if (word.endsWith("th")) return "th";
  return word[word.length - 1] || "";
}

function isBadPhonics(q) {
  const question = String(q.question || "").toLowerCase();
  const skill = String(q.skill || "").toLowerCase();

  if (!Array.isArray(q.choices)) return true;

  const choices = q.choices.map(c => String(c).toLowerCase());
  const target = getTargetWord(question);

  const isBeginning =
    question.includes("beginning sound") ||
    question.includes("same beginning") ||
    question.includes("starts with") ||
    skill.includes("initial");

  const isEnding =
    question.includes("ending sound") ||
    question.includes("same ending") ||
    question.includes("ends with") ||
    skill.includes("final");

  if (isBeginning && target) {
    const targetSound = firstSound(target);
    const matching = choices.filter(c => firstSound(c) === targetSound);
    return matching.length !== 1;
  }

  if (isEnding && target) {
    const targetSound = lastSound(target);
    const matching = choices.filter(c => lastSound(c) === targetSound);
    return matching.length !== 1;
  }

  return false;
}

function writeFile(path, exportName, data) {
  fs.writeFileSync(
    path,
    `export const ${exportName} = ${JSON.stringify(data, null, 2)};\n`
  );
}

const cleanedQuestions = questions.filter(q => !isBadPhonics(q));
const cleanedGenerated = generatedQuestions.filter(q => !isBadPhonics(q));

console.log("Removed from src/questions.js:", questions.length - cleanedQuestions.length);
console.log("Removed from generatedQuestions.js:", generatedQuestions.length - cleanedGenerated.length);

writeFile("src/questions.js", "questions", cleanedQuestions);
writeFile("src/data/generatedQuestions.js", "generatedQuestions", cleanedGenerated);
