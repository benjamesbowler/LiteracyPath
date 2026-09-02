import { validateSceneVisualAccess } from "../engine/sceneVisualAccess.js";
import { SOUND_SEEKERS_LANDMARK_BINDINGS } from "./sceneVisualCatalog.js";

function stateShapePath(shapeId) {
  if (shapeId.endsWith("-2")) return "M 24 148 L 45 55 L 83 22 L 119 58 L 142 148 Z";
  if (shapeId.endsWith("-3")) return "M 20 148 Q 24 72 80 26 Q 136 72 140 148 Z";
  if (shapeId.endsWith("-4")) return "M 19 148 L 34 67 L 80 20 L 128 68 L 141 148 L 103 130 L 80 153 L 55 130 Z";
  if (shapeId.endsWith("-1")) return "M 25 148 L 25 73 Q 80 14 135 73 L 135 148 Z";
  return "M 30 148 L 42 89 L 73 72 L 92 91 L 131 79 L 139 148 Z";
}
function partPosition(index, partCount) {
  const spread = partCount === 1 ? 0 : (index / (partCount - 1)) - 0.5;
  return {
    x: 80 + (spread * 84),
    y: 96 - ((index % 2) * 24)
  };
}

function selectedBindingForState(landmark, stateId) {
  return landmark.postDecisionBindings.find(binding => (
    binding.actionStateId === stateId
      || binding.resolvedStateId === stateId
      || binding.consequenceId === stateId
  )) ?? null;
}

function requireSelectedStateAccess({
  landmark,
  stateId,
  activeAttemptId,
  reducerRevision,
  sceneAccess
}) {
  if (stateId === landmark.initialStateId) return;
  const binding = selectedBindingForState(landmark, stateId);
  const hasCurrentAccess = validateSceneVisualAccess(sceneAccess, {
    sceneId: landmark.sceneId,
    attemptId: activeAttemptId,
    reducerRevision
  });
  if (!binding || !hasCurrentAccess
    || sceneAccess.postDecisionSemanticId !== binding.postDecisionSemanticId
    || sceneAccess.storyOutcomeId !== binding.storyOutcomeId) {
    throw new TypeError("Landmark state is not authorized by the selected current branch");
  }
}

export function Landmark({
  landmark,
  stateId,
  activeAttemptId = null,
  reducerRevision = null,
  sceneAccess = null
}) {
  if (!SOUND_SEEKERS_LANDMARK_BINDINGS.includes(landmark)) {
    throw new TypeError("Landmark renderer requires a canonical landmark binding");
  }
  const stateVisual = typeof stateId === "string" ? landmark.stateVisuals[stateId] : null;
  if (!stateVisual) throw new TypeError(`Unknown landmark state: ${String(stateId)}`);
  requireSelectedStateAccess({
    landmark,
    stateId,
    activeAttemptId,
    reducerRevision,
    sceneAccess
  });

  const parts = Array.from({ length: stateVisual.partCount }, (_, index) => (
    <g
      key={index}
      data-landmark-part={String(index + 1)}
      transform={`translate(${partPosition(index, stateVisual.partCount).x} ${partPosition(index, stateVisual.partCount).y})`}
    >
      <circle className="sound-seekers-landmark__part" r={index % 2 === 0 ? 13 : 10} />
      <path className="sound-seekers-landmark__part-mark" d="M -6 0 L 6 0 M 0 -6 L 0 6" />
    </g>
  ));

  return (
    <figure
      className="sound-seekers-landmark"
      role="img"
      aria-label={stateVisual.accessibleLabel}
      data-landmark-id={landmark.id}
      data-landmark-state={stateId}
      data-visual-state-id={stateId}
      data-landmark-shape={stateVisual.shapeId}
      data-landmark-part-count={String(stateVisual.partCount)}
      data-landmark-pattern={stateVisual.patternId}
    >
      <svg viewBox="0 0 160 170" aria-hidden="true" focusable="false">
        <path className="sound-seekers-landmark__silhouette" d={stateShapePath(stateVisual.shapeId)} />
        <g className="sound-seekers-landmark__pattern" data-pattern-id={stateVisual.patternId}>
          <path d="M 31 126 Q 79 106 133 126" />
          <path d="M 38 143 Q 80 124 126 143" />
        </g>
        {parts}
      </svg>
      <figcaption>{stateVisual.accessibleLabel}</figcaption>
    </figure>
  );
}
