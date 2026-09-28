/** Known defects in frozen legacy content. Historical records are never rewritten. */
export function getElBenchmarkItemContentIssue(item = {}) {
  if (item.id !== "pa-k-moy-c-08-v1") return null;
  return {
    id: "legacy-fox-phoneme-count",
    reason: "directions_or_material_issue",
    message: "This earlier prompt groups the two sounds in x as one. Do not administer or score it. Record it as not scorable and use a current form for a fresh assessment."
  };
}
