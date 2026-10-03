// Picture/audio first; repeated mistakes earn a partial spelling clue.
export const PHONICS_HINT_AFTER_MISTAKES = 2;
export function phonicsTargetHint(word, mistakes = 0) {
  const target = String(word || "").trim();
  if (mistakes < PHONICS_HINT_AFTER_MISTAKES || !/^[a-z]{2,}$/i.test(target)) return "";
  const ending = target.match(/(?:ck|sh|ch|th|ng|ff|ll|ss|zz|ee|oo|ai|ay|oa|ow|ar|er|ir|ur|or|oy|oi|ue|ew)$/i)?.[0] || target.slice(-1);
  const visible = ending.length < target.length ? ending : target.slice(-1);
  return "*".repeat(target.length - visible.length) + visible;
}
