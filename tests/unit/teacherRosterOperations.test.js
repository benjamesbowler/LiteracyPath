import assert from "node:assert/strict";
import test from "node:test";

import {
  ROSTER_DELETION_REQUESTER_ROLE,
  ROSTER_DELETION_VERIFICATION_METHOD,
  deleteRosterStudent,
  describeRosterOperationError,
  findDuplicateRosterName,
  insertRosterStudents,
  normalizeRosterStudentName,
  reviewRosterImportNames,
  setRosterStudentArchived,
  transferRosterStudent,
  updateRosterStudentName
} from "../../src/data/teacherRosterOperations.js";
import {
  LEARNER_LOCAL_CLEANUP_PROOF_STORES
} from "../../src/data/learnerDataRights.js";

function verifiedCleanupResults() {
  return {
    progressCleanup: {
      storageAvailable: true,
      residualCount: 0,
      residuals: []
    },
    evidenceCleanup: {
      storageAvailable: true,
      residualCount: 0,
      storesChecked: LEARNER_LOCAL_CLEANUP_PROOF_STORES
        .filter(store => store !== "progress")
    }
  };
}

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

test("roster import review normalises names and distinguishes archived students", () => {
  const result = reviewRosterImportNames([
    "  AARON ",
    "Bella   Rose",
    "  Chen   Li ",
    "chen li",
    "x".repeat(81)
  ], {
    activeRows: [{ id: "student-1", name: "Aaron" }],
    archivedRows: [{ id: "student-2", name: " Bella Rose " }]
  });

  assert.deepEqual(result.accepted, ["Chen Li"]);
  assert.deepEqual(result.skipped.map(row => row.reason), [
    "Already in this class",
    "Already archived — restore this student instead",
    "Repeated in this import",
    "Display names must be 80 characters or fewer"
  ]);
  assert.equal(result.total, 5);
});

test("roster import validates the complete batch before writing", async () => {
  let writes = 0;
  const client = {
    table() {
      writes += 1;
      return {};
    }
  };

  const missingClass = await insertRosterStudents({
    supabase: client,
    names: ["Aarav"],
    classId: "",
    teacherId: "teacher-1"
  });
  const repeated = await insertRosterStudents({
    supabase: client,
    names: ["Aarav", "  AARAV "],
    classId: "class-1",
    teacherId: "teacher-1"
  });
  const tooMany = await insertRosterStudents({
    supabase: client,
    names: Array.from({ length: 41 }, (_, index) => `Student ${index}`),
    classId: "class-1",
    teacherId: "teacher-1"
  });

  assert.equal(missingClass.error.code, "LP_INVALID_ROSTER_IMPORT");
  assert.equal(repeated.error.code, "LP_INVALID_ROSTER_IMPORT");
  assert.equal(tooMany.error.code, "LP_INVALID_ROSTER_IMPORT");
  assert.equal(writes, 0);
});

test("student transfer uses the owned RPC and proves that a row changed", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push({ name, payload });
      return {
        data: [{ id: "student-1", class_id: "class-2" }],
        error: null
      };
    }
  };

  const result = await transferRosterStudent({
    supabase: client,
    studentId: "student-1",
    sourceClassId: "class-1",
    targetClassId: "class-2"
  });

  assert.equal(result.error, null);
  assert.deepEqual(calls, [{
    name: "teacher_transfer_student",
    payload: {
      p_student_id: "student-1",
      p_source_class_id: "class-1",
      p_target_class_id: "class-2"
    }
  }]);
});

