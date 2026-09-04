import { QUEST_STOPS } from "../../../data/questSequence.js";
import { graphemeLabel } from "../../../utils/questLabels.js";
import { SOUND_SEEKERS_HEART_WORDS } from "./heartWords.js";
import { MEANING_SUPPORT_RECORDS } from "./meaningSupportRecords.js";
import { getPronunciation } from "./pronunciationLexicon.js";
import { SOUND_SEEKERS_TEACH_TARGETS } from "./teachTargetMetadata.js";

const INTERNAL_LABEL_PATTERN = /(?:_[a-z]|:contrast|\?…\?|\b(?:choice|decoy|placeholder|sample)\s*[-_:]?\s*\d*\b)/iu;

const TARGET_RECORDS = Object.freeze(QUEST_STOPS.flatMap(stop => stop.teach.map((target, index) => Object.freeze({
  ...target,
  stopId: stop.id,
  stopIndex: stop.index,
  curriculumIndex: (stop.index * 100) + index
}))));
const TARGET_BY_ID = new Map(TARGET_RECORDS.map(record => [record.id, record]));
const STOP_INDEX_BY_ID = new Map(QUEST_STOPS.map(stop => [stop.id, stop.index]));
const MEANING_BY_WORD_ID = new Map(MEANING_SUPPORT_RECORDS.map(record => [record.wordId, record]));
const HEART_WORD_BY_ID = new Map(SOUND_SEEKERS_HEART_WORDS.map(record => [record.wordId, record]));
const WORD_FIRST_STOP = new Map();

for (const stop of QUEST_STOPS) {
  for (const word of stop.words) {
    if (!WORD_FIRST_STOP.has(word)) WORD_FIRST_STOP.set(word, stop.index);
  }
}

