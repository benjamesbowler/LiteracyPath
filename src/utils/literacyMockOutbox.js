import { readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft } from './assessmentDraftStorage.js';

export const MOCK_OUTBOX_SCHEMA = 1;
export const MOCK_OUTBOX_REQUEST_LIMIT = 512;
export const MOCK_V5_DELIVERY_REQUEST_LIMIT = 12;
const clone = value => structuredClone(value);
const answer = value => ({ questionId:value.questionId, responseStatus:value.responseStatus, selected:value.selected ?? null });
export const mockOutboxKey = (studentId, sessionId) => `lp-mock-outbox:${studentId}:${sessionId}`;
const storageFor = storage => storage || globalThis.localStorage;

function valid(value, studentId, sessionId) {
  return value?.schemaVersion === MOCK_OUTBOX_SCHEMA && value.studentId === studentId && value.sessionId === sessionId
    && value.mock && typeof value.mock === 'object'
    && value.run?.studentId === studentId && value.run?.assignmentId === sessionId
    && value.serverRun?.studentId === studentId && value.serverRun?.assignmentId === sessionId
    && value.run.contentVersion === value.serverRun.contentVersion
    && Array.isArray(value.requests) && value.requests.length <= MOCK_OUTBOX_REQUEST_LIMIT
    && Array.isArray(value.run.responses) && Array.isArray(value.serverRun.responses)
    && value.run.plan?.seed === value.serverRun.plan?.seed;
}

export function readMockOutbox(studentId, sessionId, storage) {
  try {
    const value = JSON.parse(readAssessmentDraft(mockOutboxKey(studentId,sessionId),studentId,storageFor(storage)) || 'null');
    return valid(value,studentId,sessionId) ? value : null;
  } catch { return null; }
}

/** Verify durable readback before allowing the child to leave the current question. */
export function writeMockOutbox(value, storage) {
  if (!valid(value,value?.studentId,value?.sessionId)) return false;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 3 * 1024 * 1024) return false;
    const target = storageFor(storage), key = mockOutboxKey(value.studentId,value.sessionId);
    return writeAssessmentDraft(key,serialized,value.studentId,target)
      && readAssessmentDraft(key,value.studentId,target) === serialized;
  } catch { return false; }
}

export function createMockOutbox({ studentId, sessionId, run, mock, focusSession, mediaItemIds = [], receivedAt = new Date().toISOString() }) {
  const focus = Object.fromEntries(['id','class_id','teacher_id','target','status','content_version','resolved_config','started_at','expires_at']
    .filter(key => focusSession?.[key] !== undefined).map(key => [key,clone(focusSession[key])]));
  const value = { schemaVersion:MOCK_OUTBOX_SCHEMA, studentId, sessionId, serverRun:clone(run), run:clone(run),
    mock:clone(mock), focusSession:focus, mediaItemIds:clone(mediaItemIds), requests:[], lastServerContactAt:receivedAt };
  if (!valid(value,studentId,sessionId)) throw new Error('Invalid initial device record');
  return value;
}

