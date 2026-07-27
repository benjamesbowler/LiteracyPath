import assert from "node:assert/strict";
import test from "node:test";

import {
  ROSTER_DELETION_REQUESTER_ROLE,
  ROSTER_DELETION_VERIFICATION_METHOD,
  deleteRosterStudent,
  describeRosterOperationError,
  findDuplicateRosterName,
  normalizeRosterStudentName,
  setRosterStudentArchived,
  updateRosterStudentName
} from "../../src/data/teacherRosterOperations.js";

function updateQuery(result, calls) {
  const call = { filters: [] };
  calls.push(call);
  const query = {
    eq(field, value) {
      call.filters.push([field, value]);
      return query;
    },
    select(fields) {
      call.fields = fields;
      return Promise.resolve(result);
    }
  };
  return query;
}

test("student names are normalised and updated only inside the selected class", async () => {
  const calls = [];
  const client = {
    table(name) {
      assert.equal(name, "students");
      return {
        update(values) {
          calls.push({ values });
          return updateQuery({
            data: [{ id: "student-1", name: "Aaron Lee", class_id: "class-1" }],
            error: null
          }, calls);
        }
      };
    }
  };

  const result = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: "  Aaron   Lee  "
  });

  assert.equal(normalizeRosterStudentName("  Aaron   Lee  "), "Aaron Lee");
  assert.equal(result.error, null);
  assert.deepEqual(calls[0].values, { name: "Aaron Lee" });
  assert.deepEqual(calls[1].filters, [
    ["id", "student-1"],
    ["class_id", "class-1"]
  ]);
});

test("blank and overlong child names are rejected before a write", async () => {
  let writes = 0;
  const client = {
    table() {
      writes += 1;
      return {};
    }
  };

  const blank = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: " "
  });
  const long = await updateRosterStudentName({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    name: "a".repeat(81)
  });

  assert.equal(blank.error.code, "LP_INVALID_STUDENT_NAME");
  assert.equal(long.error.code, "LP_INVALID_STUDENT_NAME");
  assert.equal(writes, 0);
});

test("archive uses the owned RPC and does not fall through after real errors", async () => {
  let tableCalls = 0;
  const denied = { code: "42501", message: "You do not have permission." };
  const client = {
    async call(name, payload) {
      assert.equal(name, "teacher_set_student_archived");
      assert.deepEqual(payload, {
        p_student_id: "student-1",
        p_class_id: "class-1",
        p_archived: true
      });
      return { data: null, error: denied };
    },
    table() {
      tableCalls += 1;
      return {};
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: true
  });

  assert.equal(result.error, denied);
  assert.equal(tableCalls, 0);
});

test("archive falls back during a frontend-first rolling release", async () => {
  const calls = [];
  const client = {
    async call() {
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.teacher_set_student_archived"
        }
      };
    },
    table(name) {
      assert.equal(name, "students");
      return {
        update(values) {
          calls.push({ values });
          return updateQuery({
            data: [{ id: "student-1" }],
            error: null
          }, calls);
        }
      };
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: false
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls[0].values, { archived_at: null });
});

test("a successful call that changed nothing is reported as a failure, not a silent success", async () => {
  const client = {
    async call() {
      return { data: [], error: null };
    },
    table() {
      throw new Error("The direct table retry must not run after a working RPC.");
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: true
  });

  assert.equal(result.error.code, "LP_ROSTER_NO_ROWS");
  assert.match(
    describeRosterOperationError(result.error, { operation: "archive", studentName: "Aaron" }),
    /Aaron was not found in this class, so nothing was changed/
  );
});

test("a database without the archive column fails loudly instead of reporting success", async () => {
  const client = {
    async call() {
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.teacher_set_student_archived"
        }
      };
    },
    table() {
      return {
        update() {
          return updateQuery({
            data: null,
            error: {
              code: "42703",
              message: "column students.archived_at does not exist"
            }
          }, []);
        }
      };
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: true
  });

  assert.equal(result.data, null);
  assert.equal(result.error.code, "LP_ARCHIVE_UNSUPPORTED");
  assert.match(
    describeRosterOperationError(result.error, { operation: "archive", studentName: "Aaron" }),
    /has not been updated to store archived students yet/
  );
});

