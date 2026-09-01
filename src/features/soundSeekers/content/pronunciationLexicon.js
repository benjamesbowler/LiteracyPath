import { getPreferredPhonemeAudioPath } from "../../../data/phonemeAudioBank.js";
import { PRONUNCIATION_RECORDS } from "./pronunciationRecords.js";
import { WORD_MEANINGS } from "./wordMeanings.js";

const normalizeWordId = value => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/^hw:/, "");

export const PRONUNCIATION_AUDIO_BLOCKER = "release_blocked_missing_instructional_audio";

export const SOUND_SEEKERS_WORDS = Object.freeze(Object.values(PRONUNCIATION_RECORDS));

export function getPronunciation(wordId) {
  return PRONUNCIATION_RECORDS[normalizeWordId(wordId)] || null;
}

export function getWordMeaning(meaningId) {
  return WORD_MEANINGS[String(meaningId || "").trim()] || null;
}

function assertMeaning(record) {
  const meaning = getWordMeaning(record.meaningId);
  if (!meaning) throw new Error(`${record.id}: missing meaning ${record.meaningId || "(none)"}`);
  for (const field of ["sense", "actionCue", "partOfSpeech", "ageBand"]) {
    if (!String(meaning[field] || "").trim()) throw new Error(`${record.id}: meaning is missing ${field}`);
  }
  if (!meaning.reference || !["image", "action"].includes(meaning.reference.kind) || !meaning.reference.id) {
    throw new Error(`${record.id}: meaning is missing an image/action reference`);
  }
}

function assertUnitAudio(record, unit, unitIndex) {
  const approvedPath = getPreferredPhonemeAudioPath(unit.soundKey, { anchor: record.word });
  const blocker = String(unit.releaseBlockingStatus || "").trim();
  if (approvedPath) {
    if (blocker) throw new Error(`${record.id}: unit ${unitIndex} has approved audio and must clear its release blocker`);
    return;
  }
  if (blocker === PRONUNCIATION_AUDIO_BLOCKER) return;
  if (blocker) {
    throw new Error(`${record.id}: unit ${unitIndex} has invalid release blocker "${blocker}" for sound key "${unit.soundKey || ""}"`);
  }
  throw new Error(`${record.id}: unit ${unitIndex} has unknown or unapproved audio sound key "${unit.soundKey || ""}"`);
}

function assertNoFallback(record) {
  if (
    record.generatedFallback === true
    || record.runtimeDerived === true
    || record.fallback === true
    || record.source === "generated-fallback"
  ) {
    throw new Error(`${record.id || record.word || "record"}: generated fallback markers are forbidden in shipping content`);
  }
}

function assertRecord(record, seenIds) {
  if (!record || typeof record !== "object") throw new Error("pronunciation record must be an object");
  assertNoFallback(record);

  const id = normalizeWordId(record.id);
  const word = normalizeWordId(record.word);
  if (!id || !word || id !== word) throw new Error(`${record.id || "record"}: word id must equal its normalized word`);
  if (seenIds.has(id)) throw new Error(`${id}: duplicate word id`);
  seenIds.add(id);

  if (!Array.isArray(record.units) || record.units.length === 0) throw new Error(`${id}: missing pronunciation units`);
  if (!Array.isArray(record.tags) || record.tags.length === 0) throw new Error(`${id}: missing shipping tags`);
  if (!Array.isArray(record.taughtAt) || record.taughtAt.length === 0) throw new Error(`${id}: missing taughtAt provenance`);
  if (!String(record.pronunciation || "").trim()) throw new Error(`${id}: missing pronunciation label`);

  const claimed = new Map();
  record.units.forEach((unit, unitIndex) => {
    if (!unit || typeof unit !== "object") throw new Error(`${id}: unit ${unitIndex} is not a record`);
    if (!String(unit.grapheme || "").trim()) throw new Error(`${id}: unit ${unitIndex} is missing grapheme`);
    if (!String(unit.soundKey || "").trim()) throw new Error(`${id}: unit ${unitIndex} is missing sound key`);
    if (!String(unit.role || "").trim()) throw new Error(`${id}: unit ${unitIndex} is missing role`);
    if (!Array.isArray(unit.letterIndices) || unit.letterIndices.length === 0) {
      throw new Error(`${id}: unit ${unitIndex} is missing letter indices`);
    }

    for (const index of unit.letterIndices) {
      if (!Number.isInteger(index) || index < 0 || index >= word.length) {
        throw new Error(`${id}: unit ${unitIndex} has invalid letter index ${index}`);
      }
      if (claimed.has(index)) {
        throw new Error(`${id}: overlapping letter index ${index} in units ${claimed.get(index)} and ${unitIndex}`);
      }
      claimed.set(index, unitIndex);
    }

    const printedLetters = unit.grapheme.replace(/[^a-z]/g, "");
    const indexedLetters = unit.letterIndices.map(index => word[index]).join("");
    if (printedLetters !== indexedLetters) {
      throw new Error(`${id}: unit ${unitIndex} grapheme "${unit.grapheme}" does not match its letter indices`);
    }
    assertUnitAudio(record, unit, unitIndex);
  });

  const uncovered = [...word].map((_, index) => index).filter(index => !claimed.has(index));
  if (uncovered.length) throw new Error(`${id}: uncovered letter indices ${uncovered.join(", ")}`);
  assertMeaning(record);
}

export function assertShippingPronunciationLexicon(content, { release = false } = {}) {
  if (!Array.isArray(content) || content.length === 0) throw new Error("shipping pronunciation content must be a non-empty array");
  const seenIds = new Set();
  for (const record of content) assertRecord(record, seenIds);
  if (release) {
    const blockers = content.flatMap(record => record.units
      .filter(unit => unit.releaseBlockingStatus === PRONUNCIATION_AUDIO_BLOCKER)
      .map(unit => `${record.id}:${unit.grapheme}:${unit.soundKey}`));
    if (blockers.length) {
      throw new Error(`pronunciation release blockers (${blockers.length}): ${blockers.join(", ")}`);
    }
  }
  return true;
}
