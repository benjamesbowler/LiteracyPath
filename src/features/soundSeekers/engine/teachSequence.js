import { getChildWordAsset } from "../../../data/childAssets.js";
import { PHONEME_RECORDING_TARGET_BY_KEY } from "../../../data/phonemeRecordingSpec.js";
import { getPronunciation, getWordMeaning } from "../content/pronunciationLexicon.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { graphemeLabel } from "../../../utils/questLabels.js";
import { getPreferredPhonemeAudioPath } from "../../../data/phonemeAudioBank.js";

const DISPLAY_BY_TARGET = Object.freeze({
  y_ie: "y as in my",
  y_ee: "y as in happy",
  oo_short: "oo as in book",
  ow_ou: "ow as in cow",
  c_s: "c as in city",
  g_j: "g as in gem",
  ch_k: "ch as in school",
  ea_e: "ea as in bread",
  a_e: "a-e as in cake",
  e_e: "e-e as in theme",
  i_e: "i-e as in bike",
  o_e: "o-e as in home",
  u_e: "u-e as in cube",
  le: "le as in little",
  tion: "tion as in action"
});

const MORPHOLOGY_EXAMPLES = Object.freeze({
  suffix_s: Object.freeze({ base: "cat", derived: "cats", meaning: "more than one cat" }),
  suffix_ing: Object.freeze({ base: "jump", derived: "jumping", meaning: "happening now" }),
  suffix_ed: Object.freeze({ base: "jump", derived: "jumped", meaning: "already happened" })
});

function targetIds(values) {
  return new Set((Array.isArray(values) ? values : []).map(value => String(value || "").trim()).filter(Boolean));
}

function childLabel(entry) {
  const target = PHONEME_RECORDING_TARGET_BY_KEY[entry.id];
  const label = graphemeLabel(entry.id);
  if (entry.kind === "morph") return label;
  if (DISPLAY_BY_TARGET[entry.id]) return DISPLAY_BY_TARGET[entry.id];
  return `${label} as in ${target?.anchor?.split(";")[0] || label}`;
}

function formationCue(entry) {
  if (entry.kind === "morph") return "Add this ending to the end of a word.";
  const direction = PHONEME_RECORDING_TARGET_BY_KEY[entry.id]?.direction || "";
  if (/continuous|hold naturally|steady/i.test(direction)) return "Keep the sound smooth. Do not add uh.";
  if (/vowel|long|short/i.test(direction)) return "Open your mouth and say the sound clearly.";
  if (/blend|join/i.test(direction)) return "Say the sounds together without adding uh.";
  return "Say the sound quickly and clearly. Do not add uh.";
}

function anchorVisual(stop, entry) {
  const morphologyExample = MORPHOLOGY_EXAMPLES[entry.id];
  if (morphologyExample) {
    const asset = getChildWordAsset(morphologyExample.derived);
    if (asset?.image) return Object.freeze({ kind: "image", id: asset.image, word: morphologyExample.derived });
  }
  const recordingAnchor = PHONEME_RECORDING_TARGET_BY_KEY[entry.id]?.anchor?.split(";")[0]?.trim();
  const candidates = [recordingAnchor, ...(stop.words || [])].filter(Boolean);
  for (const word of candidates) {
    const asset = getChildWordAsset(word);
    if (asset?.image) return Object.freeze({ kind: "image", id: asset.image, word });
  }
  for (const word of candidates) {
    const meaning = getWordMeaning(getPronunciation(word)?.meaningId);
    if (meaning?.reference?.id) return Object.freeze({ ...meaning.reference, word });
  }
  throw new Error(`${stop.id}:${entry.id} has no authored child-safe anchor visual`);
}

function teachItem(stop, entry) {
  const label = childLabel(entry);
  const anchor = anchorVisual(stop, entry);
  const morphologyExample = MORPHOLOGY_EXAMPLES[entry.id];
  const instruction = getInstructionContract(entry.kind === "morph" ? "morphology-teach" : "echo-search-teach");
  return Object.freeze({
    stopId: stop.id,
    targetId: entry.id,
    scored: false,
    instructionId: instruction.instructionId,
    childText: instruction.childText,
    childAudio: instruction.childAudio,
    targetAudio: entry.kind === "morph" ? null : getPreferredPhonemeAudioPath(entry.id, { anchor: anchor.word }) || null,
    graphemeDisplay: graphemeLabel(entry.id),
    childLabel: label,
    mouthCue: formationCue(entry),
    morphologyCue: entry.kind === "morph"
      ? "This ending changes or extends a word."
      : "This is a sound pattern, not a word ending.",
    anchorImage: anchor,
    workedExample: entry.kind === "morph"
      ? `${morphologyExample.base} + ${graphemeLabel(entry.id)} → ${morphologyExample.derived}: ${morphologyExample.meaning}.`
      : `Listen for this sound in ${anchor.word}.`
  });
}

function normalizeIndex(value, length) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index <= length ? index : 0;
}

export function createTeachSequence(stop, taughtTargetIds = [], checkpoint = null) {
  const known = targetIds(taughtTargetIds);
  const items = (stop?.teach || []).filter(entry => entry?.id && !known.has(entry.id)).map(entry => teachItem(stop, entry));
  const teachIndex = normalizeIndex(checkpoint?.teachIndex, items.length);
  return Object.freeze({
    stopId: stop?.id || null,
    items: Object.freeze(items),
    teachIndex,
    currentItem: items[teachIndex] || null,
    nextPhase: "challenge",
    scored: false
  });
}

export function reduceTeachSequence(state, input = {}) {
  const current = state && typeof state === "object" ? state : createTeachSequence(null);
  if (input.type === "replay") return current;
  if (input.type === "restore") {
    const teachIndex = normalizeIndex(input.checkpoint?.teachIndex, current.items.length);
    return Object.freeze({ ...current, teachIndex, currentItem: current.items[teachIndex] || null, scored: false });
  }
  if (input.type === "complete-teach") {
    const teachIndex = Math.min(current.items.length, current.teachIndex + 1);
    return Object.freeze({ ...current, teachIndex, currentItem: current.items[teachIndex] || null, scored: false });
  }
  return current;
}
