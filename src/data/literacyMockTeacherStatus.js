import { callMockRpc, getLiteracyMockReport } from './literacyMockSessionCore.js';

export async function getLiteracyMockTeacherStatus({ client, sessionId, signal }) {
  try {
    return await callMockRpc(client, 'teacher_get_literacy_mock_status', { p_session_id: sessionId }, signal);
  } catch (error) {
    // Allow a client release to coexist with a database awaiting the migration.
    if (error?.code !== 'PGRST202' && error?.code !== '42883') throw error;
    return getLiteracyMockReport({ client, sessionId, signal });
  }
}
