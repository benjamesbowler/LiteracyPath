import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  awaitCurrentAccountAccessStage,
  isCurrentAccountAccessCheck,
  resolveCurrentAdminStatusCheck
} from "../../src/appState/accountAccessCheck.js";

const CURRENT_IDENTITY = {
  checkSequence: 7,
  checkedUserId: "teacher-b",
  activeSequence: 7,
  activeCheckUserId: "teacher-b",
  authenticatedUserId: "teacher-b"
};

test("an admin result belongs only to the matching request and authenticated account", () => {
  assert.equal(isCurrentAccountAccessCheck(CURRENT_IDENTITY), true);
  assert.equal(
    isCurrentAccountAccessCheck({
      ...CURRENT_IDENTITY,
      activeSequence: 8
    }),
    false,
    "a superseded request sequence must not update privileged state"
  );
  assert.equal(
    isCurrentAccountAccessCheck({
      ...CURRENT_IDENTITY,
      activeCheckUserId: "teacher-a"
    }),
    false,
    "the active access check must belong to the checked account"
  );
  assert.equal(
    isCurrentAccountAccessCheck({
      ...CURRENT_IDENTITY,
      authenticatedUserId: "teacher-a"
    }),
    false,
    "the currently authenticated account must still be the checked account"
  );
});

test("a slow admin result from the previous account is discarded after an identity change", () => {
  const staleAdminResult = resolveCurrentAdminStatusCheck({
    checkSequence: 6,
    checkedUserId: "teacher-a",
    activeSequence: 7,
    activeCheckUserId: "teacher-b",
    authenticatedUserId: "teacher-b",
    data: { user_id: "teacher-a" }
  });
  const currentNonAdminResult = resolveCurrentAdminStatusCheck({
    ...CURRENT_IDENTITY,
    data: null
  });
  let publishedAdminState = false;
  const publish = result => {
    if (result.current) publishedAdminState = result.isAdmin;
  };

  assert.deepEqual(currentNonAdminResult, {
    current: true,
    isAdmin: false,
    error: null
  });
  publish(currentNonAdminResult);
  publish(staleAdminResult);

  assert.deepEqual(staleAdminResult, { current: false });
  assert.equal(
    publishedAdminState,
    false,
    "account A's late admin response must not overwrite account B's non-admin state"
  );
});

test("sign-out invalidates an otherwise matching admin request", () => {
  assert.deepEqual(
    resolveCurrentAdminStatusCheck({
      ...CURRENT_IDENTITY,
      authenticatedUserId: null,
      data: { user_id: "teacher-b" }
    }),
    { current: false }
  );
});

test("only the current admin lookup exposes its result or error for state updates", () => {
  const lookupError = new Error("app_admins unavailable");
  assert.deepEqual(
    resolveCurrentAdminStatusCheck({
      ...CURRENT_IDENTITY,
      data: { user_id: "teacher-b" }
    }),
    {
      current: true,
      isAdmin: true,
      error: null
    }
  );
  assert.deepEqual(
    resolveCurrentAdminStatusCheck({
      ...CURRENT_IDENTITY,
      data: { user_id: "teacher-b" },
      error: lookupError
    }),
    {
      current: true,
      isAdmin: false,
      error: lookupError
    }
  );
  assert.deepEqual(
    resolveCurrentAdminStatusCheck({
      ...CURRENT_IDENTITY,
      data: { user_id: "teacher-a" }
    }),
    {
      current: true,
      isAdmin: false,
      error: null
    },
    "an admin row for a different account must not grant access"
  );
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("a delayed administrator profile read is discarded after the account changes", async () => {
  const heldProfile = deferred();
  const active = {
    activeSequence: 7,
    activeCheckUserId: "teacher-b",
    authenticatedUserId: "teacher-b"
  };
  const stagePromise = awaitCurrentAccountAccessStage({
    checkSequence: 7,
    checkedUserId: "teacher-b",
    read: () => heldProfile.promise,
    getActiveIdentity: () => active
  });

  active.activeSequence = 8;
  active.activeCheckUserId = "teacher-c";
  active.authenticatedUserId = "teacher-c";
  heldProfile.resolve({
    data: { user_id: "teacher-b", school_id: "school-b" },
    error: null
  });

  assert.deepEqual(await stagePromise, { current: false });
});

test("a delayed pending-account upsert is discarded after sign-out", async () => {
  const heldUpsert = deferred();
  const active = {
    activeSequence: 7,
    activeCheckUserId: "teacher-b",
    authenticatedUserId: "teacher-b"
  };
  const stagePromise = awaitCurrentAccountAccessStage({
    checkSequence: 7,
    checkedUserId: "teacher-b",
    read: () => heldUpsert.promise,
    getActiveIdentity: () => active
  });

  active.authenticatedUserId = "";
  heldUpsert.resolve({
    data: {
      user_id: "teacher-b",
      status: "pending",
      approval_status: "pending"
    },
    error: null
  });

  assert.deepEqual(await stagePromise, { current: false });
});

test("the asynchronous admin lookup remains side-effect-free until identity validation", () => {
  const controller = fs.readFileSync("src/appState/useAppSessionController.js", "utf8");
  const lookup = controller.slice(
    controller.indexOf("async function checkAdminStatus"),
    controller.indexOf("function normalizeApprovalStatus")
  );
  const initialization = controller.slice(
    controller.indexOf("async function initializeTeacherAccountAccess"),
    controller.indexOf("function buildTeacherRows")
  );

  assert.doesNotMatch(lookup, /setIsAdmin|setAdminStatusError/);
  assert.match(initialization, /resolveCurrentAdminStatusCheck/);
  assert.match(initialization, /awaitCurrentAccountAccessStage/);
  assert.match(initialization, /authenticatedUserId:\s*lastAuthUserIdRef\.current/);
  assert.ok(
    initialization.indexOf("if (!adminCheck.current) return;")
      < initialization.indexOf("setIsAdmin(adminCheck.isAdmin)"),
    "the stale-result guard must run before privileged state is updated"
  );
});
