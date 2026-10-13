import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildLearningEvidenceProfile } from "../../src/utils/learningEvidenceInsights.js";

let vite;
let LearningEvidenceProfile;
let StudentSessionBar;
test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ LearningEvidenceProfile } = await vite.ssrLoadModule("/src/components/reports/LearningEvidenceProfile.jsx"));
  ({ StudentSessionBar } = await vite.ssrLoadModule("/src/components/student-sessions/StudentSessionBar.jsx"));
});
test.after(async () => { await vite?.close(); });

test("teacher detail exposes neutral breadth, recorded contrast and teaching action", () => {
  const profile = buildLearningEvidenceProfile([{ questionId: "item", itemKey: "m", itemType: "initial_sound", templateType: "FIRST_SOUND", responseStatus: "incorrect", selectedAnswer: "n", correctAnswer: "m" }]);
  const html = renderToStaticMarkup(React.createElement(LearningEvidenceProfile, { profile }));
  assert.match(html, /<details/);
  assert.match(html, /<summary>Targets, recorded responses and teaching moves/);
  assert.match(html, /Selected “n”; expected “m”/);
  assert.match(html, /Teach next:/);
  assert.match(html, /fresh pictured word/);
  assert.doesNotMatch(html, /class="(?:red|green|orange)"/);
});

test("missing item detail is visible and has no false teaching-result list", () => {
  const html = renderToStaticMarkup(React.createElement(LearningEvidenceProfile, { profile: buildLearningEvidenceProfile() }));
  assert.match(html, /coverage are unknown/);
  assert.doesNotMatch(html, /<details/);
  assert.doesNotMatch(html, /0 of 0/);
});

test("live Cycle teacher session offers an accessible evidence disclosure without flooding the control strip", () => {
  const result = { totalQuestions: 1, scoredQuestions: 1, correctCount: 0, accuracy: 0, supportedCount: 0, mediaFailedCount: 0,
    questionRecords: [{ questionId: "item", itemKey: "m", evidenceConstruct: "initial_sound_picture_identification", mechanicId: "pictureSound", responseStatus: "incorrect", selected: "net" }] };
  const html = renderToStaticMarkup(React.createElement(StudentSessionBar, {
    session: { target: "cycle_practice" }, members: [{ student_id: "synthetic", cycle_practice_result: result }]
  }));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Open session/);
  assert.match(html, /Export practice results/);
  assert.doesNotMatch(html, /Response: “net”/);
});
