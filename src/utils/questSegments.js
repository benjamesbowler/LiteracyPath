// Grapheme segmentation for Sound Seekers.
//
// The existing src/utils/graphemeSegments.js is a fixed greedy splitter with no
// notion of what a child has been TAUGHT, and no notion of split digraphs. Both
// matter here:
//
//   - Stone Bridge (the blending shell) lays one plank per GRAPHEME, so "cake"
//     must come out as c | a_e | k, not c | a | k | e.
//   - The content check must be able to ask "is this word decodable using only
//     the sounds taught by stop N?" — which needs a known-set-aware segmenter,
//     or "ship" at stop 2 would segment as s|h|i|p and look decodable when the
//     child has never met `sh`.
//
// DOM-free, dependency-free, deterministic — unit-tested in
// tests/unit/questSegments.test.js.

export const VOWEL_LETTERS = new Set(["a", "e", "i", "o", "u"]);

// Every multi-letter grapheme the trail can teach, longest first so greedy
// matching never grabs a shorter one inside a longer one (igh before i, etc).
export const MULTI_GRAPHEMES = [
  "eigh", "tion",
  "igh", "tch", "air", "are", "ear", "ure", "ore", "ough",
  "ai", "ay", "ea", "ee", "ew", "ie", "oa", "oe", "oi", "oo", "ou", "ow", "oy", "ue", "ui", "aw",
  "ar", "er", "ir", "or", "ur",
  "sh", "ch", "th", "wh", "ph", "ck", "ng", "nk", "qu",
  "ff", "ll", "ss", "zz",
  // The rest of the floss-rule family: one sound, doubled spelling. Without
  // these, "happy" segmented as h|a|p|p|y — five planks for four phonemes,
  // and Echo Cave asked the child to tap a letter that represents no sound.
  "bb", "dd", "gg", "mm", "nn", "pp", "rr", "tt",
  "le"
].sort((a, b) => b.length - a.length);

// A doubled consonant says its single letter's sound (the floss rule adds no
// new phoneme), so it is decodable the moment the single letter is taught —
// it never needs its own teach entry, clip, or stone. ff/ll/ss/zz are NOT
// here: those are formally taught with their own ids and recordings.
const DOUBLE_OF_SINGLE = /^([bdgmnprt])\1$/;
// NOTE `ing` is deliberately NOT here. It is MORPHOLOGY, not a grapheme: a child
// decodes "sing" as s-i-ng and "jumping" as j-u-m-p-i-ng. Leave `ing` in and
// "thing" segments as th|ing, which is a syllable, not a sound — and the Stone
// Bridge would ask the child to blend two planks for a three-phoneme word.
// Same reasoning for the suffixes -s and -ed: they add no new spelling.

export const SPLIT_DIGRAPHS = ["a_e", "e_e", "i_e", "o_e", "u_e"];

// Words whose final -e is NOT a split digraph. Every one of these is a heart
// word taught whole, and every one would otherwise be mis-split (have -> h|a_e|v).
// -ve words are the classic English exception: no English word ends in a bare v.
const NOT_SPLIT_DIGRAPH = new Set([
  "have", "give", "live", "love", "come", "some", "done", "gone", "none",
  "one", "once", "are", "were", "there", "where", "here", "whose", "please",
  "little", "the", "he", "she", "we", "me", "be"
]);

export function isMultiGrapheme(grapheme) {
  const g = String(grapheme || "").toLowerCase();
  return MULTI_GRAPHEMES.includes(g) || SPLIT_DIGRAPHS.includes(g);
}

export function normalizeWord(word) {
  return String(word || "").toLowerCase().replace(/[^a-z]/g, "");
}

// Find the split digraph in a word, if it has one.
// Returns { head, split, tail } or null.
//   "cake"  -> { head: "c",  split: "a_e", tail: "k" }
//   "these" -> { head: "th", split: "e_e", tail: "s" }
// Guards: the letter before the vowel must not itself be a vowel (so "house"
// and "please" are not split), -ve is excluded, and the exception list wins.
export function findSplitDigraph(word) {
  const clean = normalizeWord(word);
  if (clean.length < 3 || NOT_SPLIT_DIGRAPH.has(clean)) return null;

  // NOTE the consonant class excludes r and v on purpose:
  //   r — "more" / "care" / "store" are r-controlled (ore, are), NOT o_e / a_e.
  //       Leave r in and every -ore word mis-segments as o_e + r.
  //   v — no English word ends in a bare v, so -ve is always an exception
  //       (have, give, love), never a split digraph.
  const match = /^(.*?)([aeiou])([bcdfghjklmnpqstwxz])e$/.exec(clean);
  if (!match) return null;

  const [, head, vowel, tail] = match;
  const before = head.slice(-1);
  if (before && VOWEL_LETTERS.has(before)) return null; // house, please, cheese

  return { head, split: `${vowel}_e`, tail };
}

