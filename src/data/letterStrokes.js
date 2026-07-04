// Manuscript letter stroke paths for the animated "watch it being written"
// demonstrations (Present decks + Letter Trace). Every letter is drawn in a
// 0 0 100 140 viewBox on standard handwriting guides, and every stroke is a
// separate path in the pedagogic stroke ORDER a teacher would model
// (top-to-bottom, left-to-right, verticals before crossbars).
//
// Guides: cap line y=20, midline (x-height) y=64, baseline y=110,
// descender line y=136. Dots are zero-length round-cap strokes.

export const LETTER_GUIDES = { top: 20, mid: 64, base: 110, desc: 136, width: 100 };

export const LETTER_STROKES = {
  A: ["M50 20 L22 110", "M50 20 L78 110", "M33 76 L67 76"],
  B: ["M30 20 L30 110", "M30 20 C64 20 64 63 30 63", "M30 63 C70 63 70 110 30 110"],
  C: ["M74 40 C64 18 30 20 26 54 C22 92 40 112 58 110 C66 109 71 103 74 94"],
  D: ["M30 20 L30 110", "M30 20 C80 26 80 104 30 110"],
  E: ["M34 20 L34 110", "M34 20 L70 20", "M34 64 L62 64", "M34 110 L70 110"],
  F: ["M34 20 L34 110", "M34 20 L70 20", "M34 64 L60 64"],
  G: ["M74 38 C64 18 30 20 26 54 C22 92 42 112 60 109 C72 107 76 96 76 84", "M76 84 L54 84"],
  H: ["M28 20 L28 110", "M72 20 L72 110", "M28 64 L72 64"],
  I: ["M50 20 L50 110", "M32 20 L68 20", "M32 110 L68 110"],
  J: ["M62 20 L62 90 C62 112 32 112 30 92", "M44 20 L80 20"],
  K: ["M30 20 L30 110", "M70 20 L30 68", "M42 58 L72 110"],
  L: ["M34 20 L34 110", "M34 110 L70 110"],
  M: ["M24 20 L24 110", "M24 20 L50 80", "M76 20 L50 80", "M76 20 L76 110"],
  N: ["M28 20 L28 110", "M28 20 L72 110", "M72 20 L72 110"],
  O: ["M50 20 C24 20 20 50 20 65 C20 80 24 110 50 110 C76 110 80 80 80 65 C80 50 76 20 50 20"],
  P: ["M30 20 L30 110", "M30 20 C68 20 68 66 30 66"],
  Q: ["M50 20 C24 20 20 50 20 65 C20 80 24 110 50 110 C76 110 80 80 80 65 C80 50 76 20 50 20", "M58 88 L80 112"],
  R: ["M30 20 L30 110", "M30 20 C68 20 68 64 30 64", "M44 64 L72 110"],
  S: ["M70 34 C60 16 30 22 30 42 C30 58 70 60 70 86 C70 110 36 114 26 94"],
  T: ["M50 20 L50 110", "M22 20 L78 20"],
  U: ["M28 20 L28 84 C28 112 72 112 72 84 L72 20"],
  V: ["M26 20 L50 110", "M74 20 L50 110"],
  W: ["M18 20 L34 110", "M50 44 L34 110", "M50 44 L66 110", "M82 20 L66 110"],
  X: ["M28 20 L72 110", "M72 20 L28 110"],
  Y: ["M28 20 L50 66", "M72 20 L50 66", "M50 66 L50 110"],
  Z: ["M28 20 L72 20", "M72 20 L28 110", "M28 110 L72 110"],

  a: ["M66 78 C58 62 26 60 24 86 C22 112 58 116 66 96", "M66 64 L66 110"],
  b: ["M30 20 L30 110", "M30 78 C40 60 72 64 72 87 C72 110 40 114 30 96"],
  c: ["M68 76 C60 60 28 60 28 87 C28 114 60 114 68 98"],
  d: ["M66 78 C58 62 26 60 24 86 C22 112 58 116 66 96", "M66 20 L66 110"],
  e: ["M28 88 L68 88 C68 66 34 58 28 84 C22 110 54 118 66 102"],
  f: ["M64 32 C58 18 40 20 40 38 L40 110", "M26 64 L58 64"],
  g: ["M66 78 C58 62 26 60 24 86 C22 112 58 116 66 96", "M66 64 L66 118 C66 138 38 140 32 124"],
  h: ["M30 20 L30 110", "M30 80 C40 62 66 64 66 84 L66 110"],
  i: ["M50 64 L50 110", "M50 42 L50 42.01"],
  j: ["M58 64 L58 118 C58 138 32 140 26 124", "M58 42 L58 42.01"],
  k: ["M30 20 L30 110", "M62 66 L30 92", "M41 83 L64 110"],
  l: ["M50 20 L50 110"],
  m: ["M26 64 L26 110", "M26 80 C32 62 50 66 50 82 L50 110", "M50 80 C56 62 74 66 74 82 L74 110"],
  n: ["M32 64 L32 110", "M32 82 C40 62 68 64 68 84 L68 110"],
  o: ["M50 64 C28 64 24 76 24 87 C24 98 28 110 50 110 C72 110 76 98 76 87 C76 76 72 64 50 64"],
  p: ["M30 64 L30 136", "M30 78 C40 60 72 64 72 87 C72 110 40 114 30 96"],
  q: ["M66 78 C58 62 26 60 24 86 C22 112 58 116 66 96", "M66 64 L66 136", "M66 136 C70 130 74 128 78 128"],
  r: ["M32 64 L32 110", "M32 84 C38 66 54 62 62 70"],
  s: ["M62 74 C54 60 32 64 32 76 C32 88 62 84 62 98 C62 112 36 112 30 100"],
  t: ["M46 34 L46 100 C46 110 56 112 64 108", "M30 64 L64 64"],
  u: ["M30 64 L30 92 C30 112 66 112 66 90 L66 64", "M66 64 L66 110"],
  v: ["M30 64 L50 110", "M70 64 L50 110"],
  w: ["M22 64 L36 110", "M50 78 L36 110", "M50 78 L64 110", "M78 64 L64 110"],
  x: ["M32 64 L68 110", "M68 64 L32 110"],
  y: ["M30 64 L50 104", "M70 64 L44 118 C38 130 32 132 26 128"],
  z: ["M32 64 L68 64", "M68 64 L32 110", "M32 110 L68 110"]
};

// Every character we can animate. Digraphs animate letter-by-letter.
export function strokesForChar(char) {
  return LETTER_STROKES[char] || null;
}

// Rough per-stroke draw time so long strokes take visibly longer than dots.
export function strokeLengthEstimate(path) {
  const nums = String(path).match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  let length = 0;
  for (let i = 2; i + 1 < nums.length; i += 2) {
    length += Math.hypot(nums[i] - nums[i - 2], nums[i + 1] - nums[i - 1]);
  }
  return Math.max(12, length * 0.72);
}
