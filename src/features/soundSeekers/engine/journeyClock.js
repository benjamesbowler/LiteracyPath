function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
}

function nonNegativeInteger(value) {
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "string") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

// The visible route loops after forty stops. Learning time does not: review
// spacing is always measured against this persisted ordinal.
export function advanceJourney(trail = {}, _completedStopId) {
  void _completedStopId;
  const routeCursor = positiveInteger(trail?.routeCursor);
  const journeyStep = positiveInteger(trail?.journeyStep);
  return {
    ...trail,
    routeCursor: routeCursor >= 40 ? 1 : routeCursor + 1,
    journeyStep: journeyStep + 1
  };
}

export function dueAtJourneyStep(_target, lastSeen, gap, currentJourneyStep) {
  const seenStep = Number(lastSeen?.journeyStep);
  const currentStep = Number(currentJourneyStep);
  const validGap = nonNegativeInteger(gap);
  if (!Number.isFinite(seenStep) || seenStep < 0 || !Number.isFinite(currentStep) || currentStep < seenStep || validGap === null) {
    return false;
  }
  return currentStep - seenStep >= validGap;
}
