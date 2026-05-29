import assessmentAudioInventory from "./assessmentAudioInventory.generated.json";
import assessmentAudioCoverage from "./assessmentAudioCoverageSummary.generated.json";

export const assessmentAudioCoverageSummary = assessmentAudioInventory.summary;
export const assessmentAudioCoverageReport = assessmentAudioCoverage;
export const assessmentAudioStandardVoice = assessmentAudioInventory.standardVoice;
export const assessmentAudioInventoryItems = assessmentAudioInventory.items;

export function getAssessmentAudioCoverageByStatus() {
  return assessmentAudioInventory.items.reduce((counts, item) => {
    const status = item.status || "UNKNOWN";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

export function getAssessmentAudioCoverageByIssue() {
  return assessmentAudioInventory.items.reduce((counts, item) => {
    for (const issue of item.issues || []) {
      counts[issue] = (counts[issue] || 0) + 1;
    }
    return counts;
  }, {});
}
