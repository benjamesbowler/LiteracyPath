// THE ONE LABEL RULE for grapheme ids, shared by child-facing shells and
// teacher-facing reports (DOM-free — safe in node tests, workers, and print).
//
// Three kinds of underscore id, three renderings:
//   a_e (split digraph)      → "a–e"   the child knows it as "magic e"
//   suffix_s (morph)         → "–s"    not the jargon string "suffix–s"
//   y_ie / oo_short (alts)   → "y"/"oo" an alternative PRONUNCIATION of the
//                                       same written letter — the label is the
//                                       letter, deliberately
//
// Before this module, the game rendered "y–ie" while the teacher heat map
// rendered split digraph a_e as a bare "a" — identical to short a, a real
// collision on a report a teacher acts on.
export function graphemeLabel(id) {
  const g = String(id || "");
  if (g.startsWith("hw:")) return g.slice(3);           // hw:the -> the
  if (g === "sign:read") return "reading signs";        // comprehension row
  if (!g.includes("_")) return g;
  if (/^[a-z]_e$/.test(g)) return g.replace("_", "–");
  if (g.startsWith("suffix_")) return `–${g.slice("suffix_".length)}`;
  return g.split("_")[0];
}
