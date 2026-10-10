import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import { LiteracyMockPage } from '../../src/components/progress/LiteracyMockPage.jsx';
import { LiteracyMockQuestion } from '../../src/components/progress/LiteracyMockQuestion.jsx';
import { TeacherLiteracyMockPanel } from '../../src/components/progress/TeacherLiteracyMockPanel.jsx';
import { loadLiteracyMockBank, LITERACY_MOCK_VERSION, LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck, mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

// A local protocol simulator, deliberately separate from production persistence.
// Browser tests drive the real components and pass only canonical server receipts.
const query = new URLSearchParams(location.search);
const contentVersion = query.get("version") || LITERACY_MOCK_VERSION;
const v3 = contentVersion === 'literacy-mock-v3';
const capabilities = { presentationReceipts: v3, supportResolution: v3, freshChecks: v3, windowModes: v3 };
const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion });
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
    session: { id: 'mock-session', content_version: contentVersion, class_id: 'class-a', status: 'active', selection_scope: 'whole_class', started_at: timestamp(), mock: {
      content_version: contentVersion, capabilities, plan_kind: 'mixed', window_mode: query.has('timed') || !v3 ? 'timed_sample' : 'pause_at_window_end', state: query.has('warmup') ? 'prepared' : 'running', revision: 1, item_count: 24, duration_seconds: 1200, remaining_seconds: 1200,
      deadline_at: query.has('warmup') ? null : new Date(Date.now() + 1200000).toISOString(), server_now: timestamp()
    } },
    run: query.has('warmup') ? null : { schemaVersion: v3 ? 2 : 1, contentVersion, assignmentId: 'mock-session', studentId: 'student-a', revision: 1, eventRevision: 0, presentationTracking: v3, presentations: [], helpRequests: [], plan, responses: [], mediaFailures, status: 'running', unsampledItemIds: plan.itemIds },
    receipts: {}, requestArgs: {}, archives: [], calls: [], fault: query.get('eventFault'), lastSubmission: null
  };
}
let state;
try { state = JSON.parse(localStorage.getItem(key)) || initialState(); } catch { state = initialState(); }
const persist = () => localStorage.setItem(key, JSON.stringify(state));
function normalizeClock() {
  const mock = state.session.mock;
  mock.server_now = timestamp();
  if (mock.state === 'running' && Date.parse(mock.deadline_at) <= Date.now()) {
    mock.revision++;
    if (mock.window_mode === 'pause_at_window_end') { mock.state = 'paused'; mock.pause_reason = 'window_elapsed'; mock.remaining_seconds = mock.duration_seconds; mock.deadline_at = null; }
    else { mock.state = 'completed'; mock.end_reason = 'time_finished'; mock.ended_at = timestamp(); if (state.run) state.run.status = 'completed'; }
  }
  mock.remaining_seconds = mock.state === 'running' ? Math.max(0, Math.ceil((Date.parse(mock.deadline_at) - Date.now()) / 1000)) : mock.remaining_seconds;
  persist();
}
function effectiveRun() {
  if (!state.run) return null;
  const run = clone(state.run);
  if (v3) run.responses = run.responses.map(response => {
    const help = run.helpRequests?.find(value => value.questionId === response.questionId);
    const answerHelp = response.supportUsed === true || help?.assistanceType === 'answer';
    return { ...response, helpRequested: help?.helpRequested === true, supportPending: help?.pending === true,
      assistanceType: answerHelp ? 'answer' : help?.assistanceType || 'none', accessAssistance: help?.assistanceType === 'access', answerAssistance: answerHelp,
      supportUsed: answerHelp, evidenceType: response.responseStatus !== 'answered' ? 'unscored' : answerHelp ? 'supported' : help?.pending ? 'unscored' : 'independent' };
  });
  return run;
}
const exposureValues = () => [...(state.archives || []).flatMap(value => [...(value.run?.presentations || []), ...(value.run?.responses || []), ...(value.run?.mediaFailures || [])]),
  ...(state.run?.presentations || []), ...(state.run?.responses || []), ...(state.run?.mediaFailures || [])];
