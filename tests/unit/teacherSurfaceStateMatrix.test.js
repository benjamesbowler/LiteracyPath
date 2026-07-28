import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  TEACHER_SURFACE_IDS,
  TEACHER_SURFACE_STATE_FIXTURES,
  TEACHER_SURFACE_STATE_IDS,
  getTeacherSurfaceState
} from "../../src/components/teacher/ui/teacherSurfaceStates.js";

let TeacherSurfaceState;
let TeacherSurfaceStateFixtureSheet;
let vite;

function escapeRenderedText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll(">", "&gt;")
    .replaceAll("<", "&lt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#x27;");
}

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule(
    "/src/components/teacher/ui/TeacherSurfaceState.jsx"
  );
  TeacherSurfaceState = module.TeacherSurfaceState;
  TeacherSurfaceStateFixtureSheet = module.TeacherSurfaceStateFixtureSheet;
});

test.after(async () => {
  await vite?.close();
});

test("catalog contains only state combinations reached by production teacher pages", () => {
  assert.deepEqual(
    TEACHER_SURFACE_IDS,
    ["today", "classes", "assess", "progress", "resources"]
  );
  assert.deepEqual(
    TEACHER_SURFACE_STATE_IDS,
    ["loading", "empty", "partial"]
  );
  assert.deepEqual(
    TEACHER_SURFACE_STATE_FIXTURES.map(fixture => fixture.id),
    [
      "today:loading",
      "today:partial",
      "classes:loading",
      "classes:empty",
      "classes:partial",
      "assess:loading",
      "assess:empty",
      "assess:partial",
      "progress:loading",
      "progress:partial",
      "resources:loading",
      "resources:partial"
    ]
  );
});

for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
  test(`${fixture.id} has specific accessible recovery content`, () => {
    const html = renderToStaticMarkup(
      React.createElement(TeacherSurfaceState, {
        surface: fixture.surfaceId,
        state: fixture.stateId,
        onPrimaryAction: () => {}
      })
    );

    assert.match(html, new RegExp(`data-teacher-surface="${fixture.surfaceId}"`));
    assert.match(html, new RegExp(`data-teacher-state="${fixture.stateId}"`));
    assert.ok(html.includes(escapeRenderedText(fixture.title)));
    assert.ok(html.includes(escapeRenderedText(fixture.body)));
    assert.ok(!/something went wrong|please refresh/i.test(html));
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);

    if (fixture.stateId === "loading") {
      assert.match(html, /aria-busy="true"/);
      assert.doesNotMatch(html, /<button/);
      return;
    }

    assert.doesNotMatch(html, /aria-busy="true"/);
    assert.ok(fixture.primaryLabel);
    assert.ok(html.includes(escapeRenderedText(fixture.primaryLabel)));
    if (fixture.stateId === "partial") {
      assert.ok(fixture.preserved);
      assert.match(html, /What stays safe:/);
    }
  });
}

test("a recovery action is never rendered without a handler", () => {
  for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
    const html = renderToStaticMarkup(
      React.createElement(TeacherSurfaceState, {
        surface: fixture.surfaceId,
        state: fixture.stateId
      })
    );
    assert.doesNotMatch(html, /<button/);
  }
});

test("fixture sheet renders every production combination once", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeacherSurfaceStateFixtureSheet)
  );

  assert.equal(
    (html.match(/data-teacher-surface=/g) || []).length,
    TEACHER_SURFACE_STATE_FIXTURES.length
  );
  assert.match(html, /Production teacher read states/);
  for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
    if (fixture.primaryLabel) {
      assert.ok(html.includes(escapeRenderedText(fixture.primaryLabel)));
    }
  }
});

test("unsupported and invented combinations fail closed", () => {
  assert.throws(
    () => getTeacherSurfaceState("unknown", "loading"),
    /Unknown teacher surface state/
  );
  assert.throws(
    () => getTeacherSurfaceState("today", "empty"),
    /Unknown teacher surface state/
  );
  assert.throws(
    () => getTeacherSurfaceState("today", "conflict"),
    /Unknown teacher surface state/
  );
});
