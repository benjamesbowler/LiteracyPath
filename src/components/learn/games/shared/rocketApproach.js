// Reading time belongs to the word, not to the current scenery/boost speed.
export function rocketWordSpeed(requestedSpeed, clipSeconds) {
  return Math.min(requestedSpeed, 40 / (Math.max(0.4, clipSeconds) + 1.25));
}

export function rocketCueLead(clipSeconds) {
  return Math.max(0.4, clipSeconds) + 0.18;
}

export function rocketWordSpacing(clipSeconds, difficulty) {
  return Math.max(difficulty === 'easy' ? 2.05 : 1.25, rocketCueLead(clipSeconds) + 0.35);
}
