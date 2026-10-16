import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, SpeakerHigh, CheckCircle } from '@phosphor-icons/react';
import { loadLiteracyMockBank, literacyMockTutorialIdsForVersion, scoreLiteracyMockResponse } from '../../data/literacyMockBank.js';
import { getStudentLiteracyMockRun, saveStudentLiteracyMockRun, recordLiteracyMockEvent, literacyMockMutationReceiptContext, verifyLiteracyMockMutationReceipt, syncStudentLiteracyMockBatch } from '../../data/literacyMockSessionCore.js';
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck, adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia, replaceInvalidLiteracyMockContent, sameLiteracyMockPlan } from '../../utils/literacyMockPlanner.js';
import { readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft } from '../../utils/assessmentDraftStorage.js';
import { LiteracyMockQuestion } from './LiteracyMockQuestion.jsx';
import { buildLiteracyExposureIndex, canonicalLiteracyIdentity, getLiteracyExposure, readLiteracyExposures, recordLiteracyExposures } from '../../utils/literacyEvidence.js';
import { useMockAudio } from '../../hooks/useMockAudio.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../utils/progressCheckAudio.js';
import { readLiteracyMockReadiness, recordLiteracyMockReadiness, selectLiteracyMockTutorials } from '../../utils/literacyMockReadiness.js';
import { LITERACY_MOCK_EVIDENCE_VERSIONS } from '../../policy/literacyMockVersions.js';
import { literacyItemQualityIssue } from '../../policy/literacyItemEligibility.js';
import { readMockOutbox, pruneReceivedMockOutboxes, createMockOutbox, writeMockOutbox, appendMockOutbox, prepareMockDelivery, acknowledgeMockOutbox } from '../../utils/literacyMockOutbox.js';
import { warmMockOfflineExecutable } from '../../utils/offlineShell.js';
import { mockOfflineMediaPaths, prepareMockOfflineMedia } from '../../utils/literacyMockOfflineMedia.js';
import '../../styles/literacy-mock.css';

function MockSoundCheck({ onReady, disabled }) {
  const [selected, setSelected] = useState(false);
  const cue = { path: progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle) };
  const audio = useMockAudio([cue]);
  const ready = selected && audio.delivery[cue.path] === 'completed';
  return <section className="literacy-mock-welcome">
    <h2>Let’s try the buttons.</h2>
    <p data-child-instruction>Listen. Choose the circle, then tap Next.</p>
    <button type="button" className="literacy-mock-speaker" aria-label="Check my sound" onClick={() => audio.play()}><SpeakerHigh weight="fill" aria-hidden="true"/></button>
    <div className="literacy-mock-warmup" role="group" aria-label="Practice shapes" data-child-choices>
      <button type="button" aria-label="Circle" aria-pressed={selected} onClick={() => setSelected(true)}><span className="literacy-mock-circle"/></button>
      <button type="button" aria-label="Square" aria-pressed={false} onClick={() => setSelected(false)}><span className="literacy-mock-square"/></button>
    </div>
    <p data-child-progress>Button practice · not a test question</p>
    {Object.values(audio.delivery).includes('failed') && <p role="alert">The sound did not load. Ask your teacher, then try the speaker again.</p>}
    <button type="button" className="literacy-mock-next" data-child-primary disabled={!ready || disabled} onClick={onReady}>Next <ArrowRight aria-hidden="true"/></button>
  </section>;
}

const requestId = () => globalThis.crypto?.randomUUID?.() || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function readPending(key, studentId) { try { return JSON.parse(readAssessmentDraft(key, studentId) || 'null'); } catch { return null; } }
function containsWithdrawnRequest(request, answeredCount = 0) {
  return Boolean(literacyItemQualityIssue(request?.response || {})
    || request?.plan?.itemIds?.slice(answeredCount).some(id => literacyItemQualityIssue({ id })));
}

