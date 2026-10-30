import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { fingerprintBookReadingText } from "./textMetrics.js";
import { nextStepsBookNumber, requiredNextStepsLessons } from "../../data/nextStepsPhonicsLessons.js";

// Pronunciation-aware correspondences for this deliberately bounded first
// sequence. The cycle gate below also checks these against the live curriculum.
// Multi-sound chunks (qu, x, nk, all) are not presented as single phonemes.
export const DECODABLE_CORRESPONDENCES = Object.freeze({
  a: { cycle: 1, sounds: ["æ"] }, m: { cycle: 1, sounds: ["m"] },
  t: { cycle: 2, sounds: ["t"] }, s: { cycle: 2, sounds: ["s"] },
  n: { cycle: 3, sounds: ["n"] }, i: { cycle: 3, sounds: ["ɪ"] },
  f: { cycle: 4, sounds: ["f"] }, d: { cycle: 4, sounds: ["d"] },
  o: { cycle: 5, sounds: ["ɑ", "ɒ"] }, l: { cycle: 5, sounds: ["l"] },
  r: { cycle: 6, sounds: ["ɹ", "r"] }, h: { cycle: 6, sounds: ["h"] },
  b: { cycle: 8, sounds: ["b"] }, w: { cycle: 8, sounds: ["w"] },
  qu: { cycle: 9, sounds: ["kw"] }, u: { cycle: 9, sounds: ["ʌ"] },
  c: { cycle: 10, sounds: ["k"] }, g: { cycle: 10, sounds: ["g", "ɡ"] },
  p: { cycle: 11, sounds: ["p"] }, y: { cycle: 11, sounds: ["j"] },
  x: { cycle: 11, sounds: ["ks"] }, e: { cycle: 12, sounds: ["ɛ"] },
  v: { cycle: 12, sounds: ["v"] }, k: { cycle: 13, sounds: ["k"] },
  j: { cycle: 13, sounds: ["dʒ"] }, z: { cycle: 13, sounds: ["z"] },
  sh: { cycle: 15, sounds: ["ʃ"] }, ch: { cycle: 15, sounds: ["tʃ"] },
  th: { cycle: 15, sounds: ["θ", "ð"] },
  all: { cycle: 16, sounds: ["ɔl", "ɑl"] },
  wh: { cycle: 21, sounds: ["w"] }, nk: { cycle: 22, sounds: ["ŋk"] },
  ng: { cycle: 23, sounds: ["ŋ"] },
  ff: { cycle: 24, sounds: ["f"] }, ss: { cycle: 24, sounds: ["s"] },
  zz: { cycle: 24, sounds: ["z"] }, ll: { cycle: 24, sounds: ["l"] }
});

const EXCEPTION_CYCLES = new Map();
for (const cycle of elSkillsBlockCycles) {
  if (!cycle.cycleNumber) continue;
  for (const word of cycle.highFrequencyWords || []) {
    const key = word.toLowerCase();
    if (!EXCEPTION_CYCLES.has(key)) EXCEPTION_CYCLES.set(key, cycle.cycleNumber);
  }
}

