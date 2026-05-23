const PRONUNCIATION_MAP = {
  cvc: "C V C",
  hfw: "high frequency word",
  wh: "w h",
  sh: "sh",
  ch: "ch",
  th: "th"
};

function normalizeSpeechText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareNaturalSpeechText(value) {
  const text = normalizeSpeechText(value);
  const lower = text.toLowerCase();

  if (/^[a-z](?:\s+[a-z]){1,}$/.test(lower)) {
    return lower.replace(/\s+/g, "");
  }

  if (PRONUNCIATION_MAP[lower]) return PRONUNCIATION_MAP[lower];

  return text
    .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\b/g, (_, a, b, c) => `${a}${b}${c}`.toLowerCase())
    .replace(/\bcat\b/gi, "cat")
    .replace(/\bstop\b/gi, "stop")
    .replace(/\bpaint\b/gi, "paint");
}

export const teacherAssessmentAudioPolicy = {
  browserTtsAllowed: false,
  requiredVoice: "clean neutral human MP3",
  cadence: "child-friendly phonics-teacher pacing",
  fallback: "exclude required-audio questions or hide optional speaker controls"
};
