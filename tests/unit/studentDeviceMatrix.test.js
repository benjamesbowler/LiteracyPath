import assert from "node:assert/strict";
import test from "node:test";

import { CHILD_SURFACE_ROUTES } from "../../src/policy/childSurfaceRules.js";
import {
  STUDENT_DEVICE_PROFILES,
  STUDENT_FULLSCREEN_DEVICE_IDS,
  STUDENT_MINIMUM_TARGET_PX,
  STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS
} from "../../src/policy/studentDeviceMatrix.js";

test("A3.6 matrix covers small phone, tablet, Chromebook, and projector", () => {
  assert.deepEqual(
    [...new Set(STUDENT_DEVICE_PROFILES.map(profile => profile.family))],
    ["small-phone", "tablet", "chromebook", "projector"]
  );
  assert.equal(STUDENT_MINIMUM_TARGET_PX, 44);
  assert.equal(CHILD_SURFACE_ROUTES.length, 9);
});

test("A3.6 phone and tablet have portrait and landscape coverage", () => {
  for (const family of ["small-phone", "tablet"]) {
    assert.deepEqual(
      STUDENT_DEVICE_PROFILES
        .filter(profile => profile.family === family)
        .map(profile => profile.orientation)
        .sort(),
      ["landscape", "portrait"]
    );
  }
  for (const profile of STUDENT_DEVICE_PROFILES) {
    assert.equal(
      profile.orientation,
      profile.width > profile.height ? "landscape" : "portrait",
      profile.id
    );
  }
});

test("A3.6 fullscreen and software-keyboard states span the matrix extremes", () => {
  const profileIds = new Set(STUDENT_DEVICE_PROFILES.map(profile => profile.id));
  assert.equal(STUDENT_FULLSCREEN_DEVICE_IDS.length, 4);
  STUDENT_FULLSCREEN_DEVICE_IDS.forEach(id => assert.equal(profileIds.has(id), true, id));
  assert.deepEqual(
    STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS.map(profile => profile.orientation).sort(),
    ["landscape", "portrait"]
  );
});
