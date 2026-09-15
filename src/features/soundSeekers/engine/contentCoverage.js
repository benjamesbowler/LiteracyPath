import {
  getContentDeckActionBindings,
  getContentDeckOwnerBinding
} from "../content/contentDeckBindings.js";
import {
  CONTENT_DECK_CATEGORIES,
  getContentDeckCatalog
} from "../content/contentDeckCatalogs.js";
import { rehydrateServedContentInstance } from "./contentDeckScheduler.js";
import { normalizeContentUseState, validContentDeckUses } from "./contentUseValidation.js";

// Keep existing gameplay consumers on the same validator as saved progress.
export {
  validAttemptReceipts,
  validContentDeckUses,
  deriveContentDeckRecordStats
} from "./contentUseValidation.js";

const COVERAGE_TOTALS = Object.freeze({
  heartWords: 60,
  stories: 40,
  alternatives: 4,
  morphology: 1,
  transfer: 40
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function coverageStatus(rawState) {
  const state = normalizeContentUseState(rawState);
  const categories = {};
  for (const category of CONTENT_DECK_CATEGORIES) {
    const catalogIds = new Set(getContentDeckCatalog(category).map(record => record.recordId));
    const covered = new Set();
    for (const use of validContentDeckUses(state, category)) {
      const served = rehydrateServedContentInstance(state.contentDecks, {
        category,
        visitId: use.visitId
      });
      if (!served || !catalogIds.has(use.recordId)) continue;
      const bindings = getContentDeckActionBindings(category, use.contentInstanceId);
      const binding = bindings.find(item => item.actionUseId === use.actionUseId);
      const owner = getContentDeckOwnerBinding(category, use.slotId);
      if (!binding || !owner || served.ownerActionUseId !== owner.actionUseId
        || (category === "heartWords"
          && use.activityType !== binding.requiredActivityType)) continue;
      covered.add(use.recordId);
    }
    categories[category] = {
      coveredRecordCount: covered.size,
      totalRecordCount: COVERAGE_TOTALS[category]
    };
  }
  return deepFreeze({
    complete: CONTENT_DECK_CATEGORIES.every(category =>
      categories[category].coveredRecordCount === categories[category].totalRecordCount),
    categories
  });
}
