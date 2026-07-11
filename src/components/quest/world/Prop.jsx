// A THING IN THE PATH — painted, with a vector fallback.
//
// Every prop is a painted cutout with TWO states, and the change between them is
// the reward: the bridge gets its planks and you cross it; the buds bloom; the
// hungry beast sits back, full, and waves you past.
//
// If the painting hasn't been generated yet the <img> errors and we fall back to
// the vector shape, so the game always runs. That fallback is a safety net, not a
// plan — the vector version is what made the world look like a chart.

import { useState } from "react";
import VectorProp from "./Props.jsx";

const PAINTED = new Set([
  "flower-patch", "broken-bridge", "hungry-beast", "echo-cave",
  "sheep-pens", "word-beast", "signpost", "story-rock"
]);

export default function Prop({ kind, done }) {
  const [broken, setBroken] = useState(false);

  if (!PAINTED.has(kind) || broken) return <VectorProp kind={kind} done={done} />;

  const src = `/images/quest/props/${kind}${done ? "-done" : ""}.webp`;

  return (
    <img
      key={src}
      className={`qw-paintprop${done ? " is-done" : ""}`}
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      onError={() => setBroken(true)}
    />
  );
}
