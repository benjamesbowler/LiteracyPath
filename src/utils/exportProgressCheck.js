export function progressTeachNext(record) {
  return [...(record.metadata?.result?.strands || [])]
    .sort((a, b) => b.incorrectCount - a.incorrectCount || a.independentCount - b.independentCount)
    .slice(0, 2);
}
export const progressSampleScope = Object.freeze({
  hear_sounds: "Matching initial sounds in spoken words",
  printed_words: "Matching a heard regular word to its printed form",
  common_words: "Matching a heard common word to its printed form",
  word_meaning: "Recognizing a spoken synonym",
  listening_stories: "Retrieving an explicit detail from a spoken story",
  reading_stories: "Retrieving an explicit detail from printed text"
});
function evidenceChunks(record) {
  const json = JSON.stringify(record), rows = [];
  for (let offset = 0; offset < json.length; offset += 30000) rows.push([record.attemptId, rows.length + 1, json.slice(offset, offset + 30000)]);
  return rows;
}
export function progressExportSheets(records = []) {
  return {
    Cover: [["Literacy Guide progress evidence"], ["Descriptive original selected-response questions using approved recorded stimuli"], ["No MAP, RIT, norm, grade-equivalent or calibrated growth score"], ["Known exposure is excluded; unknown familiarity remains a limitation"]],
    Summary: [["Learner ID", "Attempt", "Date", "Plan", "Status", "Strand", "Correct", "Incorrect", "Independent", "Unscored", "Stop reason"], ...records.flatMap(record => (record.metadata?.result?.strands || []).map(row => [record.studentId, record.attemptId, record.completedAt || record.startedAt, record.metadata?.planKind, record.administrationStatus, row.label, row.correctCount, row.incorrectCount, row.independentCount, row.unscoredCount, row.stopReason]))],
    "Teach next": [["Learner ID", "Strand", "Follow-up"], ...records.flatMap(record => progressTeachNext(record).map(row => [record.studentId, row.label, row.independentCount ? row.suggestion : "Collect fresh independent responses before drawing a conclusion."]))],
    "Item evidence": [["Attempt", "Item", "Family", "Strand", "Ordinal tier", "State", "First selection", "Correct", "Required media delivered", "Route before", "Route after", "Prompt", "Stimulus"], ...records.flatMap(record => (record.questionRecords || []).map(row => [record.attemptId, row.questionId, row.stimulusFamilyId, row.trackId, row.difficultyTier + 1, row.responseStatus, row.firstResponse ?? row.selected, row.isCorrect, row.mediaReady, row.routeBefore, row.routeAfter, row.itemSnapshot?.prompt, row.itemSnapshot?.passage || row.itemSnapshot?.targetWord]))],
    "How to read": [["Independent correct and incorrect answers alone move the same strand by one ordinal tier."], ["Skips, support, no response and media failures are separate unscored events."], ["Below 10 independent answers: no proficiency conclusion. 10–19: provisional evidence."], ["Broad profiles intentionally sample few items per strand."], ["Contradictory responses continue to the cap; no artificial boundary is inferred."], ["Tier ordering is author judgement, not an interval scale. Across-check tier changes do not establish growth."], ["Printed word and story tasks do not provide oral reading fluency evidence."]],
    Data: [["Attempt", "Part (join in order)", "Evidence JSON fragment"], ...records.flatMap(evidenceChunks)],
    Provenance: [["Attempt", "Instrument", "Content", "Difficulty", "Policy", "Seed", "Exposure", "Starting points"], ...records.map(record => [record.attemptId, record.metadata?.instrumentId, record.contentVersion, record.metadata?.difficultyVersion, record.policyVersion, record.metadata?.seed, JSON.stringify(record.metadata?.exposureSnapshot || {}), JSON.stringify(record.metadata?.startingPoints || {})])]
  };
}
export async function exportProgressCheckWorkbook(records) {
  const module = await import("exceljs");
  const Workbook = module.default?.Workbook || module.Workbook;
  const book = new Workbook();
  for (const [name, rows] of Object.entries(progressExportSheets(records))) {
    const sheet = book.addWorksheet(name); sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3451C6" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.columns.forEach(column => { column.width = 26; });
    sheet.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; });
  }
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "literacy-progress-evidence.xlsx"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
