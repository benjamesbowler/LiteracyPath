// A PAINTED PIECE inside an encounter panel — with the letter drawn LIVE on top.
//
// The world went painted and the panels stayed vector, so a child walked through
// a painted meadow and was then asked to tap three SVG circles. Half-finished, and
// the panels are what they look at most.
//
// THE RULE THAT MATTERS: the glyph is NEVER baked into the image. Every one of
// these paintings is generated with a big blank face — a plain flower centre, a
// clear plank, an unmarked pebble — and the game prints the letter on it in the
// app font. That is why every prompt says "no text, no letters, no words" three
// times over. A model given half a chance will paint you a garbled word (it is
// how star-gallery.webp ended up reading "Fanter"), and a phonics game that shows
// a child the WRONG LETTER is worse than a phonics game with no pictures at all.
//
// If the painting isn't there, the vector fallback renders and the game still
// works. Nothing is ever blocked on art.

import { useState } from "react";

const ART = {
  flower: "/images/quest/ui/flower-bloom.webp",
  fruit: "/images/quest/ui/fruit.webp",
  plank: "/images/quest/ui/plank.webp",
  "plank-empty": "/images/quest/ui/plank-empty.webp",
  stone: "/images/quest/ui/echo-stone.webp",
  card: "/images/quest/ui/word-card.webp",
  sheep: "/images/quest/ui/sheep.webp",
  post: "/images/quest/ui/pen-post.webp",
  board: "/images/quest/ui/sign-board.webp",
  page: "/images/quest/ui/page.webp"
};

export default function Piece({ kind, label, className = "", fallback = null }) {
  const [broken, setBroken] = useState(false);
  const src = ART[kind];

  if (!src || broken) return fallback;

  return (
    <span className={`qw-piece qw-piece-${kind} ${className}`.trim()}>
      <img src={src} alt="" aria-hidden="true" draggable="false" onError={() => setBroken(true)} />
      {/* Drawn live, in the app font, on the blank face the painting left for it. */}
      {label != null && <span className="qw-piece-label">{label}</span>}
    </span>
  );
}
