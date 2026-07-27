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

const SYMBOL_DIGITS = SYMBOL_PASSWORD_ICONS.map(icon => icon.digit);

// 9 pictures in a 3-picture sequence = 729 distinct sequences, so a whole
// class always fits with room to spare.
export const SYMBOL_SEQUENCE_SPACE = SYMBOL_DIGITS.length ** SYMBOL_PASSWORD_LENGTH;

export function randomSymbolSequence(random = Math.random) {
  let sequence = "";
  for (let index = 0; index < SYMBOL_PASSWORD_LENGTH; index += 1) {
    const pick = Math.min(
      SYMBOL_DIGITS.length - 1,
      Math.max(0, Math.floor(random() * SYMBOL_DIGITS.length))
    );
    sequence += SYMBOL_DIGITS[pick];
  }
  return sequence;
}

function firstFreeSequence(taken) {
  for (let index = 0; index < SYMBOL_SEQUENCE_SPACE; index += 1) {
    let sequence = "";
    let remainder = index;
    for (let place = 0; place < SYMBOL_PASSWORD_LENGTH; place += 1) {
      sequence = SYMBOL_DIGITS[remainder % SYMBOL_DIGITS.length] + sequence;
      remainder = Math.floor(remainder / SYMBOL_DIGITS.length);
    }
    if (!taken.has(sequence)) return sequence;
  }
  return "";
}

// Hand every listed student a sequence nobody else in the class already holds.
// Random first (so cards are not guessable from the order of the roster), then
// an exhaustive scan as a guaranteed fallback once random picks start colliding.
export function assignUniqueSymbolSequences(students = [], takenSequences = [], random = Math.random) {
  const taken = new Set(
    (takenSequences || [])
      .map(value => normalizeSymbolSequence(value))
      .filter(value => isCompleteSymbolSequence(value))
  );
  const assignments = [];
  for (const student of students) {
    let sequence = "";
    for (let attempt = 0; attempt < 50 && !sequence; attempt += 1) {
      const candidate = randomSymbolSequence(random);
      if (!taken.has(candidate)) sequence = candidate;
    }
    if (!sequence) sequence = firstFreeSequence(taken);
    if (!sequence) break;
    taken.add(sequence);
    assignments.push({ student, sequence });
  }
  return assignments;
}
