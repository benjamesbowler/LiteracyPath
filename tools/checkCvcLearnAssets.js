import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { cvcWordFamilies, getCvcWordParts, getGraphemeAudioPath } from "../src/data/cvcWordFamilies.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import { DEFERRED_ATOMIC_SOUND_KEYS } from "../src/data/phonemeAudioBank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const missing = [];
const deferred = new Set();

function publicPathExists(assetPath) {
  if (!assetPath || !assetPath.startsWith("/")) return false;
  return fs.existsSync(path.join(publicRoot, assetPath));
}

function checkWord(word) {
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  if (!asset?.image || !publicPathExists(asset.image)) {
    missing.push(`image for "${word}" (${asset?.image || "none"})`);
  }
  if (!asset?.audio || !publicPathExists(asset.audio)) {
    missing.push(`audio for "${word}" (${asset?.audio || "none"})`);
  }
}

function checkGrapheme(letter, vowel) {
  const audioPath = getGraphemeAudioPath(letter, vowel);
  if (!publicPathExists(audioPath)) {
    const sound = String(vowel || letter || "").toLowerCase();
    if (DEFERRED_ATOMIC_SOUND_KEYS.includes(sound)) {
      deferred.add(sound);
      return;
    }
    missing.push(`grapheme audio for "${letter}" (${audioPath})`);
  }
}

for (const family of cvcWordFamilies) {
  const words = [...new Set([...family.buildWords, ...family.magicSwaps])];
  for (const word of words) {
    checkWord(word);
    const { onset, rimeLetters } = getCvcWordParts(word, family.rime);
    for (const letter of [...onset.split(""), ...rimeLetters]) {
      checkGrapheme(letter, letter === family.vowel ? family.vowel : "");
    }
  }

  for (const letter of family.distractorLetters) {
    checkGrapheme(letter);
  }
}

if (missing.length > 0) {
  console.error("Missing CVC Learn assets:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`CVC Learn asset check passed for ${cvcWordFamilies.length} word families.`);
if (deferred.size) {
  console.warn(`Known silent sounds awaiting a new recording: ${[...deferred].sort().join(", ")}.`);
}
