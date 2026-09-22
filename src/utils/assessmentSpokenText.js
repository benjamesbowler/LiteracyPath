/** A missing answer becomes a pause; the instructional noun "blank" is speech. */
export function normalizeSpokenCloze(text) {
  return String(text || "")
    .replace(/\s*(?:_{2,}|\bhmm\b)\s*/gi, " … ")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
}
