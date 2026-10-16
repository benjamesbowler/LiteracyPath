import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { prepareLiteracyMockSession } from '../../src/data/literacyMockSessionCore.js';
import { BOUNDARY_RPCS, validateSupabaseResponse } from '../../src/data/boundaries/client.js';
import { projectMockMutation } from '../../src/utils/literacyMockOutbox.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { LITERACY_MOCK_VERSIONS } from '../../src/policy/literacyMockVersions.js';

const version = 'literacy-mock-v10';
let vite, LiteracyMockReport;
test.before(async () => {
  vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  ({ LiteracyMockReport } = await vite.ssrLoadModule('/src/components/progress/LiteracyMockReport.jsx'));
});
test.after(() => vite?.close());
test('two-digit publication preparation retains its v prefix and the bounded route', async () => {
  const calls = [], client = { call: async (name, args) => { calls.push({ name, args }); return { data: { ok: true } }; } };
  for (const contentVersion of [version, 'literacy-mock-v9', 'literacy-mock-v8']) {
    await prepareLiteracyMockSession({ client, classId: 'class', contentVersion });
  }
  assert.deepEqual(calls.map(call => [call.name, call.args.p_item_count]), [
    ['teacher_prepare_literacy_mock_session_v10', 67], ['teacher_prepare_literacy_mock_session_v9', 67],
    ['teacher_prepare_literacy_mock_session_v8', 43],
  ]);
  assert.ok(calls.every(call => BOUNDARY_RPCS.includes(call.name)));
  assert.ok(Array.from({ length: 10 }, (_, index) => `literacy-mock-v${index + 1}`).every(value => LITERACY_MOCK_VERSIONS.includes(value)));
});

test('V10 runs cross the validated boundary with presentation tracking and variable-length recovery', () => {
  const run = { schemaVersion: 2, contentVersion: version, assignmentId: 'session', studentId: 'child', revision: 0,
    eventRevision: 0, presentationTracking: true, presentations: [], helpRequests: [], responses: [],
    plan: { seed: 'seed', itemIds: ['first', 'second', 'third'] }, status: 'ready' };
  const mock = { content_version: version, state: 'running', revision: 0, item_count: 67, remaining_seconds: 0,
    window_mode: 'untimed', server_now: '2026-10-17T00:00:00Z' };
  assert.doesNotThrow(() => validateSupabaseResponse('rpc', 'student_get_literacy_mock_run', { data: { ok: true, mock, run }, error: null }));
  assert.throws(() => validateSupabaseResponse('rpc', 'student_get_literacy_mock_run', {
    data: { ok: true, mock, run: { ...run, schemaVersion: 1 } }, error: null,
  }));
  const shortened = projectMockMutation(run, { expectedRevision: 0, plan: { seed: 'seed', itemIds: ['first', 'second'] } });
  assert.equal(shortened.plan.itemIds.length, 2);
  assert.equal(run.plan.itemIds.length, 3);
  assert.throws(() => projectMockMutation({ ...shortened, status: 'completed' }, {
    expectedRevision: shortened.revision, plan: run.plan,
  }), /Invalid local plan/);
});

test('V10 teacher reports show repeated boundary evidence and keep higher demands unmeasured', () => {
  const responses = [0, 1, 0, 1].map((band, index) => ({
    questionId: `q${index}`, skillId: 'context_clues', domainId: 'vocabulary', level: 1, responseStatus: 'answered',
    selected: 'c0', isCorrect: band === 0, evidenceType: 'independent', supportUsed: false,
    serverReceivedAt: '2026-10-17T00:00:00Z', itemSnapshot: { domainId: 'vocabulary', skillId: 'context_clues', level: 1,
      prompt: 'Which meaning fits?', choices: [{ id: 'c0', label: 'One meaning' }, { id: 'c1', label: 'Another meaning' }], answer: 'c0',
      adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: band, adaptiveDemand: { operation: 'reviewed_sample', requires: 'Use the supplied evidence.' } },
  }));
  const report = buildLiteracyMockReport({ session: { id: 'session', content_version: version, mock: { item_count: 67 } },
    members: [{ student_id: 'child', run: { status: 'completed', plan: { itemIds: responses.map(row => row.questionId) }, responses } }] },
  { now: '2026-10-17T00:00:00Z', students: [{ id: 'child', name: 'Alex' }] });
  assert.equal(report.boundaryAdaptive, true);
  const html = renderToStaticMarkup(React.createElement(LiteracyMockReport, { report, initialStudentId: 'child' }));
  assert.match(html, /can use up to 67 questions/);
  assert.match(html, /2 of 4 independent answers correct/);
  assert.match(html, /Boundary observed: First steps \/ Starter/);
  assert.match(html, /No independent answers at: Early, Building, Developing, Extending/);
  assert.doesNotMatch(html, /Mastered|RIT score:/);
});
