import { BrowserWorker } from '../helpers/campaignBrowserWorker.js';
import { decodeCampaignTransport } from '../../src/utils/campaignTransport.js';
import { encodeProgressStorage, decodeProgressStorage } from '../../src/utils/progressStorageCodec.js';
import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence } from "../../src/features/soundSeekers/v3/engine/campaignProgress.js";
import assert from "node:assert/strict";
import test from "node:test";

import {
  clearProgressSyncSession,
  configureProgressSync,
  queueProgressSave,
  flushQueuedProgressWrites,
  fetchStudentCloudProgress,
  hydrateCloudProgress,
  clearLocalProgressForStudent,
  inspectLocalProgressForStudent
} from "../../src/utils/progressSync.js";
import {
  clearElQuestLocalProgress,
  readElQuestLocalProgress
} from "../../src/utils/adventureMapLocalProgress.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { localProgressStorageKey } from "../../src/utils/progressKeys.js";

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(String(key));
    }
  };
}

function progressClient(rows) {
  return {
    async call(name, args) {
      assert.equal(name, "student_get_progress");
      assert.ok(args.p_token);
      return { data: rows, error: null };
    }
  };
}

function mutableProgressClient(initialRows) {
  let rows = structuredClone(initialRows);
  return {
    async call(name, args) {
      if (name === "student_get_progress") {
        assert.ok(args.p_token);
        return { data: structuredClone(rows), error: null };
      }
      assert.equal(name, "student_save_progress");
      assert.ok(args.p_token);
      const next = {
        area: args.p_area,
        key: args.p_key,
        payload: structuredClone(args.p_payload)
      };
      const index = rows.findIndex(row => row.area === next.area && row.key === next.key);
      if (index >= 0) rows[index] = next;
      else rows.push(next);
      return { data: { ok: true }, error: null };
    },
    rows() {
      return structuredClone(rows);
    }
  };
}

function installHydrationBrowser(t) {
  const storage = memoryStorage();
  const events = [];
  const previousWindow = globalThis.window;
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window = {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent(event) {
      events.push(event);
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {}
  };
  t.after(() => {
    clearProgressSyncSession();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
  });
  return { storage, events };
}

test("student progress reads can use the session's validated client", async () => {
  const rows = [{ area: "el_quest", key: "__all__", payload: { cycles: {} } }];
  const result = await fetchStudentCloudProgress({
    mode: "student",
    studentId: "client-seam",
    token: "test-token",
    client: progressClient(rows)
  });
  assert.deepEqual(result, rows);
});

test("real hydration preserves future Adventure progress as exact opaque bytes", async t => {
  const { storage, events } = installHydrationBrowser(t);

  const cases = [
    {
      studentId: "future-schema-hydrate",
      raw: '{\n  "futureOnly" : { "checkpoint" : "keep-schema-bytes" },\n  "cycles" : {},\n  "progressEpoch" : 2,\n  "schemaVersion" : 99\n}'
    },
    {
      studentId: "future-epoch-hydrate",
      raw: '{ "cycles" : { }, "schemaVersion" : 2, "futureOnly" : true, "progressEpoch" : 99 }'
    }
  ];

  for (const fixture of cases) {
    const storageKey = localProgressStorageKey("el_quest", fixture.studentId);
    storage.setItem(storageKey, fixture.raw);
    const rows = [{
      area: "el_quest",
      key: "__all__",
      payload: {
        schemaVersion: 2,
        progressEpoch: 2,
        cycles: { "cycle-1": { stars: 3 } }
      }
    }];

    const hydrated = await hydrateCloudProgress({
      mode: "student",
      studentId: fixture.studentId,
      studentName: "Test learner",
      token: "test-token",
      client: progressClient(rows)
    });

    assert.deepEqual(hydrated, rows);
    assert.equal(storage.getItem(storageKey), fixture.raw);
    const hydratedEvent = events.find(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === fixture.studentId
    ));
    assert.ok(hydratedEvent);
    assert.deepEqual(hydratedEvent.detail.rows, rows);
  }
});

test("real hydration preserves unreadable current Adventure bytes until scoped recovery", async t => {
  const { storage, events } = installHydrationBrowser(t);
  const raws = [
    "{not json",
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : null }',
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : [] }'
  ];

  for (const [index, raw] of raws.entries()) {
    const studentId = `malformed-local-hydrate-${index}`;
    const storageKey = localProgressStorageKey("el_quest", studentId);
    storage.setItem(storageKey, raw);
    const rows = [{
      area: "el_quest",
      key: "__all__",
      payload: {
        schemaVersion: 2,
        progressEpoch: 2,
        cycles: { "cycle-1": { stars: 3 } }
      }
    }];

    await hydrateCloudProgress({
      mode: "student",
      studentId,
      token: "test-token",
      client: progressClient(rows)
    });

    assert.equal(storage.getItem(storageKey), raw);
    assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });
    assert.ok(events.some(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === studentId
    )));
  }
});

