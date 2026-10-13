import { availableWorksheetTypes, WORKSHEET_TYPES } from "./worksheetBuilder.js";

// A suggestion chooses an existing recipe; it never changes its taught-content
// pool or treats a printed practice sheet as assessment evidence.
export function suggestWorksheetActivity({ cycle, focusId = "" } = {}) {
  if (!cycle) return null;
  const available = new Set(availableWorksheetTypes(cycle));
  const focus = String(focusId).toLowerCase().replace(/[_-]/g, " ");
  const letters = (cycle.focusLetters?.length ? cycle.focusLetters : cycle.reviewLetters || [])
    .map(item => item.grapheme).filter(Boolean).join(", ");
  const words = (cycle.highFrequencyWords || []).join(", ");
  const candidates = [
    ...(/sight|high frequency|heart word/.test(focus) ? ["sightWords"] : []),
    ...(/handwriting|letter formation|letter name/.test(focus) ? ["letterFormation"] : []),
    ...(/sentence|composition/.test(focus) ? ["sentenceBuilder"] : []),
    ...(/fluency|pattern/.test(focus) ? ["patternFluency"] : []),
    ...(/blend|spell|segment|decod|word/.test(focus) ? ["wordBuilding"] : []),
    ...(cycle.cycleNumber >= 25 ? ["patternFluency"] : []),
    ...(!cycle.focusLetters?.length && words ? ["sightWords"] : []),
    "wordBuilding", "letterFormation", "sightWords", "sentenceBuilder"
  ];
  const type = candidates.find(id => available.has(id));
  if (!type) return null;
  const reason = {
    wordBuilding: `Build and spell words with pictures and spellings taught through Cycle ${cycle.cycleNumber}.`,
    letterFormation: `Practise this cycle’s ${cycle.focusLetters?.length ? "focus" : "review"} letters and spellings: ${letters}.`,
    sightWords: `Read and write this cycle’s high-frequency words: ${words}.`,
    patternFluency: `Read and write the sound patterns practised in Cycle ${cycle.cycleNumber}.`,
    sentenceBuilder: `Build sentences from Cycle ${cycle.cycleNumber} content, with a model before independent writing.`
  }[type];
  return { type, label: WORKSHEET_TYPES.find(item => item.id === type).label, reason, cycleId: cycle.id };
}

function preferenceKey(teacherId) {
  return teacherId ? `lp-worksheet-pack-length:${encodeURIComponent(teacherId)}` : "";
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function readWorksheetPackLength(teacherId, storage = browserStorage()) {
  if (!teacherId) return 2;
  try {
    const value = Number(storage?.getItem(preferenceKey(teacherId)));
    return Number.isInteger(value) && value >= 1 && value <= 6 ? value : 2;
  } catch { return 2; }
}

export function rememberWorksheetPackLength(teacherId, pages, storage = browserStorage()) {
  if (!teacherId || !Number.isInteger(pages) || pages < 1 || pages > 6) return false;
  try { storage?.setItem(preferenceKey(teacherId), String(pages)); return Boolean(storage); }
  catch { return false; }
}
