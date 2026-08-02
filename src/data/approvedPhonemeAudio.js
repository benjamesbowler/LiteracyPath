// Human-ear approved phoneme cues from the August 2026 Leda review.
//
// One reviewed recording may serve several spellings that genuinely share the
// same sound. Keeping the aliases here avoids duplicate audio files and makes a
// later human-recorded replacement a one-line path change.

const reviewed = fileName => `/audio/phonemes/reviewed/${fileName}.mp3`;

export const APPROVED_PHONEME_AUDIO_BY_KEY = Object.freeze({
  b: reviewed("b"),
  e: reviewed("short-e"),
  j: reviewed("j-soft-g"),
  g_j: reviewed("j-soft-g"),

  // Temporary synthetic fallback. Replace this path when the future human /z/
  // take passes review; lesson and game code should not need to change.
  zz: reviewed("zz-temporary-fallback"),

  sh: reviewed("sh"),
  ch: reviewed("ch"),
  th: reviewed("th-unvoiced"),
  th_voiced: reviewed("th-voiced"),
  nk: reviewed("nk"),

  a_e: reviewed("long-a"),
  ai: reviewed("long-a"),
  ay: reviewed("long-a"),

  y_ee: reviewed("long-e"),
  e_e: reviewed("long-e"),
  ee: reviewed("long-e"),
  ea: reviewed("long-e"),

  y_ie: reviewed("long-i"),
  i_e: reviewed("long-i"),
  igh: reviewed("long-i"),
  ie: reviewed("long-i"),

  o_e: reviewed("long-o"),
  oa: reviewed("long-o"),
  ow: reviewed("long-o"),
  oe: reviewed("long-o"),

  u_e: reviewed("long-u"),

  oo: reviewed("long-oo"),
  ue: reviewed("long-oo"),
  ew: reviewed("long-oo"),
  ew_yoo: reviewed("ew-yoo"),
  oo_short: reviewed("short-oo"),

  ou: reviewed("ow-cow"),
  ow_ou: reviewed("ow-cow"),
  oi: reviewed("oi-oy"),
  oy: reviewed("oi-oy"),

  or: reviewed("or-ore"),
  ore: reviewed("or-ore"),
  aw: reviewed("aw"),
  er: reviewed("er-ir-ur"),
  ir: reviewed("er-ir-ur"),
  ur: reviewed("er-ir-ur"),
  air: reviewed("air-are"),
  are: reviewed("air-are"),
  ear: reviewed("ear"),
  ure: reviewed("ure"),

  // Soft c is exactly the already-reviewed basic s cue.
  c_s: "/audio/phonemes/s.mp3",
  ch_k: reviewed("ch-k"),
  ea_e: reviewed("short-e"),
  le: reviewed("le"),
  tion: reviewed("tion")
});

export function getApprovedPhonemeAudioPath(value = "") {
  return APPROVED_PHONEME_AUDIO_BY_KEY[String(value || "").trim().toLowerCase()] || "";
}