// Graphemes that are only ever a grapheme at the END of a word. Without this,
// "le" swallows the start of "let" (le|t) and "less" (le|ss).
const FINAL_ONLY = new Set(["le"]);

// Greedy longest-match over the graphemes the child is ALLOWED to use.
// `known` (a Set or array) restricts which multi-letter graphemes may be
// matched; omit it to match every grapheme the trail knows about.
function segmentRun(run, allowed) {
  const out = [];
  let i = 0;
  while (i < run.length) {
    const hit = MULTI_GRAPHEMES.find(g => {
      if (!run.startsWith(g, i)) return false;
      // segmentIsKnown, not a bare has(): a doubled consonant plank (pp) is
      // usable as soon as its single letter is taught.
      if (allowed && !segmentIsKnown(g, allowed)) return false;
      if (FINAL_ONLY.has(g) && i + g.length !== run.length) return false;
      return true;
    });
    if (hit) {
      out.push(hit);
      i += hit.length;
    } else {
      out.push(run[i]);
      i += 1;
    }
  }
  return out;
}

// Segment a word into graphemes, in the order a child would blend them.
//   segmentWord("ship")               -> ["sh", "i", "p"]
//   segmentWord("ship", { known: [] }) -> ["s", "h", "i", "p"]   (sh not taught yet)
//   segmentWord("cake")               -> ["c", "a_e", "k"]
export function segmentWord(word, { known } = {}) {
  const clean = normalizeWord(word);
  if (!clean) return [];

  const allowed = known ? new Set(known) : null;

  // Split digraphs are only applied when the child has been taught them —
  // before that, "cake" is simply not a decodable word, and must not be
  // silently rewritten into one.
  const split = findSplitDigraph(clean);
  if (split && (!allowed || allowed.has(split.split))) {
    return [
      ...segmentRun(split.head, allowed),
      split.split,
      ...segmentRun(split.tail, allowed)
    ];
  }

  return segmentRun(clean, allowed);
}

// The distinct graphemes a word is built from.
export function graphemesIn(word, options) {
  return [...new Set(segmentWord(word, options))];
}

// Can a child who knows exactly `known` read this word by sounding it out?
//
// CRITICAL: this segments with the FULL grapheme set, not the taught one.
//
// The first version passed `{ known }` here, and it was VACUOUS. The segmenter
// falls back to single letters for anything it cannot match, so once a child
// knows all 26 letters — i.e. from stop 7 onward — EVERY a-z word came out as
// "decodable". "beautiful" segmented to b-e-a-u-t-i-f-u-l, all taught, pass.
// The content check that was supposed to stop a word running ahead of the
// curriculum was, for 33 of the 40 stops, checking nothing at all.
//
// The right question is not "can these letters be found in the taught set". It
// is "does the word's REAL grapheme spelling consist only of taught graphemes".
// `beautiful` really contains `ea`; `cake` really contains `a_e`. If the child
// hasn't met those, they cannot read the word, no matter how many of its letters
// they know.
//
// Heart words are the whole point of heart words: they are NOT decodable, and
// are taught by sight, so callers pass them separately and never through here.
// The mastery target a plank's evidence belongs to: a doubled consonant's
// evidence goes to the SINGLE letter (tapping pp in "happy" proves /p/ —
// there is no such sound as "double p", and no such stone).
export function evidenceTargetFor(seg) {
  const doubled = DOUBLE_OF_SINGLE.exec(String(seg || ""));
  return doubled ? doubled[1] : seg;
}

function segmentIsKnown(seg, allowed) {
  if (allowed.has(seg)) return true;
  const doubled = DOUBLE_OF_SINGLE.exec(seg);
  return Boolean(doubled && allowed.has(doubled[1]));
}

export function isDecodable(word, known) {
  const allowed = new Set(known || []);
  const segments = segmentWord(word); // TRUE segmentation — no known-set filter
  return segments.length > 0 && segments.every(seg => segmentIsKnown(seg, allowed));
}

// Which graphemes in a word the child has NOT been taught. Empty array = decodable.
// This names the real culprit: for "ship" at stop 2 it says `sh`, not `h`.
export function untaughtGraphemes(word, known) {
  const allowed = new Set(known || []);
  return [...new Set(segmentWord(word).filter(seg => !segmentIsKnown(seg, allowed)))];
}
