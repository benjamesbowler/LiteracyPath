// Shared by full narration and compact, generated audio lookups. Keep this
// import-free so reading a label never downloads the narration catalogues.
export function normalizeLedaAudioText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/^hfw:/i, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}