function OwnedLiteracyMockPage({ studentId, studentName, token, focusSession, client, onContentAvailabilityChange }) {
  const sessionId = focusSession?.id;
  const storageKey = `lp-mock-pending:${studentId}:${sessionId}`;
  const [bank, setBank] = useState(null);
  const [bankError, setBankError] = useState('');
  const [cached] = useState(() => readMockOutbox(studentId,sessionId));
  const [run, setRun] = useState(cached?.run || null);
  const [mock, setMock] = useState(cached?.mock || focusSession?.mock || null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(() => readPending(storageKey, studentId));
  const [ready, setReady] = useState(Boolean(cached));
  const [boxState,setBoxState] = useState(cached);
  const [offlineMedia,setOfflineMedia] = useState(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const deliveryRef = useRef(null);
  const device = useRef({ box:cached, media:null, preparing:false, flushing:false, failures:0, retryAt:0 });
  const [soundChecked, setSoundChecked] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [serverExposures, setServerExposures] = useState([]);
  const [controlReadiness] = useState(() => readLiteracyMockReadiness(studentId));
  const [tutorialMessage, setTutorialMessage] = useState('');
  const [reminderId, setReminderId] = useState(null);
  const adaptRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  const owner = useRef({ active: true, writing: false, pending: readPending(storageKey, studentId), run: cached?.run || null, mock: cached?.mock || null, bank: null, clockOffset: 0, exposures: new Map() });
  const contentCallback = useRef(onContentAvailabilityChange);
  useEffect(() => { contentCallback.current = onContentAvailabilityChange; }, [onContentAvailabilityChange]);
  const [clockOffset, setClockOffset] = useState(0);
  const contentVersion = run?.contentVersion || mock?.content_version || focusSession?.content_version || 'literacy-mock-v1';
  const hasWithdrawnQuestions = Boolean(run?.plan?.itemIds?.slice(run.responses?.length || 0)
    .some(id => literacyItemQualityIssue({ id })));
  const reloadBank = useCallback(async () => {
    setBankError('');
    owner.current.loadingContentVersion = contentVersion;
    try {
      const items = await loadLiteracyMockBank({ contentVersion });
      if (!owner.current.active || owner.current.loadingContentVersion !== contentVersion) return;
      if (Object.values(literacyMockTutorialIdsForVersion(contentVersion)).some(id => !items.some(item => item.id === id))) throw new Error('missing_practice_media');
      owner.current.bank = items; setBank(items); contentCallback.current?.(true);
    } catch {
      if (owner.current.active) { setBankError('Your questions did not load. Ask your teacher, then try again.'); contentCallback.current?.(false); }
    }
  }, [contentVersion]);
  const accept = useCallback(result => {
    if (!owner.current.active) return;
    const received = [...(result.exposures || []), ...(result.run?.responses || []), ...(result.run?.mediaFailures || []), ...(result.run?.presentations || [])];
    const ledger = owner.current.exposures;
    const previousSize = ledger.size;
    for (const value of received) {
      const identity = canonicalLiteracyIdentity(value);
      if (identity.itemId || identity.passageKey || identity.familyId) ledger.set(JSON.stringify(identity), {
        exposureItemId: identity.itemId, exposurePassageKey: identity.passageKey, exposureFamilyId: identity.familyId,
      });
    }
    if (ledger.size !== previousSize) setServerExposures([...ledger.values()]);
    recordLiteracyExposures(studentId, received);
    if (result.mock && (!owner.current.mock || result.mock.revision > owner.current.mock.revision
      || (result.mock.revision === owner.current.mock.revision && Date.parse(result.mock.server_now) >= Date.parse(owner.current.mock.server_now)))) {
      owner.current.mock = result.mock; setMock(result.mock);
      if (device.current.box) { const next = { ...device.current.box, mock:result.mock }; if (writeMockOutbox(next)) { device.current.box = next; setBoxState(next); } }
      setClockOffset(Date.parse(result.mock.server_now) - Date.now());
    }
    if (result.run && !device.current.box && (!owner.current.run || (result.run.revision >= owner.current.run.revision && (result.run.eventRevision || 0) >= (owner.current.run.eventRevision || 0)))) {
      owner.current.run = result.run; setRun(result.run); setReady(true);
    }
  }, [studentId]);
  useEffect(()=>{if (focusSession?.mock?.server_now) accept({mock:focusSession.mock});},[focusSession?.mock,accept]);
  const refresh = useCallback(async () => {
    if (owner.current.polling) return;
    const controller = new AbortController();
    owner.current.polling = controller; owner.current.lastPollAt=Date.now();
    let timeout;
    try {
      const result = await Promise.race([
        getStudentLiteracyMockRun({ client, token, sessionId, signal: controller.signal }),
        new Promise((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('read_timeout')); }, 10000); })
      ]);
      if (!owner.current.active) return;
      if (!result?.ok) {
        if (result?.ok===false && ['invalid_session','assignment_not_found','assessment_finished'].includes(result.error) && device.current.box) setDeviceError('Your answers are safe on this iPad. Ask your teacher to check this session.');
        throw new Error(result?.error || 'unavailable');
      }
      accept(result); setConnected(true); setLoading(false);
      if (device.current.box && !device.current.box.requests.length && !device.current.box.delivery && result.run) {
        const next = { ...device.current.box, run:result.run, serverRun:result.run, mock:result.mock,
          lastServerContactAt:new Date().toISOString() };
        if (writeMockOutbox(next)) { device.current.box=next; setBoxState(next); owner.current.run=next.run; setRun(next.run); }
      }
      void deliveryRef.current?.();
    } catch { if (owner.current.active) { setConnected(false); setLoading(false); } }
    finally { clearTimeout(timeout); if (owner.current.polling === controller) owner.current.polling = null; }
  }, [client, token, sessionId, accept]);
  useEffect(() => {
    const lifetime = owner.current; lifetime.active = true;
    queueMicrotask(() => void reloadBank());
    queueMicrotask(() => void refresh()); const interval = setInterval(() => {
      setNow(Date.now());
      const urgent=owner.current.mock?.collection_id || owner.current.run?.helpRequests?.some(row=>row.status==='pending');
      const delay=device.current.box && owner.current.mock?.delivery_mode!=='live' && !urgent ? 15000 : 2000;
      if (Date.now()-(owner.current.lastPollAt || 0)>=delay) void refresh();
    }, 2000);
    window.addEventListener('online', refresh);
    return () => { lifetime.active = false; lifetime.polling?.abort(); clearInterval(interval); window.removeEventListener('online', refresh); };
  }, [refresh, reloadBank]);

  const projectionFor = useCallback(request => {
    const item = owner.current.bank?.find(value => value.id === (request.questionId || request.response?.questionId));
    return { item, isCorrect:request.response?.responseStatus === 'answered' ? scoreLiteracyMockResponse(item,request.response.selected) : undefined };
  },[]);
  const flushDevice = useCallback(async () => {
    const current = device.current, state = owner.current.mock;
    if (!owner.current.active || current.flushing || !current.box || (!current.media && !state?.collection_id) || Date.now()<current.retryAt) return;
    const urgent = current.box.run.status === 'completed' || state?.collection_id || current.box.requests.some(row=>row.event==='help_requested' || row.event==='help_cancelled');
    if (!current.box.delivery && (!current.box.requests.length && !state?.collection_id || state?.delivery_mode !== 'live' && !urgent)) return;
    if (!current.box.delivery && state?.collection_id && current.box.serverRun.collectionAckId === state.collection_id && !current.box.requests.length) return;
    current.flushing=true;
    const controller=new AbortController(); let timer; let delivered=false;
    try {
      current.box=prepareMockDelivery(current.box,{batchId:requestId(),collectionId:state?.collection_id || null});
      const delivery=current.box.delivery;
      const result=await Promise.race([
        syncStudentLiteracyMockBatch({client,token,sessionId,batchId:delivery.batchId,leaseId:delivery.leaseId,
          requests:delivery.sent.requests,collectionId:delivery.collectionId,signal:controller.signal}),
        new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('delivery_timeout'));},10000);})
      ]);
      if (!owner.current.active) return;
      current.box=acknowledgeMockOutbox(current.box,delivery.sent,result,projectionFor);
      setBoxState(current.box); owner.current.run=current.box.run; setRun(current.box.run); accept(result); setConnected(true);
      current.failures=0; current.retryAt=0; delivered=true;
    } catch (failure) {
      current.failures++; current.retryAt=Date.now()+Math.min(30000,1000*2**Math.min(current.failures,5));
      if (failure.code==='device_storage_failed' && owner.current.active) setDeviceError('This iPad could not save your work. Keep it open and ask your teacher for help.');
      // Uncertain delivery retains the exact batch and all newer answers.
    } finally { clearTimeout(timer); current.flushing=false; if(delivered && current.box?.requests.length) setTimeout(()=>deliveryRef.current?.(),0); }
  },[client,token,sessionId,projectionFor,accept]);
  useEffect(()=>{deliveryRef.current=flushDevice;},[flushDevice]);
  useEffect(() => {
    if (!run || !bank || !mock?.capabilities?.offlineDelivery || pending || device.current.media || device.current.preparing) return undefined;
    const current=device.current, controller=new AbortController(); current.preparing=true;
    let timer, media;
    (async () => {
      try {
        let box=current.box;
        const ids=box?.mediaItemIds || JSON.parse(readAssessmentDraft(`lp-mock-pool:${studentId}:${sessionId}`,studentId,globalThis.localStorage) || 'null');
        if (!Array.isArray(ids) || !ids.length || run.plan.itemIds.some(id=>!ids.includes(id))) throw new Error('device_pool_missing');
        if (!box) {
          pruneReceivedMockOutboxes({exceptStudentId:studentId,exceptSessionId:sessionId});
          const lease=await Promise.race([
            syncStudentLiteracyMockBatch({client,token,sessionId,batchId:`device-ready:${run.plan.seed}`,requests:[],signal:controller.signal}),
            new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('lease_timeout'));},10000);})
          ]);
          clearTimeout(timer);
          if (!lease?.ok || lease.run?.studentId!==studentId || lease.run?.assignmentId!==sessionId || !lease.run.offlineLeaseId) throw new Error('lease_unconfirmed');
          box=createMockOutbox({studentId,sessionId,run:lease.run,mock:lease.mock,mediaItemIds:ids,
            focusSession:{...focusSession,expires_at:lease.run.offlineLeaseExpiresAt}});
          if (!writeMockOutbox(box)) throw Object.assign(new Error('device_storage_failed'),{code:'device_storage_failed'});
          current.box=box; setBoxState(box);
        }
        await warmMockOfflineExecutable();
        const mediaItems=bank.filter(item=>ids.includes(item.id) || Object.values(literacyMockTutorialIdsForVersion(contentVersion)).includes(item.id));
        media=await prepareMockOfflineMedia(mockOfflineMediaPaths(mediaItems,[progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.readPassage),progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle)]),{signal:controller.signal});
        if (!owner.current.active || controller.signal.aborted) { media.dispose(); return; }
        current.media=media; setOfflineMedia(media); setBoxState(current.box); owner.current.run=current.box.run; setRun(current.box.run); setReady(true); setLoading(false); setDeviceReady(true);
      } catch (failure) {
        if (owner.current.active && failure.code==='device_storage_failed') setDeviceError('This iPad could not save your work. Keep it open and ask your teacher for help.');
        // Automatic preparation retry; no answer has been released before durable media/lease.
      } finally { clearTimeout(timer); current.preparing=false; }
    })();
    return undefined;
  },[bank,run,mock,pending,client,token,sessionId,studentId,focusSession,contentVersion,now]);
  useEffect(() => {
    const timer=setInterval(()=>{
      void deliveryRef.current?.();
    },2000);
    const wake=()=>{device.current.retryAt=0;void deliveryRef.current?.();};
    window.addEventListener('online',wake);
    return ()=>{clearInterval(timer);window.removeEventListener('online',wake);};
  });
  useEffect(()=>()=>{device.current.media?.dispose();},[]);

  async function mutate(mutation) {
    if (!owner.current.active || owner.current.writing) return;
    if (mutation && device.current.box && device.current.media) {
      try {
        const item = owner.current.bank?.find(value => value.id === (mutation.questionId || mutation.response?.questionId));
        const next = appendMockOutbox(device.current.box, mutation, { item,
          isCorrect:mutation.response?.responseStatus === 'answered' ? scoreLiteracyMockResponse(item,mutation.response.selected) : undefined });
        device.current.box=next; setBoxState(next); owner.current.run=next.run; setRun(next.run); setError('');
        void deliveryRef.current?.();
      } catch (failure) { setDeviceError(failure.code==='device_storage_failed' ? 'This iPad could not save your work. Keep it open and ask your teacher for help.' : 'This question needs your teacher’s help. Your saved answers are safe.'); }
      return;
    }
    if (!mutation && containsWithdrawnRequest(owner.current.pending, owner.current.run?.responses?.length || 0)
      && !owner.current.mock?.capabilities?.contentQuarantineRepair) {
      setError('A question is being checked. Your saved answers are safe.');
      return;
    }
    owner.current.writing = true; setBusy(true); setError('');
    const request = mutation ? { ...mutation, receiptContext: literacyMockMutationReceiptContext(owner.current.run, contentVersion) } : owner.current.pending;
    owner.current.pending = request; setPending(request);
    // The request is scoped to the learner and assignment, contains no token,
    // and is replayed byte-for-byte after an uncertain network result.
    try { writeAssessmentDraft(storageKey, JSON.stringify(request), studentId); } catch { /* The server receipt remains the source of truth. */ }
    try {
      let saveTimeout;
      let result;
      try {
        result = await Promise.race([
          request.type === 'event' ? recordLiteracyMockEvent({ client, token, sessionId, ...request }) : saveStudentLiteracyMockRun({ client, token, sessionId, ...request }),
          new Promise((_, reject) => { saveTimeout = setTimeout(() => reject(new Error('save_timeout')), 10000); })
        ]);
      } finally { clearTimeout(saveTimeout); }
      if (!owner.current.active) return;
      if (result?.ok === false) {
        accept(result);
        adaptRef.current = null;
        owner.current.pending = null; setPending(null); try { removeAssessmentDraft(storageKey); } catch { /* no durable local entry */ }
        await refresh();
        setError(['assessment_finished', 'assessment_not_running'].includes(result?.error) ? '' : request.type === 'event'
          ? 'Your question status was not saved. Check with your teacher, then try again.'
          : request.response ? 'Your answer was not saved. Check with your teacher, then try again.'
            : 'Your questions could not be updated. Check with your teacher, then try again.');
        return;
      }
      verifyLiteracyMockMutationReceipt(result, request, { sessionId, studentId, contentVersion });
      accept(result);
      owner.current.pending = null; setPending(null); try { removeAssessmentDraft(storageKey); } catch { /* server receipt already verified */ }
      if (request.response && result.run?.plan?.seed) {
        try { removeAssessmentDraft(`lp-mock-selection:${result.run.plan.seed}:${request.response.questionId}`); } catch { /* receipt is authoritative */ }
      }
      setConnected(true);
    } catch {
      if (owner.current.active) { setConnected(false); setError('Your work is waiting to save. Reconnect, then tap Try again.'); }
    } finally {
      owner.current.writing = false;
      if (owner.current.active) setBusy(false);
    }
  }
  function retryRejected() {
    setError(''); adaptRef.current = null; void refresh();
  }
  async function register() {
    try {
      let offlineIds=[];
      const options = { sessionId, studentId, itemCount: mock.item_count, onOfflineItems:ids=>{offlineIds=ids;}, exposures: [...owner.current.exposures.values(), ...readLiteracyExposures(studentId)] };
      const fresh = mock.plan_kind === 'fresh_check' ? selectLiteracyMockFreshCheck(bank, { ...options, focus: mock.focus, eligibleItemIds: mock.candidate_item_ids }) : null;
      if (fresh?.unavailable) throw new Error('fresh_items_unavailable');
      const plan = fresh?.plan || selectLiteracyMockPlan(bank, options);
      if (mock.capabilities?.offlineDelivery) {
        pruneReceivedMockOutboxes({exceptStudentId:studentId,exceptSessionId:sessionId});
        const ids = offlineIds.length ? offlineIds : plan.itemIds;
        if (!writeAssessmentDraft(`lp-mock-pool:${studentId}:${sessionId}`,JSON.stringify(ids),studentId,globalThis.localStorage)) throw new Error('device_storage_failed');
      }
      setReady(true);
      await mutate({ requestId: requestId(), expectedRevision: 0, plan, response: null });
    } catch { setBankError('There are not enough new questions for this check. Ask your teacher to choose a different check. Your saved answers are safe.'); }
  }
  async function submit(response) {
    const latest = owner.current.run;
    if (!latest || owner.current.pending || (!connected && !deviceReady) || literacyItemQualityIssue(response)) return;
    await mutate({ requestId: requestId(), expectedRevision: latest.revision, plan: null, response });
  }
  function recordEvent(question, event) {
    if (!mock?.capabilities?.presentationReceipts) return;
    if (event === 'presented' && owner.current.run?.presentations?.some(value => value.questionId === question.id)) return;
    void mutate({ type: 'event', requestId: requestId(), questionId: question.id, event });
  }
  // Repair withdrawn content and unavailable media before adapting. Neither changes a saved
  // answer or advances the child; the server must accept the plan before display.
  let adaptivePlan = null;
  let mediaUnavailable = false;
  let contentUnavailable = false;
  let capacityUnavailable = false;
  if (bank && run && mock?.state === 'running' && run.status !== 'completed') {
    try {
      const availableBank = boxState ? bank.filter(candidate=>boxState.mediaItemIds.includes(candidate.id)) : bank;
      const repairBank = mock.plan_kind === 'fresh_check' ? availableBank.filter(candidate => mock.candidate_item_ids?.includes(candidate.id)) : availableBank;
      const exposures = [...serverExposures, ...readLiteracyExposures(studentId)];
      const contentReplacement = hasWithdrawnQuestions && !mock?.capabilities?.contentQuarantineRepair
        ? { plan: run.plan, unavailable: true }
        : replaceInvalidLiteracyMockContent(repairBank, run.plan, run.responses, run.mediaFailures || [], run.presentations || [], { exposures });
      contentUnavailable = contentReplacement.unavailable;
      if (!contentUnavailable) {
        const replacement = replaceFailedLiteracyMockMedia(repairBank, contentReplacement.plan, run.responses, run.mediaFailures || [], run.presentations || [], { exposures });
        mediaUnavailable = replacement.unavailable;
        // Persist a same-level content/media repair before evaluating later
        // assistance. Neither kind of invalid evidence changes task demand.
        const repairNeeded = !sameLiteracyMockPlan(replacement.plan, run.plan);
        if (!mediaUnavailable) adaptivePlan = mock.plan_kind === 'fresh_check' || repairNeeded ? replacement.plan : adaptLiteracyMockPlan(repairBank, run.plan, run.responses, run.mediaFailures || [], run.presentations || [], { resetUnsupported: run.presentationTracking === true, exposures });
      }
    } catch (failure) { if (hasWithdrawnQuestions) contentUnavailable = true; else if (failure.code === 'mock_fresh_capacity') capacityUnavailable = true; else mediaUnavailable = true; }
  }
  const adaptationNeeded = Boolean(adaptivePlan && !sameLiteracyMockPlan(adaptivePlan, run.plan));
  useEffect(() => {
    if (!adaptationNeeded || (!connected && !deviceReady) || (mock?.capabilities?.offlineDelivery && !deviceReady) || pending || busy || error || adaptRef.current === run.revision) return;
    adaptRef.current = run.revision;
    void mutate({ requestId: requestId(), expectedRevision: run.revision, plan: adaptivePlan, response: null });
  });
  const clockFinished = mock?.state === 'running' && Date.parse(mock.deadline_at) <= now + clockOffset;
  const finished = mock?.state === 'completed' || run?.status === 'completed';
  const itemIndex = run?.responses?.length || 0;
  const item = bank?.find(candidate => candidate.id === run?.plan?.itemIds?.[itemIndex]);
  const allTutorials = bank ? Object.values(literacyMockTutorialIdsForVersion(contentVersion)).map(id => bank.find(candidate => candidate.id === id)).filter(Boolean) : [];
  const tutorials = bank ? selectLiteracyMockTutorials(bank, literacyMockTutorialIdsForVersion(contentVersion), mock, controlReadiness) : [];
  const reminder = reminderId && allTutorials.find(value => value.id === reminderId);
  const tutorial = reminder || (soundChecked && !run && !ready ? tutorials[tutorialIndex] : null);
  async function finishTutorial(response) {
    if (response.responseStatus !== 'answered') { setTutorialMessage('Ask your teacher to check the sound and pictures, then try again.'); return; }
    if (!scoreLiteracyMockResponse(tutorial, response.selected)) { setTutorialMessage('Look at the example above, then try the buttons again.'); return; }
    recordLiteracyMockReadiness(studentId, tutorial.format);
    try { removeAssessmentDraft(`lp-mock-selection:warmup:${sessionId}:${studentId}:${tutorial.id}`); } catch { /* unscored practice only */ }
    setTutorialMessage('');
    if (reminder) { setReminderId(null); return; }
    if (tutorialIndex + 1 === tutorials.length) await register();
    else setTutorialIndex(value => value + 1);
  }
  const stopped = mock?.state !== 'running' || finished || clockFinished || (!connected && !deviceReady) || Boolean(mock?.collection_id) || (deviceReady && Date.parse(boxState?.serverRun.offlineLeaseExpiresAt) <= now + clockOffset) || (mock?.capabilities?.offlineDelivery && !deviceReady);
  const withdrawnPendingRequest = containsWithdrawnRequest(pending, itemIndex);
  const contentReviewBlocked = hasWithdrawnQuestions && (contentUnavailable || mediaUnavailable || Boolean(error) || !adaptationNeeded)
    || withdrawnPendingRequest && !busy && !mock?.capabilities?.contentQuarantineRepair;
  const contentReviewState = <><h2>Ask your teacher.</h2><p role="alert" data-child-instruction>A question is being checked. Your saved answers are safe.</p><p data-child-progress>{itemIndex} questions finished</p><button type="button" className="literacy-mock-next" data-child-primary onClick={retryRejected}>Try again</button></>;
  let stateContent;
  if (bankError) stateContent = <><p role="alert" data-child-instruction>{bankError}</p><button type="button" className="literacy-mock-next" data-child-primary onClick={reloadBank}>Try again</button></>;
  else if (loading || !bank) stateContent = <p role="status">Getting your questions…</p>;
  else if (pending && contentReviewBlocked && !mock?.capabilities?.contentQuarantineRepair) stateContent = contentReviewState;
  else if (deviceError) stateContent = <><h2>Ask your teacher.</h2><p role="alert">{deviceError}</p></>;
  else if (pending) stateContent = <><p data-child-instruction>{busy ? 'Saving your work…' : 'Your work is waiting to save.'}</p><button className="literacy-mock-next" type="button" disabled={busy} data-child-primary onClick={() => mutate()}>Try again</button></>;
  else if (!connected && !deviceReady) stateContent = <><p data-child-instruction>Ask your teacher to check the connection.</p><button className="literacy-mock-next" type="button" data-child-primary onClick={refresh}>Try again</button></>;
  else if (finished) stateContent = <><CheckCircle size={64} aria-hidden="true"/><h2>All done. Thank you!</h2><p data-child-instruction>{boxState?.requests.length ? 'Your answers are saved on this iPad. Wait for your teacher.' : 'Your answers are saved. Wait for your teacher.'}</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (mock?.collection_id) stateContent = <><h2>All done. Thank you!</h2><p data-child-instruction>Your teacher is collecting your answers. Leave this iPad open.</p></>;
  else if (run && mock?.capabilities?.offlineDelivery && !deviceReady) stateContent = <p role="status">Getting your questions ready on this iPad…</p>;
  else if (deviceReady && Date.parse(boxState?.serverRun.offlineLeaseExpiresAt) <= now + clockOffset) stateContent = <><h2>Ask your teacher.</h2><p>Your answers are safe on this iPad. This assessment session has ended.</p></>;
  else if (clockFinished) stateContent = <><p data-child-instruction>Checking with your teacher…</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (!run && !ready && !soundChecked) stateContent = <MockSoundCheck disabled={!mock || busy} onReady={() => { setSoundChecked(true); if (!tutorials.length) void register(); }}/>;
  else if (tutorial && !run) stateContent = null;
  else if (!run) stateContent = <><p data-child-instruction>Getting your questions ready.</p>{!busy && <button className="literacy-mock-next" type="button" data-child-primary onClick={register}>Try again</button>}</>;
  else if (mock?.state === 'prepared') stateContent = <><h2>You’re ready.</h2><p data-child-instruction>Wait for your teacher to start.</p><p data-child-progress>Sound and buttons checked</p></>;
  else if (mock?.state === 'paused') stateContent = <><h2>Time for a break.</h2><p data-child-instruction>Wait for your teacher to carry on.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (contentReviewBlocked) stateContent = contentReviewState;
  else if (capacityUnavailable) stateContent = <><h2>Ask your teacher.</h2><p role="alert" data-child-instruction>A new question at the right difficulty is not available. Your saved answers are safe.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (mediaUnavailable) stateContent = <><h2>Ask your teacher.</h2><p role="alert" data-child-instruction>The pictures or sounds for these questions are not available. Your saved answers are safe.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (adaptationNeeded) stateContent = <p role="status">Getting the next question…</p>;
  else if (!item) stateContent = <p role="alert">This question needs an update. Ask your teacher to reload.</p>;
  return <main className="literacy-mock" data-child-surface="literacy-mock" aria-busy={loading || busy}>
    <div className="literacy-mock-canvas">
      <header className="literacy-mock-header"><h1 data-child-title>Adaptive Literacy Test</h1><span>Reading &amp; language</span></header>
      {error && !contentReviewBlocked && <div className="literacy-mock-error" role="alert">{error}{!pending && <button type="button" onClick={retryRejected}>Try again</button>}</div>}
      {stateContent ? <div className="literacy-mock-state">{stateContent}</div> : tutorial ? <LiteracyMockQuestion key={tutorial.id} item={tutorial} seed={`warmup:${sessionId}:${studentId}`} index={Math.max(0, tutorials.indexOf(tutorial))} total={reminder ? null : tutorials.length} studentName={studentName} studentId={studentId} resolveMedia={offlineMedia?.resolve} disabled={busy} demonstration demonstrationMessage={tutorialMessage} onSubmit={finishTutorial}/>
        : <LiteracyMockQuestion key={item.id} item={item} seed={run.plan.seed} index={itemIndex} total={run.plan.itemIds.length} studentName={studentName} studentId={studentId} resolveMedia={offlineMedia?.resolve} disabled={stopped || busy || Boolean(error)} exposure={run.presentations?.find(value => value.questionId === item.id) || getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: [...serverExposures, ...readLiteracyExposures(studentId)] }))} onPresented={() => { recordEvent(item, 'presented'); recordLiteracyExposures(studentId, [item]); }} onHelpRequest={mock?.capabilities?.supportResolution ? event => recordEvent(item, event) : undefined} helpRequest={run.helpRequests?.find(value => value.questionId === item.id)} helpPending={busy} blockPendingHelp={Boolean(mock?.capabilities?.offlineDelivery)} legacyHelpEnabled={!LITERACY_MOCK_EVIDENCE_VERSIONS.includes(contentVersion)} onMechanicReminder={allTutorials.some(value => value.format === item.format) ? () => { setTutorialMessage(''); setReminderId(allTutorials.find(value => value.format === item.format).id); } : undefined} onSubmit={submit}/>}
    </div>
  </main>;
}

export function LiteracyMockPage(props) {
  return <OwnedLiteracyMockPage key={`${props.studentId}:${props.token}:${props.focusSession?.id}`} {...props}/>;
}
