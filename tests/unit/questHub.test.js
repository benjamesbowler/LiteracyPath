import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  buildTrailSection,
  clampTrailPosition,
  firstUnsolvedEncounter,
  forwardLimitFor,
  routeProgressAt,
  restoredWorldMoments,
  trailEventForStop,
  FIELD_ENCOUNTERS,
  WORLD_VARIANTS
} from "../../src/utils/questHub.js";
import { responsesInWalk } from "../../src/utils/questEncounters.js";

test("Sound Seekers keeps the three findable choices and removes the duplicate tile row", () => {
  const pixelWorld = readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const threeDimensionalWorld = readFileSync("src/components/quest/world/QuestHub.jsx", "utf8");
  assert.doesNotMatch(pixelWorld, /qp-build-strip|Word progress:/);
  assert.doesNotMatch(threeDimensionalWorld, /qh-phoneme-build|qh-phoneme-slots/);
  assert.match(pixelWorld, /className="q-visually-hidden qp-semantic-choices"/);
  assert.match(threeDimensionalWorld, /className="q-visually-hidden qh-semantic-choices"/);
  assert.doesNotMatch(pixelWorld, /qp-semantic-choices\$\{COARSE_POINTER/);
  assert.doesNotMatch(threeDimensionalWorld, /qh-semantic-choices\$\{COARSE_POINTER/);
});

test("every curriculum stop becomes one long ordered trail section", () => {
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    assert.ok(section, `${stop.id} did not build a trail section`);
    assert.equal(section.stopIndex, stop.index);
    assert.ok(section.guide.progress < section.encounters[0].progress, `${stop.id} put the teacher after the first task`);
    assert.ok(section.encounters.length >= 1 && section.encounters.length <= 3);
    assert.ok(section.drops.length >= 10, `${stop.id} left the long walk empty`);
    assert.ok(section.ambience.length >= 18, `${stop.id} has too little ambient life for a long trail`);
    assert.ok(section.landmark?.kind, `${stop.id} has no authored section landmark`);
    assert.ok(section.variant?.id, `${stop.id} has no scenery variant`);
    assert.ok(section.chapter?.id, `${stop.id} has no five-stop chapter`);
    assert.ok(section.topology, `${stop.id} has no route topology`);
    assert.ok(section.route.totalLength > 90, `${stop.id} route is too short`);
    assert.ok(section.lighting?.id, `${stop.id} has no lighting phase`);
    assert.equal(section.event.id, trailEventForStop(stop).id);
    assert.ok(section.gate.progress > section.encounters.at(-1).progress, `${stop.id} put its gate before the final helper`);
    assert.ok(section.exit.progress > section.gate.progress, `${stop.id} cannot be walked through its gate`);

    for (let index = 1; index < section.encounters.length; index += 1) {
      const gap = (section.encounters[index].progress - section.encounters[index - 1].progress) * section.route.totalLength;
      assert.ok(gap >= 24, `${stop.id} bunched two helpers only ${gap} units apart`);
      assert.equal(section.encounters[index].order, index);
    }

    for (const encounter of section.encounters) {
      assert.ok(encounter.repair?.kind, `${stop.id} ${encounter.id} has no repair moment`);
      if (FIELD_ENCOUNTERS[encounter.kind]) {
        assert.equal(encounter.field?.mode, FIELD_ENCOUNTERS[encounter.kind].mode, `${stop.id} ${encounter.kind} lost its physical task mode`);
      }
    }

    for (const item of [section.guide, ...section.encounters, ...section.drops, section.gate, section.exit]) {
      const clamped = clampTrailPosition(item, section, 1);
      assert.ok(Math.hypot(clamped.x - item.x, clamped.z - item.z) < 0.03, `${stop.id} placed ${item.id || "an object"} outside its route graph`);
    }
    assert.ok(responsesInWalk(section) <= 8, `${stop.id} turned the journey back into a quiz`);
  }
});

test("all worlds have enough scenery variants to make repeated stops feel different", () => {
  for (const [world, variants] of Object.entries(WORLD_VARIANTS)) {
    assert.ok(variants.length >= 4, `${world} needs at least four prototype variants`);
    assert.equal(new Set(variants.map(variant => variant.id)).size, variants.length, `${world} repeats a variant id`);
  }

  const firstEight = QUEST_STOPS.slice(0, 8).map(stop => buildTrailSection(stop.id, { seed: stop.index }).variant.id);
  assert.ok(new Set(firstEight).size >= 4, "the opening meadow repeats too quickly");
});

test("the authored descriptor tasks reach the physical trail encounters", () => {
  const greenCake = buildTrailSection("s35", { seed: 35 });
  const bigFish = buildTrailSection("s38", { seed: 38 });

  assert.ok(
    greenCake.encounters.some(encounter => encounter.kind === "signpost" && encounter.beats.some(beat => beat.text === "Tap the green cake.")),
    "trail 35 lost its in-world green cake task"
  );
  assert.ok(
    bigFish.encounters.some(encounter => encounter.kind === "signpost" && encounter.beats.some(beat => beat.text === "Tap the big fish.")),
    "trail 38 lost its in-world big fish task"
  );
});

test("boss stops carry authored act-event direction", () => {
  const festival = buildTrailSection("s8", { seed: 8 });
  const forge = buildTrailSection("s17", { seed: 17 });
  const finale = buildTrailSection("s40", { seed: 40 });
  const regular = buildTrailSection("s1", { seed: 1 });

  assert.equal(festival.event.id, "blendFestival");
  assert.equal(festival.event.mode, "act");
  assert.equal(forge.event.id, "wordForge");
  assert.equal(forge.event.mode, "act");
  assert.equal(finale.event.id, "first-reading-star-awakening");
  assert.equal(finale.event.mode, "chapter-finale");
  assert.equal(regular.event.mode, "section");
});

test("every chapter ends in a unique authored destination set piece", () => {
  const finales = QUEST_STOPS
    .filter(stop => stop.index % 5 === 0)
    .map(stop => buildTrailSection(stop.id, { seed: stop.index }));
  assert.equal(finales.length, 8);
  assert.equal(new Set(finales.map(section => section.finale.cue)).size, 8);
  finales.forEach(section => {
    assert.equal(section.isChapterFinale, true);
    assert.equal(section.event.mode, "chapter-finale");
    assert.equal(section.event.id, section.finale.id);
  });
});

test("completed trails reappear as restored world moments later in their chapter", () => {
  const section = buildTrailSection("s5", {
    seed: 5,
    completedStopIds: ["s1", "s2", "s3", "s4", "s11"]
  });
  assert.deepEqual(section.restoredMoments.map(moment => moment.sourceStopId), ["s1", "s2", "s3", "s4"]);
  assert.equal(new Set(section.restoredMoments.map(moment => moment.id)).size, 4);
  assert.deepEqual(section.restoredMoments.map(moment => moment.story), section.chapter.memoryStories);
  assert.equal(section.shortcut, section.chapter.shortcut);
  assert.deepEqual(
    restoredWorldMoments(section.chapter, section.chapterStop, ["s1"], section.route, section.world).map(moment => moment.sourceStopId),
    ["s1"]
  );
  section.restoredMoments.forEach(moment => {
    const clamped = clampTrailPosition(moment, section, 1);
    assert.ok(Math.hypot(clamped.x - moment.x, clamped.z - moment.z) < 0.03);
  });
});

test("the route graph blocks progress until each planned encounter is done", () => {
  const section = buildTrailSection("s1", { seed: 1 });
  const first = section.encounters[0];
  const second = section.encounters[1];

  assert.equal(firstUnsolvedEncounter(section)?.id, first.id);
  assert.equal(forwardLimitFor(section), section.guide.progress - 0.012);
  assert.equal(forwardLimitFor(section, { guideDone: true }), first.progress - 0.012);
  assert.equal(
    forwardLimitFor(section, { guideDone: true, solved: [first.id] }),
    second.progress - 0.012
  );
  assert.equal(
    forwardLimitFor(section, { guideDone: true, solved: section.encounters.map(encounter => encounter.id) }),
    1
  );
});

test("trail position clamping keeps saves on the path and honours a closed gate", () => {
  const section = buildTrailSection("s1", { seed: 1 });
  const limit = forwardLimitFor(section);
  const blocked = clampTrailPosition({ x: 999, z: -999 }, section, limit);
  assert.ok(blocked.routeProgress <= limit + 0.000001);
  assert.ok(Math.abs(routeProgressAt(section.route, blocked) - limit) < 0.025);

  const throughGate = clampTrailPosition(section.exit, section, 1);
  assert.ok(throughGate.routeProgress >= section.exit.progress - 0.01);
  assert.ok(routeProgressAt(section.route, throughGate) > section.gate.progress);
});

test("the forty stops rotate route shape and compass direction instead of looping one corridor", () => {
  const sections = QUEST_STOPS.map(stop => buildTrailSection(stop.id, { seed: stop.index }));
  assert.ok(new Set(sections.map(section => section.topology)).size >= 9);
  for (let index = 1; index < sections.length; index += 1) {
    assert.notEqual(sections[index].topology, sections[index - 1].topology, `${sections[index].stopId} repeats the previous route shape`);
  }
  const headings = sections.map(section => Math.round(section.gate.heading / (Math.PI / 2)));
  assert.ok(new Set(headings).size >= 4, "routes do not change compass direction");
});

test("earned route relics add reachable optional cache drops", () => {
  const plain = buildTrailSection("s8", { seed: 8 });
  const rewarded = buildTrailSection("s8", {
    seed: 8,
    rewardIds: ["river-whistle", "lantern-map"]
  });
  const caches = rewarded.drops.filter(drop => drop.cache);
  assert.deepEqual(rewarded.rewardIds, ["river-whistle", "lantern-map"]);
  assert.equal(caches.length, 3);
  assert.equal(rewarded.drops.length, plain.drops.length + 3);
  caches.forEach(cache => {
    const clamped = clampTrailPosition(cache, rewarded, 1);
    assert.ok(Math.hypot(clamped.x - cache.x, clamped.z - cache.z) < 0.03, `${cache.id} is outside the walkable route`);
  });
});
