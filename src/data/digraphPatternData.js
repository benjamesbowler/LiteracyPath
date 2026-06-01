export const ALL_DIGRAPH_PATTERNS = ["ch", "sh", "th", "wh", "ph", "ck"];

export function normalizeDigraphPattern(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "")
    .trim();
}

export function isAllowedDigraphPattern(value = "") {
  return ALL_DIGRAPH_PATTERNS.includes(normalizeDigraphPattern(value));
}
