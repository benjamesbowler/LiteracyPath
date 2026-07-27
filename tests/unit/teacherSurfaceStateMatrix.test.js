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

test("state catalog is an exact five-surface by eight-state matrix", () => {
  assert.deepEqual(
    TEACHER_SURFACE_IDS,
    ["today", "classes", "assess", "progress", "resources"]
  );
  assert.deepEqual(
    TEACHER_SURFACE_STATE_IDS,
    [
      "loading",
      "empty",
      "partial",
      "offline",
      "denied",
      "conflict",
      "expired",
      "retry-success"
    ]
  );
  assert.equal(TEACHER_SURFACE_STATE_FIXTURES.length, 40);
  assert.equal(
    new Set(TEACHER_SURFACE_STATE_FIXTURES.map(fixture => fixture.id)).size,
    40
  );
});

for (const surface of TEACHER_SURFACE_IDS) {
  for (const state of TEACHER_SURFACE_STATE_IDS) {
    test(`${surface}/${state} fixture has specific accessible recovery content`, () => {
      const content = getTeacherSurfaceState(surface, state);
      // Handlers are supplied because a recovery action is only rendered when it
      // can actually do something. See the dead-button test below.
      const html = renderToStaticMarkup(
        React.createElement(TeacherSurfaceState, {
          surface,
          state,
          onPrimaryAction: () => {},
          onSecondaryAction: () => {}
        })
      );

      assert.match(html, new RegExp(`data-teacher-surface="${surface}"`));
      assert.match(html, new RegExp(`data-teacher-state="${state}"`));
      assert.ok(
        html.includes(escapeRenderedText(content.title)),
        `${content.id} title is rendered`
      );
      assert.ok(
        html.includes(escapeRenderedText(content.body)),
        `${content.id} body is rendered`
      );
      assert.ok(!/something went wrong|please refresh/i.test(html));

      if (["denied", "conflict", "expired"].includes(state)) {
        assert.match(html, /role="alert"/);
        assert.match(html, /aria-live="assertive"/);
      } else {
        assert.match(html, /role="status"/);
        assert.match(html, /aria-live="polite"/);
      }

      if (state === "loading") {
        assert.match(html, /aria-busy="true"/);
        assert.doesNotMatch(html, /<button/);
      } else {
        assert.doesNotMatch(html, /aria-busy="true"/);
        assert.ok(content.primaryLabel);
        assert.ok(html.includes(escapeRenderedText(content.primaryLabel)));
      }

      if (["partial", "offline", "conflict", "expired"].includes(state)) {
        assert.ok(content.preserved);
        assert.match(html, /What stays safe:/);
      }

      if (state === "retry-success") {
        assert.match(content.marker, /up to date/i);
        assert.match(content.primaryLabel, /continue/i);
      }
    });
  }
}

test("a recovery action is never rendered without a handler behind it", () => {
  for (const surface of TEACHER_SURFACE_IDS) {
    for (const state of TEACHER_SURFACE_STATE_IDS) {
      const content = getTeacherSurfaceState(surface, state);
      const noHandlers = renderToStaticMarkup(
        React.createElement(TeacherSurfaceState, { surface, state })
      );
      assert.doesNotMatch(
        noHandlers,
        /<button/,
        `${content.id} must not offer a button that does nothing`
      );

      if (!content.primaryLabel) continue;

      const primaryOnly = renderToStaticMarkup(
        React.createElement(TeacherSurfaceState, {
          surface,
          state,
          onPrimaryAction: () => {}
        })
      );
      assert.equal(
        (primaryOnly.match(/<button/g) || []).length,
        1,
        `${content.id} renders only the action it was given a handler for`
      );
      assert.ok(primaryOnly.includes(escapeRenderedText(content.primaryLabel)));
      if (content.secondaryLabel) {
        assert.ok(!primaryOnly.includes(escapeRenderedText(content.secondaryLabel)));
      }
    }
  }
});

test("storybook-style fixture sheet renders every matrix cell once", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeacherSurfaceStateFixtureSheet)
  );

  assert.equal((html.match(/data-teacher-surface=/g) || []).length, 40);
  assert.equal((html.match(/data-teacher-state=/g) || []).length, 40);
  assert.match(html, /Five surfaces × eight recoverable states/);

  // The design sheet still shows every recovery action, because it supplies its
  // own handlers rather than relying on labels alone.
  for (const fixture of TEACHER_SURFACE_STATE_FIXTURES) {
    if (!fixture.primaryLabel) continue;
    assert.ok(
      html.includes(escapeRenderedText(fixture.primaryLabel)),
      `${fixture.id} action is visible on the fixture sheet`
    );
  }
});

test("unknown surface-state combinations fail closed", () => {
  assert.throws(
    () => getTeacherSurfaceState("unknown", "offline"),
    /Unknown teacher surface state/
  );
  assert.throws(
    () => getTeacherSurfaceState("today", "unknown"),
    /Unknown teacher surface state/
  );
});
