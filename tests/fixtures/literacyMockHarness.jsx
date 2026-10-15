import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import { LiteracyMockPage } from '../../src/components/progress/LiteracyMockPage.jsx';
import { LiteracyMockQuestion } from '../../src/components/progress/LiteracyMockQuestion.jsx';
import { useStudentFocusSession } from '../../src/hooks/useStudentFocusSession.js';
import { TeacherLiteracyMockPanel } from '../../src/components/progress/TeacherLiteracyMockPanel.jsx';
import { loadLiteracyMockBank, LITERACY_MOCK_VERSION, LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck, mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { literacyItemQualityIssue } from '../../src/policy/literacyItemEligibility.js';
import { validateClassRpcData } from '../../src/data/boundaries/classes.js';

// A local protocol simulator, deliberately separate from production persistence.
// Browser tests drive the real components and pass only canonical server receipts.
const query = new URLSearchParams(location.search);
// Historical interaction cases default to their published v4 protocol. New area cases request v5 explicitly.
const contentVersion = query.get("version") || 'literacy-mock-v4';
const areaAdaptive=contentVersion===LITERACY_MOCK_VERSION;
const v3 = ['literacy-mock-v3', 'literacy-mock-v4','literacy-mock-v5','literacy-mock-v6','literacy-mock-v7'].includes(contentVersion);
const capabilities = { presentationReceipts: v3, supportResolution: v3, freshChecks: v3, entryChecks: v3, windowModes: v3,
  offlineDelivery:query.has('device'), contentQuarantineRepair: !query.has('legacyContentBackend') };
const itemCount = areaAdaptive || query.get('count') === '43' ? 43 : 24;
const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion });
const available = bank.filter(item => item.mediaReady);
const key = `literacy-mock-browser-server:${query.get('case') || 'default'}`;
let releaseHistoryRead;
const heldHistoryRead = query.has('holdHistory') ? new Promise(resolve => { releaseHistoryRead = resolve; }) : null;
const clone = value => structuredClone(value);
const timestamp = () => new Date().toISOString();
const students = [{ id: 'student-a', name: 'Alex' }, { id: 'student-b', name: 'Bailey' }];
const chosen = query.get('item') ? bank.find(item => item.id === query.get('item')) : bank.find(item => item.format === (query.get('format') || 'choice') && (query.has('includeUnavailable') || item.mediaReady));
function initialState() {
  const durationSeconds = query.get('windowMinutes') === '10' ? 600 : 1200;
  let mediaItemIds=[];
  const plan = selectLiteracyMockPlan(available, { sessionId: 'mock-session', studentId: 'student-a', itemCount,onOfflineItems:ids=>{mediaItemIds=ids;} });
  if (query.get('item')) plan.itemIds[0] = chosen.id;
  if(query.has('thinPool'))mediaItemIds=[...plan.itemIds];
  if (query.has('device')) { localStorage.setItem('lp-mock-pool:student-a:mock-session',JSON.stringify(mediaItemIds)); }
  const first = bank.find(item => item.id === plan.itemIds[0]);
  const prior = query.has('priorTaskAnswer') ? available.find(item => item.level === 1 && sameLiteracyMockTask(item, first)
    && !literacyItemQualityIssue(item) && !plan.itemIds.includes(item.id)) : null;
  if (prior) { plan.itemIds[0] = prior.id; plan.itemIds[1] = first.id; }
  const newRun = query.has('warmup') || query.has('serverExposed');
  const freshExposure = query.get('serverExposed') === 'fresh';
  const focused = freshExposure ? selectLiteracyMockFreshCheck(available, {
    sessionId: 'mock-session', studentId: 'student-a', itemCount: 1, focus: literacyMockFocus(first),
  }) : null;
  const serverExposures = query.has('serverExposed') ? [clone(bank.find(item => item.id === (focused?.plan.itemIds[0] || first.id)))] : [];
  const mediaFailures = query.has('exhausted') ? available.filter(item => item.skillId === first.skillId && item.domainId === first.domainId && item.level === first.level && !item.tutorialOnly).map(item => ({
    questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level, itemSnapshot: clone(item),
    selected: null, responseStatus: 'media_failed', evidenceType: 'unscored', isCorrect: null,
    failedMediaPaths: [item.requiredAudioPaths[0]], serverReceivedAt: timestamp(), occurredAt: timestamp()
  })) : [];
  const presentations = [...(prior ? [prior] : []), ...(query.has('presented') ? [first] : [])].map(item => ({
    questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
    itemSnapshot: clone(item), knownFamiliar: null, presentationStatus: 'presented', serverReceivedAt: timestamp() }));
  const responses = prior ? [{ questionId: prior.id, skillId: prior.skillId, domainId: prior.domainId, level: prior.level,
    itemSnapshot: clone(prior), selected: prior.answer, isCorrect: true, responseStatus: 'answered', evidenceType: 'independent',
    supportUsed: false, knownFamiliar: null, audioDelivery: Object.fromEntries(prior.requiredAudioPaths.map(path => [path, 'completed'])),
    serverReceivedAt: timestamp(), occurredAt: timestamp() }] : [];
  return {
    session: { id: 'mock-session', content_version: contentVersion, class_id: 'class-a', teacher_id:`teacher-${query.get('case') || 'default'}`, target:'progress_check', resolved_config:{plan_kind:'mock',bank_version:contentVersion,track_id:'all'}, content_ok:true, status: query.has('warmup') ? 'prepared' : 'active', expires_at:new Date(Date.now()+12*3600000).toISOString(), selection_scope: 'whole_class', started_at: timestamp(), mock: {
      content_version: contentVersion, capabilities, plan_kind: 'mixed', delivery_mode:'collect', window_mode:query.has('device') ? 'untimed' : query.has('timed') || !v3 ? 'timed_sample' : 'pause_at_window_end', state: query.has('warmup') ? 'prepared' : 'running', revision: 1, item_count: itemCount, duration_seconds: durationSeconds, remaining_seconds: durationSeconds, time_extension_count: 0,
      deadline_at: query.has('warmup') || query.has('device') ? null : new Date(Date.now() + durationSeconds * 1000).toISOString(), server_now: timestamp(),
      ...(freshExposure ? { plan_kind: 'fresh_check', item_count: 1, focus: literacyMockFocus(first),
        candidate_item_ids: available.filter(item => !item.tutorialOnly && sameLiteracyMockTask(item, first, { includeLevel: true })).map(item => item.id) } : {})
    } },
    run: newRun ? null : { schemaVersion: v3 ? 2 : 1, contentVersion, assignmentId: 'mock-session', studentId: 'student-a', revision: 1 + responses.length, eventRevision: presentations.length, presentationTracking: v3, presentations, helpRequests: [], plan, responses, mediaFailures, status: 'running', unsampledItemIds: plan.itemIds.slice(responses.length) },
    serverExposures, receipts: {}, requestArgs: {}, archives: [], calls: [], fault: query.get('eventFault'), lastSubmission: null
  };
}
let state;
try { state = JSON.parse(localStorage.getItem(key)) || initialState(); } catch { state = initialState(); }
const persist = () => localStorage.setItem(key, JSON.stringify(state));
function normalizeClock(record = state) {
  const mock = record.session.mock;
  mock.server_now = timestamp();
  if (mock.state === 'running' && Date.parse(mock.deadline_at) <= Date.now()) {
    mock.revision++;
    if (mock.window_mode === 'pause_at_window_end') { mock.state = 'paused'; mock.pause_reason = 'window_elapsed'; mock.remaining_seconds = mock.duration_seconds; mock.deadline_at = null; }
    else { mock.state = 'completed'; mock.end_reason = 'time_finished'; mock.ended_at = timestamp(); record.session.status = 'ended'; if (record.run) record.run.status = 'completed'; }
  }
  mock.remaining_seconds = mock.window_mode==='untimed' ? mock.duration_seconds : mock.state === 'running' ? Math.max(0, Math.ceil((Date.parse(mock.deadline_at) - Date.now()) / 1000)) : mock.remaining_seconds;
  persist();
}
function effectiveRun(record = state) {
  if (!record.run) return null;
  const run = clone(record.run);
  // Match the JSONB object order returned by the real database, including an
  // unchanged plan receipt that does not advance the run revision.
  run.plan = { seed: run.plan.seed, itemIds: run.plan.itemIds };
  run.windowMode = record.session.mock.window_mode;
  run.durationSeconds = record.session.mock.duration_seconds;
  run.timeExtensionCount = record.session.mock.time_extension_count ?? 0;
  if (v3) run.responses = run.responses.map(response => {
    const help = run.helpRequests?.find(value => value.questionId === response.questionId);
    const answerHelp = response.supportUsed === true || help?.assistanceType === 'answer';
    return { ...response, helpRequested: help?.helpRequested === true, supportPending: help?.pending === true,
      assistanceType: answerHelp ? 'answer' : help?.assistanceType || 'none', accessAssistance: help?.assistanceType === 'access', answerAssistance: answerHelp,
      supportUsed: answerHelp, evidenceType: response.responseStatus !== 'answered' ? 'unscored' : answerHelp ? 'supported' : help?.pending ? 'unscored' : 'independent' };
  });
  return run;
}
const exposureValues = () => [...(state.serverExposures || []), ...(state.archives || []).flatMap(value => [...(value.run?.presentations || []), ...(value.run?.responses || []), ...(value.run?.mediaFailures || [])]),
  ...(state.run?.presentations || []), ...(state.run?.responses || []), ...(state.run?.mediaFailures || [])];
