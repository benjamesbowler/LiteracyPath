import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  buildTrailSection,
  clampTrailPosition,
  firstUnsolvedEncounter,
  forwardLimitFor,
  trailEventForStop,
  trailCenterX,
  trailHalfWidth,
  TRAIL_BOUNDS,
  TRAIL_EXIT_Z
} from "../../src/utils/questHub.js";
import { responsesInWalk } from "../../src/utils/questEncounters.js";

test("every curriculum stop becomes one long ordered trail section", () => {
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    assert.ok(section, `${stop.id} did not build a trail section`);
    assert.equal(section.stopIndex, stop.index);
    assert.ok(section.guide.z > section.encounters[0].z, `${stop.id} put the teacher after the first task`);
    assert.ok(section.encounters.length >= 1 && section.encounters.length <= 3);
    assert.ok(section.drops.length >= 10, `${stop.id} left the long walk empty`);
    assert.ok(section.ambience.length >= 18, `${stop.id} has too little ambient life for a long trail`);
    assert.ok(section.landmark?.kind, `${stop.id} has no authored section landmark`);
    assert.ok(section.lighting?.id, `${stop.id} has no lighting phase`);
    assert.equal(section.event.id, trailEventForStop(stop).id);
    assert.ok(section.gate.z < section.encounters.at(-1).z, `${stop.id} put its gate before the final helper`);
    assert.ok(section.exit.z < section.gate.z, `${stop.id} cannot be walked through its gate`);

    for (let index = 1; index < section.encounters.length; index += 1) {
      const gap = section.encounters[index - 1].z - section.encounters[index].z;
      assert.ok(gap >= 30, `${stop.id} bunched two helpers only ${gap} units apart`);
      assert.equal(section.encounters[index].order, index);
    }

    for (const encounter of section.encounters) {
      assert.ok(encounter.repair?.kind, `${stop.id} ${encounter.id} has no repair moment`);
    }

    for (const item of [section.guide, ...section.encounters, ...section.drops, section.gate, section.exit]) {
      const center = trailCenterX(item.z, stop.index);
      const halfWidth = trailHalfWidth(item.z, stop.index);
      assert.ok(item.x >= center - halfWidth && item.x <= center + halfWidth, `${stop.id} placed ${item.id || "an object"} in the forest wall`);
    }
    assert.ok(responsesInWalk(section) <= 8, `${stop.id} turned the journey back into a quiz`);
  }
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
  assert.equal(finale.event.id, "starReach");
  assert.equal(finale.event.mode, "finale");
  assert.equal(regular.event.mode, "section");
});

test("the forest corridor blocks progress until each planned encounter is done", () => {
  const section = buildTrailSection("s1", { seed: 1 });
  const first = section.encounters[0];
  const second = section.encounters[1];

  assert.equal(firstUnsolvedEncounter(section)?.id, first.id);
  assert.equal(forwardLimitFor(section), section.guide.z + 1.35);
  assert.equal(forwardLimitFor(section, { guideDone: true }), first.z + 1.35);
  assert.equal(
    forwardLimitFor(section, { guideDone: true, solved: [first.id] }),
    second.z + 1.35
  );
  assert.equal(
    forwardLimitFor(section, { guideDone: true, solved: section.encounters.map(encounter => encounter.id) }),
    TRAIL_BOUNDS.endZ
  );
});

test("trail position clamping keeps saves on the path and honours a closed gate", () => {
  const section = buildTrailSection("s1", { seed: 1 });
  const limit = forwardLimitFor(section);
  const blocked = clampTrailPosition({ x: 999, z: -999 }, section.stopIndex, limit);
  assert.equal(blocked.z, limit);
  assert.equal(blocked.x, trailCenterX(limit, section.stopIndex) + trailHalfWidth(limit, section.stopIndex));

  const throughGate = clampTrailPosition({ x: -999, z: -999 }, section.stopIndex, TRAIL_BOUNDS.endZ);
  assert.equal(throughGate.z, TRAIL_BOUNDS.endZ);
  assert.ok(throughGate.z < TRAIL_EXIT_Z);
  assert.equal(
    throughGate.x,
    trailCenterX(TRAIL_BOUNDS.endZ, section.stopIndex) - trailHalfWidth(TRAIL_BOUNDS.endZ, section.stopIndex)
  );
});
