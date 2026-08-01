// Recording specification for the sound-only cues taught by Sound Seekers.
//
// This is a production brief, not an audio approval list. A target appearing
// here does not make any file playable. Runtime approval remains owned by
// phonemeAudioBank.js and the generated public-audio manifest.
//
// The prompts are original LiteracyPath directions. They deliberately name an
// anchor word but ask the performer to record only the isolated sound. No
// third-party recording is an input to this specification.

const target = (key, kind, ipa, anchor, direction, takeIds = [key]) => Object.freeze({
  key,
  kind,
  ipa,
  anchor,
  direction,
  takeIds: Object.freeze(takeIds)
});

export const PHONEME_RECORDING_TARGETS = Object.freeze([
  target("a", "vowel", "/æ/", "apple", "Short a. Hold naturally; do not say the letter name."),
  target("m", "letter", "/m/", "map", "Continuous voiced sound; no trailing vowel."),
  target("t", "letter", "/t/", "tap", "One clean stop sound; no trailing vowel."),
  target("s", "letter", "/s/", "sun", "Continuous unvoiced sound; no trailing vowel."),
  target("n", "letter", "/n/", "net", "Continuous voiced sound; no trailing vowel."),
  target("i", "vowel", "/ɪ/", "igloo", "Short i. Hold naturally; do not say the letter name."),
  target("f", "letter", "/f/", "fish", "Continuous unvoiced sound; no trailing vowel."),
  target("d", "letter", "/d/", "dog", "One clean stop sound; no trailing vowel."),
  target("o", "vowel", "/ɑ/", "octopus", "Short o in neutral US English; do not say the letter name."),
  target("l", "letter", "/l/", "leg", "Continuous sound; keep the release light and avoid 'luh'."),
  target("r", "letter", "/ɹ/", "run", "Neutral US r; no trailing vowel."),
  target("h", "letter", "/h/", "hat", "One soft breath; no trailing vowel."),
  target("b", "letter", "/b/", "bat", "One clean stop sound; no trailing vowel."),
  target("w", "letter", "/w/", "web", "Glide only; keep it very short and avoid 'wuh'."),
  target("qu", "digraph", "/kw/", "queen", "Blend k directly into w; no trailing vowel."),
  target("u", "vowel", "/ʌ/", "umbrella", "Short u. Hold naturally; do not say the letter name."),
  target("c", "letter", "/k/", "cat", "Hard c: one clean /k/; no trailing vowel."),
  target("g", "letter", "/ɡ/", "go", "Hard g: one clean stop sound; no trailing vowel."),
  target("p", "letter", "/p/", "pig", "One clean stop sound; no trailing vowel."),
  target("y", "letter", "/j/", "yes", "Glide only; keep it very short and avoid 'yuh'."),
  target("x", "letter", "/ks/", "box", "Say the final sound in box: k joined directly to s."),
  target("e", "vowel", "/ɛ/", "egg", "Short e. Hold naturally; do not say the letter name."),
  target("v", "letter", "/v/", "van", "Continuous voiced sound; no trailing vowel."),
  target("k", "letter", "/k/", "kit", "One clean stop sound; no trailing vowel."),
  target("j", "letter", "/dʒ/", "jam", "One clean affricate; no trailing vowel."),
  target("z", "letter", "/z/", "zip", "Continuous voiced sound; no trailing vowel."),
  target("ff", "double", "/f/", "puff", "Same pure sound as f; no trailing vowel."),
  target("ll", "double", "/l/", "bell", "Same pure sound as l; no trailing vowel."),
  target("ss", "double", "/s/", "hiss", "Same pure sound as s; no trailing vowel."),
  target("zz", "double", "/z/", "buzz", "Same pure sound as z; no trailing vowel."),
  target("sh", "digraph", "/ʃ/", "ship", "Continuous unvoiced sound; no trailing vowel."),
  target("ch", "digraph", "/tʃ/", "chip", "One clean affricate; no trailing vowel."),
  target("th", "digraph", "/θ/ and /ð/", "thin; this", "Record both English th sounds as separate takes.", ["th-unvoiced", "th-voiced"]),
  target("ng", "digraph", "/ŋ/", "ring", "Isolate the final sound in ring; do not add /g/ or a vowel."),
  target("nk", "digraph", "/ŋk/", "pink", "Join ng directly to k; no trailing vowel."),
  target("ck", "digraph", "/k/", "duck", "Same pure sound as hard c and k; no trailing vowel."),
  target("wh", "digraph", "/w/", "when", "Neutral US /w/ glide; keep it short and avoid 'wuh'."),
  target("y_ie", "alternative", "/aɪ/", "my", "Long i sound represented by final y."),
  target("y_ee", "alternative", "/i/", "happy", "Long e sound represented by final y."),
  target("a_e", "split", "/eɪ/", "cake", "Long a sound only; do not say the letter names or the word."),
  target("i_e", "split", "/aɪ/", "bike", "Long i sound only; do not say the letter names or the word."),
  target("o_e", "split", "/oʊ/", "home", "Long o sound only; do not say the letter names or the word."),
  target("u_e", "split", "/ju/ and /u/", "cube; tube", "Record both common US long-u values as separate takes.", ["u-e-yoo", "u-e-oo"]),
  target("e_e", "split", "/i/", "theme", "Long e sound only; do not say the letter names or the word."),
  target("ai", "team", "/eɪ/", "rain", "Long a sound only."),
  target("ay", "team", "/eɪ/", "play", "Long a sound only."),
  target("ee", "team", "/i/", "tree", "Long e sound only."),
  target("ea", "team", "/i/", "team", "Long e sound only."),
  target("igh", "team", "/aɪ/", "light", "Long i sound only."),
  target("ie", "team", "/aɪ/", "pie", "Long i sound only."),
  target("oa", "team", "/oʊ/", "boat", "Long o sound only."),
  target("ow", "team", "/oʊ/", "snow", "Long o sound represented by ow."),
  target("oe", "team", "/oʊ/", "toe", "Long o sound only."),
  target("oo", "team", "/u/", "moon", "Long oo sound only."),
  target("ue", "team", "/u/", "blue", "Long oo sound represented by ue."),
  target("ew", "team", "/ju/ and /u/", "few; grew", "Record both common values as separate takes.", ["ew-yoo", "ew-oo"]),
  target("oo_short", "alternative", "/ʊ/", "book", "Short oo sound only."),
  target("ou", "team", "/aʊ/", "out", "The vowel sound in out; do not add a consonant."),
  target("ow_ou", "alternative", "/aʊ/", "cow", "The vowel sound in cow; do not add a consonant."),
  target("oi", "team", "/ɔɪ/", "coin", "The vowel sound in coin."),
  target("oy", "team", "/ɔɪ/", "toy", "The vowel sound in toy."),
  target("ar", "r-controlled", "/ɑɹ/", "car", "Neutral US r-controlled vowel in car."),
  target("or", "r-controlled", "/ɔɹ/", "fork", "Neutral US r-controlled vowel in fork."),
  target("aw", "team", "/ɔ/", "saw", "Vowel only; do not include a final consonant."),
  target("ore", "r-controlled", "/ɔɹ/", "more", "Neutral US r-controlled vowel in more."),
  target("er", "r-controlled", "/ɝ/", "her", "Stressed neutral US r-controlled vowel."),
  target("ir", "r-controlled", "/ɝ/", "bird", "Stressed neutral US r-controlled vowel."),
  target("ur", "r-controlled", "/ɝ/", "turn", "Stressed neutral US r-controlled vowel."),
  target("air", "team", "/ɛɹ/", "chair", "Neutral US r-controlled vowel in chair."),
  target("are", "r-controlled", "/ɛɹ/", "care", "Neutral US r-controlled vowel in care."),
  target("ear", "team", "/ɪɹ/", "hear", "Neutral US r-controlled vowel in hear."),
  target("ure", "team", "/jʊɹ/", "pure", "Neutral US sound in pure."),
  target("c_s", "alternative", "/s/", "city", "Soft c sound only."),
  target("g_j", "alternative", "/dʒ/", "gem", "Soft g sound only."),
  target("ch_k", "alternative", "/k/", "school", "The /k/ value represented by ch."),
  target("ea_e", "alternative", "/ɛ/", "bread", "Short e value represented by ea."),
  target("le", "suffix", "/əl/", "little", "Final unstressed syllable in little."),
  target("tion", "suffix", "/ʃən/", "action", "Final syllable in action; keep the schwa natural and light.")
]);

export const PHONEME_RECORDING_TARGET_BY_KEY = Object.freeze(
  Object.fromEntries(PHONEME_RECORDING_TARGETS.map(item => [item.key, item]))
);