const sessionRecords = () => [state, ...(state.archives || [])];
const sessionRecord = id => sessionRecords().find(value => value.session.id === id) || state;
const learnerResult = (record = state) => { normalizeClock(record); return { ok: true, mock: clone(record.session.mock), exposures: exposureValues(), run: effectiveRun(record) }; };
const assignedStudents = (record = state) => record.memberIds ? students.filter(student => record.memberIds.includes(student.id)) : record.session.mock.plan_kind === 'fresh_check' ? students.filter(student => student.id === 'student-a') : students;
function teacherResult(record = state) {
  normalizeClock(record);
  return { ok: true, session: clone(record.session), members: assignedStudents(record).map(student => {
    const priorRuns = sessionRecords().filter(value => value.session.id !== record.session.id && value.session.mock.state === 'completed'
      && value.session.content_version === record.session.content_version && value.run?.responses?.length
      && Date.parse(value.session.mock.ended_at || value.session.started_at) <= Date.parse(record.session.mock.started_at || record.session.started_at))
      .map(value => ({ ...effectiveRun(value), assignmentId: value.session.id, contentVersion: value.session.content_version }));
    return { student_id: student.id, active: record.session.status === 'active', connected: record.session.status === 'active', content_ok: true,
      status: student.id === 'student-a' ? 'active' : 'assigned', last_seen_at: timestamp(), run: student.id === 'student-a' ? effectiveRun(record) : null,
      priorRuns: student.id === 'student-a' ? priorRuns.slice(0, 20) : [], historyCoverage: { limit: 20, windowDays: 90, truncated: priorRuns.length > 20 } };
  }) };
}
function correct(item, selected) {
  if (item.answerMode === 'set') return JSON.stringify([...selected].sort()) === JSON.stringify([...item.answer].sort());
  return JSON.stringify(selected) === JSON.stringify(item.answer);
}
function itemUnavailable(item) {
  return (capabilities.contentQuarantineRepair && Boolean(literacyItemQualityIssue(item)))
    || (state.run?.mediaFailures || []).some(failure => failure.questionId === item.id
    || (failure.failedMediaPaths || []).some(path => [...item.requiredAudioPaths, ...item.requiredImagePaths]
      .some(required => required.split('#')[0] === path.split('#')[0])));
}
// Canonical snapshots are rehydrated from the immutable fixture bank. Repeating
// every full snapshot in every batch receipt would invent a 5-MiB browser-server
// quota that the real database does not have.
function batchReceipt(value,compact=false){
 const result=clone(value);
 const rows=[...(result.exposures || []),...['responses','presentations','mediaFailures','helpRequests'].flatMap(key=>result.run?.[key] || [])];
 for(const row of rows){
  const id=row.questionId || row.id || row.itemSnapshot?.id;
  const item=bank.find(item=>item.id===id);if(!item)continue;
  if(compact && row.itemSnapshot){row.__mockSnapshot=row.itemSnapshot.itemSnapshot ? 'full' : 'snapshot';delete row.itemSnapshot;}
  else if(!compact && row.__mockSnapshot){row.itemSnapshot=clone(row.__mockSnapshot==='full' ? item : item.itemSnapshot);delete row.__mockSnapshot;}
 }
 return result;
}
const client = { async call(name, args) {
  state.calls.push({ name, args: clone(args) }); persist();
  const target = sessionRecord(args.p_session_id || args.p_source_session_id);
  if ((state.fault === 'hang-read' && name === 'student_get_literacy_mock_run') || (state.fault === 'hang-save' && name === 'student_save_literacy_mock_run') || (state.fault === 'hang-event' && name === 'student_record_literacy_mock_event') || (state.fault === 'hang-prepare' && name.startsWith('teacher_prepare_literacy_mock_session')) || (state.fault === 'hang-report' && name === 'teacher_get_literacy_mock_report')) return new Promise(() => {});
  if (state.fault === 'offline') throw new Error('Simulated disconnected network');
  if (name === 'student_sync_literacy_mock_batch') {
    state.batches ||= {}; const old=state.batches[args.p_batch_id];
    if (old) return {data:{...batchReceipt(old),duplicate:true}};
    if (!target.run) return {data:{ok:false,error:'run_not_registered'}};
    if (!args.p_lease_id) {
      target.run.offlineLeaseId ||= crypto.randomUUID(); target.run.offlineLeaseExpiresAt=target.session.expires_at;
    } else if (args.p_lease_id!==target.run.offlineLeaseId) return {data:{ok:false,error:'invalid_device_lease'}};
    const before=clone(state), paused=target.session.mock.state==='paused', lost=state.fault==='receipt-lost';
    state.fault=null; if (paused) target.session.mock.state='running';
    const acknowledged=[];
    for (const request of args.p_requests) {
      const response=await client.call(request.type==='event' ? 'student_record_literacy_mock_event' : 'student_save_literacy_mock_run',request.type==='event' ?
        {p_token:args.p_token,p_session_id:args.p_session_id,p_question_id:request.questionId,p_event:request.event,p_request_id:request.requestId} :
        {p_token:args.p_token,p_session_id:args.p_session_id,p_expected_revision:request.expectedRevision,p_plan:request.plan || null,p_response:request.response || null,p_request_id:request.requestId});
      if (response.data.ok!==true) {state=before;persist();return response;} acknowledged.push(request.requestId);
    }
    if (paused) target.session.mock.state='paused';
    if (args.p_collection_id) {target.run.collectionAckId=args.p_collection_id;target.run.collectionAckAt=timestamp();target.session.mock.collection_pending_count=0;target.session.mock.state='completed';target.session.status='ended';target.run.status='completed';}
    const result={...learnerResult(target),acknowledged,batchId:args.p_batch_id};state.batches[args.p_batch_id]=batchReceipt(result,true);persist();
    if (lost) throw new Error('Receipt lost after batch commit');return {data:result};
  }
  if (name === 'student_get_focus_session') return {data:{ok:true,session:state.session.status==='active' ? clone(state.session) : null}};
  if (name === 'student_get_literacy_mock_run') return { data: learnerResult(target) };
  if (name === 'teacher_list_literacy_mock_history_page') {
    if (heldHistoryRead) await heldHistoryRead;
    const sessions = sessionRecords().map(record => {
      const snapshot = clone(record.session);
      delete snapshot.mock.server_now;
      snapshot.mock.snapshot_only = true;
      return { ...snapshot, member_student_ids: assignedStudents(record).map(s => s.id) };
    }).filter(session => !args.p_student_id || session.member_student_ids.includes(args.p_student_id));
    return { data: validateClassRpcData(name, { ok: true, sessions, hasMore: false, nextCursor: null }) };
  }
  if (name === 'teacher_list_literacy_mock_sessions') return { data: { ok: true, sessions: sessionRecords().map(record => ({ ...clone(record.session), member_student_ids: assignedStudents(record).map(s => s.id) })) } };
  if (name === 'teacher_get_literacy_mock_report') return { data: teacherResult(target) };
  if (name === 'teacher_get_literacy_mock_fresh_capacity') {
    if (state.fault === 'capacity-unavailable') return { data: { ok: false, error: 'content_unavailable' } };
    const remainingCount = Number(query.get('capacityCount') || 4);
    return { data: { ok: true, capacity: {
      contentVersion, sourceSessionId: args.p_source_session_id, studentId: args.p_student_id,
      questionId: args.p_question_id || null, skillId: args.p_skill_id || null, focus: {},
      remainingCount, countKind: query.get('capacityKind') || 'exact', checkItemCount: Math.min(6, remainingCount), checkedAt: timestamp(), taskCeiling: null,
    } } };
  }
  if (state.receipts[args.p_request_id]) {
    if (JSON.stringify(state.requestArgs[args.p_request_id]) !== JSON.stringify({ name, args })) return { data: { ok: false, error: 'request_conflict' } };
    return { data: name.startsWith('student_') || name === 'teacher_resolve_literacy_mock_support' ? learnerResult(target) : teacherResult(sessionRecord(state.receipts[args.p_request_id])) };
  }
  if (state.fault === 'stale') { state.fault = null; persist(); return { data: { ok: false, error: 'stale_revision' } }; }
  let result;
  if (name === 'teacher_prepare_literacy_mock_session' || name === 'teacher_prepare_literacy_mock_session_v3' || name === 'teacher_prepare_literacy_mock_session_v4' || name === 'teacher_prepare_literacy_mock_session_v5' || name === 'teacher_prepare_literacy_mock_session_v6' || name === 'teacher_prepare_literacy_mock_session_v7') {
    if (args.p_whole_class && args.p_student_ids.length) return { data: { ok: false, error: 'whole_class_ids_must_be_empty' } };
    state.archives.push({ session: clone(state.session), run: clone(state.run), memberIds: state.memberIds });
    state.session = { ...clone(target.session), id: `prepared-session-${state.archives.length}`, status: 'prepared', started_at: timestamp(), mock: { ...target.session.mock, plan_kind: 'mixed', window_mode: args.p_window_mode || 'timed_sample', state: 'prepared', revision: 1, item_count: args.p_item_count, duration_seconds: args.p_duration_minutes * 60, remaining_seconds: args.p_duration_minutes * 60, time_extension_count: 0, deadline_at: null } };
    state.memberIds = args.p_whole_class ? students.map(student => student.id) : args.p_student_ids;
    state.run = null; result = teacherResult();
  } else if (name === 'teacher_control_literacy_mock_session') {
    if (args.p_expected_revision !== target.session.mock.revision) return { data: { ok: false, error: 'stale_revision' } };
    const mock = target.session.mock;
    if (args.p_action === 'start' && sessionRecords().some(record => record.session.id !== target.session.id && record.session.status === 'active'))
      return { data: { ok: false, error: 'active_assignment_conflict' } };
    if (args.p_action === 'start') { target.session.status = 'active'; mock.started_at = timestamp(); }
    if (args.p_action === 'start' || args.p_action === 'resume') { mock.state = 'running'; mock.pause_reason = null; mock.deadline_at = mock.window_mode==='untimed' ? null : new Date(Date.now() + mock.remaining_seconds * 1000).toISOString(); }
    if (args.p_action === 'pause') { normalizeClock(target); mock.state = 'paused'; mock.deadline_at = null; }
    if (args.p_action === 'add_time') { mock.remaining_seconds += 300; mock.time_extension_count = (mock.time_extension_count || 0) + 1; if (mock.deadline_at) mock.deadline_at = new Date(Date.parse(mock.deadline_at) + 300000).toISOString(); }
    if (args.p_action==='live_on' || args.p_action==='live_off') mock.delivery_mode=args.p_action==='live_on' ? 'live' : 'collect';
    if (args.p_action==='collect') {mock.collection_id=args.p_request_id;mock.collection_pending_count=target.run?.status==='completed' ? 0 : 1;if (!mock.collection_pending_count) {mock.state='completed';target.session.status='ended';}}
    if (args.p_action === 'finish') { target.session.status = 'ended'; mock.state = 'completed'; mock.end_reason = 'teacher_finished'; mock.ended_at = timestamp(); if (target.run) { target.run.status = 'completed'; target.run.completedAt ||= timestamp(); } }
    mock.revision++; result = teacherResult(target);
  } else if (name === 'student_record_literacy_mock_event') {
    normalizeClock(target);
    if (!v3) return { data: { ok: false, error: 'unsupported_event_version' } };
    if (!target.run) return { data: { ok: false, error: 'plan_required' } };
    const item = bank.find(value => value.id === target.run.plan.itemIds[target.run.responses.length]);
    const alreadyPresented = target.run.presentations.some(value => value.questionId === args.p_question_id);
    if (args.p_event === 'presented' && alreadyPresented) return { data: learnerResult(target) };
    if (target.session.mock.state !== 'running' || target.run.status === 'completed') return { data: { ok: false, error: 'assessment_not_running' } };
    if (!item || item.id !== args.p_question_id) return { data: { ok: false, error: 'question_not_current' } };
    if (args.p_event === 'presented') {
      const exposure = getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: exposureValues() }));
      target.run.presentations.push({ ...exposure, questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
        itemSnapshot: clone(item), presentationStatus: 'presented', serverReceivedAt: timestamp() });
    } else {
      if (!alreadyPresented) return { data: { ok: false, error: 'presentation_required' } };
      let help = target.run.helpRequests.find(value => value.questionId === item.id);
      if (args.p_event === 'help_cancelled' && !help?.pending) return { data: { ok: false, error: 'help_not_pending' } };
      if (!help) { help = { questionId: item.id, itemSnapshot: clone(item), helpRequested: false, assistanceType: 'none' }; target.run.helpRequests.push(help); }
      if (args.p_event === 'help_requested') Object.assign(help, { helpRequested: true, pending: true, status: 'pending', requestedAt: timestamp() });
      else if (args.p_event === 'help_cancelled') Object.assign(help, { pending: false, status: 'cancelled', helpCancelled: true });
      else return { data: { ok: false, error: 'invalid_event' } };
    }
    target.run.eventRevision++; result = learnerResult(target);
  } else if (name === 'teacher_resolve_literacy_mock_support') {
    if (!target.run?.presentations.some(value => value.questionId === args.p_question_id)) return { data: { ok: false, error: 'presentation_required' } };
    if (!['none', 'access', 'answer'].includes(args.p_assistance)) return { data: { ok: false, error: 'invalid_support' } };
    let help = target.run.helpRequests.find(value => value.questionId === args.p_question_id);
    if (!help) { help = { questionId: args.p_question_id, itemSnapshot: clone(target.run.presentations.find(value => value.questionId === args.p_question_id).itemSnapshot), helpRequested: false, assistanceType: 'none' }; target.run.helpRequests.push(help); }
    help.assistanceType = help.assistanceType === 'answer' || args.p_assistance === 'answer' ? 'answer'
      : help.assistanceType === 'access' || args.p_assistance === 'access' ? 'access' : 'none';
    Object.assign(help, { pending: false, status: 'resolved', resolvedAt: timestamp() });
    target.run.eventRevision++; result = learnerResult(target);
  } else if (['teacher_prepare_literacy_mock_fresh_check', 'teacher_prepare_literacy_mock_entry_check'].includes(name)) {
    const entry = name.endsWith('entry_check');
    if (entry && [...(target.run?.responses || []), ...(target.run?.presentations || [])].some(value => value.skillId === args.p_skill_id)) return { data: { ok: false, error: 'skill_already_observed' } };
    const reference = entry ? available.find(value => value.skillId === args.p_skill_id && value.level === 1 && !value.tutorialOnly
      && !getLiteracyExposure(value, buildLiteracyExposureIndex({ exposures: exposureValues() })).knownFamiliar)
      : target.run?.responses.find(value => value.questionId === args.p_question_id) || target.run?.presentations.find(value => value.questionId === args.p_question_id);
    if (!reference) return { data: { ok: false, error: entry ? 'entry_items_unavailable' : 'source_question_not_observed' } };
    const focus = literacyMockFocus(reference);
    const check = selectLiteracyMockFreshCheck(available, { sessionId: 'fresh-session', studentId: 'student-a', ...(entry ? { focus } : { reference }), itemCount: 1, exposures: exposureValues() });
    if (!check.availableCount) return { data: { ok: false, error: 'fresh_items_unavailable' } };
    const count = Math.min(6, check.availableCount);
    const full = selectLiteracyMockFreshCheck(available, { sessionId: 'fresh-session', studentId: 'student-a', ...(entry ? { focus } : { reference }), itemCount: count, exposures: exposureValues() });
    state.archives.push({ session: clone(state.session), run: clone(state.run), memberIds: state.memberIds });
    state.session = { ...target.session, id: `fresh-session-${state.archives.length}`, status: 'prepared', started_at: timestamp(), mock: { ...target.session.mock, focus, candidate_item_ids: full.plan.itemIds,
      plan_kind: 'fresh_check', entry_check: entry, source_session_id: target.session.id, source_question_id: entry ? null : args.p_question_id, source_skill_id: entry ? reference.skillId : null, state: 'prepared', item_count: count, revision: 0, window_mode: 'pause_at_window_end',
      duration_seconds: 600, remaining_seconds: 600, time_extension_count: 0, deadline_at: null, ended_at: null, end_reason: null } };
    state.run = null; result = teacherResult();
  } else if (name === 'student_save_literacy_mock_run') {
    if (args.p_expected_revision !== (target.run?.revision || 0)) return { data: { ok: false, error: 'stale_revision' } };
    normalizeClock(target);
    if (target.session.mock.state === 'completed') return { data: { ok: false, error: 'assessment_finished', mock: clone(target.session.mock) } };
    if (args.p_plan) {
      const ids = args.p_plan.itemIds;
      if (!Array.isArray(ids) || ids.length !== target.session.mock.item_count || new Set(ids).size !== ids.length || ids.some(id => !bank.some(item => item.id === id))) return { data: { ok: false, error: 'invalid_plan' } };
      if (capabilities.contentQuarantineRepair && ids.slice(target.run?.responses.length || 0).some(id => literacyItemQualityIssue({ id }))) return { data: { ok: false, error: 'content_item_withdrawn' } };
      if (v3 && !target.run && ids.some(id => getLiteracyExposure(bank.find(item => item.id === id), buildLiteracyExposureIndex({ exposures: exposureValues() })).knownFamiliar)) {
        return { data: { ok: false, error: 'fresh_item_exposed' } };
      }
      if (target.run?.plan) for (const [index, id] of ids.entries()) {
        const old = bank.find(item => item.id === target.run.plan.itemIds[index]);
        const next = bank.find(item => item.id === id);
        if (index < target.run.responses.length ? id !== old.id : (!areaAdaptive && old.skillId !== next.skillId) || old.domainId !== next.domainId) return { data: { ok: false, error: 'plan_conflict' } };
        if (v3 && !areaAdaptive && !sameLiteracyMockTask(old, next)) return { data: { ok: false, error: 'plan_condition_conflict' } };
        if (index < target.run.responses.length) continue;
        if (itemUnavailable(next)) return { data: { ok: false, error: 'blocked_media_item' } };
        if (id === old.id) continue;
        if (v3 && !itemUnavailable(old) && target.run.presentations.some(value => value.questionId === old.id)) return { data: { ok: false, error: 'presented_item_frozen' } };
        const previous = [...effectiveRun(target).responses].reverse().find(response => response.skillId === next.skillId
          && response.responseStatus === 'answered' && response.evidenceType === 'independent' && typeof response.isCorrect === 'boolean'
          && !response.supportUsed && !response.supportPending && response.knownFamiliar !== true && (!v3 || sameLiteracyMockTask(response, next)));
        const expectedLevel = target.session.mock.plan_kind === 'fresh_check' || itemUnavailable(old) ? old.level
          : previous ? previous.isCorrect ? 2 : 1 : v3 ? 1 : old.level;
        if (!areaAdaptive && next.level !== expectedLevel) return { data: { ok: false, error: 'invalid_adaptation' } };
      }
      if (target.session.mock.plan_kind === 'fresh_check' && ids.some(id => !target.session.mock.candidate_item_ids.includes(id))) return { data: { ok: false, error: 'invalid_focus_plan' } };
      target.run = target.run || { schemaVersion: v3 ? 2 : 1, contentVersion, assignmentId: target.session.id, studentId: 'student-a', revision: 0, eventRevision: 0, presentationTracking: v3, presentations: [], helpRequests: [], responses: [], mediaFailures: [], status: 'ready' };
      target.run.plan = clone(args.p_plan);
    }
    if (args.p_response) {
      if (target.session.mock.state !== 'running') return { data: { ok: false, error: 'assessment_not_running', mock: clone(target.session.mock) } };
      const response = args.p_response;
      const item = bank.find(candidate => candidate.id === target.run.plan.itemIds[target.run.responses.length]);
      if (!item || item.id !== response.questionId) return { data: { ok: false, error: 'unexpected_question' } };
      if (capabilities.contentQuarantineRepair && literacyItemQualityIssue(item)) return { data: { ok: false, error: 'content_item_withdrawn' } };
      const presentation = target.run.presentations.find(value => value.questionId === item.id);
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
        target.run.mediaFailures ||= []; target.run.mediaFailures.push(canonical);
      } else {
        if (scored && item.requiredAudioPaths.some(path => response.audioDelivery?.[path] !== 'completed')) return { data: { ok: false, error: 'audio_incomplete' } };
        target.run.responses.push(canonical);
      }
    }
    target.run.revision++;
    target.run.unsampledItemIds = target.run.plan.itemIds.slice(target.run.responses.length);
    target.run.status = target.run.unsampledItemIds.length ? target.session.mock.state === 'prepared' ? 'ready' : 'running' : 'completed';
    if (target.run.status === 'completed') target.run.completedAt ||= timestamp();
    result = learnerResult(target);
  } else throw new Error(`Unexpected fixture RPC: ${name}`);
  // Retry receipts return the current canonical run above. Keep only the
  // dedupe marker here; snapshotting every run would invent a browser-storage
  // quota limit for this stand-in server after a dozen otherwise valid answers.
  state.receipts[args.p_request_id] = result.session?.id || true;
  state.requestArgs ||= {}; state.requestArgs[args.p_request_id] = clone({ name, args });
  const lose = state.fault === 'receipt-lost'; state.fault = null; persist();
  if (lose) throw new Error('Simulated response lost after server commit');
  return { data: result };
} };
window.__literacyMock = {
  device: () => JSON.parse(localStorage.getItem(`lp-mock-outbox:student-a:${state.session.id}`) || 'null'),
  deviceItem:()=>{const box=JSON.parse(localStorage.getItem(`lp-mock-outbox:student-a:${state.session.id}`) || 'null');return box ? clone(bank.find(item=>item.id===box.run.plan.itemIds[box.run.responses.length])) : null;},
  state: () => ({ ...clone(state), run: effectiveRun() }), rawResponses: () => clone(state.run?.responses || []), planItems: () => state.run?.plan.itemIds.map(id => clone(bank.find(item => item.id === id))) || [], choiceOrder: id => clone(mockChoices(bank.find(item => item.id === id), query.get('mode') === 'format' ? 'browser-format' : state.run?.plan.seed || `warmup:${state.session.id}:student-a`)), tutorials: () => Object.values(LITERACY_MOCK_TUTORIAL_IDS).map(id => clone(bank.find(item => item.id === id))), item: () => clone(query.get('mode') === 'format' ? chosen : bank.find(item => item.id === state.run?.plan.itemIds[state.run.responses.length])),
  setFault(fault) { state.fault = fault; persist(); },
  releaseHistory() { releaseHistoryRead?.(); releaseHistoryRead = null; },
  teacher(action) { return client.call('teacher_control_literacy_mock_session', { p_session_id: state.session.id, p_action: action, p_expected_revision: state.session.mock.revision, p_request_id: crypto.randomUUID() }); },
  resolve(questionId, assistance) { return client.call('teacher_resolve_literacy_mock_support', { p_session_id: state.session.id, p_student_id: 'student-a', p_question_id: questionId, p_assistance: assistance, p_request_id: crypto.randomUUID() }); },
  expire() { state.session.mock.deadline_at = new Date(Date.now() - 1000).toISOString(); persist(); },
  async bankCoverage() { return Object.fromEntries(['choice', 'multi_select', 'order', 'match', 'select_text', 'build_word'].map(format => [format, { authored: bank.filter(item => item.format === format).length, ready: available.filter(item => item.format === format).length }])); }
};
function FocusHarness() {
  const focus=useStudentFocusSession({client,studentId:'student-a',token:'local-browser-fixture',enabled:true});
  return focus.session ? <LiteracyMockPage client={client} token="local-browser-fixture" studentId="student-a" studentName="Alex" focusSession={focus.session}/> : <p>Waiting for the teacher session</p>;
}
function Harness() {
  const [submitted, setSubmitted] = useState(null);
  const [teacherPhase, setTeacherPhase] = useState(query.get('phase') || '');
  if (query.get('mode') === 'teacher') return <>{query.has('phaseNavigation') && <nav aria-label="Fixture session navigation"><button onClick={() => setTeacherPhase('live')}>Open this session</button><button onClick={() => setTeacherPhase('results')}>Open this session’s results</button></nav>}<TeacherLiteracyMockPanel client={client} teacherId={query.get('teacher') || `teacher-${query.get('case') || 'default'}`} classId="class-a" className="Class A" students={students} initialSessionId={query.get("session") || ""} initialReportStudentId={query.get("student") || ""} initialPhase={teacherPhase}/></>;
  if (query.get('mode') === 'format') return <main className="literacy-mock"><div className="literacy-mock-canvas"><header className="literacy-mock-header"><h1>Reading &amp; language</h1><span>Literacy Guide practice</span></header>{submitted ? <p role="status">Answer received</p> : <LiteracyMockQuestion item={chosen} seed="browser-format" index={query.has('finalQuestion') ? 42 : 0} total={query.has('finalQuestion') ? 43 : undefined} studentName="Alex" demonstration={query.has('demo')} onSubmit={response => { state.lastSubmission = response; persist(); setSubmitted(response); }}/>}</div></main>;
  if (query.has('focusHook')) return <FocusHarness/>;
  return <LiteracyMockPage client={client} token="local-browser-fixture" studentId="student-a" studentName="Alex" focusSession={state.session}/>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
