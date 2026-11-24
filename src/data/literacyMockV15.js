import { LITERACY_MOCK_REVIEWED_VERSION } from '../policy/literacyMockVersions.js';
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';
import { LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS } from '../policy/literacyMockContinuousRouting.js';
import { reviewFoundationItem } from './literacyMockReviewedFoundations.js';
import { reviewComprehensionItem } from './literacyMockReviewedComprehension.js';
import { reviewLanguageItem, reviewLanguagePicturePaths } from './literacyMockReviewedLanguage.js';

const excluded = new Set(LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS);

export function buildLiteracyMockV15(previous) {
  return previous.map(({ itemSnapshot: original }) => {
    let item = original;
    if (original.adaptiveMixedEligible && !original.tutorialOnly) {
      if (!isLiteracyItemEligible(original) || excluded.has(original.id)) {
        item = { ...original, adaptiveMixedEligible: false };
      } else {
        item = reviewLanguagePicturePaths(original);
        item = reviewComprehensionItem(reviewFoundationItem(reviewLanguageItem(item)));
      }
    }
    const snapshot = { ...item, contentVersion: LITERACY_MOCK_REVIEWED_VERSION };
    return { ...snapshot, itemSnapshot: snapshot };
  });
}
