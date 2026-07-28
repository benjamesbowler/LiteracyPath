import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controllerSource = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);
const adminLoader = controllerSource.slice(
  controllerSource.indexOf("async function loadAdminDashboard"),
  controllerSource.indexOf("function openAdminDashboard")
);

test("admin totals page every source instead of silently using PostgREST's first page", () => {
  assert.equal(
    (adminLoader.match(/selectAllRows\(\(\) =>/g) || []).length,
    5
  );
  ["classes", "students", "answers", "pending_teacher_accounts", "schools"]
    .forEach(table => {
      assert.match(adminLoader, new RegExp(`\\.table\\("${table}"\\)`));
    });
});

test("admin totals fail closed on a paging ceiling and optional lists keep prior data", () => {
  assert.match(adminLoader, /result\.truncated/);
  assert.match(
    adminLoader,
    /No partial totals are being shown/
  );
  assert.match(
    adminLoader,
    /if \(!schoolsError\) setAdminSchools/
  );
  assert.match(
    adminLoader,
    /if \(!pendingAccountsError\) setAdminPendingAccounts/
  );
});
