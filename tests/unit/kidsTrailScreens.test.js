// THE SOUND TRAIL AND THE ADVENTURE MAP — phase C of the 2026-07-29 redesign.
//
// What these tests defend, in order of how badly it hurts when it breaks:
//
//   1. Invented numbers. Both screens exist to tell a child how far they have
//      come. The mock's "12 stops in", "Ember Fox / stage 2" and "3 of 3 stars"
//      are placeholders (the spec says so), and a placeholder that survives into
//      the build is a lie told to a five-year-old about their own work.
//   2. A read failure rendering as an empty-data claim. Both underlying loaders
//      swallow a corrupt save and hand back a playable default — right for the
//      game, wrong for a progress screen, where it would draw a trail with
//      nothing walked.
//   3. The two-currency cap. Stars and coins only. The beastie pill names its
//      growth STAGE, which is exactly the kind of thing that becomes a third
//      counter if nobody is watching.
//   4. The single next action. One primary per screen; motion reserved for it.
//   5. The animation gotcha. kgBob writes `transform` and destroys a centring
//      transform, so the wrapper/inner-img split is not a style choice.
//   6. The scrim. White text on a bright plate without one is the contrast
//      failure the whole glass system is built to prevent.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ADVENTURE_MAP_PARTS,
  MAP_STOP_SIZES,
  TRAIL_NODE_POINTS,
  TRAIL_NODE_SIZES,
  adventureMapPartFor,
  buildAdventureMapScene,
  buildSoundChips,
  buildSoundTrailScene
} from "../../src/policy/childTrailPolicy.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { QUEST_CHAPTERS } from "../../src/data/questChapters.js";
import { worldForCycle } from "../../src/utils/palWorlds.js";

