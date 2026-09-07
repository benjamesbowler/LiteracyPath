import assert from "node:assert/strict";
import test from "node:test";

import { STUDENT_ALLOWED_VIEWS } from "../../src/appState/appViewHelpers.js";
import { APP_VIEWS } from "../../src/appState/appViews.js";
import {
  CHILD_SURFACE_REQUIRED_REGIONS,
  CHILD_SURFACE_ROUTES,
  validateChildSurfaceRegions
} from "../../src/policy/childSurfaceRules.js";

test("the child-surface registry names every signed-in route plus sign in and Arcade", () => {
  const ids = CHILD_SURFACE_ROUTES.map(route => route.id);
  assert.deepEqual(ids, [
    "student-login",
    "student-home",
    "phonics",
    "arcade",
    "adventure-map",
    "cycle-practice",
    "sound-seekers",
    "story-quests",
    "reading-library",
    "my-hollow"
  ]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    CHILD_SURFACE_ROUTES.find(route => route.id === "student-login")?.appView,
    APP_VIEWS.STUDENT_LOGIN
  );
  assert.equal(
    CHILD_SURFACE_ROUTES.find(route => route.id === "arcade")?.mode,
    "games"
  );

  const registeredViews = new Set(CHILD_SURFACE_ROUTES.map(route => route.appView));
  for (const appView of STUDENT_ALLOWED_VIEWS) {
    assert.equal(registeredViews.has(appView), true, `missing child surface for ${appView}`);
  }
});

test("all five regions are required and the primary action must be singular", () => {
  assert.deepEqual(CHILD_SURFACE_REQUIRED_REGIONS, [
    "title",
    "instruction",
    "choices",
    "progress",
    "primary"
  ]);
  assert.deepEqual(
    validateChildSurfaceRegions({
      title: 1,
      instruction: 1,
      choices: 1,
      progress: 1,
      primary: 1
    }),
    { pass: true, missing: [] }
  );
  assert.deepEqual(
    validateChildSurfaceRegions({
      title: 1,
      instruction: 1,
      choices: 1,
      progress: 1,
      primary: 2
    }),
    { pass: false, missing: ["primary"] }
  );
  assert.deepEqual(
    validateChildSurfaceRegions({ primary: 1 }),
    {
      pass: false,
      missing: ["title", "instruction", "choices", "progress"]
    }
  );
});
