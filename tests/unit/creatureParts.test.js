import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ANCHOR_IDS,
  CREATURE_SLOTS,
  CREATURE_BODIES,
  CREATURE_PARTS,
  CREATURE_GEAR,
  CREATURE_DYES,
  ALL_PIECES,
  PART_SLOTS,
  GEAR_SLOTS,
  piecesForSlot,
  getPiece,
  getBody,
  getDye,
  startingPieces,
  defaultCreature,
  isValidCreature,
  normalizeCreature
} from "../../src/data/creatureParts.js";
import { CREATURE_ART, artFor } from "../../src/data/creatureArt.js";
import { layoutCreature, fillFor, dyeVars } from "../../src/utils/creatureLayout.js";

test("EVERY body declares EVERY anchor", () => {
  // This is what stops a hat floating off a differently-shaped head. If a body
  // is missing an anchor, every part that hangs off it silently lands at (100,100).
  for (const body of CREATURE_BODIES) {
    for (const anchor of ANCHOR_IDS) {
      const point = body.anchors[anchor];
      assert.ok(Array.isArray(point) && point.length === 2, `body "${body.id}" has no ${anchor} anchor`);
      assert.ok(Number.isFinite(point[0]) && Number.isFinite(point[1]), `body "${body.id}" ${anchor} is not a point`);
    }
  }
});

test("every anchored slot names a real anchor", () => {
  for (const slot of CREATURE_SLOTS) {
    if (slot.mode === "absolute") continue;
    assert.ok(ANCHOR_IDS.includes(slot.anchor), `slot "${slot.id}" names unknown anchor "${slot.anchor}"`);
  }
});

test("EVERY piece has art", () => {
  // A piece in the manifest with no path data renders as nothing — an invisible
  // option in the creator that a child can select and then think is broken.
  for (const body of CREATURE_BODIES) {
    assert.ok(artFor(body.id), `body "${body.id}" has no art`);
    assert.ok(artFor(body.id).silhouette, `body "${body.id}" has no silhouette (patterns can't clip to it)`);
  }
  for (const piece of [...CREATURE_PARTS, ...CREATURE_GEAR]) {
    assert.ok(artFor(piece.id), `piece "${piece.id}" has no art`);
  }
});

test("every art entry belongs to a real piece", () => {
  const ids = new Set([...ALL_PIECES.map(p => p.id)]);
  for (const artId of Object.keys(CREATURE_ART)) {
    assert.ok(ids.has(artId), `art "${artId}" belongs to no piece in the manifest`);
  }
});

test("piece ids are unique across every slot", () => {
  const ids = ALL_PIECES.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate piece id");
});

test("every piece sits in a real slot", () => {
  const slotIds = new Set(CREATURE_SLOTS.map(s => s.id));
  for (const piece of [...CREATURE_PARTS, ...CREATURE_GEAR]) {
    assert.ok(slotIds.has(piece.slot), `piece "${piece.id}" names unknown slot "${piece.slot}"`);
  }
});

test("every required slot has at least one free option", () => {
  // A child who has just opened the app owns nothing. If a required slot's only
  // options cost sparks, the creator is unusable on day one.
  for (const slot of CREATURE_SLOTS) {
    if (!slot.required) continue;
    const options = slot.id === "body" ? CREATURE_BODIES : piecesForSlot(slot.id);
    const free = options.filter(p => (p.cost || 0) === 0);
    assert.ok(free.length > 0, `required slot "${slot.id}" has no free option`);
  }
  assert.ok(CREATURE_DYES.some(d => (d.cost || 0) === 0), "no free dye");
});