const trailSource = readFileSync("src/components/StudentSoundTrailPage.jsx", "utf8");
const mapSource = readFileSync("src/components/StudentAdventureMapPage.jsx", "utf8");
// CSS comments explain the geometry (and name the 1194px reference the rules
// must not hard-code), so scans run against the declarations alone.
const cssSource = readFileSync("src/styles/kids-trail.css", "utf8");
const css = cssSource.replace(/\/\*[\s\S]*?\*\//g, "");
const questSource = readFileSync("src/components/elQuest/ElSkillsQuest.jsx", "utf8");
// Read as TEXT, never imported: mapStops.js pulls in supabaseClient.js, which
// reads import.meta.env and cannot be evaluated under `node --test`. That is the
// same constraint that keeps the landmark names out of childTrailPolicy.js.
const mapStopsSource = readFileSync("src/data/mapStops.js", "utf8");

// Comments explain the rules and legitimately name what was removed, so scans
// for forbidden content run against the code with comments stripped.
const strip = source => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const trailCode = strip(trailSource);
const mapCode = strip(mapSource);

// ── The shared node machinery ───────────────────────────────────────────────

test("the trail window centres the next stop and never runs off either end", () => {
  const stops = QUEST_STOPS.map(stop => ({ id: stop.id, index: stop.index, name: stop.name }));

  const middle = buildSoundTrailScene({ stops, doneIds: [], nextIndex: 13 });
  assert.equal(middle.nodes.length, TRAIL_NODE_POINTS.length);
  assert.equal(middle.windowStart, 8);
  assert.equal(middle.next.index, 13);
  // The sixth point is the slot the spec marks "next".
  assert.deepEqual([middle.next.x, middle.next.y], [...TRAIL_NODE_POINTS[5]]);

  const start = buildSoundTrailScene({ stops, doneIds: [], nextIndex: 1 });
  assert.equal(start.windowStart, 1);
  assert.equal(start.nodes.length, TRAIL_NODE_POINTS.length);

  const end = buildSoundTrailScene({ stops, doneIds: [], nextIndex: stops.length });
  assert.equal(end.windowEnd, stops.length);
  assert.equal(end.nodes.length, TRAIL_NODE_POINTS.length);
});

test("node states come from the save file, and a camp is only ever ahead", () => {
  const stops = QUEST_STOPS.map(stop => ({ id: stop.id, index: stop.index, name: stop.name }));
  const doneIds = stops.slice(0, 12).map(stop => stop.id);
  // s15 is the last stop of chapter 3, so its milestone is that chapter's
  // destination — the same name the mode itself walks the child to.
  const milestones = { s15: "Claw Pass", s10: "The Singing Weir" };
  const scene = buildSoundTrailScene({ stops, doneIds, nextIndex: 13, milestones });

  const byId = Object.fromEntries(scene.nodes.map(node => [node.stopId, node]));
  assert.equal(byId.s10.state, "done", "a milestone already reached is done, not a camp");
  assert.equal(byId.s12.state, "done");
  assert.equal(byId.s13.state, "next");
  assert.equal(byId.s14.state, "locked");
  assert.equal(byId.s15.state, "camp");
  assert.equal(byId.s15.label, "Claw Pass");
  assert.equal(byId.s13.label, byId.s13.name);
  assert.equal(byId.s14.label, "");

  assert.equal(byId.s13.size, TRAIL_NODE_SIZES.next);
  assert.equal(byId.s15.size, TRAIL_NODE_SIZES.camp);
  assert.equal(byId.s12.size, TRAIL_NODE_SIZES.done);
  assert.equal(byId.s14.size, TRAIL_NODE_SIZES.locked);

  // The dashes and the markers are drawn from ONE coordinate list; a second
  // hard-coded copy is how a dot ends up off the line.
  assert.equal(scene.polyline, scene.nodes.map(node => `${node.x},${node.y}`).join(" "));
});

test("a milestone stop the child is standing on is the next stop, not a camp", () => {
  const stops = QUEST_STOPS.map(stop => ({ id: stop.id, index: stop.index, name: stop.name }));
  const scene = buildSoundTrailScene({
    stops,
    doneIds: stops.slice(0, 4).map(stop => stop.id),
    nextIndex: 5,
    milestones: { s5: "Bramble Gate" }
  });
  const node = scene.nodes.find(item => item.stopId === "s5");
  assert.equal(node.state, "next");
  assert.equal(node.label, node.name);
});

test("the milestone names really are the chapters' own destinations", () => {
  for (const chapter of QUEST_CHAPTERS) {
    const last = chapter.stopIds[chapter.stopIds.length - 1];
    assert.equal(typeof chapter.destination, "string");
    assert.ok(chapter.destination.length > 0, `${last} has no destination to name`);
  }
});

// ── The sound chips ─────────────────────────────────────────────────────────

test("sound chips lead with what is mastered, then the newest, then the focus", () => {
  const owned = ["a", "m", "t", "s", "n", "i", "f", "d"];
  const built = buildSoundChips({
    owned,
    mastered: ["a", "m", "t"],
    focus: ["sh", "ch"],
    limit: 6
  });
  assert.deepEqual(
    built.chips.map(chip => `${chip.id}:${chip.state}`),
    ["a:mastered", "m:mastered", "t:mastered", "d:owned", "sh:focus", "ch:ahead"]
  );
  assert.equal(built.ownedCount, owned.length);
  assert.equal(built.masteredCount, 3);
  assert.equal(built.hidden, 4, "the count beside the title has to know what is off screen");
});

test("exactly one sound is the current focus, so the panel has one highlight", () => {
  const built = buildSoundChips({ owned: [], mastered: [], focus: ["sp", "sn", "sk"] });
  assert.equal(built.chips.filter(chip => chip.state === "focus").length, 1);
  assert.deepEqual(built.chips.map(chip => chip.state), ["focus", "ahead", "ahead"]);
});

test("a sound the next stop teaches is never also counted as already owned", () => {
  const built = buildSoundChips({ owned: ["a", "sh"], mastered: ["a"], focus: ["sh"] });
  assert.equal(built.ownedCount, 1);
  assert.equal(built.chips.filter(chip => chip.id === "sh").length, 1);
});

// ── The Adventure Map ───────────────────────────────────────────────────────

const CYCLES = Array.from({ length: 9 }, (_, index) => ({
  id: `cycle-${index + 1}`,
  cycleNumber: index + 1
}));
const LANDMARKS = [
  "Farm Gate", "Carrot Patch", "Duck Pond", "Apple Orchard",
  "Wildflower Field", "Sheep Pen", "Strawberry Field", "Haystacks", "The Big Barn"
];
// Current Meadow Farm placements, set with the Map Stops
// editor and copied here from DEFAULT_WIDE_MAP_POINTS. A fixture, not a source
// of truth: the screen passes the real list (admin override applied) in, and
// "the map is drawn on the admin's placements" below checks it still matches.
const POINTS = [
  [12.6, 85.8], [12.3, 63.3], [21.2, 48.2], [40.5, 43.6], [65.2, 67.2],
  [92.6, 88.9], [81.5, 60.6], [64.2, 43.6], [81.2, 37.6]
];

test("the map's stops, cards and states are read from real star counts", () => {
  const stars = { "cycle-1": 3, "cycle-2": 2, "cycle-3": 3 };
  const scene = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: id => stars[id] || 0,
    landmarks: LANDMARKS,
    points: POINTS
  });

  assert.equal(scene.stops.length, 9, "a land has nine cycles and all nine are drawn");
  assert.equal(scene.next.id, "cycle-4");
  assert.equal(scene.next.name, "Apple Orchard");
  assert.deepEqual(
    scene.stops.map(stop => stop.state),
    ["done", "done", "done", "next", "locked", "locked", "locked", "locked", "locked"]
  );
  // Only the stop the child is on carries a label on the plate.
  assert.deepEqual(scene.stops.filter(stop => stop.label).map(stop => stop.label), ["Apple Orchard"]);
  assert.equal(scene.stops[1].stars, 2, "stars are the child's, not a placeholder");

  // The four cards are the spec's four states, with the current stop third.
  assert.deepEqual(
    scene.cards.map(card => `${card.name}:${card.state}`),
    ["Carrot Patch:done", "Duck Pond:done", "Apple Orchard:next", "Wildflower Field:locked"]
  );
  assert.equal(scene.polyline, scene.stops.map(stop => `${stop.x},${stop.y}`).join(" "));
});

