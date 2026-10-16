import { test, expect } from '@playwright/test';

async function openCollectionPanel(page) {
  await page.goto('/tests/fixtures/literacy-mock.html?case=collection-notice&mode=format');
  await expect(page.locator('.literacy-mock-question')).toBeVisible({ timeout: 60000 });
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { TeacherLiteracyMockPanel } = await import('/src/components/progress/TeacherLiteracyMockPanel.jsx');
    const ids = Array.from({ length: 43 }, (_, index) => `q${index}`);
    const responses = length => ids.slice(0, length).map(questionId => ({ questionId, responseStatus: 'answered',
      skillId: 'initial_sounds', domainId: 'sound_awareness', level: 1, evidenceType: 'independent', isCorrect: true,
      serverReceivedAt: new Date().toISOString(), itemSnapshot: { id: questionId, adaptiveAreaVersion: 'areas-v4',
        adaptiveAreaBand: 1, adaptiveDemand: { operation: 'initial_sound_discrimination' } } }));
    const session = { id: 'collection-session', class_id: 'class-a', content_version: 'literacy-mock-v8', status: 'active',
      started_at: new Date().toISOString(), mock: { state: 'running', revision: 1, item_count: 43,
        window_mode: 'untimed', delivery_mode: 'collect', server_now: new Date().toISOString(),
        collection_pending_count: 1, capabilities: { offlineDelivery: true } } };
    const run = { status: 'running', plan: { itemIds: ids, seed: 'collection' }, responses: responses(39) };
    const report = () => ({ ok: true, session: structuredClone(session), members: [{ student_id: 'student-a', run: structuredClone(run) }] });
    const client = { async call(name, args) {
      if (name === 'teacher_list_literacy_mock_history_page') return { data: { ok: true, sessions: [{ ...structuredClone(session), member_student_ids: ['student-a'] }], hasMore: false, nextCursor: null } };
      if (name === 'teacher_get_literacy_mock_report') return { data: report() };
      if (name === 'teacher_control_literacy_mock_session') {
        session.mock.collection_id = args.p_request_id; session.mock.revision++;
        return { data: { ok: true, session: structuredClone(session) } };
      }
      throw Error(`Unexpected collection test RPC: ${name}`);
    } };
    window.__collectionNotice = { complete(length = 43) {
      session.mock.state = 'completed'; session.mock.collection_pending_count = 0;
      session.mock.end_reason = 'teacher_collected'; session.mock.server_now = new Date().toISOString();
      session.status = 'ended'; run.status = 'completed'; run.responses = responses(length);
    } };
    const element = document.createElement('div'); element.id = 'collection-regression'; document.body.replaceChildren(element);
    createRoot(element).render(React.createElement(TeacherLiteracyMockPanel, { client, teacherId: 'teacher-a', classId: 'class-a',
      initialSessionId: session.id, initialPhase: 'live', students: [{ id: 'student-a', name: 'Alex' }] }));
  });
  const panel = page.locator('#collection-regression');
  await expect(panel.getByRole('button', { name: 'Collect all data and finish', exact: true })).toBeEnabled();
  await panel.getByRole('button', { name: 'Collect all data and finish', exact: true }).click();
  await panel.getByRole('dialog').getByRole('button', { name: 'Collect all data and finish', exact: true }).click();
  await expect(panel.locator('.literacy-mock-notice')).toContainText('Collecting answers.');
  return panel;
}

test('collection notice follows refreshed server receipts after the last four answers arrive', async ({ page }) => {
  const panel = await openCollectionPanel(page);
  await page.evaluate(() => window.__collectionNotice.complete());
  await panel.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(panel.locator('.literacy-mock-notice')).toContainText('All started iPads have delivered their answers. The report is ready.');
  await expect(panel.locator('.literacy-mock-notice')).not.toContainText('Collecting answers.');
});

test('collection completion with a partial sitting does not claim every answer arrived', async ({ page }) => {
  const panel = await openCollectionPanel(page);
  await page.evaluate(() => window.__collectionNotice.complete(39));
  await panel.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(panel.locator('.literacy-mock-notice')).toContainText('Collection finished. The report includes partial sittings and questions not reached.');
  await expect(panel.locator('.literacy-mock-notice')).not.toContainText('All started iPads have delivered their answers.');
});
