import assert from "node:assert/strict";
import test from "node:test";

import {
  CAPABILITIES,
  CONTENT_SCOPES,
  DEFAULT_PLAN_ID,
  PLAN_IDS,
  PLANS,
  can,
  demoEntitlement,
  hasFullContent,
  learnerSlotsFor,
  mayPersist,
  planFor,
  resolveEntitlement
} from "../../src/policy/entitlementPolicy.js";
import {
  createMemoryStorage,
  installEphemeralStorage,
  realStorageKeysWritten,
  resetEphemeralStorage
} from "../../src/policy/ephemeralSession.js";
import {
  createValidatedSupabaseClient,
  isEphemeralNetworkMode,
  setEphemeralNetworkMode
} from "../../src/data/boundaries/facade.js";

/* ------------------------------------------------------------------ *
 * The layer changes nothing for anyone who exists today
 * ------------------------------------------------------------------ */

test("an account with no entitlement row keeps full access", () => {
  // Every account in the product today is a school teacher and the table is
  // empty. A resolver that failed closed would lock real classrooms out of a
  // product they are already using.
  const entitlement = resolveEntitlement(null);
  assert.equal(entitlement.planId, PLAN_IDS.SCHOOL);
  assert.equal(entitlement.source, "default");
  for (const capability of CAPABILITIES) {
    assert.equal(can(entitlement, capability), true, `${capability} should be allowed`);
  }
  assert.equal(learnerSlotsFor(entitlement), null);
  assert.equal(hasFullContent(entitlement), true);
});

test("DEFAULT_PLAN_ID must flip to the smallest plan when the family tier ships", () => {
  // This test is a tripwire, not a preference. Failing open is right ONLY while
  // every account is a school teacher. The day a family account can exist, an
  // account with no row is a bug rather than a backlog item, and the safe
  // default becomes the smallest plan. Change the constant and this fails —
  // which is the point, because the alternative is nobody remembering.
  assert.equal(DEFAULT_PLAN_ID, PLAN_IDS.SCHOOL);
  assert.equal(
    PLANS[PLAN_IDS.SCHOOL].capabilities.persistProgress,
    true,
    "the fail-open default must never be a plan that withholds persistence"
  );
});

test("an unknown or malformed plan id falls back rather than throwing", () => {
  for (const bad of ["", null, undefined, "enterprise", 42, {}]) {
    assert.equal(resolveEntitlement({ plan_id: bad }).planId, DEFAULT_PLAN_ID);
  }
  assert.equal(planFor("nonsense").id, DEFAULT_PLAN_ID);
});

test("an expired entitlement falls back to the default, it does not revoke access", () => {
  const expired = resolveEntitlement(
    { plan_id: PLAN_IDS.FAMILY_PAID, ends_at: "2026-01-01T00:00:00.000Z" },
    { now: "2026-08-07T00:00:00.000Z" }
  );
  // Losing access mid-lesson because a date passed is a worse failure than a
  // lapsed plan staying open until somebody notices.
  assert.equal(expired.expired, true);
  assert.equal(expired.planId, DEFAULT_PLAN_ID);

  const live = resolveEntitlement(
    { plan_id: PLAN_IDS.FAMILY_PAID, ends_at: "2027-01-01T00:00:00.000Z" },
    { now: "2026-08-07T00:00:00.000Z" }
  );
  assert.equal(live.expired, false);
  assert.equal(live.planId, PLAN_IDS.FAMILY_PAID);
});

/* ------------------------------------------------------------------ *
 * The try-mode
 * ------------------------------------------------------------------ */

test("the anonymous try-mode may not persist, sync, report, export or be ranked", () => {
  const demo = demoEntitlement();
  assert.equal(demo.planId, PLAN_IDS.DEMO_TRY);
  assert.equal(demo.ephemeral, true);
  assert.equal(mayPersist(demo), false);

  for (const capability of CAPABILITIES) {
    assert.equal(can(demo, capability), false, `${capability} must be denied in try-mode`);
  }
  // Zero, not null. Null would mean unlimited.
  assert.equal(learnerSlotsFor(demo), 0);
  assert.equal(demo.contentScope, CONTENT_SCOPES.SAMPLE);
});

