import { validateSceneVisualAccess } from "../engine/sceneVisualAccess.js";
import { SOUND_SEEKERS_LANDMARK_BINDINGS } from "./sceneVisualCatalog.js";

const LANDMARK_GEOMETRY = Object.freeze({
  "landmark-family-seed-gate": Object.freeze({
    silhouette: "M 18 150 L 25 70 Q 45 34 68 68 L 80 104 L 92 68 Q 116 34 136 70 L 143 150 Z",
    structure: "M 31 143 L 34 77 Q 49 51 63 76 M 129 143 L 126 77 Q 111 51 97 76 M 47 119 Q 80 91 113 119"
  }),
  "landmark-family-waterwheel": Object.freeze({
    silhouette: "M 19 150 L 29 111 L 48 111 A 43 43 0 1 1 117 111 L 138 111 L 143 150 Z",
    structure: "M 80 51 L 80 132 M 40 91 L 120 91 M 51 62 L 109 120 M 109 62 L 51 120 M 80 69 A 22 22 0 1 0 81 69"
  }),
  "landmark-family-fossil-arch": Object.freeze({
    silhouette: "M 17 150 L 25 94 Q 31 42 80 25 Q 129 42 137 94 L 145 150 L 111 150 L 104 96 Q 97 69 80 61 Q 63 69 56 96 L 49 150 Z",
    structure: "M 36 89 L 57 93 M 46 61 L 66 72 M 80 36 L 80 61 M 114 61 L 94 72 M 124 89 L 103 93"
  }),
  "landmark-family-forge-tower": Object.freeze({
    silhouette: "M 21 150 L 27 62 L 50 62 L 50 34 L 72 34 L 72 62 L 93 62 L 93 21 L 117 21 L 117 62 L 137 62 L 143 150 Z",
    structure: "M 38 137 L 38 76 L 63 76 L 63 137 M 83 137 L 83 76 L 126 76 L 126 137 M 94 92 L 115 92 M 94 107 L 115 107"
  }),
  "landmark-family-crystal-reed": Object.freeze({
    silhouette: "M 16 150 L 39 95 L 28 63 L 58 72 L 79 19 L 98 72 L 131 50 L 121 94 L 145 150 Z",
    structure: "M 79 31 L 79 139 M 43 77 L 66 96 L 50 134 M 120 66 L 96 94 L 111 135 M 60 111 L 99 111"
  }),
  "landmark-family-storm-beacon": Object.freeze({
    silhouette: "M 18 150 L 34 132 L 50 132 L 59 52 L 68 42 L 68 23 L 92 23 L 92 42 L 101 52 L 110 132 L 128 132 L 143 150 Z",
    structure: "M 58 68 L 102 68 M 55 92 L 105 92 M 51 119 L 109 119 M 69 39 L 91 39"
  }),
  "landmark-family-lantern-tree": Object.freeze({
    silhouette: "M 19 150 Q 32 117 54 108 L 43 79 Q 45 45 70 43 L 80 19 L 90 43 Q 117 45 119 79 L 106 108 Q 130 116 143 150 Z",
    structure: "M 80 49 L 80 142 M 55 71 Q 80 90 106 71 M 55 111 Q 80 95 106 111 M 43 139 Q 59 120 80 139 Q 101 120 119 139"
  }),
  "landmark-family-star-observatory": Object.freeze({
    silhouette: "M 18 150 L 28 103 L 49 103 Q 51 55 80 38 Q 109 55 111 103 L 133 103 L 143 150 Z M 60 43 L 80 15 L 100 43 Z",
    structure: "M 51 103 Q 80 74 109 103 M 80 48 L 80 103 M 35 119 L 125 119 M 49 136 L 111 136"
  })
});

function partPosition(index, partCount, stateRole) {
  const spread = partCount === 1 ? 0 : (index / (partCount - 1)) - 0.5;
  return {
    x: 80 + (spread * 84),
    y: (stateRole === "problem" ? 125 : 101) - ((index % 2) * 25)
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
  const geometry = LANDMARK_GEOMETRY[stateVisual.landmarkFamilyId];
  if (!geometry || stateVisual.landmarkFamilyId !== landmark.landmarkFamilyId) {
    throw new TypeError("Landmark family geometry is not canonical");
  }
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
      transform={`translate(${partPosition(index, stateVisual.partCount, stateVisual.stateRole).x} ${partPosition(index, stateVisual.partCount, stateVisual.stateRole).y})`}
    >
      {index % 3 === 0 ? (
        <path className="sound-seekers-landmark__part" d="M 0 -13 L 12 0 L 0 13 L -12 0 Z" />
      ) : index % 3 === 1 ? (
        <rect className="sound-seekers-landmark__part" x="-11" y="-10" width="22" height="20" rx="5" />
      ) : (
        <circle className="sound-seekers-landmark__part" r="11" />
      )}
      <path className="sound-seekers-landmark__part-mark" d={stateVisual.stateRole === "problem" ? "M -7 -7 L 7 7" : "M -6 1 L -1 6 L 7 -6"} />
    </g>
  ));

  return (
    <figure
      className="sound-seekers-landmark"
      role="img"
      aria-label={stateVisual.accessibleLabel}
      data-landmark-id={landmark.id}
      data-landmark-state={stateId}
      data-landmark-family={stateVisual.landmarkFamilyId}
      data-landmark-state-role={stateVisual.stateRole}
      data-visual-state-id={stateId}
      data-landmark-shape={stateVisual.shapeId}
      data-landmark-part-count={String(stateVisual.partCount)}
      data-landmark-pattern={stateVisual.patternId}
    >
      <svg viewBox="0 0 160 170" aria-hidden="true" focusable="false">
        <path className="sound-seekers-landmark__contact-shadow" d="M 20 151 Q 80 137 140 151 Q 80 166 20 151 Z" />
        <path className="sound-seekers-landmark__silhouette" d={geometry.silhouette} />
        <g className="sound-seekers-landmark__pattern" data-pattern-id={stateVisual.patternId}>
          <path d={geometry.structure} />
        </g>
        {parts}
        <g className="sound-seekers-landmark__status" data-landmark-status-symbol={stateVisual.stateRole}>
          <circle cx="134" cy="29" r="18" />
          <path d={stateVisual.stateRole === "problem"
            ? "M 134 19 L 134 32 M 134 39 L 134 40"
            : stateVisual.stateRole === "repairing"
              ? "M 124 35 L 140 19 M 130 19 L 140 19 L 140 29"
              : "M 124 29 L 131 36 L 144 21"}
          />
        </g>
      </svg>
      <figcaption>{stateVisual.accessibleLabel}</figcaption>
    </figure>
  );
}
