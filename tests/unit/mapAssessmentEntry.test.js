import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { listAssessmentCatalog } from '../../src/data/assessmentCatalog.js';
import { STUDENT_FOCUS_TARGET_OPTIONS, STUDENT_FOCUS_TARGETS } from '../../src/policy/studentFocusTargets.js';

let vite, ProgressCheckPage;
test.before(async () => {
  vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  ({ ProgressCheckPage } = await vite.ssrLoadModule('/src/components/progress/ProgressCheckPage.jsx'));
});
test.after(async () => { await vite?.close(); });

test('ordinary assessment and assignment menus cannot start the retired MAP programme', () => {
  assert.equal(listAssessmentCatalog().some(entry => entry.id === 'progress-check'), false);
  assert.equal(STUDENT_FOCUS_TARGET_OPTIONS.some(option => option.id === STUDENT_FOCUS_TARGETS.PROGRESS_CHECK), false);
});

for (const props of [
  {},
  { focusSession: { resolved_config: { plan_kind: 'mock' } } },
  { token: 'child-token', focusSession: { resolved_config: { plan_kind: 'practice' } } },
  { token: 'child-token', focusSession: { resolved_config: { plan_kind: 'broad_profile' } } },
]) test(`unassigned or retired entry waits for the teacher: ${JSON.stringify(props)}`, () => {
  const html = renderToStaticMarkup(React.createElement(ProgressCheckPage, props));
  assert.match(html, /Your teacher starts this test/);
  assert.doesNotMatch(html, /Check answer|Start adventure|Rehearse|I don.t know|Choose a particular skill/);
  assert.equal((html.match(/data-child-primary/g) || []).length, 1);
});
