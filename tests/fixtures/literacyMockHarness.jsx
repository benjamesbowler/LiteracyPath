import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import { LiteracyMockPage } from '../../src/components/progress/LiteracyMockPage.jsx';
import { LiteracyMockQuestion } from '../../src/components/progress/LiteracyMockQuestion.jsx';
import { TeacherLiteracyMockPanel } from '../../src/components/progress/TeacherLiteracyMockPanel.jsx';
import { loadLiteracyMockBank, LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, mockChoices } from '../../src/utils/literacyMockPlanner.js';

// A local protocol simulator, deliberately separate from production persistence.
// Browser tests drive the real components and pass only canonical server receipts.
const query = new URLSearchParams(location.search);
const bank = await loadLiteracyMockBank({ includeUnavailable: true });
const available = bank.filter(item => item.mediaReady);
const key = `literacy-mock-browser-server:${query.get('case') || 'default'}`;
const clone = value => structuredClone(value);
const timestamp = () => new Date().toISOString();
const students = [{ id: 'student-a', name: 'Alex' }, { id: 'student-b', name: 'Bailey' }];
const chosen = query.get('item') ? bank.find(item => item.id === query.get('item')) : bank.find(item => item.format === (query.get('format') || 'choice') && (query.has('includeUnavailable') || item.mediaReady));
function initialState() {
  const plan = selectLiteracyMockPlan(available, { sessionId: 'mock-session', studentId: 'student-a', itemCount: 24 });
  if (query.get('item')) plan.itemIds[0] = chosen.id;
  const first = bank.find(item => item.id === plan.itemIds[0]);
  const mediaFailures = query.has('exhausted') ? available.filter(item => item.skillId === first.skillId && item.domainId === first.domainId && item.level === first.level && !item.tutorialOnly).map(item => ({
    questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level, itemSnapshot: clone(item),
    selected: null, responseStatus: 'media_failed', evidenceType: 'unscored', isCorrect: null,
    failedMediaPaths: [item.requiredAudioPaths[0]], serverReceivedAt: timestamp(), occurredAt: timestamp()
  })) : [];
  return {
    session: { id: 'mock-session', class_id: 'class-a', status: 'active', selection_scope: 'whole_class', started_at: timestamp(), mock: {
      state: query.has('warmup') ? 'prepared' : 'running', revision: 1, item_count: 24, duration_seconds: 1200, remaining_seconds: 1200,
      deadline_at: query.has('warmup') ? null : new Date(Date.now() + 1200000).toISOString(), server_now: timestamp()
    } },
    run: query.has('warmup') ? null : { schemaVersion: 1, contentVersion: 'literacy-mock-v1', assignmentId: 'mock-session', studentId: 'student-a', revision: 1, plan, responses: [], mediaFailures, status: 'running', unsampledItemIds: plan.itemIds },
    receipts: {}, calls: [], fault: null, lastSubmission: null
  };
}
let state;
try { state = JSON.parse(localStorage.getItem(key)) || initialState(); } catch { state = initialState(); }
const persist = () => localStorage.setItem(key, JSON.stringify(state));
function normalizeClock() {
  const mock = state.session.mock;
  mock.server_now = timestamp();
  if (mock.state === 'running' && Date.parse(mock.deadline_at) <= Date.now()) {
    mock.state = 'completed'; mock.revision++; mock.end_reason = 'time_expired'; mock.ended_at = timestamp();
  }
  mock.remaining_seconds = mock.state === 'running' ? Math.max(0, Math.ceil((Date.parse(mock.deadline_at) - Date.now()) / 1000)) : mock.remaining_seconds;
  persist();
}
const learnerResult = () => { normalizeClock(); return { ok: true, mock: clone(state.session.mock), run: clone(state.run) }; };
function teacherResult() {
  normalizeClock();
  return { ok: true, session: clone(state.session), members: students.map(student => ({ student_id: student.id, connected: true, content_ok: true, status: student.id === 'student-a' ? 'active' : 'assigned', last_seen_at: timestamp(), run: student.id === 'student-a' ? clone(state.run) : null })) };
}
function correct(item, selected) {
  if (item.answerMode === 'set') return JSON.stringify([...selected].sort()) === JSON.stringify([...item.answer].sort());
  return JSON.stringify(selected) === JSON.stringify(item.answer);
}
const client = { async call(name, args) {
  state.calls.push({ name, args: clone(args) }); persist();
  if ((state.fault === 'hang-read' && name === 'student_get_literacy_mock_run') || (state.fault === 'hang-save' && name === 'student_save_literacy_mock_run') || (state.fault === 'hang-prepare' && name === 'teacher_prepare_literacy_mock_session') || (state.fault === 'hang-report' && name === 'teacher_get_literacy_mock_report')) return new Promise(() => {});
  if (state.fault === 'offline') throw new Error('Simulated disconnected network');
  if (name === 'student_get_literacy_mock_run') return { data: learnerResult() };
  if (name === 'teacher_list_literacy_mock_sessions') return { data: { ok: true, sessions: [{ ...clone(state.session), member_student_ids: students.map(s => s.id) }] } };
  if (name === 'teacher_get_literacy_mock_report') return { data: teacherResult() };
  if (state.receipts[args.p_request_id]) return { data: clone(state.receipts[args.p_request_id]) };
  if (state.fault === 'stale') { state.fault = null; persist(); return { data: { ok: false, error: 'stale_revision' } }; }
  let result;
  if (name === 'teacher_prepare_literacy_mock_session') {
    if (args.p_whole_class && args.p_student_ids.length) return { data: { ok: false, error: 'whole_class_ids_must_be_empty' } };
    state.session.mock = { ...state.session.mock, state: 'prepared', revision: 1, item_count: args.p_item_count, duration_seconds: args.p_duration_minutes * 60, remaining_seconds: args.p_duration_minutes * 60, deadline_at: null };
    state.run = null; result = teacherResult();
  } else if (name === 'teacher_control_literacy_mock_session') {
    if (args.p_expected_revision !== state.session.mock.revision) return { data: { ok: false, error: 'stale_revision' } };
    const mock = state.session.mock;
    if (args.p_action === 'start' || args.p_action === 'resume') { mock.state = 'running'; mock.deadline_at = new Date(Date.now() + mock.remaining_seconds * 1000).toISOString(); }
    if (args.p_action === 'pause') { normalizeClock(); mock.state = 'paused'; mock.deadline_at = null; }
    if (args.p_action === 'add_time') { mock.remaining_seconds += 300; if (mock.deadline_at) mock.deadline_at = new Date(Date.parse(mock.deadline_at) + 300000).toISOString(); }
    if (args.p_action === 'finish') { mock.state = 'completed'; mock.ended_at = timestamp(); }
    mock.revision++; result = teacherResult();
  } else if (name === 'student_save_literacy_mock_run') {
    if (args.p_expected_revision !== (state.run?.revision || 0)) return { data: { ok: false, error: 'stale_revision' } };
    normalizeClock();
    if (state.session.mock.state === 'completed') return { data: { ok: false, error: 'assessment_finished', mock: clone(state.session.mock) } };
    if (args.p_plan) {
      state.run = state.run || { schemaVersion: 1, contentVersion: 'literacy-mock-v1', assignmentId: state.session.id, studentId: 'student-a', revision: 0, responses: [], mediaFailures: [], status: 'ready' };
      state.run.plan = clone(args.p_plan);
    }
    if (args.p_response) {
      if (state.session.mock.state !== 'running') return { data: { ok: false, error: 'assessment_not_running', mock: clone(state.session.mock) } };
      const response = args.p_response;
      const item = bank.find(candidate => candidate.id === state.run.plan.itemIds[state.run.responses.length]);
      if (!item || item.id !== response.questionId) return { data: { ok: false, error: 'unexpected_question' } };
      const scored = response.responseStatus === 'answered';
      const canonical = { ...clone(response), itemSnapshot: clone(item), skillId: item.skillId, domainId: item.domainId, level: item.level,
        isCorrect: scored ? correct(item, response.selected) : null, evidenceType: scored ? response.supportUsed ? 'supported' : 'independent' : 'unscored', serverReceivedAt: timestamp(), occurredAt: timestamp() };
      if (response.responseStatus === 'media_failed') {
        const knownPaths = [...item.requiredAudioPaths, ...item.requiredImagePaths];
        if (!Array.isArray(response.failedMediaPaths) || !response.failedMediaPaths.length || response.failedMediaPaths.some(path => !knownPaths.includes(path))) return { data: { ok: false, error: 'invalid_failed_media' } };
        canonical.selected = null; canonical.isCorrect = null; canonical.evidenceType = 'unscored';
        canonical.failedMediaPaths = [...new Set(response.failedMediaPaths)];
        state.run.mediaFailures ||= []; state.run.mediaFailures.push(canonical);
      } else {
        if (scored && item.requiredAudioPaths.some(path => response.audioDelivery?.[path] !== 'completed')) return { data: { ok: false, error: 'audio_incomplete' } };
        state.run.responses.push(canonical);
      }
    }
    state.run.revision++;
    state.run.unsampledItemIds = state.run.plan.itemIds.slice(state.run.responses.length);
    state.run.status = state.run.unsampledItemIds.length ? 'running' : 'completed';
    result = learnerResult();
  } else throw new Error(`Unexpected fixture RPC: ${name}`);
  state.receipts[args.p_request_id] = clone(result);
  const lose = state.fault === 'receipt-lost'; state.fault = null; persist();
  if (lose) throw new Error('Simulated response lost after server commit');
  return { data: result };
} };
window.__literacyMock = {
  state: () => clone(state), planItems: () => state.run?.plan.itemIds.map(id => clone(bank.find(item => item.id === id))) || [], choiceOrder: id => clone(mockChoices(bank.find(item => item.id === id), query.get('mode') === 'format' ? 'browser-format' : state.run?.plan.seed || 'warmup:mock-session:student-a')), tutorials: () => Object.values(LITERACY_MOCK_TUTORIAL_IDS).map(id => clone(bank.find(item => item.id === id))), item: () => clone(query.get('mode') === 'format' ? chosen : bank.find(item => item.id === state.run?.plan.itemIds[state.run.responses.length])),
  setFault(fault) { state.fault = fault; persist(); },
  teacher(action) { return client.call('teacher_control_literacy_mock_session', { p_action: action, p_expected_revision: state.session.mock.revision, p_request_id: crypto.randomUUID() }); },
  expire() { state.session.mock.deadline_at = new Date(Date.now() - 1000).toISOString(); persist(); },
  async bankCoverage() { return Object.fromEntries(['choice', 'multi_select', 'order', 'match', 'select_text', 'build_word'].map(format => [format, { authored: bank.filter(item => item.format === format).length, ready: available.filter(item => item.format === format).length }])); }
};
function Harness() {
  const [submitted, setSubmitted] = useState(null);
  if (query.get('mode') === 'teacher') return <TeacherLiteracyMockPanel client={client} classId="class-a" className="Class A" students={students}/>;
  if (query.get('mode') === 'format') return <main className="literacy-mock"><div className="literacy-mock-canvas"><header className="literacy-mock-header"><h1>Reading &amp; language</h1><span>Literacy Guide practice</span></header>{submitted ? <p role="status">Answer received</p> : <LiteracyMockQuestion item={chosen} seed="browser-format" index={0} studentName="Alex" onSubmit={response => { state.lastSubmission = response; persist(); setSubmitted(response); }}/>}</div></main>;
  return <LiteracyMockPage client={client} token="local-browser-fixture" studentId="student-a" studentName="Alex" focusSession={state.session}/>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
