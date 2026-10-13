import { appReadingLevelLabel } from "./bookTextAnalysis.js";

export function readingRecommendationReason(item, matchedFocusLabels = []) {
  const level = appReadingLevelLabel(item.readingLevel);
  const basis = item.readingLevelSource === "saved-reading"
    ? `${level} is the same text band as the most recently opened levelled book${item.referenceBookTitle ? `, ${item.referenceBookTitle}` : ""}. Opening a book does not establish independent reading ability.`
    : item.readingLevelSource === "teacher-selected-text"
      ? `${level} is the text band selected for browsing.`
      : `${level} is the simplest reviewed text band available in this selection. It is a starting suggestion, not a reading assessment.`;
  return {
    shortReason: matchedFocusLabels.length ? `Supports ${matchedFocusLabels.join(" and ")}.` : "Suggested by text band, with no specific skill match.",
    basis,
    evidence: [...(matchedFocusLabels.length ? [`The book supports ${matchedFocusLabels.join(" and ")}.`] : []), ...(item.reasons || [])].join(" ")
  };
}

export function readingRecommendationSummary(items = [], { evidenceReady = true } = {}) {
  const levels = [...new Set(items.map(item => item.readingLevel).filter(Boolean))];
  const band = levels.length === 1 ? `${appReadingLevelLabel(levels[0])} books` : "Books";
  return `${band} to consider${evidenceReady ? "" : " while assessment results are unavailable"}. These bands describe the text. Review each book’s reason and choose the reading support the child needs.`;
}