test("real hydration materialises malformed current cloud cycles for recovery", async t => {
  const { storage, events } = installHydrationBrowser(t);
  const cases = [
    { studentId: "malformed-cloud-null", cycles: null },
    { studentId: "malformed-cloud-array", cycles: [] }
  ];

  for (const fixture of cases) {
    const payload = {
      schemaVersion: 2,
      progressEpoch: 2,
      cycles: fixture.cycles
    };
    const rows = [{ area: "el_quest", key: "__all__", payload }];
    const storageKey = localProgressStorageKey("el_quest", fixture.studentId);

    await hydrateCloudProgress({
      mode: "student",
      studentId: fixture.studentId,
      token: "test-token",
      client: progressClient(rows)
    });

    assert.equal(storage.getItem(storageKey), JSON.stringify(payload));
    assert.deepEqual(readElQuestLocalProgress(fixture.studentId), { ok: false, value: {} });
    assert.ok(events.some(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === fixture.studentId
    )));
  }
});

test("scoped recovery replaces malformed cloud with canonical v2 before a clean rehydrate", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-malformed-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const canonical = { schemaVersion: 2, progressEpoch: 2, cycles: {} };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: { schemaVersion: 2, progressEpoch: 2, cycles: null }
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);

  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });

  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.equal(storage.getItem(storageKey), JSON.stringify(canonical));
  let queued = readProgressQueueRecords(storage).filter(record => (
    record.entry.studentId === studentId
    && record.entry.area === "el_quest"
    && record.entry.key === "__all__"
  ));
  assert.equal(queued.length, 1);
  assert.deepEqual(queued[0].entry.payload, canonical);

  await hydrateCloudProgress(session);
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: canonical }]);
  storage.removeItem(storageKey);
  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: canonical });
  queued = readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId);
  assert.equal(queued.length, 0);
});

test("scoped recovery folds valid cached cloud progress forward instead of erasing it", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-valid-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const valid = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "cycle-4": { stars: 3, stations: { letters: true } } }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: valid
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });
  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), valid);
  const [queued] = readProgressQueueRecords(storage).filter(record => (
    record.entry.studentId === studentId && record.entry.area === "el_quest"
  ));
  assert.deepEqual(queued.entry.payload, valid);

  await hydrateCloudProgress(session);
  storage.removeItem(storageKey);
  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: valid });
});

test("a valid cloud row wins when recovery is clicked before initial hydration finishes", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-during-hydration";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const valid = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "cycle-7": { stars: 2, stations: { story: true } } }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: valid
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {}
  });
  assert.equal(
    readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId).length,
    1
  );
  await hydrateCloudProgress(session);

  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: valid });
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: valid }]);
});

test("scoped recovery materialises cached future cloud progress without queuing a downgrade", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-future-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const future = {
    schemaVersion: 9,
    progressEpoch: 2,
    cycles: { "cycle-8": { stars: 3 } },
    futureOnly: { checkpoint: "keep" }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: future
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  await hydrateCloudProgress(session);
  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), future);
  assert.deepEqual(readElQuestLocalProgress(studentId), {
    ok: false,
    reason: "unsupported_version",
    value: {}
  });
  assert.equal(
    readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId).length,
    0
  );
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: future }]);
});


test("campaign hydration targets only its v3 key and leaves the legacy journey and other learners intact", async t => {
  const { storage } = installHydrationBrowser(t);
  const progress = normalizeCampaignProgress(null);
  progress.hero = "bouncy";
  progress.updatedAt = 10;
  storage.setItem("lp-quest:campaign-child", JSON.stringify({ v: 1, trail: { stopsDone: ["s1"] } }));
  storage.setItem("lp-quest:other-child:v3:campaign-v1", "other-learner-original");
  const rows = [{ area: "phonics_quest", key: "sound_seekers_v3", payload: progress }];
  await hydrateCloudProgress({ mode: "student", studentId: "campaign-child", token: "test-token", client: progressClient(rows) });
  assert.equal(JSON.parse(storage.getItem("lp-quest:campaign-child:v3:campaign-v1")).hero, "bouncy");
  assert.equal(JSON.parse(storage.getItem("lp-quest:campaign-child")).v, 1);
  assert.equal(storage.getItem("lp-quest:other-child:v3:campaign-v1"), "other-learner-original");
});

