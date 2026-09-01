import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let ElSkillsQuest;
let StudentAdventureMapPage;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (String(args[0] || "").includes("Supabase frontend environment is MISSING")) return;
    originalConsoleError(...args);
  };
  try {
    ({ ElSkillsQuest } = await vite.ssrLoadModule(
      "/src/components/elQuest/ElSkillsQuest.jsx"
    ));
    ({ StudentAdventureMapPage } = await vite.ssrLoadModule(
      "/src/components/StudentAdventureMapPage.jsx"
    ));
  } finally {
    console.error = originalConsoleError;
  }
});

test.after(async () => {
  await vite?.close();
});

function renderQuest(props = {}) {
  return renderToStaticMarkup(React.createElement(ElSkillsQuest, {
    studentName: "Reader",
    progressScopeKey: "student-1",
    ...props
  }));
}

function renderMap(props = {}) {
  return renderToStaticMarkup(React.createElement(StudentAdventureMapPage, {
    studentName: "Reader",
    progressScopeKey: "student-1",
    renderQuest: () => null,
    ...props
  }));
}

test("a locked Skills Quest opens the exact assigned cycle without a map chooser", () => {
  const html = renderQuest({ lockedCycleId: "cycle-6" });

  assert.match(html, /data-quest-view="cycle"/);
  assert.match(html, />Cycle 6</);
  assert.doesNotMatch(html, /data-child-surface="adventure-map"/);
  assert.doesNotMatch(html, />Map<\/button>/);
  assert.doesNotMatch(html, /Back to the map|Back to your path/);
});

test("an invalid locked Skills Quest assignment fails closed", () => {
  const html = renderQuest({ lockedCycleId: "cycle-99" });

  assert.match(html, /role="alert"/);
  assert.match(html, /assigned map space is not available/i);
  assert.doesNotMatch(html, /data-child-surface="adventure-map"/);
  assert.doesNotMatch(html, /data-quest-view="cycle"/);
});

test("ordinary Skills Quest still opens on its normal Adventure Map", () => {
  const html = renderQuest();

  assert.match(html, /data-child-surface="adventure-map"/);
  assert.match(html, /Follow “you are here” to start/);
});

test("a focused Adventure Map exposes only the assigned cycle and carries the teacher notice", () => {
  const html = renderMap({
    focusLocked: true,
    lockedCycleId: "cycle-6",
    headerActions: React.createElement("div", { "data-teacher-notice": "" }, "Teacher activity")
  });

  assert.match(html, /data-teacher-notice=""/);
  assert.match(html, /<button[^>]*data-cycle-id="cycle-6"[^>]*data-node-state="next"/);
  assert.equal((html.match(/data-child-primary=""/g) || []).length, 1);
  assert.doesNotMatch(html, /class="kg-glass-chrome kg-tabbar"/);
  assert.doesNotMatch(html, /class="kg-currency/);
  assert.doesNotMatch(html, /aria-label="Grown-ups"/);
});

test("an unavailable focused Adventure Map renders no actionable cycle", () => {
  const html = renderMap({ focusLocked: true, lockedCycleId: "cycle-99" });

  assert.match(html, /assigned map space is not available/i);
  assert.doesNotMatch(html, /data-child-primary=""/);
  assert.doesNotMatch(html, /<button[^>]*data-cycle-id="cycle-/);
});

test("ordinary Adventure Map keeps its normal first-unfinished action and navigation", () => {
  const html = renderMap();

  assert.match(html, /<button[^>]*data-cycle-id="cycle-1"[^>]*data-node-state="next"/);
  assert.match(html, /class="kg-glass-chrome kg-tabbar"/);
});