test("the starter wardrobe gives real choice without giving away the shop", () => {
  const starters = new Set(startingPieces());
  const purchasable = [
    ...ALL_PIECES,
    ...CREATURE_DYES.map(dye => ({ ...dye, slot: "colour" }))
  ].filter(piece => (piece.cost || 0) > 0);

  assert.equal(starters.size, 17, "the starter wardrobe has drifted back into most of the catalogue");
  assert.equal(purchasable.length, 48, "the Trading Post should hold most creature choices");
  assert.ok(purchasable.length > starters.size * 2, "paid choices no longer clearly outweigh starter choices");

  const starterCount = slot => {
    const options = slot === "body"
      ? CREATURE_BODIES
      : slot === "colour"
        ? CREATURE_DYES
        : piecesForSlot(slot);
    return options.filter(piece => starters.has(piece.id)).length;
  };
  for (const slot of ["body", "colour", "eyes", "mouth", "crest", "tail", "feet", "pattern"]) {
    assert.ok(starterCount(slot) >= 2, `${slot} needs at least two meaningful day-one choices`);
  }
});

test("fill tokens are tokens, never literal colours", () => {
  // Every shape must paint with a token so a dye can recolour it. A hardcoded
  // #hex in a shape is a shape that ignores the dye system entirely.
  const allowed = new Set(["skin", "skinDark", "belly", "accent", "dark", "white", "none"]);
  for (const [id, art] of Object.entries(CREATURE_ART)) {
    for (const path of art.paths || []) {
      assert.ok(allowed.has(path.fill), `"${id}" uses fill "${path.fill}" — not a token`);
      if (path.stroke) assert.ok(allowed.has(path.stroke), `"${id}" uses stroke "${path.stroke}" — not a token`);
      assert.ok(typeof path.d === "string" && path.d.length > 0, `"${id}" has a path with no d`);
    }
  }
});

test("the z-order is unambiguous — no two slots share a layer", () => {
  const zs = CREATURE_SLOTS.map(s => s.z);
  assert.equal(new Set(zs).size, zs.length, "two slots share a z, so their order is undefined");
  // and the things that must be in front, are
  const z = id => CREATURE_SLOTS.find(s => s.id === id).z;
  assert.ok(z("body") > z("tail"), "the tail goes behind the body");
  assert.ok(z("eyes") > z("body"), "eyes go on top of the body");
  assert.ok(z("head") > z("crest"), "a hat goes over the crest");
  assert.ok(z("pattern") > z("body"), "the pattern goes on the body");
});

test("PART_SLOTS and GEAR_SLOTS partition the slot table", () => {
  assert.deepEqual([...PART_SLOTS, ...GEAR_SLOTS].sort(), CREATURE_SLOTS.map(s => s.id).sort());
});

test("the default creature is valid", () => {
  assert.equal(isValidCreature(defaultCreature()), true);
});

test("an invalid creature is repaired, not crashed on", () => {
  // A child must never lose their creature because we renamed a part.
  const broken = normalizeCreature({ body: "gone", dye: "gone", eyes: "gone", equipped: { head: "gone" } });
  assert.equal(broken.body, "tuft");
  assert.equal(broken.dye, "moss");
  assert.equal(broken.eyes, "eyes-round");
  assert.equal(broken.equipped.head, null);
  assert.equal(isValidCreature(broken), true);
  assert.equal(isValidCreature(null), false);
});

test("a piece cannot be equipped into the wrong slot", () => {
  const wrong = normalizeCreature({ ...defaultCreature(), eyes: "mouth-grin", equipped: { head: "tail-fan" } });
  assert.equal(wrong.eyes, "eyes-round", "a mouth is not a pair of eyes");
  assert.equal(wrong.equipped.head, null, "a tail is not a hat");
});

test("getters never return undefined", () => {
  assert.equal(getBody("nonsense").id, "tuft");
  assert.equal(getDye("nonsense").id, "moss");
  assert.equal(getPiece("nonsense"), null);
});

// ── Layout: the code the app AND the contact sheet both run ─────────────────

