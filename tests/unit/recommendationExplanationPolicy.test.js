import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOMMENDATION_EXPLANATION_POLICY,
  RECOMMENDATION_EXPLANATION_SURFACES,
  buildChildRecommendationExplanation,
  buildTeacherRecommendationExplanation,
  requireRecommendationSurface
} from "../../src/policy/recommendationExplanationPolicy.js";

test("child recommendation explanations stay brief and versioned", () => {
  const explanation = buildChildRecommendationExplanation(
    "This is your next step in today’s adventure."
  );
  assert.equal(explanation.policyId, "recommendation-explanation");
  assert.equal(explanation.policyVersion, RECOMMENDATION_EXPLANATION_POLICY.version);
  assert.equal(explanation.summary, "This is your next step in today’s adventure.");
  assert.throws(
    () => buildChildRecommendationExplanation("x".repeat(121)),
    /exceeds 120 characters/
  );
});

test("every registered recommendation surface is audience-specific", () => {
  assert.equal(RECOMMENDATION_EXPLANATION_SURFACES.child.length, 5);
  assert.equal(RECOMMENDATION_EXPLANATION_SURFACES.teacher.length, 4);
  assert.equal(requireRecommendationSurface("student-home", "child"), "student-home");
  assert.equal(requireRecommendationSurface("teacher-today", "teacher"), "teacher-today");
  assert.throws(
    () => requireRecommendationSurface("teacher-today", "child"),
    /not registered for child/
  );
});

test("teacher recommendation explanations require all four reasoning fields", () => {
  const explanation = buildTeacherRecommendationExplanation({
    evidence: "12 scored responses at 58% accuracy.",
    dependency: "Secure initial blending before connected text.",
    confidence: "Moderate evidence across two skills.",
    unlock: "A re-check can confirm readiness for the next pattern."
  });
  assert.deepEqual(
    RECOMMENDATION_EXPLANATION_POLICY.teacherFields.map(field => explanation[field]),
    [
      "12 scored responses at 58% accuracy.",
      "Secure initial blending before connected text.",
      "Moderate evidence across two skills.",
      "A re-check can confirm readiness for the next pattern."
    ]
  );
  assert.throws(
    () => buildTeacherRecommendationExplanation({
      evidence: "12 responses.",
      dependency: "",
      confidence: "Moderate.",
      unlock: "Next check."
    }),
    /requires dependency/
  );
});
