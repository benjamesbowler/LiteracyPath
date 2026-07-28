import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canonicalTeacherSettingsRoutePath,
  readTeacherSettingsSection,
  teacherSettingsHash
} from "../../src/appState/teacherSettingsRoutes.js";

const SETTINGS_SECTIONS = ["school", "site", "privacy", "account"];

test("Settings subsection helpers round-trip every supported page and class", () => {
  for (const section of SETTINGS_SECTIONS) {
    const hash = teacherSettingsHash(section, "class with spaces");
    assert.equal(
      hash,
      `#teacher/settings/${section}?class=class+with+spaces`
    );
    assert.equal(readTeacherSettingsSection(hash), section);
    assert.equal(
      canonicalTeacherSettingsRoutePath(hash),
      "teacher/settings"
    );
  }
});

test("Settings subsection helpers reject unknown or nested pages safely", () => {
  for (const hash of [
    "#teacher/settings/unknown?class=class-a",
    "#teacher/settings/privacy/extra?class=class-a"
  ]) {
    assert.equal(readTeacherSettingsSection(hash), "school");
    assert.notEqual(
      canonicalTeacherSettingsRoutePath(hash),
      "teacher/settings"
    );
  }

  assert.equal(teacherSettingsHash("unknown", "class-a"), "#teacher/settings/school?class=class-a");
  assert.equal(canonicalTeacherSettingsRoutePath("#teacher/settings?class=class-a"), "teacher/settings");
});