test("each realistic cause of a failed archive gets its own actionable sentence", () => {
  const options = { operation: "archive", studentName: "Aaron" };

  const unconfigured = describeRosterOperationError({
    message: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend environment."
  }, options);
  assert.match(unconfigured, /not connected to its database/);
  assert.match(unconfigured, /nothing you change here is being saved/);
  // The teacher-facing sentence must not leak the deploy variable names.
  assert.doesNotMatch(unconfigured, /VITE_SUPABASE/);

  const missingRpc = describeRosterOperationError({
    code: "PGRST202",
    message: "Could not find the function public.teacher_set_student_archived"
  }, options);
  assert.match(missingRpc, /missing the update that added archiving and restoring/);

  const missingColumn = describeRosterOperationError({
    code: "42703",
    message: "column students.archived_at does not exist"
  }, options);
  assert.match(missingColumn, /has not been updated to store archived students yet/);

  const denied = describeRosterOperationError({
    code: "42501",
    message: "You do not have permission to change this child."
  }, options);
  assert.match(denied, /does not have permission to change Aaron/);

  const offline = describeRosterOperationError(new TypeError("Failed to fetch"), options);
  assert.match(offline, /could not reach the server/);

  // Every message names the operation and the student, and every one of these
  // causes produces a different sentence.
  const messages = [unconfigured, missingRpc, missingColumn, denied, offline];
  messages.forEach(message => assert.match(message, /^We could not archive Aaron\./));
  assert.equal(new Set(messages).size, messages.length);
});

test("an unrecognised failure still shows the teacher what the database said", () => {
  const message = describeRosterOperationError(
    { code: "XX000", message: "deadlock detected" },
    { operation: "delete", studentName: "Aaron" }
  );
  assert.equal(
    message,
    "We could not delete Aaron. Nothing was changed. The database said: deadlock detected"
  );
});

test("roster deletion reuses the verified data-rights deletion rather than a second delete path", async () => {
  const calls = [];
  const subjectRef = "a".repeat(64);
  const client = {
    async call(name, payload) {
      calls.push({ name, payload });
      if (name === "teacher_prepare_learner_deletion") {
        return {
          data: {
            requestId: "request-1",
            subjectRef,
            status: "in_progress",
            dueAt: "2026-08-26T00:00:00.000Z",
            responseTargetDays: 30,
            confirmationPhrase: "DELETE LEARNER DATA"
          },
          error: null
        };
      }
      return {
        data: { status: "completed", subjectRef, residualManagedRecords: 0 },
        error: null
      };
    },
    table() {
      throw new Error("Roster deletion must not write to the students table directly.");
    }
  };

  const result = await deleteRosterStudent({ supabase: client, studentId: "student-1" });

  assert.equal(result.status, "completed");
  assert.deepEqual(calls.map(call => call.name), [
    "teacher_prepare_learner_deletion",
    "teacher_delete_learner_data"
  ]);
  assert.deepEqual(calls[0].payload, {
    p_student_id: "student-1",
    p_requester_role: ROSTER_DELETION_REQUESTER_ROLE,
    p_verification_method: ROSTER_DELETION_VERIFICATION_METHOD
  });
  assert.deepEqual(calls[1].payload, {
    p_request_id: "request-1",
    p_student_id: "student-1",
    p_subject_ref: subjectRef,
    p_confirmation: "DELETE LEARNER DATA"
  });
});

test("a refused deletion throws and becomes a plain sentence instead of a silent no-op", async () => {
  const client = {
    async call() {
      return {
        data: null,
        error: { message: "You do not have permission to change this child." }
      };
    }
  };

  await assert.rejects(
    () => deleteRosterStudent({ supabase: client, studentId: "student-1" }),
    error => {
      assert.match(
        describeRosterOperationError(error, { operation: "delete", studentName: "Aaron" }),
        /^We could not delete Aaron\. This account does not have permission/
      );
      return true;
    }
  );
});

test("a deletion the database cannot prove is complete is never reported as done", async () => {
  const subjectRef = "b".repeat(64);
  const client = {
    async call(name) {
      if (name === "teacher_prepare_learner_deletion") {
        return {
          data: {
            requestId: "request-1",
            subjectRef,
            status: "in_progress",
            dueAt: "2026-08-26T00:00:00.000Z",
            confirmationPhrase: "DELETE LEARNER DATA"
          },
          error: null
        };
      }
      return {
        data: { status: "completed", subjectRef, residualManagedRecords: 3 },
        error: null
      };
    }
  };

  await assert.rejects(
    () => deleteRosterStudent({ supabase: client, studentId: "student-1" }),
    /did not prove that managed records were removed/
  );
});

test("a repeated display name is detected across active and archived students", () => {
  const rows = [
    { id: "student-1", name: "Aaron" },
    { id: "student-2", name: "  bella   rose " }
  ];

  assert.equal(findDuplicateRosterName("aaron", rows)?.id, "student-1");
  assert.equal(findDuplicateRosterName("  AARON  ", rows)?.id, "student-1");
  assert.equal(findDuplicateRosterName("Bella Rose", rows)?.id, "student-2");
  assert.equal(findDuplicateRosterName("Aaronson", rows), null);
  assert.equal(findDuplicateRosterName("   ", rows), null);
});
