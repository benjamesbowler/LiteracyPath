import {
  REPORT_STATUS_IDS,
  canonicalStatusId
} from "../policy/reportingBible.js";

const ALPHABET = Object.freeze("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));

function normalizedLetter(row = {}) {
  const raw = String(row.letter || row.letterPair || "").trim();
  const letter = raw.charAt(0).toUpperCase();
  return ALPHABET.includes(letter) ? letter : "";
}

export function summariseElLetterKnowledge(letterRows = []) {
  const byLetter = new Map();
  for (const row of letterRows) {
    const letter = normalizedLetter(row);
    if (letter) byLetter.set(letter, row);
  }

  const definitions = [
    ["uppercaseName", "Uppercase letter names", letter => letter],
    ["uppercaseSound", "Uppercase letter sounds", letter => letter],
    ["lowercaseName", "Lowercase letter names", letter => letter.toLowerCase()],
    ["lowercaseSound", "Lowercase letter sounds", letter => letter.toLowerCase()]
  ];

  return definitions.map(([key, label, displayLetter]) => {
    const knownLetters = [];
    let assessedCount = 0;

    for (const letter of ALPHABET) {
      const status = canonicalStatusId(byLetter.get(letter)?.[key]?.status);
      if (status !== REPORT_STATUS_IDS.NOT_CHECKED) assessedCount += 1;
      if (status === REPORT_STATUS_IDS.SECURE) knownLetters.push(displayLetter(letter));
    }

    return {
      key,
      label,
      knownLetters,
      knownCount: knownLetters.length,
      assessedCount,
      notCheckedCount: ALPHABET.length - assessedCount,
      total: ALPHABET.length
    };
  });
}
