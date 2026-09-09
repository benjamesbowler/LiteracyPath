const MULTI_GRAPHEMES = [
  "igh",
  "tch",
  "air",
  "ear",
  "ure",
  "ai",
  "ay",
  "ee",
  "ea",
  "oa",
  "oo",
  "ow",
  "oi",
  "oy",
  "ou",
  "ar",
  "or",
  "er",
  "ir",
  "ur",
  "sh",
  "ch",
  "th",
  "ck",
  "ng",
  "wh",
  "ph",
  "qu"
];

const VOWEL_LETTERS = new Set(["a", "e", "i", "o", "u"]);

const isSingleConsonant = segment =>
  typeof segment === "string" && segment.length === 1 && !VOWEL_LETTERS.has(segment);

// The sound games model PHONEMES, not letters, so raw letter splits need two
// corrections: a magic-e is one sound with its vowel (stone -> o_e, matching
// the questSegments convention), a trailing consonant-le is one segment
// (sparkle -> le), and a doubled consonant is heard once (glimmer -> one m).
function phonemeSegments(segments) {
  const out = [...segments];
  const last = out[out.length - 1];
  const before = out[out.length - 2];
  const third = out[out.length - 3];
  if (last === "e" && isSingleConsonant(before) && VOWEL_LETTERS.has(third)) {
    out.splice(-3, 3, `${third}_e`, before);
  } else if (last === "e" && before === "l" && isSingleConsonant(third)) {
    out.splice(-2, 2, "le");
  }
  return out.filter((segment, index) =>
    !(index > 0 && segment === out[index - 1] && isSingleConsonant(segment)));
}

// Written construction keeps every letter, including doubled consonants and split vowels.
export function segmentWrittenWord(word) {
  const clean = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
  const segments = [];
  let index = 0;

  while (index < clean.length) {
    const match = MULTI_GRAPHEMES.find(grapheme => clean.startsWith(grapheme, index));
    if (match) {
      segments.push(match);
      index += match.length;
    } else {
      segments.push(clean[index]);
      index += 1;
    }
  }

  return segments;
}

export function segmentWord(word) {
  return phonemeSegments(segmentWrittenWord(word));
}

export function isMultiGrapheme(grapheme) {
  return MULTI_GRAPHEMES.includes(String(grapheme || "").toLowerCase());
}
