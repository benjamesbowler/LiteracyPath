import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settings = readFileSync(
  new URL("../../src/components/teacher/TeacherSettingsPage.jsx", import.meta.url),
  "utf8"
);
const adminDialogs = readFileSync(
  new URL("../../src/components/teacher/TeacherAdminDialogs.jsx", import.meta.url),
  "utf8"
);

test("the option describing the current class-code expiry cannot be chosen", () => {
  // The old surface offered <option value="custom">Expiry is set</option>, which a
  // teacher could select — and selecting it removed the expiry.
  assert.doesNotMatch(settings, /<option value="custom">/);
  assert.match(settings, /<option disabled value="current">/);
});

test("the real class-code expiry date is shown to the teacher", () => {
  assert.match(settings, /function formatExpiryDate\(value\)/);
  assert.match(settings, /const selectedExpiryLabel = formatExpiryDate\(selectedExpiry\);/);
  assert.match(settings, /Stops working on \$\{selectedExpiryLabel\}/);
  assert.match(settings, /This code stops working on \$\{selectedExpiryLabel\}\./);
});

test("a non-numeric expiry choice can never be read as 'remove the expiry'", () => {
  const body = settings.slice(
    settings.indexOf("async function changeExpiry("),
    settings.indexOf("async function changeLeaderboardScope(")
  );
  assert.notEqual(body, "");

  const guardAt = body.indexOf("if (!Number.isFinite(dayCount) || dayCount < 0) return;");
  const expiresAt = body.indexOf("const expiresAt =");
  const saveAt = body.indexOf("saveClassCodeExpiry(");

  assert.ok(guardAt > -1, "changeExpiry must guard on a finite day count");
  assert.ok(guardAt < expiresAt, "the guard must run before expiresAt is derived");
  assert.ok(guardAt < saveAt, "the guard must run before the expiry is saved");
  assert.doesNotMatch(body, /Number\(days\) > 0/);
});

test("making a new class code is confirmed in the app, naming the consequence", () => {
  assert.doesNotMatch(settings, /window\.confirm|window\.alert|window\.prompt/);
  assert.doesNotMatch(adminDialogs, /window\.confirm|window\.alert|window\.prompt/);

  assert.match(settings, /import \{ ConfirmActionDialog \} from "\.\/TeacherAdminDialogs\.jsx";/);
  assert.match(settings, /<ConfirmActionDialog/);
  assert.match(settings, /title="Make a new class code\?"/);
  assert.match(settings, /stops working straight away/);
  assert.match(settings, /every child in the class needs the new code/);
  assert.match(settings, /confirmLabel="Make a new code"/);
  assert.match(settings, /onConfirm=\{regenerateCode\}/);
});

test("only the status line and the access summary announce themselves", () => {
  assert.doesNotMatch(settings, /className="teacher-settings-panel" aria-live/);
  assert.equal(settings.match(/aria-live="polite"/g)?.length, 1);
  assert.match(settings, /className="teacher-inline-status" role="status"/);
});
