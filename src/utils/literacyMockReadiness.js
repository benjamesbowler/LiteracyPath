import { readAssessmentDraft, writeAssessmentDraft } from './assessmentDraftStorage.js';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const key = studentId => `lp-mock-controls:v1:${studentId}`;

/** Device-local control practice, never literacy evidence or sound readiness. */
export function readLiteracyMockReadiness(studentId, { storage, now = Date.now() } = {}) {
  if (!studentId) return {};
  try {
    const value = JSON.parse(readAssessmentDraft(key(studentId), studentId, storage) || '{}');
    return Object.fromEntries(Object.entries(value).filter(([, time]) => Number.isFinite(time)
      && time <= now && now - time < MAX_AGE_MS));
  } catch { return {}; }
}

export function recordLiteracyMockReadiness(studentId, format, { storage, now = Date.now() } = {}) {
  if (!studentId || !['multi_select', 'match', 'order', 'select_text', 'build_word'].includes(format)) return false;
  return writeAssessmentDraft(key(studentId), JSON.stringify({
    ...readLiteracyMockReadiness(studentId, { storage, now }), [format]: now,
  }), studentId, storage);
}

export function selectLiteracyMockTutorials(bank, tutorialIds, mock, readiness = {}) {
  const all = Object.values(tutorialIds).map(id => bank.find(item => item.id === id)).filter(Boolean);
  if (mock?.plan_kind !== 'fresh_check') return all;
  const formats = new Set(bank.filter(item => mock.candidate_item_ids?.includes(item.id)).map(item => item.format));
  return all.filter(item => formats.has(item.format) && !Number.isFinite(readiness[item.format]));
}
