export const LITERACY_MOCK_SHORT_ITEM_COUNTS = Object.freeze([15, 25, 40]);

// Short V12 sittings cap the existing route; they never lower the number of
// independent observations needed to promote or confirm an area's boundary.
export function literacyMockQuestionLimit(version, requested, maximum) {
  const count = requested ?? maximum;
  if (count === maximum || version === 'literacy-mock-v12' && LITERACY_MOCK_SHORT_ITEM_COUNTS.includes(count)) return count;
  throw new Error(`Unsupported question limit for ${version}.`);
}
