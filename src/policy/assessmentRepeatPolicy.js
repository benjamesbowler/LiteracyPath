const norm = value => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

export const CLOSED_SET_FORMATS = new Set([
  "LONG_VOWEL_SILENT_E_PATTERN", "DIGRAPH_COMPLETE_WORD", "BLEND_COMPLETE_WORD",
  "MISSING_VOWEL_CVC", "LISTEN_CHOOSE_VOWEL", "R_CONTROLLED_PATTERN",
  "PICTURE_AUDIO_TO_PATTERN", "LONG_VOWEL_TEAM_COMPLETE", "PLURAL_TEXT_CHOICE",
  "PREPOSITION_SCENE_CHOICE", "PREPOSITION_TEXT_CHOICE",
  "PREPOSITION_SENTENCE_FIT", "PREPOSITION_PRECISION"
]);

export function optionSetSignature(item) {
  // Tile-build items have no option SET — their single "choice" is the answer
  // and the variance lives in the tile bank, so set-uniqueness does not apply.
  if ((Array.isArray(item.soundTiles) && item.soundTiles.length) ||
      (Array.isArray(item.letterTiles) && item.letterTiles.length)) return "";
  return (item.choices || []).map(c => norm(c.text ?? c)).sort().join("|");
}
export function promptAnswerSignature(item) {
  // targetWord distinguishes image-pinned items whose printed prompt is
  // deliberately generic (LISTEN_CHOOSE_VOWEL never prints the word): two
  // items with the same prompt and answer but different pictured targets are
  // different questions, not duplicates.
  return `${norm(item.prompt)}||${norm(item.passage || "")}||${norm(item.sentence || "")}||${norm(item.answer)}||${norm(item.targetWord || item.target || "")}||${optionSetSignature(item)}`;
}
