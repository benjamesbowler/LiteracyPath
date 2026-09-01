function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
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
  if (!Number.isFinite(seenStep) || seenStep < 0 || !Number.isFinite(currentStep) || currentStep < seenStep) {
    return false;
  }
  return currentStep - seenStep >= nonNegativeInteger(gap);
}
