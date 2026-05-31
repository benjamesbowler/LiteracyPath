export function calculateRoundCorrect(roundAnswers = []) {
  return roundAnswers.filter(Boolean).length;
}

export function calculateRoundProgress(roundAnswers = [], roundLength = 1) {
  return Math.round((roundAnswers.length / Math.max(roundLength, 1)) * 100);
}

export function calculateAccuracy({ totalAnswered = 0, correctAnswered = 0 } = {}) {
  return totalAnswered === 0 ? 0 : Math.round((correctAnswered / totalAnswered) * 100);
}

export function getAssessmentAttemptType(assessmentMode = "mastery") {
  return assessmentMode === "mastery" ? "skill_checkpoint" : assessmentMode;
}
