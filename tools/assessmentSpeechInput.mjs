import { normalizeSpokenCloze } from "../src/utils/assessmentSpokenText.js";

const escapeXml = text => text.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
})[character]);

// Explicit pauses stop the synthesizer from reading ellipses as "dot" or
// guessing an answer at an incomplete clause. Never insert the scoring key.
export function buildAssessmentSpeechInput(text) {
  const spoken = normalizeSpokenCloze(text);
  if (!spoken.includes("…")) return { text: spoken };
  // Quotation marks delimit the printed example; they are not spoken words.
  // Leda can read a closing quote after a gap as "single quote dot". Remove
  // delimiters only in SSML, keeping apostrophes inside words and contractions.
  const speech = spoken
    .replace(/[“”"]/g, "")
    .replace(/(?<![\p{L}\p{N}])['‘]|['’](?![\p{L}\p{N}])/gu, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1");
  return { ssml: `<speak>${speech.split("…").map(escapeXml).join('<break time="600ms"/>')}</speak>` };
}
