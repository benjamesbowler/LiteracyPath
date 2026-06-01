export const SILENT_E_PATTERNS = ["a_e", "e_e", "i_e", "o_e", "u_e"];

export const LONG_VOWEL_TEAM_PATTERNS = [
  "ay",
  "ai",
  "y",
  "ie",
  "ew",
  "oo",
  "ee",
  "igh",
  "oa",
  "oe",
  "ea",
  "ow",
  "ue",
  "ui",
  "eigh"
];

export const ALL_LONG_VOWEL_PATTERNS = [
  ...SILENT_E_PATTERNS,
  ...LONG_VOWEL_TEAM_PATTERNS
];

export function normalizeLongVowelPattern(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z_]+/g, "")
    .trim();
}

export function isSilentEPattern(value = "") {
  return SILENT_E_PATTERNS.includes(normalizeLongVowelPattern(value));
}

export function isLongVowelTeamPattern(value = "") {
  return LONG_VOWEL_TEAM_PATTERNS.includes(normalizeLongVowelPattern(value));
}

export function isAllowedLongVowelPattern(value = "") {
  return ALL_LONG_VOWEL_PATTERNS.includes(normalizeLongVowelPattern(value));
}