// Exact, reviewed whole words only. Being in the curriculum's HFW list does
// not make an arbitrary grapheme/IPA alignment valid. Connected-speech and
// equivalent IPA-length variants stay bounded to these particular words.
const EXCEPTION_ALIGNMENTS = Object.freeze({
  a: { graphemes: ["a"], sounds: [["ə", "eɪ"]] },
  i: { graphemes: ["i"], sounds: [["aɪ"]] },
  is: { graphemes: ["i", "s"], sounds: [["ɪ"], ["z"]] },
  the: { graphemes: ["th", "e"], sounds: [["ð"], ["ə", "i", "iː"]] },
  do: { graphemes: ["d", "o"], sounds: [["d"], ["u", "uː", "ə"]] },
  my: { graphemes: ["m", "y"], sounds: [["m"], ["aɪ"]] },
  no: { graphemes: ["n", "o"], sounds: [["n"], ["oʊ"]] },
  and: { graphemes: ["a", "n", "d"], sounds: [["æ", "ə"], ["n"], ["d"]] },
  for: { graphemes: ["f", "or"], sounds: [["f"], ["ɔɹ", "ɚ"]] },
  good: { graphemes: ["g", "oo", "d"], sounds: [["g", "ɡ"], ["ʊ"], ["d"]] },
  of: { graphemes: ["o", "f"], sounds: [["ə", "ʌ"], ["v"]] },
  your: { graphemes: ["y", "our"], sounds: [["j"], ["ʊɹ", "ɔɹ", "ɚ"]] },
  see: { graphemes: ["s", "ee"], sounds: [["s"], ["i", "iː"]] },
  look: { graphemes: ["l", "oo", "k"], sounds: [["l"], ["ʊ"], ["k"]] },
  to: { graphemes: ["t", "o"], sounds: [["t"], ["u", "uː", "ə"]] },
  out: { graphemes: ["ou", "t"], sounds: [["aʊ"], ["t"]] },
  put: { graphemes: ["p", "u", "t"], sounds: [["p"], ["ʊ"], ["t"]] },
  go: { graphemes: ["g", "o"], sounds: [["g", "ɡ"], ["oʊ"]] },
  me: { graphemes: ["m", "e"], sounds: [["m"], ["i", "iː"]] },
  you: { graphemes: ["y", "ou"], sounds: [["j"], ["u", "uː"]] },
  his: { graphemes: ["h", "i", "s"], sounds: [["h"], ["ɪ"], ["z"]] },
  this: { graphemes: ["th", "i", "s"], sounds: [["ð"], ["ɪ"], ["s"]] },
  be: { graphemes: ["b", "e"], sounds: [["b"], ["i", "iː"]] },
  does: { graphemes: ["d", "oe", "s"], sounds: [["d"], ["ʌ", "ə"], ["z"]] },
  each: { graphemes: ["ea", "ch"], sounds: [["i", "iː"], ["tʃ"]] },
  from: { graphemes: ["f", "r", "o", "m"], sounds: [["f"], ["ɹ", "r"], ["ʌ", "ə"], ["m"]] },
  goes: { graphemes: ["g", "oe", "s"], sounds: [["g", "ɡ"], ["oʊ"], ["z"]] },
  have: { graphemes: ["h", "a", "ve"], sounds: [["h"], ["æ"], ["v"]] },
  like: { graphemes: ["l", "i", "ke"], sounds: [["l"], ["aɪ"], ["k"]] },
  more: { graphemes: ["m", "ore"], sounds: [["m"], ["ɔɹ", "ɔr"]] },
  said: { graphemes: ["s", "ai", "d"], sounds: [["s"], ["ɛ"], ["d"]] },
  says: { graphemes: ["s", "ay", "s"], sounds: [["s"], ["ɛ"], ["z"]] },
  they: { graphemes: ["th", "ey"], sounds: [["ð"], ["eɪ"]] },
  was: { graphemes: ["w", "a", "s"], sounds: [["w"], ["ə", "ʌ", "ɑ"], ["z"]] },
  what: { graphemes: ["wh", "a", "t"], sounds: [["w"], ["ʌ", "ɑ"], ["t"]] }
});

