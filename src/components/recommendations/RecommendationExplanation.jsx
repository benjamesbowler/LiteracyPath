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
          <dt>Results used</dt>
          <dd>{normalized.evidence}</dd>
        </div>
        <div>
          <dt>Why now</dt>
          <dd>{normalized.dependency}</dd>
        </div>
        <div>
          <dt>How certain</dt>
          <dd>{normalized.confidence}</dd>
        </div>
        <div>
          <dt>What next</dt>
          <dd>{normalized.unlock}</dd>
        </div>
      </dl>
    </details>
  );
}
