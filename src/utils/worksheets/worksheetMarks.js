import { WORKSHEET_MARK_STATES } from "../../content/worksheets/worksheetEvidenceDescriptors.js";

export function createBlankWorksheetMarks(learnerIds, targetKeys) {
  return learnerIds.flatMap(learnerId => targetKeys.map(targetKey => ({ learnerId, targetKey, itemId: null, state: "not_checked", note: "", purpose: "practice" })));
}

export function validateWorksheetMarks({ marks, allowedLearnerIds, allowedTargetKeys }) {
  const learners = new Set(allowedLearnerIds);
  const targets = new Set(allowedTargetKeys);
  const states = new Set(WORKSHEET_MARK_STATES);
  const seen = new Set();
  return marks.map(mark => {
    if (!learners.has(mark.learnerId)) throw new Error("Worksheet mark contains a learner outside the frozen batch.");
    if (!targets.has(mark.targetKey)) throw new Error("Worksheet mark contains a target outside the frozen recipe.");
    if (!states.has(mark.state)) throw new Error(`Unsupported worksheet mark state: ${mark.state}`);
    const identity = `${mark.learnerId}:${mark.targetKey}:${mark.itemId || "target"}`;
    if (seen.has(identity)) throw new Error(`Duplicate worksheet mark: ${identity}`);
    seen.add(identity);
    return { learnerId: mark.learnerId, targetKey: mark.targetKey, itemId: mark.itemId || null, state: mark.state, note: String(mark.note || ""), purpose: "practice" };
  });
}