export function decodableTextTokens(text = "") {
  return String(text).toLowerCase().replaceAll("’", "'").match(/[a-z]+(?:'[a-z]+)*|\d+/gu) || [];
}

export function decodableBookTokens(book = {}) {
  return [
    ...decodableTextTokens(book.title).map(word => ({ word, location: "title" })),
    ...(book.pages || []).flatMap((page, index) => decodableTextTokens(page.text)
      .map(word => ({ word, location: `page-${page.pageNumber || index + 1}` })))
  ];
}

function hasPermittedWordShape(graphemes, lessons = []) {
  const vowels = graphemes.map((g, index) => /^[aeiou]$/u.test(g) || g === "all" ? index : -1)
    .filter(index => index >= 0);
  if (vowels.length !== 1) return false;
  const vowel = vowels[0];
  // Baseline VC/CVC; adjacent consonants require the exact extra lessons.
  const onset = vowel;
  const coda = graphemes.length - vowel - 1;
  if (onset > (lessons.includes("next-steps-initial-blends") ? 2 : 1)
    || coda > (lessons.includes("next-steps-final-blends") ? 2 : 1)) return false;
  if (onset > 1 && coda > 1 && !lessons.includes("next-steps-both-blends")) return false;
  // The explicitly taught all rime contains its own final consonant.
  if (graphemes[vowel] === "all" && vowel !== graphemes.length - 1) return false;
  if (graphemes.some((g, index) => ["nk", "ng", "ff", "ss", "zz", "ll", "x"].includes(g)
    && index !== graphemes.length - 1
    && !(g === "ff" && index === graphemes.length - 2 && graphemes.at(-1) === "s"
      && lessons.includes("next-steps-final-blends")))) return false;
  return !graphemes.some((g, index) => ["qu", "wh", "y"].includes(g) && index !== 0);
}

export function auditDecodableBook(book = {}) {
  const scope = book.decodableScope || book;
  const failures = [];
  const afterCycle = scope.afterCycle;
  const sequenceNumber = nextStepsBookNumber(book);
  const minimumCycle = sequenceNumber === 1 ? 6 : sequenceNumber === 2 ? 9 : 10;
  if (!Number.isInteger(afterCycle) || afterCycle < minimumCycle || afterCycle > 24) {
    failures.push(`A completed cycle from ${minimumCycle} through 24 must be declared.`);
  }
  const requiredLessons = requiredNextStepsLessons(book);
  const declaredLessons = scope.additionalPrerequisites || [];
  const expectedIds = requiredLessons.map(lesson => lesson.id);
  const validLessons = Array.isArray(declaredLessons)
    && declaredLessons.length === expectedIds.length
    && declaredLessons.every((id, index) => id === expectedIds[index])
    && requiredLessons.every(lesson => afterCycle >= lesson.afterCycle);
  if (!validLessons) failures.push("Supplemental blending prerequisites must match the book's cumulative sequence and teaching cycle.");
  const permittedLessons = validLessons ? declaredLessons : [];
  const tokens = decodableBookTokens(book);
  const records = new Map();
  for (const record of scope.wordRecords || []) {
    const word = String(record.word || "").toLowerCase();
    if (records.has(word)) failures.push(`${word}: duplicate reviewed word record.`);
    records.set(word, record);
  }
  const exceptions = new Map((scope.exceptions || []).map(row => [row.word.toLowerCase(), row]));
  if (exceptions.size !== (scope.exceptions || []).length) failures.push("Duplicate exception word.");
  const uniqueWords = [...new Set(tokens.map(row => row.word))];
  for (const word of uniqueWords) {
    const record = records.get(word);
    if (!record) { failures.push(`${word}: no reviewed pronunciation record.`); continue; }
    const { graphemes, sounds } = record;
    if (!Array.isArray(graphemes) || !graphemes.length || graphemes.join("") !== word
      || !Array.isArray(sounds) || sounds.length !== graphemes.length || sounds.some(sound => !sound)) {
      failures.push(`${word}: spelling and sound alignment is incomplete.`);
      continue;
    }
    if (record.type === "exception") {
      const exception = exceptions.get(word);
      const firstCycle = EXCEPTION_CYCLES.get(word);
      if (!exception || !exception.reason || !firstCycle || exception.cycle !== firstCycle
        || record.firstCycle !== firstCycle || firstCycle > afterCycle) {
        failures.push(`${word}: exception is undeclared, unexplained or not yet taught.`);
      }
      const alignment = EXCEPTION_ALIGNMENTS[word];
      if (!alignment || alignment.graphemes.length !== graphemes.length
        || graphemes.some((grapheme, index) => grapheme !== alignment.graphemes[index]
          || !alignment.sounds[index].includes(sounds[index]))) {
        failures.push(`${word}: exception pronunciation is outside its reviewed spelling and sound alignment.`);
      }
      continue;
    }
    if (record.type !== "regular") failures.push(`${word}: unknown word classification.`);
    if (exceptions.has(word)) failures.push(`${word}: both regular and exception classifications declared.`);
    if (!hasPermittedWordShape(graphemes, permittedLessons)) failures.push(`${word}: word shape exceeds the declared VC/CVC/chunk scope and supplemental lessons.`);
    let firstCycle = 0;
    graphemes.forEach((grapheme, index) => {
      const correspondence = DECODABLE_CORRESPONDENCES[grapheme];
      if (!correspondence || !correspondence.sounds.includes(sounds[index])) {
        failures.push(`${word}: ${grapheme} → ${sounds[index]} is outside the reviewed sound values.`);
      } else {
        firstCycle = Math.max(firstCycle, correspondence.cycle);
        if (correspondence.cycle > afterCycle) failures.push(`${word}: ${grapheme} has not been taught by Cycle ${afterCycle}.`);
      }
    });
    if (record.firstCycle !== firstCycle) failures.push(`${word}: first teaching cycle does not match its correspondences.`);
  }
  for (const word of records.keys()) if (!uniqueWords.includes(word)) failures.push(`${word}: unused word record.`);
  for (const word of exceptions.keys()) if (!uniqueWords.includes(word)) failures.push(`${word}: unused exception declaration.`);
  if (!tokens.length) failures.push("The book contains no reading words.");
  if (scope.reviewedTextFingerprint && scope.reviewedTextFingerprint !== fingerprintBookReadingText(book)) {
    failures.push("The reviewed manuscript fingerprint is stale.");
  }
  const unsupportedWords = uniqueWords.filter(word => failures.some(failure => failure.startsWith(`${word}:`)));
  const exceptionTokens = tokens.filter(({ word }) => !unsupportedWords.includes(word) && records.get(word)?.type === "exception").length;
  const regularTokens = tokens.filter(({ word }) => !unsupportedWords.includes(word) && records.get(word)?.type === "regular").length;
  return {
    valid: failures.length === 0, failures, afterCycle, tokenCount: tokens.length,
    uniqueWordCount: uniqueWords.length, regularTokens, exceptionTokens,
    unsupportedTokens: tokens.length - regularTokens - exceptionTokens, unsupportedWords,
    occurrences: uniqueWords.map(word => ({ word, locations: tokens.filter(row => row.word === word).map(row => row.location) }))
  };
}

export function decodableTeachingWords(book = {}) {
  return (book.decodableScope?.exceptions || []).map(row => row.word === "i" ? "I" : row.word).join(", ");
}

export function auditDecodableCurriculum() {
  const firstCycles = new Map();
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber) continue;
    for (const item of cycle.focusLetters || []) {
      for (const spelling of String(item.spelling || item.grapheme || "").toLowerCase().split(/[\s/,+]+/u)) {
        if (!firstCycles.has(spelling)) firstCycles.set(spelling, cycle.cycleNumber);
      }
    }
  }
  return Object.entries(DECODABLE_CORRESPONDENCES)
    .filter(([spelling, entry]) => firstCycles.get(spelling) !== entry.cycle)
    .map(([spelling, entry]) => `${spelling}: declared Cycle ${entry.cycle}, curriculum Cycle ${firstCycles.get(spelling) ?? "missing"}.`);
}
