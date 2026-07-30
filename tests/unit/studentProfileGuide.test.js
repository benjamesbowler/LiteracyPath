import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPANIONS,
  LITTLE_LITERACY_GUIDE_CHANGE_COST,
  changeLittleLiteracyGuide,
  getAvailableGuideStars,
  getCompanion,
  loadStudentProfile
} from "../../src/utils/studentProfile.js";

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function withBrowser(testBody) {
  const previousWindow = globalThis.window;
  const previousCustomEvent = globalThis.CustomEvent;
  const localStorage = makeStorage();
  const events = [];
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
  globalThis.window = {
    localStorage,
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };
  try {
    return testBody({ events, localStorage });
  } finally {
    globalThis.window = previousWindow;
    globalThis.CustomEvent = previousCustomEvent;
  }
}

test("Little Literacy Guides are book characters and the first choice is free", () => withBrowser(() => {
  assert.equal(COMPANIONS.length, 6);
  for (const guide of COMPANIONS) {
    assert.ok(guide.name);
    assert.ok(guide.series, `${guide.name} has no reader series`);
    assert.match(guide.image, /^\/images\/companions\//);
  }

  const result = changeLittleLiteracyGuide("reader-1", "fluff", { earnedStars: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.reason, "first-choice");
  assert.equal(result.cost, 0);
  assert.equal(getCompanion("reader-1")?.name, "Fluff");
  assert.ok(loadStudentProfile("reader-1").companionChosenAt);
}));

test("a later Guide change happens in the saved profile and spends exactly ten stars", () => withBrowser(({ events }) => {
  changeLittleLiteracyGuide("reader-2", "fluff", { earnedStars: 20 });

  const denied = changeLittleLiteracyGuide("reader-2", "chips", { earnedStars: 9 });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, "stars");
  assert.equal(denied.short, 1);
  assert.equal(getCompanion("reader-2")?.id, "fluff");

  const changed = changeLittleLiteracyGuide("reader-2", "chips", { earnedStars: 20 });
  assert.equal(changed.ok, true);
  assert.equal(changed.reason, "changed");
  assert.equal(changed.cost, LITTLE_LITERACY_GUIDE_CHANGE_COST);
  assert.equal(changed.starsRemaining, 10);
  assert.equal(getAvailableGuideStars("reader-2", 20), 10);
  assert.equal(getCompanion("reader-2")?.id, "chips");
  assert.equal(loadStudentProfile("reader-2").guideStarsSpent, 10);

  const sameAgain = changeLittleLiteracyGuide("reader-2", "chips", { earnedStars: 20 });
  assert.equal(sameAgain.reason, "already-chosen");
  assert.equal(sameAgain.cost, 0);
  assert.equal(loadStudentProfile("reader-2").guideStarsSpent, 10);
  assert.ok(events.some(event => event.type === "lp-student-profile-updated"));
}));