test("the leaderboard is off in try-mode, and that is not only about persistence", () => {
  // get_game_leaderboard is anon-callable and returns other children's display
  // names. Even a mode that stored nothing of its own would be reading other
  // people's data.
  assert.equal(can(demoEntitlement(), "leaderboard"), false);
});

test("reporting stays out of every family plan", () => {
  // Reporting is the school product. Giving it away would be giving away the
  // half that is actually sold.
  for (const planId of [PLAN_IDS.FAMILY_FREE, PLAN_IDS.FAMILY_PAID, PLAN_IDS.DEMO_TRY]) {
    assert.equal(PLANS[planId].capabilities.reporting, false, `${planId} must not get reporting`);
  }
  assert.equal(PLANS[PLAN_IDS.SCHOOL].capabilities.reporting, true);
});

test("an unknown capability name is denied rather than allowed", () => {
  const school = resolveEntitlement(null);
  assert.equal(can(school, "somethingNobodyDefined"), false);
  assert.equal(can(school, ""), false);
  assert.equal(can(null, "reporting"), false);
});

/* ------------------------------------------------------------------ *
 * "Stores nothing" is provable, not promised
 * ------------------------------------------------------------------ */

test("ephemeral storage catches every writer without any of them knowing", () => {
  resetEphemeralStorage();
  // Stands in for the browser's real localStorage. 45 files in this codebase
  // write to it directly; the point of swapping the object rather than editing
  // them is that the forty-sixth is covered too.
  const realStorage = createMemoryStorage();
  const target = { localStorage: realStorage };

  const restore = installEphemeralStorage(target);
  assert.ok(restore, "the swap must succeed or the try-mode must not run");

  // A caller written years before ephemeral mode existed, unchanged.
  target.localStorage.setItem("lp-daily-mission:demo", JSON.stringify({ streak: 3 }));
  target.localStorage.setItem("literacyPath.guidedReadingRecords.demo", "{}");

  assert.equal(target.localStorage.getItem("lp-daily-mission:demo"), '{"streak":3}',
    "the feature must still work — it just writes somewhere that dies with the tab");
  assert.deepEqual(realStorageKeysWritten(realStorage), [],
    "NOTHING may reach real storage; this assertion is the whole claim");

  restore();
  assert.equal(target.localStorage, realStorage, "restoring must give the real object back");
  assert.deepEqual(realStorageKeysWritten(realStorage), []);
});

test("a failed storage swap is reported, never silently ignored", () => {
  // A demo that quietly fell back to real storage would be collecting data from
  // a child while telling them it was not. The caller must be able to tell.
  const target = {};
  Object.defineProperty(target, "localStorage", {
    configurable: false,
    value: createMemoryStorage()
  });
  assert.equal(installEphemeralStorage(target), null);
});

test("ephemeral mode refuses every network call, loudly", () => {
  const raw = {
    auth: {},
    from: () => ({ select: () => ({}) }),
    rpc: () => ({})
  };
  const client = createValidatedSupabaseClient(raw);

  assert.equal(isEphemeralNetworkMode(), false);
  setEphemeralNetworkMode(true);
  try {
    assert.equal(isEphemeralNetworkMode(), true);

    // Reads as well as writes: a read is still a request carrying an IP address
    // from a child's browser.
    assert.throws(() => client.table("students"), /Ephemeral session/);
    assert.throws(() => client.call("student_get_progress", {}), /stores and sends nothing/);
    // Signing in is itself a collection event, and there is no account anyway.
    assert.throws(() => client.auth, /Ephemeral session/);

    // It throws rather than no-opping, so a caller cannot believe a write landed.
    assert.throws(() => client.call("student_save_progress", {}), /does not belong/);
  } finally {
    setEphemeralNetworkMode(false);
  }

  // And normal operation is completely unaffected once the mode is off.
  assert.doesNotThrow(() => client.table("students"));
});