test("student transfer rejects invalid targets and zero-row responses", async () => {
  let calls = 0;
  const client = {
    async call() {
      calls += 1;
      return { data: [], error: null };
    }
  };

  const sameClass = await transferRosterStudent({
    supabase: client,
    studentId: "student-1",
    sourceClassId: "class-1",
    targetClassId: "class-1"
  });
  assert.equal(sameClass.error.code, "LP_INVALID_TRANSFER_TARGET");
  assert.equal(calls, 0);

  const noRows = await transferRosterStudent({
    supabase: client,
    studentId: "student-1",
    sourceClassId: "class-1",
    targetClassId: "class-2"
  });
  assert.equal(noRows.error.code, "LP_ROSTER_NO_ROWS");
  assert.equal(calls, 1);
  assert.match(
    describeRosterOperationError(
      { code: "22023" },
      { operation: "transfer", studentName: "Aarav" }
    ),
    /Choose a different class from this account/
  );
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

test("archive fails closed during a frontend-first rolling release", async () => {
  let tableCalls = 0;
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
      tableCalls += 1;
      throw new Error("A missing archive RPC must never fall back to a direct table update.");
    }
  };

  const result = await setRosterStudentArchived({
    supabase: client,
    studentId: "student-1",
    classId: "class-1",
    archived: false
  });

  assert.equal(result.data, null);
  assert.equal(result.error.code, "LP_ARCHIVE_UNSUPPORTED");
  assert.equal(tableCalls, 0);
  assert.match(result.error.message, /No roster row or learner session was changed/);
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

test("a database without the archive RPC fails before attempting a legacy column write", async () => {
  let tableCalls = 0;
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
      tableCalls += 1;
      throw new Error("The unsafe rolling-release fallback must stay removed.");
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
  assert.equal(tableCalls, 0);
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
  assert.match(missingRpc, /missing a pending update/);
  // The operation is named, so the same branch reads correctly for a delete.
  assert.match(missingRpc, /so the archive could not run/);
  // Raw PostgREST text never reaches the teacher.
  assert.doesNotMatch(missingRpc, /public\.|schema cache|function/i);

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

test("an unrecognised failure stays diagnosable without quoting the database at the teacher", () => {
  const message = describeRosterOperationError(
    { code: "XX000", message: "deadlock detected" },
    { operation: "delete", studentName: "Aaron" }
  );
  // Diagnosable: the code survives as a reference the teacher can quote.
  assert.match(message, /reference XX000/);
  // Readable: none of the database's own wording appears.
  assert.doesNotMatch(message, /deadlock/);
  assert.match(message, /^We could not delete Aaron\. Nothing was changed\./);

  // With no code at all there is nothing to quote, and the sentence still works.
  const codeless = describeRosterOperationError(
    { message: "deadlock detected" },
    { operation: "delete", studentName: "Aaron" }
  );
  assert.doesNotMatch(codeless, /reference|deadlock/);
  assert.match(codeless, /tell whoever manages the site\.$/);
});

test("a missing-function failure keeps its code when it travels through the data-rights layer", async () => {
  // The regression this locks: unwrapRpc used to throw a bare Error, dropping
  // error.code, so PGRST202 never reached describeRosterOperationError and the
  // teacher was shown raw schema-cache text instead of the plain sentence.
  const client = {
    call: async () => ({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.teacher_prepare_learner_deletion(p_requester_role, p_student_id, p_verification_method) in the schema cache"
      }
    })
  };
  const error = await deleteRosterStudent({
    supabase: client,
    studentId: "s-1",
    cleanup: async () => {}
  })
    .then(() => null, caught => caught);
  assert.equal(error?.code, "PGRST202");
  const message = describeRosterOperationError(error, {
    operation: "delete",
    studentName: "Aaron"
  });
  assert.match(message, /missing a pending update/);
  assert.doesNotMatch(message, /schema cache/);
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
      if (name === "teacher_delete_learner_data_staged") {
        return {
          data: {
            requestId: "request-1",
            status: "awaiting_local_cleanup",
            subjectRef,
            residualManagedRecords: 0
          },
          error: null
        };
      }
      return {
        data: {
          requestId: "request-1",
          status: "completed",
          subjectRef,
          residualManagedRecords: 0
        },
        error: null
      };
    },
    table() {
      throw new Error("Roster deletion must not write to the students table directly.");
    }
  };

  let cleanupCount = 0;
  const result = await deleteRosterStudent({
    supabase: client,
    studentId: "student-1",
    cleanup: async () => {
      cleanupCount += 1;
      return verifiedCleanupResults();
    }
  });

  assert.equal(result.status, "completed");
  assert.equal(cleanupCount, 1);
  assert.deepEqual(calls.map(call => call.name), [
    "teacher_prepare_learner_deletion",
    "teacher_delete_learner_data_staged",
    "teacher_complete_learner_deletion"
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
  assert.equal(calls[2].payload.p_request_id, "request-1");
  assert.equal(calls[2].payload.p_subject_ref, subjectRef);
  assert.equal(calls[2].payload.p_cleanup_proof.studentId, "student-1");
  assert.deepEqual(
    calls[2].payload.p_cleanup_proof.storesChecked,
    LEARNER_LOCAL_CLEANUP_PROOF_STORES
  );
});

test("roster deletion stays open when cleanup does not return verified store evidence", async () => {
  const subjectRef = "c".repeat(64);
  const client = {
    async call(name) {
      if (name === "teacher_prepare_learner_deletion") {
        return {
          data: {
            requestId: "request-2",
            subjectRef,
            status: "in_progress",
            dueAt: "2026-08-26T00:00:00.000Z",
            confirmationPhrase: "DELETE LEARNER DATA"
          },
          error: null
        };
      }
      return {
        data: {
          requestId: "request-2",
          status: "awaiting_local_cleanup",
          subjectRef,
          residualManagedRecords: 0
        },
        error: null
      };
    }
  };

  await assert.rejects(
    deleteRosterStudent({
      supabase: client,
      studentId: "student-2",
      cleanup: async () => undefined
    }),
    error => error?.code === "LP_LOCAL_CLEANUP_INCOMPLETE"
  );
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
    () => deleteRosterStudent({
      supabase: client,
      studentId: "student-1",
      cleanup: async () => {}
    }),
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
    () => deleteRosterStudent({
      supabase: client,
      studentId: "student-1",
      cleanup: async () => {}
    }),
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
