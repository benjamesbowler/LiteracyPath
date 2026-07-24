import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  REDUCED_CHOICE_RAIL_IDS,
  STUDENT_RAIL_DESTINATIONS,
  selectStudentRailItems,
  speakStudentRailLabel
} from "../../src/policy/studentRailPolicy.js";
import {
  buildReducedChoiceProfilePatch,
  saveStudentReducedChoiceMode
} from "../../src/data/studentRailSettings.js";
import {
  computeHydratedValue,
  sanitizeCloudProgressPayload
} from "../../src/utils/progressMerge.js";

const profileAuthorityMigration = readFileSync(
  "supabase/migrations/20260724133000_teacher_reduced_choice_mode.sql",
  "utf8"
);

test("student rail destinations have stable unique ids, labels, and icons", () => {
  assert.equal(STUDENT_RAIL_DESTINATIONS.length, 7);
  for (const field of ["id", "label", "icon"]) {
    const values = STUDENT_RAIL_DESTINATIONS.map(item => item[field]);
    assert.equal(new Set(values).size, 7, `${field} values drifted or duplicated`);
    assert.equal(values.every(Boolean), true);
  }
});

test("reduced-choice mode keeps the three reading foundations plus the active place", () => {
  const nav = STUDENT_RAIL_DESTINATIONS.map(item => ({ ...item, go() {} }));
  assert.deepEqual(
    selectStudentRailItems(nav, { reducedChoiceMode: true }).map(item => item.id),
    REDUCED_CHOICE_RAIL_IDS
  );
  assert.deepEqual(
    selectStudentRailItems(nav, { active: "stories", reducedChoiceMode: true })
      .map(item => item.id),
    [...REDUCED_CHOICE_RAIL_IDS, "stories"]
  );
  assert.equal(selectStudentRailItems(nav).length, 7);
});

test("tap-to-hear uses one child-paced utterance with the exact destination label", () => {
  const spoken = [];
  let cancelled = 0;
  class MockUtterance {
    constructor(text) {
      this.text = text;
    }
  }
  const browser = {
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      cancel() {
        cancelled += 1;
      },
      speak(utterance) {
        spoken.push(utterance);
      }
    }
  };

  assert.equal(speakStudentRailLabel("Adventure Map", browser), true);
  assert.equal(cancelled, 1);
  assert.equal(spoken[0].text, "Adventure Map");
  assert.equal(spoken[0].lang, "en-GB");
  assert.equal(spoken[0].rate, 0.88);
  assert.equal(speakStudentRailLabel("", browser), false);
  assert.equal(speakStudentRailLabel("Books", {}), false);
});

test("teacher reduced-choice setting persists while child profile saves cannot overwrite it", async () => {
  const writes = [];
  const supabase = {
    from(table) {
      assert.equal(table, "student_progress");
      return {
        async upsert(row, options) {
          writes.push({ row, options });
          return { error: null };
        }
      };
    }
  };
  const now = () => "2026-07-24T13:15:00.000Z";
  const saved = await saveStudentReducedChoiceMode({
    supabase,
    studentId: "student-1",
    enabled: true,
    teacherId: "teacher-1",
    now
  });

  assert.equal(saved.ok, true);
  assert.deepEqual(saved.payload, buildReducedChoiceProfilePatch(true, {
    teacherId: "teacher-1",
    now
  }));
  assert.deepEqual(writes[0], {
    row: {
      student_id: "student-1",
      area: "profile",
      key: "__all__",
      payload: saved.payload,
      updated_at: "2026-07-24T13:15:00.000Z"
    },
    options: { onConflict: "student_id,area,key" }
  });

  const hydrated = computeHydratedValue(
    "profile",
    "__all__",
    { companionId: "fluff" },
    saved.payload
  );
  assert.equal(hydrated.reducedChoiceMode, true);
  assert.equal(hydrated.companionId, "fluff");
  assert.deepEqual(
    sanitizeCloudProgressPayload("profile", {
      companionId: "chips",
      reducedChoiceMode: false,
      reducedChoiceModeAt: "stale",
      reducedChoiceModeBy: "child"
    }),
    { companionId: "chips" }
  );
});

test("database merge preserves the rest of the profile and rejects child ownership of teacher fields", () => {
  assert.match(
    profileAuthorityMigration,
    /coalesce\(old\.payload,\s*'\{\}'::jsonb\)\s*\|\|\s*coalesce\(new\.payload,\s*'\{\}'::jsonb\)/,
    "a partial teacher setting write must retain the child's companion and collectibles"
  );
  assert.match(
    profileAuthorityMigration,
    /s\.teacher_id = auth\.uid\(\) or public\.is_app_admin\(auth\.uid\(\)\)/,
    "only the owning teacher or an app admin may control the profile setting"
  );
  for (const field of [
    "reducedChoiceMode",
    "reducedChoiceModeAt",
    "reducedChoiceModeBy"
  ]) {
    assert.match(
      profileAuthorityMigration,
      new RegExp(`- '${field}'[\\s\\S]*old\\.payload -> '${field}'`),
      `${field} must survive a stale child profile update`
    );
  }
});
