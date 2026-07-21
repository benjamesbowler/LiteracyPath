import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  authoredPixelRouteCenters,
  stopPixelMap
} from "../../src/data/questPixelMaps.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import { buildPhysicalTask } from "../../src/utils/questPhysicalMechanics.js";
import {
  questChoiceCorridorRadius,
  questPixelChoiceOffsets,
  questPixelVerbProfile,
  questRouteBoundaryProfile
} from "../../src/utils/questSliceSystems.js";

const pixelY = progress => 1060 - (Math.max(0, Math.min(1, progress)) * 980);
const progressAtY = y => Math.max(0, Math.min(1, (1060 - y) / 980));

function routeCenters(stopId, y) {
  return authoredPixelRouteCenters(stopPixelMap(stopId), progressAtY(y));
}

test("all forty stops expand the active movement corridor to every rendered answer layout", () => {
  const failures = [];
  const scannedStops = new Set();
  let scannedStages = 0;

  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    const map = stopPixelMap(stop.id);
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (!task) return;
        task.stages.forEach(stage => {
          scannedStops.add(stop.id);
          scannedStages += 1;
          const residentIndex = encounter.order || 0;
          const side = map.residentSides[residentIndex % map.residentSides.length] || 0;
          const residentLateral = side * (map.scene === "arena" ? 18 : map.scene === "workyard" ? 30 : 24);
          const residentY = pixelY(encounter.progress);
          const residentX = routeCenters(stop.id, residentY)[0] + residentLateral;
          const offsets = questPixelChoiceOffsets(stage.layout, stage.items.length);
          const response = questPixelVerbProfile(task.verbPattern, task.mechanic).response;
          const motionPadding = response === "sort" ? 10 : response === "chase" ? 20 : 0;
          const choices = stage.items.map((item, index) => {
            const [lateral, forward] = offsets[index % offsets.length];
            const y = residentY + forward;
            return {
              id: item.id,
              x: residentX + lateral,
              y,
              radius: 19,
              routeCenters: routeCenters(stop.id, y),
              motionPadding
            };
          });
          const required = questChoiceCorridorRadius({ choices });
          const boundary = questRouteBoundaryProfile({
            authored: true,
            pathWidth: 24,
            choiceCorridorRadius: required
          });

          for (const choice of choices) {
            const routeDistance = Math.abs(choice.x - choice.routeCenters[0]);
            const reachableDistance = boundary.innerRadius + choice.radius - 4;
            if (routeDistance + choice.motionPadding > reachableDistance + 0.000001) {
              failures.push(`${stop.id}/${encounter.id}/${stage.id}/${choice.id}`);
            }
          }
        });
      });
    }
  }

  assert.equal(scannedStops.size, 40);
  assert.ok(scannedStages > 100, "the invariant must exercise the full authored task catalogue");
  assert.deepEqual(failures, [], `Unreachable rendered choices:\n${failures.join("\n")}`);
});

test("the Hollow Tree regression widens beyond the old authored-route wall", () => {
  const choice = {
    x: 433.79446064139944,
    y: 738.8,
    radius: 19,
    routeCenters: routeCenters("s1", 738.8)
  };
  const oldBoundary = questRouteBoundaryProfile({ authored: true, pathWidth: 24 });
  const routeDistance = Math.abs(choice.x - choice.routeCenters[0]);
  assert.ok(routeDistance - oldBoundary.outerRadius > choice.radius, "the fixture must reproduce the old dead answer");

  const required = questChoiceCorridorRadius({ choices: [choice] });
  const fixedBoundary = questRouteBoundaryProfile({
    authored: true,
    pathWidth: 24,
    choiceCorridorRadius: required
  });
  assert.ok(routeDistance <= fixedBoundary.innerRadius + choice.radius - 4);
  assert.ok(fixedBoundary.outerRadius >= fixedBoundary.innerRadius + 22);
});
