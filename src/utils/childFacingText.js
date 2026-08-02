const SOUND_NAMES = Object.freeze({
  "ă": "short a",
  "ĕ": "short e",
  "ĭ": "short i",
  "ŏ": "short o",
  "ŭ": "short u",
  "æ": "short a",
  "ɛ": "short e",
  "ɪ": "short i",
  "ɒ": "short o",
  "ɑ": "short o",
  "ʌ": "short u",
  "ə": "the quiet vowel sound",
  "ʊ": "short oo",
  "ʃ": "sh",
  "tʃ": "ch",
  "dʒ": "j",
  "θ": "th in thin",
  "ð": "th in this",
  "ŋ": "ng",
  "eɪ": "long a",
  "aɪ": "long i",
  "oʊ": "long o",
  "iː": "long e",
  "ɔɪ": "oi",
  "aʊ": "ow"
});

function soundName(token) {
  if (token === "TH") return "th in this";
  return SOUND_NAMES[token] || token;
}

// Slash notation is useful in specialist reference material, but it is not
// suitable copy for five-year-olds. Keep the sound meaning and turn it into
// ordinary words before curriculum content reaches any app or print surface.
export function plainEnglishSoundText(value = "") {
  return String(value)
    .replace(/\/([A-Za-zăĕĭŏŭæɑɒʌəɛɪɔʊʃʒθðŋɜɚɝː]{1,8})\//g, (_, token) => soundName(token))
    .replace(/[ăĕĭŏŭ]/g, token => SOUND_NAMES[token])
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function makeChildFacingTextSafe(value) {
  if (typeof value === "string") return plainEnglishSoundText(value);
  if (Array.isArray(value)) return value.map(makeChildFacingTextSafe);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, makeChildFacingTextSafe(entry)])
  );
}
