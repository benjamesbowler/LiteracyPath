import { getChildWordAsset } from "../../../data/childAssets.js";
import { getPronunciation, getWordMeaning } from "../content/pronunciationLexicon.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { MORPHOLOGY_TEACH_EXAMPLES, SOUND_SEEKERS_TEACH_TARGETS } from "../content/teachTargetMetadata.js";
import { graphemeLabel } from "../../../utils/questLabels.js";
import { getPreferredPhonemeAudioPath } from "../../../data/phonemeAudioBank.js";

const INSTRUCTION_BY_KIND = Object.freeze({
  blend: "consonant-blend-teach",
  alt: "alternative-value-teach",
  morph: "morphology-teach",
  digraph: "letter-team-teach",
  double: "letter-team-teach",
  split: "letter-team-teach",
  team: "letter-team-teach",
  "r-controlled": "letter-team-teach",
  suffix: "letter-team-teach"
});

function targetIds(values) {
  return new Set((Array.isArray(values) ? values : []).map(value => String(value || "").trim()).filter(Boolean));
}

function instructionFor(entry) {
  return getInstructionContract(INSTRUCTION_BY_KIND[entry.kind] || "single-sound-teach");
}

function targetMetadata(entry) {
  const metadata = SOUND_SEEKERS_TEACH_TARGETS[entry.id];
  if (!metadata && entry.kind !== "morph") throw new Error(`${entry.id}: missing authored canonical teaching anchor`);
  return metadata || null;
}

function childLabel(entry, metadata) {
  const label = graphemeLabel(entry.id);
  if (entry.kind === "morph") return label;
  return `${label} in ${metadata.word}`;
}

function formationCue(entry) {
  if (entry.kind === "morph") return "Add this ending to the end of a word.";
  if (entry.kind === "blend") return "Keep both sounds clean, then slide them together.";
  if (entry.kind === "alt") return "Look at the word to see which sound the letters show.";
  if (["digraph", "double", "split", "team", "r-controlled", "suffix"].includes(entry.kind)) {
    return "Keep these letters together as you say the sound.";
  }
  return "Say the sound clearly. Do not add uh.";
}

function anchorVisual(entry, metadata) {
  const morphologyExample = MORPHOLOGY_TEACH_EXAMPLES[entry.id];
  const word = morphologyExample?.derived || metadata?.word;
  const asset = getChildWordAsset(word);
  if (asset?.image) return Object.freeze({ kind: "image", id: asset.image, word });
  const meaning = getWordMeaning(getPronunciation(word)?.meaningId);
  if (meaning?.reference?.id) return Object.freeze({ ...meaning.reference, word });
  throw new Error(`${entry.id}: authored anchor ${word || "(none)"} has no child-safe visual`);
}

function targetAudioPlan(entry, metadata) {
  if (entry.kind === "morph") return Object.freeze({ targetAudio: null, targetAudioSequence: Object.freeze([]), targetAudioAlternates: Object.freeze([]) });
  const targetAudio = entry.kind === "blend" ? "" : getPreferredPhonemeAudioPath(metadata.cueKey || entry.id, { anchor: metadata.word });
  const targetAudioAlternates = Object.freeze((metadata.alternates || []).map(alternate => {
    const alternateAudio = getPreferredPhonemeAudioPath(alternate.cueKey, { anchor: alternate.word });
    if (!alternateAudio) throw new Error(`${entry.id}:${alternate.word} has no approved alternate teaching cue`);
    return Object.freeze({ word: alternate.word, targetAudio: alternateAudio });
  }));
  if (targetAudio) return Object.freeze({ targetAudio, targetAudioSequence: Object.freeze([]), targetAudioAlternates });
  if (entry.kind !== "blend") throw new Error(`${entry.id}: no approved teaching cue`);
  const targetAudioSequence = metadata.units
    .map(unit => getPreferredPhonemeAudioPath(unit.soundKey, { anchor: metadata.word }))
    .filter(Boolean);
  if (targetAudioSequence.length !== metadata.units.length) throw new Error(`${entry.id}: blend needs every component cue`);
  return Object.freeze({ targetAudio: null, targetAudioSequence: Object.freeze(targetAudioSequence), targetAudioAlternates });
}

function morphologyAlternates(entry) {
  const example = MORPHOLOGY_TEACH_EXAMPLES[entry.id];
  return Object.freeze((example?.alternates || []).map(alternate => Object.freeze({
    childText: `${alternate.base} + ${graphemeLabel(entry.id)} → ${alternate.derived}: ${alternate.meaning}.`,
    anchorWord: alternate.derived,
    anchorEvidence: Object.freeze({ units: alternate.units }),
    wordAudio: getChildWordAsset(alternate.derived)?.audio || null
  })));
}

function workedExample(entry, metadata) {
  const morphologyExample = MORPHOLOGY_TEACH_EXAMPLES[entry.id];
  if (morphologyExample) {
    return `${morphologyExample.base} + ${graphemeLabel(entry.id)} → ${morphologyExample.derived}: ${morphologyExample.meaning}.`;
  }
  if (entry.kind === "blend") {
    return `Say ${metadata.units.map(unit => unit.grapheme).join(", then ")} together in ${metadata.word}.`;
  }
  return `Find ${graphemeLabel(entry.id)} in ${metadata.word}.`;
}

function teachItem(stop, entry) {
  const metadata = targetMetadata(entry);
  const morphologyExample = MORPHOLOGY_TEACH_EXAMPLES[entry.id];
  const instruction = instructionFor(entry);
  const audioPlan = targetAudioPlan(entry, metadata);
  return Object.freeze({
    stopId: stop.id,
    targetId: entry.id,
    scored: false,
    instructionId: instruction.instructionId,
    childText: instruction.childText,
    childAudio: instruction.childAudio,
    ...audioPlan,
    graphemeDisplay: graphemeLabel(entry.id),
    childLabel: childLabel(entry, metadata),
    mouthCue: formationCue(entry),
    morphologyCue: entry.kind === "morph"
      ? "This ending changes or extends a word."
      : "This spelling helps us read a word.",
    anchorWord: metadata?.word || morphologyExample.derived,
    anchorEvidence: Object.freeze({ units: Object.freeze(metadata?.units || []) }),
    anchorImage: anchorVisual(entry, metadata),
    workedExample: workedExample(entry, metadata),
    alternateExamples: morphologyAlternates(entry)
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
