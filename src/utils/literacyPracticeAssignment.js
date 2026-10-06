import { LITERACY_DOMAINS, LITERACY_PRACTICE_ID, LITERACY_PRACTICE_VERSION, LITERACY_PRACTICE_TURNS, LITERACY_FOCUSED_TURNS } from '../policy/literacyPracticePolicy.js';
import { markStudentFocusSessionComplete } from '../data/studentFocusSessionCore.js';
import { loadLearnGamesProgress } from './learnGamesProgress.js';
import { sanitizeCloudProgressPayload } from './progressMerge.js';

export function literacyPracticeAssignment(focusSession, at = Date.now()) {
  const config = focusSession?.resolved_config;
  if (!focusSession?.id || focusSession.target !== 'progress_check' || focusSession.status !== 'active'
    || !Number.isFinite(Date.parse(focusSession.expires_at)) || Date.parse(focusSession.expires_at) <= at
    || focusSession.content_version !== LITERACY_PRACTICE_VERSION
    || !config || typeof config !== 'object' || Array.isArray(config)
    || Object.keys(config).some(key => !['plan_kind', 'track_id', 'bank_version'].includes(key))
    || config.plan_kind !== 'practice' || config.bank_version !== LITERACY_PRACTICE_VERSION
    || !['all', ...LITERACY_DOMAINS.map(domain => domain.id)].includes(config.track_id)) return null;
  return { assignmentId: focusSession.id, focusId: config.track_id };
}

export function literacyPracticeOwner(studentId, assignment = null) {
  return { studentId, assignmentId: assignment?.assignmentId || '', focusId: assignment?.focusId || '', contentVersion: LITERACY_PRACTICE_VERSION };
}

export function decorateLiteracyPracticeSession(session, owner) {
  return { ...session, practiceOwner: { ...owner, focusId: owner.focusId || session.skillId } };
}

export function canResumeLiteracyPracticeSession(session, owner) {
  const saved = session?.practiceOwner;
  return Boolean(session?.id && saved && saved.studentId === owner.studentId
    && saved.assignmentId === owner.assignmentId && saved.contentVersion === owner.contentVersion
    && saved.focusId === session.skillId && (!owner.focusId || saved.focusId === owner.focusId)
    && Array.isArray(session.questionIds)
    && session.questionIds.length === (session.skillId === 'all' ? LITERACY_PRACTICE_TURNS : LITERACY_FOCUSED_TURNS)
    && new Set(session.questionIds).size === session.questionIds.length);
}

export function isCompletedLiteracyPracticeSession(session, owner) {
  return canResumeLiteracyPracticeSession(session, owner)
    && Array.isArray(session.questionIds) && session.questionIds.length > 0
    && session.index === session.questionIds.length && Number.isFinite(Date.parse(session.completedAt));
}

// A classroom completion receipt follows a verified local terminal checkpoint
// and a positive cloud-save receipt. The generic progress transport keeps this
// as practice evidence; no independent-check endpoint or score is involved.
export async function completeLiteracyPracticeAssignment({ client, token, owner, session, isCurrent = () => true, readProgress = loadLearnGamesProgress }) {
  if (!owner.assignmentId || !token || !client || !isCompletedLiteracyPracticeSession(session, owner)) {
    throw new Error('This practice session is not ready to share as finished.');
  }
  if (!isCurrent()) return { ok: false, cancelled: true };
  const progress = readProgress(owner.studentId);
  const saved = progress?.games?.[LITERACY_PRACTICE_ID]?.checkpoints?.practice;
  if (!isCompletedLiteracyPracticeSession(saved, owner) || saved.id !== session.id
    || saved.completedAt !== session.completedAt || JSON.stringify(saved.questionIds) !== JSON.stringify(session.questionIds)) {
    throw new Error('Keep this page open and save your finished practice before sharing it.');
  }
  const result = await client.call('student_save_progress', {
    p_token: token, p_area: 'learn_games', p_key: '__all__',
    p_payload: sanitizeCloudProgressPayload('learn_games', { v: 1, ...progress })
  });
  if (result?.error || result?.data?.ok !== true) throw result?.error || new Error(result?.data?.error || 'Practice could not be shared yet.');
  if (!isCurrent()) return { ok: false, cancelled: true };
  const completed = await markStudentFocusSessionComplete({ client, token, sessionId: owner.assignmentId });
  if (completed?.ok !== true) throw new Error(completed?.error || 'Your teacher has not received the finished message yet.');
  return isCurrent() ? completed : { ok: false, cancelled: true };
}
