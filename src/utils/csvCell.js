// Spreadsheet importers can ignore leading whitespace/control characters and
// accept compatibility forms of formula operators. Inspect a normalized copy;
// preserve the original text, including whitespace and Unicode, in the export.
const FORMULA_PREFIX = /^[\s\p{Cc}\p{Cf}]*[=+@-]/u;

export function csvCell(value) {
  const text = String(value ?? "");
  // Actual numeric cells (including negative scores) remain numbers on import.
  // Numeric-looking strings are untrusted text and get no numeric exemption.
  const literal = typeof value !== "number" && FORMULA_PREFIX.test(text.normalize("NFKC"))
    ? `'${text}`
    : text;
  return `"${literal.replaceAll('"', '""')}"`;
}