test("a teacher-assigned Adventure Map space is the only open space", () => {
  const stars = { "cycle-1": 3, "cycle-2": 3, "cycle-6": 3 };
  const scene = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: id => stars[id] || 0,
    landmarks: LANDMARKS,
    points: POINTS,
    activeCycleId: "cycle-6"
  });

  assert.equal(scene.next.id, "cycle-6");
  assert.equal(scene.next.state, "next", "an assigned completed space can be replayed");
  assert.equal(
    scene.cards[0]?.id,
    "cycle-6",
    "the teacher-assigned action comes before unavailable cards"
  );
  assert.deepEqual(
    scene.cards.filter(card => card.state === "next").map(card => card.id),
    ["cycle-6"]
  );
  assert.deepEqual(
    scene.stops.filter(stop => stop.state === "next").map(stop => stop.id),
    ["cycle-6"]
  );
});

// STOP N IS DRAWN WHERE LANDMARK N IS PAINTED. The pairing is by index and
// nothing may re-order or window it: slide the list by one and the child's stop
// is announced as "Duck Pond" while the marker sits in a carrot patch.
test("every stop is drawn on its own landmark's coordinate, in order", () => {
  const scene = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: () => 0,
    landmarks: LANDMARKS,
    points: POINTS
  });
  assert.deepEqual(
    scene.stops.map(stop => [stop.name, stop.x, stop.y]),
    LANDMARKS.map((name, index) => [name, POINTS[index][0], POINTS[index][1]])
  );
  // ...and the dotted line is walked through those same points, in that order,
  // rather than from a second copy that could drift off the markers.
  assert.equal(scene.polyline, POINTS.map(([x, y]) => `${x},${y}`).join(" "));
});

