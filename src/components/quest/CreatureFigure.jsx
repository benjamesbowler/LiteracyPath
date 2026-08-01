// THE CREATURE — the renderer.
//
// Deliberately dumb: all the placement thinking lives in the pure module
// src/utils/creatureLayout.js, which this and the static contact-sheet tool
// BOTH consume. That is not tidiness for its own sake — if the preview
// approves and the app he ships disagreed about where a hat sits, the preview
// would be worthless.
//
// This is the single riskiest thing in Sound Seekers, and it is deliberately the
// FIRST thing built: if a layered-vector creature doesn't look good enough for a
// child to love, we want to know that before building forty stops on top of it.

import { useId, useMemo } from "react";
import { CREATURE_VIEWBOX } from "../../data/creatureParts.js";
import { layoutCreature, fillFor } from "../../utils/creatureLayout.js";

function Shape({ path }) {
  const isStroke = path.fill === "none" && path.stroke;
  return (
    <path
      d={path.d}
      fill={isStroke ? "none" : fillFor(path.fill)}
      stroke={path.stroke ? fillFor(path.stroke) : undefined}
      strokeWidth={path.width || undefined}
      strokeLinecap={isStroke ? "round" : undefined}
      strokeLinejoin={isStroke ? "round" : undefined}
      opacity={path.opacity ?? undefined}
    />
  );
}

export default function CreatureFigure({
  creature,
  size = 200,
  mood = "idle",          // idle | walk | cheer | think | sad | hatch
  className = "",
  title = "Your creature"
}) {
  const layout = useMemo(() => layoutCreature(creature), [creature]);

  // useId, NOT Math.random: the clip-path id must be stable across re-renders
  // and unique across every creature on the page (the preview wall shows 24 at
  // once, and duplicate ids would make them all clip to the first body).
  const clipId = `cr-clip-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className={`cr-figure cr-mood-${mood} ${className}`.trim()}
      viewBox={`0 0 ${CREATURE_VIEWBOX.w} ${CREATURE_VIEWBOX.h}`}
      style={{ ...layout.vars, width: size, height: size }}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={layout.silhouette} />
        </clipPath>
      </defs>

      <g className="cr-root">
        {layout.layers.map(layer => (
          <g
            key={layer.slotId}
            className={`cr-${layer.slotId}`}
            clipPath={layer.clipped ? `url(#${clipId})` : undefined}
          >
            {layer.placements.map((placement, pi) => (
              <g key={pi} transform={placement.transform || undefined}>
                {layer.paths.map((path, i) => <Shape key={i} path={path} />)}
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