const learnerResult = () => { normalizeClock(); return { ok: true, mock: clone(state.session.mock), exposures: exposureValues(), run: effectiveRun() }; };
const assignedStudents = () => state.session.mock.plan_kind === 'fresh_check' ? students.filter(student => student.id === 'student-a') : students;
function teacherResult() {
  normalizeClock();
  return { ok: true, session: clone(state.session), members: assignedStudents().map(student => ({ student_id: student.id, connected: true, content_ok: true, status: student.id === 'student-a' ? 'active' : 'assigned', last_seen_at: timestamp(), run: student.id === 'student-a' ? effectiveRun() : null })) };
}
function correct(item, selected) {
  if (item.answerMode === 'set') return JSON.stringify([...selected].sort()) === JSON.stringify([...item.answer].sort());
  return JSON.stringify(selected) === JSON.stringify(item.answer);
}
function mediaBlocked(item) {
  return (state.run?.mediaFailures || []).some(failure => failure.questionId === item.id
    || (failure.failedMediaPaths || []).some(path => [...item.requiredAudioPaths, ...item.requiredImagePaths]
      .some(required => required.split('#')[0] === path.split('#')[0])));
}
const client = { async call(name, args) {
  state.calls.push({ name, args: clone(args) }); persist();
  if ((state.fault === 'hang-read' && name === 'student_get_literacy_mock_run') || (state.fault === 'hang-save' && name === 'student_save_literacy_mock_run') || (state.fault === 'hang-event' && name === 'student_record_literacy_mock_event') || (state.fault === 'hang-prepare' && name.startsWith('teacher_prepare_literacy_mock_session')) || (state.fault === 'hang-report' && name === 'teacher_get_literacy_mock_report')) return new Promise(() => {});
  if (state.fault === 'offline') throw new Error('Simulated disconnected network');
  if (name === 'student_get_literacy_mock_run') return { data: learnerResult() };
  if (name === 'teacher_list_literacy_mock_sessions') return { data: { ok: true, sessions: [{ ...clone(state.session), member_student_ids: assignedStudents().map(s => s.id) }] } };
  if (name === 'teacher_get_literacy_mock_report') return { data: teacherResult() };
  if (state.receipts[args.p_request_id]) {
    if (JSON.stringify(state.requestArgs[args.p_request_id]) !== JSON.stringify({ name, args })) return { data: { ok: false, error: 'request_conflict' } };
    return { data: name.startsWith('student_') || name === 'teacher_resolve_literacy_mock_support' ? learnerResult() : teacherResult() };
  }
  if (state.fault === 'stale') { state.fault = null; persist(); return { data: { ok: false, error: 'stale_revision' } }; }
  let result;
  if (name === 'teacher_prepare_literacy_mock_session' || name === 'teacher_prepare_literacy_mock_session_v3') {
    if (args.p_whole_class && args.p_student_ids.length) return { data: { ok: false, error: 'whole_class_ids_must_be_empty' } };
    state.session.mock = { ...state.session.mock, plan_kind: 'mixed', window_mode: args.p_window_mode || 'timed_sample', state: 'prepared', revision: 1, item_count: args.p_item_count, duration_seconds: args.p_duration_minutes * 60, remaining_seconds: args.p_duration_minutes * 60, deadline_at: null };
    state.run = null; result = teacherResult();
  } else if (name === 'teacher_control_literacy_mock_session') {
    if (args.p_expected_revision !== state.session.mock.revision) return { data: { ok: false, error: 'stale_revision' } };
    const mock = state.session.mock;
    if (args.p_action === 'start' || args.p_action === 'resume') { mock.state = 'running'; mock.pause_reason = null; mock.deadline_at = new Date(Date.now() + mock.remaining_seconds * 1000).toISOString(); }
    if (args.p_action === 'pause') { normalizeClock(); mock.state = 'paused'; mock.deadline_at = null; }
    if (args.p_action === 'add_time') { mock.remaining_seconds += 300; if (mock.deadline_at) mock.deadline_at = new Date(Date.parse(mock.deadline_at) + 300000).toISOString(); }
    if (args.p_action === 'finish') { mock.state = 'completed'; mock.end_reason = 'teacher_finished'; mock.ended_at = timestamp(); if (state.run) state.run.status = 'completed'; }
    mock.revision++; result = teacherResult();
  } else if (name === 'student_record_literacy_mock_event') {
    normalizeClock();
    if (!v3) return { data: { ok: false, error: 'unsupported_event_version' } };
    if (!state.run) return { data: { ok: false, error: 'plan_required' } };
    const item = bank.find(value => value.id === state.run.plan.itemIds[state.run.responses.length]);
    const alreadyPresented = state.run.presentations.some(value => value.questionId === args.p_question_id);
    if (args.p_event === 'presented' && alreadyPresented) return { data: learnerResult() };
    if (state.session.mock.state !== 'running' || state.run.status === 'completed') return { data: { ok: false, error: 'assessment_not_running' } };
    if (!item || item.id !== args.p_question_id) return { data: { ok: false, error: 'question_not_current' } };
    if (args.p_event === 'presented') {
      const exposure = getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: exposureValues() }));
      state.run.presentations.push({ ...exposure, questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
        itemSnapshot: clone(item), presentationStatus: 'presented', serverReceivedAt: timestamp() });
    } else {
      if (!alreadyPresented) return { data: { ok: false, error: 'presentation_required' } };
      let help = state.run.helpRequests.find(value => value.questionId === item.id);
      if (args.p_event === 'help_cancelled' && !help?.pending) return { data: { ok: false, error: 'help_not_pending' } };
      if (!help) { help = { questionId: item.id, itemSnapshot: clone(item), helpRequested: false, assistanceType: 'none' }; state.run.helpRequests.push(help); }
      if (args.p_event === 'help_requested') Object.assign(help, { helpRequested: true, pending: true, status: 'pending', requestedAt: timestamp() });
      else if (args.p_event === 'help_cancelled') Object.assign(help, { pending: false, status: 'cancelled', helpCancelled: true });
      else return { data: { ok: false, error: 'invalid_event' } };
    }
    state.run.eventRevision++; result = learnerResult();
  } else if (name === 'teacher_resolve_literacy_mock_support') {
    if (!state.run?.presentations.some(value => value.questionId === args.p_question_id)) return { data: { ok: false, error: 'presentation_required' } };
    if (!['none', 'access', 'answer'].includes(args.p_assistance)) return { data: { ok: false, error: 'invalid_support' } };
    let help = state.run.helpRequests.find(value => value.questionId === args.p_question_id);
    if (!help) { help = { questionId: args.p_question_id, itemSnapshot: clone(state.run.presentations.find(value => value.questionId === args.p_question_id).itemSnapshot), helpRequested: false, assistanceType: 'none' }; state.run.helpRequests.push(help); }
    help.assistanceType = help.assistanceType === 'answer' || args.p_assistance === 'answer' ? 'answer'
      : help.assistanceType === 'access' || args.p_assistance === 'access' ? 'access' : 'none';
    Object.assign(help, { pending: false, status: 'resolved', resolvedAt: timestamp() });
    state.run.eventRevision++; result = learnerResult();
  } else if (name === 'teacher_prepare_literacy_mock_fresh_check') {
    if (state.session.mock.state !== 'completed') return { data: { ok: false, error: 'student_busy' } };
    const reference = state.run?.responses.find(value => value.questionId === args.p_question_id)
      || state.run?.presentations.find(value => value.questionId === args.p_question_id);
    if (!reference) return { data: { ok: false, error: 'source_question_not_observed' } };
    const focus = literacyMockFocus(reference);
    const check = selectLiteracyMockFreshCheck(available, { sessionId: 'fresh-session', studentId: 'student-a', reference, itemCount: 1, exposures: exposureValues() });
    if (!check.availableCount) return { data: { ok: false, error: 'fresh_items_unavailable' } };
    const count = Math.min(6, check.availableCount);
    const full = selectLiteracyMockFreshCheck(available, { sessionId: 'fresh-session', studentId: 'student-a', reference, itemCount: count, exposures: exposureValues() });
    state.archives.push({ session: clone(state.session), run: clone(state.run) });
    state.session = { ...state.session, id: 'fresh-session', mock: { ...state.session.mock, focus, candidate_item_ids: full.plan.itemIds,
      plan_kind: 'fresh_check', state: 'prepared', item_count: count, revision: 0, window_mode: 'pause_at_window_end',
      duration_seconds: 600, remaining_seconds: 600, deadline_at: null, ended_at: null, end_reason: null } };
    state.run = null; result = teacherResult();
  } else if (name === 'student_save_literacy_mock_run') {
    if (args.p_expected_revision !== (state.run?.revision || 0)) return { data: { ok: false, error: 'stale_revision' } };
    normalizeClock();
    if (state.session.mock.state === 'completed') return { data: { ok: false, error: 'assessment_finished', mock: clone(state.session.mock) } };
    if (args.p_plan) {
      const ids = args.p_plan.itemIds;
      if (!Array.isArray(ids) || ids.length !== state.session.mock.item_count || new Set(ids).size !== ids.length || ids.some(id => !bank.some(item => item.id === id))) return { data: { ok: false, error: 'invalid_plan' } };
      if (state.run?.plan) for (const [index, id] of ids.entries()) {
        const old = bank.find(item => item.id === state.run.plan.itemIds[index]);
        const next = bank.find(item => item.id === id);
        if (index < state.run.responses.length ? id !== old.id : old.skillId !== next.skillId || old.domainId !== next.domainId) return { data: { ok: false, error: 'plan_conflict' } };
        if (v3 && !sameLiteracyMockTask(old, next)) return { data: { ok: false, error: 'plan_condition_conflict' } };
        if (index < state.run.responses.length) continue;
        if (mediaBlocked(next)) return { data: { ok: false, error: 'blocked_media_item' } };
        if (id === old.id) continue;
        if (v3 && !mediaBlocked(old) && state.run.presentations.some(value => value.questionId === old.id)) return { data: { ok: false, error: 'presented_item_frozen' } };
        const previous = [...effectiveRun().responses].reverse().find(response => response.skillId === next.skillId
          && response.responseStatus === 'answered' && response.evidenceType === 'independent' && typeof response.isCorrect === 'boolean'
          && !response.supportUsed && !response.supportPending && response.knownFamiliar !== true && (!v3 || sameLiteracyMockTask(response, next)));
        const expectedLevel = state.session.mock.plan_kind === 'fresh_check' || mediaBlocked(old) ? old.level
          : previous ? previous.isCorrect ? 2 : 1 : v3 ? 1 : old.level;
        if (next.level !== expectedLevel) return { data: { ok: false, error: 'invalid_adaptation' } };
      }
      if (state.session.mock.plan_kind === 'fresh_check' && ids.some(id => !state.session.mock.candidate_item_ids.includes(id))) return { data: { ok: false, error: 'invalid_focus_plan' } };
      state.run = state.run || { schemaVersion: v3 ? 2 : 1, contentVersion, assignmentId: state.session.id, studentId: 'student-a', revision: 0, eventRevision: 0, presentationTracking: v3, presentations: [], helpRequests: [], responses: [], mediaFailures: [], status: 'ready' };
      state.run.plan = clone(args.p_plan);
    }
    if (args.p_response) {
      if (state.session.mock.state !== 'running') return { data: { ok: false, error: 'assessment_not_running', mock: clone(state.session.mock) } };
      const response = args.p_response;
      const item = bank.find(candidate => candidate.id === state.run.plan.itemIds[state.run.responses.length]);
      if (!item || item.id !== response.questionId) return { data: { ok: false, error: 'unexpected_question' } };
      const presentation = state.run.presentations.find(value => value.questionId === item.id);
      if (v3 && !presentation) return { data: { ok: false, error: 'presentation_required' } };
      const scored = response.responseStatus === 'answered';
      const canonical = { ...clone(response), itemSnapshot: clone(item), skillId: item.skillId, domainId: item.domainId, level: item.level,
        isCorrect: scored ? correct(item, response.selected) : null, knownFamiliar: presentation?.knownFamiliar === true || response.knownFamiliar === true ? true : null,
        evidenceType: scored ? response.supportUsed ? 'supported' : 'independent' : 'unscored', serverReceivedAt: timestamp(), occurredAt: timestamp() };
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
    state.run.status = state.run.unsampledItemIds.length ? state.session.mock.state === 'prepared' ? 'ready' : 'running' : 'completed';
    result = learnerResult();
  } else throw new Error(`Unexpected fixture RPC: ${name}`);
  // Retry receipts return the current canonical run above. Keep only the
  // dedupe marker here; snapshotting every run would invent a browser-storage
  // quota limit for this stand-in server after a dozen otherwise valid answers.
  state.receipts[args.p_request_id] = true;
  state.requestArgs ||= {}; state.requestArgs[args.p_request_id] = clone({ name, args });
  const lose = state.fault === 'receipt-lost'; state.fault = null; persist();
  if (lose) throw new Error('Simulated response lost after server commit');
  return { data: result };
} };
window.__literacyMock = {
  state: () => ({ ...clone(state), run: effectiveRun() }), rawResponses: () => clone(state.run?.responses || []), planItems: () => state.run?.plan.itemIds.map(id => clone(bank.find(item => item.id === id))) || [], choiceOrder: id => clone(mockChoices(bank.find(item => item.id === id), query.get('mode') === 'format' ? 'browser-format' : state.run?.plan.seed || `warmup:${state.session.id}:student-a`)), tutorials: () => Object.values(LITERACY_MOCK_TUTORIAL_IDS).map(id => clone(bank.find(item => item.id === id))), item: () => clone(query.get('mode') === 'format' ? chosen : bank.find(item => item.id === state.run?.plan.itemIds[state.run.responses.length])),
  setFault(fault) { state.fault = fault; persist(); },
  teacher(action) { return client.call('teacher_control_literacy_mock_session', { p_action: action, p_expected_revision: state.session.mock.revision, p_request_id: crypto.randomUUID() }); },
  resolve(questionId, assistance) { return client.call('teacher_resolve_literacy_mock_support', { p_session_id: state.session.id, p_student_id: 'student-a', p_question_id: questionId, p_assistance: assistance, p_request_id: crypto.randomUUID() }); },
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