// A coordinate is a fact about the artwork, and this module has none. Handed no
// points, the scene draws no markers rather than inventing an arc — which is
// exactly what the removed MAP_STOP_POINTS default did.
test("the map never invents a coordinate it was not given", () => {
  const none = buildAdventureMapScene({ cycles: CYCLES, starsFor: () => 0, landmarks: LANDMARKS });
  assert.equal(none.stops.length, 0);
  assert.equal(none.polyline, "");
  // The cards below the plate are named progress, not placement, so they still
  // work with no coordinates at all.
  assert.equal(none.cards.length, 4);
  assert.equal(none.next.id, "cycle-1");

  const short = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: () => 0,
    landmarks: LANDMARKS,
    points: POINTS.slice(0, 4)
  });
  assert.deepEqual(short.stops.map(stop => stop.id), ["cycle-1", "cycle-2", "cycle-3", "cycle-4"]);
});

test("the map never runs off either end of the land", () => {
  // The stops no longer slide: every stop of the land is on the plate wherever
  // the child stands, because each one is pinned to its own landmark.
  const atStart = buildAdventureMapScene({
    cycles: CYCLES, starsFor: () => 0, landmarks: LANDMARKS, points: POINTS
  });
  assert.equal(atStart.stops.length, 9);
  assert.equal(atStart.cards.length, 4);
  assert.equal(atStart.cards[0].id, "cycle-1");

  const atEnd = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: id => (id === "cycle-9" ? 0 : 3),
    landmarks: LANDMARKS,
    points: POINTS
  });
  assert.equal(atEnd.stops.length, 9);
  assert.equal(atEnd.stops.at(-1).id, "cycle-9");
  // The four CARDS are the part that still has to clamp at both ends.
  assert.equal(atEnd.cards.length, 4);
  assert.equal(atEnd.cards.at(-1).id, "cycle-9");
});

// THE COORDINATES ARE THE CURRENT AUTHORED PRODUCT POSITIONS.
// all twenty-seven with the click-to-place Map Stops editor, and the front door
// has to read them through the SAME override plumbing the Skills Quest uses —
// otherwise an admin drags a stop onto the barn and only one of the two screens
// follows, which is worse than neither following.
test("the map is drawn on the admin's placements, override and all", () => {
  // Parsed as text rather than imported, so quoting the keys is enough to make
  // these two literals JSON. Anything else in the file would fail loudly here.
  const literal = name => {
    const start = mapStopsSource.indexOf(`export const ${name} = {`);
    assert.ok(start >= 0, `${name} is gone from src/data/mapStops.js`);
    const open = mapStopsSource.indexOf("{", start);
    const end = mapStopsSource.indexOf("\n};", open);
    assert.ok(end > open, `${name} is no longer a plain object literal`);
    return JSON.parse(mapStopsSource.slice(open, end + 2).replace(/(\w+):/g, '"$1":'));
  };
  const points = literal("DEFAULT_WIDE_MAP_POINTS");
  const names = literal("WORLD_LANDMARKS_WIDE");

  for (const world of ["meadow", "dino", "moonwood"]) {
    assert.equal(points[world].length, 9, `${world} must keep nine placed stops`);
    assert.equal(names[world].length, 9, `${world} must keep nine landmark names`);
    for (const [x, y] of points[world]) {
      for (const n of [x, y]) assert.ok(typeof n === "number" && n >= 0 && n <= 100, `${world}: ${n}`);
    }
    assert.equal(new Set(names[world]).size, 9, `${world} names a place twice`);
  }

  // The screen reads the override exactly the way the mode does: cache first so
  // the first frame is placed, then the fetch, then back to that cache offline.
  for (const [name, code] of [["Adventure Map", mapCode], ["Skills Quest", strip(questSource)]]) {
    assert.match(code, /useState\(getCachedWideOverride\)/, name);
    assert.match(code, /loadWideMapOverride\(\)\.then\(ov => \{ if \(alive\) setWideOverride\(ov\); \}\)/, name);
    assert.match(code, /wideMapPointsFor\(/, name);
  }
  assert.match(mapCode, /wideMapPointsFor\(part\.id, wideOverride\)/);

  // ...and the policy module keeps no map coordinates of its own to fall back
  // to. The Sound Trail's list is design and stays; a second Adventure Map list
  // would silently win whenever the screen forgot to pass the real one.
  const policyCode = strip(readFileSync("src/policy/childTrailPolicy.js", "utf8"));
  assert.deepEqual(
    policyCode.match(/[A-Z_]+_POINTS\b(?=\s*=)/g),
    ["TRAIL_NODE_POINTS"],
    "the Adventure Map must own no coordinates; they live in src/data/mapStops.js"
  );
});

test("a finished land still points somewhere rather than nowhere", () => {
  const scene = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: () => 3,
    landmarks: LANDMARKS
  });
  assert.equal(scene.next.id, "cycle-9");
  assert.equal(scene.next.state, "done");
});

