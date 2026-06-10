export const SYMBOL_PASSWORD_LENGTH = 3;

export const SYMBOL_PASSWORD_ICONS = [
  { digit: "1", id: "cat", label: "Cat", accent: "#E2725B" },
  { digit: "2", id: "dog", label: "Dog", accent: "#D97706" },
  { digit: "3", id: "fish", label: "Fish", accent: "#3B82C4" },
  { digit: "4", id: "sun", label: "Sun", accent: "#F59E0B" },
  { digit: "5", id: "star", label: "Star", accent: "#7C5CBF" },
  { digit: "6", id: "apple", label: "Apple", accent: "#DC2626" },
  { digit: "7", id: "ball", label: "Ball", accent: "#2F9E62" },
  { digit: "8", id: "tree", label: "Tree", accent: "#15803D" },
  { digit: "9", id: "house", label: "House", accent: "#0C6B65" }
];

export const symbolIconByDigit = Object.fromEntries(
  SYMBOL_PASSWORD_ICONS.map(icon => [icon.digit, icon])
);

export function normalizeSymbolSequence(value = "") {
  return String(value || "").replace(/[^1-9]/g, "").slice(0, SYMBOL_PASSWORD_LENGTH);
}

export function isCompleteSymbolSequence(value = "") {
  return normalizeSymbolSequence(value).length === SYMBOL_PASSWORD_LENGTH;
}
