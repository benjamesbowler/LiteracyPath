import { isProgressWriteBlocked } from './progressSync.js';

export const ASSESSMENT_DRAFT_OWNERS_KEY = 'lp-assessment-draft-owners:v1';
const storageFor = storage => storage || globalThis.sessionStorage || globalThis.window?.sessionStorage;
const learner = studentId => String(studentId || '').trim();
function owners(storage) {
  const value = JSON.parse(storage.getItem(ASSESSMENT_DRAFT_OWNERS_KEY) || '{}');
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Invalid draft ownership');
  return value;
}
function saveOwners(storage, value) {
  if (Object.keys(value).length) storage.setItem(ASSESSMENT_DRAFT_OWNERS_KEY, JSON.stringify(value));
  else storage.removeItem(ASSESSMENT_DRAFT_OWNERS_KEY);
}
function canAccess(studentId) {
  return !learner(studentId) || !isProgressWriteBlocked(learner(studentId), 'assessment_draft');
}

// Keep existing sitting/item keys so pre-upgrade drafts still resume. A draft
// acquires its learner owner when that learner's authenticated surface reads it.
export function readAssessmentDraft(key, studentId, storage) {
  try {
    const target = storageFor(storage);
    if (!target || !canAccess(studentId)) return null;
    const value = target.getItem(key);
    if (value === null) return null;
    const index = owners(target), id = learner(studentId);
    if (index[key] && index[key] !== id) return null;
    if (id && !index[key]) { index[key] = id; saveOwners(target, index); }
    return value;
  } catch { return null; }
}
export function writeAssessmentDraft(key, value, studentId, storage) {
  try {
    const target = storageFor(storage);
    if (!target || !canAccess(studentId)) return false;
    const index = owners(target), id = learner(studentId);
    if (index[key] && index[key] !== id) return false;
    // Publish ownership before content; cleanup can verify every owned key.
    if (id) { index[key] = id; saveOwners(target, index); }
    target.setItem(key, value);
    return true;
  } catch { return false; }
}
export function removeAssessmentDraft(key, storage) {
  try {
    const target = storageFor(storage);
    if (!target) return;
    target.removeItem(key);
    const index = owners(target); delete index[key]; saveOwners(target, index);
  } catch { /* A saved response is authoritative; privacy cleanup verifies removal. */ }
}
export function learnerAssessmentDraftKeys(studentId, storage) {
  const target = storageFor(storage), id = learner(studentId);
  if (!target || !id) return [];
  const index = owners(target);
  // Pending mock requests already carry the exact learner in their old key.
  const pending = Array.from({ length: target.length }, (_, i) => target.key(i))
    .filter(key => key?.startsWith(`lp-mock-pending:${id}:`));
  return [...new Set([...Object.keys(index).filter(key => index[key] === id), ...pending])];
}
export function clearLearnerAssessmentDrafts(studentId, storage) {
  const target = storageFor(storage);
  if (!target) return;
  const keys = learnerAssessmentDraftKeys(studentId, target), index = owners(target);
  for (const key of keys) {
    target.removeItem(key);
    if (target.getItem(key) === null) delete index[key];
  }
  saveOwners(target, index);
}