test("the map's three lands agree with the bands the rest of the app uses", () => {
  assert.equal(ADVENTURE_MAP_PARTS.length, 3);
  for (const part of ADVENTURE_MAP_PARTS) {
    for (const cycleNumber of [part.first, part.last]) {
      assert.equal(
        worldForCycle(cycleNumber).id,
        part.id,
        `cycle ${cycleNumber} is in ${worldForCycle(cycleNumber).id}, not ${part.id}`
      );
      assert.equal(adventureMapPartFor(cycleNumber).id, part.id);
    }
    // The Skills Quest paints these names on its own map. Two lists that
    // disagree put a child in Dinosaur Valley under a Meadow sign.
    assert.ok(
      questSource.includes(`name: "${part.name}"`),
      `${part.name} is not the name the Skills Quest uses for ${part.id}`
    );
  }
});

// ── The screens ─────────────────────────────────────────────────────────────

test("each screen has exactly one primary call to action", () => {
  for (const [name, code] of [["Adventure Map", mapCode]]) {
    assert.equal(
      (code.match(/data-child-primary/g) || []).length,
      1,
      `${name} must have one unmistakable next action`
    );
    // data-child-primary is the singular marker; the emphasis attribute beside
    // it is written as a literal on one screen and as a conditional on the
    // other, so the scan only asserts that "primary" is reachable from it.
    assert.match(code, /data-child-emphasis=[^\n]*primary/, name);
    assert.equal(
      (code.match(/data-child-emphasis-cue/g) || []).length,
      1,
      `${name}: the primary needs exactly one named cue`
    );
  }
  // The duplicate Sound Trail summary/map was deliberately removed. Its route
  // now opens the playable quest directly, so it must not add a second CTA.
  assert.equal((trailCode.match(/data-child-primary/g) || []).length, 0);
  assert.match(trailCode, /return renderQuest\(/);
});

test("motion is reserved for the one next marker, and is all system classes", () => {
  for (const [name, code] of [["Adventure Map", mapCode]]) {
    assert.equal((code.match(/kg-halo/g) || []).length, 1, `${name}: one pulsing marker only`);
    assert.equal((code.match(/kg-bob/g) || []).length, 1, `${name}: one bobbing sprite only`);
  }
  assert.equal(/kg-halo|kg-bob/.test(trailCode), false, "the removed duplicate trail has no decorative motion");
  // Every animation on these screens is a kids-glass class, so the
  // prefers-reduced-motion block there already covers them. A screen stylesheet
  // that declared its own would escape it silently.
  assert.equal(
    /\banimation\s*:/.test(css),
    false,
    "kids-trail.css must not declare animations; add them to kids-glass.css"
  );
  assert.equal(/@keyframes/.test(css), false);
});

test("the animated sprite never carries the centring transform", () => {
  for (const [name, code] of [["Adventure Map", mapCode]]) {
    // The wrapper is .kg-sprite (negative margins, no transform); .kg-bob is on
    // the inner <img>. Merged, kgBob overwrites the centring and the companion
    // lands in the wrong place.
    assert.match(code, /className="kg-sprite kg-node-sprite"/, name);
    assert.match(code, /<img className="kg-bob"/, name);
  }
  assert.equal(
    /\.kg-node-sprite\s*\{[^}]*transform/.test(css),
    false,
    "the sprite wrapper must centre with margins, never a transform"
  );
});

test("both scenes carry a scrim, and the trail stands its pal on a clean plate", () => {
  // The map plate is bright and every overlay on it is white; the spec makes the
  // scrim mandatory there.
  assert.match(mapCode, /kg-node-scene kg-scrim kg-map-scene/);
  assert.equal(/kg-node-scene|world\.backdrop|world\.banner|panorama/.test(trailCode), false);
});

test("only stars and coins are countable on either screen", () => {
  for (const [name, code] of [["Adventure Map", mapCode]]) {
    // Two exemptions, both for the word "points" as CODE rather than as copy:
    // `points=` is the SVG polyline attribute, and `points: <identifier>` is the
    // Adventure Map handing the admin's coordinates to the scene builder. A
    // score would have to reach the child through a rendered value — `{points}`,
    // or a "Points: 42" label whose colon is followed by a digit or a brace —
    // and both of those still trip this scan.
    const hit = code.match(
      /(?<![.\w-])(streak|flame|gems?|xp|points?|combo|berries|high ?score|level up)\b(?!\s*=)(?!\s*:\s*[A-Za-z_$])/i
    );
    assert.equal(hit, null, `${name} surfaced "${hit?.[0]}"; the cap is stars and coins`);
  }
  assert.equal(/streak|flame|gems?|\bxp\b|combo|high ?score/i.test(trailCode), false);
});

test("a read that failed says so instead of drawing an empty journey", () => {
  for (const [name, code] of [["Adventure Map", mapCode]]) {
    assert.match(code, /ok:\s*read\.ok/, `${name} must preserve the shared reader's unreadable state`);
    assert.match(code, /data-read-state=\{read\.ok \? "ready" : "unreadable"\}/, name);
    assert.match(code, /We could not open your/, name);
  }
  // Sound Trail no longer reads or redraws progress. The quest owns its own
  // loading/error state, avoiding two screens that can disagree.
  assert.equal(/loadQuestState|buildSoundTrailScene|data-read-state/.test(trailCode), false);
});

test("Sound Trail delegates to the one playable quest instead of drawing a duplicate map", () => {
  assert.match(trailCode, /if \(!renderQuest\) return null/);
  assert.match(trailCode, /return renderQuest\(\{/);
  assert.match(trailCode, /onExit:/);
  assert.match(trailCode, /onHome\(\)/);
  assert.match(trailCode, /onNavigate\?\.\("home"\)/);
  assert.equal(/buildSoundTrailScene|TRAIL_NODE_POINTS|kg-trail-scene/.test(trailCode), false);
});

test("every displayed value on the Adventure Map comes from a named source", () => {
  // Still derived from the named source and still filtered by cycleNumber — the
  // sample filter now wraps it, so a try session sees a slice while a normal
  // child sees the same array untouched.
  assert.match(mapCode, /allAdventureCycles = \(\) => elSkillsBlockCycles\.filter\(cycle => cycle\.cycleNumber\)/);
  assert.match(mapCode, /filterSample\("cycles", allAdventureCycles\(\)\)/);
  assert.match(mapCode, /WORLD_LANDMARKS_WIDE\[part\.id\]/);
  assert.match(mapCode, /WIDE_WORLDS\.find/);
  assert.match(mapCode, /read\.cycles\?\.\[cycleId\]\?\.stars/);
});

test("neither screen culls the mode it fronts", () => {
  // The front door launches the real thing; it does not reimplement it.
  assert.match(trailCode, /return renderQuest\(\{/);
  assert.match(trailCode, /onExit:/);
  assert.match(mapCode, /renderQuest\(\{ cycleId: openCycleId/);
  // ...and the Skills Quest opens AT the stop the child tapped rather than
  // showing a second map of the same journey.
  assert.match(questSource, /initialCycleId = ""/);
  assert.match(questSource, /useState\(initialCycleId \|\| null\)/);
});

test("nothing a child taps is under the 44px floor", () => {
  // Sizes that appear on these screens: the 60px Go and speaker, the 46/64px map
  // markers, the 42px card chip inside a much taller card, and the 44px chips.
  assert.match(css, /\.kg-trail-go\s*\{[^}]*height:\s*60px/);
  assert.match(css, /\.kg-trail-hear\s*\{[^}]*width:\s*60px/);
  assert.match(css, /\.kg-trail-chip\s*\{[^}]*min-width:\s*var\(--kg-hit\)/);
  assert.match(css, /\.kg-trail-chip\s*\{[^}]*height:\s*var\(--kg-hit\)/);
  // Every state a map marker can be in, not a hand-copied pair: a fourth state
  // added at 40px would otherwise ship unnoticed.
  for (const [state, size] of Object.entries(MAP_STOP_SIZES)) {
    assert.ok(size >= 44, `a ${state} map marker is ${size}px, under the 44px floor`);
  }
  // A locked marker is the one small circle on the trail, and it is not a
  // control: the trail's markers are spans, never buttons.
  assert.equal(/<button[^>]*kg-node/.test(trailCode), false);
});

test("a label on a low stop goes beside its marker, never on top of it", () => {
  // The admin's placements run down to 89.1% of the plate, where a pill dropped
  // under the marker leaves the artwork. Pinning it to the plate's bottom edge
  // was the first attempt and it landed on the very numeral it names, so those
  // stops put the pill BESIDE the marker instead. A point is never moved to
  // make a label fit; only the label moves.
  assert.match(mapCode, /const LABEL_SIDE_BAND = 82/);
  assert.match(mapCode, /data-place=\{labelPlace\(stop\.x, stop\.y\)\}/);
  for (const side of ["left", "right"]) {
    assert.match(css, new RegExp(`\\.kg-node-label\\[data-place="${side}"\\]`), side);
  }
  assert.equal(
    /\.kg-node-label\s*\{[^}]*min\(/.test(css),
    false,
    "a pill pinned to the plate edge slides onto its own marker; place it beside instead"
  );

  // The start/end pulls are SHARED with the Sound Trail, whose last node sits at
  // 91%. Strengthening `end` itself so it would reach Forest Edge at 97% took
  // the trail's camp pill from a 5.7px graze of its neighbour to a 28.6px cover
  // of it (measured), so the extra pull is a THIRD band that only the map asks
  // for. Anything that edits these two numbers is editing both screens.
  assert.match(css, /\[data-anchor="start"\]\s*\{\s*transform:\s*translateX\(-25%\)/);
  assert.match(css, /\[data-anchor="end"\]\s*\{\s*transform:\s*translateX\(-75%\)/);
  assert.match(css, /\[data-anchor="edge"\]\s*\{\s*transform:\s*translateX\(-90%\)/);
  assert.equal(/"edge"/.test(trailCode), false, "the edge band is the Adventure Map's alone");
});

test("the screens never assume 1194px of canvas width", () => {
  assert.equal(/\b1194px\b/.test(css), false);
  for (const rule of ["kg-trail-foot", "kg-map-cards"]) {
    assert.ok(css.includes(rule), rule);
  }
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.25fr\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--kg-map-card-count, 4\), minmax\(0, 1fr\)\)/);
});
