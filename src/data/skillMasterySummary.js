export function buildSkillMasterySummaryRows({
  itemMastery,
  skillTree,
  configuredCoverageTotals,
  getSkillIdForMasteryRow,
  formatMasteryItemLabel,
  getRepresentativeWordsForItem,
  normalizeItemKey
}) {
  const masteredRows = Object.values(itemMastery || {})
    .filter(row => row?.itemKey && row?.itemType && (row.mastered || row.correct > 0));
  const rowsByStage = new Map();

  masteredRows.forEach(row => {
    const skillId = getSkillIdForMasteryRow(row);
    if (!skillId) return;
    const currentRows = rowsByStage.get(skillId) || [];
    if (!currentRows.some(existing =>
      normalizeItemKey(existing.itemType) === normalizeItemKey(row.itemType)
      && normalizeItemKey(existing.itemKey) === normalizeItemKey(row.itemKey)
    )) {
      currentRows.push(row);
    }
    rowsByStage.set(skillId, currentRows);
  });

  return skillTree.map(stage => {
    const rows = (rowsByStage.get(stage.id) || []).sort((a, b) =>
      a.itemType.localeCompare(b.itemType)
      || a.itemKey.localeCompare(b.itemKey)
    );
    const groups = rows.map(row => ({
      itemKey: row.itemKey,
      itemType: row.itemType,
      label: formatMasteryItemLabel(row, stage),
      words: getRepresentativeWordsForItem(stage.id, row.itemType, row.itemKey)
    })).filter(group => group.label);
    const configured = configuredCoverageTotals[stage.id];
    const unit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words/items" : "items");
    const formatGroupSummary = group => {
      if (stage.id === "initial_sounds" || stage.id === "final_sounds") {
        return group.label.replace(/^\/|\/$/g, "");
      }
      if (stage.id === "rhyming") return group.label;
      return group.words.length
        ? `${group.label} (${group.words.join(", ")})`
        : group.label;
    };
    const detail = groups.map(formatGroupSummary).join(", ");

    return {
      skillId: stage.id,
      skillName: stage.label,
      masteredCount: groups.length,
      unit,
      groups,
      displayText: groups.length
        ? `${stage.label}: ${groups.length} ${unit} mastered - ${detail}.`
        : `${stage.label}: no item-level mastery details yet.`
    };
  });
}
