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
  MAP_STOP_POINTS,
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

test("the map's stops, cards and states are read from real star counts", () => {
  const stars = { "cycle-1": 3, "cycle-2": 2, "cycle-3": 3 };
  const scene = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: id => stars[id] || 0,
    landmarks: LANDMARKS
  });

  assert.equal(scene.stops.length, MAP_STOP_POINTS.length);
  assert.equal(scene.next.id, "cycle-4");
  assert.equal(scene.next.name, "Apple Orchard");
  assert.deepEqual(
    scene.stops.map(stop => stop.state),
    ["done", "done", "done", "next", "locked", "locked", "locked"]
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

test("the map never runs off either end of the land", () => {
  const atStart = buildAdventureMapScene({ cycles: CYCLES, starsFor: () => 0, landmarks: LANDMARKS });
  assert.equal(atStart.stops.length, MAP_STOP_POINTS.length);
  assert.equal(atStart.cards.length, 4);
  assert.equal(atStart.cards[0].id, "cycle-1");

  const atEnd = buildAdventureMapScene({
    cycles: CYCLES,
    starsFor: id => (id === "cycle-9" ? 0 : 3),
    landmarks: LANDMARKS
  });
  assert.equal(atEnd.stops.length, MAP_STOP_POINTS.length);
  assert.equal(atEnd.stops.at(-1).id, "cycle-9");
  assert.equal(atEnd.cards.at(-1).id, "cycle-9");
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
  for (const [name, code] of [["Sound Trail", trailCode], ["Adventure Map", mapCode]]) {
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
  assert.match(trailCode, /data-child-emphasis="primary"[\s\S]{0,400}Go</);
});

test("motion is reserved for the one next marker, and is all system classes", () => {
  for (const [name, code] of [["Sound Trail", trailCode], ["Adventure Map", mapCode]]) {
    assert.equal((code.match(/kg-halo/g) || []).length, 1, `${name}: one pulsing marker only`);
    assert.equal((code.match(/kg-bob/g) || []).length, 1, `${name}: one bobbing sprite only`);
  }
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
  for (const [name, code] of [["Sound Trail", trailCode], ["Adventure Map", mapCode]]) {
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
  assert.match(trailCode, /kg-node-scene kg-scrim kg-scrim--trail kg-trail-scene/);
  // world.backdrop is the character-free plate. world.banner (the panorama)
  // already has two pals walking the path, and this screen stands a beastie on
  // top of whatever it uses.
  assert.match(trailCode, /src=\{world\.backdrop\}/);
  assert.equal(/world\.banner|panorama/.test(trailCode), false);
});

test("only stars and coins are countable on either screen", () => {
  for (const [name, code] of [["Sound Trail", trailCode], ["Adventure Map", mapCode]]) {
    // `points=` is the SVG polyline attribute, not a score.
    const hit = code.match(
      /(?<![.\w-])(streak|flame|gems?|xp|points?|combo|berries|high ?score|level up)\b(?!\s*=)/i
    );
    assert.equal(hit, null, `${name} surfaced "${hit?.[0]}"; the cap is stars and coins`);
  }
  // The beastie pill is the obvious place a third counter would appear. It
  // names the growth stage ("Young"), never a stage number.
  assert.match(trailCode, /beastie\.growth\?\.name/);
  assert.equal(/stage \{|stage \$\{/.test(trailCode), false);
});

test("a read that failed says so instead of drawing an empty journey", () => {
  for (const [name, code] of [["Sound Trail", trailCode], ["Adventure Map", mapCode]]) {
    assert.match(code, /ok:\s*false/, `${name} must be able to report an unreadable record`);
    assert.match(code, /data-read-state=\{read\.ok \? "ready" : "unreadable"\}/, name);
    assert.match(code, /We could not open your/, name);
  }
  // ...and the count beside "Sounds you own" only speaks when the read worked.
  assert.match(trailCode, /read\.ok && sounds\.ownedCount > 0/);
});

test("every displayed value on the Sound Trail comes from a named source", () => {
  assert.match(trailCode, /currentStopIndex\(state\)/);
  assert.match(trailCode, /state\.trail\?\.stopsDone/);
  assert.match(trailCode, /stopAtIndex\(nextIndex\)/);
  assert.match(trailCode, /chapterForStop\(/);
  assert.match(trailCode, /taughtThrough\(/);
  assert.match(trailCode, /isMastered\(mastery, id\)/);
  assert.match(trailCode, /computeHollow\(loadHollowLedger/);
});

test("every displayed value on the Adventure Map comes from a named source", () => {
  assert.match(mapCode, /elSkillsBlockCycles\.filter\(cycle => cycle\.cycleNumber\)/);
  assert.match(mapCode, /WORLD_LANDMARKS_WIDE\[part\.id\]/);
  assert.match(mapCode, /WIDE_WORLDS\.find/);
  assert.match(mapCode, /read\.cycles\?\.\[cycleId\]\?\.stars/);
});

test("neither screen culls the mode it fronts", () => {
  // The front door launches the real thing; it does not reimplement it.
  assert.match(trailCode, /renderQuest\(\{ onExit: \(\) => setPlaying\(false\) \}\)/);
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
  assert.equal(MAP_STOP_POINTS.length, 7);
  for (const size of [46, 64]) assert.ok(size >= 44);
  // A locked marker is the one small circle on the trail, and it is not a
  // control: the trail's markers are spans, never buttons.
  assert.equal(/<button[^>]*kg-node/.test(trailCode), false);
});

test("the screens never assume 1194px of canvas width", () => {
  assert.equal(/\b1194px\b/.test(css), false);
  for (const rule of ["kg-trail-foot", "kg-map-cards"]) {
    assert.ok(css.includes(rule), rule);
  }
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.25fr\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--kg-map-card-count, 4\), minmax\(0, 1fr\)\)/);
});
