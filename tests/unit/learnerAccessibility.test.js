import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  DEFAULT_LEARNER_ACCESSIBILITY,
  LEARNER_ACCESSIBILITY_FIELDS,
  LOWER_AUDIO_INTENSITY_SCALE,
  applyLearnerAudioIntensity,
  buildLearnerAccessibilityProfilePatch,
  learnerAccessibilityDataAttributes,
  normalizeLearnerAccessibilitySettings
} from "../../src/accessibility/learnerAccessibility.js";
import { saveStudentAccessibilitySettings } from "../../src/data/studentRailSettings.js";
import { sanitizeCloudProgressPayload } from "../../src/utils/progressMerge.js";

test("learner accessibility has exactly five fail-closed settings", () => {
  assert.deepEqual(
    LEARNER_ACCESSIBILITY_FIELDS.map(field => field.id),
    [
      "reducedEffects",
      "extendedResponse",
      "lowerAudioIntensity",
      "narration",
      "simplifiedBackgrounds"
    ]
  );
  assert.deepEqual(normalizeLearnerAccessibilitySettings(), DEFAULT_LEARNER_ACCESSIBILITY);
  assert.deepEqual(normalizeLearnerAccessibilitySettings({
    reducedEffects: true,
    extendedResponse: 1,
    lowerAudioIntensity: "true",
    narration: true,
    simplifiedBackgrounds: true,
    unknown: true
  }), {
    reducedEffects: true,
    extendedResponse: false,
    lowerAudioIntensity: false,
    narration: true,
    simplifiedBackgrounds: true
  });
});

test("teacher accessibility patch is complete, attributed, and stored on the profile row", async () => {
  const writes = [];
  const settings = Object.fromEntries(
    LEARNER_ACCESSIBILITY_FIELDS.map(field => [field.id, true])
  );
  const now = () => "2026-07-24T17:30:00.000Z";
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
  const result = await saveStudentAccessibilitySettings({
    supabase,
    studentId: "student-1",
    settings,
    teacherId: "teacher-1",
    now
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, buildLearnerAccessibilityProfilePatch(settings, {
    teacherId: "teacher-1",
    now
  }));
  assert.deepEqual(writes[0], {
    row: {
      student_id: "student-1",
      area: "profile",
      key: "__all__",
      payload: result.payload,
      updated_at: "2026-07-24T17:30:00.000Z"
    },
    options: { onConflict: "student_id,area,key" }
  });
});

test("child profile uploads cannot overwrite teacher accessibility fields", () => {
  assert.deepEqual(sanitizeCloudProgressPayload("profile", {
    companionId: "fluff",
    accessibilitySettings: { extendedResponse: false },
    accessibilitySettingsAt: "stale",
    accessibilitySettingsBy: "child"
  }), { companionId: "fluff" });

  const migration = fs.readFileSync(
    new URL("../../supabase/migrations/20260724173000_teacher_learner_accessibility_settings.sql", import.meta.url),
    "utf8"
  );
  for (const key of [
    "accessibilitySettings",
    "accessibilitySettingsAt",
    "accessibilitySettingsBy"
  ]) {
    assert.match(migration, new RegExp(`old\\.payload -> '${key}'`));
  }
  assert.match(migration, /s\.teacher_id = auth\.uid\(\)/);
});

test("learner effects expose stable DOM attributes and lower real audio volume", () => {
  const settings = {
    reducedEffects: true,
    extendedResponse: true,
    lowerAudioIntensity: true,
    narration: true,
    simplifiedBackgrounds: true
  };
  assert.deepEqual(learnerAccessibilityDataAttributes(settings), {
    "data-lp-reduced-effects": "true",
    "data-lp-extended-response": "true",
    "data-lp-lower-audio-intensity": "true",
    "data-lp-narration": "true",
    "data-lp-simplified-backgrounds": "true"
  });
  const documentRef = {
    documentElement: {
      getAttribute(name) {
        return name === "data-lp-lower-audio-intensity" ? "true" : null;
      }
    }
  };
  assert.equal(applyLearnerAudioIntensity(1, documentRef), LOWER_AUDIO_INTENSITY_SCALE);
  assert.equal(applyLearnerAudioIntensity(3, documentRef), LOWER_AUDIO_INTENSITY_SCALE);
});

test("extended response removes Trail Run's clock and timeout language", () => {
  const source = fs.readFileSync(
    new URL("../../src/components/quest/world/Encounters.jsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /if \(extendedResponse \|\| done \|\| teaching \|\| picked\) return undefined/);
  assert.match(source, /!extendedResponse && !done && !teaching/);
  assert.match(source, /No countdown — answer when you are ready/);
  assert.match(source, /Take your time — choose the fork that says it/);
});
