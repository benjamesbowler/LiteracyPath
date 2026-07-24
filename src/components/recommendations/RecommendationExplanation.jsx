import {
  buildChildRecommendationExplanation,
  buildTeacherRecommendationExplanation,
  requireRecommendationSurface
} from "../../policy/recommendationExplanationPolicy.js";

export function ChildRecommendationExplanation({ reason, surface, className = "" }) {
  const explanation = buildChildRecommendationExplanation(reason);
  const registeredSurface = requireRecommendationSurface(surface, "child");
  return (
    <span
      className={className}
      data-recommendation-explanation="child"
      data-recommendation-policy={explanation.policyId}
      data-recommendation-version={explanation.policyVersion}
      data-recommendation-surface={registeredSurface}
    >
      {explanation.summary}
    </span>
  );
}

export function TeacherRecommendationExplanation({
  explanation,
  surface,
  defaultOpen = false
}) {
  const normalized = buildTeacherRecommendationExplanation(explanation);
  const registeredSurface = requireRecommendationSurface(surface, "teacher");
  return (
    <details
      className="teacher-recommendation-explanation"
      data-recommendation-explanation="teacher"
      data-recommendation-policy={normalized.policyId}
      data-recommendation-version={normalized.policyVersion}
      data-recommendation-surface={registeredSurface}
      open={defaultOpen || undefined}
    >
      <summary>Why this next?</summary>
      <dl>
        <div>
          <dt>Evidence</dt>
          <dd>{normalized.evidence}</dd>
        </div>
        <div>
          <dt>Dependency</dt>
          <dd>{normalized.dependency}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{normalized.confidence}</dd>
        </div>
        <div>
          <dt>Unlock</dt>
          <dd>{normalized.unlock}</dd>
        </div>
      </dl>
    </details>
  );
}
