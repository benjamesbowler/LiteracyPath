import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { lessons } from "../src/data/phonicsLessons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const failures = [];
const warnings = [];

function publicPathExists(url) {
  return Boolean(
    url &&
    String(url).startsWith("/") &&
    fs.existsSync(path.join(rootDir, "public", String(url).replace(/^\//, "")))
  );
}

function checkAsset({ kind, url, label, required = true }) {
  if (publicPathExists(url)) return;
  const message = `${label} ${kind} missing: ${url || "(empty)"}`;
  if (required) failures.push(message);
  else warnings.push(message);
}

const letters = lessons.flatMap(lessonGroup => lessonGroup.letters || []);

for (const lesson of letters) {
  checkAsset({
    kind: "phonic audio",
    url: lesson.phonicAudio,
    label: `Letter ${lesson.letter}`,
    required: false
  });

  for (const word of [...(lesson.words || []), ...(lesson.distractors || [])]) {
    const label = `Letter ${lesson.letter} word "${word.word}"`;
    checkAsset({ kind: "image", url: word.image, label });
    checkAsset({ kind: "audio", url: word.audio, label });
  }
}

const summary = {
  letters: letters.length,
  targetWords: letters.reduce((count, lesson) => count + (lesson.words?.length || 0), 0),
  distractors: letters.reduce((count, lesson) => count + (lesson.distractors?.length || 0), 0),
  warnings: warnings.length,
  failures: failures.length
};

if (warnings.length) {
  console.warn("Phonics Learn media warnings:");
  warnings.forEach(message => console.warn(`- ${message}`));
}

if (failures.length) {
  console.error("Phonics Learn media check failed:");
  failures.forEach(message => console.error(`- ${message}`));
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(`Phonics Learn media check passed: ${summary.letters} letters, ${summary.targetWords} target words, ${summary.distractors} distractors.`);
if (warnings.length) console.log(`${warnings.length} optional audio warning${warnings.length === 1 ? "" : "s"} reported.`);
