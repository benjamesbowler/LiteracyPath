import { useState } from 'react';
import { readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft } from '../../utils/assessmentDraftStorage.js';

const prefix = question => `lp-assessment-draft:${question.practiceSessionId || 'preview'}:${question.id}:`;
function read(question, part, initial) {
  if (!question.requireExplicitSubmit) return initial;
  try {
    const value = JSON.parse(readAssessmentDraft(prefix(question) + part, question.practiceLearnerId) || 'null');
    if (value == null || (Array.isArray(initial) && !Array.isArray(value))) return initial;
    return value;
  }
  catch { return initial; }
}

// An unfinished selection is device-local interaction state, never a response.
// Scope it to the sitting and item; the immutable answer clears it after saving.
export function useAssessmentDraft(question, part, initial) {
  const key = prefix(question) + part;
  const [state, setState] = useState(() => ({ key, value: read(question, part, initial) }));
  const value = state.key === key ? state.value : read(question, part, initial);
  const update = next => setState(previous => {
    const current = previous.key === key ? previous.value : read(question, part, initial);
    const result = typeof next === 'function' ? next(current) : next;
    if (question.requireExplicitSubmit) {
      try { writeAssessmentDraft(key, JSON.stringify(result), question.practiceLearnerId); } catch { /* No answer exists yet. */ }
    }
    return { key, value: result };
  });
  return [value, update];
}

export function clearAssessmentDrafts(question) {
  try {
    const start = prefix(question);
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(start)) removeAssessmentDraft(key);
    removeAssessmentDraft(`lp-map-draft:${question.practiceSessionId || 'preview'}:${question.id}`);
  } catch { /* The saved first response is authoritative. */ }
}
