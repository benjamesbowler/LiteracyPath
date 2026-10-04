import { difficultyLadder } from "../utils/curriculumLadder.js";
import { getChildWordAsset } from "./childAssets.js";

// Only the unpublished Letter Leap v2 plan changes. Global word/sentence banks
// and other games retain their established targets. Both replacements have
// exact retained recordings; each original curriculum slot remains present.
export const LETTER_LEAP_CUE_SUBSTITUTIONS = Object.freeze({ grump: "stump", robot: "rocket" });
const contexts = Object.freeze({
  "the children played happily outside": "children-play",
  "which book would you like to read": "book-choice",
  "the brave knight rode to the castle": "knight-castle",
  "a rocket landed on the red planet": "rocket-landed",
  "the dragon slept on a pile of gold": "dragon-gold",
  "we watched the rocket blast into space": "rocket-launch",
  "the owl hunts when the moon is bright": "owl-moon",
  "seeds need water and sun to grow": "seeds-grow"
});
function substitute(word) {
  const value = String(word), replacement = LETTER_LEAP_CUE_SUBSTITUTIONS[value.toLowerCase()];
  if (!replacement) return value;
  if (value === value.toUpperCase()) return replacement.toUpperCase();
  return /^[A-Z]/.test(value) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
}
export function getLetterLeapEncodingPlans(difficulty, seed = 0) {
  return difficultyLadder("letter-leap", difficulty, seed).map(plan => ({
    ...plan,
    targets: plan.mode === "sentence" ? plan.targets.map(sentence => sentence.map(substitute)) : plan.targets.map(substitute)
  }));
}
export function getLetterLeapPictureCue({ word, sentence } = {}) {
  const text = (Array.isArray(sentence) ? sentence.join(" ") : String(sentence || "")).toLowerCase()
    .replace(/[.?!]+$/, "").trim().replace(/\s+/g, " ");
  if (text) {
    const id = contexts[text];
    return { pictures: id ? [`/images/child-mode/reviewed/letter-leap/${id}.webp`] : [], pictureKind: "sentence-context" };
  }
  const asset = getChildWordAsset(word);
  const image = String(word || "").toLowerCase() === "stump"
    ? "/images/child-mode/reviewed/letter-leap/stump.webp" : asset?.image;
  return { pictures: image ? [image] : [], pictureKind: "word" };
}
