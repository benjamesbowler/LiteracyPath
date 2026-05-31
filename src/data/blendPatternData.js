export const BLEND_PATTERN_GROUPS = {
  lBeginning: ["bl", "cl", "fl", "gl", "pl", "sl"],
  rBeginning: ["br", "cr", "dr", "fr", "gr", "pr", "tr"],
  sBeginning: ["sc", "sk", "sl", "sn", "sm", "sp", "st", "sw"],
  otherBeginning: ["tw", "scr", "shr", "squ", "spl", "spr", "thr"],
  endingT: ["ct", "ft", "lt", "nt", "pt", "st", "xt"],
  endingR: ["lb", "ld", "lf", "lk", "lp", "lt"],
  otherEnding: ["nd", "nch", "sk", "sp", "mp"]
};

export const BEGINNING_BLEND_PATTERNS = [
  ...new Set([
    ...BLEND_PATTERN_GROUPS.lBeginning,
    ...BLEND_PATTERN_GROUPS.rBeginning,
    ...BLEND_PATTERN_GROUPS.sBeginning,
    ...BLEND_PATTERN_GROUPS.otherBeginning
  ])
];

export const ENDING_BLEND_PATTERNS = [
  ...new Set([
    ...BLEND_PATTERN_GROUPS.endingT,
    ...BLEND_PATTERN_GROUPS.endingR,
    ...BLEND_PATTERN_GROUPS.otherEnding
  ])
];

export const ALL_BLEND_PATTERNS = [
  ...new Set([...BEGINNING_BLEND_PATTERNS, ...ENDING_BLEND_PATTERNS])
];

export function normalizeBlendPattern(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/^-/, "")
    .replace(/[^a-z]+/g, "")
    .trim();
}

export function isBeginningBlendPattern(value = "") {
  return BEGINNING_BLEND_PATTERNS.includes(normalizeBlendPattern(value));
}

export function isEndingBlendPattern(value = "") {
  return ENDING_BLEND_PATTERNS.includes(normalizeBlendPattern(value));
}

export function isAllowedBlendPattern(value = "") {
  return ALL_BLEND_PATTERNS.includes(normalizeBlendPattern(value));
}
