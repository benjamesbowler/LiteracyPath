import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveTeacherAccountSchool,
  validateTeacherAccountDecision
} from "../../src/appState/adminAccountDecision.js";

const adminSource = readFileSync(
  new URL("../../src/components/AdminDashboardPage.jsx", import.meta.url),
  "utf8"
);
const controllerSource = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);
const appSurfaceSource = readFileSync(
  new URL("../../src/components/AppSurface.jsx", import.meta.url),
  "utf8"
);

const school = { id: "school-1", name: "Riverside Primary" };
const account = {
  id: "account-1",
  school_id: school.id,
  email: "teacher@example.com"
};

test("approval is impossible until the teacher's saved school resolves", () => {
  assert.equal(resolveTeacherAccountSchool(account, [school]), school);
  assert.equal(resolveTeacherAccountSchool(account, []), null);
  assert.deepEqual(
    validateTeacherAccountDecision({
      account: { ...account, school_id: "missing" },
      schools: [school],
      status: "approved"
    }),
    {
      ok: false,
      errorMessage: "Choose or resolve this teacher's school before approving access."
    }
  );
  assert.deepEqual(
    validateTeacherAccountDecision({
      account,
      schools: [school],
      status: "approved"
    }),
    {
      ok: true,
      reason: "",
      school
    }
  );
});

test("rejection and disable require a concise stored reason", () => {
  for (const status of ["rejected", "disabled"]) {
    assert.equal(
      validateTeacherAccountDecision({
        account,
        schools: [school],
        status,
        reason: " no "
      }).ok,
      false
    );
    assert.deepEqual(
      validateTeacherAccountDecision({
        account,
        schools: [school],
        status,
        reason: "  School employment could not be confirmed.  "
      }),
      {
        ok: true,
        reason: "School employment could not be confirmed.",
        school
      }
    );
  }
  assert.equal(
    validateTeacherAccountDecision({
      account,
      schools: [school],
      status: "rejected",
      reason: "x".repeat(501)
    }).ok,
    false
  );
});

test("review UI confirms, single-flights, retries failures and keeps reviewed details", () => {
  assert.match(adminSource, /<TeacherDialog[\s\S]*busy=\{accountDecisionBusy\}/);
  assert.match(adminSource, /if \(!accountDecision \|\| accountDecisionBusy\) return/);
  assert.match(adminSource, /result\?\.errorMessage \|\| "The decision was not saved\. Try again\."/);
  assert.match(adminSource, /finally \{\s*setAccountDecisionBusy\(false\)/);
  assert.match(adminSource, /account\.rejection_reason/);
  assert.match(adminSource, /School not resolved — approval blocked/);
  assert.match(
    controllerSource,
    /p_rejection_reason:\s*normalizedStatus === "approved"[\s\S]*?: normalizedReason/
  );
  assert.match(controllerSource, /return \{\s*ok: true,\s*account: updatedAccount/);
});

test("pending, rejected and disabled account gates have independent teacher copy", () => {
  assert.match(appSurfaceSource, /Account awaiting approval/);
  assert.match(appSurfaceSource, /Account request rejected/);
  assert.match(appSurfaceSource, /Account disabled/);
  assert.match(appSurfaceSource, /Administrator note:/);
  assert.doesNotMatch(appSurfaceSource, /status === "rejected" \|\| status === "disabled"/);
});
