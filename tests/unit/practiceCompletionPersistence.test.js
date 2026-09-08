import test from "node:test";
import assert from "node:assert/strict";
import { loadPhonicsProgress, loadPhonicsProgressRecords, savePhonicsProgress, recordPhonicsCompletion } from "../../src/utils/phonicsProgress.js";
import { loadCvcProgress, loadCvcProgressRecords, saveCvcProgress, recordCvcCompletion } from "../../src/utils/cvcProgress.js";
import { mergePracticeProgressRecords } from "../../src/utils/practiceCompletionRecords.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";
import { mergeProgressQueueEntries, readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { clearProgressSyncSession, configureProgressSync, hydrateCloudProgress } from "../../src/utils/progressSync.js";
const event = (id, extra = {}) => ({ id, contentVersion: "phonics-v3", completedAt: "2026-09-08T14:00:00Z", steps: [
  { step: "trace", completionKind: "supported", audioDelivery: "delivered", firstResponse: { letter: "m" }, attempts: 2, supportUsed: ["model"], independent: false, strokeCoverages: [0.6, 0.9], responses: ["n", "m"], construct: "supported_formation" }
], ...extra });
function browser(t) {
  const values = new Map();
  const storage = { rejectRecords: false,
    get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (this.rejectRecords && /^lp_(phonics|cvc)_progress_/.test(key)) throw new Error("quota"); values.set(key, value); },
    removeItem: key => values.delete(key)
  };
  const old = { window: globalThis.window, localStorage: globalThis.localStorage };
  globalThis.localStorage = storage;
  globalThis.window = { localStorage: storage, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, setTimeout() { return 1; }, clearTimeout() {} };
  t.after(() => { clearProgressSyncSession(); globalThis.window = old.window; if (old.localStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = old.localStorage; });
  return storage;
}
for (const [area, key, prefix, load, records, save, complete] of [
  ["phonics_letters", "m", "lp_phonics_progress_", loadPhonicsProgress, loadPhonicsProgressRecords, savePhonicsProgress, recordPhonicsCompletion],
  ["cvc", "at", "lp_cvc_progress_", loadCvcProgress, loadCvcProgressRecords, saveCvcProgress, recordCvcCompletion]
]) {
  test(`${area}: public status API preserves immutable completion evidence through ordinary saves`, t => {
    browser(t);
    const original = event("first");
    complete("learner", key, original);
    original.steps[0].firstResponse.letter = "mutated";
    save("learner", { [key]: "inprogress", other: "completed" });
    assert.equal(load("learner")[key], "completed");
    assert.equal(records("learner")[key].completions[0].steps[0].firstResponse.letter, "m");
    assert.deepEqual(records("learner")[key].completions[0].steps[0].strokeCoverages, [0.6, 0.9]);
    complete("learner", key, event("first"));
    complete("learner", key, event("first", { steps: [{ independent: true, step: "trace" }] }));
    assert.equal(records("learner")[key].completions.length, 1);
    assert.equal(records("learner")[key].completions[0].steps[0].independent, false);
    assert.deepEqual(records("learner")[key].completionConflictIds, ["first"]);
    assert.equal(records("learner")[key].legacyEvidenceUnknown, false);
    assert.equal(records("learner").other.legacyEvidenceUnknown, true);
    assert.equal(complete("learner", "invalid", {}).error, "invalid_completion");
    assert.equal(load("learner").invalid, undefined);
  });
  test(`${area}: legacy completed remains navigation completion with unknown evidence`, t => {
    const storage = browser(t);
    storage.setItem(prefix + "legacy", JSON.stringify({ [key]: "completed" }));
    assert.equal(load("legacy")[key], "completed");
    assert.equal(records("legacy")[key].legacyEvidenceUnknown, true);
    assert.deepEqual(records("legacy")[key].completions, []);
    complete("legacy", key, event("new"));
    assert.equal(records("legacy")[key].legacyEvidenceUnknown, true);
  });
  test(`${area}: local record quota failure still admits full completion to cloud queue`, t => {
    const storage = browser(t);
    storage.rejectRecords = true;
    configureProgressSync({ studentId: "quota-" + area, token: "synthetic-token", mode: "student" });
    const result = complete("quota-" + area, key, event("quota"));
    assert.deepEqual(result, { localSaved: false, queued: true });
    const queued = readProgressQueueRecords(storage).find(row => row.entry.area === area);
    assert.deepEqual(queued.entry.payload.completions[0], event("quota"));
  });
  test(`${area}: actual cloud hydration keeps existing evidence and first remote ID occurrence`, async t => {
    browser(t);
    complete("cloud", key, event("local"));
    const cloud = { v: 3, status: "inprogress", completions: [event("remote"), event("remote", { contentVersion: "conflicting" }), event("local", { contentVersion: "changed" })] };
    await hydrateCloudProgress({ studentId: "cloud", mode: "student", token: "synthetic", client: { call: async () => ({ data: [{ area, key, payload: cloud }] }) } });
    const next = records("cloud")[key];
    assert.equal(next.status, "completed");
    assert.deepEqual(next.completions.map(row => [row.id, row.contentVersion]), [["local", "phonics-v3"], ["remote", "phonics-v3"]]);
    assert.deepEqual(new Set(next.completionConflictIds), new Set(["remote", "local"]));
    const fresh = computeHydratedValue(area, key, {}, cloud)[key];
    assert.equal(fresh.completions[0].contentVersion, "phonics-v3");
    const all = computeHydratedValue(area, "__all__", { [key]: next }, { [key]: cloud });
    assert.deepEqual(all[key].completions, next.completions);
  });
}
test("queue coalescing unions distinct completion IDs and cannot rewrite first-response evidence", () => {
  const entry = payload => ({ studentId: "s", area: "phonics_letters", key: "m", payload });
  const existing = entry({ v: 3, status: "completed", completions: [event("first")] });
  const incoming = entry({ v: 3, status: "inprogress", completions: [event("second"), event("first", { steps: [{ step: "trace", independent: true }] })] });
  const firstOnly = mergeProgressQueueEntries(null, { ...incoming, payload: { ...incoming.payload,
    completions: [event("first"), event("first", { contentVersion: "conflict" })] } }).payload;
  assert.equal(firstOnly.completions.length, 1);
  assert.equal(firstOnly.completions[0].contentVersion, "phonics-v3");
  const merged = mergeProgressQueueEntries(existing, incoming).payload;
  assert.equal(merged.status, "completed");
  assert.deepEqual(merged.completions.map(row => row.id), ["first", "second"]);
  assert.deepEqual(merged.completions[0], event("first"));
  assert.deepEqual(merged.completionConflictIds, ["first"]);
  assert.equal(mergePracticeProgressRecords({ status: "completed" }, { status: "default" }).legacyEvidenceUnknown, true);
});
