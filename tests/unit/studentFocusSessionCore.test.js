import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_FOCUS_CONTENT_VERSION,
  STUDENT_FOCUS_END_ACTIONS,
  endStudentFocusSession,
  getStudentFocusSession,
  saveStudentFocusAssessmentAnswer,
  saveStudentFocusCyclePracticeAttempt,
  startStudentFocusSession
} from "../../src/data/studentFocusSessionCore.js";
import { STUDENT_FOCUS_TARGET_OPTIONS } from "../../src/policy/studentFocusTargets.js";
import { APP_RELEASE_ID } from "../../src/utils/errorLog.js";

function recordingClient(response = { ok: true }) {
  const calls = [];
  return {
    calls,
    call(name, args) {
      calls.push({ name, args });
      return Promise.resolve({ data: response, error: null });
    }
  };
}

test("every whole-class activity uses a stable protocol across ordinary app deployments", async () => {
  const sentVersions = [];

  for (const option of STUDENT_FOCUS_TARGET_OPTIONS) {
    const client = recordingClient({ ok: true, session: { id: `focus-${option.id}` } });
    await startStudentFocusSession({
      client,
      classId: "class-1",
      target: option.id,
      wholeClass: true
    });
    sentVersions.push(client.calls[0].args.p_content_version);
  }

  assert.equal(sentVersions.length, STUDENT_FOCUS_TARGET_OPTIONS.length);
  assert.deepEqual([...new Set(sentVersions)], [STUDENT_FOCUS_CONTENT_VERSION]);
  assert.match(STUDENT_FOCUS_CONTENT_VERSION, /^student-focus-v[1-9]\d*$/);
  assert.notEqual(STUDENT_FOCUS_CONTENT_VERSION, APP_RELEASE_ID);
});

test("teacher start sends the exact class, target, membership and expiry payload", async () => {
  const client = recordingClient({ ok: true, session: { id: "focus-1" } });
  await startStudentFocusSession({
    client,
    classId: "class-1",
    target: "letters_practice",
    studentIds: ["student-1", "student-2"],
    durationMinutes: 30,
    contentVersion: "release-1"
  });
  assert.deepEqual(client.calls, [{
    name: "teacher_start_student_focus_session",
    args: {
      p_class_id: "class-1",
      p_target: "letters_practice",
      p_student_ids: ["student-1", "student-2"],
      p_assignments: {},
      p_duration_minutes: 30,
      p_content_version: "release-1",
      p_whole_class: false
    }
  }]);
});

test("teacher whole-class exact target sends an empty roster and one shared assignment", async () => {
  const client = recordingClient({ ok: true, session: { id: "focus-2" } });
  await startStudentFocusSession({
    client,
    classId: "class-1",
    target: "assigned_book",
    studentIds: [],
    assignments: {
      "*": {
        book_id: "gr-a-01",
        book_title: "A Book for Everyone"
      }
    },
    wholeClass: true,
    contentVersion: "release-2"
  });
  assert.deepEqual(client.calls, [{
    name: "teacher_start_student_focus_session",
    args: {
      p_class_id: "class-1",
      p_target: "assigned_book",
      p_student_ids: [],
      p_assignments: {
        "*": {
          book_id: "gr-a-01",
          book_title: "A Book for Everyone"
        }
      },
      p_duration_minutes: 90,
      p_content_version: "release-2",
      p_whole_class: true
    }
  }]);
});

test("Cycle Practice uses its dedicated start and completion RPCs", async () => {
  const client = recordingClient({ ok: true });
  await startStudentFocusSession({
    client,
    classId: "class-1",
    target: "cycle_practice",
    assignments: { "*": { cycle_id: "cycle-4", cycle_number: 4, cycle_title: "Short vowels" } },
    wholeClass: true,
    durationMinutes: 60
  });
  await saveStudentFocusCyclePracticeAttempt({
    client,
    token: "opaque-token",
    sessionId: "focus-cycle-1",
    attempt: { assessmentType: "cycle_practice_check", cycleId: "cycle-4" }
  });
  assert.deepEqual(client.calls, [
    {
      name: "teacher_start_cycle_practice_session",
      args: {
        p_class_id: "class-1",
        p_student_ids: [],
        p_assignments: { "*": { cycle_id: "cycle-4", cycle_number: 4, cycle_title: "Short vowels" } },
        p_duration_minutes: 60,
        p_content_version: STUDENT_FOCUS_CONTENT_VERSION,
        p_whole_class: true
      }
    },
    {
      name: "student_complete_focus_cycle_practice",
      args: {
        p_token: "opaque-token",
        p_session_id: "focus-cycle-1",
        p_attempt: { assessmentType: "cycle_practice_check", cycleId: "cycle-4" }
      }
    }
  ]);
});

test("student polling and evidence writes use the opaque student token boundary", async () => {
  const client = recordingClient();
  await getStudentFocusSession({
    client,
    token: "opaque-token",
    currentView: "assessment",
    contentOk: false
  });
  await saveStudentFocusAssessmentAnswer({
    client,
    token: "opaque-token",
    sessionId: "focus-1",
    answer: { answer_event_id: "answer-1" }
  });
  assert.deepEqual(client.calls, [
    {
      name: "student_get_focus_session",
      args: {
        p_token: "opaque-token",
        p_current_view: "assessment",
        p_content_ok: false
      }
    },
    {
      name: "student_save_focus_assessment_answer",
      args: {
        p_token: "opaque-token",
        p_session_id: "focus-1",
        p_answer: { answer_event_id: "answer-1" }
      }
    }
  ]);
});

test("focus operations fail before a network call when no service client exists", async () => {
  await assert.rejects(
    endStudentFocusSession({ client: null, sessionId: "focus-1" }),
    /unavailable while the service is offline/i
  );
});

test("teacher can end a session and send assigned iPads to student selection", async () => {
  const client = recordingClient({ ok: true });
  await endStudentFocusSession({
    client,
    sessionId: "focus-1",
    endAction: STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER
  });
  assert.deepEqual(client.calls, [{
    name: "teacher_end_student_focus_session",
    args: {
      p_session_id: "focus-1",
      p_end_action: "student_picker"
    }
  }]);
});

test("ordinary session end returns assigned iPads to Student Home", async () => {
  const client = recordingClient({ ok: true });
  await endStudentFocusSession({ client, sessionId: "focus-2" });
  assert.deepEqual(client.calls, [{
    name: "teacher_end_student_focus_session",
    args: {
      p_session_id: "focus-2",
      p_end_action: "return_home"
    }
  }]);
});