/** A local projection is never a server receipt or teacher-visible result. */
export function projectMockMutation(run, request, { item, isCorrect, occurredAt = new Date().toISOString() } = {}) {
  const next = clone(run);
  if (request.type === 'event') {
    if (!item || request.questionId !== item.id || !['presented','help_requested','help_cancelled'].includes(request.event)) throw new Error('Invalid local event');
    next.eventRevision = (next.eventRevision || 0) + 1;
    if (request.event === 'presented') {
      next.presentations ||= [];
      if (!next.presentations.some(value => value.questionId === item.id)) next.presentations.push({ questionId:item.id,
        skillId:item.skillId, domainId:item.domainId, level:item.level, itemSnapshot:clone(item), clientOccurredAt:occurredAt });
    } else {
      next.helpRequests ||= [];
      let help = next.helpRequests.find(value => value.questionId === item.id);
      if (!help) { help = { questionId:item.id }; next.helpRequests.push(help); }
      help.localOnly = true;
      help.status = request.event === 'help_requested' ? 'pending' : 'cancelled';
      help.pending = request.event === 'help_requested';
      help.helpRequested ||= request.event === 'help_requested';
      help.helpCancelled ||= request.event === 'help_cancelled';
    }
    return next;
  }
  if (request.expectedRevision !== next.revision) throw new Error('Invalid local revision');
  if (request.plan) {
    if (request.plan.seed !== next.plan.seed || request.plan.itemIds.length !== next.plan.itemIds.length
      || next.responses.some((value,index) => request.plan.itemIds[index] !== value.questionId)) throw new Error('Invalid local plan prefix');
    next.plan = clone(request.plan);
  }
  if (request.response) {
    const response = request.response;
    if (!item || response.questionId !== item.id || next.plan.itemIds[next.responses.length] !== item.id
      || (response.responseStatus === 'answered' && typeof isCorrect !== 'boolean')
      || !['answered','media_failed','skipped'].includes(response.responseStatus)) throw new Error('Invalid local response');
    const helped = next.helpRequests?.find(value => value.questionId === item.id);
    if (helped?.status === 'pending') throw new Error('Assistance has not been resolved');
    const supported = response.supportUsed === true || helped?.assistanceType === 'answer';
    const saved = { ...clone(response), skillId:item.skillId, domainId:item.domainId, level:item.level,
      itemSnapshot:clone(item), isCorrect:response.responseStatus === 'answered' ? isCorrect : null,
      supportUsed:supported, evidenceType:response.responseStatus !== 'answered' ? 'unscored' : supported ? 'supported' : 'independent',
      clientOccurredAt:occurredAt, localOnly:true };
    if (response.responseStatus === 'media_failed') { next.mediaFailures ||= []; next.mediaFailures.push(saved); }
    else next.responses.push(saved);
  }
  next.revision += 1;
  next.status = next.responses.length === next.plan.itemIds.length ? 'completed' : 'running';
  return next;
}

export function appendMockOutbox(value, request, projectionOptions, storage) {
  if (!value || value.requests.length >= MOCK_OUTBOX_REQUEST_LIMIT || !request.requestId
    || value.requests.some(row => row.requestId === request.requestId)) throw new Error('Invalid device queue request');
  const run = projectMockMutation(value.run,request,projectionOptions);
  const next = { ...value, run, requests:[...value.requests,clone(request)] };
  if (!writeMockOutbox(next,storage)) throw Object.assign(new Error('The iPad could not save this answer.'),{ code:'device_storage_failed' });
  return next;
}

export function prepareMockDelivery(value, { batchId, collectionId = null }, storage) {
  if (value.delivery) return value;
  const requests=['literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8'].includes(value.run.contentVersion) ? value.requests.slice(0,MOCK_V5_DELIVERY_REQUEST_LIMIT) : value.requests;
  const complete=requests.length===value.requests.length;
  // This is the receipt watermark for the sent prefix. The full local sitting
  // stays intact until every chunk has its own canonical acknowledgement.
  const lastMutation=requests.filter(request=>request.type!=='event').at(-1);
  const nextPlan=requests.filter(request=>request.plan).at(-1)?.plan || value.serverRun.plan;
  const count=value.serverRun.responses.length+requests.filter(request=>request.response && request.response.responseStatus!=='media_failed').length;
  const sentRun=complete ? value.run : {...value.serverRun,plan:nextPlan,
    revision:lastMutation ? lastMutation.expectedRevision+1 : value.serverRun.revision,
    eventRevision:(value.serverRun.eventRevision || 0)+requests.filter(request=>request.type==='event').length,
    responses:value.run.responses.slice(0,count),status:'running'};
  const next = { ...value, delivery:{ batchId, collectionId:complete ? collectionId : null, leaseId:value.serverRun.offlineLeaseId ?? null,
    sent:clone({studentId:value.studentId,sessionId:value.sessionId,run:sentRun,requests,batchId}) } };
  if (!writeMockOutbox(next,storage)) throw Object.assign(new Error('The iPad could not retain its delivery request.'),{code:'device_storage_failed'});
  return next;
}