const WORD_PATTERN_CHOICES = Object.freeze({
  rock: Object.freeze([
    Object.freeze({ token: "rock", label: "ck ending" }),
    Object.freeze({ token: "rich", label: "ch ending" }),
    Object.freeze({ token: "kit", label: "k at the start" })
  ]),
  rain: Object.freeze([
    Object.freeze({ token: "rain", label: "ai pattern" }),
    Object.freeze({ token: "play", label: "ay pattern" }),
    Object.freeze({ token: "cake", label: "a–e pattern" })
  ]),
  sound: Object.freeze([
    Object.freeze({ token: "sound", label: "ou pattern" }),
    Object.freeze({ token: "cow", label: "ow pattern" }),
    Object.freeze({ token: "moon", label: "oo pattern" })
  ]),
  hear: Object.freeze([
    Object.freeze({ token: "hear", label: "ear pattern" }),
    Object.freeze({ token: "chair", label: "air pattern" }),
    Object.freeze({ token: "care", label: "are pattern" })
  ]),
  cats: Object.freeze([
    Object.freeze({ token: "cats", label: "more than one — add s" }),
    Object.freeze({ token: "cat", label: "one — no ending" }),
    Object.freeze({ token: "called", label: "already happened — add ed" })
  ])
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function normalizedSeed(seed) {
  return Number.isInteger(seed) ? seed : 0;
}

function textHash(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rotated(values, seed, salt = "") {
  if (values.length === 0) return [];
  const offset = Math.abs(normalizedSeed(seed) + textHash(salt)) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function stopIndex(stopId) {
  const index = STOP_INDEX_BY_ID.get(String(stopId || "").trim());
  if (!Number.isInteger(index)) throw new Error(`${stopId || "(none)"}: child choice content needs a canonical stop`);
  return index;
}

function targetSoundSignature(targetId) {
  const metadata = SOUND_SEEKERS_TEACH_TARGETS[targetId];
  if (metadata) return String(metadata.cueKey || metadata.units.map(unit => unit.soundKey).join("+"));
  const target = TARGET_BY_ID.get(targetId);
  if (!target) return null;
  return `target:${target.kind}:${graphemeLabel(targetId)}`;
}

function targetChoiceLabel(targetId) {
  const metadata = SOUND_SEEKERS_TEACH_TARGETS[targetId];
  const label = graphemeLabel(targetId);
  if (!label) throw new Error(`${targetId}: child sound choice is missing its teaching anchor`);
  if (metadata?.word) return `${label} in ${metadata.word}`;
  const target = TARGET_BY_ID.get(targetId);
  if (target?.kind === "morph") return `${label} ending in a word`;
  return `${label} sound`;
}

function cleanMeaningLabel(record) {
  const word = record.wordId.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const label = record.childDefinition
    .replace(new RegExp(`^(?:a|an|the)\\s+${word}\\s+(?:is|means)\\s+`, "iu"), "")
    .replace(new RegExp(`^${word}\\s+(?:is|means)\\s+`, "iu"), "")
    .replace(new RegExp(`^${word}\\s+`, "iu"), "")
    .replace(/[.!?]+$/u, "")
    .trim();
  if (!label) throw new Error(`${record.wordId}: child meaning choice is empty`);
  return `${label[0].toLocaleUpperCase("en-US")}${label.slice(1)}`;
}

function assertClearOptions(options, expectedToken, label) {
  if (!Array.isArray(options) || options.length < 2) throw new Error(`${label}: at least two real choices are required`);
  const tokens = options.map(option => option?.token);
  const labels = options.map(option => String(option?.label || "").trim());
  if (tokens.some(token => (typeof token !== "string" && typeof token !== "number") || String(token).length === 0)
    || new Set(tokens).size !== tokens.length
    || tokens.filter(token => token === expectedToken).length !== 1) {
    throw new Error(`${label}: choices need distinct tokens and exactly one expected token`);
  }
  if (labels.some(value => !value || INTERNAL_LABEL_PATTERN.test(value))
    || new Set(labels.map(value => value.toLocaleLowerCase("en-US"))).size !== labels.length) {
    throw new Error(`${label}: choices need distinct child labels with no internal syntax`);
  }
  return deepFreeze(options.map(option => ({ token: option.token, label: option.label })));
}

function orderedTargetCandidates(targetId, requestedStopId, seed, excludedTargetIds) {
  const target = TARGET_BY_ID.get(targetId);
  const targetLabel = targetChoiceLabel(targetId);
  const targetSignature = targetSoundSignature(targetId);
  const maximumStopIndex = stopIndex(requestedStopId);
  const excluded = new Set([targetId, ...(excludedTargetIds || [])]);
  return rotated(TARGET_RECORDS
    .filter(record => record.stopIndex <= maximumStopIndex && !excluded.has(record.id))
    .filter(record => targetSoundSignature(record.id) !== targetSignature)
    .filter(record => targetChoiceLabel(record.id).toLocaleLowerCase("en-US")
      !== targetLabel.toLocaleLowerCase("en-US"))
    .sort((left, right) => Number(right.kind === target.kind) - Number(left.kind === target.kind)
      || Math.abs(left.curriculumIndex - target.curriculumIndex)
        - Math.abs(right.curriculumIndex - target.curriculumIndex)
      || left.id.localeCompare(right.id)), seed, targetId);
}

export function childSoundChoiceLabel(targetId) {
  return targetChoiceLabel(targetId);
}

export function createSoundTargetChoices({ targetId, stopId, seed = 0, count = 3,
  excludedTargetIds = [] } = {}) {
  const target = TARGET_BY_ID.get(targetId);
  if (!target) throw new Error(`${targetId || "(none)"}: unknown Sound Seekers target`);
  const requestedCount = Math.max(2, Math.floor(Number(count) || 3));
  const candidates = orderedTargetCandidates(targetId, stopId, seed, excludedTargetIds);
  const selected = candidates.slice(0, requestedCount - 1);
  if (selected.length < requestedCount - 1) {
    throw new Error(`${targetId}: not enough taught, sound-distinct distractors at ${stopId}`);
  }
  const options = [target, ...selected].map(record => ({
    token: record.id,
    label: targetChoiceLabel(record.id)
  }));
  return assertClearOptions(rotated(options, seed, `position:${targetId}`), targetId,
    `${stopId}:${targetId} sound choices`);
}

export function createWordMeaningChoices({ wordId, stopId, seed = 0, count = 3 } = {}) {
  const expected = MEANING_BY_WORD_ID.get(String(wordId || "").trim().toLocaleLowerCase("en-US"));
  if (!expected || !getPronunciation(expected.wordId)) {
    throw new Error(`${wordId || "(none)"}: word meaning choice is not authored`);
  }
  const requestedCount = Math.max(2, Math.floor(Number(count) || 3));
  const maximumStopIndex = stopIndex(stopId);
  const candidates = rotated(MEANING_SUPPORT_RECORDS
    .filter(record => record.wordId !== expected.wordId)
    .filter(record => Number.isInteger(WORD_FIRST_STOP.get(record.wordId))
      && WORD_FIRST_STOP.get(record.wordId) <= maximumStopIndex)
    .filter(record => getPronunciation(record.wordId))
    .sort((left, right) => Math.abs(left.wordId.length - expected.wordId.length)
      - Math.abs(right.wordId.length - expected.wordId.length)
      || left.wordId.localeCompare(right.wordId)), seed, expected.wordId)
    .slice(0, requestedCount - 1);
  if (candidates.length === 0) throw new Error(`${wordId}: no taught meaning distractor is available at ${stopId}`);
  const options = [expected, ...candidates].map(record => ({
    token: record.wordId,
    label: cleanMeaningLabel(record)
  }));
  return assertClearOptions(rotated(options, seed, `meaning:${expected.wordId}`), expected.wordId,
    `${stopId}:${expected.wordId} meaning choices`);
}

export function createWordPatternChoices({ wordId, seed = 0 } = {}) {
  const normalizedWordId = String(wordId || "").trim().toLocaleLowerCase("en-US");
  const authored = WORD_PATTERN_CHOICES[normalizedWordId];
  if (!authored || authored.some(option => !getPronunciation(option.token))) {
    throw new Error(`${wordId || "(none)"}: word-pattern contrasts are not authored`);
  }
  return assertClearOptions(rotated(authored, seed, `pattern:${normalizedWordId}`), normalizedWordId,
    `${normalizedWordId} pattern choices`);
}

export function createWordForgeRack({ wordId, expectedTargetId, stopId, seed = 0 } = {}) {
  const pronunciation = getPronunciation(wordId);
  if (!pronunciation || !pronunciation.units.some(unit => unit.evidenceTargetId === expectedTargetId)) {
    throw new Error(`${wordId || "(none)"}: forge rack does not contain its expected sound target`);
  }
  const unitTargetIds = pronunciation.units.map(unit => unit.evidenceTargetId);
  const unitLabels = pronunciation.units.map(unit => graphemeLabel(unit.grapheme));
  const decoy = orderedTargetCandidates(expectedTargetId, stopId, seed, unitTargetIds)
    .find(record => !unitLabels.includes(graphemeLabel(record.id)));
  if (!decoy) throw new Error(`${wordId}: no real forge distractor is available at ${stopId}`);
  const rack = pronunciation.units.map((unit, index) => ({
    token: unit.evidenceTargetId,
    label: graphemeLabel(unit.grapheme),
    unitIndex: index,
    needed: true
  }));
  rack.push({ token: decoy.id, label: graphemeLabel(decoy.id), unitIndex: null, needed: false });
  if (rack.some(tile => !tile.label || INTERNAL_LABEL_PATTERN.test(tile.label))
    || rack.at(-1).label === rack.find(tile => tile.needed)?.label
    || unitLabels.includes(rack.at(-1).label)) {
    throw new Error(`${wordId}: forge rack exposes an unclear or duplicate decoy`);
  }
  return deepFreeze(rotated(rack, seed, `forge:${wordId}:${expectedTargetId}`));
}

function heartWordCandidates(record, stopId, activityType, seed) {
  const maximumStopIndex = stopIndex(stopId);
  const stopIndexById = new Map(QUEST_STOPS.map(stop => [stop.id, stop.index]));
  const heartCandidates = SOUND_SEEKERS_HEART_WORDS
    .filter(candidate => candidate.wordId !== record.wordId)
    .filter(candidate => stopIndexById.get(candidate.introductionStopId) <= maximumStopIndex)
    .filter(candidate => candidate.eligibleActivityTypes.includes(activityType))
    .map(candidate => ({
      token: candidate.answerTokensByActivity[activityType],
      label: candidate.display
    }));
  const decodableCandidates = QUEST_STOPS
    .filter(stop => stop.index <= maximumStopIndex)
    .flatMap(stop => stop.words)
    .filter(word => word !== record.wordId && !HEART_WORD_BY_ID.has(word))
    .map(word => ({ token: `word:${word}`, label: word }));
  return rotated([...heartCandidates, ...decodableCandidates]
    .filter((option, index, values) => values.findIndex(candidate => candidate.label.toLocaleLowerCase("en-US")
      === option.label.toLocaleLowerCase("en-US")) === index), seed, `heart:${record.wordId}:${activityType}`);
}

export function createHeartWordChoices({ record, activityType, stopId, seed = 0, count = 3 } = {}) {
  if (!record || !record.eligibleActivityTypes?.includes(activityType)) {
    throw new Error(`${record?.wordId || "(none)"}: heart-word activity is not eligible`);
  }
  const expectedToken = record.answerTokensByActivity[activityType];
  const requestedCount = Math.max(2, Math.floor(Number(count) || 3));
  const candidates = heartWordCandidates(record, stopId, activityType, seed).slice(0, requestedCount - 1);
  if (candidates.length < requestedCount - 1) {
    throw new Error(`${record.wordId}: not enough real heart-word distractors at ${stopId}`);
  }
  const options = [{ token: expectedToken, label: record.display }, ...candidates];
  return assertClearOptions(rotated(options, seed, `heart-position:${record.wordId}:${activityType}`),
    expectedToken, `${stopId}:${record.wordId} heart-word choices`);
}

export function assertChildChoiceLabel(value, source = "child choice") {
  const label = String(value || "").trim();
  if (!label || INTERNAL_LABEL_PATTERN.test(label)) {
    throw new Error(`${source}: child label is empty or exposes internal syntax`);
  }
  return label;
}
