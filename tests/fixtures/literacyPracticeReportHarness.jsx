import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import { FinishedReportPage } from '../../src/components/FinishedReportPage.jsx';
import { LITERACY_PRACTICE_SKILLS } from '../../src/data/literacyPracticeBank.js';
import { hydrateCloudProgress } from '../../src/utils/progressSync.js';
import { localProgressStorageKey } from '../../src/utils/progressKeys.js';
import { encodeProgressStorage, decodeProgressStorage } from '../../src/utils/progressStorageCodec.js';

// Synthetic protocol fixture: the real hydration/storage/report path, with no
// authenticated user, hosted writes or production learner records.
const scope = 'compressed-report-fixture';
const occurredAt = new Date().toISOString();
const skill = LITERACY_PRACTICE_SKILLS[0];
const completions = Array.from({ length: 40 }, (_, index) => ({
  id: `fixture-response-${index}`, sessionId: 'fixture-sitting', completedAt: occurredAt,
  gameId: 'literacy-practice', contentVersion: 'literacy-practice-v1',
  practiceOnly: true, formalAssessment: false, masteryClaim: false,
  steps: [{ questionId: `fixture-question-${index}`, skillId: skill.id, skillName: skill.label, level: 1,
    presentationRole: 'first_probe', evidenceType: 'independent', responseStatus: 'answered', isCorrect: true,
    supportUsed: false, validity: 'valid', mediaReady: true, occurredAt,
    selected: 'cat', expected: 'cat', itemSnapshot: {
      prompt: `Synthetic question ${index + 1}`, passage: 'Synthetic saved literacy context. '.repeat(100)
    } }]
}));
const payload = { games: { 'literacy-practice': { practiceRecord: { v: 3, status: 'inprogress', completions } } } };
const storageKey = localProgressStorageKey('learn_games', scope);
localStorage.removeItem(storageKey);
await hydrateCloudProgress({ mode: 'student', studentId: scope, token: 'fixture-only', client: {
  call: async () => ({ data: [{ area: 'learn_games', key: '__all__', payload }], error: null })
} });
if (new URLSearchParams(location.search).get('format') === 'portable') {
  localStorage.setItem(storageKey, encodeProgressStorage(decodeProgressStorage(localStorage.getItem(storageKey)), { force: true }));
}
window.__practiceReport = { storedFormat: () => localStorage.getItem(storageKey).split(':')[0] };
createRoot(document.getElementById('root')).render(<FinishedReportPage
  studentName="Alex" className="Fixture class" teacherId="fixture-teacher"
  progressScopeKey={scope} initialReportView="other-learning" readReportRouteView={() => null}
/>);
