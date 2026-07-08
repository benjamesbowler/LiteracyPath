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

export function segmentWord(word) {
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

export function isMultiGrapheme(grapheme) {
  return MULTI_GRAPHEMES.includes(String(grapheme || "").toLowerCase());
}