test("layout paints back to front, and the body is never missing", () => {
  const layout = layoutCreature(defaultCreature());
  const order = layout.layers.map(l => l.slotId);
  assert.ok(order.includes("body"));
  const z = layout.layers.map(l => l.z);
  assert.deepEqual(z, [...z].sort((a, b) => a - b), "layers came out of z-order");
  assert.ok(order.indexOf("tail") < order.indexOf("body"), "the tail goes behind the body");
  assert.ok(order.indexOf("body") < order.indexOf("eyes"), "eyes go on top of the body");
});

test("a pair part is drawn twice, once mirrored", () => {
  const layout = layoutCreature(defaultCreature());
  const eyes = layout.layers.find(l => l.slotId === "eyes");
  assert.equal(eyes.placements.length, 2);
  assert.ok(eyes.placements[1].mirrored, "the right eye must be mirrored");
  assert.match(eyes.placements[1].transform, /scale\(-1 1\)/);
});

test("a single-mode eye lands on the CENTRE anchor, not the left one", () => {
  // A cyclops on the left eye anchor is a creature with one eye on the side of
  // its face. The piece overrides the slot's mode; this is that override working.
  const layout = layoutCreature({ ...defaultCreature(), body: "tuft", eyes: "eyes-one" });
  const eyes = layout.layers.find(l => l.slotId === "eyes");
  assert.equal(eyes.placements.length, 1);
  assert.equal(eyes.placements[0].transform, "translate(100 90)", "tuft's eyeC anchor");
});

test("gear lands on the right anchor of WHICHEVER body was chosen", () => {
  // The whole reason anchors exist. Same hat, six differently-shaped heads.
  for (const body of CREATURE_BODIES) {
    const layout = layoutCreature({ ...defaultCreature(), body: body.id, equipped: { head: "leaf-cap" } });
    const hat = layout.layers.find(l => l.slotId === "head");
    const [hx, hy] = body.anchors.headTop;
    assert.equal(hat.placements[0].transform, `translate(${hx} ${hy})`, `leaf-cap sits wrong on ${body.id}`);
  }
});

test("the pattern is clipped to the body silhouette, and nothing else is", () => {
  const layout = layoutCreature({ ...defaultCreature(), pattern: "pattern-spots" });
  assert.ok(layout.silhouette.length > 0);
  for (const layer of layout.layers) {
    assert.equal(layer.clipped, layer.slotId === "pattern", `${layer.slotId} clip flag is wrong`);
  }
});

test("an empty part (crest-none, tail-none) draws nothing rather than an empty group", () => {
  const layout = layoutCreature({ ...defaultCreature(), crest: "crest-none", tail: "tail-none" });
  assert.equal(layout.layers.some(l => l.slotId === "crest"), false);
  assert.equal(layout.layers.some(l => l.slotId === "tail"), false);
});

test("colour only ever reaches the SVG as a CSS variable", () => {
  assert.equal(fillFor("skin"), "var(--cr-skin)");
  assert.equal(fillFor("none"), "none");
  const vars = dyeVars("ember");
  assert.equal(vars["--cr-skin"], "#c9573a");
  const layout = layoutCreature({ ...defaultCreature(), dye: "ember" });
  for (const layer of layout.layers) {
    for (const p of layer.paths) {
      const fill = fillFor(p.fill);
      assert.ok(fill === "none" || fill.startsWith("var(--cr-"), `${layer.pieceId} paints with "${fill}"`);
    }
  }
});

test("the combinatorics are real — over a million creatures from ~55 shapes", () => {
  const count = CREATURE_BODIES.length
    * CREATURE_DYES.length
    * piecesForSlot("pattern").length
    * piecesForSlot("eyes").length
    * piecesForSlot("mouth").length
    * piecesForSlot("crest").length
    * piecesForSlot("tail").length
    * piecesForSlot("feet").length;
  assert.ok(count > 1_000_000, `only ${count} creatures — the creator would feel thin`);
  assert.ok(Object.keys(CREATURE_ART).length < 80, "the shape budget has quietly ballooned");
});