/** All acknowledged requests and every immutable answer must be present before deletion. */
export function verifyMockOutboxReceipt(result, sent) {
  const fail = () => { throw Object.assign(new Error('Device delivery receipt is incomplete.'),{code:'invalid_receipt'}); };
  if (result?.ok !== true || (sent.batchId && result.batchId !== sent.batchId) || result.run?.assignmentId !== sent.sessionId || result.run?.studentId !== sent.studentId
    || result.run?.contentVersion !== sent.run.contentVersion || result.run.plan?.seed !== sent.run.plan.seed
    || !Array.isArray(result.acknowledged) || result.acknowledged.length !== sent.requests.length
    || sent.requests.some((request,index) => result.acknowledged[index] !== request.requestId)
    || !Array.isArray(result.run.responses) || result.run.responses.length < sent.run.responses.length
    || sent.run.responses.some((value,index) => JSON.stringify(answer(value)) !== JSON.stringify(answer(result.run.responses[index])))
    || !Number.isInteger(result.run.revision) || result.run.revision < sent.run.revision
    || !Number.isInteger(result.run.eventRevision) || result.run.eventRevision < (sent.run.eventRevision || 0)) fail();
  for (const request of sent.requests) {
    if (request.type === 'event' && request.event === 'presented' && !result.run.presentations?.some(value => value.questionId === request.questionId)) fail();
    if (request.type === 'event' && request.event !== 'presented') {
      const help=result.run.helpRequests?.find(value=>value.questionId===request.questionId);
      if (!help || (request.event==='help_requested' && help.helpRequested!==true)
        || (request.event==='help_cancelled' && help.helpCancelled!==true)) fail();
    }
    if (request.response?.responseStatus === 'media_failed' && !result.run.mediaFailures?.some(value =>
      value.questionId === request.response.questionId && request.response.failedMediaPaths?.every(path => value.failedMediaPaths?.includes(path)))) fail();
  }
  return result;
}

export function acknowledgeMockOutbox(current, sent, result, projectionFor, storage) {
  verifyMockOutboxReceipt(result,sent);
  if (sent.requests.some((request,index) => current.requests[index]?.requestId !== request.requestId)) throw new Error('Device queue changed owner or prefix');
  const remaining = current.requests.slice(sent.requests.length);
  let run = clone(result.run);
  for (const request of remaining) run = projectMockMutation(run,request,projectionFor(request));
  const next = { ...current, serverRun:clone(result.run), run, requests:remaining, delivery:null, mock:clone(result.mock || current.mock), lastServerContactAt:new Date().toISOString() };
  if (!writeMockOutbox(next,storage)) throw Object.assign(new Error('The delivery receipt could not be retained.'),{ code:'device_storage_failed' });
  return next;
}

export function readCachedMockFocus(studentId, storage, now = Date.now()) {
  try {
    const target = storageFor(storage), candidates = [];
    for (let i=0;i<target.length;i++) {
      const key = target.key(i), prefix = `lp-mock-outbox:${studentId}:`;
      if (!key?.startsWith(prefix)) continue;
      const value = readMockOutbox(studentId,key.slice(prefix.length),target);
      if (value?.focusSession.status === 'active' && Date.parse(value.focusSession.expires_at) > now
        && value.mock.state !== 'completed') candidates.push(value);
    }
    return candidates.sort((a,b) => b.lastServerContactAt.localeCompare(a.lastServerContactAt))[0] || null;
  } catch { return null; }
}

/** Retire only fully received completed replicas; keep every pending/uncertain queue. */
export function pruneReceivedMockOutboxes({ exceptStudentId, exceptSessionId, storage }={}) {
  const target=storageFor(storage);let removed=0;
  try {
    const keys=Array.from({length:target.length},(_,index)=>target.key(index)).filter(key=>key?.startsWith('lp-mock-outbox:'));
    for (const key of keys) {
      const [,studentId,sessionId]=key.split(':');
      if (!studentId || !sessionId || studentId===exceptStudentId && sessionId===exceptSessionId) continue;
      const box=readMockOutbox(studentId,sessionId,target);
      if (!box || box.requests.length || box.delivery || box.run.status!=='completed' || box.serverRun.status!=='completed'
        || box.run.responses.length!==box.serverRun.responses.length || box.run.responses.some((row,index)=>
          JSON.stringify(answer(row))!==JSON.stringify(answer(box.serverRun.responses[index]))
          || !Number.isFinite(Date.parse(box.serverRun.responses[index].serverReceivedAt)))) continue;
      removeAssessmentDraft(key,target);
      if (target.getItem(key)===null) {removeAssessmentDraft(`lp-mock-pool:${studentId}:${sessionId}`,target);removed++;}
    }
  } catch { /* Storage denial cannot authorize dropping pending work. */ }
  return removed;
}
