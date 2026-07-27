export const RECOMMENDATION_EXPLANATION_POLICY = Object.freeze({
  id: "recommendation-explanation",
  version: "2026.07.24-a4.4",
  childMaximumCharacters: 120,
  teacherFields: Object.freeze([
    "evidence",
    "dependency",
    "confidence",
    "unlock"
  ])
});

export const RECOMMENDATION_EXPLANATION_SURFACES = Object.freeze({
  child: Object.freeze([
    "student-home",
    "phonics-letter",
    "adventure-map",
    "arcade",
    "guided-reading"
  ]),
  teacher: Object.freeze([
    "teacher-dashboard-next-steps",
    "teacher-today",
    "guided-reading",
    "targeted-review"
  ])
});

function requiredText(value, field) {
  const text = String(value || "").trim();
  if (!text) {
    throw new TypeError(`Recommendation explanation requires ${field}.`);
  }
  return text;
}

export function requireRecommendationSurface(surface, audience) {
  const normalizedAudience = requiredText(audience, "an audience");
  const normalizedSurface = requiredText(surface, "a surface");
  const registered = RECOMMENDATION_EXPLANATION_SURFACES[normalizedAudience] || [];
  if (!registered.includes(normalizedSurface)) {
    throw new RangeError(
      `Recommendation surface ${normalizedSurface} is not registered for ${normalizedAudience}.`
    );
  }
  return normalizedSurface;
}

export function buildChildRecommendationExplanation(reason) {
  const summary = requiredText(reason, "a child reason");
  if (summary.length > RECOMMENDATION_EXPLANATION_POLICY.childMaximumCharacters) {
    throw new RangeError(
      `Child recommendation reason exceeds `
      + `${RECOMMENDATION_EXPLANATION_POLICY.childMaximumCharacters} characters.`
    );
  }
  return {
    policyId: RECOMMENDATION_EXPLANATION_POLICY.id,
    policyVersion: RECOMMENDATION_EXPLANATION_POLICY.version,
    summary
  };
}

export function buildTeacherRecommendationExplanation({
  evidence,
  dependency,
  confidence,
  unlock
} = {}) {
  return {
    policyId: RECOMMENDATION_EXPLANATION_POLICY.id,
    policyVersion: RECOMMENDATION_EXPLANATION_POLICY.version,
    evidence: requiredText(evidence, "evidence"),
    dependency: requiredText(dependency, "dependency"),
    confidence: requiredText(confidence, "confidence"),
    unlock: requiredText(unlock, "unlock")
  };
}
