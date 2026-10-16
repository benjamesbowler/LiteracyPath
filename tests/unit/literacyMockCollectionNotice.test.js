import test from 'node:test';
import assert from 'node:assert/strict';
import { literacyMockCollectionNotice } from '../../src/utils/literacyMockCollectionNotice.js';

const notice = { kind: 'collection', sessionId: 'current', collectionId: 'collect-current' };
const context = ({ state = 'running', pending = 1, answered = 39, planned = 43, runStatus = 'running' } = {}) => ({
  sessionId: 'current', classId: 'class-a', reportState: 'ready',
  snapshot: { session: { id: 'current', class_id: 'class-a', mock: { state, collection_id: 'collect-current', collection_pending_count: pending } } },
  report: { session: { id: 'current' }, pupils: [{ run: { status: runStatus }, answered, planned }, { run: null, answered: 0, planned: 43 }] }
});

test('the same collection notice follows the final four server-confirmed answers', () => {
  assert.match(literacyMockCollectionNotice(notice, context()), /^Collecting answers\./);
  const complete = context({ state: 'completed', pending: 0, answered: 43, runStatus: 'completed' });
  assert.equal(literacyMockCollectionNotice(notice, complete), 'All started iPads have delivered their answers. The report is ready.');
});

test('finished sessions with missing or unconfirmed data never claim all answers arrived', () => {
  const partial = context({ state: 'completed', pending: 0, answered: 39, runStatus: 'completed' });
  assert.match(literacyMockCollectionNotice(notice, partial), /^Collection finished\. The report includes partial sittings/);
  for (const pending of [1, undefined, null]) {
    const incomplete = context({ state: 'completed', answered: 43, runStatus: 'completed' });
    incomplete.snapshot.session.mock.collection_pending_count = pending;
    assert.match(literacyMockCollectionNotice(notice, incomplete), /still unconfirmed/);
  }
});

test('an absent sitting and unknown planned length do not become full receipt', () => {
  const absent = context({ state: 'completed', pending: 0, runStatus: 'completed' });
  absent.report.pupils = [{ run: null, planned: 43, answered: 0 }];
  assert.equal(literacyMockCollectionNotice(notice, absent), 'Collection finished. No started sitting was received.');
  const unknown = context({ state: 'completed', pending: 0, answered: 43, planned: null, runStatus: 'completed' });
  assert.equal(literacyMockCollectionNotice(notice, unknown), 'Collection finished. Check the report for received answers and questions not reached.');
});

test('loading, failed and mismatched receipts require a current-session refresh', () => {
  const complete = context({ state: 'completed', pending: 0, answered: 43, runStatus: 'completed' });
  for (const change of [
    value => { value.reportState = 'loading'; },
    value => { value.reportState = 'error'; },
    value => { value.snapshot.session.id = 'earlier'; },
    value => { value.snapshot.session.class_id = 'other-class'; },
    value => { value.report.session.id = 'earlier'; },
    value => { value.snapshot.session.mock.collection_id = 'another-collection'; },
  ]) {
    const value = structuredClone(complete); change(value);
    assert.equal(literacyMockCollectionNotice(notice, value), 'Collection requested. Refresh progress to confirm delivery.');
  }
});

test('another requested report and pending-action messages stay separate from collection', () => {
  assert.equal(literacyMockCollectionNotice(notice, { ...context(), sessionId: 'requested' }), '');
  for (const message of ['', 'The earlier session action is confirmed. The requested report remains open.',
    'This action could not be confirmed. Retry the same action to recover its result.']) {
    assert.equal(literacyMockCollectionNotice(message, context({ state: 'completed', pending: 0, answered: 43, runStatus: 'completed' })), message);
  }
});