test("campaign hydration preserves malformed and future local bytes rather than replacing them", async t => {
  const { storage } = installHydrationBrowser(t);
  for (const [index, bytes] of ["{broken", JSON.stringify({ v: 99 }), JSON.stringify({ v: 3, campaign: { v: 99, opaque: true } })].entries()) {
    const studentId = `campaign-preserve-${index}`;
    storage.setItem(`lp-quest:${studentId}:v3:campaign-v1`, bytes);
    const rows = [{ area: "phonics_quest", key: "sound_seekers_v3", payload: normalizeCampaignProgress(null) }];
    await hydrateCloudProgress({ mode: "student", studentId, token: "test-token", client: progressClient(rows) });
    assert.equal(storage.getItem(`lp-quest:${studentId}:v3:campaign-v1`), bytes);
  }
});

test("campaign reset and privacy cleanup removes both learner versions without touching another account", t => {
  const { storage } = installHydrationBrowser(t);
  storage.setItem("lp-quest:remove-campaign", "legacy");
  storage.setItem("lp-quest:remove-campaign:v3:campaign-v1", "campaign");
  for(const suffix of [":position-v1",":live-v1"])storage.setItem("lp-quest:remove-campaign:v3:campaign-v1"+suffix,"private journal");
  storage.setItem("lp-quest:keep-campaign:v3:campaign-v1", "keep");
  clearLocalProgressForStudent("remove-campaign", { storage });
  assert.equal(storage.getItem("lp-quest:remove-campaign"), null);
  assert.equal(storage.getItem("lp-quest:remove-campaign:v3:campaign-v1"), null);
  for(const suffix of [":position-v1",":live-v1"])assert.equal(storage.getItem("lp-quest:remove-campaign:v3:campaign-v1"+suffix),null);
  assert.equal(storage.getItem("lp-quest:keep-campaign:v3:campaign-v1"), "keep");
  assert.equal(inspectLocalProgressForStudent("remove-campaign", { storage }).residualCount, 0);
});


test("a fresh device retains a future campaign cloud payload for explicit recovery", async t => {
  const { storage } = installHydrationBrowser(t);
  const payload = { v: 3, campaign: { v: 99, futureState: ["keep"] } };
  const rows = [{ area: "phonics_quest", key: "sound_seekers_v3", payload }];
  await hydrateCloudProgress({ mode: "student", studentId: "future-campaign-cloud", token: "test-token", client: progressClient(rows) });
  assert.deepEqual(JSON.parse(storage.getItem("lp-quest:future-campaign-cloud:v3:campaign-v1")), payload);
});


test("campaign hydration folds cloud evidence into pending writes before the existing queue flush", async t => {
  const { storage } = installHydrationBrowser(t);
  const catalog = { stages: [{ id: "stage" }], missions: [{ id: "mission", stageId: "stage" }] };
  const base = beginCampaignMission(normalizeCampaignProgress(null), "mission", { attemptId: "attempt", challenges: [{ id: "beat" }], beatState: {} }, catalog, 1);
  const response = id => recordCampaignEvidence(base, "mission", { id, attemptId: "attempt", targetIds: ["gpc-a"], independent: true }, catalog, 2);
  const studentId = "campaign-queued-hydrate";
  const client = mutableProgressClient([{ area: "phonics_quest", key: "sound_seekers_v3", payload: response("remote") }]);
  const session = { mode: "student", studentId, token: "campaign-queue-test-token", client };
  configureProgressSync(session);
  assert.equal(queueProgressSave("phonics_quest", "sound_seekers_v3", response("local"), { scopeKey: studentId }), true);
  await hydrateCloudProgress(session);
  const stored = JSON.parse(storage.getItem(`lp-quest:${studentId}:v3:campaign-v1`));
  assert.equal(stored.evidence.length, 1); // only cloud existed locally before hydration
  const uploaded = decodeCampaignTransport(client.rows().find(row => row.key === "sound_seekers_v3").payload);
  assert.deepEqual(uploaded.evidence.map(event => event.id).sort(), ["local", "remote"]);
  assert.equal(uploaded.targets["gpc-a"].independent, 2);
  assert.equal(readProgressQueueRecords(storage).length, 0);
});


