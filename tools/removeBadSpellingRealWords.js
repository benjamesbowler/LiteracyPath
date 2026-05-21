import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const realWords = new Set([
  "a", "an", "the",
  "i", "you", "he", "she", "we", "they",
  "am", "is", "are", "was", "were",
  "go", "goes", "went",
  "do", "does", "did",
  "can", "will", "has", "had",
  "man", "men", "mom", "mum", "mommy",
  "dad", "boy", "girl", "child", "children",
  "dog", "cat", "pig", "cow", "duck", "goat",
  "fish", "bird", "frog", "bug", "bee",
  "sun", "moon", "star", "sky", "rain", "snow",
  "run", "ran", "sit", "sat", "sing", "sang", "song",
  "sink", "jump", "play", "read", "look",
  "map", "mat", "mad", "man",
  "pot", "pat", "pit", "pet",
  "top", "hop", "pop", "mop",
  "cup", "cap", "can", "box", "pen",
  "book", "bag", "bed", "red",
  "kite", "kit", "bike", "bake", "bite",
  "cake", "lake", "make", "take",
  "home", "house", "school", "class",
  "friend", "friends", "winter", "dock",
  "apple", "banana", "cake",
  "happy", "sad", "big", "small",
  "hot", "cold", "warm", "fast", "slow",
  "light", "dark", "full", "empty",
  "log", "fog", "tag", "rug", "plug"
]);

function isBadSpellingQuestion(q) {
  const skill = String(q.skill || "").toLowerCase();
  const question = String(q.question || "").toLowerCase();

  if (!skill.includes("spelling")) return false;
  if (!question.includes("spelled correctly")) return false;
  if (!Array.isArray(q.choices)) return true;

  const realChoices = q.choices.filter(choice =>
    realWords.has(String(choice).toLowerCase())
  );

  return realChoices.length > 1;
}

const before = generatedQuestions.length;

const cleaned = generatedQuestions.filter(q => !isBadSpellingQuestion(q));

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};\n`
);

console.log("Removed bad spelling real-word questions:", before - cleaned.length);
console.log("Remaining generated questions:", cleaned.length);
