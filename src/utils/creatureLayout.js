// CREATURE LAYOUT — pure placement. No React, no DOM.
//
// Turns a creature object into an ordered list of drawing instructions. Both
// consumers share it, so they can never drift apart:
//
//   src/components/quest/CreatureFigure.jsx   (the live renderer)
//
// If the contact sheet and the app ever disagreed about where a hat sits, the
// preview would be worthless — you'd be approving art you weren't going to get.
// One layout function means that cannot happen.

import {
  CREATURE_SLOTS,
  CREATURE_INK,
  CREATURE_PAPER,
  getBody,
  getDye,
  getPiece,
  normalizeCreature
} from "../data/creatureParts.js";
import { artFor } from "../data/creatureArt.js";

export const FILL_TOKENS = {
  skin: "--cr-skin",
  skinDark: "--cr-skin-dark",
  belly: "--cr-belly",
  accent: "--cr-accent",
  dark: "--cr-dark",
  white: "--cr-white"
};

// The CSS custom properties one dye sets. This is the whole recolour system.
export function dyeVars(dyeId) {
  const dye = getDye(dyeId);
  return {
    "--cr-skin": dye.skin,
    "--cr-skin-dark": dye.skinDark,
    "--cr-belly": dye.belly,
    "--cr-accent": dye.accent,
    "--cr-dark": CREATURE_INK,
    "--cr-white": CREATURE_PAPER
  };
}

export function fillFor(token) {
  if (token === "none") return "none";
  const varName = FILL_TOKENS[token];
  return varName ? `var(${varName})` : `var(${FILL_TOKENS.dark})`;
}

function placements(slot, piece, body) {
  // A piece may override its slot's mode — a cyclops eye is ONE eye on the
  // centre anchor, not a mirrored pair.
  const mode = piece?.mode || slot.mode;

  if (mode === "absolute") return [{ transform: null }];

  if (mode === "single") {
    // Single-mode eyes use the CENTRE anchor, not the left one.
    const anchorId = slot.id === "eyes" ? "eyeC" : slot.anchor;
    const [x, y] = body.anchors[anchorId] || [100, 100];
    return [{ transform: `translate(${x} ${y})` }];
  }

  // pair: left as drawn, right mirrored, so a paw points the right way on both
  // sides without a second set of shapes.
  const leftId = slot.id === "eyes" ? "eyeL" : "footL";
  const rightId = slot.id === "eyes" ? "eyeR" : "footR";
  const [lx, ly] = body.anchors[leftId] || [80, 100];
  const [rx, ry] = body.anchors[rightId] || [120, 100];
  return [
    { transform: `translate(${lx} ${ly})` },
    { transform: `translate(${rx} ${ry}) scale(-1 1)`, mirrored: true }
  ];
}

// Ordered back-to-front. The slot table owns the z-order; nothing downstream may
// reorder it, or a hat ends up behind a head.
export function layoutCreature(creature) {
  const safe = normalizeCreature(creature);
  const body = getBody(safe.body);
  const bodyArt = artFor(body.id);

  const layers = [];
  const slots = [...CREATURE_SLOTS].sort((a, b) => a.z - b.z);

  for (const slot of slots) {
    const pieceId = slot.id === "body"
      ? body.id
      : (slot.kind === "gear" ? safe.equipped?.[slot.id] : safe[slot.id]);
    if (!pieceId) continue;

    const art = artFor(pieceId);
    if (!art || !(art.paths || []).length) continue;

    const piece = slot.id === "body" ? { ...body, slot: "body" } : getPiece(pieceId);

    layers.push({
      slotId: slot.id,
      pieceId,
      z: slot.z,
      clipped: slot.id === "pattern",   // patterns are clipped to the body silhouette
      placements: placements(slot, piece, body),
      paths: art.paths
    });
  }

  return {
    creature: safe,
    body,
    silhouette: bodyArt?.silhouette || "",
    vars: dyeVars(safe.dye),
    layers
  };
}