test('compressed campaign hydration stays lossless and learner cleanup retains other compressed cached rows', async t => {
  const { storage } = installHydrationBrowser(t);
  const progress=normalizeCampaignProgress(null);
  progress.evidence=Array.from({length:2500},(_,i)=>({legacyItem:i,heard:'a recorded campaign word',independent:false}));
  const row={area:'phonics_quest',key:'sound_seekers_v3',payload:progress};
  storage.setItem('lp-cloud-progress-rows-v1',encodeProgressStorage({'keep-compressed':[row]}));
  const studentId='compressed-hydrate';
  await hydrateCloudProgress({mode:'student',studentId,token:'compressed-hydration-test',client:progressClient([row])});
  const encoded=storage.getItem(`lp-quest:${studentId}:v3:campaign-v1`);
  assert.ok(encoded.startsWith('lp-progress-gzip-'));
  assert.deepEqual([...decodeProgressStorage(encoded).evidence].sort((a,b)=>a.legacyItem-b.legacyItem),progress.evidence);
  const cache=decodeProgressStorage(storage.getItem('lp-cloud-progress-rows-v1'));
  assert.deepEqual(cache['keep-compressed'][0].payload,progress);
  clearLocalProgressForStudent(studentId,{storage});
  assert.deepEqual(decodeProgressStorage(storage.getItem('lp-cloud-progress-rows-v1'))['keep-compressed'][0].payload,progress);
  assert.equal(inspectLocalProgressForStudent(studentId,{storage}).residualCount,0);
});


test('campaign transport uses actual success ACKs; failure retries a complete body without crossing learners',async t=>{
  installHydrationBrowser(t);
  const uploads=[];let fail=false;
  const client={call:async(name,args)=>{assert.equal(name,'student_save_progress');uploads.push(args.p_payload);return fail?{data:{ok:false,error:'try_again'}}:{data:{ok:true},error:null};}};
  const scope='ack-campaign',session={studentId:scope,mode:'student',token:'test-session',client};configureProgressSync(session);
  const catalog={stages:[{id:'stage'}],missions:[{id:'mission',stageId:'stage'}]};
  const base=beginCampaignMission(normalizeCampaignProgress(null),'mission',{attemptId:'attempt',challenges:[{id:'beat'}],beatState:{}},catalog,1);
  const response=(p,id)=>recordCampaignEvidence(p,'mission',{id,attemptId:'attempt',targetIds:['gpc-a'],independent:true},catalog,2);
  const first=response(base,'one');queueProgressSave('phonics_quest','sound_seekers_v3',first,{scopeKey:scope});await flushQueuedProgressWrites(session);
  assert.equal(uploads[0]._campaignDelta,undefined);
  const second=response(first,'two');queueProgressSave('phonics_quest','sound_seekers_v3',second,{scopeKey:scope});fail=true;await flushQueuedProgressWrites(session);
  assert.equal(uploads[1]._campaignDelta.v,1);assert.equal(uploads[1].evidence.length,1);
  fail=false;await flushQueuedProgressWrites(session);assert.equal(uploads[2]._campaignDelta,undefined);assert.equal(uploads[2].evidence.length,2);
  configureProgressSync({...session,studentId:'other'});queueProgressSave('phonics_quest','sound_seekers_v3',second,{scopeKey:'other'});await flushQueuedProgressWrites({...session,studentId:'other'});assert.equal(uploads.at(-1)._campaignDelta,undefined);
});


test('browser worker queue acknowledges exact scope and a reset prevents an in-flight worker from recreating deleted data',async t=>{
  const {storage}=installHydrationBrowser(t);const oldWorker=globalThis.Worker;globalThis.Worker=BrowserWorker;t.after(()=>{clearProgressSyncSession();globalThis.Worker=oldWorker;});
  const sent=[],client={call:async(name,args)=>{assert.equal(name,'student_save_progress');sent.push(args.p_payload);return{data:{ok:true},error:null};}};
  const scope='worker-scope',session={studentId:scope,mode:'student',token:'worker-test-token',client};configureProgressSync(session);
  const catalog={stages:[{id:'stage'}],missions:[{id:'mission',stageId:'stage'}]};
  const p=beginCampaignMission(normalizeCampaignProgress(null),'mission',{attemptId:'attempt',challenges:[{id:'beat'}],beatState:{}},catalog,1);
  assert.equal(await queueProgressSave('phonics_quest','sound_seekers_v3',p,{scopeKey:scope}),true);
  await flushQueuedProgressWrites(session);assert.equal(sent.length,1);assert.equal(readProgressQueueRecords(storage).length,0);
  const pending=queueProgressSave('phonics_quest','sound_seekers_v3',{...p,updatedAt:2},{scopeKey:scope});
  clearLocalProgressForStudent(scope,{storage,blockFutureWrites:true});
  assert.equal(await pending,false);assert.equal(readProgressQueueRecords(storage).length,0);assert.equal(sent.length,1);
  assert.equal(inspectLocalProgressForStudent(scope,{storage}).residualCount,0);
});
