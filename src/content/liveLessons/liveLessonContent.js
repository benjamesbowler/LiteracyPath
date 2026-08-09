import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import {
  getPresentationCycle,
  presentationSlideIndex
} from "../../utils/present/presentationBuilder.js";

export const LIVE_LESSON_SCHEMA_VERSION = 1;
export const LIVE_LESSON_EVIDENCE_PURPOSE = "diagnostic_not_mastery";

const VALID_KINDS = new Set(["grapheme_choice", "word_choice", "arrange_tiles"]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function normalizedCards(cycle) {
  const source = cycle?.focusLetters?.length ? cycle.focusLetters : cycle?.reviewLetters || [];
  return source.flatMap(raw => {
    const spelling = String(raw.spelling || raw.grapheme || raw || "").toLowerCase();
    return spelling.split(/[\s/,+]+/).filter(part => /^[a-z]{1,3}$/.test(part));
  });
}

function teachingPool(cycle, kind) {
  const cycleNumber = Number(cycle?.cycleNumber || 0);
  const eligible = elSkillsBlockCycles.filter(item => (
    item.cycleNumber && (!cycleNumber || item.cycleNumber <= cycleNumber)
  ));
  const values = kind === "grapheme_choice"
    ? eligible.flatMap(normalizedCards)
    : eligible.flatMap(item => item.highFrequencyWords || []);
  return [...new Set(values.map(value => String(value).toLowerCase()).filter(Boolean))];
}

function stableScore(seed, value) {
  let hash = 2166136261;
  for (const char of `${seed}:${value}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function choicesFor(cycle, kind, target, promptId) {
  const pool = teachingPool(cycle, kind)
    .filter(value => value !== target)
    .sort((a, b) => stableScore(promptId, a) - stableScore(promptId, b));
  const choices = [target, ...pool.slice(0, 3)];
  return choices.sort((a, b) => stableScore(`${promptId}:order`, a) - stableScore(`${promptId}:order`, b));
}

function promptInstruction(kind) {
  if (kind === "grapheme_choice") return "Tap the spelling your teacher is showing.";
  if (kind === "word_choice") return "Tap the word your teacher is showing.";
  return "Put the letter tiles in order to make the word.";
}

function shuffledTiles(target, promptId) {
  const tiles = target.split("").map((value, index) => ({ value, index }));
  tiles.sort((a, b) => stableScore(`${promptId}:${a.index}`, a.value) - stableScore(`${promptId}:${b.index}`, b.value));
  const values = tiles.map(tile => tile.value);
  if (values.length > 1 && values.join("") === target) values.push(values.shift());
  return values;
}

export function buildLiveLessonContent(cycleId, { day = "" } = {}) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown live lesson cycle");
  const slides = presentationSlideIndex(cycleId, { day });
  const prompts = slides
    .filter(slide => VALID_KINDS.has(slide.liveKind) && slide.liveTarget)
    .map(slide => {
      const target = slide.liveTarget.toLowerCase();
      const base = {
        id: slide.livePromptId,
        slideIndex: slide.index,
        kind: slide.liveKind,
        instruction: promptInstruction(slide.liveKind),
        answer: target,
        evidencePurpose: LIVE_LESSON_EVIDENCE_PURPOSE
      };
      if (slide.liveKind === "arrange_tiles") {
        return { ...base, tiles: shuffledTiles(target, slide.livePromptId) };
      }
      return { ...base, choices: choicesFor(cycle, slide.liveKind, target, slide.livePromptId) };
    });

  return deepFreeze({
    schemaVersion: LIVE_LESSON_SCHEMA_VERSION,
    contentVersion: `class-quest-live-v${LIVE_LESSON_SCHEMA_VERSION}`,
    cycleId,
    day: String(day || "").toLowerCase(),
    slideCount: slides.length,
    prompts
  });
}

export function publicLiveLessonPrompt(prompt) {
  if (!prompt) return null;
  const safe = { ...prompt };
  delete safe.answer;
  return deepFreeze({ ...safe });
}

export function isLiveLessonResponseCorrect(prompt, response) {
  if (!prompt || !VALID_KINDS.has(prompt.kind)) return false;
  const value = prompt.kind === "arrange_tiles"
    ? (Array.isArray(response) ? response.join("") : String(response || ""))
    : String(response || "");
  return value.toLowerCase() === String(prompt.answer || "").toLowerCase();
}
